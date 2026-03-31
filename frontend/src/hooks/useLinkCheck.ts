import { useState, useCallback, useRef } from 'react';

export interface LinkStatus {
  url: string;
  status: 'checking' | 'online' | 'offline' | 'error' | 'timeout';
  statusCode?: number;
  lastChecked: number;
  error?: string;
}

export interface UseLinkCheckReturn {
  statuses: Record<string, LinkStatus>;
  checkLink: (url: string) => Promise<LinkStatus>;
  checkLinks: (urls: string[]) => Promise<void>;
  isChecking: boolean;
  progress: { current: number; total: number };
}

const CHECK_TIMEOUT = 10000; // 10秒超时
const BATCH_SIZE = 5; // 并发检查数量

export function useLinkCheck(): UseLinkCheckReturn {
  const [statuses, setStatuses] = useState<Record<string, LinkStatus>>({});
  const [isChecking, setIsChecking] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const abortControllersRef = useRef<AbortController[]>([]);

  // 清理所有正在进行的请求
  const cleanup = useCallback(() => {
    abortControllersRef.current.forEach(controller => controller.abort());
    abortControllersRef.current = [];
  }, []);

  // 检查单个链接
  const checkLink = useCallback(async (url: string): Promise<LinkStatus> => {
    // 创建新的 AbortController
    const controller = new AbortController();
    abortControllersRef.current.push(controller);

    // 初始化为检查中状态
    const checkingStatus: LinkStatus = {
      url,
      status: 'checking',
      lastChecked: Date.now()
    };
    setStatuses(prev => ({ ...prev, [url]: checkingStatus }));

    try {
      // 使用 fetch 检查链接（通过代理避免CORS问题）
      // 使用 no-cors 模式，因为我们只关心链接是否可达
      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal,
        cache: 'no-cache',
        redirect: 'follow',
        headers: {
          'Accept': '*/*',
          'User-Agent': 'Mozilla/5.0 (compatible; Y-Nav/1.0; Link Checker)'
        }
      });

      // 移除控制器
      const index = abortControllersRef.current.indexOf(controller);
      if (index > -1) abortControllersRef.current.splice(index, 1);

      // no-cors 模式会返回 opaque 响应，我们只能知道请求是否成功
      const status: LinkStatus = {
        url,
        status: 'online',
        lastChecked: Date.now()
      };

      setStatuses(prev => ({ ...prev, [url]: status }));
      return status;

    } catch (error) {
      // 移除控制器
      const index = abortControllersRef.current.indexOf(controller);
      if (index > -1) abortControllersRef.current.splice(index, 1);

      // 判断错误类型
      let status: LinkStatus['status'] = 'error';
      let errorMessage: string | undefined;

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          status = 'timeout';
          errorMessage = '请求超时';
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          status = 'offline';
          errorMessage = '无法连接到服务器';
        } else {
          errorMessage = error.message;
        }
      }

      const statusObj: LinkStatus = {
        url,
        status,
        lastChecked: Date.now(),
        error: errorMessage
      };

      setStatuses(prev => ({ ...prev, [url]: statusObj }));
      return statusObj;
    }
  }, []);

  // 批量检查链接
  const checkLinks = useCallback(async (urls: string[]) => {
    // 清理之前的检查
    cleanup();
    
    setIsChecking(true);
    setProgress({ current: 0, total: urls.length });

    // 过滤掉重复和无效的 URL
    const uniqueUrls = [...new Set(urls)].filter(url => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    });

    // 分批处理
    const batches: string[][] = [];
    for (let i = 0; i < uniqueUrls.length; i += BATCH_SIZE) {
      batches.push(uniqueUrls.slice(i, i + BATCH_SIZE));
    }

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      // 并发检查当前批次
      await Promise.all(
        batch.map(async (url) => {
          await checkLink(url);
          setProgress(prev => ({ ...prev, current: prev.current + 1 }));
        })
      );

      // 批次间延迟，避免请求过快
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setIsChecking(false);
  }, [checkLink, cleanup]);

  return {
    statuses,
    checkLink,
    checkLinks,
    isChecking,
    progress
  };
}

// 获取状态显示配置
export function getStatusConfig(status: LinkStatus['status']) {
  switch (status) {
    case 'online':
      return {
        color: 'bg-green-500',
        textColor: 'text-green-500',
        label: '正常',
        icon: 'CheckCircle'
      };
    case 'offline':
      return {
        color: 'bg-red-500',
        textColor: 'text-red-500',
        label: '离线',
        icon: 'XCircle'
      };
    case 'timeout':
      return {
        color: 'bg-yellow-500',
        textColor: 'text-yellow-500',
        label: '超时',
        icon: 'Clock'
      };
    case 'error':
      return {
        color: 'bg-orange-500',
        textColor: 'text-orange-500',
        label: '错误',
        icon: 'AlertCircle'
      };
    case 'checking':
      return {
        color: 'bg-blue-500',
        textColor: 'text-blue-500',
        label: '检查中',
        icon: 'Loader'
      };
    default:
      return {
        color: 'bg-slate-300',
        textColor: 'text-slate-400',
        label: '未检查',
        icon: 'Circle'
      };
  }
}

// 格式化上次检查时间
export function formatLastChecked(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}天前`;
  if (hours > 0) return `${hours}小时前`;
  if (minutes > 0) return `${minutes}分钟前`;
  if (seconds > 30) return `${seconds}秒前`;
  return '刚刚';
}
