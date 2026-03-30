import React, { StrictMode, Suspense, lazy, useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { DialogProvider } from './components/ui/DialogProvider';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { PerformanceMonitor } from './components/ui/PerformanceMonitor';
import { LoadingFallback } from './components/ui/LoadingFallback';
import { AnalyticsProvider } from './hooks/useAnalytics';
import { ThemeProvider } from './hooks/useTheme';
import { PWAInstallPrompt } from './components/ui/PWAInstallPrompt';
import './index.css';
import './styles/tailwind.css';

// ==============================================
// 🎯 环境检测与配置
// ==============================================
const ENV = {
  isDevelopment: import.meta.env.MODE === 'development',
  isProduction: import.meta.env.MODE === 'production',
  isTest: import.meta.env.MODE === 'test',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  BUILD_TIMESTAMP: import.meta.env.VITE_BUILD_TIMESTAMP || new Date().toISOString(),
};

// 性能测量标记
if (ENV.isProduction) {
  window.__PERF_MARKS = window.__PERF_MARKS || [];
  performance.mark('app-entry-start');
}

// ==============================================
// 🎨 懒加载主应用组件
// ==============================================
// 使用懒加载提升首屏性能
const LazyApp = lazy(() => 
  import('./App').then(module => ({ 
    default: module.default 
  }))
  .catch(error => {
    console.error('应用加载失败:', error);
    // 返回一个错误回退组件
    return import('./components/ui/AppErrorFallback').then(module => ({
      default: () => module.AppErrorFallback({ error })
    }));
  })
);

// ==============================================
// 🔧 工具函数
// ==============================================
/**
 * 注册 Service Worker (PWA 支持)
 */
async function registerServiceWorker() {
  if ('serviceWorker' in navigator && ENV.isProduction) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      console.log('✅ Service Worker 注册成功:', registration.scope);
      
      // 监听 Service Worker 更新
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 新版本可用，请刷新页面');
              // 这里可以显示更新提示
            }
          });
        }
      });
      
      return registration;
    } catch (error) {
      console.warn('⚠️ Service Worker 注册失败:', error);
      return null;
    }
  }
  return null;
}

/**
 * 性能监控初始化
 */
function initializePerformanceMonitoring() {
  if (ENV.isDevelopment) {
    // 开发环境性能监控
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log(`📊 性能指标 [${entry.name}]:`, {
          duration: Math.round(entry.duration),
          startTime: Math.round(entry.startTime),
          entryType: entry.entryType,
        });
      }
    });
    
    try {
      observer.observe({ entryTypes: ['paint', 'measure', 'resource', 'navigation'] });
    } catch (e) {
      console.warn('性能监控不可用:', e);
    }
  }
}

/**
 * 处理页面可见性变化
 */
function setupPageVisibility() {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      document.title = '👋 回来看看';
    } else {
      document.title = ENV.isDevelopment ? '开发模式' : '我的应用';
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}

