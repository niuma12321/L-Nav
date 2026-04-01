import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { 
  Search, 
  Bell, 
  Zap,
  Loader2,
  Grid3X3,
  Settings,
  LayoutDashboard,
  FolderOpen,
  FlaskConical,
  Plus,
  Save,
  GripVertical,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { useWidgetSystem } from '../../hooks/useWidgetSystem';
import { WidgetConfig, DEFAULT_WIDGETS } from './widgetTypes';

// Lazy load views
const ResourceCenterViewCN = lazy(() => import('./ResourceCenterViewCN'));
const WidgetConfigCenter = lazy(() => import('./WidgetConfigCenter'));

interface V9DashboardProps {
  onAddResource?: () => void;
}

// Magnetic Grid Layout Component
const MagneticGrid: React.FC<{
  widgets: WidgetConfig[];
  editMode: boolean;
  onPositionChange: (id: string, position: WidgetConfig['position']) => void;
}> = ({ widgets, editMode, onPositionChange }) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [hoverSlot, setHoverSlot] = useState<{x: number, y: number} | null>(null);

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragEnd = () => {
    if (draggedId && hoverSlot) {
      const widget = widgets.find(w => w.id === draggedId);
      if (widget) {
        onPositionChange(draggedId, {
          ...widget.position,
          desktop: { ...widget.position.desktop, x: hoverSlot.x, y: hoverSlot.y }
        });
      }
    }
    setDraggedId(null);
    setHoverSlot(null);
  };

  return (
    <div className="relative min-h-[600px]">
      {/* 12-column grid background */}
      <div className="absolute inset-0 grid grid-cols-12 gap-4 pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className={`h-full ${editMode ? 'bg-white/[0.02]' : ''} rounded-lg`} />
        ))}
      </div>

      {/* Widgets */}
      <div className="relative grid grid-cols-12 gap-4 auto-rows-min">
        {widgets.map((widget) => (
          <div
            key={widget.id}
            draggable={editMode}
            onDragStart={() => handleDragStart(widget.id)}
            onDragEnd={handleDragEnd}
            className={`
              ${editMode ? 'cursor-move' : ''}
              ${draggedId === widget.id ? 'opacity-50 scale-95' : ''}
              transition-all duration-200
            `}
            style={{
              gridColumn: `span ${Math.min(widget.position.desktop.w, 12)}`,
              gridRow: `span ${widget.position.desktop.h}`
            }}
          >
            <WidgetCard 
              widget={widget} 
              editMode={editMode}
              onSettingsClick={() => console.log('Settings', widget.id)}
            />
          </div>
        ))}

        {/* Add widget placeholder in edit mode */}
        {editMode && (
          <button 
            className="rounded-3xl border-2 border-dashed border-white/20 
                       flex flex-col items-center justify-center gap-3 text-slate-500
                       hover:border-emerald-500/50 hover:text-emerald-400 transition-colors"
            style={{ gridColumn: 'span 4', gridRow: 'span 2', minHeight: '200px' }}
          >
            <Plus className="w-8 h-8" />
            <span className="text-sm font-medium">添加组件</span>
          </button>
        )}
      </div>
    </div>
  );
};

