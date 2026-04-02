import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useReducer,
  useEffect,
  useRef
} from 'react';
import { 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  X,
  Loader2,
  Bell,
  BellOff,
  Check,
  Clock
} from 'lucide-react';

// ==============================================
// 🎯 类型定义（严格增强版）
// ==============================================
type ToastVariant = 'info' | 'success' | 'warning' | 'error' | 'loading';
type ConfirmVariant = 'default' | 'danger' | 'warning' | 'success';
type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

interface ToastItem {
  id: string;
  message: string | React.ReactNode;
  variant: ToastVariant;
  duration?: number;
  title?: string;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  persistent?: boolean; // 不会自动消失
  createdAt: number;
}

interface ConfirmOptions {
  title?: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  closeOnOverlayClick?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  showCloseButton?: boolean;
  icon?: React.ReactNode;
  destructive?: boolean;
}

interface ConfirmState {
  options: Required<ConfirmOptions>;
  resolve: (value: boolean) => void;
  reject: (reason?: any) => void;
}

interface DialogContextValue {
  // Toast 相关
  notify: (message: string, variant?: ToastVariant, options?: Partial<ToastItem>) => string;
  success: (message: string, options?: Partial<ToastItem>) => string;
  error: (message: string, options?: Partial<ToastItem>) => string;
  warning: (message: string, options?: Partial<ToastItem>) => string;
  info: (message: string, options?: Partial<ToastItem>) => string;
  loading: (message: string, options?: Partial<ToastItem>) => string;
  
  // 确认对话框
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (options: Omit<ConfirmOptions, 'cancelText' | 'onCancel'>) => Promise<void>;
  
  // Toast 管理
  removeToast: (id: string) => void;
  clearToasts: () => void;
  updateToast: (id: string, updates: Partial<ToastItem>) => void;
  
  // 工具方法
  dismissAll: () => void;
  pauseAll: () => void;
  resumeAll: () => void;
  
  // 状态
  isToastPaused: boolean;
  activeToasts: ToastItem[];
}

// ==============================================
// ⚙️ 常量配置
// ==============================================
const DEFAULT_CONFIG = {
  toast: {
    maxCount: 5,
    defaultDuration: 3000,
    loadingDuration: 0, // loading 类型默认不自动关闭
    position: 'top-right' as ToastPosition,
    animationDuration: 300,
    pauseOnHover: true,
    pauseOnWindowBlur: true,
  },
  confirm: {
    defaultTitle: '请确认操作',
    confirmText: '确定',
    cancelText: '取消',
    variant: 'default' as ConfirmVariant,
  },
} as const;

// ==============================================
// 🎨 样式 & 图标工具
// ==============================================
const getToastIcon = (variant: ToastVariant) => {
  switch (variant) {
    case 'success': return CheckCircle2;
    case 'warning': return AlertTriangle;
    case 'error': return AlertCircle;
    case 'loading': return Loader2;
    default: return Info;
  }
};

const getVariantClasses = (variant: ToastVariant) => {
  const base = "rounded-2xl border shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-right-2 duration-300";
  
  switch (variant) {
    case 'success':
      return `${base} bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-200`;
    case 'warning':
      return `${base} bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-200`;
    case 'error':
      return `${base} bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-200`;
    case 'loading':
      return `${base} bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50 text-blue-800 dark:text-blue-200`;
    default:
      return `${base} bg-white/95 dark:bg-slate-900/95 border-slate-200/70 dark:border-slate-700/60 text-slate-800 dark:text-slate-200`;
  }
};

const getVariantIconClass = (variant: ToastVariant) => {
  switch (variant) {
    case 'success': return "text-emerald-600 dark:text-emerald-400";
    case 'warning': return "text-amber-600 dark:text-amber-400";
    case 'error': return "text-red-600 dark:text-red-400";
    case 'loading': return "text-blue-600 dark:text-blue-400 animate-spin";
    default: return "text-slate-600 dark:text-slate-300";
  }
};

