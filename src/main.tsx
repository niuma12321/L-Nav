import React, { StrictMode, Suspense, lazy, useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { DialogProvider } from './components/ui/DialogProvider';
import './index.css';

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

  // 仅在开发环境记录性能数据
  if (ENV.isProduction) {
    window.__PERF_MARKS = window.__PERF_MARKS || [];
    performance.mark('app-entry-start');
  }

// ==============================================
// 🎨 错误边界组件
// ==============================================
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: (error: Error, resetError: () => void) => React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState;
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('应用错误:', error, errorInfo);
    }
  }

  resetError = (): void => {
    (this as any).setState({ hasError: false, error: null });
  };

  render() {
    const self = this as any;
    if (self.state.hasError) {
      if (self.props.fallback) {
        return self.props.fallback(self.state.error, this.resetError);
      }
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
          <div className="text-center p-8 max-w-md bg-white rounded-2xl shadow-xl">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">应用出错了</h1>
            <p className="text-gray-600 mb-2">抱歉，应用遇到了问题，请尝试刷新页面。</p>
            <p className="text-sm text-gray-500 mb-4">错误信息: {self.state.error?.message}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.resetError}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                重试
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                刷新页面
              </button>
            </div>
          </div>
        </div>
      );
    }

    return self.props.children;
  }
}

// ==============================================
// 🎨 加载组件
// ==============================================
const LoadingFallback: React.FC<{ 
  message?: string; 
  showProgress?: boolean; 
  spinnerColor?: string; 
  showLogo?: boolean;
}> = ({ 
  message = "加载中...", 
  showProgress = false, 
  spinnerColor = "blue",
  showLogo = false
}) => {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    if (showProgress) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
      
      return () => clearInterval(interval);
    }
  }, [showProgress]);
  
  const spinnerColors = {
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    green: 'text-green-600',
    red: 'text-red-600',
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
      <div className="text-center p-8">
        {showLogo && (
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full text-white text-2xl font-bold mb-2">
              A
            </div>
            <h1 className="text-2xl font-bold text-gray-800">应用启动中</h1>
          </div>
        )}
        
        <div className="mb-4">
          <div className={`inline-block w-12 h-12 border-4 border-t-transparent rounded-full animate-spin ${spinnerColors[spinnerColor as keyof typeof spinnerColors] || spinnerColors.blue}`} />
        </div>
        
        <p className="text-gray-600 mb-3">{message}</p>
        
        {showProgress && (
          <div className="w-48 mx-auto">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{progress}%</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ==============================================
// 🎨 主题提供者
// ==============================================
const ThemeProvider: React.FC<{
  children: React.ReactNode;
  defaultTheme?: 'light' | 'dark' | 'system';
  storageKey?: string;
}> = ({ 
  children, 
  defaultTheme = 'system',
  storageKey = 'app-theme'
}) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem(storageKey) as 'light' | 'dark' | null;
    
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    
    if (defaultTheme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    return defaultTheme;
  });
  
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem(storageKey, theme);
  }, [theme, storageKey]);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (defaultTheme === 'system') {
        setTheme(mediaQuery.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [defaultTheme]);
  
  const value = {
    theme,
    setTheme,
    toggleTheme: () => setTheme(prev => prev === 'dark' ? 'light' : 'dark'),
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

const ThemeContext = React.createContext({
  theme: 'light' as 'light' | 'dark',
  setTheme: (theme: 'light' | 'dark') => {},
  toggleTheme: () => {},
});

export const useTheme = () => React.useContext(ThemeContext);

// ==============================================
// 🎨 懒加载主应用组件
// ==============================================
const LazyApp = lazy(() => 
  import('./App').then(module => ({ 
    default: module.default 
  }))
  .catch(error => {
    console.error('应用加载失败:', error);
    // 返回一个错误回退组件
    return Promise.resolve({
      default: () => (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-xl font-bold text-red-600 mb-2">应用加载失败</h1>
            <p className="text-gray-600 mb-4">请检查网络连接后刷新页面</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              重新加载
            </button>
          </div>
        </div>
      )
    });
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
      return registration;
    } catch (error) {
      console.warn('⚠️ Service Worker 注册失败:', error);
      return null;
    }
  }
  return null;
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
        
        // 2. 设置页面可见性监听
        const cleanupVisibility = setupPageVisibility();
        
        // 3. 预加载关键资源
        if (ENV.isProduction) {
          const preloadPromises = [
            // 预加载关键字体
            document.fonts.ready.then(() => {}).catch(() => {}),
          ];
          
          await Promise.allSettled(preloadPromises);
        }
        
        // 4. 标记初始化完成
        setIsInitialized(true);
        
        // 仅在生产环境记录性能数据
    if (ENV.isProduction) {
      performance.mark('app-initialized');
      performance.measure('app-initialization', 'app-entry-start', 'app-initialized');
      
      const measure = performance.getEntriesByName('app-initialization')[0];
      if (import.meta.env.DEV) {
        console.log(`🚀 应用初始化耗时: ${Math.round(measure?.duration || 0)}ms`);
      }
    }
        
        return cleanupVisibility;
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('❌ 应用初始化失败:', error);
        }
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
      if (import.meta.env.DEV) {
        console.log('🔧 开发工具:', {
          env: ENV,
          performance: performance.getEntriesByType('navigation')[0],
        });
      }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 处理离线/在线状态
  useEffect(() => {
    const handleOnline = () => {
      if (import.meta.env.DEV) {
        console.log('🌐 网络已恢复');
      }
      document.documentElement.classList.remove('offline');
    };
    
    const handleOffline = () => {
      if (import.meta.env.DEV) {
        console.warn('📴 网络已断开');
      }
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
      fallback={(error: Error | null, resetError: () => void) => (
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
      <ThemeProvider defaultTheme="system" storageKey="app-theme">
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
            <LazyApp />
          </Suspense>
        </DialogProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

// ==============================================
// 🚀 应用启动函数
// ==============================================
function startApplication() {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
  if (import.meta.env.DEV) {
    console.error('❌ 找不到根元素 #root');
  }
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
    
    // 仅在生产环境记录渲染完成
    if (ENV.isProduction) {
      performance.mark('app-rendered');
      performance.measure('app-render', 'app-initialized', 'app-rendered');
      
      const renderMeasure = performance.getEntriesByName('app-render')[0];
      if (import.meta.env.DEV) {
        console.log(`🎨 应用渲染耗时: ${Math.round(renderMeasure?.duration || 0)}ms`);
      }
    }
    
  } catch (error: any) {
  if (import.meta.env.DEV) {
    console.error('❌ React 渲染失败:', error);
  }
    
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
    ];
    
    for (const api of requiredAPIs) {
      if (!(api in window)) {
  if (import.meta.env.DEV) {
    console.warn(`缺少 API: ${api}`);
  }
        return false;
      }
    }
    
    return true;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('⚠️ 浏览器不兼容:', error);
    }
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
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
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
}

// 导出供测试使用
export { ENV, startApplication };
