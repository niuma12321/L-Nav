import React, { useState, useEffect, lazy, Suspense } from 'react';
import { 
  Search, 
  Zap,
  Loader2,
  Grid3X3,
  LayoutDashboard,
  FolderOpen,
  FlaskConical,
  Plus,
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
  LayoutGrid,
  List,
  Monitor,
  Bell,
  User
} from 'lucide-react';
import { useWidgetSystem } from '../../hooks/useWidgetSystem';

// Lazy load views
const ResourceCenterViewCN = lazy(() => import('./ResourceCenterViewCN'));
const WidgetConfigCenter = lazy(() => import('./WidgetConfigCenter'));

interface V9DashboardProps {
  onAddResource?: () => void;
  onOpenSettings?: () => void;
  onOpenImport?: () => void;
  onEditLink?: (link: any) => void;
  onDeleteLink?: (id: string) => void;
  links?: Array<{
    id: string;
    title: string;
    url: string;
    description?: string;
    icon?: string;
    categoryId?: string;
    pinned?: boolean;
    hidden?: boolean;
  }>;
  categories?: Array<{
    id: string;
    name: string;
    icon?: string;
  }>;
}

// 天气小组件
const WeatherWidget: React.FC = () => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-300">北京</span>
        <button className="p-1 rounded hover:bg-white/5 transition-colors">
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

// 便签小组件
const NotesWidget: React.FC = () => {
  const [notes] = useState([
    { id: 1, content: '记得复盘昨日行情', color: 'bg-yellow-500/20' },
    { id: 2, content: '查看季度财报数据', color: 'bg-blue-500/20' },
    { id: 3, content: '更新投资组合', color: 'bg-green-500/20' },
  ]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-2">
        {notes.map(note => (
          <div key={note.id} className={`p-2 rounded-lg ${note.color} text-white/80 text-sm`}>
            {note.content}
          </div>
        ))}
      </div>
      <button className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
        <Plus className="w-3 h-3" />
        添加便签
      </button>
    </div>
  );
};

