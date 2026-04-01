import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';

interface HotItem {
  id: string;
  title: string;
  heat: string;
  tag?: string;
  tagColor?: string;
}

interface HotListWidgetProps {
  className?: string;
}

const weiboData: HotItem[] = [
  { id: '1', title: '人工智能如何改变我们的数字生产力？', heat: '1.2w人正在讨论', tag: '沸', tagColor: 'bg-red-500' },
  { id: '2', title: '2024 夏季奥林匹克运动会倒计时启动', heat: '9800人参与', tag: '热', tagColor: 'bg-emerald-500' },
  { id: '3', title: '新一代折叠屏手机发布：极致轻薄新体验', heat: '8500人讨论', tag: '新', tagColor: 'bg-amber-500' },
  { id: '4', title: '全球气候峰会发布最新行动指南', heat: '7200人关注' },
];

const zhihuData: HotItem[] = [
  { id: '1', title: '如何评价最新的开源大型语言模型 Llama 3？', heat: '1.2M 热度', tag: 'HOT', tagColor: 'bg-red-500' },
  { id: '2', title: '有哪些让你相见恨晚的极简主义生活习惯？', heat: '980K 热度' },
  { id: '3', title: '为什么现在的年轻人越来越倾向于在数字空间寻求慰藉？', heat: '750K 热度' },
  { id: '4', title: '2024年最值得投资的技术领域是什么？', heat: '620K 热度' },
];

const HotListWidget: React.FC<HotListWidgetProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'weibo' | 'zhihu'>('all');

  const renderHotList = (items: HotItem[], showRank: boolean = true) => (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={item.id}
          className="group flex items-start gap-3 cursor-pointer"
        >
          {showRank && (
            <span className={`
              w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5
              ${index === 0 ? 'text-red-400' : index === 1 ? 'text-emerald-400' : index === 2 ? 'text-amber-400' : 'text-slate-500'}
            `}>
              {index + 1}
            </span>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm text-white font-medium truncate group-hover:text-emerald-300 transition-colors">
                {item.title}
              </p>
              {item.tag && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${item.tagColor} text-white font-medium shrink-0`}>
                  {item.tag}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">{item.heat} · 科技</p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className={`rounded-3xl bg-[#181a1c] p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">热门资讯</h3>
        
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-[#0d0e10] rounded-full p-1">
          {(['all', 'weibo', 'zhihu'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeTab === tab
                  ? 'bg-emerald-500 text-[#0d0e10]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'all' ? '全部' : tab === 'weibo' ? '微博' : '知乎'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {(activeTab === 'all' || activeTab === 'weibo') && (
        <div className={activeTab === 'all' ? 'mb-6' : ''}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">微博实时热搜</h4>
              <p className="text-xs text-slate-500">更新于 2 分钟前</p>
            </div>
          </div>
          {renderHotList(weiboData)}
        </div>
      )}

      {(activeTab === 'all' || activeTab === 'zhihu') && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center">
              <span className="text-lg">知</span>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">知乎全站热榜</h4>
              <p className="text-xs text-slate-500">更新于 5 分钟前</p>
            </div>
          </div>
          {renderHotList(zhihuData)}
        </div>
      )}
    </div>
  );
};

export default HotListWidget;
