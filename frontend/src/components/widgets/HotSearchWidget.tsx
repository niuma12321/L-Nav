import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, ExternalLink, Loader, Flame } from 'lucide-react';
import { HotSearchWidgetSettings, HotSearchItem, HOTSEARCH_CACHE_KEY } from '../../types/widgets';

interface HotSearchWidgetProps {
  settings: HotSearchWidgetSettings;
  onUpdateSettings: (settings: Partial<HotSearchWidgetSettings>) => void;
}

interface HotSearchData {
  weibo: HotSearchItem[];
  zhihu: HotSearchItem[];
  baidu: HotSearchItem[];
  bilibili: HotSearchItem[];
  updatedAt: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

const HotSearchWidget: React.FC<HotSearchWidgetProps> = ({ settings }) => {
  const [data, setData] = useState<HotSearchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSource, setActiveSource] = useState<string>(settings.sources[0] || 'weibo');

  // 获取热搜数据
  const fetchHotSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 检查缓存
      const cached = localStorage.getItem(HOTSEARCH_CACHE_KEY);
      if (cached) {
        const cachedData: HotSearchData & { _cachedAt: number } = JSON.parse(cached);
        if (Date.now() - cachedData._cachedAt < CACHE_DURATION) {
          setData(cachedData);
          setLoading(false);
          return;
        }
      }

      // 模拟热搜数据（实际项目中应该调用真实的API）
      const mockData: HotSearchData = {
        weibo: [
          { rank: 1, title: '科技发展新动态', url: '#', hot: 4500000 },
          { rank: 2, title: '今日热门话题讨论', url: '#', hot: 3200000 },
          { rank: 3, title: '娱乐圈最新消息', url: '#', hot: 2800000 },
          { rank: 4, title: '社会民生关注点', url: '#', hot: 2100000 },
          { rank: 5, title: '体育赛事直播', url: '#', hot: 1800000 },
        ],
        zhihu: [
          { rank: 1, title: '如何评价最新技术突破？', url: '#', hot: 8900 },
          { rank: 2, title: '有哪些值得收藏的学习资源？', url: '#', hot: 6500 },
          { rank: 3, title: '职场新人应该注意什么？', url: '#', hot: 5200 },
          { rank: 4, title: '如何提高工作效率？', url: '#', hot: 4300 },
          { rank: 5, title: '推荐几本好书', url: '#', hot: 3800 },
        ],
        baidu: [
          { rank: 1, title: '最新新闻资讯', url: '#' },
          { rank: 2, title: '热门搜索关键词', url: '#' },
          { rank: 3, title: '今日焦点事件', url: '#' },
          { rank: 4, title: '网络热点追踪', url: '#' },
          { rank: 5, title: '实时热搜排行', url: '#' },
        ],
        bilibili: [
          { rank: 1, title: '【热门】精彩视频推荐', url: '#', hot: 120000 },
          { rank: 2, title: '新番动漫更新', url: '#', hot: 98000 },
          { rank: 3, title: '科技数码评测', url: '#', hot: 76000 },
          { rank: 4, title: '游戏实况解说', url: '#', hot: 65000 },
          { rank: 5, title: '生活Vlog分享', url: '#', hot: 54000 },
        ],
        updatedAt: Date.now()
      };

      localStorage.setItem(HOTSEARCH_CACHE_KEY, JSON.stringify({
        ...mockData,
        _cachedAt: Date.now()
      }));

      setData(mockData);
    } catch (err) {
      setError('获取热搜失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHotSearch();
  }, [fetchHotSearch]);

  const getSourceName = (source: string) => {
    const names: Record<string, string> = {
      weibo: '微博',
      zhihu: '知乎',
      baidu: '百度',
      bilibili: 'B站'
    };
    return names[source] || source;
  };

  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      weibo: 'text-red-500',
      zhihu: 'text-blue-500',
      baidu: 'text-blue-600',
      bilibili: 'text-pink-500'
    };
    return colors[source] || 'text-accent';
  };

  const currentItems = data?.[activeSource as keyof HotSearchData] as HotSearchItem[] || [];
  const displayItems = currentItems.slice(0, settings.maxItems);

  const handleNavigate = (url: string) => {
    if (url && url !== '#') {
      window.open(url, '_blank');
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="w-5 h-5 animate-spin text-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-sm text-slate-500">
        <TrendingUp className="w-6 h-6 mb-1 opacity-50" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-3">
      {/* 标题栏和来源切换 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame className={`w-4 h-4 ${getSourceColor(activeSource)}`} />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {getSourceName(activeSource)}热搜
          </span>
        </div>
        <div className="flex items-center gap-1">
          {settings.sources.map(source => (
            <button
              key={source}
              onClick={() => setActiveSource(source)}
              className={`px-2 py-0.5 text-xs rounded transition-colors
                         ${activeSource === source 
                           ? 'bg-accent text-white' 
                           : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                         }`}
            >
              {getSourceName(source)}
            </button>
          ))}
        </div>
      </div>

      {/* 热搜列表 */}
      <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-hide">
        {displayItems.map((item, index) => (
          <div
            key={index}
            onClick={() => handleNavigate(item.url)}
            className="flex items-center gap-2 p-2 rounded-lg cursor-pointer
                       hover:bg-slate-50 dark:hover:bg-slate-800/50
                       transition-colors duration-200 group"
          >
            <span className={`w-5 h-5 flex items-center justify-center rounded text-xs font-bold
                            ${index < 3 
                              ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                            }`}
            >
              {item.rank}
            </span>
            
            <span className="flex-1 text-sm text-slate-700 dark:text-slate-300 truncate">
              {item.title}
            </span>
            
            {item.hot && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Flame className="w-3 h-3" />
                {(item.hot / 10000).toFixed(1)}万
              </span>
            )}
            
            <ExternalLink className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>

      {/* 刷新按钮 */}
      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={fetchHotSearch}
          disabled={loading}
          className="w-full py-1.5 text-xs text-slate-500 hover:text-accent
                     flex items-center justify-center gap-1 transition-colors"
        >
          <Loader className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          {loading ? '更新中...' : '刷新热搜'}
        </button>
      </div>
    </div>
  );
};

export default HotSearchWidget;
