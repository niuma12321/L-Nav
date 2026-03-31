import React, { useState, useEffect } from 'react';
import { Home, LayoutGrid, Search, Settings, Plus } from 'lucide-react';

interface MobileDockProps {
  activeTab: 'home' | 'resources' | 'search' | 'settings';
  onTabChange: (tab: 'home' | 'resources' | 'search' | 'settings') => void;
  onFabClick?: () => void;
}

type DockItem = {
  id: 'home' | 'resources' | 'search' | 'settings';
  label: string;
  icon: typeof Home;
};

const dockItems: DockItem[] = [
  { id: 'home', label: '首页', icon: Home },
  { id: 'resources', label: '资源', icon: LayoutGrid },
  { id: 'search', label: '搜索', icon: Search },
  { id: 'settings', label: '设置', icon: Settings },
];

const MobileDock: React.FC<MobileDockProps> = ({
  activeTab,
  onTabChange,
  onFabClick
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Auto-hide on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <>
      {/* FAB - Floating Action Button */}
      {onFabClick && (
        <button
          onClick={onFabClick}
          className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-2xl 
                     bg-gradient-to-br from-emerald-500 to-emerald-600 
                     text-white shadow-lg shadow-emerald-500/30 
                     flex items-center justify-center 
                     transition-all duration-300 active:scale-90 hover:shadow-emerald-500/50
                     lg:hidden"
          aria-label="添加"
        >
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </button>
      )}

      {/* Bottom Dock */}
      <nav
        className={`fixed bottom-0 left-0 right-0 z-50 lg:hidden
                   transition-transform duration-300 ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Glassmorphism background */}
        <div className="absolute inset-0 bg-[#0d0e10]/80 backdrop-blur-xl border-t border-white/5" />
        
        {/* Safe area padding for iPhone */}
        <div className="relative pb-safe">
          <div className="flex items-center justify-around px-2 py-3">
            {dockItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex flex-col items-center justify-center min-w-[64px] py-2 px-3 rounded-2xl
                             transition-all duration-200 active:scale-95 touch-target-sm
                             ${isActive 
                               ? 'text-emerald-400' 
                               : 'text-slate-500 hover:text-slate-300'
                             }`}
                  aria-label={item.label}
                >
                  <div className={`
                    p-2 rounded-xl mb-1 transition-all duration-200
                    ${isActive ? 'bg-emerald-500/20 shadow-lg shadow-emerald-500/10' : ''}
                  `}>
                    <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                  </div>
                  <span className={`
                    text-[10px] font-semibold tracking-wider transition-colors
                    ${isActive ? 'text-emerald-400' : 'text-slate-500'}
                  `}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
};

export default MobileDock;
