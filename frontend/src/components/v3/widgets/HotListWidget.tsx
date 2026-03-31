import React, { useState, useEffect } from 'react';
import { Flame, RefreshCw, ExternalLink } from 'lucide-react';

interface HotItem {
  id: string;
  title: string;
  heat: number;
  url: string;
}

interface HotListWidgetProps {
  className?: string;
}

type HotSource = 'weibo' | 'zhihu' | 'ithome';

const sourceConfig: Record<HotSource, { name: string; color: string; icon: string }> = {
  weibo: { name: '微博热搜', color: '#ef4444', icon: '🔥' },
  zhihu: { name: '知乎热榜', color: '#3b82f6', icon: '💡' },
  ithome: { name: 'IT之家', color: '#10b981', icon: '💻' },
};

const mockData: Record<HotSource, HotItem[]> = {
  weibo: [
    { id: '1', title: '苹果发布会新款iPhone', heat: 4500000, url: '#' },
    { id: '2', title: '春节档电影票房创新高', heat: 3200000, url: '#' },
    { id: '3', title: '某明星回应争议', heat: 2800000, url: '#' },
    { id: '4', title: '新型病毒防护指南', heat: 1800000, url: '#' },
    { id: '5', title: '春运火车票开售', heat: 1200000, url: '#' },
  ],
  zhihu: [
    { id: '1', title: '如何评价最新AI大模型？', heat: 8900, url: '#' },
    { id: '2', title: '程序员35岁危机真的存在吗？', heat: 6500, url: '#' },
    { id: '3', title: '哪些好习惯值得坚持？', heat: 4200, url: '#' },
    { id: '4', title: '如何高效学习编程？', heat: 3800, url: '#' },
    { id: '5', title: '2024年最值得读的书', heat: 2900, url: '#' },
  ],
  ithome: [
    { id: '1', title: '华为Mate70系列发布', heat: 12000, url: '#' },
    { id: '2', title: 'iOS 18新功能解析', heat: 9800, url: '#' },
    { id: '3', title: '小米汽车SU7最新消息', heat: 8500, url: '#' },
    { id: '4', title: '英伟达发布RTX 5090', heat: 7200, url: '#' },
    { id: '5', title: '特斯拉Cybertruck中国上市', heat: 6000, url: '#' },
  ],
};

const HotListWidget: React.FC<HotListWidgetProps> = ({ className = '' }) => {
  const [activeSource, setActiveSource] = useState<HotSource>('weibo');
  const [items, setItems] = useState<HotItem[]>(mockData.weibo);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(Date.now());

  const refreshData = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setItems(mockData[activeSource]);
      setLastUpdated(Date.now());
      setLoading(false);
    }, 800);
  };

  useEffect(() => {
    refreshData();
  }, [activeSource]);

  const formatHeat = (heat: number) => {
    if (heat >= 10000) {
      return (heat / 10000).toFixed(1) + '万';
    }
    return heat.toString();
  };

  const config = sourceConfig[activeSource];

  return (
    <div className={`v3-card p-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
            style={{ backgroundColor: `${config.color}20` }}
          >
            {config.icon}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">动态聚合</h3>
            <p className="text-xs text-slate-500">{config.name}</p>
          </div>
        </div>
        <button
          onClick={refreshData}
          disabled={loading}
          className="p-2 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Source Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
        {(Object.keys(sourceConfig) as HotSource[]).map((source) => (
          <button
            key={source}
            onClick={() => setActiveSource(source)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeSource === source
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            {sourceConfig[source].name}
          </button>
        ))}
      </div>

      {/* Hot List */}
      <div className="space-y-2">
        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : (
          items.map((item, index) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all active:scale-95"
            >
              <span className={`
                w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold
                ${index < 3 ? 'text-white' : 'text-slate-500'}
              `}
              style={{ 
                backgroundColor: index === 0 ? '#ef4444' : index === 1 ? '#f97316' : index === 2 ? '#eab308' : 'transparent',
                border: index >= 3 ? '1px solid rgba(255,255,255,0.1)' : 'none'
              }}
              >
                {index + 1}
              </span>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate group-hover:text-emerald-100 transition-colors">
                  {item.title}
                </p>
              </div>

              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Flame className="w-3 h-3" style={{ color: config.color }} />
                <span>{formatHeat(item.heat)}</span>
              </div>

              <ExternalLink className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          ))
        )}
      </div>
    </div>
  );
};

export default HotListWidget;
