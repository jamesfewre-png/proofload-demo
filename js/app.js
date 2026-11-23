'use strict';
/* TagRound app: rendering, navigation, every user action, photos, signatures, start-up. */

/* ---------- rendering ---------- */
function render() {
  Voice.stopPlay();
  let r = UI.route;
  const r2 = routeFor(r); if (r2 !== r) r = UI.route = r2;
  /* a recording in progress is saved, not lost, if the screen moves away from its item */
  if (Voice.rec && !(r.name === 'visit' && r.panel === 'item' && r.itemId === Voice.rec.inspId)) Voice.stopRec();
  if (UI.voiceErr && !(r.name === 'visit' && r.itemId === UI.voiceErr.inspId)) UI.voiceErr = null;
  const keep = {};
  $$('[data-scroll]').forEach(el => { keep[el.dataset.scroll] = el.scrollTop; });
  $('#app').innerHTML = shell(r);
  $$('[data-scroll]').forEach(el => { if (keep[el.dataset.scroll]) el.scrollTop = keep[el.dataset.scroll]; });
  hydrate();
}
function renderList() {
  const r = UI.route, el = $('#paneList');
  if (!el || r.name !== 'visit') return;
  const sc = $('[data-scroll="vlist"]', el), top = sc ? sc.scrollTop : 0;
  el.innerHTML = visitList(visit(r.id), r);
  const s2 = $('[data-scroll="vlist"]', el); if (s2) s2.scrollTop = top;
}
function refreshGate() {
  const box = $('#gateBox'), v = curVisit(); if (!box || !v) return;
  box.innerHTML = gateBox(v);
  const si = $('#signBoxInspector'), sc = $('#signBoxClient'); if (si) si.innerHTML = signBox(v, 'inspector'); if (sc) sc.innerHTML = signBox(v, 'client');
  const btn = $('#issueBtn'); if (btn) { btn.disabled = gate(v).some(x => x.kind === 'block'); btn.innerHTML = issueLabelHTML(v); }
}
function hydrate(root = document) {
  $$('img[data-photo]', root).forEach(async img => {
    if (img.getAttribute('src')) return;
    const id = img.dataset.photo;
    let u = PH.get(id);
    if (!u) { u = await DB.get('photos', id).catch(() => null); if (u) PH.set(id, u); }
    if (u) img.src = u;
  });
}

/* ---------- navigation ---------- */
function go(route, opts = {}) {
  UI.route = route; UI.typeOpen = false;
  if (opts.replace) history.replaceState(route, ''); else history.pushState(route, '');
  render();
}
window.addEventListener('popstate', e => {
  closeOverlay();
  UI.route = e.state || { name: S.settings.onboarded ? 'home' : 'welcome' };
  UI.typeOpen = false;
  render();
});
function setPanel(panel, itemId) {
  const r = UI.route;
  if (r.name === 'register') { if (r.assetId) history.back(); return; }
  if (r.name !== 'visit') return;
  if (!panel) { if (r.panel) history.back(); return; }
  go({ name: 'visit', id: r.id, panel, itemId: itemId || '' }, { replace: !!r.panel });
}
const curVisit = () => visit(UI.route.id);
const curInsp = () => insp(UI.route.itemId);
const curAsset = () => { const i = curInsp(); return i && asset(i.assetId); };

