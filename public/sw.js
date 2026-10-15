/*
 * Service worker minimal LAPORIN (prototype): membuat "app shell" bisa dibuka saat offline.
 * - Navigasi  : network-first, fallback ke index.html yang sudah tersimpan.
 * - /assets/* (ber-hash): cache-first. Gambar & berkas lain: network-first, fallback ke cache.
 * - /api/*    : TIDAK pernah di-cache (selalu langsung ke jaringan).
 * Aplikasi harus dibuka sekali saat online agar shell tersimpan.
 */
const CACHE = 'laporin-shell-v2';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(['/', '/manifest.webmanifest', '/favicon.svg'])).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('/', copy));
          return res;
        })
        .catch(() => caches.match('/')),
    );
    return;
  }

  // /assets/* ber-hash -> cache-first. Lainnya (mis. gambar di /images yang bisa diganti) -> network-first.
  const hashed = url.pathname.startsWith('/assets/');
  const network = () =>
    fetch(req).then((res) => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    });
  event.respondWith(
    hashed ? caches.match(req).then((hit) => hit || network()) : network().catch(() => caches.match(req)),
  );
});
