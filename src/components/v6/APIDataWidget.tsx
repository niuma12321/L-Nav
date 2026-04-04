import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, RefreshCw, Globe, AlertCircle, FileText, X, ExternalLink } from 'lucide-react';
import type { APIDataConfig } from './widgetTypes';

interface APIDataWidgetProps {
  config: APIDataConfig;
}

// 从嵌套对象中获取值
const getNestedValue = (obj: any, path: string): any => {
  if (!path) return obj;
  return path.split('.').reduce((acc, part) => {
    if (acc === null || acc === undefined) return null;
    return acc[part];
  }, obj);
};

// 从HTML中提取文本内容
const extractTextFromHTML = (html: string): string => {
  if (!html || typeof html !== 'string') return '';
  // 移除script和style标签及其内容
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  // 移除所有HTML标签
  text = text.replace(/<[^>]+>/g, ' ');
  // 解码HTML实体
  text = text.replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  // 规范化空白
  text = text.replace(/\s+/g, ' ').trim();
  return text;
};

// 解析HTML表格数据
const parseHTMLTable = (html: string): any[] => {
  const results: any[] = [];
  if (!html || typeof html !== 'string') return results;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // 尝试找到表格
  const tables = doc.querySelectorAll('table');
  tables.forEach((table) => {
    const rows = table.querySelectorAll('tr');
    rows.forEach((row, rowIndex) => {
      if (rowIndex === 0) return; // 跳过表头
      const cells = row.querySelectorAll('td, th');
      const rowData: any = {};
      cells.forEach((cell, cellIndex) => {
        rowData[`col${cellIndex}`] = cell.textContent?.trim() || '';
        if (cellIndex === 0) rowData.title = cell.textContent?.trim() || '';
        if (cellIndex === 1) rowData.value = cell.textContent?.trim() || '';
        if (cellIndex === 2) rowData.subtitle = cell.textContent?.trim() || '';
      });
      if (Object.keys(rowData).length > 0) {
        results.push(rowData);
      }
    });
  });
  
  // 如果没有表格，尝试解析列表
  if (results.length === 0) {
    const lists = doc.querySelectorAll('ul, ol');
    lists.forEach((list) => {
      const items = list.querySelectorAll('li');
      items.forEach((item, index) => {
        const text = item.textContent?.trim() || '';
        if (text) {
          results.push({
            title: text,
            value: '',
            index: index + 1
          });
        }
      });
    });
  }
  
  // 如果还没有，按段落分割
  if (results.length === 0) {
    const paragraphs = doc.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6');
    paragraphs.forEach((p, index) => {
      const text = p.textContent?.trim() || '';
      if (text && text.length > 5) {
        results.push({
          title: text,
          value: '',
          index: index + 1
        });
      }
    });
  }
  
  return results;
};

// 从数组项中获取字段值
const getFieldValue = (item: any, fieldPath: string): string => {
  // 如果item是字符串，直接返回（用于字符串数组）
  if (typeof item === 'string') return item;
  if (!fieldPath) return String(item);
  if (typeof item !== 'object') return String(item);
  const value = getNestedValue(item, fieldPath);
  if (value === null || value === undefined) return '';
  return String(value);
};

// 获取项目显示文本（处理字符串和对象）
const getItemDisplayText = (item: any, fieldPath?: string): string => {
  if (typeof item === 'string') return item;
  if (!fieldPath) return String(item);
  return getFieldValue(item, fieldPath);
};

