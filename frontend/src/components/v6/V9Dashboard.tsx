import React, { useState, useEffect, lazy, Suspense } from 'react';
import { 
  Search, 
  Bell, 
  Zap,
  Loader2,
  Grid3X3,
  LayoutDashboard,
  FolderOpen,
  FlaskConical,
  Plus,
  Save,
  GripVertical
} from 'lucide-react';
import { useWidgetSystem } from '../../hooks/useWidgetSystem';
import { WidgetConfig } from './widgetTypes';

// Lazy load views
const ResourceCenterViewCN = lazy(() => import('./ResourceCenterViewCN'));
const WidgetConfigCenter = lazy(() => import('./WidgetConfigCenter'));

interface V9DashboardProps {
  onAddResource?: () => void;
}

// 实际小组件渲染
const WidgetRenderer: React.FC<{ widget: WidgetConfig }> = ({ widget }) => {
  switch (widget.type) {
    case 'weather':
      return <WeatherWidget />;
    case 'stock-widget':
      return <StockWidget />;
    case 'custom-links':
      return <TodoWidget />;
    case 'news-feed':
      return <NewsWidget />;
    case 'search-hub':
      return <SearchWidget />;
    default:
      return <div className="p-4 text-slate-400">组件加载中...</div>;
  }
};

