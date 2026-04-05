import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { 
  Search, 
  Bell, 
  Zap,
  Loader2
} from 'lucide-react';

// V6 Components
import DesktopSidebarCN from './DesktopSidebarCN';
import MobileDockCN from './MobileDockCN';

// Lazy load views for better performance
const ResourceCenterViewCN = lazy(() => import('./ResourceCenterViewCN'));

// Services
import { fetchMarketIndices, IndexData } from '../../services/financeService';

interface V6DashboardProps {
  onAddResource?: () => void;
}

// 模拟K线数据
const generateKLineData = () => {
  const data = [];
  let price = 3124;
  for (let i = 0; i < 50; i++) {
    const change = (Math.random() - 0.5) * 20;
    price += change;
    data.push({
      time: i,
      open: price - change,
      close: price,
      high: price + Math.random() * 10,
      low: price - Math.random() * 10,
      up: change > 0
    });
  }
  return data;
};

// 模拟新闻数据
const newsData = [
  {
    id: 1,
    time: '14:45',
    tag: '利好',
    tagColor: 'text-emerald-400',
    content: '证监会：进一步加强融券业务监管，维护市场稳定运行。'
  },
  {
    id: 2,
    time: '14:32',
    content: '多家头部公募基金公告自购，累计金额已超过10亿元。'
  },
  {
    id: 3,
    time: '14:10',
    tag: '利好',
    tagColor: 'text-emerald-400',
    content: '人民银行：将继续保持流动性合理充裕。'
  },
  {
    id: 4,
    time: '13:55',
    content: '白酒板块午后集体走强，贵州茅台涨幅扩大至2%。'
  }
];

// 模拟待办数据
const todoData = [
  {
    id: 1,
    title: '复盘昨日北向资金流入排行',
    completed: true,
    time: '09:30',
    priority: 'normal'
  },
  {
    id: 2,
    title: '分析半导体板块Q3财报数据',
    completed: false,
    time: '高优先级',
    priority: 'high'
  },
  {
    id: 3,
    title: '更新下周自选股池',
    completed: false,
    time: '待处理',
    priority: 'normal'
  }
];

