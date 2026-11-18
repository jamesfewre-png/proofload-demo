'use strict';
/* Proofload voice notes: the download manager, the recorder, the queue and the link to the on-device typer (js/voice-worker.js).
   Everything stays on this device. The only requests made are for this app's own files. */

const VOICE_CACHE = 'proofload-voice-v1';
const VOICE_MAX_SECS = 60;
const VOICE_MIMES = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/webm'];
const VOICE_ERR_FAILED = 'Could not type this one. Play it back and type the note.';
const VOICE_ERR_EMPTY = 'Nothing was heard. Play it back and type the note.';

const Voice = {
  pack: null,                 /* parsed voice-pack.json */
  state: 'unknown',           /* unknown | none | downloading | ready | failed */
  loaded: 0, total: 0, err: '',
  persisted: null,            /* null = not asked yet */
  threads: Number(new URLSearchParams(location.search).get('threads')) || undefined,   /* dev only: ?threads=N */
  stats: { ready: null, notes: {}, promptTokens: null },
  rec: null,                  /* the recording in progress */
  play: null,                 /* the recording being played */
  worker: null, pending: new Map(), running: false, idleWaiters: [], abort: null, _starting: false,

  /* ---------- download manager ---------- */
  url: path => new URL(path, document.baseURI).href,
  async loadPack() {
    if (this.pack) return this.pack;
    const r = await fetch('voice-pack.json');
    if (!r.ok) throw new Error('voice-pack.json ' + r.status);
    this.pack = await r.json(); this.total = this.pack.totalBytes || this.pack.files.reduce((n, f) => n + f.bytes, 0);
    return this.pack;
  },
  async cacheComplete() {
    if (!window.caches || !this.pack) return false;
    const c = await caches.open(VOICE_CACHE), have = new Set((await c.keys()).map(r => r.url));
    return this.pack.files.every(f => have.has(this.url(f.path)));
  },
  async init() {
    try { await this.loadPack(); } catch (e) { this.state = 'none'; this.err = ''; this.changed(); return; }
    try { this.state = (await this.cacheComplete()) ? 'ready' : 'none'; } catch (e) { this.state = 'none'; }
    await this.readPersisted();
    this.changed();
    this.kick();
  },
  async readPersisted() { try { if (navigator.storage && navigator.storage.persisted) this.persisted = await navigator.storage.persisted(); } catch (e) {} },
  async download() {
    if (this.state === 'downloading') return;
    if (!window.caches || !window.crypto || !crypto.subtle) { this.state = 'failed'; this.err = 'This browser cannot keep large files. Open the app over https.'; this.changed(); return; }
    this.state = 'downloading'; this.err = ''; this.loaded = 0; this.changed();
    try { if (navigator.storage && navigator.storage.persist) this.persisted = await navigator.storage.persist(); } catch (e) {}
    const ac = this.abort = new AbortController();
    let lastPaint = 0;
    const paint = force => { const t = performance.now(); if (force || t - lastPaint > 150) { lastPaint = t; this.changed(); } };
    try {
      await this.loadPack();
      const cache = await caches.open(VOICE_CACHE);
      for (const f of this.pack.files) {
        const url = this.url(f.path), have = await cache.match(url);
        if (have) { const len = (await have.clone().arrayBuffer()).byteLength; if (len === f.bytes) { this.loaded += f.bytes; paint(true); continue; } await cache.delete(url); }
        const res = await fetch(url, { cache: 'no-store', signal: ac.signal });
        if (!res.ok) throw new Error(f.path + ' ' + res.status);
        const ct = res.headers.get('Content-Type') || 'application/octet-stream';
        const chunks = []; let got = 0;
        const rd = res.body.getReader();
        for (;;) {
          const { done, value } = await rd.read();
          if (done) break;
          chunks.push(value); got += value.length; this.loaded += value.length; paint();
        }
        if (got !== f.bytes) throw new Error(f.path + ' is the wrong size');
        const blob = new Blob(chunks, { type: ct });
        const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer()))].map(b => b.toString(16).padStart(2, '0')).join('');
        if (hash !== f.sha256) throw new Error(f.path + ' did not check out');
        await cache.put(url, new Response(blob, { status: 200, headers: { 'Content-Type': ct, 'Content-Length': String(got) } }));
      }
      this.state = 'ready'; this.abort = null; await this.readPersisted(); this.changed();
      this.kick();
    } catch (e) {
      this.abort = null;
      if (ac.signal.aborted) { this.state = 'none'; this.err = ''; }
      else { this.state = 'failed'; this.err = /Failed to fetch|NetworkError|Load failed/i.test(e.message) ? 'The connection dropped. Check you have signal and try again.' : (e.name === 'QuotaExceededError' ? 'There is not enough space on this device.' : String(e.message || e)); }
      this.changed();
    }
  },
  cancel() { if (this.abort) this.abort.abort(); },
  async remove() {
    this.cancel();
    this.killWorker();
    try { await caches.delete(VOICE_CACHE); } catch (e) {}
    this.state = 'none'; this.err = ''; this.loaded = 0; this.stats.ready = null; this.changed();
  },
  waiting() { let n = 0; S.inspections.forEach(i => (i.voice || []).forEach(x => { if (x.status === 'queued' || x.status === 'transcribing') n++; })); return n; },
  changed() {
    const el = document.getElementById('voiceCard');
    if (el) el.innerHTML = voiceCardInner();
    /* queued cards say different things before and after the download */
    if (this._shown !== this.state) { this._shown = this.state; $$('.vnote[data-status="queued"]').forEach(c => this.patchNote(c.dataset.id)); }
  },

  /* ---------- notes in the UI (targeted patches, never a full render) ---------- */
  patchNote(id) {
    const el = document.getElementById('note-' + id), f = findNote(id);
    if (!el || !f) return;
    const ta = el.querySelector('textarea'), had = ta && document.activeElement === ta, pos = had ? ta.selectionStart : 0;
    el.outerHTML = voiceNote(f.n);
    if (had) { const t2 = document.querySelector('#note-' + id + ' textarea'); if (t2) { t2.focus(); try { t2.setSelectionRange(pos, pos); } catch (e) {} } }
    this.noteSideEffects();
  },
  noteSideEffects() { if (typeof refreshGate === 'function') { refreshGate(); if (isWide() && UI.route.name === 'visit') renderList(); } },
  showError(inspId, text) { UI.voiceErr = text ? { inspId, text } : null; this.paintError(); },
  paintError() {
    const el = document.getElementById('voiceMsg'); if (!el) return;
    const e = UI.voiceErr && UI.voiceErr.inspId === UI.route.itemId ? UI.voiceErr : null;
    el.innerHTML = e ? `<div class="banner stop" role="alert">${ic('alert', 22)}<div>${esc(e.text)}</div></div>` : '';
  },
  paintMic() {
    const b = document.getElementById('micBtn'); if (!b) return;
    const on = this.rec && this.rec.inspId === UI.route.itemId;
    b.classList.toggle('rec', !!on); b.innerHTML = micInner(on ? this.rec.secs : null);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  },

  /* ---------- recorder ---------- */
  async toggleRec(inspId) {
    if (this.rec) { this.stopRec(); return; }
    if (this._starting || !inspId || !insp(inspId)) return;
    this.showError(inspId, '');
    if (!window.isSecureContext || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { this.showError(inspId, 'Voice notes need the app opened over https.'); return; }
    if (!window.MediaRecorder) { this.showError(inspId, 'This browser cannot record voice notes.'); return; }
    this._starting = true;
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, noiseSuppression: true, echoCancellation: false } }); }
    catch (e) {
      this._starting = false;
      const n = e && e.name;
      this.showError(inspId, n === 'NotAllowedError' || n === 'SecurityError' ? 'Proofload is not allowed to use the microphone. Allow it in this browser\'s site settings, then tap record again.'
        : n === 'NotFoundError' || n === 'OverconstrainedError' ? 'No microphone was found on this device.'
        : n === 'NotReadableError' ? 'The microphone is busy. Close any other app using it, then tap record again.'
        : 'The microphone could not be started. Try again.');
      return;
    }
    this._starting = false;
    if (UI.route.itemId !== inspId || !insp(inspId)) { stream.getTracks().forEach(t => t.stop()); return; }   /* they moved on while the permission box was open */
    let mr;
    try {
      const mime = VOICE_MIMES.find(m => MediaRecorder.isTypeSupported(m));
      mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    } catch (e) { stream.getTracks().forEach(t => t.stop()); this.showError(inspId, 'This browser cannot record voice notes.'); return; }
    const r = this.rec = { inspId, mr, stream, chunks: [], t0: performance.now(), secs: 0, mimeType: mr.mimeType || 'audio/webm', timer: 0 };
    mr.ondataavailable = e => { if (e.data && e.data.size) r.chunks.push(e.data); };
    mr.onstop = () => this.finishRec(r);
    mr.onerror = () => { this.showError(inspId, 'Recording stopped unexpectedly. What was recorded is saved.'); this.stopRec(); };
    mr.start();
    r.timer = setInterval(() => {
      r.secs = Math.floor((performance.now() - r.t0) / 1000);
      const l = document.getElementById('micLabel');
      if (l && UI.route.itemId === r.inspId) l.textContent = 'Recording ' + fmtSecs(r.secs) + ', tap to stop';
      if (r.secs >= VOICE_MAX_SECS) this.stopRec();
    }, 250);
    this.paintMic();
  },
  stopRec() { const r = this.rec; if (r && r.mr.state !== 'inactive') { try { r.mr.stop(); } catch (e) { this.finishRec(r); } } },
  async finishRec(r) {
    if (this.rec !== r) return;
    clearInterval(r.timer); r.stream.getTracks().forEach(t => t.stop());
    this.rec = null; this.paintMic();
    const secs = Math.max(0, (performance.now() - r.t0) / 1000), blob = new Blob(r.chunks, { type: r.mimeType });
    if (!blob.size) { if (UI.route.itemId === r.inspId) this.showError(r.inspId, 'Nothing was recorded. Tap record and try again.'); return; }
    await this.addNote(r.inspId, blob, r.mimeType, Math.round(secs * 10) / 10);
  },

  /* Used by the recorder and by the dev test. Saves the audio, adds the note as queued and starts the queue. */
  async addNote(inspId, blob, mime, secs) {
    const i = insp(inspId); if (!i) return null;
    const n = { id: 'n' + uid(), audioId: 'au' + uid(), mime: mime || blob.type || 'audio/webm', secs: Math.round((secs || 0) * 10) / 10, at: new Date().toISOString(), status: 'queued', text: '', err: '', typed: false, checkedAt: '' };
    await DB.put('audio', n.audioId, { mime: n.mime, buf: await blob.arrayBuffer() });
    if (!insp(inspId)) { await DB.del('audio', n.audioId); return null; }
    (i.voice = i.voice || []).push(n);
    await saveNow();
    const host = document.getElementById('voiceCards');
    if (host && UI.route.itemId === inspId) host.insertAdjacentHTML('beforeend', voiceNote(n));
    this.noteSideEffects();
    this.kick();
    return n;
  },

  /* ---------- playback ---------- */
  paintPlay() {
    $$('[data-act="voice-play"]').forEach(b => {
      const on = this.play && this.play.id === b.dataset.note && !this.play.el.paused;
      b.innerHTML = ic(on ? 'pause' : 'play', 28, 2.4); b.setAttribute('aria-label', on ? 'Pause the recording' : 'Play the recording');
    });
  },
  async togglePlay(id) {
    const p = this.play;
    if (p && p.id === id) { if (p.el.paused) p.el.play().catch(() => {}); else p.el.pause(); return; }
    this.stopPlay();
    const f = findNote(id); if (!f) return;
    const rec = await DB.get('audio', f.n.audioId).catch(() => null);
    if (!rec) { toast('The recording is missing from this device.'); return; }
    const url = URL.createObjectURL(new Blob([rec.buf], { type: rec.mime })), el = new Audio(url);
    this.play = { id, el, url };
    el.onplay = el.onpause = el.onended = () => this.paintPlay();
    el.onerror = () => { toast('This recording could not be played.'); this.stopPlay(); };
    this.paintPlay();
    el.play().catch(() => {});
  },
  stopPlay() {
    const p = this.play; if (!p) return;
    this.play = null; p.el.onplay = p.el.onpause = p.el.onended = p.el.onerror = null; p.el.pause(); URL.revokeObjectURL(p.url);
    this.paintPlay();
  },

  /* ---------- queue ---------- */
  _next() { for (const i of S.inspections) for (const n of (i.voice || [])) if (n.status === 'queued') return n.id; return null; },
  kick() { if (!this.running) { this.running = true; this._run().catch(() => {}).finally(() => { this.running = false; this._idle(); }); } },
  async _run() {
    while (this.state === 'ready') { const id = this._next(); if (!id) break; await this._process(id); }
  },
  /* Resolves when nothing more can be typed right now: the queue is empty, or the voice files are not downloaded. */
  onIdle() { return new Promise(res => { if (!this.running && (this.state !== 'ready' || !this._next())) res(); else this.idleWaiters.push(res); }); },
  _idle() { const w = this.idleWaiters; this.idleWaiters = []; w.forEach(r => r()); },
  _set(id, fn) {
    const f = findNote(id); if (!f) return false;
    fn(f.n, f.i); save(); this.patchNote(id); return true;
  },
  async _process(id) {
    let f = findNote(id); if (!f || f.n.status !== 'queued') return;
    f.n.status = 'transcribing'; save(); this.patchNote(id);
    const fail = msg => this._set(id, n => { if (n.status === 'transcribing') { n.status = 'draft'; n.text = ''; n.err = msg; } });
    let audio;
    try {
      const rec = await DB.get('audio', f.n.audioId);
      if (!rec) throw new Error('missing audio');
      audio = await this.to16k(rec.buf);
    } catch (e) { fail(VOICE_ERR_FAILED); return; }
    f = findNote(id); if (!f || f.n.status !== 'transcribing') return;   /* deleted or typed over while decoding */
    const audioSecs = audio.length / 16000;
    let res;
    try { res = await this.transcribe(id, audio); }
    catch (e) {
      if (e && e.terminated) { this._set(id, n => { if (n.status === 'transcribing') n.status = 'queued'; }); return; }
      fail(VOICE_ERR_FAILED); return;
    }
    this.stats.promptTokens = res.promptTokens; this.stats.promptBody = res.promptBody;
    this.stats.notes[id] = { secs: res.secs, audioSecs: res.audioSecs != null ? res.audioSecs : audioSecs };
    const text = String(res.text || '').trim();
    this._set(id, n => { if (n.status !== 'transcribing') return; n.status = 'draft'; n.text = text; n.err = text ? '' : VOICE_ERR_EMPTY; });
  },
  /* Decode, then resample to 16 kHz mono through an OfflineAudioContext (never AudioContext({sampleRate})). */
  async to16k(buf) {
    const dec = await new OfflineAudioContext(1, 1, 16000).decodeAudioData(buf.slice(0));
    const off = new OfflineAudioContext(1, Math.max(1, Math.ceil(dec.duration * 16000)), 16000);
    const src = off.createBufferSource(); src.buffer = dec; src.connect(off.destination); src.start();
    return (await off.startRendering()).getChannelData(0).slice();
  },

  /* ---------- worker ---------- */
  ensureWorker() {
    if (this.worker) return this.worker;
    const w = this.worker = new Worker('js/voice-worker.js', { type: 'module' });
    w.onmessage = e => {
      const m = e.data || {};
      if (m.type === 'ready') this.stats.ready = { threads: m.threads, isolated: m.isolated, loadSecs: m.loadSecs };
      else if (m.type === 'result' || m.type === 'error') {
        const p = this.pending.get(m.id); if (!p) return;
        this.pending.delete(m.id);
        if (m.type === 'result') p.resolve(m); else p.reject(new Error(m.message));
      }
    };
    w.onerror = e => { if (this.worker === w) this.killWorker(new Error(e.message || 'worker failed')); };
    w.postMessage({ type: 'load', threads: this.threads });
    return w;
  },
  killWorker(err) {
    const w = this.worker; this.worker = null;
    if (w) { w.onmessage = w.onerror = null; w.terminate(); }
    const e = err || Object.assign(new Error('stopped'), { terminated: true });
    this.pending.forEach(p => p.reject(e)); this.pending.clear();
  },
  transcribe(id, audio) {
    return new Promise((resolve, reject) => {
      const w = this.ensureWorker();
      /* if the typer never answers (it failed to start, say), give up on this note rather than block the queue for ever */
      const timer = setTimeout(() => { if (this.pending.has(id)) this.killWorker(new Error('timed out')); }, (180 + audio.length / 16000 * 5) * 1000);
      this.pending.set(id, { resolve: r => { clearTimeout(timer); resolve(r); }, reject: e => { clearTimeout(timer); reject(e); } });
      w.postMessage({ type: 'transcribe', id, audio, prompt: voicePrompt() }, [audio.buffer]);
    });
  }
};

/* ---------- base64 for backups ---------- */
function b64enc(buf) {
  const u = new Uint8Array(buf); let s = '';
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
  return btoa(s);
}
function b64dec(str) {
  const s = atob(str), u = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
  return u.buffer;
}
