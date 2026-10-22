/**
 * SERVICE WORKER - LCCC Family Radio PWA
 * Version: 3.2.0
 * Fixes: Analytics support, origin check performance, size comparison bug,
 *        offline page reliability, PWA install/update flow
 */

// ============================================================================
// CONFIGURATION
// ============================================================================
const CONFIG = {
  version: 'v3.2.0',
  timeouts: { api: 10000 },
  sizes: { maxImageBytes: 5 * 1024 * 1024 },
};

const CACHE_VERSION = CONFIG.version;
const CACHE_NAME    = `lccc-radio-${CACHE_VERSION}`;
const IMAGE_CACHE   = `lccc-images-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `lccc-dynamic-${CACHE_VERSION}`;

const OFFLINE_PAGE  = '/offline.html';
const OFFLINE_IMAGE = '/resources/background.png';
const OFFLINE_AUDIO = '/resources/offline-audio.mp3';

// APP_SHELL: Keep this small and reliable.
// Any single 404 here will abort the entire install.
const APP_SHELL = [
  '/',
  '/index.html',
  '/gallery.html',
  '/offline.html',
  '/css/main_css.css',
  '/css/carousel-lightbox.css',
  '/css/gallery.css',
  '/manifest.json',
  '/resources/background.png',
  '/resources/favicon.png',
];

// ============================================================================
// RESOLVED ORIGINS — Done ONCE at startup, not per-request
// ============================================================================
const ALLOWED_EXACT_ORIGINS = new Set([
  self.location.origin,
  'https://www.googletagmanager.com',
  'https://www.google-analytics.com',
  'https://region1.google-analytics.com',
  'https://analytics.google.com',
  'https://cdnjs.cloudflare.com',
  'https://cdn.jsdelivr.net',
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
  'https://graph.facebook.com',
  'https://www.googleapis.com',
  'https://youtube.com',
  'https://www.youtube.com',
  'https://i.ytimg.com',
  'https://scontent.fna.fbcdn.net',
  'https://api.allorigins.win',
  'https://broadcast.shoutcheap.com',
]);

// Wildcard patterns compiled once
const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/external-.*\.fbcdn\.net$/,
  /^https:\/\/.*\.fbcdn\.net$/,
  /^https:\/\/.*\.shoutcheap\.com$/,
  /^https:\/\/.*\.youtube\.com$/,
];

// ============================================================================
// PRE-COMPILED PATTERNS
// ============================================================================
const PATTERNS = {
  image:   /\.(jpg|jpeg|png|gif|webp|svg|ico|avif)$/i,
  audio:   /\.(mp3|aac|ogg|wav)$/i,
  font:    /\.(woff|woff2|ttf|eot|otf)$/i,
  xss:     /<script|javascript:|data:/i,
  attacks: ['../', '..\\', 'eval(', 'expression(', 'vbscript:', 'onload='],
};

// ============================================================================
// INSTALL
// ============================================================================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing', CACHE_VERSION);

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Cache each file individually so one 404 doesn't kill the install
        return Promise.allSettled(
          APP_SHELL.map(url =>
            cache.add(url).catch(err =>
              console.warn(`[SW] Failed to cache ${url}:`, err)
            )
          )
        );
      })
      .then(() => {
        console.log('[SW] Install complete');
        // Force this SW to become active immediately
        return self.skipWaiting();
      })
  );
});

// ============================================================================
// ACTIVATE
// ============================================================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating', CACHE_VERSION);

  event.waitUntil(
    Promise.all([
      // Delete ALL old caches from previous versions
      caches.keys().then(names =>
        Promise.all(
          names
            .filter(name =>
              name.startsWith('lccc-') && !name.includes(CACHE_VERSION)
            )
            .map(name => {
              console.log('[SW] Removing old cache:', name);
              return caches.delete(name);
            })
        )
      ),
      // Take control of all open tabs immediately
      self.clients.claim(),
    ]).then(() => {
      console.log('[SW] Activation complete — notifying clients');
      notifyClientsAboutUpdate();
    })
  );
});

// ============================================================================
// FETCH
// ============================================================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Non-http(s) requests (chrome-extension etc.) — ignore
  if (!url.protocol.startsWith('http')) return;

  // Unknown origins — pass through to network, don't block
  if (!isAllowedOrigin(url)) {
    return event.respondWith(fetch(request).catch(() =>
      new Response('Origin not allowed', { status: 403 })
    ));
  }

  // Block malicious patterns
  if (isSuspiciousRequest(url)) {
    return event.respondWith(new Response('Blocked', { status: 403 }));
  }

  // Analytics requests — network only, never cache
  if (isAnalyticsRequest(url)) {
    return event.respondWith(fetch(request));
  }

  // Route by type
  if (isImageRequest(request))         event.respondWith(handleImageRequest(request));
  else if (isStreamRequest(request, url)) event.respondWith(handleStreamRequest(request));
  else if (isAPIRequest(url))           event.respondWith(handleAPIRequest(request));
  else if (isFontRequest(request))      event.respondWith(handleFontRequest(request));
  else                                  event.respondWith(handleStaticRequest(request));
});

// ============================================================================
// SECURITY
// ============================================================================
function isAllowedOrigin(url) {
  if (ALLOWED_EXACT_ORIGINS.has(url.origin)) return true;
  return ALLOWED_ORIGIN_PATTERNS.some(p => p.test(url.origin));
}

function isSuspiciousRequest(url) {
  if (PATTERNS.xss.test(url.href)) return true;
  return PATTERNS.attacks.some(p => url.href.includes(p));
}

function isAnalyticsRequest(url) {
  return (
    url.hostname.includes('google-analytics.com') ||
    url.hostname.includes('googletagmanager.com') ||
    url.hostname.includes('analytics.google.com') ||
    url.hostname.includes('region1.google-analytics.com')
  );
}

// ============================================================================
// REQUEST TYPE CHECKERS
// ============================================================================
function isImageRequest(req) {
  return req.destination === 'image' || PATTERNS.image.test(req.url);
}
function isAPIRequest(url) {
  return (
    url.pathname.includes('/api/') ||
    url.pathname.startsWith('/data/') ||
    url.pathname.endsWith('.json') ||
    url.pathname.includes('/feeds/') ||
    url.hostname.includes('graph.facebook.com') ||
    url.hostname.includes('googleapis.com')
  );
}
function isStreamRequest(req, url) {
  return (
    req.destination === 'audio' ||
    PATTERNS.audio.test(url.pathname) ||
    url.hostname.includes('shoutcheap.com')
  );
}
function isFontRequest(req) {
  return req.destination === 'font' || PATTERNS.font.test(req.url);
}

// ============================================================================
// HANDLERS
// ============================================================================

async function handleImageRequest(request) {
  try {
    const cache = await caches.open(IMAGE_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response.ok) {
      const contentLength = parseInt(
        response.headers.get('content-length') || '0', 10
      );
      if (contentLength < CONFIG.sizes.maxImageBytes) {
        cache.put(request, response.clone());
      }
    }
    return response;
  } catch {
    return caches.match(OFFLINE_IMAGE) ||
           new Response('', { status: 404 });
  }
}

async function handleAPIRequest(request) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.timeouts.api);

  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);

    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    clearTimeout(timer);

    const cache  = await caches.open(DYNAMIC_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;

    return new Response(
      JSON.stringify({ offline: true, error: 'Network unavailable' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function handleStreamRequest(request) {
  try {
    return await fetch(request);
  } catch {
    return caches.match(OFFLINE_AUDIO) ||
           new Response('Stream unavailable', { status: 503 });
  }
}

async function handleFontRequest(request) {
  const cache  = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function handleStaticRequest(request) {
  try {
    const cache  = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    if (cached) {
      // Serve from cache, revalidate in background (stale-while-revalidate)
      fetch(request)
        .then(res => { if (res.ok) cache.put(request, res); })
        .catch(() => {});
      return cached;
    }

    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_PAGE) ||
             new Response(
               '<h1>You are offline</h1><p>Please check your connection.</p>',
               { headers: { 'Content-Type': 'text/html' } }
             );
    }
    return new Response('Offline', { status: 503 });
  }
}

// ============================================================================
// PUSH & NOTIFICATIONS
// ============================================================================
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'LCCC FM', {
      body: data.body || 'New update available',
      icon: '/resources/web-app-manifest-192x192.png',
      badge: '/resources/favicon-96x96.png',
      vibrate: [200, 100, 200],
      data: data,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});

// ============================================================================
// MESSAGES FROM PAGE
// ============================================================================
self.addEventListener('message', (event) => {
  switch (event.data?.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CLEAR_CACHE':
      event.waitUntil(
        caches.keys()
          .then(names => Promise.all(names.map(n => caches.delete(n))))
          .then(() => event.ports[0]?.postMessage({ success: true }))
      );
      break;

    case 'GET_VERSION':
      event.ports[0]?.postMessage({ version: CACHE_VERSION });
      break;
  }
});

// ============================================================================
// PERIODIC SYNC
// ============================================================================
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'refresh-content') {
    event.waitUntil(Promise.resolve()); // Placeholder for future use
  }
});

// ============================================================================
// CLIENT NOTIFICATION
// ============================================================================
function notifyClientsAboutUpdate() {
  self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
    clients.forEach(client =>
      client.postMessage({
        type: 'UPDATE_AVAILABLE',
        version: CACHE_VERSION,
        message: 'A new version is available. Refresh to update.',
      })
    );
  });
}

// ============================================================================
// ERROR HANDLING
// ============================================================================
self.addEventListener('error', e => console.error('[SW] Error:', e.error));
self.addEventListener('unhandledrejection', e =>
  console.error('[SW] Unhandled rejection:', e.reason)
);

console.log('[SW] Loaded —', CACHE_VERSION);
