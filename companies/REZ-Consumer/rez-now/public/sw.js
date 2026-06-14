const CACHE_NAME = 'rez-now-v2';
const MENU_CACHE_NAME = 'rez-now-menu-v1';
const STATIC_CACHE_NAME = 'rez-now-static-v2';
const PRECACHE_URLS = ['/', '/offline', '/manifest.json', '/icon', '/apple-icon'];

// Menu cache max-age: 24 hours in milliseconds
const MENU_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

// Install: pre-cache known shell URLs
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()) // Activate immediately, don't wait for all tabs to close
  );
});

// Activate: claim clients immediately and remove old caches
self.addEventListener('activate', (event) => {
  const knownCaches = new Set([CACHE_NAME, MENU_CACHE_NAME, STATIC_CACHE_NAME]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !knownCaches.has(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns true if the cached Response is younger than MENU_CACHE_MAX_AGE_MS.
 * Reads the 'sw-cached-at' header written when the entry was stored.
 */
function isMenuCacheFresh(response) {
  if (!response) return false;
  const cachedAt = response.headers.get('sw-cached-at');
  if (!cachedAt) return false;
  return Date.now() - Number(cachedAt) < MENU_CACHE_MAX_AGE_MS;
}

/**
 * Fetch a menu URL, inject a 'sw-cached-at' timestamp header, and store in
 * MENU_CACHE_NAME. Returns the original (unmodified) network response.
 */
async function fetchAndCacheMenu(request) {
  const networkResponse = await fetch(request);
  if (networkResponse.ok) {
    const clone = networkResponse.clone();
    const body = await clone.arrayBuffer();
    // Build a new response that carries our timestamp header
    const stamped = new Response(body, {
      status: networkResponse.status,
      statusText: networkResponse.statusText,
      headers: (() => {
        const h = new Headers(networkResponse.headers);
        h.set('sw-cached-at', String(Date.now()));
        return h;
      })(),
    });
    caches.open(MENU_CACHE_NAME).then((cache) => cache.put(request, stamped));
  }
  return networkResponse;
}

// ── Fetch strategy ────────────────────────────────────────────────────────────
//   1. Static assets (/_next/static/, /icon, /apple-icon, /manifest.json,
//      .js/.css/.png etc.): cache-first → network, store in STATIC_CACHE_NAME
//   2. Menu API (GET /api/web-ordering/store/*/menu):
//         stale-while-revalidate with 24 h max-age, stored in MENU_CACHE_NAME
//   3. Navigation (HTML): network-first, fall back to /offline
//   4. All other /api/* routes: network-only (no caching)
//   5. Everything else: network-first, fall back to CACHE_NAME

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // ── 1. Static assets: cache-first ────────────────────────────────────────
  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname === '/manifest.json' ||
    url.pathname === '/icon' ||
    url.pathname === '/apple-icon' ||
    /\.(js|css|png|jpg|jpeg|svg|webp|woff2?|ico)(\?.*)?$/.test(url.pathname);

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches
                .open(STATIC_CACHE_NAME)
                .then((cache) => cache.put(request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  // ── 2. Menu API: stale-while-revalidate ──────────────────────────────────
  // Match GET /api/web-ordering/store/<slug>/menu (with optional query string)
  const isMenuApi =
    request.method === 'GET' &&
    /^\/api\/web-ordering\/store\/[^/]+\/menu(\/|$|\?)/.test(url.pathname + url.search);

  if (isMenuApi) {
    event.respondWith(
      caches.open(MENU_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);

        if (cached && isMenuCacheFresh(cached)) {
          // Serve stale copy immediately; revalidate silently in background
          fetchAndCacheMenu(request).catch((error) => {
            console.warn('[sw] Menu revalidation failed, serving cached:', error);
          });
          return cached;
        }

        // No fresh cache — try network, fall back to stale if offline
        try {
          return await fetchAndCacheMenu(request);
        } catch (error) {
          if (cached) return cached; // serve stale while offline
          // No cache at all — nothing we can do
          console.warn('[sw] Menu fetch failed, no cache available:', error);
          return new Response(
            JSON.stringify({ error: 'Offline and no cached menu available' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          );
        }
      })
    );
    return;
  }

  // ── 3. Navigation requests: network-first, /offline fallback ─────────────
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match('/offline'))
        )
    );
    return;
  }

  // ── 4. Other API routes: network-only ────────────────────────────────────
  if (url.pathname.startsWith('/api/')) {
    // Let the browser handle it normally — do not intercept
    return;
  }

  // ── 5. Everything else: network-first, fall back to cache ─────────────────
  event.respondWith(
    fetch(request)
      .then((response) => response)
      .catch(() => caches.match(request))
  );
});

