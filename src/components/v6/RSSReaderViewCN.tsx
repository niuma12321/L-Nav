import React, { useState, useEffect, useCallback } from 'react';
import { Rss, RefreshCw, ExternalLink, Clock, ArrowLeft, Plus, Trash2, AlertCircle } from '@/utils/icons';

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  description?: string;
}

interface RSSFeed {
  title: string;
  url: string;
  items: RSSItem[];
  error?: string;
}

interface RSSFeedConfig {
  name: string;
  url: string;
}

interface RSSReaderViewCNProps {
  onBack?: () => void;
}

const STORAGE_KEY = 'ynav_rss_feeds_v9';

const DEFAULT_FEEDS: RSSFeedConfig[] = [
  { name: 'V2EX', url: 'https://www.v2ex.com/index.xml' },
  { name: 'Solidot', url: 'https://www.solidot.org/index.rss' },
  { name: 'Linux.do', url: 'https://linux.do/latest.rss' },
];

// 使用 rss2json 代理服务
const RSS2JSON_API = 'https://api.rss2json.com/v1/api.json';

export const RSSReaderViewCN: React.FC<RSSReaderViewCNProps> = ({ onBack }) => {
  const [feeds, setFeeds] = useState<RSSFeed[]>([]);
  const [feedConfigs, setFeedConfigs] = useState<RSSFeedConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFeedName, setNewFeedName] = useState('');
  const [newFeedUrl, setNewFeedUrl] = useState('');

  // 从 localStorage 加载订阅源配置
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFeedConfigs(parsed);
      } catch {
        setFeedConfigs(DEFAULT_FEEDS);
      }
    } else {
      setFeedConfigs(DEFAULT_FEEDS);
    }
  }, []);

  // 保存订阅源配置到 localStorage
  useEffect(() => {
    if (feedConfigs.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(feedConfigs));
    }
  }, [feedConfigs]);

  // 加载 RSS 数据
  const loadFeeds = useCallback(async () => {
    if (feedConfigs.length === 0) return;

    setLoading(true);
    const loadedFeeds: RSSFeed[] = [];

    for (const config of feedConfigs) {
      try {
        const response = await fetch(`${RSS2JSON_API}?rss_url=${encodeURIComponent(config.url)}`);
        const data = await response.json();

        if (data.status === 'ok') {
          const items: RSSItem[] = data.items.slice(0, 10).map((item: any) => ({
            title: item.title || '无标题',
            link: item.link || '#',
            pubDate: item.pubDate || new Date().toISOString(),
            description: item.description,
          }));

          loadedFeeds.push({
            title: data.feed?.title || config.name,
            url: config.url,
            items,
          });
        } else {
          loadedFeeds.push({
            title: config.name,
            url: config.url,
            items: [],
            error: '无法加载此订阅源',
          });
        }
      } catch {
        loadedFeeds.push({
          title: config.name,
          url: config.url,
          items: [],
          error: '加载失败',
        });
      }
    }

    setFeeds(loadedFeeds);
    setLoading(false);
  }, [feedConfigs]);

  // 首次加载和配置变化时自动加载
  useEffect(() => {
    loadFeeds();
  }, [feedConfigs, loadFeeds]);

  const addFeed = () => {
    if (!newFeedName.trim() || !newFeedUrl.trim()) return;

    const newConfig: RSSFeedConfig = {
      name: newFeedName.trim(),
      url: newFeedUrl.trim(),
    };

    setFeedConfigs([...feedConfigs, newConfig]);
    setNewFeedName('');
    setNewFeedUrl('');
    setShowAddForm(false);
  };

  const removeFeed = (index: number) => {
    setFeedConfigs(feedConfigs.filter((_, i) => i !== index));
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(hours / 24);

      if (hours < 1) return '刚刚';
      if (hours < 24) return `${hours}小时前`;
      if (days < 7) return `${days}天前`;
      return date.toLocaleDateString('zh-CN');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen w-full p-4 sm:p-6">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <Rss className="w-6 h-6 text-orange-400" />
            <h1 className="text-xl font-bold">RSS 阅读器</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>添加源</span>
          </button>
          <button
            onClick={loadFeeds}
            disabled={loading}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 添加订阅源表单 */}
      {showAddForm && (
        <div className="mb-6 p-4 rounded-xl bg-[#181a1c] border border-white/5">
          <h3 className="text-sm font-medium text-white mb-3">添加 RSS 订阅源</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={newFeedName}
              onChange={(e) => setNewFeedName(e.target.value)}
              placeholder="订阅源名称 (如: 知乎日报)"
              className="w-full px-4 py-2 bg-[#0d0e10] rounded-lg border border-white/5 focus:border-emerald-500/50 focus:outline-none text-white placeholder:text-slate-500 text-sm"
            />
            <input
              type="text"
              value={newFeedUrl}
              onChange={(e) => setNewFeedUrl(e.target.value)}
              placeholder="RSS 地址 (如: https://example.com/feed.xml)"
              className="w-full px-4 py-2 bg-[#0d0e10] rounded-lg border border-white/5 focus:border-emerald-500/50 focus:outline-none text-white placeholder:text-slate-500 text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-white/5 text-slate-400 hover:text-white transition-colors text-sm"
              >
                取消
              </button>
              <button
                onClick={addFeed}
                disabled={!newFeedName.trim() || !newFeedUrl.trim()}
                className="flex-1 px-4 py-2 rounded-lg bg-emerald-500 text-[#0d0e10] font-medium hover:bg-emerald-400 transition-colors disabled:opacity-50 text-sm"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 订阅源列表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {feeds.map((feed, index) => (
          <div key={index} className="bg-[#181a1c] rounded-xl border border-white/5 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Rss className="w-4 h-4 text-orange-400" />
                {feed.title}
              </h2>
              <button
                onClick={() => removeFeed(index)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-white/5 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {feed.error ? (
              <div className="flex items-center gap-2 text-sm text-red-400 py-4">
                <AlertCircle className="w-4 h-4" />
                <span>{feed.error}</span>
              </div>
            ) : (
              <div className="space-y-2">
                {feed.items.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4">暂无文章</p>
                ) : (
                  feed.items.map((item, itemIndex) => (
                    <a
                      key={itemIndex}
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium group-hover:text-emerald-400 transition-colors line-clamp-2">
                          {item.title}
                        </span>
                        <ExternalLink className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        {formatDate(item.pubDate)}
                      </div>
                    </a>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {feeds.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Rss className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-lg font-medium text-white mb-2">暂无订阅源</p>
          <p className="text-sm mb-4">点击上方"添加源"按钮添加 RSS 订阅</p>
          <div className="flex gap-2">
            <button
              onClick={() => setFeedConfigs(DEFAULT_FEEDS)}
              className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors text-sm"
            >
              恢复默认订阅源
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RSSReaderViewCN;
