import logger from './utils/logger';

// RestoPapa Service Worker - Advanced PWA
const CACHE_NAME = 'restopapa-v1.2.0';
const STATIC_CACHE = 'restopapa-static-v1.2.0';
const DYNAMIC_CACHE = 'restopapa-dynamic-v1.2.0';
const API_CACHE = 'restopapa-api-v1.2.0';
const OFFLINE_CACHE = 'restopapa-offline-v1.2.0';

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/jobs',
  '/marketplace',
  '/offline',
  '/manifest.json',
  '/favicon.ico',
];

// API endpoints to cache with network-first strategy
const API_CACHE_PATTERNS = [
  /^.*\/api\/v1\/auth\/me$/,
  /^.*\/api\/v1\/restaurants\/my$/,
  /^.*\/api\/v1\/jobs\?.*$/,
  /^.*\/api\/v1\/marketplace\/products\?.*$/,
];

// Assets to cache with cache-first strategy
const ASSET_CACHE_PATTERNS = [
  /^.*\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf)$/,
  /^.*\/icon\?.*$/,
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        logger.info('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        logger.info('Service Worker installed');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE &&
              cacheName !== DYNAMIC_CACHE && cacheName !== API_CACHE &&
              cacheName !== OFFLINE_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      logger.info('Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - handle requests with different strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle API requests with network-first strategy
  if (API_CACHE_PATTERNS.some(pattern => pattern.test(request.url))) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Handle static assets with cache-first strategy
  if (ASSET_CACHE_PATTERNS.some(pattern => pattern.test(request.url))) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Handle navigation requests with network-first, fallback to offline page
  if (request.mode === 'navigate') {
    event.respondWith(navigationStrategy(request));
    return;
  }

  // Default: network-first strategy
  event.respondWith(networkFirstStrategy(request));
});

// Network-first strategy with cache fallback
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);

    // Only cache successful responses
    if (networkResponse.status === 200) {
      const cacheName = request.url.includes('/api/') ? API_CACHE : DYNAMIC_CACHE;
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // If it's an API request, return a custom offline response
    if (request.url.includes('/api/')) {
      return new Response(
        JSON.stringify({
          error: 'Network unavailable',
          offline: true,
          message: 'You are currently offline. Some features may be limited.'
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    throw error;
  }
}

// Cache-first strategy with network fallback
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('Failed to fetch asset:', request.url);
    throw error;
  }
}

// Navigation strategy with offline page fallback
async function navigationStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('Navigation failed, trying cache:', request.url);

    // Try to get from cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fallback to offline page
    const offlineResponse = await caches.match('/offline');
    if (offlineResponse) {
      return offlineResponse;
    }

    // Final fallback - basic offline page
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Offline - RestoPapa</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 20px; }
            .container { max-width: 400px; margin: 0 auto; text-align: center; padding-top: 100px; }
            .icon { font-size: 64px; margin-bottom: 20px; }
            h1 { color: #333; margin-bottom: 10px; }
            p { color: #666; line-height: 1.5; }
            .retry-btn {
              background: #059669; color: white; border: none; padding: 12px 24px;
              border-radius: 6px; font-size: 16px; cursor: pointer; margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">📡</div>
            <h1>You're offline</h1>
            <p>Please check your internet connection and try again.</p>
            <button class="retry-btn" onclick="window.location.reload()">Retry</button>
          </div>
        </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Offline data storage and management
const OFFLINE_DATA_STORE = 'restopapa-offline-data';
const SYNC_QUEUE_STORE = 'restopapa-sync-queue';

// IndexedDB setup for offline data storage
let db;

async function initializeOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('RestoPapaOfflineDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Create stores for offline data
      if (!database.objectStoreNames.contains('offlineActions')) {
        const store = database.createObjectStore('offlineActions', { keyPath: 'id', autoIncrement: true });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('type', 'type', { unique: false });
      }

      if (!database.objectStoreNames.contains('cacheData')) {
        const cacheStore = database.createObjectStore('cacheData', { keyPath: 'key' });
        cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        cacheStore.createIndex('expiry', 'expiry', { unique: false });
      }
    };
  });
}

// Store offline actions for later sync
async function storeOfflineAction(action) {
  if (!db) await initializeOfflineDB();

  const transaction = db.transaction(['offlineActions'], 'readwrite');
  const store = transaction.objectStore('offlineActions');

  const actionData = {
    ...action,
    timestamp: Date.now(),
    synced: false
  };

  return store.add(actionData);
}