// 天气小组件
const WeatherWidget: React.FC = () => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-4xl font-bold text-white">24°C</p>
          <p className="text-sm text-slate-400 mt-1">上海, 浦东新区</p>
        </div>
        <span className="text-4xl">☁️</span>
      </div>
      <div className="flex-1">
        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm">多云转晴</span>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
          {['周一', '周二', '周三', '周四'].map((day, i) => (
            <div key={day} className="text-center">
              <p className="text-xs text-slate-500">{day}</p>
              <p className="text-lg my-1">{['☀️', '⛅', '🌧️', '⛈️'][i]}</p>
              <p className="text-sm text-white">{['28°', '30°', '22°', '25°'][i]}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 金融小组件
const StockWidget: React.FC = () => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-medium text-slate-400">上证指数</h3>
          <p className="text-2xl font-bold text-emerald-400">3,124.58</p>
          <p className="text-xs text-emerald-400">+1.24%</p>
        </div>
        <div className="flex gap-1">
          {['分时', '日K', '月K'].map((p, i) => (
            <button key={p} className={`px-2 py-1 rounded text-xs ${i === 0 ? 'bg-emerald-500 text-[#0d0e10]' : 'bg-[#0d0e10] text-slate-400'}`}>{p}</button>
          ))}
        </div>
      </div>
      <div className="flex-1 flex items-end gap-1">
        {[40, 45, 42, 48, 55, 52, 60, 58, 65, 70, 68, 75, 72, 78, 82, 80, 85, 88, 86, 90].map((h, i) => (
          <div key={i} className="flex-1 bg-emerald-500/30 rounded-t" style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/5">
        {[
          { name: '深证成指', value: '10,124', change: '+0.85%' },
          { name: '创业板指', value: '2,021', change: '-0.42%' },
          { name: '沪深300', value: '3,892', change: '+1.02%' },
        ].map(item => (
          <div key={item.name} className="text-center">
            <p className="text-xs text-slate-500">{item.name}</p>
            <p className="text-sm font-medium text-white">{item.value}</p>
            <p className={`text-xs ${item.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>{item.change}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// 待办小组件
const TodoWidget: React.FC = () => {
  const todos = [
    { id: 1, title: '复盘昨日北向资金流入排行', completed: true, time: '09:30' },
    { id: 2, title: '分析半导体板块Q3财报数据', completed: false, priority: 'high' },
    { id: 3, title: '更新下周自选股池', completed: false },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-white">待办清单</h3>
        <button className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-[#0d0e10] text-lg">+</button>
      </div>
      <div className="flex-1 space-y-2 overflow-auto">
        {todos.map(todo => (
          <div key={todo.id} className="flex items-start gap-3 p-3 rounded-xl bg-[#0d0e10]">
            <button className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center ${todo.completed ? 'bg-emerald-500' : 'border-2 border-slate-600'}`}>
              {todo.completed && <span className="text-[#0d0e10] text-xs">✓</span>}
            </button>
            <div className="flex-1">
              <p className={`text-sm ${todo.completed ? 'text-slate-500 line-through' : 'text-white'}`}>{todo.title}</p>
              <p className="text-xs text-slate-500 mt-1">
                {todo.priority === 'high' && <span className="text-emerald-400 mr-2">高优先级</span>}
                {todo.completed ? '已完成' : todo.time || '待处理'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 资讯小组件
const NewsWidget: React.FC = () => {
  const news = [
    { id: 1, time: '14:45', tag: '利好', tagColor: 'text-emerald-400', content: '证监会：进一步加强融券业务监管，维护市场稳定运行。' },
    { id: 2, time: '14:32', content: '多家头部公募基金公告自购，累计金额已超过10亿元。' },
    { id: 3, time: '14:10', tag: '利好', tagColor: 'text-emerald-400', content: '人民银行：将继续保持流动性合理充裕。' },
    { id: 4, time: '13:55', content: '白酒板块午后集体走强，贵州茅台涨幅扩大至2%。' },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-white">实时快讯</h3>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-emerald-400">实时更新中</span>
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-auto">
        {news.map(item => (
          <div key={item.id} className="relative pl-3 border-l-2 border-emerald-500/30">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-slate-500">{item.time}</span>
              {item.tag && <span className={`text-xs font-bold ${item.tagColor}`}>{item.tag}</span>}
            </div>
            <p className="text-sm text-slate-300 line-clamp-2">{item.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// 搜索小组件
const SearchWidget: React.FC = () => {
  const engines = ['Google', '百度', 'GitHub', '知乎'];
  const [activeEngine, setActiveEngine] = useState('Google');

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        {engines.map(engine => (
          <button
            key={engine}
            onClick={() => setActiveEngine(engine)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              activeEngine === engine ? 'bg-emerald-500 text-[#0d0e10]' : 'bg-[#0d0e10] text-slate-400 hover:text-white'
            }`}
          >
            {engine}
          </button>
        ))}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0d0e10] border border-white/5">
          <Search className="w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder={`在 ${activeEngine} 中搜索...`}
            className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none"
          />
        </div>
        <div className="mt-4">
          <p className="text-xs text-slate-500 mb-2">热门搜索</p>
          <div className="flex flex-wrap gap-2">
            {['React 19', 'AI 编程', '美股行情', '前端面试'].map(tag => (
              <span key={tag} className="px-3 py-1 rounded-full bg-white/5 text-sm text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer transition-colors">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// 侧边栏导航
const Sidebar: React.FC<{
  activeView: string;
  onViewChange: (view: string) => void;
  editMode: boolean;
  onEditModeToggle: () => void;
}> = ({ activeView, onViewChange, editMode, onEditModeToggle }) => {
  const navItems = [
    { id: 'dashboard', label: '控制台', icon: LayoutDashboard },
    { id: 'resources', label: '资源中心', icon: FolderOpen },
    { id: 'widgets', label: '组件配置', icon: Grid3X3 },
    { id: 'labs', label: '实验室', icon: FlaskConical },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] bg-[#0d0e10] flex flex-col z-50 hidden lg:flex border-r border-white/5">
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Zap className="w-5 h-5 text-[#0d0e10]" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-white">Y-Nav Elite</span>
            <span className="text-[10px] text-slate-500">V9.0 CONSOLE</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 ${
                isActive 
                  ? 'bg-emerald-500/15 text-emerald-400 border-l-2 border-emerald-400' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <button
          onClick={onEditModeToggle}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
            editMode 
              ? 'bg-emerald-500 text-[#0d0e10] font-semibold' 
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Grid3X3 className="w-5 h-5" />
          <span className="font-medium text-sm">{editMode ? '完成编辑' : '编辑布局'}</span>
        </button>
      </div>

      <div className="p-4 mx-4 mb-4 rounded-2xl bg-[#181a1c]">
        <span className="text-xs text-slate-400">Workspace Storage</span>
        <div className="h-2 rounded-full bg-[#0d0e10] overflow-hidden mt-2">
          <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" />
        </div>
      </div>
    </aside>
  );
};

const V9Dashboard: React.FC<V9DashboardProps> = ({ onAddResource }) => {
  const [activeView, setActiveView] = useState('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const { 
    enabledWidgets, 
    isLoaded, 
    editMode, 
    setEditMode,
    toggleWidget,
    updateWidgetPosition 
  } = useWidgetSystem();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleViewChange = (view: string) => {
    setActiveView(view);
    if (view === 'widgets') {
      setEditMode(false);
    }
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
    if (!editMode) {
      setActiveView('dashboard');
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0d0e10] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0e10] text-white overflow-hidden">
      <Sidebar 
        activeView={activeView} 
        onViewChange={handleViewChange}
        editMode={editMode}
        onEditModeToggle={toggleEditMode}
      />

      <main className="lg:ml-[260px] min-h-screen overflow-y-auto pb-24 lg:pb-0">
        <header className="sticky top-0 z-40 bg-[#0d0e10]/95 backdrop-blur-xl px-6 py-4 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 max-w-xl">
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#181a1c] border border-white/5 w-full">
                <Search className="w-4 h-4 text-slate-500" />
                <input 
                  type="text"
                  placeholder="搜索组件或设置..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              {editMode && (
                <button 
                  onClick={() => setEditMode(false)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-[#0d0e10] font-semibold"
                >
                  <Save className="w-4 h-4" />
                  <span>保存当前布局</span>
                </button>
              )}
              <button className="relative p-2 rounded-xl bg-[#181a1c] text-slate-400 hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </button>
              <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">李</span>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-white">李明</p>
                  <p className="text-xs text-emerald-400">Pro Developer</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
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
            ) : activeView === 'widgets' ? (
              <WidgetConfigCenter />
            ) : (
              <>
                {/* Dashboard Welcome */}
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-white mb-2">
                    {editMode ? '布局编辑模式' : `上午好，${currentTime.getHours() < 12 ? '开启高效的一天' : '继续加油'}`}
                  </h1>
                  <p className="text-sm text-slate-400">
                    {editMode 
                      ? '拖拽组件以调整位置' 
                      : `当前时间 ${currentTime.toLocaleTimeString('zh-CN', {hour: '2-digit', minute:'2-digit'})} · 今日已启用 ${enabledWidgets.length} 个组件`}
                  </p>
                </div>

                {/* Widgets Grid */}
                <div className="grid grid-cols-12 gap-4 auto-rows-min">
                  {enabledWidgets.map((widget) => (
                    <div
                      key={widget.id}
                      draggable={editMode}
                      className={`
                        ${editMode ? 'cursor-move ring-2 ring-emerald-500/30' : ''}
                        transition-all duration-200
                      `}
                      style={{
                        gridColumn: `span ${Math.min(widget.position.desktop.w, 12)}`,
                        gridRow: `span ${widget.position.desktop.h}`,
                        minHeight: widget.position.desktop.h > 1 ? '300px' : '150px'
                      }}
                    >
                      <div className="h-full rounded-3xl bg-[#181a1c] p-5 hover:shadow-lg hover:shadow-emerald-500/5 transition-all overflow-hidden">
                        {editMode ? (
                          // 编辑模式显示组件卡片
                          <div className="h-full flex flex-col">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                  <Zap className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                  <h3 className="text-base font-bold text-white">{widget.title}</h3>
                                  <p className="text-xs text-slate-500">{widget.position.desktop.w}×{widget.position.desktop.h}</p>
                                </div>
                              </div>
                              <button className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 cursor-grab">
                                <GripVertical className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-sm text-slate-400 line-clamp-2">{widget.description}</p>
                          </div>
                        ) : (
                          // 正常模式显示实际组件内容
                          <WidgetRenderer widget={widget} />
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Add widget placeholder in edit mode */}
                  {editMode && (
                    <button 
                      className="rounded-3xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-3 text-slate-500 hover:border-emerald-500/50 hover:text-emerald-400 transition-colors"
                      style={{ gridColumn: 'span 4', gridRow: 'span 2', minHeight: '200px' }}
                    >
                      <Plus className="w-8 h-8" />
                      <span className="text-sm font-medium">添加组件</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </Suspense>
        </div>
      </main>
    </div>
  );
};

export default V9Dashboard;
