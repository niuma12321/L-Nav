import React from 'react';
import { ExternalLink } from '@/utils/icons';

// ==========================================
// 通用工具函数
// ==========================================

// 获取热度排名颜色
const getHotRankColor = (rank: number): string => {
  if (rank === 0) return 'text-red-500 font-bold';
  if (rank === 1) return 'text-orange-500 font-bold';
  if (rank === 2) return 'text-yellow-500 font-bold';
  return 'text-slate-500';
};

// 格式化热度值
const formatHotValue = (value: string | number): string => {
  const num = typeof value === 'string' ? parseInt(value.replace(/[^\d]/g, '')) : value;
  if (isNaN(num)) return String(value);
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toString();
};

// ==========================================
// 1. 60秒读懂世界 - 纯文本列表
// API: /v2/60s
// 数据结构: { data: { news: string[] } }
// ==========================================
export const News60sRenderer: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <div className="space-y-2 overflow-y-auto max-h-[300px]">
      {data.map((item, index) => (
        <div
          key={index}
          className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-[#1a1c1f] transition-colors"
        >
          <span className={`text-sm w-5 text-center shrink-0 ${getHotRankColor(index)}`}>
            {index + 1}
          </span>
          <p className="text-sm text-slate-300 flex-1 leading-relaxed">
            {typeof item === 'string' ? item : item.title || String(item)}
          </p>
        </div>
      ))}
    </div>
  );
};

// ==========================================
// 2. AI资讯 - 带来源链接
// API: /v2/ai-news
// 数据结构: { data: [{ title, source, link, time }] }
// ==========================================
export const AINewsRenderer: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <div className="space-y-2 overflow-y-auto max-h-[300px]">
      {data.map((item, index) => (
        <a
          key={index}
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-[#1a1c1f] transition-colors group cursor-pointer"
        >
          <span className={`text-sm w-5 text-center shrink-0 ${getHotRankColor(index)}`}>
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-300 leading-relaxed group-hover:text-emerald-400 transition-colors line-clamp-2">
              {item.title}
            </p>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
              <span>{item.source}</span>
              {item.time && <span>· {item.time}</span>}
            </div>
          </div>
        </a>
      ))}
    </div>
  );
};

// ==========================================
// 3. IT资讯 - 带发布时间
// API: /v2/ithome
// ==========================================
export const ITNewsRenderer: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <div className="space-y-2 overflow-y-auto max-h-[300px]">
      {data.map((item, index) => (
        <a
          key={index}
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-[#1a1c1f] transition-colors group cursor-pointer"
        >
          <span className={`text-sm w-5 text-center shrink-0 ${getHotRankColor(index)}`}>
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-300 leading-relaxed group-hover:text-emerald-400 transition-colors line-clamp-2">
              {item.title}
            </p>
            <span className="text-xs text-slate-500 mt-1 block">{item.time}</span>
          </div>
        </a>
      ))}
    </div>
  );
};

