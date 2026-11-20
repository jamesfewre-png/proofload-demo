/* Proofload offline support. Network first, so an update is picked up when there is signal;
   the cached copy is used when there is none. Only this app's own files are ever requested.
   The voice files (vendor/ and models/) are different: the app downloads them on request into their own
   cache, proofload-voice-v1, and they are served from there first. They are never put in the app cache
   and an app update never deletes them. */
const CACHE = 'proofload-v4';
const VOICE = 'proofload-voice-v1';
const FILES = ['./', 'index.html', 'app.css', 'js/core.js', 'js/ui.js', 'js/report.js', 'js/voice.js', 'js/voice-worker.js', 'js/app.js', 'voice-pack.json', 'manifest.webmanifest', 'icon.svg'];

/* Cross-origin isolation (needed for multi-core voice typing). Hosts like GitHub Pages cannot send these headers,
   so every response this worker hands the page carries them. Harmless where the host already sends them. */
function isolate(res) {
  if (!res || res.status === 0) return res;
  const h = new Headers(res.headers);
  h.set('Cross-Origin-Embedder-Policy', 'require-corp'); h.set('Cross-Origin-Opener-Policy', 'same-origin'); h.set('Cross-Origin-Resource-Policy', 'same-origin');
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
}

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  /* only old app caches (proofload-v1, proofload-v2...) go; proofload-voice-v1 is never touched */
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => /^proofload-v\d+$/.test(k) && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.includes('/__dev/') || url.pathname.includes('/__spike/')) return;   /* dev server only: not cached */
  const rel = url.pathname.slice(new URL(self.registration.scope).pathname.length);
  if (rel.startsWith('vendor/') || rel.startsWith('models/')) {
    /* The typer starts helper workers from these files. Under cross-origin isolation a worker script is only allowed to run if
       its response says so, so the policy headers are added here (a cache entry does not keep the page's own headers). */
    e.respondWith(caches.open(VOICE).then(c => c.match(url.href)).then(hit => hit ? isolate(hit) : fetch(req).then(isolate)));
    return;
  }
  e.respondWith(
    fetch(req).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return isolate(res);
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('index.html')).then(isolate))
  );
});
