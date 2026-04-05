import React, { useState, useMemo, useCallback, useEffect } from 'react';
import * as LucideIcons from '@/utils/icons';
import { X, Search, ExternalLink, Clock, Star, Layout, Grid, Code, Settings, Users, Server, Chrome, Check } from '@/utils/icons';
import Icon from './Icon';

interface IconSelectorProps {
  onSelectIcon: (iconName: string) => void;
}

// ==============================================
// ⚙️ 常量配置（抽离优化，易于维护）
// ==============================================
const STORAGE_KEY = 'ynav_recent_icons';
const MAX_RECENT_ICONS = 12;
const DEBOUNCE_DELAY = 150;

// 图标分类（模块化管理）
const ICON_CATEGORIES = {
  最近使用: { icon: Clock, list: [] as string[] },
  常用: { icon: Star, list: [
    'Star', 'Heart', 'Bookmark', 'Home', 'User', 'Settings', 'Bell', 'Search', 'Plus', 'Check'
  ]},
  布局: { icon: Layout, list: [
    'Layout', 'Grid', 'List', 'Columns', 'Sidebar', 'Layers', 'Circle', 'Square'
  ]},
  媒体: { icon: Grid, list: [
    'Music', 'Play', 'Pause', 'Camera', 'Image', 'Video', 'Mic', 'Headphones'
  ]},
  工具: { icon: Settings, list: [
    'Edit', 'Copy', 'Share', 'Trash2', 'Download', 'Upload', 'Filter', 'Menu'
  ]},
  社交: { icon: Users, list: [
    'Github', 'Gitlab', 'MessageSquare', 'Send', 'AtSign', 'Mail'
  ]},
  设备: { icon: Server, list: [
    'Server', 'Cloud', 'Database', 'Wifi', 'Phone', 'MapPin', 'Rocket'
  ]},
  浏览器: { icon: Chrome, list: [
    'Chrome', 'Firefox', 'Safari', 'Edge', 'Code', 'Terminal'
  ]},
};

type CategoryKey = keyof typeof ICON_CATEGORIES;

