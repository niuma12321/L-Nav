import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Code2, 
  Zap, 
  RefreshCw, 
  Palette,
  Plus,
  Home,
  LayoutGrid,
  Search,
  User
} from 'lucide-react';

interface MobileDockProps {
  activeTab: 'home' | 'resources' | 'search' | 'profile';
  onTabChange: (tab: 'home' | 'resources' | 'search' | 'profile') => void;
  onFabClick?: () => void;
  onQuickAIClick?: () => void;
}

type BottomButton = {
  id: 'terminal' | 'code' | 'quickai' | 'sync' | 'themes';
  label: string;
  icon: typeof Terminal;
  isCenter?: boolean;
};

const bottomButtons: BottomButton[] = [
  { id: 'terminal', label: 'TERMINAL', icon: Terminal },
  { id: 'code', label: 'CODE', icon: Code2 },
  { id: 'quickai', label: 'QUICK AI', icon: Zap, isCenter: true },
  { id: 'sync', label: 'SYNC', icon: RefreshCw },
  { id: 'themes', label: 'THEMES', icon: Palette },
];

const MobileDock: React.FC<MobileDockProps> = ({
  activeTab,
  onTabChange,
  onFabClick,
  onQuickAIClick
}) => {
  const [activeButton, setActiveButton] = useState<string>('quickai');

  const handleButtonClick = (id: string) => {
    setActiveButton(id);
    if (id === 'quickai' && onQuickAIClick) {
      onQuickAIClick();
    }
  };

  return (
    <>
      {/* FAB - Floating Action Button */}
      {onFabClick && (
        <button
          onClick={onFabClick}
          className="fixed bottom-32 right-4 z-50 w-14 h-14 rounded-full 
                     bg-gradient-to-br from-emerald-400 to-emerald-500 
                     text-[#0d0e10] shadow-lg shadow-emerald-500/40 
                     flex items-center justify-center 
                     transition-all duration-300 active:scale-90 hover:shadow-emerald-500/50
                     lg:hidden"
          aria-label="添加"
        >
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </button>
      )}

      {/* Bottom Function Bar - Matches design */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 lg:hidden">
        <div className="flex items-center gap-1 px-2 py-2 rounded-3xl bg-[#181a1c]/95 backdrop-blur-xl border border-white/5 shadow-2xl shadow-black/50">
          {bottomButtons.map((item) => {
            const isActive = activeButton === item.id;
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => handleButtonClick(item.id)}
                className={`flex flex-col items-center justify-center min-w-[56px] py-2 px-2 rounded-2xl
                           transition-all duration-200 active:scale-95 touch-target-sm
                           ${item.isCenter 
                             ? isActive 
                               ? 'bg-emerald-400 text-[#0d0e10] shadow-lg shadow-emerald-500/40' 
                               : 'bg-emerald-500/20 text-emerald-400'
                             : isActive 
                               ? 'text-white' 
                               : 'text-slate-500 hover:text-slate-300'
                           }`}
                aria-label={item.label}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                <span className={`
                  text-[9px] font-semibold tracking-wider mt-1 transition-colors
                  ${isActive ? (item.isCenter ? 'text-[#0d0e10]' : 'text-white') : 'text-slate-500'}
                `}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Tab Bar - Main Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#0d0e10] border-t border-white/5">
        <div className="flex items-center justify-around px-4 py-3 pb-safe">
          {[
            { id: 'home', label: 'HOME', icon: Home },
            { id: 'resources', label: 'RESOURCES', icon: LayoutGrid },
            { id: 'search', label: 'SEARCH', icon: Search },
            { id: 'profile', label: 'PROFILE', icon: User },
          ].map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id as typeof activeTab)}
                className={`flex flex-col items-center justify-center min-w-[64px] py-2 rounded-2xl
                           transition-all duration-200 active:scale-95
                           ${isActive 
                             ? 'text-emerald-400' 
                             : 'text-slate-500'
                           }`}
              >
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center mb-1
                  ${isActive ? 'bg-emerald-400 text-[#0d0e10]' : 'bg-transparent'}
                `}>
                  <Icon className="w-5 h-5" strokeWidth={2} />
                </div>
                <span className="text-[10px] font-semibold tracking-wider">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default MobileDock;
