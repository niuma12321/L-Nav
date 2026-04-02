import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, RefreshCw, Database, Globe, AlertCircle } from 'lucide-react';
import type { APIDataConfig } from './widgetTypes';

interface APIDataWidgetProps {
  config: APIDataConfig;
}

// 从嵌套对象中获取值
const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((acc, part) => {
    if (acc === null || acc === undefined) return null;
    return acc[part];
  }, obj);
};

// 从数组项中获取字段值
const getFieldValue = (item: any, fieldPath: string): string => {
  if (!fieldPath) return '';
  const value = getNestedValue(item, fieldPath);
  if (value === null || value === undefined) return '';
  return String(value);
};

export const APIDataWidget: React.FC<APIDataWidgetProps> = ({ config }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const options: RequestInit = {
        method: config.method,
        headers: {
          'Content-Type': 'application/json',
          ...config.headers
        }
      };

      if (config.method === 'POST' && config.body) {
        options.body = config.body;
      }

      const response = await fetch(config.apiUrl, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // 根据 dataPath 提取数据
      let extractedData = result;
      if (config.dataPath) {
        extractedData = getNestedValue(result, config.dataPath);
      }
      
      // 确保数据是数组
      if (!Array.isArray(extractedData)) {
        extractedData = extractedData ? [extractedData] : [];
      }
      
      setData(extractedData.slice(0, config.maxItems || 10));
      setLastUpdate(new Date());
    } catch (err: any) {
      setError(err.message || '获取数据失败');
      console.error('API Widget Error:', err);
    } finally {
      setLoading(false);
    }
  }, [config]);

  // 初始加载和自动刷新
  useEffect(() => {
    fetchData();
    
    // 设置自动刷新
    let intervalId: NodeJS.Timeout | null = null;
    if (config.refreshInterval > 0) {
      intervalId = setInterval(fetchData, config.refreshInterval * 1000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [fetchData, config.refreshInterval]);

  const renderContent = () => {
    if (loading && data.length === 0) {
      return (
        <div className="flex items-center justify-center h-full min-h-[150px]">
          <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={fetchData}
            className="mt-2 px-3 py-1 text-xs bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            重试
          </button>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-full min-h-[150px] text-slate-500">
          {config.emptyText || '暂无数据'}
        </div>
      );
    }

    switch (config.displayType) {
      case 'list':
        return (
          <div className="space-y-2 overflow-y-auto max-h-[300px]">
            {data.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg bg-[#0d0e10] hover:bg-[#1a1c1f] transition-colors"
              >
                {config.fields.image && getFieldValue(item, config.fields.image) && (
                  <img
                    src={getFieldValue(item, config.fields.image)}
                    alt=""
                    className="w-10 h-10 rounded-lg object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {getFieldValue(item, config.fields.title)}
                  </p>
                  {config.fields.subtitle && (
                    <p className="text-xs text-slate-400 truncate">
                      {getFieldValue(item, config.fields.subtitle)}
                    </p>
                  )}
                </div>
                {config.fields.value && (
                  <span className="text-sm text-emerald-400">
                    {getFieldValue(item, config.fields.value)}
                  </span>
                )}
              </div>
            ))}
          </div>
        );

      case 'card':
        return (
          <div className="grid grid-cols-2 gap-3 overflow-y-auto max-h-[300px]">
            {data.map((item, index) => (
              <div
                key={index}
                className="p-4 rounded-xl bg-[#0d0e10] hover:bg-[#1a1c1f] transition-colors"
              >
                {config.fields.image && getFieldValue(item, config.fields.image) && (
                  <img
                    src={getFieldValue(item, config.fields.image)}
                    alt=""
                    className="w-full h-20 rounded-lg object-cover mb-2"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <p className="text-sm font-medium text-white truncate">
                  {getFieldValue(item, config.fields.title)}
                </p>
                {config.fields.subtitle && (
                  <p className="text-xs text-slate-400 truncate mt-1">
                    {getFieldValue(item, config.fields.subtitle)}
                  </p>
                )}
                {config.fields.value && (
                  <p className="text-lg font-bold text-emerald-400 mt-2">
                    {getFieldValue(item, config.fields.value)}
                  </p>
                )}
              </div>
            ))}
          </div>
        );

      case 'table':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 border-b border-white/10">
                  <th className="text-left py-2 px-2">{config.fields.title || '标题'}</th>
                  {config.fields.subtitle && (
                    <th className="text-left py-2 px-2">{config.fields.subtitle}</th>
                  )}
                  {config.fields.value && (
                    <th className="text-right py-2 px-2">{config.fields.value}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={index} className="border-b border-white/5 hover:bg-[#0d0e10]">
                    <td className="py-2 px-2 text-white">
                      {getFieldValue(item, config.fields.title)}
                    </td>
                    {config.fields.subtitle && (
                      <td className="py-2 px-2 text-slate-400">
                        {getFieldValue(item, config.fields.subtitle)}
                      </td>
                    )}
                    {config.fields.value && (
                      <td className="py-2 px-2 text-right text-emerald-400">
                        {getFieldValue(item, config.fields.value)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'text':
      default:
        return (
          <div className="space-y-2 overflow-y-auto max-h-[300px]">
            {data.map((item, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-[#0d0e10] text-sm text-slate-300"
              >
                {getFieldValue(item, config.fields.title)}
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-slate-300">{config.name}</span>
        </div>
        <div className="flex items-center gap-1">
          {lastUpdate && (
            <span className="text-[10px] text-slate-500">
              {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-1 rounded hover:bg-white/5 transition-colors"
            title="刷新数据"
          >
            <RefreshCw className={`w-3 h-3 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {renderContent()}
      </div>

      {/* Footer */}
      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
        <span>{data.length} 条数据</span>
        {config.refreshInterval > 0 && (
          <span>每 {config.refreshInterval} 秒自动刷新</span>
        )}
      </div>
    </div>
  );
};

export default APIDataWidget;