// ── Background Sync ───────────────────────────────────────────────────────────

const OFFLINE_DB_NAME = 'rez-now-offline';
const OFFLINE_STORE_NAME = 'pending-orders';
const OFFLINE_DB_VERSION = 1;
const SYNC_TAG = 'sync-orders';
const MAX_RETRIES = 3;

/**
 * Opens the same IndexedDB used by offlineQueue.ts.
 * The SW and the page share this database — keys and schema must stay aligned.
 */
function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(OFFLINE_DB_NAME, OFFLINE_DB_VERSION);

    req.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(OFFLINE_STORE_NAME)) {
        const store = db.createObjectStore(OFFLINE_STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    req.onsuccess = (event) => resolve(event.target.result);
    req.onerror = (event) => reject(event.target.error);
  });
}

function getAllPendingOrders(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OFFLINE_STORE_NAME, 'readonly');
    const req = tx.objectStore(OFFLINE_STORE_NAME).index('createdAt').getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function deleteOrder(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OFFLINE_STORE_NAME, 'readwrite');
    const req = tx.objectStore(OFFLINE_STORE_NAME).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => resolve();
  });
}

function incrementOrderRetry(db, order) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OFFLINE_STORE_NAME, 'readwrite');
    const objectStore = tx.objectStore(OFFLINE_STORE_NAME);

    if (order.retries + 1 >= MAX_RETRIES) {
      // P0-13 FIX: Max retries reached — discard the order but NOTIFY the user first.
      // Previously the order silently vanished with no feedback, leaving the user confused.
      objectStore.delete(order.id);
      // Notify all open tabs that this order was permanently failed
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        for (const client of clients) {
          client.postMessage({
            type: 'ORDER_SYNC_EXHAUSTED',
            orderId: order.id,
            message: 'Order could not be placed after multiple attempts. Please try again or contact support.',
          });
        }
      });
      // Also show a system notification so the user sees it even if all tabs are closed
      self.registration.showNotification('Order failed to sync', {
        body: 'Your offline order could not be placed after multiple attempts. Please try again.',
        icon: '/icon',
        badge: '/icon',
        tag: `order-failed-${order.id}`,
      });
    } else {
      objectStore.put({ ...order, retries: order.retries + 1 });
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Iterates every queued order and attempts to POST it to the API.
 * On success: removes from IndexedDB and shows a notification.
 * On failure: increments retry counter (order auto-discards at MAX_RETRIES).
 */
async function syncPendingOrders() {
  let db;
  try {
    db = await openOfflineDB();
    const orders = await getAllPendingOrders(db);

    for (const order of orders) {
      try {
        // P0-5: Use /razorpay/create-order (the idempotency-protected endpoint)
        // and pass the idempotency key so retries don't double-charge the customer.
        const response = await fetch('/api/web-ordering/razorpay/create-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': `offline-${order.id}`,
          },
          body: JSON.stringify(order.payload),
        });

        if (response.ok) {
          await deleteOrder(db, order.id);
          // Notify all open tabs that the queued order was placed
          const clients = await self.clients.matchAll({ type: 'window' });
          for (const client of clients) {
            client.postMessage({ type: 'ORDER_SYNCED', orderId: order.id });
          }
          // Show a system notification if the page is in the background
          await self.registration.showNotification('Order placed!', {
            body: 'Your offline order has been placed successfully.',
            icon: '/icon',
            badge: '/icon',
          });
        } else {
          await incrementOrderRetry(db, order);
        }
      } catch (error) {
        // Network still unavailable for this order — increment retry
        console.warn('[sw] Order sync failed, incrementing retry:', error);
        await incrementOrderRetry(db, order);
      }
    }
  } finally {
    if (db) db.close();
  }
}

self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(syncPendingOrders());
  }
});

// Push event handler — show notification when a push message arrives
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title ?? 'REZ Now';
  const options = {
    body: data.body ?? 'Your order has been updated',
    icon: '/icon',
    badge: '/icon',
    data: { url: data.url ?? '/' },
    actions: data.actions ?? [],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click handler — open the target URL when user taps the notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(clients.openWindow(url));
});