const getConfirmConfig = (variant: ConfirmVariant) => {
  switch (variant) {
    case 'danger':
      return {
        iconClass: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
        buttonClass: "bg-red-600 hover:bg-red-700 active:bg-red-800 focus:ring-red-500",
        icon: <AlertTriangle size={20} />,
      };
    case 'warning':
      return {
        iconClass: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
        buttonClass: "bg-amber-600 hover:bg-amber-700 active:bg-amber-800 focus:ring-amber-500",
        icon: <AlertTriangle size={20} />,
      };
    case 'success':
      return {
        iconClass: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
        buttonClass: "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 focus:ring-emerald-500",
        icon: <CheckCircle2 size={20} />,
      };
    default:
      return {
        iconClass: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
        buttonClass: "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-500",
        icon: <Info size={20} />,
      };
  }
};

// ==============================================
// 🔄 Toast Reducer
// ==============================================
type ToastAction =
  | { type: 'ADD'; payload: ToastItem }
  | { type: 'REMOVE'; payload: string }
  | { type: 'UPDATE'; payload: { id: string; updates: Partial<ToastItem> } }
  | { type: 'CLEAR' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' };

interface ToastState {
  items: ToastItem[];
  isPaused: boolean;
}

const toastReducer = (state: ToastState, action: ToastAction): ToastState => {
  switch (action.type) {
    case 'ADD':
      const newItems = [action.payload, ...state.items].slice(0, DEFAULT_CONFIG.toast.maxCount);
      return { ...state, items: newItems };
      
    case 'REMOVE':
      return { 
        ...state, 
        items: state.items.filter(item => item.id !== action.payload) 
      };
      
    case 'UPDATE':
      return {
        ...state,
        items: state.items.map(item => 
          item.id === action.payload.id 
            ? { ...item, ...action.payload.updates }
            : item
        )
      };
      
    case 'CLEAR':
      return { ...state, items: [] };
      
    case 'PAUSE':
      return { ...state, isPaused: true };
      
    case 'RESUME':
      return { ...state, isPaused: false };
      
    default:
      return state;
  }
};

// ==============================================
// 🌍 Context 创建
// ==============================================
const DialogContext = createContext<DialogContextValue | null>(null);

// ==============================================
// 🏗️ ToastItem 组件（单独拆分为组件优化性能）
// ==============================================
const ToastItemComponent: React.FC<{
  toast: ToastItem;
  onClose: (id: string) => void;
  onAction?: (id: string, onClick: () => void) => void;
  isPaused: boolean;
}> = React.memo(({ toast, onClose, onAction, isPaused }) => {
  const [progress, setProgress] = useState(100);
  const progressInterval = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTime = useRef<number>(Date.now());
  const elapsedRef = useRef<number>(0);
  const Icon = getToastIcon(toast.variant);
  const isPersistent = toast.persistent || toast.variant === 'loading';

  // 进度条动画
  useEffect(() => {
    if (isPersistent || isPaused || !toast.duration || toast.duration <= 0) {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
      return;
    }

    const startProgress = () => {
      const duration = toast.duration!;
      const start = Date.now();
      
      const updateProgress = () => {
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, duration - elapsed);
        const percentage = (remaining / duration) * 100;
        setProgress(percentage);
        
        if (remaining <= 0) {
          onClose(toast.id);
        }
      };

      progressInterval.current = setInterval(updateProgress, 50);
      updateProgress();
    };

    if (!isPaused) {
      startProgress();
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [toast.id, toast.duration, isPersistent, isPaused, onClose]);

  // 处理暂停/恢复
  useEffect(() => {
    if (isPaused && progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
      elapsedRef.current = Date.now() - startTime.current;
    } else if (!isPaused && !isPersistent && toast.duration && toast.duration > 0) {
      const remaining = toast.duration - elapsedRef.current;
      if (remaining > 0) {
        const timer = setTimeout(() => {
          onClose(toast.id);
        }, remaining);
        
        return () => clearTimeout(timer);
      } else {
        onClose(toast.id);
      }
    }
  }, [isPaused, toast.id, toast.duration, isPersistent, onClose]);

  const handleClose = () => {
    onClose(toast.id);
    toast.onClose?.();
  };

  const handleAction = () => {
    if (toast.action) {
      toast.action.onClick();
      onClose(toast.id);
    }
  };

  return (
    <div
      className={`relative overflow-hidden ${getVariantClasses(toast.variant)}`}
      onMouseEnter={() => toast.variant === 'loading' && handleClose()}
    >
      {/* 进度条 */}
      {!isPersistent && toast.duration && toast.duration > 0 && (
        <div 
          className="absolute bottom-0 left-0 h-1 bg-current/20 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      )}

      <div className="flex items-start gap-3 p-4">
        <div className={`mt-0.5 shrink-0 ${getVariantIconClass(toast.variant)}`}>
          <Icon size={18} />
        </div>
        
        <div className="flex-1 min-w-0">
          {toast.title && (
            <div className="font-semibold text-sm mb-1">
              {toast.title}
            </div>
          )}
          <div className="text-sm whitespace-pre-line break-words">
            {toast.message}
          </div>
          
          {toast.action && (
            <button
              onClick={handleAction}
              className="mt-2 text-sm font-medium text-current hover:opacity-80 transition-opacity"
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {!isPersistent && (
          <button
            onClick={handleClose}
            className="ml-2 p-1 rounded-lg text-current/50 hover:text-current hover:bg-current/10 transition-colors shrink-0"
            aria-label="关闭提示"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
});

ToastItemComponent.displayName = 'ToastItemComponent';

// ==============================================
// 🏗️ 核心 Provider
// ==============================================
export const DialogProvider: React.FC<{ 
  children: React.ReactNode;
  config?: {
    toastPosition?: ToastPosition;
    maxToasts?: number;
  };
}> = ({ children, config }) => {
  const [toastState, dispatch] = useReducer(toastReducer, { 
    items: [], 
    isPaused: false 
  });
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // 合并配置
  const mergedConfig = useMemo(() => ({
    toast: {
      ...DEFAULT_CONFIG.toast,
      ...config,
      position: config?.toastPosition || DEFAULT_CONFIG.toast.position,
      maxCount: config?.maxToasts || DEFAULT_CONFIG.toast.maxCount,
    },
    confirm: DEFAULT_CONFIG.confirm,
  }), [config]);

  // ==============================================
  // 🧹 清理副作用
  // ==============================================
  useEffect(() => {
    return () => {
      timers.current.forEach(timer => clearTimeout(timer));
      timers.current.clear();
      if (confirmState) {
        confirmState.reject(new Error('DialogProvider 被卸载'));
      }
    };
  }, [confirmState]);

  // ==============================================
  // ⌨️ 键盘事件监听
  // ==============================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && confirmState) {
        handleResolve(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmState]);

  // ==============================================
  // 📊 窗口失焦/获焦处理
  // ==============================================
  useEffect(() => {
    if (!mergedConfig.toast.pauseOnWindowBlur) return;

    const handleBlur = () => {
      if (toastState.items.some(t => !t.persistent)) {
        dispatch({ type: 'PAUSE' });
      }
    };

    const handleFocus = () => {
      dispatch({ type: 'RESUME' });
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [mergedConfig.toast.pauseOnWindowBlur, toastState.items]);

  // ==============================================
  // 🎯 Toast 核心方法
  // ==============================================
  const removeToast = useCallback((id: string) => {
    if (timers.current.has(id)) {
      clearTimeout(timers.current.get(id));
      timers.current.delete(id);
    }
    dispatch({ type: 'REMOVE', payload: id });
  }, []);

  const clearToasts = useCallback(() => {
    timers.current.forEach(timer => clearTimeout(timer));
    timers.current.clear();
    dispatch({ type: 'CLEAR' });
  }, []);

  const updateToast = useCallback((id: string, updates: Partial<ToastItem>) => {
    dispatch({ type: 'UPDATE', payload: { id, updates } });
  }, []);

  const createToast = useCallback((
    message: string | React.ReactNode,
    variant: ToastVariant = 'info',
    options: Partial<ToastItem> = {}
  ): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const defaultDuration = variant === 'loading' 
      ? DEFAULT_CONFIG.toast.loadingDuration 
      : DEFAULT_CONFIG.toast.defaultDuration;
    
    const toast: ToastItem = {
      id,
      message,
      variant,
      duration: options.duration ?? defaultDuration,
      title: options.title,
      onClose: options.onClose,
      action: options.action,
      persistent: options.persistent || variant === 'loading',
      createdAt: Date.now(),
    };

    dispatch({ type: 'ADD', payload: toast });

    // 设置自动关闭定时器
    if (!toast.persistent && toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        removeToast(id);
        options.onClose?.();
      }, toast.duration);

      timers.current.set(id, timer);
    }

    return id;
  }, [removeToast]);

  // ==============================================
  // 🎯 快捷方法
  // ==============================================
  const notify = useCallback((message: string, variant: ToastVariant = 'info', options: Partial<ToastItem> = {}) => {
    return createToast(message, variant, options);
  }, [createToast]);

  const success = useCallback((message: string, options: Partial<ToastItem> = {}) => {
    return createToast(message, 'success', options);
  }, [createToast]);

  const error = useCallback((message: string, options: Partial<ToastItem> = {}) => {
    return createToast(message, 'error', options);
  }, [createToast]);

  const warning = useCallback((message: string, options: Partial<ToastItem> = {}) => {
    return createToast(message, 'warning', options);
  }, [createToast]);

  const info = useCallback((message: string, options: Partial<ToastItem> = {}) => {
    return createToast(message, 'info', options);
  }, [createToast]);

  const loading = useCallback((message: string, options: Partial<ToastItem> = {}) => {
    return createToast(message, 'loading', options);
  }, [createToast]);

  const dismissAll = useCallback(() => {
    clearToasts();
  }, [clearToasts]);

  const pauseAll = useCallback(() => {
    dispatch({ type: 'PAUSE' });
  }, []);

  const resumeAll = useCallback(() => {
    dispatch({ type: 'RESUME' });
  }, []);

  // ==============================================
  // ✅ 确认弹窗方法
  // ==============================================
  const handleResolve = useCallback((value: boolean) => {
    if (!confirmState) return;
    
    if (value) {
      confirmState.options.onConfirm?.();
      confirmState.resolve(true);
    } else {
      confirmState.options.onCancel?.();
      confirmState.resolve(false);
    }
    
    setConfirmState(null);
  }, [confirmState]);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve, reject) => {
      const defaultOptions: Required<ConfirmOptions> = {
        title: mergedConfig.confirm.defaultTitle,
        confirmText: mergedConfig.confirm.confirmText,
        cancelText: mergedConfig.confirm.cancelText,
        variant: mergedConfig.confirm.variant,
        closeOnOverlayClick: true,
        showCloseButton: true,
        icon: undefined,
        destructive: false,
        onConfirm: undefined,
        onCancel: undefined,
        ...options,
        message: options.message,
      };

      setConfirmState({
        options: defaultOptions,
        resolve,
        reject,
      });
    });
  }, [mergedConfig.confirm]);

  const alert = useCallback((options: Omit<ConfirmOptions, 'cancelText' | 'onCancel'>): Promise<void> => {
    return new Promise<void>((resolve) => {
      confirm({
        ...options,
        cancelText: '',
        onConfirm: () => {
          options.onConfirm?.();
          resolve();
        },
        onCancel: () => resolve(),
      });
    });
  }, [confirm]);

  // ==============================================
  // 📦 Context 值
  // ==============================================
  const contextValue = useMemo<DialogContextValue>(() => ({
    // Toast
    notify,
    success,
    error,
    warning,
    info,
    loading,
    
    // Confirm
    confirm,
    alert,
    
    // Management
    removeToast,
    clearToasts,
    updateToast,
    dismissAll,
    pauseAll,
    resumeAll,
    
    // State
    isToastPaused: toastState.isPaused,
    activeToasts: toastState.items,
  }), [
    notify, success, error, warning, info, loading,
    confirm, alert,
    removeToast, clearToasts, updateToast,
    dismissAll, pauseAll, resumeAll,
    toastState.isPaused, toastState.items
  ]);

  // ==============================================
  // 🎨 Toast 容器样式
  // ==============================================
  const getToastContainerStyle = () => {
    const base = "fixed z-[9999] space-y-2 w-full max-w-sm p-4";
    
    switch (mergedConfig.toast.position) {
      case 'top-right':
        return `${base} top-0 right-0`;
      case 'top-left':
        return `${base} top-0 left-0`;
      case 'bottom-right':
        return `${base} bottom-0 right-0`;
      case 'bottom-left':
        return `${base} bottom-0 left-0`;
      case 'top-center':
        return `${base} top-0 left-1/2 transform -translate-x-1/2`;
      case 'bottom-center':
        return `${base} bottom-0 left-1/2 transform -translate-x-1/2`;
      default:
        return `${base} top-0 right-0`;
    }
  };

  // ==============================================
  // 🎨 渲染
  // ==============================================
  return (
    <DialogContext.Provider value={contextValue}>
      {children}

      {/* ========== Toast 容器 ========== */}
      {toastState.items.length > 0 && (
        <div className={getToastContainerStyle()}>
          {toastState.items.map(toast => (
            <ToastItemComponent
              key={toast.id}
              toast={toast}
              onClose={removeToast}
              isPaused={toastState.isPaused}
              onAction={(id, onClick) => {
                onClick();
                removeToast(id);
              }}
            />
          ))}
        </div>
      )}

      {/* ========== 确认弹窗 ========== */}
      {confirmState && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => confirmState.options.closeOnOverlayClick && handleResolve(false)}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          aria-describedby="dialog-description"
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* 头部 */}
            <div className="px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {confirmState.options.icon || (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      getConfirmConfig(confirmState.options.variant).iconClass
                    }`}>
                      {getConfirmConfig(confirmState.options.variant).icon}
                    </div>
                  )}
                  <div>
                    <h3 
                      id="dialog-title"
                      className="text-lg font-semibold text-slate-900 dark:text-slate-100"
                    >
                      {confirmState.options.title}
                    </h3>
                  </div>
                </div>
                
                {confirmState.options.showCloseButton && (
                  <button
                    onClick={() => handleResolve(false)}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    aria-label="关闭"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>

            {/* 内容 */}
            <div 
              id="dialog-description"
              className="px-6 pb-5 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line break-words"
            >
              {confirmState.options.message}
            </div>

            {/* 操作按钮 */}
            <div className="px-6 pb-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              {confirmState.options.cancelText && (
                <button
                  onClick={() => handleResolve(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-w-[80px]"
                >
                  {confirmState.options.cancelText}
                </button>
              )}
              <button
                onClick={() => handleResolve(true)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 min-w-[80px] ${
                  getConfirmConfig(confirmState.options.variant).buttonClass
                } ${confirmState.options.destructive ? '!bg-red-600 hover:!bg-red-700' : ''}`}
                autoFocus
              >
                {confirmState.options.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
};

// ==============================================
// 🚀 自定义 Hook
// ==============================================
export const useDialog = (): DialogContextValue => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog 必须在 DialogProvider 内部使用');
  }
  return context;
};

// ==============================================
// 🔧 工具函数导出
// ==============================================
export const dialogUtils = {
  // 创建不同类型的 Toast
  createToast: (
    message: string,
    variant: ToastVariant = 'info',
    duration?: number
  ) => {
    if (import.meta.env.DEV) {
      console.warn('请通过 useDialog hook 使用对话框功能');
    }
    return '';
  },
  
  // 验证消息格式
  validateMessage: (message: any): message is string => {
    return typeof message === 'string' || React.isValidElement(message);
  },
  
  // 防抖通知
  debouncedNotify: (() => {
    let lastCall = 0;
    return (fn: () => void, delay: number = 1000) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        fn();
      }
    };
  })(),
};

export default DialogProvider;
