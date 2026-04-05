// Y-Nav Service Worker
// 提供离线缓存和基础 PWA 支持

const CACHE_NAME = 'ynav-cache-v2';
const ASSET_CACHE_NAME = 'ynav-assets-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico'
];

// 安装事件 - 缓存静态资源
self.addEventListener('install', (event) => {
  console.log('[SW] 安装中...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] 缓存静态资源');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] 安装完成');
        return self.skipWaiting();
      })
      .catch(err => {
        console.warn('[SW] 缓存失败:', err);
      })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('[SW] 激活中...');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME && name !== ASSET_CACHE_NAME)
            .map(name => {
              console.log('[SW] 删除旧缓存:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] 激活完成');
        return self.clients.claim();
      })
  );
});

// 获取事件 - 智能缓存策略
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. API 请求：强制走网络，不缓存
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }).catch(() => {
        // 网络失败时才返回缓存（仅作为降级）
        return caches.match(request);
      })
    );
    return;
  }

  // 2. 跳过非 GET 请求
  if (request.method !== 'GET') {
    return;
  }

  // 3. 跳过非同源请求
  if (url.origin !== self.location.origin) {
    return;
  }

  // 4. 静态资源：Cache First，但定期更新
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'image' ||
      request.destination === 'font') {
    event.respondWith(
      caches.open(ASSET_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          // 同时请求网络更新缓存
          const fetchPromise = fetch(request).then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // 网络失败时返回缓存
            return cachedResponse;
          });
          
          // 返回缓存，同时后台更新
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // 5. 其他请求：默认缓存优先策略
  event.respondWith(
    caches.match(request)
      .then(response => {
        // 缓存命中，返回缓存
        if (response) {
          // 后台更新缓存
          fetch(request)
            .then(newResponse => {
              if (newResponse.ok) {
                caches.open(CACHE_NAME)
                  .then(cache => cache.put(request, newResponse));
              }
            })
            .catch(() => {});
          return response;
        }

        // 缓存未命中，从网络获取
        return fetch(request)
          .then(response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // 缓存新资源
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(request, responseToCache);
              });

            return response;
          })
          .catch(error => {
            console.warn('[SW] 获取失败:', error);
            // 返回离线页面（如果有）
            return caches.match('/index.html');
          });
      })
  );
});

// 消息处理
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});

console.log('[SW] Service Worker 已加载 (v2 - 优化缓存策略)');
