// TagRound voice worker: on-device Whisper (base.en, q8, WASM) via the self-hosted transformers.js.
// Start it with: new Worker('js/voice-worker.js', { type: 'module' })
// Nothing here touches the network except same-origin fetches of /models and /vendor.
//
// MESSAGE CONTRACT
//   in  { type: 'load', threads?: number }
//       out { type: 'progress', file, loaded, total }   (optional, sparse, may repeat)
//       out { type: 'ready', threads, isolated, loadSecs }   threads = effective ORT numThreads
//       out { type: 'error', message }                  (load failed; a later load/transcribe retries)
//   in  { type: 'transcribe', id: string, audio: Float32Array /* 16 kHz mono, transferred */, prompt: string }
//       out { type: 'result', id, text, secs /* processing time */, audioSecs, promptTokens, promptBody /* what was actually used, after the 200-token cap */ }
//       out { type: 'error', id, message }
//     If the model is not loaded yet, transcribe loads it first (progress/ready are posted as usual).
//     Jobs run one at a time in arrival order. Input up to ~60 s works (split into <=29 s pieces at quiet points).
//     text is '' for silence / non-speech tags like [BLANK_AUDIO]. Any leaked prompt is stripped.
//     `prompt` is a vocabulary sentence, e.g. "Lifting gear inspection notes. Chain sling, ...";
//     its encoded body is capped at 200 tokens (cut at the last ", " that fits).
'use strict';

import { pipeline, env } from '../vendor/transformers/transformers.min.js';

const MODEL = 'Xenova/whisper-base.en';
const MAX_PROMPT_TOKENS = 200;

env.allowRemoteModels = false;
env.allowLocalModels = true;
env.localModelPath = new URL('../models/', import.meta.url).href;
env.useBrowserCache = false; // the app manages its own Cache API store (served by the service worker)
env.backends.onnx.wasm.wasmPaths = new URL('../vendor/onnxruntime-web/', import.meta.url).href;
env.backends.onnx.wasm.proxy = false;

let asr = null, loading = null, loadSecs = 0, threadsAsked;

const post = (msg, transfer) => self.postMessage(msg, transfer || []);

function load(threads) {
  if (asr) return Promise.resolve();
  if (loading) return loading;
  if (Number.isFinite(threads) && threads > 0) threadsAsked = threads;
  if (threadsAsked) env.backends.onnx.wasm.numThreads = threadsAsked; // else ORT picks (1 unless isolated)
  const t0 = performance.now();
  loading = pipeline('automatic-speech-recognition', MODEL, {
    device: 'wasm', dtype: 'q8',
    progress_callback: e => {
      if (e.status === 'progress' && e.total) post({ type: 'progress', file: e.file, loaded: e.loaded, total: e.total });
    },
  }).then(p => {
    asr = p;
    loadSecs = (performance.now() - t0) / 1000;
    post({ type: 'ready', threads: env.backends.onnx.wasm.numThreads, isolated: !!self.crossOriginIsolated, loadSecs });
  }).finally(() => { loading = null; });
  return loading;
}

// Build the prompt token list the way Whisper's own prompt mode does: <|startofprev|> prompt <|startoftranscript|> <|notimestamps|>.
// transformers.js 3.8.1 has no prompt_ids option, so it goes in as decoder_input_ids.
function promptIds(prompt) {
  const tk = asr.tokenizer, id = t => tk.model.tokens_to_ids.get(t);
  const enc = s => tk.encode(' ' + s, { add_special_tokens: false });
  let body = prompt.trim(), ids = enc(body);
  if (ids.length > MAX_PROMPT_TOKENS) {
    // too long: cut at the last ", " boundary that fits
    let cut = body.length;
    while (ids.length > MAX_PROMPT_TOKENS && cut > 0) {
      cut = body.lastIndexOf(', ', cut - 1);
      body = cut > 0 ? body.slice(0, cut) : body.slice(0, MAX_PROMPT_TOKENS * 3);
      ids = enc(body);
    }
    if (ids.length > MAX_PROMPT_TOKENS) ids = ids.slice(0, MAX_PROMPT_TOKENS); // single huge term: hard cut
  }
  return { body, ids: [id('<|startofprev|>'), ...ids, id('<|startoftranscript|>'), id('<|notimestamps|>')] };
}

// The model sometimes echoes the prompt at the start of the output. Drop it.
function stripLeak(text, prompt) {
  const t = text.trim(), p = prompt.trim();
  if (!p) return t;
  if (t.startsWith(p)) return t.slice(p.length).trim();
  const head = p.slice(0, Math.min(23, p.length)); // same trigger as the spike ("Lifting gear inspection")
  if (t.startsWith(head)) return t.slice(p.length).trim();
  return t;
}

// Whole output is only tags like [BLANK_AUDIO], (silence), [Music], *sigh* -> no speech.
function stripNonSpeech(text) {
  const rest = text.replace(/\[[^\]]*\]|\([^)]*\)|\*[^*]*\*|♪+/g, ' ').replace(/[\s.,!?-]+/g, '');
  return rest ? text : '';
}

// transformers.js 3.8.1 loses all but the last chunk when decoder_input_ids is combined with its own chunking,
// so inputs longer than one window are split here instead, at the quietest point near each boundary.
const WIN = 29 * 16000, SEARCH = 6 * 16000, FRAME = 800; // 29 s windows, look back 6 s, 50 ms frames
function splitAudio(a) {
  const parts = [];
  let start = 0;
  while (a.length - start > WIN) {
    const end = start + WIN;
    let best = end, bestE = Infinity;
    for (let f = end - SEARCH; f + FRAME <= end; f += FRAME) {
      let e = 0;
      for (let i = f; i < f + FRAME; i++) e += a[i] * a[i];
      if (e < bestE) { bestE = e; best = f + (FRAME >> 1); }
    }
    parts.push(a.subarray(start, best));
    start = best;
  }
  parts.push(a.subarray(start));
  return parts;
}

async function transcribe({ id, audio, prompt }) {
  try {
    await load();
    const t0 = performance.now();
    const p = typeof prompt === 'string' ? prompt.trim() : '';
    const opts = { chunk_length_s: 30 };
    let body = '', promptTokens = 0;
    if (p) { const r = promptIds(p); body = r.body; opts.decoder_input_ids = r.ids; promptTokens = r.ids.length - 3; }
    const texts = [];
    for (const part of splitAudio(audio)) {
      const out = await asr(part, opts);
      texts.push(stripNonSpeech(stripLeak(out.text || '', body)).trim());
    }
    const text = texts.filter(Boolean).join(' ');
    post({ type: 'result', id, text, secs: (performance.now() - t0) / 1000, audioSecs: audio.length / 16000, promptTokens, promptBody: body });
  } catch (err) {
    post({ type: 'error', id, message: String(err && err.message || err) });
  }
}

// FIFO: one job at a time, in arrival order.
const queue = [];
let busy = false;
async function pump() {
  if (busy) return;
  busy = true;
  while (queue.length) {
    const m = queue.shift();
    if (m.type === 'load') {
      try { if (asr) post({ type: 'ready', threads: env.backends.onnx.wasm.numThreads, isolated: !!self.crossOriginIsolated, loadSecs }); else await load(m.threads); }
      catch (err) { post({ type: 'error', message: String(err && err.message || err) }); }
    } else await transcribe(m);
  }
  busy = false;
}

self.onmessage = e => {
  const m = e.data || {};
  if (m.type === 'load' || m.type === 'transcribe') { queue.push(m); pump(); }
};
