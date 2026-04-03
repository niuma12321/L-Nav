import { useState, useEffect, useCallback } from 'react';
import { LinkItem, Category, DEFAULT_CATEGORIES, INITIAL_LINKS } from '../types';
import { arrayMove } from '@dnd-kit/sortable';
import { LOCAL_STORAGE_KEY, FAVICON_CACHE_KEY } from '../utils/constants';
import { useDialog } from '../components/ui/DialogProvider';

// 添加全局调试日志
console.log('[App] Initializing, localStorage keys:', Object.keys(localStorage));

export const useDataStore = () => {
    const [links, setLinks] = useState<LinkItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const { notify } = useDialog();

    // 数据监控：确保数据永远不会为空
    useEffect(() => {
        if (!isLoaded) {
            console.log('[DataStore] Not loaded yet, skipping check');
            return;
        }
        
        console.log('[DataStore] Data check - links:', links?.length, 'categories:', categories?.length);
        console.log('[DataStore] localStorage data:', localStorage.getItem(LOCAL_STORAGE_KEY)?.substring(0, 200));
        
        // 如果链接为空，恢复默认数据
        if (!links || links.length === 0) {
            console.warn('[DataStore] Links empty, restoring defaults');
            setLinks(INITIAL_LINKS);
            setCategories(DEFAULT_CATEGORIES);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ 
                links: INITIAL_LINKS, 
                categories: DEFAULT_CATEGORIES 
            }));
        }
        
        // 如果分类为空，恢复默认分类
        if (!categories || categories.length === 0) {
            console.warn('[DataStore] Categories empty, restoring defaults');
            setCategories(DEFAULT_CATEGORIES);
        }
    }, [links, categories, isLoaded]);

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

    useEffect(() => {
        // 强制数据重置机制：每次加载都检查并确保数据有效
        console.log('[DataStore] Checking data...');
        
        // 先尝试读取现有数据
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        let hasValidData = false;
        
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                // 严格检查：必须是非空数组
                hasValidData = Array.isArray(parsed.links) && parsed.links.length > 0 &&
                               Array.isArray(parsed.categories) && parsed.categories.length > 0;
                console.log('[DataStore] Parsed data - links:', parsed.links?.length, 'categories:', parsed.categories?.length, 'valid:', hasValidData);
            } catch (e) {
                console.error('[DataStore] Failed to parse stored data:', e);
            }
        }
        
        // 如果没有有效数据，强制重置
        if (!hasValidData) {
            console.log('[DataStore] No valid data found, forcing reset to defaults');
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ 
                links: INITIAL_LINKS, 
                categories: DEFAULT_CATEGORIES 
            }));
            setLinks(INITIAL_LINKS);
            setCategories(DEFAULT_CATEGORIES);
            setIsLoaded(true);
            return;
        }
        
        // 有有效数据，正常加载
        try {
            const parsed = JSON.parse(stored!);
            let loadedCategories = parsed.categories;
            let loadedLinks = parsed.links;
            
            // 确保"常用推荐"分类存在且是第一个
            const commonIndex = loadedCategories.findIndex((c: Category) => c.id === 'common');
            if (commonIndex > 0) {
                const commonCategory = loadedCategories[commonIndex];
                loadedCategories = [
                    commonCategory,
                    ...loadedCategories.slice(0, commonIndex),
                    ...loadedCategories.slice(commonIndex + 1)
                ];
            }
            
            // 确保所有链接的 categoryId 有效
            const validCategoryIds = new Set(loadedCategories.map((c: Category) => c.id));
            const fallbackCategoryId = loadedCategories.find((c: Category) => c.id === 'common')?.id
                || loadedCategories[0]?.id;
            
            if (fallbackCategoryId) {
                loadedLinks = loadedLinks.map((link: LinkItem) => {
                    if (!validCategoryIds.has(link.categoryId)) {
                        return { ...link, categoryId: fallbackCategoryId };
                    }
                    return link;
                });
            }
            
            console.log('[DataStore] Loaded data - links:', loadedLinks?.length, 'categories:', loadedCategories?.length);
            setLinks(loadedLinks);
            setCategories(loadedCategories);
            loadLinkIcons(loadedLinks);
        } catch (e) {
            console.error('[DataStore] Error loading data, using defaults:', e);
            setLinks(INITIAL_LINKS);
            setCategories(DEFAULT_CATEGORIES);
        }
        
        setIsLoaded(true);
    }, []);

    const updateData = useCallback((newLinks: LinkItem[], newCategories: Category[]) => {
        // 1. Optimistic UI Update
        setLinks(newLinks);
        setCategories(newCategories);

        // 2. Save to Local Cache
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ links: newLinks, categories: newCategories }));
    }, []);

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

    const importData = useCallback((newLinks: LinkItem[], newCategories: Category[]) => {
        const mergedCategories = [...categories];
        newCategories.forEach(nc => {
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
