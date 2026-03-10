// ChronosAI Service Worker for PWA functionality
const CACHE_NAME = 'chronosai-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Files to cache for offline functionality
const STATIC_CACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/css/app.css',
  '/js/app.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🔧 ChronosAI Service Worker: Installing');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 ChronosAI Service Worker: Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('✅ ChronosAI Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ ChronosAI Service Worker: Installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 ChronosAI Service Worker: Activating');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ ChronosAI Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ ChronosAI Service Worker: Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-HTTP requests
  if (!request.url.startsWith('http')) {
    return;
  }

  // Skip API requests - let them fail gracefully
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Strategy: Cache first with network fallback for static assets
  if (STATIC_CACHE_URLS.some(cacheUrl => url.pathname === new URL(cacheUrl, self.location.origin).pathname)) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            console.log('📋 ChronosAI Service Worker: Serving from cache:', request.url);
            return response;
          }
          
          console.log('🌐 ChronosAI Service Worker: Fetching from network:', request.url);
          return fetch(request)
            .then((response) => {
              // Cache successful responses
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(request, responseClone);
                  });
              }
              return response;
            })
            .catch(() => {
              // Return offline page for navigation requests
              if (request.mode === 'navigate') {
                console.log('📴 ChronosAI Service Worker: Serving offline page');
                return caches.match(OFFLINE_URL);
              }
            });
        })
    );
    return;
  }

  // Strategy: Network first with cache fallback for other requests
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(request, responseClone);
            });
        }
        return response;
      })
      .catch(() => {
        // Try to serve from cache
        return caches.match(request)
          .then((response) => {
            if (response) {
              console.log('📋 ChronosAI Service Worker: Serving from cache fallback:', request.url);
              return response;
            }
            
            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              console.log('📴 ChronosAI Service Worker: Serving offline page');
              return caches.match(OFFLINE_URL);
            }
          });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('🔄 ChronosAI Service Worker: Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('📢 ChronosAI Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New meeting update',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'View Meeting',
        icon: '/icons/calendar-96.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close-96.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('ChronosAI', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('👆 ChronosAI Service Worker: Notification clicked');
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/calendar')
    );
  } else if (event.action === 'close') {
    // Just close the notification
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background sync function
async function doBackgroundSync() {
  try {
    // Get offline actions from IndexedDB
    const offlineActions = await getOfflineActions();
    
    for (const action of offlineActions) {
      try {
        // Retry the API call
        const response = await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        });
        
        if (response.ok) {
          // Remove successful action from IndexedDB
          await removeOfflineAction(action.id);
          console.log('✅ ChronosAI Service Worker: Background sync successful for action:', action.id);
        }
      } catch (error) {
        console.error('❌ ChronosAI Service Worker: Background sync failed for action:', action.id, error);
      }
    }
  } catch (error) {
    console.error('❌ ChronosAI Service Worker: Background sync error:', error);
  }
}

// IndexedDB helpers for offline storage
async function getOfflineActions() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ChronosAIOffline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['actions'], 'readonly');
      const store = transaction.objectStore('actions');
      const getAllRequest = store.getAll();
      
      getAllRequest.onerror = () => reject(getAllRequest.error);
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('actions')) {
        db.createObjectStore('actions', { keyPath: 'id' });
      }
    };
  });
}

async function removeOfflineAction(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ChronosAIOffline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['actions'], 'readwrite');
      const store = transaction.objectStore('actions');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onerror = () => reject(deleteRequest.error);
      deleteRequest.onsuccess = () => resolve();
    };
  });
}

// Message handling for cache updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'UPDATE_CACHE') {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => {
          return cache.add(event.data.url);
        })
    );
  }
});