// ==============================================
// 🧠 工具函数（缓存+优化）
// ==============================================
// 防抖函数
const debounce = <T extends (...args: any[]) => void>(func: T, delay: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

// 最近使用图标管理
const recentIcons = {
  get: (): string[] => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch { return []; }
  },
  add: (iconName: string) => {
    const list = recentIcons.get().filter(i => i !== iconName);
    const newList = [iconName, ...list].slice(0, MAX_RECENT_ICONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
  },
};

// 格式化图标名称
const formatIconName = (name: string): string => {
  if (!name) return '';
  return name.charAt(0).toUpperCase() + name.slice(1).replace(/-\w/g, c => c[1].toUpperCase());
};

// ==============================================
// 🚀 核心组件
// ==============================================
const IconSelector: React.FC<IconSelectorProps> = ({ onSelectIcon }) => {
  // 状态管理
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Folder');
  const [customIconName, setCustomIconName] = useState('');
  const [isValidIcon, setIsValidIcon] = useState(true);
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('常用');
  const [previewIcon, setPreviewIcon] = useState<string | null>(null);

  // 初始化最近使用图标
  useEffect(() => {
    ICON_CATEGORIES.最近使用.list = recentIcons.get();
  }, []);

  // ==============================================
  // 🔍 防抖搜索（性能优化）
  // ==============================================
  const handleSearch = useCallback(
    debounce((value: string) => setDebouncedQuery(value), DEBOUNCE_DELAY),
    []
  );

  // ==============================================
  // 🎯 图标校验与选择（逻辑优化）
  // ==============================================
  const validateIconName = useCallback((iconName: string): boolean => {
    if (!iconName || typeof iconName !== 'string' || !iconName.trim()) return false;
    const formatted = formatIconName(iconName);
    return formatted in LucideIcons;
  }, []);

  const handleSelect = useCallback((iconName: string) => {
    setSelectedIcon(iconName);
    setCustomIconName('');
    setIsValidIcon(true);
    recentIcons.add(iconName);
    ICON_CATEGORIES.最近使用.list = recentIcons.get();
  }, []);

  const handleCustomIconChange = useCallback((value: string) => {
    setCustomIconName(value);
    if (!value || typeof value !== 'string' || !value.trim()) {
      setIsValidIcon(true);
      return;
    }
    const isValid = validateIconName(value);
    setIsValidIcon(isValid);
    if (isValid) setSelectedIcon(formatIconName(value));
  }, [validateIconName]);

  const handleConfirm = useCallback(() => {
    onSelectIcon(selectedIcon);
  }, [selectedIcon, onSelectIcon]);

  // ==============================================
  // 📊 过滤图标列表（缓存优化）
  // ==============================================
  const filteredIcons = useMemo(() => {
    const allIcons = Object.values(ICON_CATEGORIES).flatMap(cat => cat.list);
    const uniqueIcons = [...new Set(allIcons)];
    
    if (!debouncedQuery) return uniqueIcons;
    
    return uniqueIcons.filter(icon => 
      icon.toLowerCase().includes(debouncedQuery.toLowerCase())
    );
  }, [debouncedQuery]);

  const categoryIcons = useMemo(() => {
    return debouncedQuery ? filteredIcons : ICON_CATEGORIES[activeCategory].list;
  }, [activeCategory, debouncedQuery, filteredIcons]);

  // ==============================================
  // ⌨️ 键盘快捷操作（无障碍增强）
  // ==============================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewIcon(null);
      if (e.key === 'Enter' && isValidIcon) handleConfirm();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleConfirm, isValidIcon]);

  // ==============================================
  // 🎨 渲染
  // ==============================================
  return (
    <div className="flex flex-col h-full max-h-[85vh] bg-white dark:bg-slate-900 rounded-xl overflow-hidden">
      {/* 顶部：搜索栏 */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-900 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="🔍 搜索图标..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
            autoFocus
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <X size={14} className="text-slate-500" />
            </button>
          )}
        </div>
      </div>

      {/* 分类切换栏 */}
      <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1.5">
          {(Object.keys(ICON_CATEGORIES) as CategoryKey[]).map((key) => {
            const CategoryIcon = ICON_CATEGORIES[key].icon;
            return (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                disabled={!!debouncedQuery}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  activeCategory === key && !debouncedQuery
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                } ${debouncedQuery ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <CategoryIcon size={14} />
                {key}
              </button>
            );
          })}
        </div>
      </div>

      {/* 自定义图标输入 */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-400">自定义图标</span>
            <a 
              href="https://lucide.dev/icons/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              <ExternalLink size={12} />
              官方图标库
            </a>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="输入图标名称（如：cloud、star）"
              value={customIconName}
              onChange={(e) => handleCustomIconChange(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-xl border transition-all ${
                customIconName && !isValidIcon 
                  ? 'border-red-300 dark:border-red-700 focus:ring-red-500/50' 
                  : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500/50'
              } dark:bg-slate-800 dark:text-white outline-none`}
            />
            {customIconName && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isValidIcon ? (
                  <Check size={14} className="text-green-500" />
                ) : (
                  <X size={14} className="text-red-500" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 当前选择预览 */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600 dark:text-slate-400">当前选择</span>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <Icon name={selectedIcon} size={18} gradient="primary" />
            <span className="text-sm font-medium dark:text-slate-200">{selectedIcon}</span>
          </div>
        </div>
      </div>

      {/* 确认按钮 */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            回车确认 | ESC 关闭预览
          </div>
          <button
            onClick={handleConfirm}
            disabled={!isValidIcon}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm ${
              isValidIcon
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            ✅ 确认选择
          </button>
        </div>
      </div>

      {/* 图标网格 */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
        {categoryIcons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Search size={48} className="mb-4 opacity-30" />
            <p className="text-sm">没有找到匹配的图标</p>
            <p className="text-xs mt-1">尝试更换关键词或自定义输入</p>
          </div>
        ) : (
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
            {categoryIcons.map((iconName) => (
              <button
                key={iconName}
                onClick={() => handleSelect(iconName)}
                onMouseEnter={() => setPreviewIcon(iconName)}
                onMouseLeave={() => setPreviewIcon(null)}
                className={`group relative p-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-200 hover:scale-105 ${
                  selectedIcon === iconName 
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/50 shadow-md' 
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
                title={iconName}
              >
                <Icon name={iconName} size={20} />
                <span className="text-xs truncate w-full text-center">{iconName}</span>
                
                {/* 放大预览浮层 */}
                {previewIcon === iconName && (
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 p-3 rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 z-20">
                    <Icon name={iconName} size={32} gradient="primary" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(IconSelector);
