import React, { useState, useEffect, useCallback } from 'react';
import { Calculator, ArrowRightLeft, TrendingUp } from '@/utils/icons';
import { ExchangeWidgetSettings } from '../../types/widgets';

interface ExchangeWidgetProps {
  settings: ExchangeWidgetSettings;
  onUpdateSettings: (settings: Partial<ExchangeWidgetSettings>) => void;
}

const currencies = [
  { code: 'CNY', name: '人民币', symbol: '¥' },
  { code: 'USD', name: '美元', symbol: '$' },
  { code: 'EUR', name: '欧元', symbol: '€' },
  { code: 'JPY', name: '日元', symbol: '¥' },
  { code: 'GBP', name: '英镑', symbol: '£' },
  { code: 'HKD', name: '港币', symbol: '$' },
  { code: 'KRW', name: '韩元', symbol: '₩' },
  { code: 'AUD', name: '澳元', symbol: '$' },
];

// 模拟汇率（实际应该调用API）
const mockRates: Record<string, number> = {
  'USD-CNY': 7.25,
  'CNY-USD': 0.138,
  'USD-EUR': 0.92,
  'EUR-USD': 1.09,
  'USD-JPY': 150.5,
  'JPY-USD': 0.0066,
  'USD-GBP': 0.79,
  'GBP-USD': 1.27,
  'CNY-EUR': 0.127,
  'EUR-CNY': 7.88,
  'CNY-JPY': 20.8,
  'JPY-CNY': 0.048,
  'CNY-HKD': 1.09,
  'HKD-CNY': 0.92,
  'CNY-KRW': 186.5,
  'KRW-CNY': 0.0054,
};

const ExchangeWidget: React.FC<ExchangeWidgetProps> = ({ settings, onUpdateSettings }) => {
  const [amount, setAmount] = useState(settings.amount || 100);
  const [fromCurrency, setFromCurrency] = useState(settings.fromCurrency || 'USD');
  const [toCurrency, setToCurrency] = useState(settings.toCurrency || 'CNY');
  const [rate, setRate] = useState(0);

  useEffect(() => {
    const pair = `${fromCurrency}-${toCurrency}`;
    const reversePair = `${toCurrency}-${fromCurrency}`;
    
    if (fromCurrency === toCurrency) {
      setRate(1);
    } else if (mockRates[pair]) {
      setRate(mockRates[pair]);
    } else if (mockRates[reversePair]) {
      setRate(1 / mockRates[reversePair]);
    } else {
      // 通过USD中转
      const fromToUSD = fromCurrency === 'USD' ? 1 : mockRates[`${fromCurrency}-USD`] || mockRates[`USD-${fromCurrency}`] ? 1 / (mockRates[`${fromCurrency}-USD`] || mockRates[`USD-${fromCurrency}`]) : 1;
      const usdToTo = toCurrency === 'USD' ? 1 : mockRates[`USD-${toCurrency}`] || 1 / (mockRates[`${toCurrency}-USD`] || 1);
      setRate(fromToUSD * usdToTo);
    }
  }, [fromCurrency, toCurrency]);

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    onUpdateSettings({ fromCurrency: toCurrency, toCurrency: fromCurrency });
  };

  const result = amount * rate;

  const getCurrencySymbol = (code: string) => {
    return currencies.find(c => c.code === code)?.symbol || code;
  };

  return (
    <div className="flex flex-col h-full p-3">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-accent" />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">汇率换算</span>
      </div>

      <div className="flex-1 space-y-3">
        {/* 金额输入 */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
            {getCurrencySymbol(fromCurrency)}
          </span>
          <input
            type="number"
            value={amount}
            onChange={(e) => {
              setAmount(Number(e.target.value));
              onUpdateSettings({ amount: Number(e.target.value) });
            }}
            className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
          />
        </div>

        {/* 货币选择 */}
        <div className="flex items-center gap-2">
          <select
            value={fromCurrency}
            onChange={(e) => {
              setFromCurrency(e.target.value);
              onUpdateSettings({ fromCurrency: e.target.value });
            }}
            className="flex-1 px-2 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
          >
            {currencies.map(c => (
              <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
            ))}
          </select>
          
          <button
            onClick={swapCurrencies}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
          >
            <ArrowRightLeft className="w-4 h-4 text-slate-500" />
          </button>
          
          <select
            value={toCurrency}
            onChange={(e) => {
              setToCurrency(e.target.value);
              onUpdateSettings({ toCurrency: e.target.value });
            }}
            className="flex-1 px-2 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
          >
            {currencies.map(c => (
              <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
            ))}
          </select>
        </div>

        {/* 结果显示 */}
        <div className="p-3 bg-accent/5 dark:bg-accent/10 rounded-lg">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
            换算结果
          </div>
          <div className="text-2xl font-bold text-accent">
            {getCurrencySymbol(toCurrency)}{result.toFixed(2)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            1 {fromCurrency} ≈ {rate.toFixed(4)} {toCurrency}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExchangeWidget;
