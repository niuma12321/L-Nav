import React from 'react';
import { 
  LayoutDashboard, 
  Bookmark, 
  TrendingUp, 
  FlaskConical,
  Settings,
  User,
  LogOut,
  Sparkles
} from 'lucide-react';

interface DesktopSidebarCNProps {
  activeView: 'dashboard' | 'resources' | 'stock' | 'labs' | 'settings' | 'profile';
  onViewChange: (view: 'dashboard' | 'resources' | 'stock' | 'labs' | 'settings' | 'profile') => void;
  onUpgrade?: () => void;
}

const navItems = [
  { id: 'dashboard', label: '控制台', icon: LayoutDashboard },
  { id: 'resources', label: '资源中心', icon: Bookmark },
  { id: 'stock', label: '自选分析', icon: TrendingUp },
  { id: 'labs', label: '效率实验室', icon: FlaskConical },
] as const;

const systemItems = [
  { id: 'settings', label: '系统设置', icon: Settings },
  { id: 'profile', label: '个人中心', icon: User },
] as const;

const DesktopSidebarCN: React.FC<DesktopSidebarCNProps> = ({ 
  activeView, 
  onViewChange,
  onUpgrade 
}) => {
  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] bg-[#0d0e10] flex flex-col z-50 hidden lg:flex border-r border-white/5">
      {/* Logo */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-5 h-5 text-[#0d0e10]" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-white">Y-Nav Elite</span>
            <span className="text-[10px] text-slate-500">高级数据终端 v6.0</span>
          </div>
        </div>
      </div>

      {/* 核心功能区 */}
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

      {/* Pro升级卡片 */}
      <div className="p-4 mx-4 mb-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-[#0d0e10]" />
          <span className="text-xs font-bold text-[#0d0e10]">Pro Access Active</span>
        </div>
        <button 
          onClick={onUpgrade}
          className="w-full py-2 rounded-xl bg-[#0d0e10] text-emerald-400 text-xs font-semibold hover:bg-[#181a1c] transition-colors"
        >
          升级版本
        </button>
      </div>

      {/* 系统区 */}
      <div className="p-4 border-t border-white/5">
        <div className="space-y-1">
          {systemItems.map((item) => {
            const isActive = activeView === item.id;
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                  isActive 
                    ? 'bg-white/10 text-white' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-5 h-5 stroke-2" />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut className="w-5 h-5 stroke-2" />
            <span className="font-medium text-sm">退出登录</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default DesktopSidebarCN;
