import React from 'react';
import { 
  LayoutDashboard, 
  BarChart3, 
  FolderOpen,
  Bookmark,
  Users,
  Plus,
  HelpCircle,
  LogOut
} from 'lucide-react';

interface DesktopSidebarProps {
  activeView: 'dashboard' | 'resources' | 'collection' | 'analytics' | 'settings';
  onViewChange: (view: 'dashboard' | 'resources' | 'collection' | 'analytics' | 'settings') => void;
  onAddNew: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'resources', label: 'Resources', icon: Bookmark },
  { id: 'collection', label: 'Collection', icon: FolderOpen },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Community', icon: Users },
] as const;

const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  activeView,
  onViewChange,
  onAddNew
}) => {
  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] bg-[#0d0e10] 
                     flex flex-col z-50 hidden lg:flex">
      {/* Logo Section */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-500 
                          flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <LayoutDashboard className="w-5 h-5 text-[#0d0e10]" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-emerald-400 font-display tracking-tight">Y-Nav Elite</span>
            <span className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">Navigation Hub</span>
          </div>
        </div>
      </div>

      {/* New Project Button - CTA */}
      <div className="px-5 pb-6">
        <button
          onClick={onAddNew}
          className="w-full flex items-center justify-center gap-2 
                     bg-gradient-to-r from-emerald-400 to-emerald-500
                     text-[#0d0e10] font-semibold py-3.5 rounded-2xl
                     shadow-lg shadow-emerald-500/25
                     transition-all duration-200 active:scale-95 hover:shadow-emerald-500/40 hover:scale-[1.02]
                     touch-target"
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
          <span>New Project</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-1">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as typeof activeView)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl
                         transition-all duration-200 active:scale-95 touch-target-sm
                         ${isActive 
                           ? 'bg-[#242629] text-white shadow-lg shadow-black/20' 
                           : 'text-[#ababad] hover:text-white hover:bg-[#181a1c]'
                         }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400 stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 mt-auto">
        <div className="space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl
                            text-[#ababad] hover:text-white hover:bg-[#181a1c]
                            transition-all duration-200">
            <HelpCircle className="w-5 h-5 stroke-2" />
            <span className="font-medium text-sm">Help</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl
                            text-red-400 hover:text-red-300 hover:bg-red-500/10
                            transition-all duration-200">
            <LogOut className="w-5 h-5 stroke-2" />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
