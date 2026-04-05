import React, { useMemo, useCallback } from 'react';
import { LinkItem } from '../../types';
import { EyeOff, Settings, Globe, Activity } from '@/utils/icons';
import Favicon from './Favicon';
import { getIconToneClass, getIconToneStyle } from '../../utils/iconTone';
import { LinkStatus } from '../../hooks/useLinkCheck';

interface LinkCardProps {
  link: LinkItem;
  siteCardStyle: 'detailed' | 'simple';
  isBatchEditMode: boolean;
  isSelected: boolean;
  readOnly?: boolean;
  linkStatus?: LinkStatus;
  onSelect: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, link: LinkItem) => void;
  onEdit: (link: LinkItem) => void;
  onNavigate?: (url: string) => void;
}

const LinkCard: React.FC<LinkCardProps> = React.memo(({
  link,
  siteCardStyle,
  isBatchEditMode,
  isSelected,
  readOnly = false,
  linkStatus,
  onSelect,
  onContextMenu,
  onEdit,
  onNavigate
}) => {
  const isDetailedView = siteCardStyle === 'detailed';

  // 样式缓存 - 增强移动端体验
  const cardClasses = useMemo(() => `
    group relative rounded-2xl transition-all duration-300 ease-out
    bg-white dark:bg-slate-900/40 backdrop-blur-md
    border overflow-hidden touch-feedback
    ${isBatchEditMode
      ? 'cursor-pointer border-slate-200 dark:border-white/10'
      : 'cursor-pointer shadow-sm shadow-slate-200/50 dark:shadow-none hover:-translate-y-1 hover:shadow-xl hover:shadow-accent/20 active:scale-98'
    }
    ${isSelected
      ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-50 dark:bg-rose-900/15'
      : 'border-slate-200/60 dark:border-white/8 hover:border-accent/50 dark:hover:border-accent/50'
    }
    ${isDetailedView ? 'p-4 sm:p-5' : 'p-3 sm:p-3.5'}
  `, [isBatchEditMode, isSelected, isDetailedView]);

  const customToneStyle = useMemo(() => getIconToneStyle(link.iconTone), [link.iconTone]);
  const colorClass = useMemo(() =>
    customToneStyle ? '' : getIconToneClass(link.icon, link.url, link.title),
    [customToneStyle, link.icon, link.url, link.title]
  );

  const iconContainerClasses = useMemo(() => `
    flex items-center justify-center shrink-0 rounded-xl overflow-hidden
    border border-black/5 dark:border-white/8 shadow-sm
    transition-transform duration-300 group-hover:scale-105 group-active:scale-95
    ${colorClass}
    ${isDetailedView ? 'w-12 h-12 sm:w-12 sm:h-12' : 'w-10 h-10 sm:w-9 sm:h-9'}
  `, [colorClass, isDetailedView]);

  const titleClasses = useMemo(() => `
    font-medium truncate transition-colors
    ${isDetailedView
      ? 'text-base text-slate-800 dark:text-slate-100 group-hover:text-accent'
      : 'text-sm text-slate-700 dark:text-slate-200 group-hover:text-accent'
    }
  `, [isDetailedView]);

  const descriptionClasses = useMemo(() => `
    leading-relaxed line-clamp-2 mt-1.5
    ${isDetailedView
      ? 'text-sm text-slate-500 dark:text-slate-400'
      : 'text-xs text-slate-500 dark:text-slate-400'
    }
  `, [isDetailedView]);

  // 回调缓存
  const handleCardClick = useCallback(() => {
    if (isBatchEditMode) {
      onSelect(link.id);
    } else if (onNavigate) {
      // 使用客户端路由跳转，不打开新窗口
      onNavigate(link.url);
    }
  }, [isBatchEditMode, onSelect, onNavigate, link.id, link.url]);

  const handleEditClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit(link);
  }, [onEdit, link]);

  // ==============================================
  // ✅ 核心修复：替换为智能Favicon组件，彻底消灭404
  // ==============================================
  const renderIcon = () => (
    <Favicon 
      url={link.url} 
      icon={link.icon}
      size={isDetailedView ? 24 : 20}
      forceFallback={false}
    />
  );

  // 核心内容
  const renderContent = () => (
    <>
      <div className={iconContainerClasses} style={customToneStyle}>
        {renderIcon()}
      </div>
      <h3 className={titleClasses} title={link.title}>
        {link.title}
      </h3>
      {isDetailedView && link.description && (
        <p className={descriptionClasses}>{link.description}</p>
      )}
    </>
  );

  return (
    <div
      className={cardClasses}
      onClick={handleCardClick}
      onContextMenu={(e) => onContextMenu(e, link)}
      role={isBatchEditMode ? 'checkbox' : 'link'}
      aria-checked={isSelected}
      tabIndex={0}
    >
      {isBatchEditMode ? (
        <div className={`flex ${isDetailedView ? 'flex-col' : 'items-center'} min-w-0 gap-3`}>
          {renderContent()}
        </div>
      ) : (
        <div
          onClick={handleCardClick}
          className={`flex ${isDetailedView ? 'flex-col' : 'items-center'} min-w-0 gap-3 cursor-pointer`}
          title={isDetailedView ? link.url : (link.description || link.url)}
        >
          {renderContent()}
        </div>
      )}

      {/* Tooltip */}
      {!isDetailedView && link.description && !isBatchEditMode && (
        <div className="absolute left-1/2 -translate-x-1/2 -top-11 w-max max-w-[220px]
          px-3 py-2 rounded-lg text-xs text-white
          bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-sm
          opacity-0 invisible group-hover:visible group-hover:opacity-100
          transition-all duration-200 z-30 pointer-events-none shadow-lg">
          {link.description}
          <div className="absolute left-1/2 -translate-x-1/2 top-full
            border-4 border-transparent border-t-slate-900/95 dark:border-t-slate-800/95">
          </div>
        </div>
      )}

      {/* 编辑按钮和状态指示 */}
      {!isBatchEditMode && !readOnly && (
        <div className={`
          absolute transition-all duration-200 opacity-0 group-hover:opacity-100 z-20 flex items-center gap-1
          ${isDetailedView ? 'top-3 right-3' : 'right-2 top-1/2 -translate-y-1/2'}
        `}>
          {linkStatus && linkStatus.status !== 'online' && linkStatus.status !== 'checking' && (
            <div 
              className={`w-2 h-2 rounded-full ${
                linkStatus.status === 'offline' ? 'bg-red-500' : 
                linkStatus.status === 'timeout' ? 'bg-yellow-500' : 'bg-orange-500'
              }`}
              title={`链接状态: ${linkStatus.status}${linkStatus.error ? ` - ${linkStatus.error}` : ''}`}
            />
          )}
          <button
            onClick={handleEditClick}
            className="p-1.5 rounded-lg backdrop-blur-sm
              bg-white/90 dark:bg-slate-800/90
              text-slate-400 hover:text-accent
              border border-slate-200/50 dark:border-white/10
              shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50"
            title="编辑链接"
            aria-label="编辑链接"
          >
            <Settings size={14} />
          </button>
        </div>
      )}

      {/* 隐藏标识 */}
      {!isBatchEditMode && link.hidden && (
        <div className="absolute bottom-2 right-2 px-1.5 py-1 rounded-md
          text-[10px] font-medium flex items-center gap-1
          bg-slate-100/80 dark:bg-slate-800/50
          text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-white/5">
          <EyeOff size={10} />
          <span>隐藏</span>
        </div>
      )}

      {/* 批量选择框 */}
      {isBatchEditMode && (
        <div className={`
          absolute top-2 right-2 w-5 h-5 rounded-md border-2
          flex items-center justify-center transition-all duration-200
          ${isSelected
            ? 'bg-rose-500 border-rose-500 text-white scale-100'
            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 scale-95'
          }`}>
          {isSelected && (
            <svg className="w-3 h-3 animate-fade-in" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      )}
    </div>
  );
});

export default LinkCard;
