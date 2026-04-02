// Y-Nav Service Worker v2
// 高性能离线缓存和 PWA 支持

const STATIC_CACHE = 'ynav-static-v2';
const DYNAMIC_CACHE = 'ynav-dynamic-v2';
const API_CACHE = 'ynav-api-v2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/apple-touch-icon.png'
];

// 缓存策略配置
const CACHE_STRATEGIES = {
  // 静态资源：缓存优先
  static: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30天
    maxEntries: 100
  },
  // API请求：网络优先，缓存作为回退
  api: {
    maxAge: 5 * 60 * 1000, // 5分钟
    maxEntries: 50
  },
  // 图片资源：缓存优先，带过期检查
  image: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
    maxEntries: 200
  }
};

// 安装事件 - 缓存静态资源
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Installation complete');
        return self.skipWaiting();
      })
      .catch(err => {
        console.warn('[SW] Cache failed:', err);
      })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => {
              return name !== STATIC_CACHE && 
                     name !== DYNAMIC_CACHE && 
                     name !== API_CACHE;
            })
            .map(name => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Activation complete');
        return self.clients.claim();
      })
  );
});

// 判断请求类型
function getRequestType(url) {
  if (url.pathname.startsWith('/api/')) return 'api';
  if (url.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp|ico)$/)) return 'image';
  if (url.pathname.match(/\.(js|css|html|json)$/)) return 'static';
  return 'dynamic';
}

// 判断是否需要缓存
function shouldCache(request, url) {
  // 只缓存 GET 请求
  if (request.method !== 'GET') return false;
  
  // 跳过 chrome-extension 和 blob URLs
  if (url.protocol === 'chrome-extension:' || url.protocol === 'blob:') return false;
  
  // 跨域请求只缓存图片
  if (url.origin !== self.location.origin) {
    return url.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp|ico)$/);
  }
  
  return true;
}

// 缓存优先策略
async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    // 后台更新缓存
    fetch(request)
      .then(response => {
        if (response.ok) {
          cache.put(request, response.clone());
        }
      })
      .catch(() => {});
    
    return cached;
  }
  
  // 缓存未命中，从网络获取
  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

// 网络优先策略（带缓存回退）
async function networkFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

// Stale-While-Revalidate 策略
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  // 发起网络请求更新缓存
  const networkPromise = fetch(request)
    .then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);
  
  // 如果有缓存，立即返回（可能稍旧），同时后台更新
  if (cached) {
    networkPromise; // 触发后台更新
    return cached;
  }
  
  // 没有缓存，等待网络请求
  const networkResponse = await networkPromise;
  if (networkResponse) {
    return networkResponse;
  }
  
  // 网络失败，返回离线页面（如果有）
  return caches.match('/index.html');
}

// 获取事件 - 智能缓存策略
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 跳过不需要缓存的请求
  if (!shouldCache(request, url)) {
    return;
  }
  
  const type = getRequestType(url);
  
  event.respondWith(
    (async () => {
      try {
        switch (type) {
          case 'api':
            // API请求：网络优先，5分钟缓存
            return await networkFirstStrategy(request, API_CACHE);
          
          case 'image':
            // 图片：缓存优先，后台更新
            return await cacheFirstStrategy(request, DYNAMIC_CACHE);
          
          case 'static':
            // 静态资源：Stale-While-Revalidate
            return await staleWhileRevalidateStrategy(request, STATIC_CACHE);
          
          default:
            // 其他动态资源：网络优先
            return await networkFirstStrategy(request, DYNAMIC_CACHE);
        }
      } catch (error) {
        console.warn('[SW] Fetch failed:', error);
        // 返回离线页面
        return caches.match('/index.html');
      }
    })()
  );
});

// 后台同步（用于离线操作）
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Background sync triggered');
    // 可以在这里处理离线队列
  }
});

// 消息处理
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  
  // 缓存清除命令
  if (event.data?.type === 'CLEAR_CACHE') {
    caches.keys().then(names => {
      return Promise.all(names.map(name => caches.delete(name)));
    }).then(() => {
      event.ports[0]?.postMessage({ success: true });
    });
  }
});

console.log('[SW] Service Worker v2 loaded');
