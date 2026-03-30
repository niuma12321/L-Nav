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
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

// ==============================================
// 🎯 类型定义（严格增强版）
// ==============================================
type ToastVariant = 'info' | 'success' | 'warning' | 'error';
type ConfirmVariant = 'default' | 'danger';

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  closeOnOverlayClick?: boolean;
}

interface ConfirmState {
  options: Required<ConfirmOptions>;
  resolve: (value: boolean) => void;
}

interface DialogContextValue {
  notify: (message: string, variant?: ToastVariant, duration?: number) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

// ==============================================
// ⚙️ 常量配置
// ==============================================
const TOAST_DEFAULT_DURATION = 2600;
const TOAST_MAX_COUNT = 5; // 限制最大显示数量，防止堆叠
const TOAST_ANIMATION_DURATION = 300;

// ==============================================
// 🎨 样式 & 图标工具（抽离优化）
// ==============================================
const getToastIcon = (variant: ToastVariant) => {
  switch (variant) {
    case 'success': return CheckCircle2;
    case 'warning': return AlertTriangle;
    case 'error': return AlertCircle;
    default: return Info;
  }
};

const toastToneClass = (variant: ToastVariant) => {
  switch (variant) {
    case 'success': return 'text-emerald-600 dark:text-emerald-400';
    case 'warning': return 'text-amber-600 dark:text-amber-400';
    case 'error': return 'text-red-600 dark:text-red-400';
    default: return 'text-slate-600 dark:text-slate-300';
  }
};

const confirmIconClass = (variant: ConfirmVariant) => {
  return variant === 'danger'
    ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
    : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
};

const confirmButtonClass = (variant: ConfirmVariant) => {
  return variant === 'danger'
    ? 'bg-red-500 hover:bg-red-600 active:bg-red-700'
    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800';
};

// ==============================================
// 🔄 Toast Reducer（状态管理更优雅）
// ==============================================
type ToastAction =
  | { type: 'ADD'; payload: ToastItem }
  | { type: 'REMOVE'; payload: string }
  | { type: 'CLEAR' };

const toastReducer = (state: ToastItem[], action: ToastAction): ToastItem[] => {
  switch (action.type) {
    case 'ADD':
      // 限制最大数量，移除最早的
      const newToasts = [action.payload, ...state].slice(0, TOAST_MAX_COUNT);
      return newToasts;
    case 'REMOVE':
      return state.filter(item => item.id !== action.payload);
    case 'CLEAR':
      return [];
    default:
      return state;
  }
};

// ==============================================
// 🌍 Context 创建
// ==============================================
const DialogContext = createContext<DialogContextValue | null>(null);

// ==============================================
// 🏗️ 核心 Provider
// ==============================================
export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, dispatch] = useReducer(toastReducer, []);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const toastTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // ==============================================
  // 🧹 清理副作用（防止内存泄漏）
  // ==============================================
  useEffect(() => {
    return () => {
      // 卸载时清空所有定时器
      toastTimers.current.forEach(timer => clearTimeout(timer));
      // 关闭弹窗并拒绝Promise
      if (confirmState) {
        confirmState.resolve(false);
      }
    };
  }, [confirmState]);

  // ==============================================
  // ⌨️ 键盘事件监听（ESC关闭弹窗）
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
  // 🎯 Toast 方法
  // ==============================================
  const removeToast = useCallback((id: string) => {
    dispatch({ type: 'REMOVE', payload: id });
    if (toastTimers.current.has(id)) {
      clearTimeout(toastTimers.current.get(id));
      toastTimers.current.delete(id);
    }
  }, []);

  const clearToasts = useCallback(() => {
    dispatch({ type: 'CLEAR' });
    toastTimers.current.forEach(timer => clearTimeout(timer));
    toastTimers.current.clear();
  }, []);

  const notify = useCallback((
    message: string,
    variant: ToastVariant = 'info',
    duration: number = TOAST_DEFAULT_DURATION
  ) => {
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    dispatch({
      type: 'ADD',
      payload: { id, message, variant, duration }
    });

    // 自动关闭定时器
    const timer = setTimeout(() => {
      removeToast(id);
    }, duration);

    toastTimers.current.set(id, timer);
  }, [removeToast]);

  // ==============================================
  // ✅ 确认弹窗方法
  // ==============================================
  const handleResolve = useCallback((value: boolean) => {
    if (!confirmState) return;
    confirmState.resolve(value);
    setConfirmState(null);
  }, [confirmState]);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      // 默认值兜底
      const defaultOptions: Required<ConfirmOptions> = {
        title: '请确认操作',
        confirmText: '确定',
        cancelText: '取消',
        variant: 'default',
        closeOnOverlayClick: true,
        ...options
      };

      setConfirmState({
        options: defaultOptions,
        resolve
      });
    });
  }, []);

  // ==============================================
  // 📦 Context 值
  // ==============================================
  const contextValue = useMemo(() => ({
    notify,
    confirm,
    removeToast,
    clearToasts
  }), [notify, confirm, removeToast, clearToasts]);

  // ==============================================
  // 🎨 渲染
  // ==============================================
  return (
    <DialogContext.Provider value={contextValue}>
      {children}

      {/* ========== Toast 容器 ========== */}
      <div className="fixed top-5 right-5 z-[120] space-y-2 w-full max-w-xs">
        {toasts.map(toast => {
          const Icon = getToastIcon(toast.variant);
          return (
            <div
              key={toast.id}
              // 进入+退出动画
              className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/70 dark:border-slate-700/60 shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-right-2 duration-300"
              style={{ animationFillMode: 'forwards' }}
            >
              <div className={`mt-0.5 shrink-0 ${toastToneClass(toast.variant)}`}>
                <Icon size={16} />
              </div>
              <div className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line flex-1">
                {toast.message}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-2 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                aria-label="关闭提示"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {/* ========== 确认弹窗 ========== */}
      {confirmState && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => confirmState.options.closeOnOverlayClick && handleResolve(false)}
          role="alertdialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/50">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${confirmIconClass(confirmState.options.variant)}`}>
                  {confirmState.options.variant === 'danger' ? <AlertTriangle size={18} /> : <Info size={18} />}
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {confirmState.options.title}
                </h3>
              </div>
            </div>

            <div className="px-6 py-5 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line">
              {confirmState.options.message}
            </div>

            <div className="px-6 pb-6 flex items-center justify-end gap-2">
              <button
                onClick={() => handleResolve(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {confirmState.options.cancelText}
              </button>
              <button
                onClick={() => handleResolve(true)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors shadow-sm ${confirmButtonClass(confirmState.options.variant)}`}
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
export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within DialogProvider');
  }
  return context;
};
