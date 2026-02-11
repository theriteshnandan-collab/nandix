const CACHE_NAME = 'aether-cache-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/manifest.json',
    '/favicon.ico',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // AETHER strategy: Cache first, then network, then MESH
    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) return response;

            return fetch(event.request).then((networkResponse) => {
                return caches.open(CACHE_NAME).then((cache) => {
                    if (event.request.method === 'GET' && !event.request.url.includes('api')) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                });
            }).catch(async () => {
                // NETWORK FAILED: Try the AETHER Mesh
                const path = new URL(event.request.url).pathname;
                console.log(`[SW] Network failed for ${path}. Attempting Mesh Fallback...`);

                return new Promise((resolve) => {
                    // Request asset from main thread (which has access to MeshController)
                    const channel = new MessageChannel();
                    channel.port1.onmessage = (msgEvent) => {
                        if (msgEvent.data && msgEvent.data.assetBuffer) {
                            const response = new Response(msgEvent.data.assetBuffer, {
                                headers: { 'Content-Type': msgEvent.data.contentType || 'application/javascript' }
                            });
                            resolve(response);
                        } else {
                            resolve(caches.match('/')); // Total failure fallback
                        }
                    };

                    self.clients.matchAll().then(clients => {
                        if (clients && clients.length) {
                            clients[0].postMessage({ type: 'MESH_ASSET_REQUEST', path }, [channel.port2]);
                        }
                    });
                });
            });
        })
    );
});
