/**
 * SERVICE WORKER - LCCC Family Radio
 * Enhanced with gallery support and improved caching strategies
 */

const CACHE_VERSION = 'v2.0.0';
const CACHE_NAME = `lccc-radio-cache-${CACHE_VERSION}`;

// Core app shell - always cached
const APP_SHELL = [
  '/',
  '/index.html',
  '/gallery.html',
  '/css/main_css.css',
  '/css/carousel-lightbox.css',
  '/css/gallery.css',
  '/js/carousel-lightbox.js',
  '/js/',
  '/js/gallery-lightbox.js',
  '/js/youtube.js',
  '/js/video-toggle.js',
  '/resources/background.png',
  '/resources/favicon.png',
  '/offline-audio.mp3'
];

// Image resources - cached on first access
const IMAGE_CACHE = 'lccc-images-v1';

// API/Dynamic content cache
const DYNAMIC_CACHE = 'lccc-dynamic-v1';

// Cache duration for different content types (in seconds)
const CACHE_DURATION = {
  images: 7 * 24 * 60 * 60,      // 7 days
  api: 5 * 60,                    // 5 minutes
  static: 30 * 24 * 60 * 60       // 30 days
};

/**
 * INSTALL - Cache app shell
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(APP_SHELL);
      })
      .then(() => self.skipWaiting())
      .catch(err => console.error('[Service Worker] Install failed:', err))
  );
});

/**
 * ACTIVATE - Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name.startsWith('lccc-') && name !== CACHE_NAME && name !== IMAGE_CACHE && name !== DYNAMIC_CACHE)
            .map(name => {
              console.log('[Service Worker] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
      .then(() => {
        console.log('[Service Worker] Activated successfully');
        notifyClientsAboutUpdate();
      })
  );
});

/**
 * FETCH - Smart caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore chrome extensions and non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Strategy selection based on request type
  if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else if (isAPIRequest(url)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isStreamRequest(request, url)) {
    event.respondWith(handleStreamRequest(request));
  } else if (isFacebookRequest(url)) {
    event.respondWith(handleFacebookRequest(request));
  } else if (isYouTubeRequest(url)) {
    event.respondWith(handleYouTubeRequest(request));
  } else {
    event.respondWith(handleStaticRequest(request));
  }
});

/**
 * REQUEST TYPE CHECKERS
 */
function isImageRequest(request) {
  return request.destination === 'image' || 
         /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(request.url);
}

function isAPIRequest(url) {
  return url.pathname.includes('/api/') || 
         url.pathname.includes('/feeds/') ||
         url.hostname.includes('graph.facebook.com');
}

function isStreamRequest(request, url) {
  return request.destination === 'audio' || 
         url.pathname.endsWith('.mp3') ||
         url.hostname.includes('shoutcheap.com') ||
         url.hostname.includes('broadcast');
}

function isFacebookRequest(url) {
  return url.hostname.includes('facebook.com') || 
         url.hostname.includes('fbcdn.net');
}

function isYouTubeRequest(url) {
  return url.hostname.includes('youtube.com') || 
         url.hostname.includes('ytimg.com') ||
         url.hostname.includes('googleapis.com');
}

/**
 * CACHING STRATEGIES
 */

// Images: Cache-first with expiration
async function handleImageRequest(request) {
  try {
    const cache = await caches.open(IMAGE_CACHE);
    const cached = await cache.match(request);

    if (cached) {
      // Check if cache is still fresh
      const cachedDate = new Date(cached.headers.get('sw-cache-date'));
      const now = new Date();
      const age = (now - cachedDate) / 1000; // in seconds

      if (age < CACHE_DURATION.images) {
        return cached;
      }
    }

    // Fetch fresh image
    const response = await fetch(request);
    
    if (response.ok) {
      const clonedResponse = response.clone();
      const headers = new Headers(clonedResponse.headers);
      headers.set('sw-cache-date', new Date().toISOString());
      
      const responseToCache = new Response(await clonedResponse.blob(), {
        status: clonedResponse.status,
        statusText: clonedResponse.statusText,
        headers: headers
      });

      cache.put(request, responseToCache);
    }

    return response;
  } catch (error) {
    console.error('[SW] Image fetch failed:', error);
    // Return cached version even if expired
    const cache = await caches.open(IMAGE_CACHE);
    return cache.match(request) || new Response('Image unavailable', { status: 404 });
  }
}

// API: Network-first with short cache fallback
async function handleAPIRequest(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] API network failed, using cache:', request.url);
    const cache = await caches.open(DYNAMIC_CACHE);
    const cached = await cache.match(request);
    
    return cached || new Response(
      JSON.stringify({ error: 'Network unavailable', cached: false }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Streams: Network-only with offline fallback
async function handleStreamRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.log('[SW] Stream unavailable, using offline audio');
    return caches.match('/offline-audio.mp3') || new Response('Stream unavailable', { status: 503 });
  }
}

// Facebook: Network-first (don't cache due to privacy/auth)
async function handleFacebookRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    return new Response('Facebook unavailable', { status: 503 });
  }
}

// YouTube: Network-first with cache fallback
async function handleYouTubeRequest(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok && !request.url.includes('/live')) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cached = await cache.match(request);
    return cached || new Response('YouTube unavailable', { status: 503 });
  }
}

// Static assets: Cache-first
async function handleStaticRequest(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    if (cached) {
      return cached;
    }

    const response = await fetch(request);
    
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Static asset failed:', request.url);
    
    // Fallback to index for navigation requests
    if (request.mode === 'navigate') {
      const cache = await caches.open(CACHE_NAME);
      return cache.match('/index.html') || new Response('Offline', { status: 503 });
    }
    
    return new Response('Resource unavailable', { status: 503 });
  }
}

/**
 * BACKGROUND SYNC (for gallery posts)
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-facebook-posts') {
    event.waitUntil(syncFacebookPosts());
  }
});

async function syncFacebookPosts() {
  console.log('[SW] Syncing Facebook posts in background...');
  // This will be triggered by the gallery manager
  // when network is restored
}

/**
 * PUSH NOTIFICATIONS (future enhancement)
 */
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'LCCC Family Radio';
  const options = {
    body: data.body || 'New update available!',
    icon: '/resources/favicon.png',
    badge: '/resources/favicon.png',
    vibrate: [200, 100, 200],
    data: data
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

/**
 * MESSAGE HANDLING
 */
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(names => 
        Promise.all(names.map(name => caches.delete(name)))
      )
    );
  }

  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(IMAGE_CACHE).then(cache => 
        cache.addAll(event.data.urls)
      )
    );
  }
});

/**
 * NOTIFY CLIENTS ABOUT UPDATES
 */
function notifyClientsAboutUpdate() {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'UPDATE_AVAILABLE',
        version: CACHE_VERSION
      });
    });
  });
}

/**
 * PERIODIC BACKGROUND SYNC (if supported)
 */
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'refresh-gallery') {
    event.waitUntil(syncFacebookPosts());
  }
});

console.log('[Service Worker] Loaded successfully - Version:', CACHE_VERSION);
