import React from 'react';
import { LayoutDashboard, TrendingUp, Plus, CheckSquare, User } from 'lucide-react';

interface MobileDockCNProps {
  activeTab: 'home' | 'market' | 'tasks' | 'profile';
  onTabChange: (tab: 'home' | 'market' | 'tasks' | 'profile') => void;
  onCenterClick?: () => void;
}

const dockItems = [
  { id: 'home', label: '首页', icon: LayoutDashboard },
  { id: 'market', label: '行情', icon: TrendingUp },
  { id: 'tasks', label: '任务', icon: CheckSquare },
  { id: 'profile', label: '个人', icon: User },
] as const;

const MobileDockCN: React.FC<MobileDockCNProps> = ({ 
  activeTab, 
  onTabChange,
  onCenterClick 
}) => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0d0e10]/95 backdrop-blur-xl border-t border-white/5 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around px-4 py-2">
        {dockItems.map((item, index) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          
          return (
            <React.Fragment key={item.id}>
              {/* 中心按钮位置 (第3个位置前) */}
              {index === 2 && (
                <button
                  onClick={onCenterClick}
                  className="relative -mt-8 mx-2"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/40 hover:shadow-emerald-500/60 transition-all active:scale-95">
                    <Plus className="w-6 h-6 text-[#0d0e10]" strokeWidth={2.5} />
                  </div>
                </button>
              )}
              
              <button
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center justify-center min-w-[56px] py-2 rounded-2xl transition-all ${
                  isActive ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1 ${
                  isActive ? 'bg-emerald-500/20' : ''
                }`}>
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[11px] font-medium ${isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {item.label}
                </span>
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileDockCN;