// Individual Widget Card
const WidgetCard: React.FC<{
  widget: WidgetConfig;
  editMode: boolean;
  onSettingsClick: () => void;
}> = ({ widget, editMode, onSettingsClick }) => {
  return (
    <div className={`
      h-full rounded-3xl bg-[#181a1c] p-5 
      ${editMode ? 'ring-2 ring-emerald-500/30' : ''}
      hover:shadow-lg hover:shadow-emerald-500/5 transition-all
    `}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{widget.title}</h3>
            {editMode && (
              <p className="text-xs text-slate-500">{widget.position.desktop.w}×{widget.position.desktop.h}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {editMode ? (
            <>
              <button 
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 cursor-grab active:cursor-grabbing"
              >
                <GripVertical className="w-4 h-4" />
              </button>
              <button 
                onClick={onSettingsClick}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
              >
                <Settings className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content placeholder based on widget type */}
      <div className="text-sm text-slate-400 leading-relaxed">
        {widget.description}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-sm text-white hover:bg-white/10 transition-colors">
          <span className="text-emerald-400">✎</span>
          进入编辑
        </button>
        <button className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/10">
          <span className="text-lg">⋮</span>
        </button>
      </div>
    </div>
  );
};

// Sidebar Navigation
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
      {/* Logo */}
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

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-1">
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

      {/* Edit Mode Toggle */}
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

      {/* Storage Indicator */}
      <div className="p-4 mx-4 mb-4 rounded-2xl bg-[#181a1c]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400">Workspace Storage</span>
        </div>
        <div className="h-2 rounded-full bg-[#0d0e10] overflow-hidden">
          <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" />
        </div>
      </div>
    </aside>
  );
};

const V9Dashboard: React.FC<V9DashboardProps> = ({ onAddResource }) => {
  const [activeView, setActiveView] = useState('dashboard');
  const [mobileTab, setMobileTab] = useState('home');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const { 
    enabledWidgets, 
    isLoaded, 
    editMode, 
    setEditMode,
    toggleWidget,
    updateWidgetPosition 
  } = useWidgetSystem();

  // Update time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

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
      {/* Sidebar */}
      <Sidebar 
        activeView={activeView} 
        onViewChange={handleViewChange}
        editMode={editMode}
        onEditModeToggle={toggleEditMode}
      />

      {/* Main Content */}
      <main className="lg:ml-[260px] min-h-screen overflow-y-auto pb-24 lg:pb-0">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#0d0e10]/95 backdrop-blur-xl px-6 py-4 border-b border-white/5">
          <div className="flex items-center justify-between">
            {/* Search */}
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

            {/* Right Actions */}
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

        {/* Content */}
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
                {/* Dashboard Header */}
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-white mb-2">
                    {editMode ? '布局编辑模式' : '组件配置中心'}
                  </h1>
                  <p className="text-sm text-slate-400">
                    {editMode 
                      ? '拖拽组件卡片以调整位置，点击设置图标配置详情。' 
                      : '管理您的工作区仪表盘组件，定制专属的数字化生产力矩阵。'}
                  </p>
                </div>

                {/* Device Toggle */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 bg-[#181a1c] rounded-xl p-1">
                    <button className="px-4 py-2 rounded-lg bg-emerald-500 text-[#0d0e10] text-sm font-medium">
                      Desktop
                    </button>
                    <button className="px-4 py-2 rounded-lg text-slate-400 hover:text-white text-sm">
                      Tablet
                    </button>
                    <button className="px-4 py-2 rounded-lg text-slate-400 hover:text-white text-sm">
                      Mobile
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#181a1c] text-slate-300 hover:text-white text-sm">
                      <Grid3X3 className="w-4 h-4" />
                      拖拽重排预览
                    </button>
                    <button 
                      onClick={() => setEditMode(false)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-[#0d0e10] font-semibold text-sm"
                    >
                      <Save className="w-4 h-4" />
                      保存当前布局
                    </button>
                  </div>
                </div>

                {/* Magnetic Grid */}
                <MagneticGrid 
                  widgets={enabledWidgets}
                  editMode={editMode}
                  onPositionChange={updateWidgetPosition}
                />

                {/* Layout Preview (when in edit mode) */}
                {editMode && (
                  <div className="mt-8 p-6 rounded-3xl bg-[#181a1c] border border-emerald-500/20">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-white">布局预览 (Drag-and-Drop)</h3>
                      <div className="flex items-center gap-2 bg-[#0d0e10] rounded-lg p-1">
                        <span className="px-3 py-1 rounded-md bg-[#181a1c] text-xs text-white">Desktop</span>
                        <span className="px-3 py-1 rounded-md text-xs text-slate-500">Tablet</span>
                        <span className="px-3 py-1 rounded-md text-xs text-slate-500">Mobile</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 mb-4">当前主屏幕 12 列网格排列。拖动组件卡片以调整位置。</p>
                    
                    {/* Preview Grid */}
                    <div className="grid grid-cols-12 gap-3 p-4 rounded-2xl bg-[#0d0e10]">
                      {enabledWidgets.map((widget) => (
                        <div 
                          key={`preview-${widget.id}`}
                          className="col-span-6 p-4 rounded-xl bg-[#181a1c] border border-white/5 flex flex-col items-center justify-center gap-2"
                        >
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <span className="text-emerald-400 text-xs">≡</span>
                          </div>
                          <span className="text-[10px] text-slate-500 uppercase">{widget.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </Suspense>
        </div>
      </main>
    </div>
  );
};

export default V9Dashboard;
