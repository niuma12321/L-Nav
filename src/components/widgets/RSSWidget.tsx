import React, { useState, useEffect, useCallback } from 'react';
import { Rss, ExternalLink, Loader, Plus, Trash2, RefreshCw } from '@/utils/icons';
import { RSSWidgetSettings, RSSItem, RSS_CACHE_KEY } from '../../types/widgets';

interface RSSWidgetProps {
  settings: RSSWidgetSettings;
  onUpdateSettings: (settings: Partial<RSSWidgetSettings>) => void;
}

const RSSWidget: React.FC<RSSWidgetProps> = ({ settings, onUpdateSettings }) => {
  const [items, setItems] = useState<RSSItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newFeed, setNewFeed] = useState('');
  const feeds = settings.feeds || [];
  const maxItems = settings.maxItems || 5;

  // 模拟RSS数据获取
  const fetchRSS = useCallback(async () => {
    if (feeds.length === 0) return;
    
    setLoading(true);
    
    try {
      // 检查缓存
      const cached = localStorage.getItem(RSS_CACHE_KEY);
      if (cached) {
        const cachedData = JSON.parse(cached);
        if (Date.now() - cachedData._cachedAt < 30 * 60 * 1000) { // 30分钟缓存
          setItems(cachedData.items.slice(0, maxItems));
          setLoading(false);
          return;
        }
      }
      
      // 模拟RSS数据
      const mockItems: RSSItem[] = [
        { title: '科技新闻：AI技术新突破', link: '#', pubDate: new Date().toISOString(), source: 'TechNews' },
        { title: '前端开发：React 19新特性', link: '#', pubDate: new Date(Date.now() - 3600000).toISOString(), source: 'Frontend' },
        { title: '设计灵感：2026年UI趋势', link: '#', pubDate: new Date(Date.now() - 7200000).toISOString(), source: 'Design' },
        { title: '产品思维：用户体验优化指南', link: '#', pubDate: new Date(Date.now() - 86400000).toISOString(), source: 'Product' },
        { title: '开发者工具：VS Code插件推荐', link: '#', pubDate: new Date(Date.now() - 172800000).toISOString(), source: 'Tools' },
      ];
      
      localStorage.setItem(RSS_CACHE_KEY, JSON.stringify({
        items: mockItems,
        _cachedAt: Date.now()
      }));
      
      setItems(mockItems.slice(0, maxItems));
    } catch {
      // 获取RSS失败
    } finally {
      setLoading(false);
    }
  }, [feeds, maxItems]);

  useEffect(() => {
    fetchRSS();
  }, [fetchRSS]);

  const addFeed = () => {
    if (!newFeed.trim()) return;
    
    onUpdateSettings({
      feeds: [...feeds, newFeed.trim()]
    });
    setNewFeed('');
    setShowAdd(false);
    fetchRSS();
  };

  const removeFeed = (feed: string) => {
    onUpdateSettings({
      feeds: feeds.filter(f => f !== feed)
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
    
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Rss className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">RSS订阅</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-accent" />
          </button>
          <button
            onClick={fetchRSS}
            disabled={loading}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="mb-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-2">
          <input
            type="url"
            value={newFeed}
            onChange={(e) => setNewFeed(e.target.value)}
            placeholder="输入RSS订阅地址"
            className="w-full px-2 py-1 text-sm bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"
          />
          <button
            onClick={addFeed}
            className="w-full py-1 text-xs bg-accent text-white rounded hover:bg-accent/90"
          >
            添加订阅
          </button>
          {feeds.length > 0 && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <div className="text-xs text-slate-500 mb-1">已订阅源:</div>
              <div className="space-y-1">
                {feeds.map((feed, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400 truncate">{feed}</span>
                    <button
                      onClick={() => removeFeed(feed)}
                      className="p-0.5 rounded hover:bg-red-100 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide">
        {feeds.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Rss className="w-6 h-6 mb-1 opacity-50" />
            <span className="text-xs">暂无RSS订阅</span>
            <button
              onClick={() => setShowAdd(true)}
              className="mt-2 text-xs text-accent hover:underline"
            >
              添加订阅源
            </button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader className="w-5 h-5 animate-spin text-accent" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Loader className="w-6 h-6 mb-1 opacity-50" />
            <span className="text-xs">暂无内容</span>
          </div>
        ) : (
          items.map((item, idx) => (
            <a
              key={idx}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
            >
              <div className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2 group-hover:text-accent transition-colors">
                {item.title}
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  {item.source}
                </span>
                <span>{formatDate(item.pubDate)}</span>
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
};

export default RSSWidget;
