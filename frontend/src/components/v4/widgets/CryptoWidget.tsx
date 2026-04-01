import React, { useState, useEffect } from 'react';
import { Bitcoin, RefreshCw } from 'lucide-react';
import { fetchCryptoData, CryptoData } from '../../../services/financeService';

interface CryptoWidgetProps {
  className?: string;
}

const CryptoWidget: React.FC<CryptoWidgetProps> = ({ className = '' }) => {
  const [cryptos, setCryptos] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchCryptoData();
    setCryptos(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 60000); // 1分钟刷新
    return () => clearInterval(timer);
  }, []);

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `¥${(price / 10000).toFixed(0)}万`;
    }
    return `¥${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  return (
    <div className={`rounded-3xl bg-[#181a1c] p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
            <Bitcoin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Crypto</h3>
            <p className="text-xs text-slate-500">Live Prices</p>
          </div>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="p-2 rounded-xl bg-[#0d0e10] text-slate-400 hover:text-emerald-400 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Crypto List */}
      <div className="space-y-4">
        {cryptos.map((crypto) => {
          const isPositive = crypto.changePercent24h >= 0;
          
          return (
            <div
              key={crypto.id}
              className="flex items-center justify-between p-3 rounded-2xl bg-[#0d0e10]"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                  crypto.symbol === 'BTC' ? 'bg-orange-500/20 text-orange-400' :
                  crypto.symbol === 'ETH' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-purple-500/20 text-purple-400'
                }`}>
                  {crypto.symbol.slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{crypto.name}</p>
                  <p className="text-xs text-slate-500">{crypto.symbol}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm font-semibold text-white">
                  {formatPrice(crypto.price)}
                </p>
                <p className={`text-xs ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isPositive ? '+' : ''}{crypto.changePercent24h.toFixed(2)}%
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CryptoWidget;
