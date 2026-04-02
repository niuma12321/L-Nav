import React from 'react';
import { MessageSquare, Eye, Clock, Tag } from 'lucide-react';

interface NewsItem {
  id: string;
  category: string;
  categoryColor: string;
  title: string;
  source: string;
  time: string;
  views: string;
  comments: number;
  image?: string;
}

interface MarketNewsWidgetProps {
  className?: string;
}

const newsData: NewsItem[] = [
  {
    id: '1',
    category: 'MONETARY',
    categoryColor: 'text-emerald-400',
    title: 'Fed Signals Rate Hike Pause as Inflation Data Cools',
    source: 'Financial Times',
    time: '12m ago',
    views: '24 Comments',
    comments: 24,
  },
  {
    id: '2',
    category: 'TECH',
    categoryColor: 'text-blue-400',
    title: 'Nvidia GPU Shortage Eases: Implications for AI Stocks',
    source: 'Bloomberg',
    time: '45m ago',
    views: '58 Comments',
    comments: 58,
  },
  {
    id: '3',
    category: 'ENERGY',
    categoryColor: 'text-red-400',
    title: 'Oil Prices Surge on Geopolitical Tensions in Red Sea',
    source: 'Reuters',
    time: '2h ago',
    views: '12 Comments',
    comments: 12,
  },
];

const featuredNews = {
  id: 'featured',
  category: 'DEEP DIVE',
  categoryColor: 'text-emerald-400',
  title: 'The Future of A-Share Regulation in 2024',
  summary: 'Analytical insights into the upcoming policy shifts from...',
  image: 'gradient',
};

const MarketNewsWidget: React.FC<MarketNewsWidgetProps> = ({ className = '' }) => {
  return (
    <div className={`rounded-3xl bg-[#181a1c] p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Global Feed</h3>
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      </div>

      {/* News List */}
      <div className="space-y-4">
        {newsData.map((news) => (
          <div
            key={news.id}
            className="p-4 rounded-2xl bg-[#0d0e10] hover:bg-[#242629] transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-medium ${news.categoryColor}`}>
                {news.category}
              </span>
              <span className="text-xs text-slate-500">{news.time}</span>
            </div>
            
            <h4 className="text-sm font-medium text-white mb-2 group-hover:text-emerald-300 transition-colors line-clamp-2">
              {news.title}
            </h4>
            
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {news.comments} Comments
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Featured Deep Dive */}
      <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-emerald-900/30 to-[#0d0e10] border border-emerald-500/20">
        <div className="flex items-center gap-2 mb-2">
          <Tag className="w-3 h-3 text-emerald-400" />
          <span className="text-xs font-medium text-emerald-400">{featuredNews.category}</span>
          <span className="text-xs text-slate-500">Featured</span>
        </div>
        <h4 className="text-base font-semibold text-white mb-1">
          {featuredNews.title}
        </h4>
        <p className="text-xs text-slate-400 line-clamp-2">
          {featuredNews.summary}
        </p>
      </div>
    </div>
  );
};

export default MarketNewsWidget;
