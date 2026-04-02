import React from 'react';
import { Home, Search, Bookmark, MoreHorizontal, Plus } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: 'home' | 'search' | 'favorites' | 'more';
  onTabChange: (tab: 'home' | 'search' | 'favorites' | 'more') => void;
  onFabClick: () => void;
  unreadCount?: number;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  onFabClick,
  unreadCount = 0
}) => {
  const tabs = [
    { id: 'home', icon: Home, label: '主页' },
    { id: 'search', icon: Search, label: '搜索' },
    { id: 'favorites', icon: Bookmark, label: '收藏' },
    { id: 'more', icon: MoreHorizontal, label: '更多' }
  ] as const;

  return (
    <>
      {/* 底部导航栏 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-2 pb-safe">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id as any)}
                className={`
                  flex flex-col items-center justify-center min-w-[64px] py-2 px-3 rounded-xl
                  transition-all duration-200 active:scale-95
                  ${isActive 
                    ? 'text-emerald-400 bg-emerald-500/10' 
                    : 'text-slate-400 hover:text-slate-200'
                  }
                `}
              >
                <div className="relative">
                  <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                  {tab.id === 'favorites' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-medium">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] mt-1 font-medium ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <div className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 浮动操作按钮 (FAB) */}
      <button
        onClick={onFabClick}
        className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 flex items-center justify-center transition-all duration-200 active:scale-90 hover:shadow-xl hover:shadow-emerald-500/40"
      >
        <Plus className="w-7 h-7" />
      </button>
    </>
  );
};

export default MobileBottomNav;
