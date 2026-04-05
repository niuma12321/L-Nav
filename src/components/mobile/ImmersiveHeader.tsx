import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, Bell, User, ChevronLeft } from '@/utils/icons';

interface ImmersiveHeaderProps {
  title: string;
  onMenuClick: () => void;
  onProfileClick: () => void;
  onBack?: () => void;
  showBack?: boolean;
  unreadCount?: number;
  transparent?: boolean;
}

const ImmersiveHeader: React.FC<ImmersiveHeaderProps> = ({
  title,
  onMenuClick,
  onProfileClick,
  onBack,
  showBack = false,
  unreadCount = 0,
  transparent = false
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        
        // 检测是否在顶部
        setIsAtTop(currentScrollY < 10);
        
        // 向下滚动超过 50px 且滚动方向向下时隐藏
        if (currentScrollY > 50) {
          if (currentScrollY > lastScrollY.current) {
            setIsVisible(false);
          } else {
            // 向上滚动时显示
            setIsVisible(true);
          }
        } else {
          setIsVisible(true);
        }
        
        lastScrollY.current = currentScrollY;
        ticking.current = false;
      });
      ticking.current = true;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-40 transition-all duration-300 ease-out
        ${isVisible ? 'translate-y-0' : '-translate-y-full'}
        ${isAtTop && transparent ? 'bg-transparent' : 'bg-slate-900/95 backdrop-blur-lg'}
        ${isAtTop ? '' : 'shadow-lg shadow-black/10'}
      `}
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* 左侧按钮 */}
        <div className="flex items-center gap-3">
          {showBack ? (
            <button
              onClick={onBack}
              className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={onMenuClick}
              className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 标题 */}
        <h1 className="text-lg font-semibold text-white truncate max-w-[200px]">
          {title}
        </h1>

        {/* 右侧按钮 */}
        <div className="flex items-center gap-2">
          <button
            onClick={onProfileClick}
            className="relative p-2 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={onProfileClick}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center"
          >
            <User className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* 底部渐变过渡 */}
      {!isAtTop && (
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
      )}
    </header>
  );
};

export default ImmersiveHeader;