// ==========================================
// 4. 必应壁纸 - 大图卡片展示
// API: /v2/bing
// 数据结构: { data: { title, description, cover, cover_4k } }
// ==========================================
export const BingWallpaperRenderer: React.FC<{ data: any[] }> = ({ data }) => {
  const item = data[0] || {};
  const imageUrl = item.cover_4k || item.cover;

  return (
    <div className="rounded-xl overflow-hidden bg-[#0d0e10]">
      {imageUrl && (
        <div className="relative aspect-video">
          <img
            src={imageUrl}
            alt={item.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
      <div className="p-3">
        <p className="text-sm font-medium text-white mb-1">{item.title}</p>
        {item.description && (
          <p className="text-xs text-slate-400 line-clamp-2">{item.description}</p>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 5. 汇率 - 表格展示
// API: /v2/exchange-rate
// 数据结构: { data: { rates: [{currency, rate}, ...] } }
// ==========================================
export const ExchangeRateRenderer: React.FC<{ data: any[] }> = ({ data }) => {
  // data is already the rates array from data.rates
  const rates = data.slice(0, 10); // Show first 10 currencies

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-slate-400 border-b border-white/10">
            <th className="text-left py-2 px-2">货币</th>
            <th className="text-right py-2 px-2">汇率</th>
          </tr>
        </thead>
        <tbody>
          {rates.map((item, index) => (
            <tr key={index} className="border-b border-white/5 hover:bg-[#0d0e10]">
              <td className="py-2 px-2 text-white">{item.currency}</td>
              <td className="py-2 px-2 text-right text-emerald-400">
                {typeof item.rate === 'number' ? item.rate.toFixed(4) : item.rate}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ==========================================
// 6. 历史上的今天 - 带年份标签
// API: /v2/today-in-history
// ==========================================
export const HistoryTodayRenderer: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <div className="space-y-3 overflow-y-auto max-h-[300px]">
      {data.map((item, index) => (
        <a
          key={index}
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-3 rounded-xl bg-[#0d0e10] hover:bg-[#1a1c1f] transition-colors group cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-400">
              {item.year}
            </span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed group-hover:text-emerald-400 transition-colors">
            {item.title}
          </p>
          {item.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
          )}
        </a>
      ))}
    </div>
  );
};

// ==========================================
// 7. Epic免费游戏 - 媒体卡片
// API: /v2/epic
// ==========================================
export const EpicGamesRenderer: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <div className="space-y-3 overflow-y-auto max-h-[300px]">
      {data.map((item, index) => (
        <a
          key={index}
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-3 rounded-xl bg-[#0d0e10] hover:bg-[#1a1c1f] transition-colors group cursor-pointer"
        >
          <div className="flex items-start gap-3">
            {item.cover && (
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-800 shrink-0">
                <img
                  src={item.cover}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white mb-1 group-hover:text-emerald-400 transition-colors line-clamp-1">
                {item.title}
              </p>
              {item.description && (
                <p className="text-xs text-slate-400 line-clamp-2 mb-1">{item.description}</p>
              )}
              {item.end_date && (
                <span className="text-xs text-amber-400">截止: {item.end_date}</span>
              )}
            </div>
            <ExternalLink className="w-4 h-4 text-slate-500 shrink-0 mt-1" />
          </div>
        </a>
      ))}
    </div>
  );
};

// ==========================================
// 8. 黄金价格 - 带涨跌指示
// API: /v2/gold
// ==========================================
export const GoldPriceRenderer: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-slate-400 border-b border-white/10">
            <th className="text-left py-2 px-2">品种</th>
            <th className="text-right py-2 px-2">价格</th>
            <th className="text-right py-2 px-2">涨跌</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => {
            const change = item.change || '';
            const isUp = change.includes('+');
            const isDown = change.includes('-');
            return (
              <tr key={index} className="border-b border-white/5 hover:bg-[#0d0e10]">
                <td className="py-2 px-2 text-white">{item.name}</td>
                <td className="py-2 px-2 text-right font-medium">{item.price}</td>
                <td className={`py-2 px-2 text-right text-xs ${isUp ? 'text-red-400' : isDown ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {change}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ==========================================
// 9. 油价 - 多列展示
// API: /v2/oil
// ==========================================
export const OilPriceRenderer: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-slate-400 border-b border-white/10">
            <th className="text-left py-2 px-2">地区</th>
            <th className="text-right py-2 px-2">92#</th>
            <th className="text-right py-2 px-2">95#</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index} className="border-b border-white/5 hover:bg-[#0d0e10]">
              <td className="py-2 px-2 text-white">{item.region}</td>
              <td className="py-2 px-2 text-right text-emerald-400">{item.price_92}</td>
              <td className="py-2 px-2 text-right text-emerald-400">{item.price_95}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ==========================================
// 10. 摸鱼日报 - 富文本卡片
// API: /v2/moyu
// 数据结构: { data: { moyuQuote: "string content" } }
// ==========================================
export const MoyuDailyRenderer: React.FC<{ data: any[] }> = ({ data }) => {
  // data 可能是 [{moyuQuote: "content"}] 或 ["content"]
  let content = '';
  
  if (data && data.length > 0) {
    const firstItem = data[0];
    if (typeof firstItem === 'string') {
      content = firstItem;
    } else if (typeof firstItem === 'object' && firstItem !== null) {
      content = firstItem.moyuQuote || firstItem.content || firstItem.title || '';
    }
  }

  if (!content) {
    return (
      <div className="p-4 rounded-xl bg-[#0d0e10] text-center">
        <p className="text-sm text-slate-400">暂无摸鱼日报</p>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-[#0d0e10] overflow-y-auto max-h-[300px]">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">☕</span>
        <span className="text-xs text-emerald-400 font-medium">摸鱼日报</span>
      </div>
      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
        {content}
      </p>
    </div>
  );
};

// ==========================================
// 11. 天气 - 大卡片展示
// API: /v2/weather
// ==========================================
export const WeatherRenderer: React.FC<{ data: any[] }> = ({ data }) => {
  const item = data[0] || {};

  return (
    <div className="p-4 rounded-xl bg-[#0d0e10]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-medium text-white">{item.city}</p>
          <p className="text-sm text-slate-400">{item.weather}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-emerald-400">{item.temp}°</p>
          {item.temp_range && (
            <p className="text-xs text-slate-400">{item.temp_range}</p>
          )}
        </div>
      </div>
      {item.air_quality && (
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2">
          <span className="text-xs text-slate-400">空气质量</span>
          <span className={`px-2 py-0.5 rounded text-xs ${
            item.aqi <= 50 ? 'bg-emerald-500/20 text-emerald-400' :
            item.aqi <= 100 ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {item.air_quality} {item.aqi}
          </span>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 12. 天气预报 - 列表
// API: /v2/weather/forecast
// ==========================================
export const WeatherForecastRenderer: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <div className="space-y-2">
      {data.map((item, index) => (
        <div key={index} className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#0d0e10]">
          <span className="text-sm text-slate-300 w-20">{item.date}</span>
          <span className="text-sm text-slate-400 flex-1 text-center">{item.weather}</span>
          <span className="text-sm text-emerald-400 w-20 text-right">{item.temp}</span>
        </div>
      ))}
    </div>
  );
};

// ==========================================
// 13. IP信息 - 文本展示
// API: /v2/ip
// ==========================================
export const IPInfoRenderer: React.FC<{ data: any[] }> = ({ data }) => {
  const item = data[0] || {};

  return (
    <div className="p-4 rounded-xl bg-[#0d0e10] space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">IP地址</span>
        <span className="text-sm font-mono text-emerald-400">{item.ip}</span>
      </div>
      {item.location && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">位置</span>
          <span className="text-sm text-white">{item.location}</span>
        </div>
      )}
      {item.isp && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">运营商</span>
          <span className="text-sm text-white">{item.isp}</span>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 14. 抖音热搜 - 带封面图
// API: /v2/douyin
// ==========================================
export const DouyinHotRenderer: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <div className="space-y-2 overflow-y-auto max-h-[300px]">
      {data.map((item, index) => (
        <a
          key={index}
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-[#1a1c1f] transition-colors group cursor-pointer"
        >
          <span className={`text-sm w-5 text-center shrink-0 ${getHotRankColor(index)}`}>
            {index + 1}
          </span>
          {item.cover && (
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-800 shrink-0">
              <img
                src={item.cover}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-300 leading-relaxed group-hover:text-emerald-400 transition-colors line-clamp-2">
              {item.title}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-red-400">🔥 {formatHotValue(item.hot_value)}</span>
              {item.active_time && (
                <span className="text-xs text-slate-500">{item.active_time}</span>
              )}
            </div>
          </div>
        </a>
      ))}
    </div>
  );
};

// ==========================================
// 15. 小红书热点
// API: /v2/rednote
// ==========================================
export const XiaohongshuHotRenderer: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <div className="space-y-2 overflow-y-auto max-h-[300px]">
      {data.map((item, index) => (
        <a
          key={index}
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-[#1a1c1f] transition-colors group cursor-pointer"
        >
          <span className={`text-sm w-5 text-center shrink-0 ${getHotRankColor(index)}`}>
            {index + 1}
          </span>
          <p className="text-sm text-slate-300 flex-1 leading-relaxed truncate group-hover:text-emerald-400 transition-colors">
            {item.title}
          </p>
          <span className="text-xs text-red-400 shrink-0">{formatHotValue(item.score)}</span>
        </a>
      ))}
    </div>
  );
};

// ==========================================
// 16. 哔哩哔哩热搜
// API: /v2/bili
// ==========================================
export const BilibiliHotRenderer: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <div className="space-y-2 overflow-y-auto max-h-[300px]">
      {data.map((item, index) => (
        <a
          key={index}
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-[#1a1c1f] transition-colors group cursor-pointer"
        >
          <span className={`text-sm w-5 text-center shrink-0 ${getHotRankColor(index)}`}>
            {index + 1}
          </span>
          <p className="text-sm text-slate-300 flex-1 leading-relaxed truncate group-hover:text-emerald-400 transition-colors">
            {item.title}
          </p>
          <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${
            index < 3 ? 'bg-pink-500/20 text-pink-400' : 'bg-slate-500/20 text-slate-400'
          }`}>
            {formatHotValue(item.hot_value)}
          </span>
        </a>
      ))}
    </div>
  );
};

// ==========================================
// 17. 微博热搜
// API: /v2/weibo
// ==========================================
export const WeiboHotRenderer: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <div className="space-y-2 overflow-y-auto max-h-[300px]">
      {data.map((item, index) => {
        const hotValue = item.hot_value || '';
        const isBoiling = hotValue.includes('沸');
        const isHot = hotValue.includes('热');
        const isNew = hotValue.includes('新');

        return (
          <a
            key={index}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-[#1a1c1f] transition-colors group cursor-pointer"
          >
            <span className={`text-sm w-5 text-center shrink-0 ${getHotRankColor(index)}`}>
              {index + 1}
            </span>
            <p className="text-sm text-slate-300 flex-1 leading-relaxed truncate group-hover:text-emerald-400 transition-colors">
              {item.title}
            </p>
            <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${
              isBoiling ? 'bg-red-500/20 text-red-400' :
              isHot ? 'bg-orange-500/20 text-orange-400' :
              isNew ? 'bg-emerald-500/20 text-emerald-400' :
              'bg-slate-500/20 text-slate-400'
            }`}>
              {hotValue}
            </span>
          </a>
        );
      })}
    </div>
  );
};

// ==========================================
// 18. 知乎热榜
// API: /v2/zhihu
// ==========================================
export const ZhihuHotRenderer: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <div className="space-y-2 overflow-y-auto max-h-[300px]">
      {data.map((item, index) => (
        <a
          key={index}
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-[#1a1c1f] transition-colors group cursor-pointer"
        >
          <span className={`text-sm w-5 text-center shrink-0 ${getHotRankColor(index)}`}>
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-300 leading-relaxed group-hover:text-emerald-400 transition-colors line-clamp-2">
              {item.title}
            </p>
            <span className="text-xs text-slate-500 mt-1 block">{item.hot_value_desc}</span>
          </div>
        </a>
      ))}
    </div>
  );
};

// ==========================================
// 19. 百度热搜
// API: /v2/baidu
// ==========================================
export const BaiduHotRenderer: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <div className="space-y-2 overflow-y-auto max-h-[300px]">
      {data.map((item, index) => (
        <a
          key={index}
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-[#1a1c1f] transition-colors group cursor-pointer"
        >
          <span className={`text-sm w-5 text-center shrink-0 ${getHotRankColor(index)}`}>
            {index + 1}
          </span>
          <p className="text-sm text-slate-300 flex-1 leading-relaxed truncate group-hover:text-emerald-400 transition-colors">
            {item.title}
          </p>
          <span className="text-xs text-slate-500 shrink-0">{formatHotValue(item.hot_value)}</span>
        </a>
      ))}
    </div>
  );
};

// ==========================================
// 20. 夸克热点
// API: /v2/quark
// ==========================================
export const QuarkHotRenderer: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <div className="space-y-2 overflow-y-auto max-h-[300px]">
      {data.map((item, index) => (
        <a
          key={index}
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-[#1a1c1f] transition-colors group cursor-pointer"
        >
          <span className={`text-sm w-5 text-center shrink-0 ${getHotRankColor(index)}`}>
            {index + 1}
          </span>
          <p className="text-sm text-slate-300 flex-1 leading-relaxed truncate group-hover:text-emerald-400 transition-colors">
            {item.title}
          </p>
          <span className="text-xs text-emerald-400 shrink-0">{formatHotValue(item.hot_value)}</span>
        </a>
      ))}
    </div>
  );
};

// ==========================================
// 21. 懂车帝热搜
// API: /v2/dongchedi
// ==========================================
export const DongchediHotRenderer: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <div className="space-y-2 overflow-y-auto max-h-[300px]">
      {data.map((item, index) => (
        <a
          key={index}
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-[#1a1c1f] transition-colors group cursor-pointer"
        >
          <span className={`text-sm w-5 text-center shrink-0 ${getHotRankColor(index)}`}>
            {index + 1}
          </span>
          <p className="text-sm text-slate-300 flex-1 leading-relaxed truncate group-hover:text-emerald-400 transition-colors">
            {item.title}
          </p>
          <span className="text-xs text-blue-400 shrink-0">{formatHotValue(item.hot_value)}</span>
        </a>
      ))}
    </div>
  );
};

// ==========================================
// 22. 头条热搜
// API: /v2/toutiao
// ==========================================
export const ToutiaoHotRenderer: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <div className="space-y-2 overflow-y-auto max-h-[300px]">
      {data.map((item, index) => (
        <a
          key={index}
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-[#1a1c1f] transition-colors group cursor-pointer"
        >
          <span className={`text-sm w-5 text-center shrink-0 ${getHotRankColor(index)}`}>
            {index + 1}
          </span>
          <p className="text-sm text-slate-300 flex-1 leading-relaxed truncate group-hover:text-emerald-400 transition-colors">
            {item.title}
          </p>
          <span className="text-xs text-red-400 shrink-0">{formatHotValue(item.hot_value)}万</span>
        </a>
      ))}
    </div>
  );
};

// ==========================================
// 23. Hacker News
// API: /v2/hackernews
// ==========================================
export const HackerNewsRenderer: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <div className="space-y-2 overflow-y-auto max-h-[300px]">
      {data.map((item, index) => (
        <a
          key={index}
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-[#1a1c1f] transition-colors group cursor-pointer"
        >
          <span className={`text-sm w-5 text-center shrink-0 ${getHotRankColor(index)}`}>
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-300 leading-relaxed group-hover:text-emerald-400 transition-colors line-clamp-2">
              {item.title}
            </p>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
              <span>▲ {item.points}</span>
              <span>{item.comments} comments</span>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
};

// ==========================================
// 24. 随机一言
// API: /v2/hitokoto
// ==========================================
export const RandomQuoteRenderer: React.FC<{ data: any[] }> = ({ data }) => {
  const item = data[0] || {};

  return (
    <div className="p-6 rounded-xl bg-[#0d0e10] text-center">
      <p className="text-lg text-slate-200 leading-relaxed font-medium">
        「{item.hitokoto || item.title || ''}」
      </p>
      {item.from && (
        <p className="text-sm text-slate-500 mt-4">—— {item.from}</p>
      )}
    </div>
  );
};

// ==========================================
// 25. 随机搞笑段子
// API: /v2/joke
// ==========================================
export const RandomJokeRenderer: React.FC<{ data: any[] }> = ({ data }) => {
  const item = data[0] || {};
  const content = item.content || item.title || '';

  return (
    <div className="p-4 rounded-xl bg-[#0d0e10]">
      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
        {content}
      </p>
    </div>
  );
};

// ==========================================
// 26. 随机冷笑话
// API: /v2/cold-joke
// ==========================================
export const RandomColdJokeRenderer: React.FC<{ data: any[] }> = ({ data }) => {
  const item = data[0] || {};
  const content = item.content || item.title || '';

  return (
    <div className="p-4 rounded-xl bg-[#0d0e10] border border-blue-500/20">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">❄️</span>
        <span className="text-xs text-blue-400">冷笑话</span>
      </div>
      <p className="text-sm text-slate-300 leading-relaxed">
        {content}
      </p>
    </div>
  );
};

// ==========================================
// 27. 随机运势
// API: /v2/fortune
// ==========================================
export const RandomFortuneRenderer: React.FC<{ data: any[] }> = ({ data }) => {
  const item = data[0] || {};

  const fortuneColors: Record<string, string> = {
    '大吉': 'text-red-400 bg-red-500/20',
    '吉': 'text-orange-400 bg-orange-500/20',
    '中平': 'text-yellow-400 bg-yellow-500/20',
    '凶': 'text-slate-400 bg-slate-500/20',
    '大凶': 'text-red-600 bg-red-900/20',
  };

  const fortuneClass = fortuneColors[item.fortune] || 'text-emerald-400 bg-emerald-500/20';

  return (
    <div className="p-4 rounded-xl bg-[#0d0e10] text-center">
      <div className="mb-4">
        <span className={`px-4 py-2 rounded-full text-lg font-bold ${fortuneClass}`}>
          {item.fortune || '运势'}
        </span>
      </div>
      {item.lucky_color && (
        <p className="text-sm text-slate-400">幸运色: {item.lucky_color}</p>
      )}
      {item.lucky_number && (
        <p className="text-sm text-slate-400 mt-1">幸运数字: {item.lucky_number}</p>
      )}
    </div>
  );
};

// ==========================================
// 28. KFC V50文案
// API: /v2/kfc
// ==========================================
export const KFCV50Renderer: React.FC<{ data: any[] }> = ({ data }) => {
  const item = data[0] || {};
  const content = item.content || item.title || '';

  return (
    <div className="p-4 rounded-xl bg-[#0d0e10] border border-red-500/20">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🍗</span>
        <span className="text-sm font-medium text-red-400">疯狂星期四</span>
      </div>
      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
        {content}
      </p>
    </div>
  );
};

// ==========================================
// 渲染器映射表
// ==========================================
export const API_RENDERERS: Record<string, React.FC<{ data: any[] }>> = {
  '60s-news': News60sRenderer,
  'ai-news': AINewsRenderer,
  'it-news': ITNewsRenderer,
  'bing-wallpaper': BingWallpaperRenderer,
  'exchange-rate': ExchangeRateRenderer,
  'history-today': HistoryTodayRenderer,
  'epic-games': EpicGamesRenderer,
  'gold-price': GoldPriceRenderer,
  'oil-price': OilPriceRenderer,
  'moyu-daily': MoyuDailyRenderer,
  'weather': WeatherRenderer,
  'weather-forecast': WeatherForecastRenderer,
  'ip-info': IPInfoRenderer,
  'douyin-hot': DouyinHotRenderer,
  'xiaohongshu-hot': XiaohongshuHotRenderer,
  'bilibili-hot': BilibiliHotRenderer,
  'weibo-hot': WeiboHotRenderer,
  'zhihu-hot': ZhihuHotRenderer,
  'baidu-hot': BaiduHotRenderer,
  'quark-hot': QuarkHotRenderer,
  'dongchedi-hot': DongchediHotRenderer,
  'toutiao-hot': ToutiaoHotRenderer,
  'hackernews-hot': HackerNewsRenderer,
  'random-quote': RandomQuoteRenderer,
  'random-joke': RandomJokeRenderer,
  'random-cold-joke': RandomColdJokeRenderer,
  'random-fortune': RandomFortuneRenderer,
  'kfc-v50': KFCV50Renderer,
};

// 获取渲染器
export const getRenderer = (rendererId: string): React.FC<{ data: any[] }> | null => {
  return API_RENDERERS[rendererId] || null;
};

export default API_RENDERERS;
