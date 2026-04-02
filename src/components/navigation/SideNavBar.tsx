import React, { useState } from 'react';
import { LayoutDashboard, BarChart3, StickyNote, Bookmark, Settings, Plus, Gem } from 'lucide-react';

interface SideNavBarProps {
  activeView: 'dashboard' | 'analytics' | 'notes' | 'bookmarks' | 'settings';
  onViewChange: (view: 'dashboard' | 'analytics' | 'notes' | 'bookmarks' | 'settings') => void;
  onAddNew: () => void;
  siteTitle?: string;
  siteSubtitle?: string;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'notes', label: 'My Notes', icon: StickyNote },
  { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;

const SideNavBar: React.FC<SideNavBarProps> = ({
  activeView,
  onViewChange,
  onAddNew,
  siteTitle = 'Obsidian',
  siteSubtitle = 'EMERALD EDITION'
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside 
      className={`
        fixed left-0 top-0 h-full bg-[#0d0e10] border-r border-white/5
        flex flex-col transition-all duration-300 z-50
        ${isCollapsed ? 'w-20' : 'w-64'}
        hidden lg:flex
      `}
    >
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Gem className="w-5 h-5 text-white" />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col">
            <span className="text-lg font-bold text-white font-display tracking-tight">{siteTitle}</span>
            <span className="text-[10px] text-emerald-400 font-medium tracking-wider">{siteSubtitle}</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl
                transition-all duration-200 active:scale-95
                ${isActive 
                  ? 'bg-emerald-500/10 text-emerald-400 border-r-2 border-emerald-400' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }
                ${isCollapsed ? 'justify-center' : ''}
              `}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              {!isCollapsed && (
                <span className="font-medium text-sm">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Add Button */}
      <div className="p-4">
        <button
          onClick={onAddNew}
          className={`
            w-full flex items-center justify-center gap-2 
            bg-gradient-to-r from-emerald-500 to-emerald-600
            text-white font-medium py-3 rounded-xl
            shadow-lg shadow-emerald-500/20
            transition-all duration-200 active:scale-95 hover:shadow-emerald-500/30
            ${isCollapsed ? 'px-4' : 'px-6'}
          `}
        >
          <Plus className="w-5 h-5" />
          {!isCollapsed && <span>New Note</span>}
        </button>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-white/5">
        <button className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-white/5 transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
            <span className="text-xs font-medium text-white">U</span>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium text-white">User</span>
              <span className="text-xs text-slate-400">Pro Account</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};

export default SideNavBar;
