import { useState, useEffect, useCallback, useRef } from 'react';
import { LinkItem, Category, DEFAULT_CATEGORIES, INITIAL_LINKS } from '../types';
import { arrayMove } from '@dnd-kit/sortable';
import { LOCAL_STORAGE_KEY, FAVICON_CACHE_KEY } from '../utils/constants';
import { useDialog } from '../components/ui/DialogProvider';

// 同步 API 基址
const SYNC_API_BASE = '/api/v1';

// 添加全局调试日志
console.log('[App] Initializing, localStorage keys:', Object.keys(localStorage));

export const useDataStore = () => {
    const [links, setLinks] = useState<LinkItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const { notify } = useDialog();
    const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isInitializedRef = useRef(false);

    // 数据监控：确保数据永远不会为空
    useEffect(() => {
        if (!isLoaded || isSyncing) {
            console.log('[DataStore] Not ready yet, skipping check');
            return;
        }
        
        console.log('[DataStore] Data check - links:', links?.length, 'categories:', categories?.length);
        
        // 如果链接为空且不在同步中，恢复默认数据
        if ((!links || links.length === 0) && !isSyncing) {
            console.warn('[DataStore] Links empty, restoring defaults');
            setLinks(INITIAL_LINKS);
            setCategories(DEFAULT_CATEGORIES);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ 
                links: INITIAL_LINKS, 
                categories: DEFAULT_CATEGORIES 
            }));
        }
        
        // 如果分类为空且不在同步中，恢复默认分类
        if ((!categories || categories.length === 0) && !isSyncing) {
            console.warn('[DataStore] Categories empty, restoring defaults');
            setCategories(DEFAULT_CATEGORIES);
        }
    }, [links, categories, isLoaded, isSyncing]);

    // 加载本地图标缓存
    const loadLinkIcons = useCallback((linksToLoad: LinkItem[]) => {
        let cache: Record<string, string> = {};
        try {
            const stored = localStorage.getItem(FAVICON_CACHE_KEY);
            cache = stored ? JSON.parse(stored) : {};
        } catch (e) {
            cache = {};
        }

        if (!cache || Object.keys(cache).length === 0) return;

        const updatedLinks = linksToLoad.map(link => {
            if (!link.url) return link;
            try {
                let domain = link.url;
                if (!link.url.startsWith('http://') && !link.url.startsWith('https://')) {
                    domain = 'https://' + link.url;
                }
                const urlObj = new URL(domain);
                const cachedIcon = cache[urlObj.hostname];
                if (!cachedIcon) return link;
                if (!link.icon || link.icon.includes('faviconextractor.com') || !cachedIcon.includes('faviconextractor.com')) {
                    return { ...link, icon: cachedIcon };
                }
            } catch (e) {
                return link;
            }
            return link;
        });

        setLinks(updatedLinks);
    }, []);

    // ===== 云端同步功能 =====
    
    // 推送数据到云端
    const pushToCloud = useCallback(async (linksToPush: LinkItem[], categoriesToPush: Category[]) => {
        try {
            console.log('[DataStore] Pushing to cloud:', linksToPush.length, 'links,', categoriesToPush.length, 'categories');
            
            const response = await fetch(`${SYNC_API_BASE}/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    links: linksToPush,
                    categories: categoriesToPush
                })
            });
            
            const result = await response.json();
            console.log('[DataStore] Push result:', result);
            
            return result.success;
        } catch (e) {
            console.error('[DataStore] Failed to push to cloud:', e);
            return false;
        }
    }, []);

    // 从云端拉取 - 以云端为唯一真相源
    const pullFromCloud = useCallback(async () => {
        try {
            setIsSyncing(true);
            console.log('[DataStore] Pulling from cloud...');
            
            const response = await fetch(`${SYNC_API_BASE}/sync`);
            const result = await response.json();
            
            if (result.success && result.data) {
                const cloudData = result.data;
                const cloudLinks = cloudData.links || [];
                const cloudCategories = cloudData.categories || [];
                
                console.log('[DataStore] Cloud data:', cloudLinks.length, 'links,', cloudCategories.length, 'categories');
                
                return { links: cloudLinks, categories: cloudCategories };
            }
            return { links: [], categories: [] };
        } catch (e) {
            console.error('[DataStore] Failed to pull from cloud:', e);
            return { links: [], categories: [] };
        } finally {
            setIsSyncing(false);
        }
    }, []);

    // 延迟同步（防抖）
    const debouncedSync = useCallback((newLinks: LinkItem[], newCategories: Category[]) => {
        if (syncTimeoutRef.current) {
            clearTimeout(syncTimeoutRef.current);
        }
        
        syncTimeoutRef.current = setTimeout(() => {
            pushToCloud(newLinks, newCategories);
        }, 2000); // 2秒后同步
    }, [pushToCloud]);

    // 初始化加载 - 以云端为真相源
    useEffect(() => {
        const init = async () => {
            console.log('[DataStore] Initializing...');
            
            // 1. 先加载本地数据（快速显示）
            const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
            let localLinks: LinkItem[] = [];
            let localCategories: Category[] = [];
            
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed.links) && parsed.links.length > 0) {
                        localLinks = parsed.links;
                        localCategories = parsed.categories || DEFAULT_CATEGORIES;
                        setLinks(localLinks);
                        setCategories(localCategories);
                        loadLinkIcons(localLinks);
                        console.log('[DataStore] Loaded from local:', localLinks.length, 'links');
                    }
                } catch (e) {
                    console.error('[DataStore] Failed to parse local data:', e);
                }
            }
            
            // 如果没有本地数据，使用默认值
            if (localLinks.length === 0) {
                setLinks(INITIAL_LINKS);
                setCategories(DEFAULT_CATEGORIES);
                localLinks = INITIAL_LINKS;
                localCategories = DEFAULT_CATEGORIES;
                console.log('[DataStore] Using default data');
            }
            
            setIsLoaded(true);
            
            // 2. 从云端拉取最新数据
            const cloudData = await pullFromCloud();
            
            if (cloudData.links.length > 0 || cloudData.categories.length > 0) {
                // 合并云端数据和本地数据（以本地为优先，云端补充）
                const localLinkIds = new Set(localLinks.map(l => l.id));
                const cloudOnlyLinks = cloudData.links.filter(l => !localLinkIds.has(l.id));
                const mergedLinks = [...localLinks, ...cloudOnlyLinks];
                
                const localCatIds = new Set(localCategories.map(c => c.id));
                const cloudOnlyCats = cloudData.categories.filter(c => !localCatIds.has(c.id));
                const mergedCategories = [...localCategories, ...cloudOnlyCats];
                
                setLinks(mergedLinks);
                setCategories(mergedCategories);
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ 
                    links: mergedLinks, 
                    categories: mergedCategories 
                }));
                console.log('[DataStore] Merged with cloud data - local:', localLinks.length, '+ cloud:', cloudOnlyLinks.length, '= total:', mergedLinks.length);
            } else {
                // 云端无数据，上传本地数据
                const success = await pushToCloud(localLinks, localCategories);
                if (success) {
                    console.log('[DataStore] Local data uploaded to cloud');
                }
            }
            
            isInitializedRef.current = true;
        };
        
        init();
    }, [pullFromCloud, pushToCloud, loadLinkIcons]);

    // 修改后的 updateData - 同时更新本地和云端
    const updateData = useCallback((newLinks: LinkItem[], newCategories: Category[]) => {
        // 1. Optimistic UI Update
        setLinks(newLinks);
        setCategories(newCategories);

        // 2. Save to Local Cache
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ links: newLinks, categories: newCategories }));
        
        // 3. Sync to Cloud (debounced) - 只在初始化完成后同步
        if (isInitializedRef.current) {
            debouncedSync(newLinks, newCategories);
        }
    }, [debouncedSync]);

    const addLink = useCallback((data: Omit<LinkItem, 'id' | 'createdAt'>) => {
        let processedUrl = data.url;
        if (processedUrl && !processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
            processedUrl = 'https://' + processedUrl;
        }

        const categoryLinks = links.filter(link =>
            !link.pinned && (data.categoryId === 'all' || link.categoryId === data.categoryId)
        );

        const maxOrder = categoryLinks.length > 0
            ? Math.max(...categoryLinks.map(link => link.order || 0))
            : -1;

        const newLink: LinkItem = {
            ...data,
            url: processedUrl,
            id: Date.now().toString(),
            createdAt: Date.now(),
            order: maxOrder + 1,
            pinnedOrder: data.pinned ? links.filter(l => l.pinned).length : undefined
        };

        if (newLink.pinned) {
            const firstNonPinnedIndex = links.findIndex(link => !link.pinned);
            if (firstNonPinnedIndex === -1) {
                updateData([...links, newLink], categories);
            } else {
                const updatedLinks = [...links];
                updatedLinks.splice(firstNonPinnedIndex, 0, newLink);
                updateData(updatedLinks, categories);
            }
        } else {
            const updatedLinks = [...links, newLink].sort((a, b) => {
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;
                const aOrder = a.order !== undefined ? a.order : a.createdAt;
                const bOrder = b.order !== undefined ? b.order : b.createdAt;
                return aOrder - bOrder;
            });
            updateData(updatedLinks, categories);
        }
    }, [links, categories, updateData, notify]);

    const updateLink = useCallback((data: Omit<LinkItem, 'createdAt'>) => {
        let processedUrl = data.url;
        if (processedUrl && !processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
            processedUrl = 'https://' + processedUrl;
        }
        const updated = links.map(l => l.id === data.id ? { ...l, ...data, url: processedUrl } : l);
        updateData(updated, categories);
    }, [links, categories, updateData]);

    const deleteLink = useCallback((id: string) => {
        updateData(links.filter(l => l.id !== id), categories);
    }, [links, categories, updateData]);

    const togglePin = useCallback((id: string) => {
        const linkToToggle = links.find(l => l.id === id);
        if (!linkToToggle) return;

        const updated = links.map(l => {
            if (l.id === id) {
                const isPinned = !l.pinned;
                return {
                    ...l,
                    pinned: isPinned,
                    pinnedOrder: isPinned ? links.filter(link => link.pinned).length : undefined
                };
            }
            return l;
        });
        updateData(updated, categories);
    }, [links, categories, updateData]);

    const reorderLinks = useCallback((activeId: string, overId: string, selectedCategory: string) => {
        if (activeId === overId) return;

        const getOrderValue = (link: LinkItem) => (
            link.order !== undefined ? link.order : link.createdAt
        );

        const categoryLinks = links
            .filter(link => selectedCategory === 'all' || link.categoryId === selectedCategory)
            .slice()
            .sort((a, b) => getOrderValue(a) - getOrderValue(b));

        const activeIndex = categoryLinks.findIndex(link => link.id === activeId);
        const overIndex = categoryLinks.findIndex(link => link.id === overId);

        if (activeIndex !== -1 && overIndex !== -1) {
            const reorderedCategoryLinks = arrayMove(categoryLinks, activeIndex, overIndex) as LinkItem[];
            const updatedLinks = links.map(link => {
                const reorderedIndex = reorderedCategoryLinks.findIndex(l => l.id === link.id);
                if (reorderedIndex !== -1) {
                    return { ...link, order: reorderedIndex };
                }
                return link;
            });
            updatedLinks.sort((a, b) => getOrderValue(a) - getOrderValue(b));
            updateData(updatedLinks, categories);
        }
    }, [links, categories, updateData]);

    const reorderPinnedLinks = useCallback((activeId: string, overId: string) => {
        if (activeId === overId) return;

        const pinnedLinksList = links
            .filter(link => link.pinned)
            .slice()
            .sort((a, b) => {
                if (a.pinnedOrder !== undefined && b.pinnedOrder !== undefined) {
                    return a.pinnedOrder - b.pinnedOrder;
                }
                if (a.pinnedOrder !== undefined) return -1;
                if (b.pinnedOrder !== undefined) return 1;
                return a.createdAt - b.createdAt;
            });
        const activeIndex = pinnedLinksList.findIndex(link => link.id === activeId);
        const overIndex = pinnedLinksList.findIndex(link => link.id === overId);

        if (activeIndex !== -1 && overIndex !== -1) {
            const reorderedPinnedLinks = arrayMove(pinnedLinksList, activeIndex, overIndex) as LinkItem[];
            const pinnedOrderMap = new Map<string, number>();
            reorderedPinnedLinks.forEach((link, index) => {
                pinnedOrderMap.set(link.id, index);
            });

            const updatedLinks = links.map(link => {
                if (link.pinned) {
                    return { ...link, pinnedOrder: pinnedOrderMap.get(link.id) };
                }
                return link;
            });

            updatedLinks.sort((a, b) => {
                if (a.pinned && b.pinned) {
                    return (a.pinnedOrder || 0) - (b.pinnedOrder || 0);
                }
                if (a.pinned) return -1;
                if (b.pinned) return 1;
                const aOrder = a.order !== undefined ? a.order : a.createdAt;
                const bOrder = b.order !== undefined ? b.order : b.createdAt;
                return bOrder - aOrder;
            });
            updateData(updatedLinks, categories);
        }
    }, [links, categories, updateData]);

    const deleteCategory = useCallback((catId: string) => {
        if (categories.length <= 1) {
            notify('至少保留一个分类', 'warning');
            return;
        }
        const newCats = categories.filter(c => c.id !== catId);
        if (newCats.length === categories.length) return;
        const fallbackCategory = newCats.find(c => c.id === 'common') || newCats[0];
        const newLinks = links.map(l => l.categoryId === catId ? { ...l, categoryId: fallbackCategory.id } : l);
        updateData(newLinks, newCats);
    }, [links, categories, updateData]);

    const deleteCategories = useCallback((catIds: string[]) => {
        const toDelete = new Set(catIds);
        if (toDelete.size === 0) return;

        const newCats = categories.filter(c => !toDelete.has(c.id));
        if (newCats.length <= 0) {
            notify('至少保留一个分类', 'warning');
            return;
        }

        const fallbackCategory = newCats.find(c => c.id === 'common') || newCats[0];
        const newLinks = links.map(l => toDelete.has(l.categoryId) ? { ...l, categoryId: fallbackCategory.id } : l);
        updateData(newLinks, newCats);
    }, [links, categories, updateData, notify]);

    // 清理定时器
    useEffect(() => {
        return () => {
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current);
            }
        };
    }, []);

    const importData = useCallback((newLinks: LinkItem[], newCategories: Category[]) => {
        const mergedCategories = [...categories];
        (newCategories || []).forEach(nc => {
            if (!mergedCategories.some(c => c.id === nc.id || c.name === nc.name)) {
                mergedCategories.push(nc);
            }
        });
        const mergedLinks = [...links, ...newLinks];
        updateData(mergedLinks, mergedCategories);
    }, [links, categories, updateData]);

    return {
        links,
        categories,
        setLinks,
        setCategories,
        updateData,
        isLoaded,
        addLink,
        updateLink,
        deleteLink,
        togglePin,
        reorderLinks,
        reorderPinnedLinks,
        deleteCategory,
        deleteCategories,
        importData
    };
};
