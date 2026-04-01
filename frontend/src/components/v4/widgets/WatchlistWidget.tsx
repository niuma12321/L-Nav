import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, MoreHorizontal, Plus, X } from 'lucide-react';
import { fetchStockData, StockData } from '../../../services/financeService';

interface WatchlistItem extends StockData {
  addedAt: number;
}

interface WatchlistWidgetProps {
  className?: string;
}

const DEFAULT_STOCKS = ['sh600519', 'sh601318', 'sz002594'];

const WatchlistWidget: React.FC<WatchlistWidgetProps> = ({ className = '' }) => {
  const [stocks, setStocks] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddInput, setShowAddInput] = useState(false);
  const [newCode, setNewCode] = useState('');

  const loadStocks = async () => {
    setLoading(true);
    const codes = stocks.length > 0 ? stocks.map(s => s.code) : DEFAULT_STOCKS;
    const data = await fetchStockData(codes);
    
    setStocks(prev => {
      return data.map((stock, index) => ({
        ...stock,
        addedAt: prev[index]?.addedAt || Date.now(),
      }));
    });
    setLoading(false);
  };

  useEffect(() => {
    loadStocks();
    const timer = setInterval(loadStocks, 30000);
    return () => clearInterval(timer);
  }, []);

  const addStock = () => {
    if (!newCode.trim()) return;
    const code = newCode.trim().toLowerCase();
    if (!stocks.find(s => s.code === code)) {
      loadStocks();
    }
    setNewCode('');
    setShowAddInput(false);
  };

  const removeStock = (code: string) => {
    setStocks(prev => prev.filter(s => s.code !== code));
  };

  const formatPrice = (price: number) => {
    return price.toFixed(2);
  };

  const renderMiniChart = (changePercent: number) => {
    const isPositive = changePercent >= 0;
    const points = isPositive 
      ? 'M0,20 Q25,15 50,10 T100,5' 
      : 'M0,5 Q25,10 50,15 T100,20';
    
    return (
      <svg viewBox="0 0 100 25" className="w-16 h-6">
        <path
          d={points}
          fill="none"
          stroke={isPositive ? '#10b981' : '#ef4444'}
          strokeWidth="2"
        />
      </svg>
    );
  };

  return (
    <div className={`rounded-3xl bg-[#181a1c] p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Active Watchlist</h3>
        <button
          onClick={() => setShowAddInput(true)}
          className="text-sm text-emerald-400 hover:text-emerald-300 font-medium"
        >
          Edit List
        </button>
      </div>

      {/* Stock List */}
      <div className="space-y-3">
        {loading && stocks.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : (
          stocks.map((stock) => {
            const isPositive = stock.changePercent >= 0;
            
            return (
              <div
                key={stock.code}
                className="flex items-center justify-between p-3 rounded-2xl bg-[#0d0e10] hover:bg-[#242629] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  {/* Stock Logo Placeholder */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold ${
                    isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {stock.code.slice(2, 4).toUpperCase()}
                  </div>
                  
                  <div>
                    <p className="text-sm font-semibold text-white">{stock.name || stock.code}</p>
                    <p className="text-xs text-slate-500">{stock.code}</p>
                  </div>
                </div>

                {/* Price & Chart */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">
                      ¥{formatPrice(stock.price)}
                    </p>
                    <p className={`text-xs ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </p>
                  </div>
                  
                  {/* Mini Chart */}
                  {renderMiniChart(stock.changePercent)}
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => removeStock(stock.code)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-500 hover:text-red-400 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Stock Input */}
      {showAddInput && (
        <div className="mt-4 flex items-center gap-2">
          <input
            type="text"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addStock()}
            placeholder="输入股票代码 (如: sh600519)"
            className="flex-1 px-3 py-2 bg-[#0d0e10] rounded-xl text-white text-sm placeholder-slate-500 outline-none focus:ring-1 focus:ring-emerald-500/50"
            autoFocus
          />
          <button
            onClick={addStock}
            className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAddInput(false)}
            className="p-2 rounded-xl text-slate-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default WatchlistWidget;
