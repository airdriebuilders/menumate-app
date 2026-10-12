// MenuMate service worker: app shell cached on install, everything else cached as it is used (works offline after first visit).
const C = 'menumate-v1'
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(C).then((c) => c.addAll(['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'])))
  self.skipWaiting()
})
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== C).map((k) => caches.delete(k)))).then(() => self.clients.claim()))
})
self.addEventListener('fetch', (e) => {
  const r = e.request
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return
  if (r.mode === 'navigate') {
    // Network first for the page so new versions arrive; fall back to cache offline.
    e.respondWith(fetch(r).then((res) => { caches.open(C).then((c) => c.put('./index.html', res.clone())); return res }).catch(() => caches.match('./index.html')))
    return
  }
  e.respondWith(caches.match(r).then((hit) => hit || fetch(r).then((res) => {
    if (res.ok) { const cp = res.clone(); caches.open(C).then((c) => c.put(r, cp)) }
    return res
  })))
})
