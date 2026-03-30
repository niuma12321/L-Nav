import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo
} from 'react';
import { SearchMode, ExternalSearchSource, SearchConfig } from '../types';
import { SEARCH_CONFIG_KEY } from '../utils/constants';

// ==================== 常量配置 ====================
const POPUP_HIDE_DELAY = 150;
const SEARCH_HISTORY_KEY = 'search-history';
const MAX_SEARCH_HISTORY = 20;
const DEFAULT_SEARCH_MODE: SearchMode = 'external';

// ==================== 安全存储工具 ====================
const safeStorage = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set: (key: string, value: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn('[Search] 存储失败:', err);
    }
  },
  remove: (key: string) => localStorage.removeItem(key)
};

// ==================== 默认搜索源 ====================
const buildDefaultSearchSources = (): ExternalSearchSource[] => {
  const now = Date.now();
  return [
    { id: 'bing', name: '必应', url: 'https://www.bing.com/search?q={query}', icon: 'Search', enabled: true, createdAt: now },
    { id: 'google', name: 'Google', url: 'https://www.google.com/search?q={query}', icon: 'Search', enabled: true, createdAt: now },
    { id: 'baidu', name: '百度', url: 'https://www.baidu.com/s?wd={query}', icon: 'Globe', enabled: true, createdAt: now },
    { id: 'sogou', name: '搜狗', url: 'https://www.sogou.com/web?query={query}', icon: 'Globe', enabled: true, createdAt: now },
    { id: 'yandex', name: 'Yandex', url: 'https://yandex.com/search/?text={query}', icon: 'Globe', enabled: true, createdAt: now },
    { id: 'github', name: 'GitHub', url: 'https://github.com/search?q={query}', icon: 'Github', enabled: true, createdAt: now },
    { id: 'linuxdo', name: 'Linux.do', url: 'https://linux.do/search?q={query}', icon: 'Terminal', enabled: true, createdAt: now },
    { id: 'bilibili', name: 'B站', url: 'https://search.bilibili.com/all?keyword={query}', icon: 'Play', enabled: true, createdAt: now },
    { id: 'youtube', name: 'YouTube', url: 'https://www.youtube.com/results?search_query={query}', icon: 'Video', enabled: true, createdAt: now },
    { id: 'wikipedia', name: '维基', url: 'https://zh.wikipedia.org/wiki/Special:Search?search={query}', icon: 'BookOpen', enabled: true, createdAt: now }
  ];
};

// ==================== 搜索源解析工具 ====================
const resolveSelectedSource = (
  sources: ExternalSearchSource[],
  selectedId?: string | null,
  selectedSource?: ExternalSearchSource | null
): ExternalSearchSource | null => {
  if (!sources.length) return selectedSource ?? null;
  if (selectedId) {
    const match = sources.find(s => s.id === selectedId);
    if (match) return match;
  }
  if (selectedSource) {
    const match = sources.find(s => s.id === selectedSource.id);
    if (match) return match;
  }
  return sources.find(s => s.enabled) ?? sources[0] ?? null;
};