/* ---------- overlay, confirm, toast ---------- */
let confirmFn = null;
function openOverlay(html, quiet) {
  const o = $('#overlay'); o.innerHTML = html;
  if (quiet && o.firstElementChild) o.firstElementChild.style.animation = 'none';
  hydrate(o);
}
function closeOverlay() { $('#overlay').innerHTML = ''; confirmFn = null; }
function ask(title, body, okLabel, fn, danger) { openOverlay(sheetConfirm(title, body, okLabel, danger)); confirmFn = fn; }
let toastTimer = null, toastUndo = null;
/* With undoFn the toast also holds an Undo button and stays 5 s; a new toast replaces the old one and its pending Undo. */
function toast(msg, undoFn) {
  const t = $('#toast'); clearTimeout(toastTimer); toastUndo = undoFn || null;
  t.classList.toggle('has-undo', !!undoFn);
  const shown = esc(msg).replace(/\S*-\S*/g, m => `<span class="nw">${m}</span>`);  /* an ID like TS-SB-01 never breaks at its hyphens; the text itself is unchanged */
  if (undoFn) t.innerHTML = `<span>${shown}</span><button class="undo" data-act="toast-undo">Undo</button>`; else t.innerHTML = shown;
  t.classList.add('show');
  toastTimer = setTimeout(hideToast, undoFn ? 5000 : 2600);
}
function hideToast() { clearTimeout(toastTimer); toastUndo = null; $('#toast').classList.remove('show'); }