export const APIDataWidget: React.FC<APIDataWidgetProps> = ({ config }) => {
  const [data, setData] = useState<any[]>([]);
  const [rawContent, setRawContent] = useState<string>('');
  const [contentType, setContentType] = useState<'json' | 'html' | 'text'>('json');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 直接读取配置中的API参数进行请求
      const fetchOptions: RequestInit = {
        method: config.method,
        headers: config.headers || { 'Content-Type': 'application/json' }
      };

      if (config.method === 'POST' && config.body) {
        fetchOptions.body = typeof config.body === 'string' 
          ? config.body 
          : JSON.stringify(config.body);
      }

      console.log('API Config:', { url: config.apiUrl, method: config.method, dataPath: config.dataPath, fields: config.fields });
      
      const response = await fetch(config.apiUrl, fetchOptions);
      
      console.log('API Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentTypeHeader = response.headers.get('content-type') || '';
      const responseText = await response.text();
      
      console.log('Response text length:', responseText.length, 'Content-Type:', contentTypeHeader);
      
      let parsedData: any[] = [];
      
      if (contentTypeHeader.includes('application/json')) {
        // JSON响应
        setContentType('json');
        try {
          const jsonData = JSON.parse(responseText);
          console.log('Parsed JSON keys:', Object.keys(jsonData));
          let extractedData = config.dataPath ? getNestedValue(jsonData, config.dataPath) : jsonData;
          console.log('Extracted data type:', typeof extractedData, 'isArray:', Array.isArray(extractedData));
          if (!Array.isArray(extractedData)) {
            extractedData = extractedData ? [extractedData] : [];
          }
          parsedData = extractedData.slice(0, config.maxItems || 10);
          console.log('Final parsed data:', parsedData.length, 'items, first item:', parsedData[0]);
        } catch (e) {
          throw new Error('JSON解析失败');
        }
      } else if (contentTypeHeader.includes('text/html') || responseText.trim().startsWith('<')) {
        // HTML响应
        setContentType('html');
        setRawContent(responseText);
        
        // 尝试从HTML解析数据
        if (config.dataPath === 'text' || config.displayType === 'text') {
          // 纯文本显示模式
          const text = extractTextFromHTML(responseText);
          parsedData = [{ title: text.substring(0, 1000) }];
        } else {
          // 尝试解析表格或列表
          parsedData = parseHTMLTable(responseText).slice(0, config.maxItems || 10);
        }
      } else {
        // 纯文本响应
        setContentType('text');
        setRawContent(responseText);
        parsedData = [{ title: responseText.substring(0, 1000) }];
      }
      
      setData(parsedData);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.apiUrl, config.refreshInterval]); // 只依赖 API URL 和刷新间隔

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

    if (data.length === 0 && !rawContent) {
      return (
        <div className="flex items-center justify-center h-full min-h-[150px] text-slate-500">
          {config.emptyText || '暂无数据'}
        </div>
      );
    }

    // HTML纯文本显示
    if (contentType === 'html' && config.displayType === 'text' && rawContent) {
      const text = extractTextFromHTML(rawContent);
      return (
        <div className="overflow-y-auto max-h-[300px]">
          <div className="p-3 rounded-lg bg-[#0d0e10] text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
            {text}
          </div>
        </div>
      );
    }

    // 纯文本显示
    if (contentType === 'text' && rawContent) {
      return (
        <div className="overflow-y-auto max-h-[300px]">
          <div className="p-3 rounded-lg bg-[#0d0e10] text-sm text-slate-300 whitespace-pre-wrap leading-relaxed font-mono">
            {rawContent.substring(0, 2000)}
          </div>
        </div>
      );
    }

    switch (config.displayType) {
      case 'list':
        return (
          <div className="space-y-2 overflow-y-auto max-h-[300px]">
            {data.map((item, index) => {
              const linkUrl = config.fields.link ? getFieldValue(item, config.fields.link) : '';
              const titleText = getItemDisplayText(item, config.fields.title);
              
              return linkUrl ? (
                <a
                  key={index}
                  href={linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-3 rounded-lg bg-[#0d0e10] hover:bg-[#1a1c1f] transition-colors group cursor-pointer"
                >
                  <span className="text-xs text-slate-500 mt-0.5">{index + 1}</span>
                  <p className="text-sm text-slate-300 flex-1 leading-relaxed group-hover:text-emerald-400 transition-colors">
                    {titleText}
                  </p>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
                </a>
              ) : (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-[#0d0e10]"
                >
                  <span className="text-xs text-slate-500 mt-0.5">{index + 1}</span>
                  <p className="text-sm text-slate-300 flex-1 leading-relaxed">
                    {titleText}
                  </p>
                </div>
              );
            })}
          </div>
        );

      case 'table':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 border-b border-white/10">
                  <th className="text-left py-2 px-2">序号</th>
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
                    <td className="py-2 px-2 text-slate-500">{index + 1}</td>
                    <td className="py-2 px-2 text-white">
                      {typeof item === 'string' ? item : (getFieldValue(item, config.fields.title) || '-')}
                    </td>
                    {config.fields.subtitle && (
                      <td className="py-2 px-2 text-slate-400">
                        {typeof item === 'string' ? '' : getFieldValue(item, config.fields.subtitle)}
                      </td>
                    )}
                    {config.fields.value && (
                      <td className="py-2 px-2 text-right text-emerald-400">
                        {typeof item === 'string' ? '' : getFieldValue(item, config.fields.value)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'media-list':
        return (
          <div className="space-y-3 overflow-y-auto max-h-[300px]">
            {data.map((item, index) => {
              const imageUrl = config.fields.image ? getFieldValue(item, config.fields.image) : '';
              const title = config.fields.title ? getItemDisplayText(item, config.fields.title) : '';
              const value = config.fields.value ? getFieldValue(item, config.fields.value) : '';
              const subtitle = config.fields.subtitle ? getFieldValue(item, config.fields.subtitle) : '';
              const linkUrl = config.fields.link ? getFieldValue(item, config.fields.link) : '';
              
              const content = (
                <div className="flex items-start gap-3">
                  {/* Cover Image */}
                  {imageUrl && (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-[#0d0e10] shrink-0">
                      <img 
                        src={imageUrl} 
                        alt={title} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300 leading-relaxed line-clamp-2 mb-1">
                      {title}
                    </p>
                    <div className="flex items-center gap-3 text-xs">
                      {value && (
                        <span className="text-emerald-400 font-medium">
                          {value}
                        </span>
                      )}
                      {subtitle && (
                        <span className="text-slate-500">
                          {subtitle}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* External Link Icon */}
                  {linkUrl && (
                    <ExternalLink className="w-4 h-4 text-slate-500 shrink-0 mt-1" />
                  )}
                </div>
              );
              
              return linkUrl ? (
                <a
                  key={index}
                  href={linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-xl bg-[#0d0e10] hover:bg-[#1a1c1f] transition-colors group cursor-pointer"
                >
                  {content}
                </a>
              ) : (
                <div
                  key={index}
                  className="p-3 rounded-xl bg-[#0d0e10]"
                >
                  {content}
                </div>
              );
            })}
          </div>
        );

      case 'card':
        return (
          <div className="space-y-4 overflow-y-auto max-h-[300px]">
            {data.map((item, index) => {
              const imageUrl = config.fields.image ? getFieldValue(item, config.fields.image) : '';
              const title = config.fields.title ? getFieldValue(item, config.fields.title) : '';
              const subtitle = config.fields.subtitle ? getFieldValue(item, config.fields.subtitle) : '';
              
              return (
                <div key={index} className="rounded-xl overflow-hidden bg-[#0d0e10]">
                  {imageUrl && (
                    <div className="relative w-full aspect-video">
                      <img 
                        src={imageUrl} 
                        alt={title || 'Image'} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  {(title || subtitle) && (
                    <div className="p-3">
                      {title && (
                        <p className="text-sm font-medium text-white mb-1">{title}</p>
                      )}
                      {subtitle && (
                        <p className="text-xs text-slate-400">{subtitle}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
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
                {getItemDisplayText(item, config.fields.title)}
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
          {contentType === 'html' ? <FileText className="w-4 h-4 text-blue-400" /> : <Globe className="w-4 h-4 text-emerald-400" />}
          <span className="text-sm font-medium text-slate-300">{config.name}</span>
          {contentType !== 'json' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 uppercase">
              {contentType}
            </span>
          )}
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