// ==============================================
// 🎮 根组件包装器
// ==============================================
const AppWrapper: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasError, setHasError] = useState(false);
  const swRef = useRef<ServiceWorkerRegistration | null>(null);

  // 应用初始化
  useEffect(() => {
    const initialize = async () => {
      try {
        // 1. 注册 Service Worker
        swRef.current = await registerServiceWorker();
        
        // 2. 初始化性能监控
        initializePerformanceMonitoring();
        
        // 3. 设置页面可见性监听
        const cleanupVisibility = setupPageVisibility();
        
        // 4. 预加载关键资源
        if (ENV.isProduction) {
          const preloadPromises = [
            // 预加载关键字体
            document.fonts.ready,
            // 预加载关键图片
            ...document.querySelectorAll<HTMLLinkElement>('link[rel="preload"]')
              .map(link => new Promise(resolve => {
                link.addEventListener('load', resolve);
                link.addEventListener('error', resolve);
              }))
          ];
          
          await Promise.allSettled(preloadPromises);
        }
        
        // 5. 标记初始化完成
        setIsInitialized(true);
        
        // 6. 记录性能数据
        if (ENV.isProduction) {
          performance.mark('app-initialized');
          performance.measure('app-initialization', 'app-entry-start', 'app-initialized');
          
          const measure = performance.getEntriesByName('app-initialization')[0];
          console.log(`🚀 应用初始化耗时: ${Math.round(measure?.duration || 0)}ms`);
          
          // 发送性能数据到分析平台
          if (window.analytics) {
            window.analytics.track('app_performance', {
              init_duration: Math.round(measure?.duration || 0),
              timestamp: Date.now(),
            });
          }
        }
        
        return cleanupVisibility;
      } catch (error) {
        console.error('❌ 应用初始化失败:', error);
        setHasError(true);
        return () => {};
      }
    };

    const cleanup = initialize();
    return () => {
      cleanup.then(cleanupFn => cleanupFn && cleanupFn());
    };
  }, []);

  // 处理键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Shift + D: 切换开发工具
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        console.log('🔧 开发工具:', {
          env: ENV,
          performance: performance.getEntriesByType('navigation')[0],
          memory: (performance as any).memory,
        });
      }
      
      // Ctrl + Alt + R: 重新加载
      if (e.ctrlKey && e.altKey && e.key === 'r') {
        e.preventDefault();
        location.reload();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 处理离线/在线状态
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 网络已恢复');
      document.documentElement.classList.remove('offline');
    };
    
    const handleOffline = () => {
      console.warn('📴 网络已断开');
      document.documentElement.classList.add('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // 初始状态
    if (!navigator.onLine) {
      document.documentElement.classList.add('offline');
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="text-center p-8 max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">初始化失败</h1>
          <p className="text-gray-600 mb-4">应用启动时遇到问题，请尝试刷新页面。</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return <LoadingFallback 
      message="应用初始化中..." 
      showProgress 
      spinnerColor="blue" 
    />;
  }

  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="p-4">
          <h2 className="text-xl font-bold text-red-600 mb-2">应用崩溃了</h2>
          <p className="text-gray-600 mb-4">{error?.message}</p>
          <button
            onClick={resetError}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            重试
          </button>
        </div>
      )}
    >
      <AnalyticsProvider 
        trackingId={import.meta.env.VITE_GA_TRACKING_ID}
        enabled={ENV.isProduction}
      >
        <ThemeProvider
          defaultTheme="system"
          storageKey="app-theme"
        >
          <DialogProvider
            toastPosition="top-right"
            maxToasts={5}
          >
            <Suspense
              fallback={
                <LoadingFallback
                  message="加载应用中..."
                  showLogo
                  spinnerColor="purple"
                />
              }
            >
              {ENV.isDevelopment && <PerformanceMonitor />}
              {ENV.isProduction && <PWAInstallPrompt />}
              <LazyApp />
            </Suspense>
          </DialogProvider>
        </ThemeProvider>
      </AnalyticsProvider>
    </ErrorBoundary>
  );
};

