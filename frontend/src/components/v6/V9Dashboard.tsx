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
  GripVertical,
  Cloud,
  Droplets,
  Wind,
  CheckSquare,
  TrendingUp,
  Flame,
  ExternalLink,
  RefreshCw,
  Settings,
  Menu,
  House,
  Pin,
  EyeOff,
  Globe,
  LayoutGrid,
  List,
  Monitor,
  X
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
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-300">北京</span>
        <button className="p-1 rounded hover:bg-white/5 transition-colors" title="刷新">
          <RefreshCw className="w-3 h-3 text-slate-400" />
        </button>
      </div>
      <div className="flex items-center gap-3 flex-1">
        <Cloud className="w-8 h-8 text-gray-400" />
        <div>
          <div className="text-3xl font-bold text-white">23°</div>
          <div className="text-xs text-slate-400">多云</div>
        </div>
      </div>
      <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
        <div className="flex items-center gap-1">
          <Droplets className="w-3 h-3" />
          <span>61%</span>
        </div>
        <div className="flex items-center gap-1">
          <Wind className="w-3 h-3" />
          <span>4级</span>
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
  const [todos, setTodos] = useState([
    { id: 1, title: '复盘昨日北向资金流入排行', completed: true },
    { id: 2, title: '分析半导体板块Q3财报数据', completed: false, priority: 'high' },
    { id: 3, title: '更新下周自选股池', completed: false },
  ]);
  const [newTask, setNewTask] = useState('');

  const toggleTodo = (id: number) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const addTodo = () => {
    if (newTask.trim()) {
      setTodos([...todos, { id: Date.now(), title: newTask, completed: false }]);
      setNewTask('');
    }
  };

  const completedCount = todos.filter(t => t.completed).length;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-300">待办事项</span>
        <span className="text-xs text-slate-400">{completedCount}/{todos.length}</span>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          placeholder="添加新任务..."
          className="flex-1 px-2 py-1.5 text-sm bg-[#0d0e10] rounded-lg border border-white/5 focus:border-emerald-500/50 focus:outline-none placeholder:text-slate-500"
        />
        <button
          onClick={addTodo}
          disabled={!newTask.trim()}
          className="p-1.5 rounded-lg bg-emerald-500 text-[#0d0e10] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-400 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1.5">
        {todos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <CheckSquare className="w-6 h-6 mb-1 opacity-50" />
            <span className="text-xs">暂无待办</span>
          </div>
        ) : (
          todos.map(todo => (
            <div
              key={todo.id}
              onClick={() => toggleTodo(todo.id)}
              className="flex items-start gap-3 p-3 rounded-xl bg-[#0d0e10] cursor-pointer hover:bg-[#1a1c1f] transition-colors"
            >
              <button
                className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center transition-colors ${
                  todo.completed ? 'bg-emerald-500' : 'border-2 border-slate-600'
                }`}
              >
                {todo.completed && <span className="text-[#0d0e10] text-xs">✓</span>}
              </button>
              <div className="flex-1">
                <p className={`text-sm ${todo.completed ? 'text-slate-500 line-through' : 'text-white'}`}>
                  {todo.title}
                </p>
                {todo.priority === 'high' && !todo.completed && (
                  <span className="text-xs text-emerald-400">高优先级</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// 热搜小组件
const NewsWidget: React.FC = () => {
  const [hotList, setHotList] = useState([
    { id: 1, title: '科技发展新动态', hot: '450.0万', rank: 1 },
    { id: 2, title: '今日热门话题讨论', hot: '320.0万', rank: 2 },
    { id: 3, title: '娱乐圈最新消息', hot: '280.0万', rank: 3 },
    { id: 4, title: '社会民生关注点', hot: '210.0万', rank: 4 },
    { id: 5, title: '体育赛事直播', hot: '180.0万', rank: 5 },
  ]);
  const [source, setSource] = useState<'weibo' | 'zhihu'>('weibo');

  const refreshHot = () => {
    setHotList(prev => prev.map(item => ({ ...item, hot: (parseFloat(item.hot) + Math.random() * 10).toFixed(1) + '万' })));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-red-500" />
          <span className="text-sm font-medium text-slate-300">
            {source === 'weibo' ? '微博热搜' : '知乎热榜'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSource('weibo')}
            className={`px-2 py-0.5 text-xs rounded transition-colors ${
              source === 'weibo' ? 'bg-emerald-500 text-[#0d0e10]' : 'bg-white/5 text-slate-400'
            }`}
          >
            微博
          </button>
          <button
            onClick={() => setSource('zhihu')}
            className={`px-2 py-0.5 text-xs rounded transition-colors ${
              source === 'zhihu' ? 'bg-emerald-500 text-[#0d0e10]' : 'bg-white/5 text-slate-400'
            }`}
          >
            知乎
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1.5">
        {hotList.map((item) => (
          <a
            key={item.id}
            href={`https://s.weibo.com/weibo?q=${encodeURIComponent(item.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-white/5 transition-colors duration-200 group"
          >
            <span className={`w-5 h-5 flex items-center justify-center rounded text-xs font-bold ${
              item.rank <= 3
                ? 'bg-red-500/20 text-red-400'
                : 'bg-white/5 text-slate-400'
            }`}>
              {item.rank}
            </span>
            <span className="flex-1 text-sm text-slate-300 truncate">{item.title}</span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Flame className="w-3 h-3" />
              {item.hot}
            </span>
            <ExternalLink className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-white/5">
        <button
          onClick={refreshHot}
          className="w-full py-1.5 text-xs text-slate-500 hover:text-emerald-400 flex items-center justify-center gap-1 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          刷新热搜
        </button>
      </div>
    </div>
  );
};

// 搜索小组件
const SearchWidget: React.FC = () => {
  const engines = ['Google', '百度', 'GitHub', '知乎'];
  const [activeEngine, setActiveEngine] = useState('Google');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const urls: Record<string, string> = {
        'Google': `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`,
        '百度': `https://www.baidu.com/s?wd=${encodeURIComponent(searchQuery)}`,
        'GitHub': `https://github.com/search?q=${encodeURIComponent(searchQuery)}`,
        '知乎': `https://www.zhihu.com/search?q=${encodeURIComponent(searchQuery)}`,
      };
      window.open(urls[activeEngine] || urls['Google'], '_blank');
    }
  };

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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={`在 ${activeEngine} 中搜索...`}
            className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none"
          />
        </div>
        <div className="mt-4">
          <p className="text-xs text-slate-500 mb-2">热门搜索</p>
          <div className="flex flex-wrap gap-2">
            {['React 19', 'AI 编程', '美股行情', '前端面试'].map(tag => (
              <span
                key={tag}
                onClick={() => { setSearchQuery(tag); handleSearch(); }}
                className="px-3 py-1 rounded-full bg-white/5 text-sm text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// 链接卡片组件
const LinkCard: React.FC<{
  title: string;
  url: string;
  icon?: string;
  description?: string;
  color?: string;
  isHidden?: boolean;
}> = ({ title, url, icon, description, color = 'bg-indigo-500/20 text-indigo-400', isHidden }) => {
  const domain = new URL(url).hostname;
  const faviconUrl = `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=64`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative rounded-2xl transition-all duration-300 ease-out bg-[#181a1c] border overflow-hidden cursor-pointer shadow-sm hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 active:scale-98 border-white/5 hover:border-emerald-500/30 p-4 sm:p-5"
    >
      <div className="flex flex-col min-w-0 gap-3">
        <div className={`flex items-center justify-center shrink-0 rounded-xl overflow-hidden border border-white/5 transition-transform duration-300 group-hover:scale-105 ${color} w-12 h-12`}>
          {icon ? (
            <span className="text-xl">{icon}</span>
          ) : (
            <img src={faviconUrl} alt="" className="w-6 h-6 rounded object-contain" />
          )}
        </div>
        <h3 className="font-medium truncate transition-colors text-base text-white group-hover:text-emerald-400" title={title}>
          {title}
        </h3>
        {description && (
          <p className="leading-relaxed line-clamp-2 mt-1.5 text-sm text-slate-400">
            {description}
          </p>
        )}
      </div>
      
      <div className="absolute transition-all duration-200 opacity-0 group-hover:opacity-100 z-20 flex items-center gap-1 top-3 right-3">
        <button
          className="p-1.5 rounded-lg bg-[#0d0e10] text-slate-400 hover:text-emerald-400 border border-white/5 transition-colors"
          title="编辑链接"
          onClick={(e) => { e.preventDefault(); }}
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>

      {isHidden && (
        <div className="absolute bottom-2 right-2 px-1.5 py-1 rounded-md text-[10px] font-medium flex items-center gap-1 bg-[#0d0e10] text-slate-400 border border-white/5">
          <EyeOff className="w-2.5 h-2.5" />
          <span>隐藏</span>
        </div>
      )}
    </a>
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
  const [searchMode, setSearchMode] = useState<'internal' | 'external'>('external');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
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

  const handleSearch = () => {
    if (searchQuery.trim()) {
      window.open(`https://www.bing.com/search?q=${encodeURIComponent(searchQuery)}`, '_blank');
    }
  };

  // 一言数据
  const [hitokoto, setHitokoto] = useState({
    text: '我们都有底线，而我也许已经越过了自己的底线。',
    source: '英雄联盟 · 青钢影'
  });

  const refreshHitokoto = () => {
    const quotes = [
      { text: '我们都有底线，而我也许已经越过了自己的底线。', source: '英雄联盟 · 青钢影' },
      { text: '人生苦短，我用Python。', source: '程序员格言' },
      { text: 'Stay hungry, stay foolish.', source: 'Steve Jobs' },
      { text: 'Talk is cheap. Show me the code.', source: 'Linus Torvalds' },
    ];
    setHitokoto(quotes[Math.floor(Math.random() * quotes.length)]);
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

      <main className="lg:ml-[260px] min-h-screen overflow-y-auto pb-0">
        {activeView === 'dashboard' ? (
          <>
            {/* Header */}
            <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0d0e10]/40 backdrop-blur-2xl">
              <div className="h-14 px-3 sm:px-4 lg:px-6 flex items-center gap-3">
                <div className="flex items-center gap-2 shrink-0">
                  <button className="flex items-center gap-2 p-2 rounded-xl text-slate-200 hover:text-emerald-400 hover:bg-white/5 transition-all border border-transparent hover:border-white/5">
                    <House className="w-[18px] h-[18px]" />
                    <span className="hidden sm:inline font-medium text-sm">元启</span>
                  </button>
                  <button className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-slate-200">
                    <Menu className="w-5 h-5" />
                  </button>
                </div>

                {/* 搜索框 */}
                <div className="flex-1 hidden md:flex justify-center">
                  <div className="w-full max-w-xl">
                    <div className="flex items-center h-11 rounded-2xl border border-white/10 bg-white/5 shadow-sm hover:shadow-md transition-all duration-300 backdrop-blur-md focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500/50 focus-within:bg-[#0d0e10]">
                      <div className="flex items-center gap-1 pl-1.5 py-1">
                        <button
                          onClick={() => setSearchMode('internal')}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                            searchMode === 'internal' ? 'bg-emerald-500 text-[#0d0e10]' : 'text-slate-400 hover:bg-white/5'
                          }`}
                        >
                          站内
                        </button>
                        <button
                          onClick={() => setSearchMode('external')}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                            searchMode === 'external' ? 'bg-emerald-500 text-[#0d0e10]' : 'text-slate-400 hover:bg-white/5'
                          }`}
                        >
                          站外
                        </button>
                      </div>
                      <div className="h-5 w-px bg-white/10 mx-2" />
                      <div className="relative flex-1">
                        <button className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-400 transition-colors">
                          <img src="https://www.faviconextractor.com/favicon/www.bing.com?larger=true" alt="必应" className="w-4 h-4" />
                        </button>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                          placeholder="在必应搜索"
                          className="w-full h-full pl-10 pr-4 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
                        />
                      </div>
                      <button className="px-3 text-slate-500 hover:text-emerald-400 transition-colors">
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="ml-auto flex items-center gap-2">
                  <button className="md:hidden p-2 rounded-lg text-slate-400 hover:bg-white/5">
                    <Search className="w-[18px] h-[18px]" />
                  </button>
                  
                  {/* 视图切换 */}
                  <div className="hidden md:flex items-center p-1 rounded-xl bg-white/5 border border-white/10 mr-2">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-emerald-500 text-[#0d0e10]' : 'text-slate-400 hover:text-white'}`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-emerald-500 text-[#0d0e10]' : 'text-slate-400 hover:text-white'}`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 主题切换 */}
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 mr-2">
                    <button className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-white/5 transition-all">
                      <Monitor className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-white/5 transition-all">
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </header>

            {/* 我的小组件 */}
            <div className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-emerald-400" />
                  我的小组件
                </h2>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-emerald-500 text-[#0d0e10] rounded-lg hover:bg-emerald-400 transition-colors">
                    <Plus className="w-4 h-4" />
                    添加小组件
                  </button>
                  <button className="px-3 py-1.5 text-sm font-medium rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 transition-colors">
                    编辑
                  </button>
                </div>
              </div>

              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                {/* 天气 */}
                <div className="relative bg-[#181a1c] rounded-2xl border border-white/10 shadow-sm hover:shadow-md transition-shadow overflow-hidden p-4 min-h-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <Cloud className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-medium text-slate-300">天气</span>
                  </div>
                  <WeatherWidget />
                </div>

                {/* 待办 */}
                <div className="relative bg-[#181a1c] rounded-2xl border border-white/10 shadow-sm hover:shadow-md transition-shadow overflow-hidden p-4 min-h-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-medium text-slate-300">待办事项</span>
                  </div>
                  <TodoWidget />
                </div>

                {/* 热搜 */}
                <div className="relative bg-[#181a1c] rounded-2xl border border-white/10 shadow-sm hover:shadow-md transition-shadow overflow-hidden p-4 min-h-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-medium text-slate-300">热搜榜单</span>
                  </div>
                  <NewsWidget />
                </div>
              </div>

              {/* 欢迎区域 */}
              <div className="pt-4 pb-4 flex items-end justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-1">
                    上午好，<span className="text-emerald-400">home</span>
                  </h1>
                  <p className="text-slate-400 text-sm">准备开始高效的一天了吗？</p>
                </div>
                <div className="hidden sm:block text-right">
                  <div className="text-4xl font-mono font-bold text-white tracking-tight">
                    {currentTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-xs font-medium text-emerald-400 mt-1">
                    {currentTime.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
                  </div>
                </div>
              </div>

              {/* 置顶/常用 */}
              <section className="pt-6">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <Pin className="w-4 h-4 text-emerald-400" />
                    </div>
                    <h2 className="text-lg font-bold text-white">置顶 / 常用</h2>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="px-2 py-1 rounded-full bg-white/5">38 站点</span>
                    <span className="px-2 py-1 rounded-full bg-white/5">8 分类</span>
                    <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400">8 置顶</span>
                  </div>
                </div>

                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  <LinkCard title="PanHub" url="https://sou.678870.xyz" color="bg-indigo-500/20 text-indigo-400" isHidden />
                  <LinkCard title="盘搜" url="https://pansou.nas.678870.xyz" icon="🌐" color="bg-teal-500/20 text-teal-400" isHidden />
                  <LinkCard title="GitHub" url="https://github.com" description="代码托管平台" color="bg-cyan-500/20 text-cyan-400" />
                  <LinkCard title="React" url="https://react.dev" description="构建Web用户界面的库" color="bg-fuchsia-500/20 text-fuchsia-400" />
                  <LinkCard title="Tailwind CSS" url="https://tailwindcss.com" description="原子化CSS框架" color="bg-lime-500/20 text-lime-400" />
                  <LinkCard title="ChatGPT" url="https://chat.openai.com" description="OpenAI聊天机器人" color="bg-emerald-500/20 text-emerald-400" />
                  <LinkCard title="Gemini" url="https://gemini.google.com" description="Google DeepMind AI" color="bg-purple-500/20 text-purple-400" />
                  <LinkCard title="飞牛" url="https://nas.678870.xyz/login" icon="🖥️" color="bg-orange-500/20 text-orange-400" isHidden />
                </div>
              </section>

              {/* 一言 Footer */}
              <footer className="mt-auto pt-6 pb-3 flex justify-center">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <button
                    type="button"
                    className="flex min-w-0 max-w-[70vw] items-center gap-1.5 text-left hover:text-slate-300 transition-colors"
                    onClick={() => navigator.clipboard.writeText(hitokoto.text)}
                  >
                    <span className="truncate">{hitokoto.text}</span>
                    <span className="shrink-0 text-slate-500">— {hitokoto.source}</span>
                  </button>
                  <button
                    type="button"
                    onClick={refreshHitokoto}
                    className="h-6 w-6 inline-flex items-center justify-center rounded-full text-slate-400 hover:text-slate-300 transition-colors"
                    title="刷新一言"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>
              </footer>
            </div>
          </>
        ) : activeView === 'resources' ? (
          <Suspense fallback={
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
          }>
            <ResourceCenterViewCN 
              onAddResource={onAddResource}
              onImport={() => console.log('Import')}
            />
          </Suspense>
        ) : (
          <Suspense fallback={
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
          }>
            <WidgetConfigCenter />
          </Suspense>
        )}
      </main>
    </div>
  );
};

export default V9Dashboard;