// ==================== 主 Hook ====================
export function useSearch() {
  // 核心搜索状态
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>(DEFAULT_SEARCH_MODE);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  // 搜索源配置
  const [externalSources, setExternalSources] = useState<ExternalSearchSource[]>([]);
  const [selectedSource, setSelectedSource] = useState<ExternalSearchSource | null>(null);
  
  // UI 交互状态
  const [showSourcePopup, setShowSourcePopup] = useState(false);
  const [hoveredSource, setHoveredSource] = useState<ExternalSearchSource | null>(null);
  const [isIconHovered, setIsIconHovered] = useState(false);
  const [isPopupHovered, setIsPopupHovered] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // 定时器引用
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ==================== 性能优化：派生状态 ====================
  const enabledSources = useMemo(() => 
    externalSources.filter(s => s.enabled),
  [externalSources]);

  const hasValidQuery = useMemo(() => 
    searchQuery.trim().length > 0,
  [searchQuery]);

  const isEmptySources = useMemo(() => 
    externalSources.length === 0,
  [externalSources]);

  // ==================== 搜索历史管理 ====================
  const addSearchHistory = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    
    setSearchHistory(prev => {
      const newHistory = [trimmed, ...prev.filter(q => q !== trimmed)];
      return newHistory.slice(0, MAX_SEARCH_HISTORY);
    });
  }, []);

  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
    safeStorage.remove(SEARCH_HISTORY_KEY);
  }, []);

  // ==================== 配置存储 ====================
  const saveSearchConfig = useCallback((
    sources: ExternalSearchSource[],
    mode: SearchMode,
    selected?: ExternalSearchSource | null
  ) => {
    const resolved = resolveSelectedSource(sources, selected?.id, selected);
    const config: SearchConfig = {
      mode,
      externalSources: sources,
      selectedSource: resolved,
      selectedSourceId: resolved?.id
    };

    setExternalSources(sources);
    setSearchMode(mode);
    setSelectedSource(resolved);
    safeStorage.set(SEARCH_CONFIG_KEY, config);
  }, []);

  // ==================== 搜索源管理（新增功能） ====================
  const resetDefaultSources = useCallback(() => {
    const defaults = buildDefaultSearchSources();
    saveSearchConfig(defaults, searchMode, defaults[0]);
  }, [searchMode, saveSearchConfig]);

  const toggleSourceEnabled = useCallback((id: string) => {
    setExternalSources(prev => 
      prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s)
    );
  }, []);

  const addSearchSource = useCallback((source: Omit<ExternalSearchSource, 'createdAt'>) => {
    const newSource: ExternalSearchSource = {
      ...source,
      createdAt: Date.now()
    };
    setExternalSources(prev => [...prev, newSource]);
  }, []);

  const deleteSearchSource = useCallback((id: string) => {
    setExternalSources(prev => prev.filter(s => s.id !== id));
  }, []);

  // ==================== 核心搜索逻辑 ====================
  const handleExternalSearch = useCallback(() => {
    if (!hasValidQuery || searchMode !== 'external') return;

    // 添加历史记录
    addSearchHistory(searchQuery);
    
    // 兜底默认搜索源
    if (isEmptySources) {
      resetDefaultSources();
    }

    const targetSource = selectedSource ?? enabledSources[0];
    if (!targetSource) return;

    const url = targetSource.url.replace('{query}', encodeURIComponent(searchQuery));
    window.open(url, '_blank');
  }, [
    searchQuery,
    searchMode,
    hasValidQuery,
    isEmptySources,
    selectedSource,
    enabledSources,
    addSearchHistory,
    resetDefaultSources
  ]);

  // ==================== 交互事件 ====================
  const handleSearchModeChange = useCallback((mode: SearchMode) => {
    if (mode === 'external' && isEmptySources) {
      resetDefaultSources();
    }
    saveSearchConfig(externalSources, mode);
  }, [externalSources, isEmptySources, resetDefaultSources, saveSearchConfig]);

  const handleSourceSelect = useCallback((source: ExternalSearchSource) => {
    setSelectedSource(source);
    saveSearchConfig(externalSources, searchMode, source);
    
    // 有查询内容时直接搜索
    if (hasValidQuery) {
      addSearchHistory(searchQuery);
      const url = source.url.replace('{query}', encodeURIComponent(searchQuery));
      window.open(url, '_blank');
    }

    setShowSourcePopup(false);
    setHoveredSource(null);
  }, [externalSources, searchMode, searchQuery, hasValidQuery, addSearchHistory, saveSearchConfig]);

  const clearSearchQuery = useCallback(() => {
    setSearchQuery('');
  }, []);

  const toggleMobileSearch = useCallback(() => {
    setIsMobileOpen(prev => !prev);
    if (searchMode !== 'external') handleSearchModeChange('external');
  }, [searchMode, handleSearchModeChange]);

  // ==================== 弹窗延迟逻辑 ====================
  useEffect(() => {
    if (isIconHovered || isPopupHovered) {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      setShowSourcePopup(true);
      return;
    }

    hideTimeoutRef.current = setTimeout(() => {
      setShowSourcePopup(false);
      setHoveredSource(null);
    }, POPUP_HIDE_DELAY);

    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [isIconHovered, isPopupHovered]);

  // ==================== 初始化：加载配置 + 历史 ====================
  useEffect(() => {
    // 加载搜索配置
    const config = safeStorage.get<SearchConfig | null>(SEARCH_CONFIG_KEY, null);
    if (config?.mode) {
      const sources = config.externalSources ?? [];
      const resolved = resolveSelectedSource(sources, config.selectedSourceId, config.selectedSource);
      setSearchMode(config.mode);
      setExternalSources(sources);
      setSelectedSource(resolved);
    } else {
      resetDefaultSources();
    }

    // 加载搜索历史
    const history = safeStorage.get<string[]>(SEARCH_HISTORY_KEY, []);
    setSearchHistory(history);
  }, [resetDefaultSources]);

  // 持久化搜索历史
  useEffect(() => {
    safeStorage.set(SEARCH_HISTORY_KEY, searchHistory);
  }, [searchHistory]);

  // 回车键搜索（新增快捷键）
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && hasValidQuery && isMobileOpen) {
        handleExternalSearch();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hasValidQuery, isMobileOpen, handleExternalSearch]);

  // ==================== 导出状态与方法 ====================
  return {
    // 搜索核心
    searchQuery,
    setSearchQuery,
    searchMode,
    hasValidQuery,
    handleExternalSearch,
    clearSearchQuery,

    // 搜索历史
    searchHistory,
    addSearchHistory,
    clearSearchHistory,

    // 搜索源配置
    externalSources,
    enabledSources,
    selectedSource,
    handleSearchModeChange,
    handleSourceSelect,
    resetDefaultSources,
    toggleSourceEnabled,
    addSearchSource,
    deleteSearchSource,

    // UI 交互
    showSourcePopup,
    setShowSourcePopup,
    hoveredSource,
    setHoveredSource,
    isIconHovered,
    setIsIconHovered,
    isPopupHovered,
    setIsPopupHovered,
    isMobileOpen,
    toggleMobileSearch,

    // 配置操作
    saveSearchConfig,
    restoreSearchConfig: saveSearchConfig
  };
}
