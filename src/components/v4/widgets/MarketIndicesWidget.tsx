import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, RefreshCw } from 'lucide-react';
import { fetchMarketIndices, IndexData } from '../../../services/financeService';

interface MarketIndicesWidgetProps {
  className?: string;
}

const MarketIndicesWidget: React.FC<MarketIndicesWidgetProps> = ({ className = '' }) => {
  const [indices, setIndices] = useState<IndexData[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'ashares' | 'hk' | 'us'>('ashares');

  const loadData = async () => {
    setLoading(true);
    const data = await fetchMarketIndices();
    setIndices(data);
    setLastUpdated(new Date());
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // 30秒自动刷新
    const timer = setInterval(loadData, 30000);
    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatChange = (change: number, percent: number) => {
    const isPositive = change >= 0;
    return {
      color: isPositive ? 'text-emerald-400' : 'text-red-400',
      bg: isPositive ? 'bg-emerald-500/10' : 'bg-red-500/10',
      sign: isPositive ? '+' : '',
      arrow: isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
    };
  };

  return (
    <div className={`rounded-3xl bg-[#181a1c] p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Market Pulse</h3>
        
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-[#0d0e10] rounded-full p-1">
          {[
            { id: 'ashares', label: 'A-Shares' },
            { id: 'hk', label: 'HKEX' },
            { id: 'us', label: 'NASDAQ' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-400 text-[#0d0e10]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Indices Grid */}
      <div className="grid grid-cols-2 gap-4">
        {indices.slice(0, 2).map((index) => {
          const style = formatChange(index.change, index.changePercent);
          
          return (
            <div
              key={index.code}
              className={`p-4 rounded-2xl ${style.bg} relative overflow-hidden`}
            >
              {/* Background Chart Effect */}
              <div className="absolute bottom-0 left-0 right-0 h-16 opacity-20">
                <svg viewBox="0 0 200 50" className="w-full h-full" preserveAspectRatio="none">
                  <path
                    d="M0,40 Q50,35 100,25 T200,15"
                    fill="none"
                    stroke={index.change >= 0 ? '#10b981' : '#ef4444'}
                    strokeWidth="2"
                  />
                </svg>
              </div>
              
              <div className="relative z-10">
                <p className="text-xs text-slate-400 mb-1">{index.name}</p>
                <p className="text-2xl font-bold text-white mb-2">{formatNumber(index.value)}</p>
                <div className={`flex items-center gap-1 text-sm ${style.color}`}>
                  {style.arrow}
                  <span>{style.sign}{formatNumber(index.change)}</span>
                  <span>({style.sign}{index.changePercent.toFixed(2)}%)</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Refresh Info */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Activity className="w-3 h-3" />
          <span>Live • 30s refresh</span>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="p-2 rounded-xl bg-[#0d0e10] text-slate-400 hover:text-emerald-400 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
};

export default MarketIndicesWidget;