/* ---------- photos ---------- */
let photoTarget = null, fileMode = null;
function shrink(file, max = 1400, type = 'image/jpeg') {
  return new Promise((res, rej) => {
    const img = new Image(), u = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(u);
      res(c.toDataURL(type, 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(u); rej(new Error('unreadable')); };
    img.src = u;
  });
}
async function addPhotos(inspId, files) {
  const i = insp(inspId); if (!i) return;
  let added = 0;
  for (const f of files) {
    try {
      const url = await shrink(f), id = 'p' + uid();
      await DB.put('photos', id, url); PH.set(id, url); i.photos.push(id); added++;
    } catch (e) { toast('That file could not be read as a photo.'); }
  }
  if (added) { save(); render(); }
}

/* ---------- signature pad ---------- */
let sigDirty = false;
function initSigPad() {
  const c = $('#sigpad'); if (!c) return;
  const dpr = window.devicePixelRatio || 1, b = c.getBoundingClientRect();
  c.width = Math.round(b.width * dpr); c.height = Math.round(b.height * dpr);
  const x = c.getContext('2d');
  x.scale(dpr, dpr); x.lineWidth = 2.6; x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = '#17212B';
  let down = false; sigDirty = false;
  const pos = e => { const r = c.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  c.onpointerdown = e => { down = true; try { c.setPointerCapture(e.pointerId); } catch (_) {} const [px, py] = pos(e); x.beginPath(); x.moveTo(px, py); x.lineTo(px + .1, py + .1); x.stroke(); sigDirty = true; e.preventDefault(); };
  c.onpointermove = e => { if (!down) return; const [px, py] = pos(e); x.lineTo(px, py); x.stroke(); };
  c.onpointerup = c.onpointercancel = () => { down = false; };
}

/* ---------- new-visit sheet state ---------- */
function syncNv() {
  const f = $('#overlay form'); if (!f || !UI.nv) return;
  ['name', 'site', 'contact', 'phone', 'email', 'date'].forEach(k => { if (f.elements[k]) UI.nv[k] = f.elements[k].value; });
  if (f.elements.bring) UI.nv.bring = f.elements.bring.checked;
}

/* ---------- actions ---------- */
const ACT = {
  nav(el) { go({ name: el.dataset.to }); },
  'open-visit'(el) { const v = visit(el.dataset.id); if (!v) return; UI.filter = 'all'; go(v.status === 'issued' ? { name: 'report', id: v.id } : { name: 'visit', id: v.id, panel: '' }); },
  'new-visit'() {
    UI.nv = { mode: S.clients.length ? 'existing' : 'new', clientId: S.clients.length === 1 ? S.clients[0].id : '', name: '', site: '', contact: '', phone: '', email: '', date: todayISO(), bring: true };
    openOverlay(sheetNewVisit());
  },
  'nv-mode'(el) { syncNv(); UI.nv.mode = el.dataset.mode; openOverlay(sheetNewVisit(), true); },
  'nv-client'(el) { syncNv(); UI.nv.clientId = el.dataset.id; openOverlay(sheetNewVisit(), true); },
  'start-due'(el) { const v = newVisit(el.dataset.id, todayISO(), tagFor(todayISO()), true); save(); UI.filter = 'all'; go({ name: 'visit', id: v.id, panel: '' }); },

  panel(el) { setPanel(el.dataset.panel); },
  filter(el) { UI.filter = el.dataset.f; renderList(); },
  'add-item'() { setPanel('pick'); },
  'pick-type'(el) {
    const v = curVisit(), a = newAsset(v.clientId, el.dataset.type), i = newInsp(v.id, a.id);
    UI.filter = 'all'; save(); setPanel('item', i.id); focusIdent();
  },
  'open-item'(el) { setPanel('item', el.dataset.id); },
  'quick-pass'(el) {
    const i = insp(el.dataset.id); if (!i) return;
    const a = asset(i.assetId), undo = resultUndo(i);
    setResult(i, 'pass'); const voided = save(); render();
    toast('Passed ' + (a.ident.trim() || typeOf(a).name) + '.' + (voided ? ' ' + SIG_VOID_MSG : ''), () => { if (undo()) { save(); render(); } });
  },
  'toast-undo'() { const fn = toastUndo; hideToast(); if (fn) fn(); },
  'set-result'(el) {
    const i = curInsp(), k = el.dataset.result; if (!i) return;
    if (i.result === k) { i.result = ''; i.nextDue = ''; i.actions = []; i.retest = false; } else setResult(i, k);
    save(); render();
  },
  'toggle-defect'(el) {
    const i = curInsp(), d = el.dataset.defect; if (!i) return;
    i.defects = i.defects.includes(d) ? i.defects.filter(x => x !== d) : [...i.defects, d];
    save(); render();
  },
  'toggle-action'(el) {
    const i = curInsp(), x = el.dataset.action; if (!i) return;
    const cur = i.actions || [];
    i.actions = cur.includes(x) ? cur.filter(y => y !== x) : [...cur, x];
    save(); render();
  },
  'toggle-types'() { UI.typeOpen = !UI.typeOpen; render(); },
  'set-type'(el) {
    const a = curAsset(), i = curInsp(); if (!a) return;
    const old = typeOf(a); a.type = el.dataset.type; const t = typeOf(a);
    if (!a.std || a.std === old.std) a.std = t.std;
    i.defects = [];
    if (i.result === 'pass') i.nextDue = addMonths(visit(i.visitId).date, t.months);
    UI.typeOpen = false; save(); render();
  },
  'set-tagstart'(el) { S.settings.tagStart = el.dataset.start === '11' ? 11 : 0; save(); render(); },
  'set-unit'(el) { const a = curAsset(); if (!a) return; a.wllUnit = el.dataset.unit; save(); render(); },
  'add-like'() {
    const i = curInsp(); if (!i) return;
    const a = asset(i.assetId), v = visit(i.visitId), a2 = newAsset(v.clientId, a.type, a), i2 = newInsp(v.id, a2.id);
    UI.filter = 'all'; save(); setPanel('item', i2.id); focusIdent();
    toast('Added another ' + typeOf(a).name.toLowerCase() + '. Enter its ID.');
  },
  'del-item'() {
    const i = curInsp(); if (!i) return;
    ask('Delete this item?', 'It is removed from this visit. Photos and voice notes taken for it on this visit are deleted too.', 'Delete item', async () => {
      await removeInsp(i.id); save(); history.back();
    }, true);
  },
  'take-photo'() { photoTarget = UI.route.itemId; $('#camInput').click(); },
  'choose-photo'() { photoTarget = UI.route.itemId; $('#pickInput').click(); },
  'view-photo'(el) { openOverlay(sheetPhoto(el.dataset.photoId, true)); },
  async 'del-photo'(el) {
    const i = curInsp(), id = el.dataset.photoId; if (!i) return;
    i.photos = i.photos.filter(p => p !== id);
    /* an earlier version of a report may still show this photo: keep it in the store */
    if (!photoInSnapshots(id)) { PH.delete(id); await DB.del('photos', id); }
    closeOverlay(); save(); render();
  },

  'rec-toggle'() { Voice.toggleRec(UI.route.itemId); },
  'voice-play'(el) { Voice.togglePlay(el.dataset.note); },
  'voice-check'(el) {
    const f = findNote(el.dataset.note); if (!f || f.n.status !== 'draft') return;
    const t = String(f.n.text || '').trim();
    if (t) f.i.notes = f.i.notes ? f.i.notes + (f.i.notes.endsWith('\n') ? '' : '\n') + t : t;
    f.n.text = t; f.n.status = 'checked'; f.n.checkedAt = new Date().toISOString();
    save(); render();
  },
  'voice-del'(el) {
    const f = findNote(el.dataset.note); if (!f) return;
    ask('Delete this voice note?', 'The recording is evidence. Deleting it removes the audio from this device for good. Text already added to the notes stays.', 'Delete recording', async () => {
      const g = findNote(f.n.id); if (!g) return;
      if (Voice.play && Voice.play.id === g.n.id) Voice.stopPlay();
      g.i.voice = g.i.voice.filter(x => x.id !== g.n.id); delete Voice.stats.notes[g.n.id];
      await DB.del('audio', g.n.audioId); save(); render();
    }, true);
  },
  'voice-download'() { Voice.download(); },
  'voice-cancel'() { Voice.cancel(); },
  'voice-remove'() {
    ask('Remove the voice files?', 'This frees about ' + Math.round(((Voice.pack && Voice.pack.totalBytes) || 101569929) / 1e6) + ' MB. Your recordings stay. Drafts wait until the voice files are downloaded again.', 'Remove', async () => { await Voice.remove(); }, true);
  },

  'gate-go'(el) {
    const g = gateLines(curVisit())[+el.dataset.idx]; if (!g) return;
    if (g.item) setPanel('item', g.item);
    else if (g.sign) ACT.sign({ dataset: { who: g.sign } });
    else if (g.nav) go({ name: g.nav });
    else if (g.panel) setPanel(g.panel);
    else if (g.focus) { const f = document.getElementById(g.focus); if (f) f.focus(); }
  },
  sign(el) { const v = curVisit(); if (!v || v.status !== 'open' || sigLock(v)) return; openOverlay(sheetSign(el.dataset.who)); initSigPad(); },
  'sig-clear'() { initSigPad(); },
  'sig-save'(el) {
    if (!sigDirty) { toast('Sign in the box first.'); return; }
    const v = curVisit(), data = $('#sigpad').toDataURL('image/png');
    if (!signVisit(v, el.dataset.who, data)) { closeOverlay(); render(); return; }
    closeOverlay(); save(); render();
  },
  issue() {
    const v = curVisit(); if (!v || gate(v).some(x => x.kind === 'block')) return;
    const gone = issueVisit(v);
    save(); UI.justIssued = true;
    go({ name: 'report', id: v.id }, { replace: true });
    if (gone) toast(gone === 1 ? '1 destroyed item taken off the active register.' : gone + ' destroyed items taken off the active register.');
    setTimeout(() => { UI.justIssued = false; }, 3400);
  },
  revise() { const v = curVisit(); if (v) openOverlay(sheetRevise(v)); },
  'revise-ok'() {
    const v = curVisit(), f = $('#reviseWhy'); if (!v || !f || !reviseVisit(v, f.value)) return;
    closeOverlay(); save(); go({ name: 'visit', id: v.id, panel: '' }, { replace: true });
  },
  'open-rev'(el) { go({ name: 'report', id: UI.route.id, rev: +el.dataset.idx }); },
  'back-report'() { history.back(); },
  print() {
    const m = reportModel(curVisit()), r = UI.route, rv = r.rev !== undefined && curVisit().revisions && curVisit().revisions[r.rev];
    let st = document.getElementById('pageMarks');
    if (!st) { st = document.createElement('style'); st.id = 'pageMarks'; document.head.appendChild(st); }
    st.textContent = pageMarksCSS(rv ? rv.snapshot : m);
    window.print();
  },
  preview() { const v = curVisit(); if (v) go({ name: 'report', id: v.id, preview: true }); },
  async 'dl-report'() { const v = curVisit(); download(reportFileName(v, 'html'), 'text/html', await standaloneReport(v)); toast('Report file saved. Open it anywhere, no app needed.'); },
  async 'share-report'() {
    const v = curVisit(), html = await standaloneReport(v);
    const file = new File([html], reportFileName(v, 'html').replace(/[\\/:*?"<>|]+/g, ' '), { type: 'text/html' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title: 'Inspection report ' + reportNo(v) });
      else download(file.name, 'text/html', html);
    } catch (e) { /* share sheet dismissed */ }
  },
  'dl-csv'() { const v = curVisit(); download(reportFileName(v, 'csv'), 'text/csv', registerCSV(v)); toast('Spreadsheet saved.'); },

  'open-asset'(el) { go({ name: 'register', assetId: el.dataset.id }, { replace: UI.route.name === 'register' && !!UI.route.assetId }); },
  'retire-asset'(el) { const a = asset(el.dataset.id); if (!a) return; a.retired = !a.retired; save(); render(); },

  'set-tag'(el) { curVisit().tag = el.dataset.tag; save(); render(); },
  'del-visit'() {
    const v = curVisit();
    ask('Delete this visit?', 'Every result, photo and voice note recorded on this visit is deleted. Items that were only ever on this visit leave the register.', 'Delete visit', async () => {
      for (const i of visitInsps(v.id)) await removeInsp(i.id);
      const held = snapshotPhotoIds(v);
      S.visits = S.visits.filter(x => x.id !== v.id);
      /* photos kept only for this visit's earlier versions go with the visit */
      for (const p of held) if (!photoInSnapshots(p) && !S.inspections.some(x => x.photos.includes(p))) { PH.delete(p); await DB.del('photos', p); }
      save(); go({ name: 'home' }, { replace: true });
    }, true);
  },

  'pick-logo'() { fileMode = 'logo'; const f = $('#fileInput'); f.accept = 'image/*'; f.click(); },
  'clear-logo'() { S.settings.company.logo = ''; save(); render(); },
  async backup() {
    download('TagRound backup ' + todayISO() + '.json', 'application/json', await makeBackup());
    S.settings.lastBackupAt = new Date().toISOString(); save(); render();
    toast('Backup saved. Keep it somewhere safe.');
  },
  restore() { fileMode = 'restore'; const f = $('#fileInput'); f.accept = '.json,application/json'; f.click(); },
  'load-demo'() {
    const run = async () => { await buildDemo(); UI.filter = 'all'; go({ name: 'home' }, { replace: true }); toast('Sample data loaded.'); };
    if (S.visits.length || S.assets.length) ask('Replace your records with sample data?', 'Everything recorded on this device is replaced. Save a backup first if you need to keep it.', 'Replace with sample data', run, true);
    else run();
  },
  erase() {
    ask('Erase everything?', 'All clients, items, visits, reports, photos and voice notes on this device are permanently deleted. This cannot be undone.', 'Erase everything', async () => {
      Voice.stopPlay(); await DB.clear('photos'); await DB.clear('audio'); PH.clear(); S = blankState(); await saveNow(); go({ name: 'welcome' }, { replace: true });
    }, true);
  },
  'close-overlay'() { closeOverlay(); },
  'confirm-ok'() { const fn = confirmFn; closeOverlay(); if (fn) fn(); }
};
function focusIdent() { const f = $('#identInput'); if (f) f.focus(); }

/* ---------- events ---------- */
document.addEventListener('click', e => {
  if (e.target.id === 'overlay') { closeOverlay(); return; }
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = ACT[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el); }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && $('#overlay').innerHTML) { closeOverlay(); return; }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[role="button"][data-act]')) { e.preventDefault(); e.target.click(); }
});
document.addEventListener('submit', e => {
  const f = e.target, kind = f.dataset.form;
  if (!kind) return;
  e.preventDefault();
  if (kind === 'welcome') {
    S.settings.company.name = f.elements.company.value.trim();
    S.settings.inspector.name = f.elements.inspector.value.trim();
    S.settings.onboarded = true; save();
    go({ name: 'home' }, { replace: true });
  }
  if (kind === 'new-visit') {
    syncNv(); const nv = UI.nv; let cid = nv.clientId;
    if (nv.mode === 'new') {
      if (!nv.name.trim()) return;
      const c = { id: 'c' + uid(), name: nv.name.trim(), site: nv.site.trim(), contact: nv.contact.trim(), email: nv.email.trim(), phone: (nv.phone || '').trim() };
      S.clients.push(c); cid = c.id;
    }
    if (!cid) return;
    const date = nv.date || todayISO();
    const v = newVisit(cid, date, tagFor(date), nv.mode === 'existing' && nv.bring);
    closeOverlay(); save(); UI.filter = 'all';
    go({ name: 'visit', id: v.id, panel: '' });
  }
});
/* Typing in a voice note: the inspector's own words replace the draft and the note leaves the typing queue. Only voice[n] changes. */
function voiceInput(el) {
  const f = findNote(el.dataset.voice); if (!f || f.n.status === 'checked') return;
  const n = f.n, was = n.status;
  n.text = el.value; save();
  if ((was === 'queued' || was === 'transcribing') && el.value) { n.status = 'draft'; n.typed = true; n.err = ''; Voice.patchNote(n.id); }
}
const setPath = (obj, path, val) => { const ks = path.split('.'); const last = ks.pop(); ks.reduce((o, k) => o[k], obj)[last] = val; };
document.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.voice) { voiceInput(el); return; }
  if (el.id === 'reviseWhy') { const ok = $('#reviseOk'); if (ok) ok.disabled = !reasonOk(el.value); return; }
  if (el.id === 'regSearch') { UI.q = el.value; $('#regRows').innerHTML = regRows(UI.route); return; }
  if (el.name === 'date' && el.form && el.form.dataset.form === 'new-visit') { syncNv(); openOverlay(sheetNewVisit(), true); return; }
  if (el.dataset.typeStd) { const id = el.dataset.typeStd; S.settings.types[id] = { ...(S.settings.types[id] || {}), std: el.value }; save(); return; }
  if (el.dataset.typeMonths) { const id = el.dataset.typeMonths, n = parseInt(el.value, 10); if (n > 0) { S.settings.types[id] = { ...(S.settings.types[id] || {}), months: n }; save(); } return; }
  const b = el.dataset.bind; if (!b) return;
  const [scope, path] = b.split(':');
  const v = UI.route.name === 'visit' ? curVisit() : null;
  const obj = scope === 'a' ? curAsset() : scope === 'i' ? curInsp() : scope === 'v' ? v : scope === 'c' ? (v && client(v.clientId)) : S.settings;
  if (!obj) return;
  let val = el.value;
  if (scope === 's' && path === 'nextNo') val = parseInt(val, 10) || 1;
  if (scope === 'v' && path === 'date' && !val) return;
  if (scope === 'v' && path === 'date') setVisitDate(v, val); else setPath(obj, path, val);
  save();
  if (scope === 's' && (path === 'nextNo' || path === 'prefix')) { const w = $('#nextNoWarn'); if (w) w.innerHTML = nextNoWarnHTML(); }
  if (!v) return;
  if (scope === 'a' && path === 'ident') { const t = $('#paneDetail .title'); if (t) t.textContent = val || 'New item'; const w = $('#identWarn'), ca = curAsset(), ci = curInsp(); if (w && ca && ci) w.innerHTML = identWarn(ca, ci.visitId); }
  if (isWide() || scope === 'c' || scope === 'v') renderList();
  if (scope === 'v') refreshGate();
  /* only the swatches are redrawn, so focus stays in the date input */
  if (scope === 'v' && path === 'date') { const sw = $('#swatches'); if (sw) sw.innerHTML = swatchesHTML(v); }
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset.quarter !== undefined && el.tagName === 'SELECT') { S.settings.quarters[+el.dataset.quarter] = el.value; save(); render(); return; }
  if (el.dataset.retest !== undefined) { const i = curInsp(); if (i) { i.retest = el.checked; save(); } return; }
  if (el.dataset.bind === 'a:wll') { const a = curAsset(); if (a) { a.wll = el.value = normWll(el.value); save(); if (isWide()) renderList(); } return; }
  if (el.dataset.toggle) { S.settings[el.dataset.toggle] = el.checked; save(); return; }
  if (el.id === 'camInput' || el.id === 'pickInput') { const files = [...el.files]; el.value = ''; if (files.length && photoTarget) addPhotos(photoTarget, files); return; }
  if (el.id === 'fileInput') {
    const f = el.files[0]; el.value = ''; if (!f) return;
    if (fileMode === 'logo') shrink(f, 640, 'image/png').then(u => { S.settings.company.logo = u; save(); render(); }).catch(() => toast('That file could not be read as an image.'));
    if (fileMode === 'restore') f.text().then(text => ask('Restore this backup?', 'Everything on this device is replaced with the contents of the backup file.', 'Restore', async () => {
      try { await applyBackup(text); go({ name: 'home' }, { replace: true }); toast('Backup restored.'); } catch (err) { toast(err.message || 'That backup could not be read.'); }
    }, true));
  }
});

