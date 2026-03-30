import React, { useMemo, useCallback } from 'react';
import { LinkItem } from '../../types';
import { EyeOff, Settings, Globe } from 'lucide-react';
import Icon from './Icon';
import { getIconToneClass, getIconToneStyle } from '../../utils/iconTone';

interface LinkCardProps {
  link: LinkItem;
  siteCardStyle: 'detailed' | 'simple';
  isBatchEditMode: boolean;
  isSelected: boolean;
  readOnly?: boolean;
  onSelect: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, link: LinkItem) => void;
  onEdit: (link: LinkItem) => void;
}

// ==============================================
// 🔒 缓存组件，避免无效重渲染（性能极致优化）
// ==============================================
const LinkCard: React.FC<LinkCardProps> = React.memo(({
  link,
  siteCardStyle,
  isBatchEditMode,
  isSelected,
  readOnly = false,
  onSelect,
  onContextMenu,
  onEdit
}) => {
  const isDetailedView = siteCardStyle === 'detailed';

  // ==============================================
  // 🎨 样式缓存（useMemo 减少重复计算）
  // ==============================================
  const cardClasses = useMemo(() => `
    group relative rounded-2xl transition-all duration-300 ease-out
    bg-white dark:bg-slate-900/40 backdrop-blur-md
    border overflow-hidden
    ${isBatchEditMode
      ? 'cursor-pointer border-slate-200 dark:border-white/10'
      : 'cursor-pointer shadow-sm shadow-slate-200/50 dark:shadow-none hover:-translate-y-0.5 hover:shadow-xl hover:shadow-accent/15 active:scale-98'
    }
    ${isSelected
      ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-50 dark:bg-rose-900/15'
      : 'border-slate-200/60 dark:border-white/8 hover:border-accent/40 dark:hover:border-accent/40'
    }
    ${isDetailedView ? 'p-5' : 'p-3.5'}
  `, [isBatchEditMode, isSelected, isDetailedView]);

  const customToneStyle = useMemo(() => getIconToneStyle(link.iconTone), [link.iconTone]);
  const colorClass = useMemo(() =>
    customToneStyle ? '' : getIconToneClass(link.icon, link.url, link.title),
    [customToneStyle, link.icon, link.url, link.title]
  );

  const iconContainerClasses = useMemo(() => `
    flex items-center justify-center shrink-0 rounded-xl overflow-hidden
    border border-black/5 dark:border-white/8 shadow-sm
    transition-transform duration-300 group-hover:scale-105
    ${colorClass}
    ${isDetailedView ? 'w-12 h-12' : 'w-9 h-9'}
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

  // ==============================================
  // 🎯 回调函数缓存（性能优化）
  // ==============================================
  const handleCardClick = useCallback(() => {
    if (isBatchEditMode) onSelect(link.id);
  }, [isBatchEditMode, onSelect, link.id]);

  const handleEditClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit(link);
  }, [onEdit, link]);

  // ==============================================
  // 🖼️ 图标渲染（带错误兜底，彻底解决404报错）
  // ==============================================
  const renderIcon = () => {
    if (link.icon) {
      return (
        <img
          src={link.icon}
          alt=""
          loading="lazy"
          className={`object-contain ${isDetailedView ? "w-6 h-6" : "w-5 h-5"}`}
          onError={(e) => {
            // 图片加载失败，隐藏img，渲染兜底图标
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.removeAttribute('style');
          }}
        />
      );
    }
    return null;
  };

  const renderFallbackIcon = () => (
    <span
      className="hidden text-sm font-bold uppercase text-slate-400 dark:text-slate-500"
      style={link.icon ? {} : { display: 'flex' }}
    >
      {link.title.charAt(0) || <Globe size={16} />}
    </span>
  );

  // ==============================================
  // 📝 核心内容渲染
  // ==============================================
  const renderContent = () => (
    <>
      {/* 图标区域 */}
      <div className={iconContainerClasses} style={customToneStyle}>
        {renderIcon()}
        {renderFallbackIcon()}
      </div>

      {/* 标题 */}
      <h3 className={titleClasses} title={link.title}>
        {link.title}
      </h3>

      {/* 详细模式描述 */}
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
      {/* 卡片主体内容 */}
      {isBatchEditMode ? (
        <div className={`flex ${isDetailedView ? 'flex-col' : 'items-center'} min-w-0 gap-3`}>
          {renderContent()}
        </div>
      ) : (
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex ${isDetailedView ? 'flex-col' : 'items-center'} min-w-0 gap-3`}
          title={isDetailedView ? link.url : (link.description || link.url)}
        >
          {renderContent()}
        </a>
      )}

      {/* ==============================================
        🔍 简易模式 Tooltip（美化+深色适配）
      ============================================== */}
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

      {/* ==============================================
        ⚙️ 悬浮编辑按钮（智能定位+丝滑交互）
      ============================================== */}
      {!isBatchEditMode && !readOnly && (
        <div className={`
          absolute transition-all duration-200 opacity-0 group-hover:opacity-100 z-20
          ${isDetailedView ? 'top-3 right-3' : 'right-2 top-1/2 -translate-y-1/2'}
        `}>
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

      {/* ==============================================
        🕶️ 隐藏状态标识（美化轻量化）
      ============================================== */}
      {!isBatchEditMode && link.hidden && (
        <div className="absolute bottom-2 right-2 px-1.5 py-1 rounded-md
          text-[10px] font-medium flex items-center gap-1
          bg-slate-100/80 dark:bg-slate-800/50
          text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-white/5">
          <EyeOff size={10} />
          <span>隐藏</span>
        </div>
      )}

      {/* ==============================================
        ✅ 批量选择勾选框（高级动效）
      ============================================== */}
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