// ==============================================
// 🚀 应用启动函数
// ==============================================
function startApplication() {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error('❌ 找不到根元素 #root');
    document.body.innerHTML = `
      <div style="padding: 20px; font-family: system-ui; background: #f0f0f0; min-height: 100vh;">
        <h1 style="color: #dc2626;">启动失败</h1>
        <p>找不到根元素 #root，请检查 HTML 结构。</p>
        <p>HTML 中必须有: <code>&lt;div id="root"&gt;&lt;/div&gt;</code></p>
      </div>
    `;
    return;
  }
  
  // 添加全局样式类
  rootElement.className = 'app-root';
  document.documentElement.className = ENV.isDevelopment ? 'development' : 'production';
  
  // 添加数据属性
  rootElement.setAttribute('data-version', ENV.APP_VERSION);
  rootElement.setAttribute('data-build', ENV.BUILD_TIMESTAMP);
  rootElement.setAttribute('data-env', import.meta.env.MODE);
  
  try {
    const root = ReactDOM.createRoot(rootElement);
    
    // 开发环境下检查 StrictMode
    const shouldUseStrictMode = ENV.isDevelopment;
    
    const AppComponent = shouldUseStrictMode ? (
      <StrictMode>
        <AppWrapper />
      </StrictMode>
    ) : (
      <AppWrapper />
    );
    
    // 渲染应用
    root.render(AppComponent);
    
    // 记录渲染完成
    if (ENV.isProduction) {
      performance.mark('app-rendered');
      performance.measure('app-render', 'app-initialized', 'app-rendered');
      
      const renderMeasure = performance.getEntriesByName('app-render')[0];
      console.log(`🎨 应用渲染耗时: ${Math.round(renderMeasure?.duration || 0)}ms`);
    }
    
    // 清理性能标记
    setTimeout(() => {
      performance.clearMarks();
      performance.clearMeasures();
    }, 10000);
    
  } catch (error) {
    console.error('❌ React 渲染失败:', error);
    
    // 优雅降级
    rootElement.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 20px;
        text-align: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      ">
        <h1 style="font-size: 2.5rem; margin-bottom: 1rem;">😢 出错了</h1>
        <p style="margin-bottom: 2rem; max-width: 500px;">
          应用启动时遇到问题，请尝试刷新页面或联系支持。
        </p>
        <div style="display: flex; gap: 1rem;">
          <button 
            onclick="location.reload()"
            style="
              background: white;
              color: #667eea;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-weight: bold;
              cursor: pointer;
            "
          >
            刷新页面
          </button>
          <button 
            onclick="console.log('Error:', ${JSON.stringify(error?.toString())})"
            style="
              background: transparent;
              color: white;
              border: 2px solid white;
              padding: 12px 24px;
              border-radius: 8px;
              font-weight: bold;
              cursor: pointer;
            "
          >
            查看错误
          </button>
        </div>
      </div>
    `;
  }
}

// ==============================================
// 📦 类型扩展
// ==============================================
declare global {
  interface Window {
    __PERF_MARKS?: string[];
    analytics?: {
      track: (event: string, data?: Record<string, any>) => void;
    };
  }
  
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }
}

// ==============================================
// 🎬 启动应用
// ==============================================
// 检查浏览器兼容性
const isCompatibleBrowser = (() => {
  try {
    // 检查必要的 API
    const requiredAPIs = [
      'Promise',
      'fetch',
      'Map',
      'Set',
      'URLSearchParams',
      'Object.assign',
      'Array.from',
    ];
    
    for (const api of requiredAPIs) {
      if (!(api in window)) {
        throw new Error(`缺少 API: ${api}`);
      }
    }
    
    // 检查 ES6 特性
    const testCode = `
      class Test {}
      const arrow = () => {};
      const { a, ...rest } = { a: 1, b: 2 };
      const arr = [1, 2, 3];
      const hasTwo = arr.includes(2);
    `;
    
    new Function(testCode)();
    return true;
  } catch (error) {
    console.warn('⚠️ 浏览器不兼容:', error);
    return false;
  }
})();

if (isCompatibleBrowser) {
  // 延迟启动，让浏览器先处理高优先级任务
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApplication);
  } else {
    // DOM 已经加载完成
    setTimeout(startApplication, 0);
  }
} else {
  // 显示浏览器不兼容提示
  document.getElementById('root')!.innerHTML = `
    <div style="
      padding: 40px;
      font-family: system-ui;
      max-width: 600px;
      margin: 0 auto;
      line-height: 1.6;
    ">
      <h1 style="color: #dc2626; margin-bottom: 20px;">⚠️ 浏览器不兼容</h1>
      <p style="margin-bottom: 20px;">
        您的浏览器版本过低，无法正常运行此应用。
        请升级到最新版本的现代浏览器，如：
      </p>
      <ul style="margin-bottom: 30px;">
        <li>Chrome 80+</li>
        <li>Firefox 75+</li>
        <li>Safari 13+</li>
        <li>Edge 80+</li>
      </ul>
      <p>
        升级后，请
        <a href="#" onclick="location.reload()" style="color: #2563eb;">
          刷新页面
        </a>
        重试。
      </p>
    </div>
  `;
}

// 导出供测试使用
export { ENV, startApplication };
