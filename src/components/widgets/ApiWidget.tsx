import React, { useState, useEffect } from 'react';
import { ExternalLink, RefreshCw, AlertCircle, CheckCircle, Loader2 } from '@/utils/icons';

interface ApiWidgetProps {
  config: {
    apiUrl: string;
    refreshInterval?: number;
    headers?: Record<string, string>;
    method?: 'GET' | 'POST';
    body?: string;
  };
}

interface ApiResponse {
  data: any;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// 根据API返回内容自动渲染的组件
export const ApiWidget: React.FC<ApiWidgetProps> = ({ config }) => {
  const [response, setResponse] = useState<ApiResponse>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null
  });

  const fetchData = async () => {
    setResponse(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const options: RequestInit = {
        method: config.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers
        }
      };

      if (config.method === 'POST' && config.body) {
        options.body = config.body;
      }

      const res = await fetch(config.apiUrl, options);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      
      setResponse({
        data,
        loading: false,
        error: null,
        lastUpdated: new Date()
      });
    } catch (err) {
      setResponse({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        lastUpdated: null
      });
    }
  };

  useEffect(() => {
    fetchData();
    
    // 自动刷新
    if (config.refreshInterval && config.refreshInterval > 0) {
      const interval = setInterval(fetchData, config.refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [config.apiUrl, config.refreshInterval]);

  // 智能渲染函数 - 根据数据类型自动选择渲染方式
  const renderContent = (data: any): React.ReactNode => {
    if (data === null || data === undefined) {
      return <p className="text-slate-400">暂无数据</p>;
    }

    // 数组类型 - 渲染为列表
    if (Array.isArray(data)) {
      return (
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="p-2 rounded-lg bg-slate-800/50 border border-slate-700">
              {renderContent(item)}
            </div>
          ))}
        </div>
      );
    }

    // 对象类型
    if (typeof data === 'object') {
      // 检查是否是特殊格式（如包含 title, url 的链接对象）
      if (data.title && data.url) {
        return (
          <a 
            href={data.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <span>{data.title}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        );
      }

      // 检查是否是新闻/文章格式
      if (data.title && (data.description || data.summary)) {
        return (
          <div className="space-y-1">
            <h4 className="font-medium text-white">{data.title}</h4>
            <p className="text-sm text-slate-400 line-clamp-2">{data.description || data.summary}</p>
            {data.url && (
              <a 
                href={data.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-emerald-400 hover:underline inline-flex items-center gap-1"
              >
                查看详情 <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        );
      }

      // 通用对象渲染为键值对
      return (
        <div className="space-y-1">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center text-sm">
              <span className="text-slate-500">{key}:</span>
              <span className="text-slate-300 truncate max-w-[200px]">
                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </span>
            </div>
          ))}
        </div>
      );
    }

    // 基础类型直接渲染
    return <span className="text-slate-300">{String(data)}</span>;
  };

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-white">API 数据</h3>
        <div className="flex items-center gap-2">
          {response.loading && <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />}
          {response.error && <AlertCircle className="w-4 h-4 text-red-400" />}
          {!response.loading && !response.error && response.data && (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          )}
          <button
            onClick={fetchData}
            disabled={response.loading}
            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-emerald-400 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${response.loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-auto">
        {response.error ? (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">{response.error}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {renderContent(response.data)}
          </div>
        )}
      </div>

      {/* 底部信息 */}
      {response.lastUpdated && (
        <div className="mt-2 pt-2 border-t border-slate-700">
          <p className="text-xs text-slate-500">
            更新于: {response.lastUpdated.toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default ApiWidget;