/* ---------- start-up ---------- */
async function boot() {
  const style = document.createElement('style'); style.textContent = DOC_CSS; document.head.appendChild(style);
  const ok = await DB.open();
  const st = ok ? await DB.get('kv', 'state').catch(() => null) : null;
  if (st && st.v) { S = Object.assign(blankState(), st); S.settings = Object.assign(blankState().settings, st.settings); }
  migrate(st && st.v ? st.settings : null);
  normVoice();
  if (st && st.v) saveNow().catch(() => {});
  const route = S.settings.onboarded ? { name: 'home' } : { name: 'welcome' };
  UI.route = route; history.replaceState(route, '');
  render();
  if (!ok) toast('This browser is not keeping records. Check that private browsing is off.');
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').then(reg => {
    /* Hosts that cannot send the cross-origin isolation headers (GitHub Pages): the service worker adds them, which only
       takes effect on the next load. Reload once, at startup, so voice notes get every core. Never more than once a session. */
    if (window.crossOriginIsolated !== false) return;
    let done = null; try { done = sessionStorage.getItem('pl-coi'); } catch (e) {}
    if (done) return;
    const go = () => { try { sessionStorage.setItem('pl-coi', '1'); } catch (e) {} location.reload(); };
    if (navigator.serviceWorker.controller && !reg.installing && !reg.waiting) go();
    else navigator.serviceWorker.addEventListener('controllerchange', go, { once: true });
  }).catch(() => {});
  let wide = isWide();
  window.addEventListener('resize', () => { if (isWide() !== wide) { wide = isWide(); render(); } });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { Voice.stopRec(); saveNow().catch(() => {}); } });
  Voice.init();
  /* dev-only test hook: only with ?devtest, and only ever requested on localhost */
  if (/[?&]devtest\b/.test(location.search) && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) {
    const s = document.createElement('script'); s.src = '/__dev/devtest.js'; s.onerror = () => {}; document.body.appendChild(s);
  }
}
boot();
