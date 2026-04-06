import { useState, useEffect, useRef, useCallback } from 'react';
import { SearchMode, ExternalSearchSource, SearchConfig } from '../types';
import {
    SEARCH_CONFIG_KEY,
    getCanonicalUserStorageKey,
    getData,
    setData,
    YNAV_DATA_SYNCED_EVENT,
    YNAV_USER_STORAGE_UPDATED_EVENT
} from '../utils/constants';

// 默认搜索源
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

// 搜索源匹配工具
const resolveSelectedSource = (
    sources: ExternalSearchSource[],
    selectedId?: string | null,
    selectedSource?: ExternalSearchSource | null
): ExternalSearchSource | null => {
    if (!Array.isArray(sources) || sources.length === 0) return selectedSource ?? null;
    if (selectedId) {
        const matched = sources.find(source => source.id === selectedId);
        if (matched) return matched;
    }
    if (selectedSource) {
        const matched = sources.find(source => source.id === selectedSource.id);
        return matched ?? selectedSource;
    }
    return sources.find(source => source.enabled) || sources[0] || null;
};

export function useSearch() {
    // 核心状态（强制初始化为数组，杜绝filter报错）
    const [searchQuery, setSearchQuery] = useState('');
    const [searchMode, setSearchMode] = useState<SearchMode>('external');
    const [externalSearchSources, setExternalSearchSources] = useState<ExternalSearchSource[]>([]);
    const [selectedSearchSource, setSelectedSearchSource] = useState<ExternalSearchSource | null>(null);
    const [showSearchSourcePopup, setShowSearchSourcePopup] = useState(false);
    const [hoveredSearchSource, setHoveredSearchSource] = useState<ExternalSearchSource | null>(null);
    const [isIconHovered, setIsIconHovered] = useState(false);
    const [isPopupHovered, setIsPopupHovered] = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

    const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // 保存配置（全空值防护）
    const saveSearchConfig = useCallback((sources: ExternalSearchSource[], mode: SearchMode, selected?: ExternalSearchSource | null) => {
        const safeSources = Array.isArray(sources) ? sources : [];
        const candidate = selected !== undefined ? selected : selectedSearchSource;
        const resolvedSelected = resolveSelectedSource(safeSources, candidate?.id, candidate);
        const searchConfig: SearchConfig = {
            mode,
            externalSources: safeSources,
            selectedSource: resolvedSelected,
            selectedSourceId: resolvedSelected?.id
        };
        setExternalSearchSources(safeSources);
        setSearchMode(mode);
        setSelectedSearchSource(resolvedSelected);
        const config = getData(SEARCH_CONFIG_KEY, null as SearchConfig | null);
        setData(SEARCH_CONFIG_KEY, searchConfig);
    }, [selectedSearchSource]);

    // 切换搜索模式
    const handleSearchModeChange = useCallback((mode: SearchMode) => {
        setSearchMode(mode);
        if (mode === 'external' && externalSearchSources.length === 0) {
            const defaultSources = buildDefaultSearchSources();
            saveSearchConfig(defaultSources, mode, defaultSources[0]);
        } else {
            saveSearchConfig(externalSearchSources, mode);
        }
    }, [externalSearchSources, saveSearchConfig]);

    // 选择搜索源
    const handleSearchSourceSelect = useCallback((source: ExternalSearchSource) => {
        setSelectedSearchSource(source);
        saveSearchConfig(externalSearchSources, searchMode, source);
        if (searchQuery && typeof searchQuery === 'string' && searchQuery.trim()) {
            const searchUrl = source.url.replace('{query}', encodeURIComponent(searchQuery));
            window.open(searchUrl, '_blank');
        }
        setShowSearchSourcePopup(false);
        setHoveredSearchSource(null);
    }, [externalSearchSources, searchMode, searchQuery, saveSearchConfig]);

    // 执行搜索
    const handleExternalSearch = useCallback((queryOverride?: string) => {
        const effectiveQuery = typeof queryOverride === 'string' ? queryOverride : searchQuery;
        if (effectiveQuery && typeof effectiveQuery === 'string' && effectiveQuery.trim() && searchMode === 'external') {
            if (externalSearchSources.length === 0) {
                const defaultSources = buildDefaultSearchSources();
                saveSearchConfig(defaultSources, 'external', defaultSources[0]);
                const searchUrl = defaultSources[0].url.replace('{query}', encodeURIComponent(effectiveQuery));
                window.open(searchUrl, '_blank');
                return;
            }

            let source = selectedSearchSource?.enabled ? selectedSearchSource : null;
            if (!source) {
                const enabledSources = Array.isArray(externalSearchSources)
                    ? externalSearchSources.filter(s => s.enabled)
                    : [];
                if (enabledSources.length > 0) source = enabledSources[0];
            }

            if (source) {
                const searchUrl = source.url.replace('{query}', encodeURIComponent(effectiveQuery));
                window.open(searchUrl, '_blank');
            }
        }
    }, [searchQuery, searchMode, externalSearchSources, selectedSearchSource, saveSearchConfig]);

    // 恢复配置
    const restoreSearchConfig = useCallback((config: SearchConfig) => {
        const sources = Array.isArray(config.externalSources) ? config.externalSources : [];
        const resolvedSelected = resolveSelectedSource(sources, config.selectedSourceId, config.selectedSource ?? null);
        saveSearchConfig(sources, config.mode, resolvedSelected);
    }, [saveSearchConfig]);

    // 移动端搜索切换
    const toggleMobileSearch = useCallback(() => {
        setIsMobileSearchOpen(prev => !prev);
        if (searchMode !== 'external') handleSearchModeChange('external');
    }, [searchMode, handleSearchModeChange]);

    // 初始化加载（全类型安全）
    useEffect(() => {
        const savedSearchConfig = getData<SearchConfig>(SEARCH_CONFIG_KEY, null);
        if (savedSearchConfig) {
            const parsed = savedSearchConfig;
            if (parsed?.mode) {
                const sources = Array.isArray(parsed.externalSources) ? parsed.externalSources : [];
                const resolvedSelected = resolveSelectedSource(sources, parsed.selectedSourceId, parsed.selectedSource ?? null);
                setSearchMode(parsed.mode);
                setExternalSearchSources(sources);
                setSelectedSearchSource(resolvedSelected);
            }
        } else {
            const defaultSources = buildDefaultSearchSources();
            setSearchMode('external');
            setExternalSearchSources(defaultSources);
            setSelectedSearchSource(defaultSources[0] || null);
        }
    }, []);

    useEffect(() => {
        const syncableKeys = new Set([
            SEARCH_CONFIG_KEY,
            'search_config',
            getCanonicalUserStorageKey('search_config')
        ]);

        const reloadSearchConfig = (changedKeys: string[] = []) => {
            if (!changedKeys.some((changedKey) => syncableKeys.has(changedKey))) return;

            const savedSearchConfig = getData<SearchConfig>(SEARCH_CONFIG_KEY, null);
            if (!savedSearchConfig) {
                const defaultSources = buildDefaultSearchSources();
                setSearchMode('external');
                setExternalSearchSources(defaultSources);
                setSelectedSearchSource(defaultSources[0] || null);
                return;
            }

            const sources = Array.isArray(savedSearchConfig.externalSources) ? savedSearchConfig.externalSources : [];
            const resolvedSelected = resolveSelectedSource(
                sources,
                savedSearchConfig.selectedSourceId,
                savedSearchConfig.selectedSource ?? null
            );

            setSearchMode(savedSearchConfig.mode || 'external');
            setExternalSearchSources(sources);
            setSelectedSearchSource(resolvedSelected);
        };

        const handleStorageChange = (event: StorageEvent) => {
            if (event.key && syncableKeys.has(event.key)) {
                reloadSearchConfig([event.key]);
            }
        };

        const handleCustomEvent = (event: Event) => {
            const changedKeys = (event as CustomEvent<{ changedKeys?: string[] }>).detail?.changedKeys || [];
            reloadSearchConfig(changedKeys);
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener(YNAV_DATA_SYNCED_EVENT, handleCustomEvent as EventListener);
        window.addEventListener(YNAV_USER_STORAGE_UPDATED_EVENT, handleCustomEvent as EventListener);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener(YNAV_DATA_SYNCED_EVENT, handleCustomEvent as EventListener);
            window.removeEventListener(YNAV_USER_STORAGE_UPDATED_EVENT, handleCustomEvent as EventListener);
        };
    }, []);

    // 弹窗延迟隐藏
    useEffect(() => {
        if (isIconHovered || isPopupHovered) {
            if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
            setShowSearchSourcePopup(true);
        } else {
            if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = setTimeout(() => {
                setShowSearchSourcePopup(false);
                setHoveredSearchSource(null);
            }, 100);
        }
        return () => {
            if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        };
    }, [isIconHovered, isPopupHovered]);

    return {
        searchQuery,
        setSearchQuery,
        searchMode,
        externalSearchSources,
        selectedSearchSource,
        showSearchSourcePopup,
        setShowSearchSourcePopup,
        hoveredSearchSource,
        setHoveredSearchSource,
        isIconHovered,
        setIsIconHovered,
        isPopupHovered,
        setIsPopupHovered,
        isMobileSearchOpen,
        setIsMobileSearchOpen,
        handleSearchModeChange,
        handleSearchSourceSelect,
        handleExternalSearch,
        saveSearchConfig,
        restoreSearchConfig,
        toggleMobileSearch
    };
}
