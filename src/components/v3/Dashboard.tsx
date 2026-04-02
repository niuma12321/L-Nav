import React from 'react';
import { LinkItem, StickyNote } from '../../types';

// Widgets
import WeatherWidget from './widgets/WeatherWidget';
import TodoWidget from './widgets/TodoWidget';
import HotListWidget from './widgets/HotListWidget';
import NotesWidget from './widgets/NotesWidget';

// Other V3 components
import GlobalCommandPalette from './GlobalCommandPalette';
import DesktopSidebar from './DesktopSidebar';
import MobileDock from './MobileDock';

interface DashboardProps {
  // Core data
  links: LinkItem[];
  notes: StickyNote[];
  
  // Note actions
  onAddNote: (note: Partial<StickyNote>) => void;
  onUpdateNote: (id: string, note: Partial<StickyNote>) => void;
  onDeleteNote: (id: string) => void;
  
  // Navigation actions
  onAddResource: () => void;
  onNavigate: (url: string) => void;
  onSearch: (query: string, engine?: string) => void;
  
  // View state
  activeView: 'dashboard' | 'resources' | 'collection' | 'analytics' | 'settings';
  onViewChange: (view: 'dashboard' | 'resources' | 'collection' | 'analytics' | 'settings') => void;
  
  // Command palette
  isCommandPaletteOpen: boolean;
  onCloseCommandPalette: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  links,
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onAddResource,
  onNavigate,
  onSearch,
  activeView,
  onViewChange,
  isCommandPaletteOpen,
  onCloseCommandPalette
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '夜深了';
    if (hour < 12) return '早上好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  return (
    <div className="min-h-screen bg-[#0d0e10] text-white">
      {/* Desktop Sidebar */}
      <DesktopSidebar
        activeView={activeView}
        onViewChange={onViewChange}
        onAddNew={onAddResource}
      />

      {/* Main Content */}
      <main className="lg:ml-[260px] min-h-screen pb-24 lg:pb-0">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#0d0e10]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                {getGreeting()}，Alex
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                你的工作空间已优化，准备开始高效的一天了吗？
              </p>
            </div>
            
            {/* Search Trigger */}
            <button
              onClick={() => {/* Open command palette */}}
              className="hidden md:flex items-center gap-3 px-4 py-2.5 rounded-xl 
                         bg-[#181a1c] border border-white/10 text-slate-400 
                         hover:border-emerald-500/30 hover:text-slate-200 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-sm">搜索 Obsidian...</span>
              <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-800/50 px-1.5 py-0.5 rounded">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
                <span>K</span>
              </div>
            </button>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="p-6">
          {/* Primary Widgets Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <WeatherWidget />
            <TodoWidget />
            <HotListWidget />
          </div>

          {/* Secondary Row - Notes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <NotesWidget
              notes={notes}
              onAddNote={onAddNote}
              onUpdateNote={onUpdateNote}
              onDeleteNote={onDeleteNote}
            />
            
            {/* Quick Stats or Additional Widget */}
            <div className="v3-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">数据概览</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="text-3xl font-bold text-emerald-400">{links.length}</div>
                  <div className="text-xs text-slate-500 mt-1">资源链接</div>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="text-3xl font-bold text-emerald-400">{notes.length}</div>
                  <div className="text-xs text-slate-500 mt-1">个人便签</div>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="text-3xl font-bold text-emerald-400">
                    {links.filter(l => l.pinned).length}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">置顶项目</div>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="text-3xl font-bold text-emerald-400">
                    {notes.length}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">总便签数</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Dock */}
      <MobileDock
        activeTab={activeView === 'dashboard' ? 'home' : activeView === 'resources' ? 'resources' : 'home'}
        onTabChange={(tab) => {
          const viewMap: Record<string, typeof activeView> = {
            home: 'dashboard',
            resources: 'resources',
            search: 'resources',
            profile: 'settings'
          };
          onViewChange(viewMap[tab] || 'dashboard');
        }}
        onFabClick={onAddResource}
      />

      {/* Command Palette */}
      <GlobalCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={onCloseCommandPalette}
        links={links}
        onNavigate={onNavigate}
        onSearch={onSearch}
      />
    </div>
  );
};

export default Dashboard;
