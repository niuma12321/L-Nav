import React from 'react';
import { Home, LayoutGrid, Search, User } from 'lucide-react';

interface BottomNavBarProps {
  activeTab: 'home' | 'widgets' | 'search' | 'profile';
  onTabChange: (tab: 'home' | 'widgets' | 'search' | 'profile') => void;
  onFabClick?: () => void;
  unreadCount?: number;
}

const tabs = [
  { id: 'home', label: 'HOME', icon: Home },
  { id: 'widgets', label: 'WIDGETS', icon: LayoutGrid },
  { id: 'search', label: 'SEARCH', icon: Search },
  { id: 'profile', label: 'PROFILE', icon: User },
] as const;

const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabChange,
  onFabClick,
  unreadCount = 0
}) => {
  return (
    <>
      {/* FAB - Floating Action Button */}
      {onFabClick && (
        <button
          onClick={onFabClick}
          className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 flex items-center justify-center transition-all duration-200 active:scale-90 hover:shadow-emerald-500/50 lg:hidden"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0d0e10]/95 backdrop-blur-xl border-t border-white/5 pb-safe lg:hidden">
        <div className="flex items-center justify-around px-2 py-3">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  flex flex-col items-center justify-center min-w-[64px] py-2 px-3 rounded-xl
                  transition-all duration-200 active:scale-95
                  ${isActive 
                    ? 'text-emerald-400' 
                    : 'text-slate-500 hover:text-slate-300'
                  }
                `}
              >
                <div className={`
                  p-2 rounded-xl mb-1 transition-all duration-200
                  ${isActive ? 'bg-emerald-500/20' : ''}
                `}>
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                </div>
                <span className={`
                  text-[10px] font-semibold tracking-wider transition-colors
                  ${isActive ? 'text-emerald-400' : 'text-slate-500'}
                `}>
                  {tab.label}
                </span>
                {tab.id === 'home' && unreadCount > 0 && (
                  <span className="absolute top-2 right-1/4 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default BottomNavBar;