// 搜索组件
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
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-3 justify-center">
        {engines.map(engine => (
          <button
            key={engine}
            onClick={() => setActiveEngine(engine)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              activeEngine === engine ? 'bg-emerald-500 text-[#0d0e10]' : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            {engine}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#181a1c] border border-white/10">
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
      <div className="mt-3 flex justify-center gap-2">
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
  );
};

// 链接卡片组件
const LinkCard: React.FC<{
  id: string;
  title: string;
  url: string;
  icon?: string;
  description?: string;
  color?: string;
  isHidden?: boolean;
  onEdit?: () => void;
}> = ({ id, title, url, icon, description, color = 'bg-indigo-500/20 text-indigo-400', isHidden, onEdit }) => {
  const domain = new URL(url).hostname;
  const faviconUrl = `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=64`;

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit?.();
  };

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
          onClick={handleEdit}
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

const V9Dashboard: React.FC<V9DashboardProps> = ({ onAddResource, onOpenSettings, onOpenImport, onEditLink, onDeleteLink, links = [], categories = [] }) => {
  const [activeView, setActiveView] = useState('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchMode, setSearchMode] = useState<'internal' | 'external'>('external');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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
    setIsMobileMenuOpen(false);
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
    if (!editMode) {
      setActiveView('dashboard');
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

  const navItems = [
    { id: 'dashboard', label: '控制台', icon: LayoutDashboard },
    { id: 'resources', label: '资源中心', icon: FolderOpen },
    { id: 'widgets', label: '组件配置', icon: Grid3X3 },
    { id: 'labs', label: '实验室', icon: FlaskConical },
  ];

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0d0e10] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0d0e10] text-white">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0d0e10]/80 backdrop-blur-xl">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="h-16 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Zap className="w-5 h-5 text-[#0d0e10]" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white">Y-Nav Elite</span>
                <span className="text-[10px] text-slate-500">V9.0 CONSOLE</span>
              </div>
            </div>

            {/* 导航菜单 - 桌面端 */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = activeView === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleViewChange(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-emerald-500/15 text-emerald-400' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                    <span className="font-medium text-sm">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* 右侧操作区 */}
            <div className="flex items-center gap-2">
              {/* 编辑布局按钮 */}
              <button
                onClick={toggleEditMode}
                className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                  editMode 
                    ? 'bg-emerald-500 text-[#0d0e10] font-semibold' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
                <span className="text-sm font-medium">{editMode ? '完成' : '编辑'}</span>
              </button>

              {/* 主题切换 */}
              <button className="p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-white/5 transition-all">
                <Monitor className="w-5 h-5" />
              </button>

              {/* 设置 */}
              <button 
                onClick={onOpenSettings}
                className="p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-white/5 transition-all"
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* 通知 */}
              <button 
                onClick={() => alert('通知功能即将上线')}
                className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500" />
              </button>

              {/* 用户头像 */}
              <button 
                onClick={() => alert('用户功能即将上线')}
                className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center hover:ring-2 hover:ring-white/20 transition-all"
              >
                <span className="text-sm font-bold text-white">李</span>
              </button>

              {/* 移动端菜单按钮 */}
              <button 
                className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 移动端导航菜单 */}
          {isMobileMenuOpen && (
            <nav className="lg:hidden py-4 border-t border-white/5">
              {navItems.map((item) => {
                const isActive = activeView === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleViewChange(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-emerald-500/15 text-emerald-400' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          )}
        </div>
      </header>

      {/* 主内容区 */}
      <main className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6">
        {activeView === 'dashboard' ? (
          <div className="space-y-8">
            {/* 欢迎区域 + 搜索 */}
            <section className="text-center py-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                上午好，<span className="text-emerald-400">home</span>
              </h1>
              <p className="text-slate-400 mb-6">准备开始高效的一天了吗？</p>
              
              {/* 时间显示 */}
              <div className="mb-8">
                <div className="text-5xl sm:text-6xl font-mono font-bold text-white tracking-tight">
                  {currentTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-sm font-medium text-emerald-400 mt-2">
                  {currentTime.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
                </div>
              </div>

              {/* 搜索框 */}
              <SearchWidget />
            </section>

            {/* 我的小组件 */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-emerald-400" />
                  我的小组件
                </h2>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-emerald-500 text-[#0d0e10] rounded-lg hover:bg-emerald-400 transition-colors">
                    <Plus className="w-4 h-4" />
                    添加
                  </button>
                  <div className="hidden sm:flex items-center p-1 rounded-xl bg-white/5 border border-white/10">
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
                </div>
              </div>

              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {/* 根据 enabledWidgets 配置动态渲染小组件 */}
                {enabledWidgets.some(w => w.id === 'weather') && (
                  <div className="relative bg-[#181a1c] rounded-2xl border border-white/10 shadow-sm hover:shadow-md transition-shadow overflow-hidden p-4 min-h-[200px]">
                    <div className="flex items-center gap-2 mb-2">
                      <Cloud className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-medium text-slate-300">天气</span>
                    </div>
                    <WeatherWidget />
                  </div>
                )}

                {enabledWidgets.some(w => w.id === 'custom-links') && (
                  <div className="relative bg-[#181a1c] rounded-2xl border border-white/10 shadow-sm hover:shadow-md transition-shadow overflow-hidden p-4 min-h-[200px]">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-medium text-slate-300">待办事项</span>
                    </div>
                    <TodoWidget />
                  </div>
                )}

                {enabledWidgets.some(w => w.id === 'stock-widget') && (
                  <div className="relative bg-[#181a1c] rounded-2xl border border-white/10 shadow-sm hover:shadow-md transition-shadow overflow-hidden p-4 min-h-[200px]">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-medium text-slate-300">热搜榜单</span>
                    </div>
                    <NewsWidget />
                  </div>
                )}

                {enabledWidgets.some(w => w.id === 'news-feed') && (
                  <div className="relative bg-[#181a1c] rounded-2xl border border-white/10 shadow-sm hover:shadow-md transition-shadow overflow-hidden p-4 min-h-[200px] lg:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Pin className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-medium text-slate-300">便签</span>
                    </div>
                    <NotesWidget />
                  </div>
                )}
              </div>
            </section>

            {/* 置顶/常用 */}
            <section>
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

              {/* 动态渲染链接卡片 */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {links.length > 0 ? (
                  links.filter(link => !link.hidden).slice(0, 10).map((link) => (
                    <LinkCard 
                      key={link.id}
                      id={link.id}
                      title={link.title} 
                      url={link.url} 
                      icon={link.icon}
                      description={link.description}
                      color="bg-emerald-500/20 text-emerald-400"
                      isHidden={link.hidden}
                      onEdit={() => onEditLink?.(link)}
                    />
                  ))
                ) : (
                  // 默认示例链接
                  <>
                    <LinkCard id="demo1" title="PanHub" url="https://sou.678870.xyz" color="bg-indigo-500/20 text-indigo-400" isHidden />
                    <LinkCard id="demo2" title="盘搜" url="https://pansou.nas.678870.xyz" icon="🌐" color="bg-teal-500/20 text-teal-400" isHidden />
                    <LinkCard id="demo3" title="GitHub" url="https://github.com" description="代码托管平台" color="bg-cyan-500/20 text-cyan-400" />
                    <LinkCard id="demo4" title="React" url="https://react.dev" description="构建Web用户界面的库" color="bg-fuchsia-500/20 text-fuchsia-400" />
                  </>
                )}
              </div>
            </section>

            {/* 一言 Footer */}
            <footer className="pt-8 pb-4 flex justify-center">
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
        ) : activeView === 'resources' ? (
          <Suspense fallback={
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
          }>
            <ResourceCenterViewCN 
              onAddResource={onAddResource}
              onImport={() => console.log('Import')}
              onEditLink={onEditLink}
              onDeleteLink={onDeleteLink}
              onPreviewLink={(url) => window.open(url, '_blank')}
              links={links}
              categories={categories}
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