const V6Dashboard: React.FC<V6DashboardProps> = ({ onAddResource }) => {
  const [activeView, setActiveView] = useState<'dashboard' | 'resources' | 'stock' | 'labs' | 'settings' | 'profile'>('dashboard');
  const [mobileTab, setMobileTab] = useState<'home' | 'market' | 'tasks' | 'profile'>('home');
  const [indices, setIndices] = useState<IndexData[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const kLineData = useMemo(() => generateKLineData(), []);

  // 更新时间
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 加载指数数据
  useEffect(() => {
    const loadData = async () => {
      const data = await fetchMarketIndices();
      setIndices(data);
    };
    loadData();
    const timer = setInterval(loadData, 30000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  // 同步桌面和移动端视图
  const handleMobileTabChange = (tab: 'home' | 'market' | 'tasks' | 'profile') => {
    setMobileTab(tab);
    const viewMap: Record<typeof tab, typeof activeView> = {
      home: 'dashboard',
      market: 'stock',
      tasks: 'labs',
      profile: 'profile'
    };
    setActiveView(viewMap[tab]);
  };

  const handleDesktopViewChange = (view: typeof activeView) => {
    setActiveView(view);
    const tabMap: Record<typeof view, typeof mobileTab> = {
      dashboard: 'home',
      resources: 'home',
      stock: 'market',
      labs: 'tasks',
      settings: 'profile',
      profile: 'profile'
    };
    setMobileTab(tabMap[view]);
  };

  return (
    <div className="min-h-screen bg-[#0d0e10] text-white overflow-hidden">
      {/* Desktop Sidebar */}
      <DesktopSidebarCN 
        activeView={activeView} 
        onViewChange={handleDesktopViewChange}
        onUpgrade={() => console.log('Upgrade to Pro')}
      />

      {/* Main Content */}
      <main className="lg:ml-[260px] min-h-screen overflow-y-auto pb-24 lg:pb-0">
        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#0d0e10]/95 backdrop-blur-xl px-4 py-3 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center">
                <Zap className="w-4 h-4 text-[#0d0e10]" />
              </div>
              <span className="text-lg font-bold text-white">Y-Nav Elite</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-xl bg-[#181a1c] text-slate-400">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500" />
              </button>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <span className="text-xs font-bold text-white">李</span>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Header */}
        <header className="hidden lg:flex sticky top-0 z-40 bg-[#0d0e10]/95 backdrop-blur-xl px-6 py-4 border-b border-white/5">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3 flex-1 max-w-xl">
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#181a1c] border border-white/5 w-full">
                <Search className="w-4 h-4 text-slate-500" />
                <input 
                  type="text"
                  placeholder="全局搜索数据、快讯..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 rounded-xl bg-[#181a1c] text-slate-400 hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </button>
              <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">李</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">李明</p>
                  <p className="text-xs text-emerald-400">首席交易员</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Views */}
        <div className="p-4 lg:p-6 pt-16 lg:pt-6">
          <Suspense fallback={
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
          }>
            {activeView === 'resources' ? (
              <ResourceCenterViewCN 
                onAddResource={onAddResource}
                onImport={() => console.log('Import')}
              />
            ) : (
              <DashboardContent 
                indices={indices}
                currentTime={currentTime}
                formatTime={formatTime}
                kLineData={kLineData}
              />
            )}
          </Suspense>
        </div>
      </main>

      {/* Mobile Dock */}
      <MobileDockCN 
        activeTab={mobileTab} 
        onTabChange={handleMobileTabChange}
        onCenterClick={onAddResource}
      />
    </div>
  );
};

// 控制台内容组件
interface DashboardContentProps {
  indices: IndexData[];
  currentTime: Date;
  formatTime: (date: Date) => string;
  kLineData: ReturnType<typeof generateKLineData>;
}

const DashboardContent: React.FC<DashboardContentProps> = ({ 
  indices, 
  currentTime, 
  formatTime,
  kLineData 
}) => {
  return (
    <div className="space-y-4 lg:space-y-6">
      {/* 市场指数滚动条 - 移动端 */}
      <div className="lg:hidden flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {indices.slice(0, 3).map((index) => (
          <div key={index.code} className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400">{index.name}</span>
            <span className={`text-sm font-bold ${index.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {index.value.toFixed(2)}
            </span>
            <span className={`text-xs ${index.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {index.changePercent >= 0 ? '+' : ''}{index.changePercent.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          {/* 上证指数主看板 */}
          <div className="rounded-3xl bg-[#181a1c] p-5 lg:p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white mb-1">上证指数 (000001.SH)</h2>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-emerald-400">3,124.58</span>
                  <span className="text-sm text-emerald-400">+1.24% (+38.20)</span>
                  <span className="text-xs text-slate-500">实时更新: {formatTime(currentTime)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-[#0d0e10] rounded-lg p-1">
                {['分时', '5日', '日K', '月K'].map((period, i) => (
                  <button
                    key={period}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      i === 0 ? 'bg-emerald-500 text-[#0d0e10]' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            {/* K线图 */}
            <div className="h-48 lg:h-64 relative">
              <svg viewBox="0 0 100 50" className="w-full h-full" preserveAspectRatio="none">
                {[0, 25, 50, 75, 100].map((y) => (
                  <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#242629" strokeWidth="0.3" />
                ))}
                {kLineData.map((k, i) => {
                  const x = (i / kLineData.length) * 100;
                  const yScale = 50 / 80;
                  const yBase = 25;
                  return (
                    <g key={i}>
                      <line
                        x1={x}
                        y1={yBase - (k.high - 3080) * yScale}
                        x2={x}
                        y2={yBase - (k.low - 3080) * yScale}
                        stroke={k.up ? '#10b981' : '#ef4444'}
                        strokeWidth="0.3"
                      />
                      <rect
                        x={x - 0.5}
                        y={yBase - Math.max((k.open - 3080) * yScale, (k.close - 3080) * yScale)}
                        width="1"
                        height={Math.abs((k.close - k.open) * yScale) + 0.5}
                        fill={k.up ? '#10b981' : '#ef4444'}
                      />
                    </g>
                  );
                })}
                <path
                  d={`M0,${25 - (3124 - 3080) * 0.625} Q25,${25 - (3110 - 3080) * 0.625} 50,${25 - (3120 - 3080) * 0.625} T100,${25 - (3124 - 3080) * 0.625}`}
                  fill="none"
                  stroke="#69f6b8"
                  strokeWidth="0.5"
                />
              </svg>
            </div>

            {/* 其他指数 */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { name: '深证成指', value: '10,124.33', change: '+0.85%', up: true },
                { name: '创业板指', value: '2,021.15', change: '-0.42%', up: false },
                { name: '沪深300', value: '3,892.41', change: '+1.02%', up: true },
              ].map((item) => (
                <div key={item.name} className="p-3 rounded-2xl bg-[#0d0e10]">
                  <p className="text-xs text-slate-500 mb-1">{item.name}</p>
                  <p className="text-base font-bold text-white">{item.value}</p>
                  <p className={`text-xs ${item.up ? 'text-emerald-400' : 'text-red-400'}`}>{item.change}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 专注待办 + 天气 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* 专注待办 */}
            <div className="rounded-3xl bg-[#181a1c] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white">专注待办</h3>
                <button className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                  <span className="text-lg text-[#0d0e10]">+</span>
                </button>
              </div>
              <div className="space-y-3">
                {todoData.map((todo) => (
                  <div key={todo.id} className="flex items-start gap-3 p-3 rounded-2xl bg-[#0d0e10]">
                    <button className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center ${
                      todo.completed ? 'bg-emerald-500' : 'border-2 border-slate-600'
                    }`}>
                      {todo.completed && <span className="text-[#0d0e10] text-xs">✓</span>}
                    </button>
                    <div className="flex-1">
                      <p className={`text-sm ${todo.completed ? 'text-slate-500 line-through' : 'text-white'}`}>
                        {todo.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {todo.priority === 'high' && <span className="text-emerald-400 mr-2">高优先级</span>}
                        {todo.completed ? '已完成' : todo.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 天气卡片 */}
            <div className="rounded-3xl bg-[#181a1c] p-5 relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-4xl font-bold text-white">24°C</p>
                    <p className="text-sm text-slate-400 mt-1">上海, 浦东新区</p>
                    <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs mt-2 inline-block">多云转晴</span>
                  </div>
                  <span className="text-6xl opacity-30">☁️</span>
                </div>
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                  {[
                    { day: '周一', icon: '☀️', temp: '28°' },
                    { day: '周二', icon: '⛅', temp: '30°' },
                    { day: '周三', icon: '🌧️', temp: '22°' },
                    { day: '周四', icon: '⛈️', temp: '25°' },
                  ].map((day) => (
                    <div key={day.day} className="text-center">
                      <p className="text-xs text-slate-500 mb-1">{day.day}</p>
                      <p className="text-lg mb-1">{day.icon}</p>
                      <p className="text-sm text-white">{day.temp}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - 资讯 */}
        <div className="space-y-4 lg:space-y-6">
          {/* 实时快讯 */}
          <div className="rounded-3xl bg-[#181a1c] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">实时快讯</h3>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-emerald-400">实时更新中</span>
              </div>
            </div>
            <div className="space-y-4">
              {newsData.map((news) => (
                <div key={news.id} className="relative pl-4 border-l-2 border-emerald-500/30">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-slate-500">{news.time}</span>
                    {news.tag && <span className={`text-xs font-bold ${news.tagColor}`}>{news.tag}</span>}
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">{news.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 市场情绪指数 */}
          <div className="rounded-3xl bg-[#181a1c] p-5">
            <h3 className="text-base font-bold text-white mb-4">市场情绪指数</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-5xl font-bold text-emerald-400">84</p>
                <p className="text-sm text-emerald-400 mt-1">极度活跃</p>
              </div>
              <div className="w-20 h-20 rounded-full border-4 border-emerald-500/30 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent rotate-45" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部安全区域填充 */}
      <div className="h-20 lg:hidden" />
    </div>
  );
};

export default V6Dashboard;