// Get pending offline actions
async function getPendingActions() {
  if (!db) await initializeOfflineDB();

  const transaction = db.transaction(['offlineActions'], 'readonly');
  const store = transaction.objectStore('offlineActions');

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const actions = request.result.filter(action => !action.synced);
      resolve(actions);
    };
    request.onerror = () => reject(request.error);
  });
}

// Mark action as synced
async function markActionSynced(actionId) {
  if (!db) await initializeOfflineDB();

  const transaction = db.transaction(['offlineActions'], 'readwrite');
  const store = transaction.objectStore('offlineActions');

  const getRequest = store.get(actionId);
  getRequest.onsuccess = () => {
    const action = getRequest.result;
    if (action) {
      action.synced = true;
      action.syncedAt = Date.now();
      store.put(action);
    }
  };
}

// Enhanced background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  } else if (event.tag === 'offline-actions-sync') {
    event.waitUntil(syncOfflineActions());
  } else if (event.tag === 'critical-data-sync') {
    event.waitUntil(syncCriticalData());
  }
});

async function handleBackgroundSync() {
  logger.info('Performing comprehensive background sync');

  try {
    // Sync offline actions
    await syncOfflineActions();

    // Sync critical data
    await syncCriticalData();

    // Update cache with fresh data
    await updateCacheWithFreshData();

    logger.info('Background sync completed successfully');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

async function syncOfflineActions() {
  try {
    const pendingActions = await getPendingActions();

    for (const action of pendingActions) {
      try {
        const response = await fetch(action.url, {
          method: action.method || 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...action.headers
          },
          body: action.data ? JSON.stringify(action.data) : undefined
        });

        if (response.ok) {
          await markActionSynced(action.id);
          logger.info(`Synced offline action: ${action.type}`);
        } else {
          console.warn(`Failed to sync action ${action.type}:`, response.status);
        }
      } catch (error) {
        logger.error(Error syncing action ${action.type}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in syncOfflineActions:', error);
  }
}

async function syncCriticalData() {
  try {
    // Sync user profile data
    await syncUserProfile();

    // Sync restaurant data if user is a restaurant
    await syncRestaurantData();

    // Sync job applications if any
    await syncJobApplications();

  } catch (error) {
    console.error('Error in syncCriticalData:', error);
  }
}

async function syncUserProfile() {
  try {
    const response = await fetch('/api/v1/auth/me');
    if (response.ok) {
      const userData = await response.json();
      await cacheUserData('current-user', userData);
    }
  } catch (error) {
    console.log('Could not sync user profile:', error);
  }
}

async function syncRestaurantData() {
  try {
    const response = await fetch('/api/v1/restaurants/my');
    if (response.ok) {
      const restaurantData = await response.json();
      await cacheUserData('user-restaurant', restaurantData);
    }
  } catch (error) {
    console.log('Could not sync restaurant data:', error);
  }
}

async function syncJobApplications() {
  try {
    const response = await fetch('/api/v1/jobs/applications/my');
    if (response.ok) {
      const applications = await response.json();
      await cacheUserData('user-job-applications', applications);
    }
  } catch (error) {
    console.log('Could not sync job applications:', error);
  }
}

async function cacheUserData(key, data) {
  if (!db) await initializeOfflineDB();

  const transaction = db.transaction(['cacheData'], 'readwrite');
  const store = transaction.objectStore('cacheData');

  const cacheItem = {
    key,
    data,
    timestamp: Date.now(),
    expiry: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  };

  return store.put(cacheItem);
}

async function updateCacheWithFreshData() {
  try {
    // Update restaurants cache
    const restaurantsResponse = await fetch('/api/v1/restaurants?limit=50');
    if (restaurantsResponse.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put('/api/v1/restaurants?limit=50', restaurantsResponse.clone());
    }

    // Update jobs cache
    const jobsResponse = await fetch('/api/v1/jobs?limit=50');
    if (jobsResponse.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put('/api/v1/jobs?limit=50', jobsResponse.clone());
    }
  } catch (error) {
    console.log('Could not update cache with fresh data:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.body || 'New notification from RestoPapa',
    icon: '/icon?size=192',
    badge: '/icon?size=72',
    image: data.image,
    tag: data.tag || 'notification',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
    data: data.data || {},
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'RestoPapa',
      options
    )
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const { action, data } = event;
  let url = '/dashboard';

  if (action) {
    url = data?.actionUrls?.[action] || url;
  } else if (data?.url) {
    url = data.url;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }

      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Advanced message handling from main thread
self.addEventListener('message', (event) => {
  const { data } = event;

  if (!data) return;

  switch (data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CACHE_IMPORTANT_DATA':
      event.waitUntil(cacheImportantData(data.payload));
      break;

    case 'STORE_OFFLINE_ACTION':
      event.waitUntil(storeOfflineAction(data.payload));
      break;

    case 'CLEAR_OFFLINE_CACHE':
      event.waitUntil(clearOfflineCache());
      break;

    case 'GET_CACHE_STATUS':
      event.waitUntil(sendCacheStatus(event.ports[0]));
      break;

    case 'SYNC_NOW':
      // Trigger immediate sync
      self.registration.sync.register('critical-data-sync');
      break;
  }
});

// Cache important data on demand
async function cacheImportantData(data) {
  try {
    const cache = await caches.open(OFFLINE_CACHE);
    const response = new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
    await cache.put(`/offline-data/${data.key}`, response);
    logger.info(`Cached important data: ${data.key}`);
  } catch (error) {
    console.error('Failed to cache important data:', error);
  }
}

// Clear offline cache
async function clearOfflineCache() {
  try {
    await caches.delete(OFFLINE_CACHE);

    if (db) {
      const transaction = db.transaction(['offlineActions', 'cacheData'], 'readwrite');
      transaction.objectStore('offlineActions').clear();
      transaction.objectStore('cacheData').clear();
    }

    logger.info('Offline cache cleared');
  } catch (error) {
    console.error('Failed to clear offline cache:', error);
  }
}

// Send cache status to main thread
async function sendCacheStatus(port) {
  try {
    const cacheNames = await caches.keys();
    const cacheStatus = {};

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      cacheStatus[cacheName] = keys.length;
    }

    // Get offline actions count
    let offlineActionsCount = 0;
    if (db) {
      const pendingActions = await getPendingActions();
      offlineActionsCount = pendingActions.length;
    }

    port.postMessage({
      type: 'CACHE_STATUS',
      data: {
        caches: cacheStatus,
        offlineActions: offlineActionsCount,
        dbInitialized: !!db
      }
    });
  } catch (error) {
    console.error('Failed to get cache status:', error);
    port.postMessage({
      type: 'CACHE_STATUS_ERROR',
      error: error.message
    });
  }
}

// Periodic cache cleanup
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'cache-cleanup') {
    event.waitUntil(performCacheCleanup());
  }
});

async function performCacheCleanup() {
  try {
    // Clean up expired cache entries
    if (db) {
      const transaction = db.transaction(['cacheData'], 'readwrite');
      const store = transaction.objectStore('cacheData');
      const index = store.index('expiry');

      const now = Date.now();
      const expiredRange = IDBKeyRange.upperBound(now);

      const request = index.openCursor(expiredRange);
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
    }

    // Clean up old cached responses
    const cacheNames = await caches.keys();
    for (const cacheName of cacheNames) {
      if (cacheName.includes('v1.1.0') || cacheName.includes('v1.0.0')) {
        await caches.delete(cacheName);
        logger.info(`Deleted old cache: ${cacheName}`);
      }
    }

    logger.info('Cache cleanup completed');
  } catch (error) {
    console.error('Cache cleanup failed:', error);
  }
}

// Network quality detection
let networkQuality = 'good';

function detectNetworkQuality() {
  if ('connection' in navigator) {
    const connection = navigator.connection;
    const downlink = connection.downlink;
    const effectiveType = connection.effectiveType;

    if (effectiveType === 'slow-2g' || effectiveType === '2g' || downlink < 0.5) {
      networkQuality = 'poor';
    } else if (effectiveType === '3g' || downlink < 1.5) {
      networkQuality = 'moderate';
    } else {
      networkQuality = 'good';
    }
  }

  return networkQuality;
}

// Adaptive caching based on network quality
async function adaptiveCacheStrategy(request) {
  const quality = detectNetworkQuality();

  switch (quality) {
    case 'poor':
      // Aggressive caching for poor network
      return cacheFirstStrategy(request);

    case 'moderate':
      // Balanced approach
      return networkFirstStrategy(request);

    case 'good':
    default:
      // Prefer fresh content
      return networkFirstStrategy(request);
  }
}

// Initialize service worker
async function initializeServiceWorker() {
  try {
    await initializeOfflineDB();
    logger.info('Offline database initialized');

    // Register for periodic sync if available
    if ('serviceWorker' in navigator && 'periodicsync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await self.registration;
      await registration.periodicSync.register('cache-cleanup', {
        minInterval: 24 * 60 * 60 * 1000 // 24 hours
      });
    }

    logger.info('RestoPapa Service Worker v1.2.0 loaded with advanced PWA features');
  } catch (error) {
    console.error('Service Worker initialization failed:', error);
  }
}

// Initialize on load
initializeServiceWorker();