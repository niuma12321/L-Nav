import React, { useState, useEffect } from 'react';
import { Rss, RefreshCw, ExternalLink, Clock, ArrowLeft } from 'lucide-react';

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  description?: string;
}

interface RSSFeed {
  title: string;
  items: RSSItem[];
}

interface RSSReaderViewCNProps {
  onBack?: () => void;
}

const DEFAULT_FEEDS = [
  { name: 'V2EX', url: 'https://www.v2ex.com/index.xml' },
  { name: 'Solidot', url: 'https://www.solidot.org/index.rss' },
  { name: 'Linux.do', url: 'https://linux.do/latest.rss' },
];

export const RSSReaderViewCN: React.FC<RSSReaderViewCNProps> = ({ onBack }) => {
  const [feeds, setFeeds] = useState<RSSFeed[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFeed, setSelectedFeed] = useState<string | null>(null);

  useEffect(() => {
    loadFeeds();
  }, []);

  const loadFeeds = async () => {
    setLoading(true);
    // 由于跨域限制，这里使用模拟数据
    // 实际应用中应该通过后端代理获取
    setTimeout(() => {
      setFeeds([
        {
          title: 'V2EX',
          items: [
            { title: '今日热帖示例 1', link: '#', pubDate: new Date().toISOString() },
            { title: '技术讨论示例 2', link: '#', pubDate: new Date().toISOString() },
          ]
        },
        {
          title: 'Solidot',
          items: [
            { title: '科技新闻示例 1', link: '#', pubDate: new Date().toISOString() },
            { title: '开源动态示例 2', link: '#', pubDate: new Date().toISOString() },
          ]
        }
      ]);
      setLoading(false);
    }, 500);
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
        <button
          onClick={loadFeeds}
          disabled={loading}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 订阅源列表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {feeds.map((feed, index) => (
          <div key={index} className="bg-[#181a1c] rounded-xl border border-white/5 p-4">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Rss className="w-4 h-4 text-orange-400" />
              {feed.title}
            </h2>
            <div className="space-y-2">
              {feed.items.map((item, itemIndex) => (
                <a
                  key={itemIndex}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium group-hover:text-emerald-400 transition-colors">
                      {item.title}
                    </span>
                    <ExternalLink className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    {new Date(item.pubDate).toLocaleString('zh-CN')}
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      {feeds.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Rss className="w-12 h-12 mb-4 opacity-50" />
          <p>暂无订阅源</p>
          <p className="text-sm mt-2">点击刷新按钮加载示例数据</p>
        </div>
      )}
    </div>
  );
};

export default RSSReaderViewCN;
