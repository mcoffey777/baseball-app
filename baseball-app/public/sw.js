const CACHE = 'diamond-disciples-v1'

// Seed the cache with the bare minimum app shell on install
self.addEventListener('install', event => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE).then(cache =>
      cache.addAll(['/', '/index.html', '/logo.png'])
    )
  )
})

// Remove any old cache versions on activate
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Let Firebase (WebSocket + REST) and non-font Google APIs go straight to network
  if (
    url.protocol === 'chrome-extension:' ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('firebaseapp.com') ||
    url.hostname.includes('firebase.google.com') ||
    (url.hostname.includes('googleapis.com') && !url.hostname.includes('fonts'))
  ) return

  // Navigation requests — network first, fall back to cached index.html (keeps routing alive offline)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    )
    return
  }

  // Google Fonts — cache first (fonts rarely change)
  if (
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached
        return fetch(request).then(res => {
          caches.open(CACHE).then(c => c.put(request, res.clone()))
          return res
        })
      })
    )
    return
  }

  // Same-origin assets (JS bundles, CSS, images) — network first, cache as fallback
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(request)
        .then(res => {
          if (res.ok) caches.open(CACHE).then(c => c.put(request, res.clone()))
          return res
        })
        .catch(() => caches.match(request))
    )
  }
})
