import { useState, useEffect, useCallback, useRef } from 'react';
import { LinkItem, Category, DEFAULT_CATEGORIES, INITIAL_LINKS } from '../types';
import { arrayMove } from '@dnd-kit/sortable';
import { 
  LOCAL_STORAGE_KEY, 
  FAVICON_CACHE_KEY,
  initDefaultUser,
  getUserStorageKey,
  getCurrentUserId,
  getUserData,
  setUserData,
  CURRENT_USER_KEY
} from '../utils/constants';
import { useDialog } from '../components/ui/DialogProvider';

/**
 * 简化的数据存储 Hook - 专注于本地存储和多端一致性
 * 移除复杂的云端同步逻辑，使用 localStorage + 用户隔离
 */
export function useSimpleDataStore() {
  // === 状态管理 ===
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const { notify } = useDialog();

  // === 工具函数 ===
  const getStorageKey = useCallback(() => {
    return getUserStorageKey('links_data');
  }, []);

  // === 数据迁移 ===
  const migrateLegacyData = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    // 初始化默认用户
    const userId = initDefaultUser();
    setCurrentUserId(userId);
    
    // 检查是否有旧数据需要迁移
    const oldData = localStorage.getItem(LOCAL_STORAGE_KEY);
    const userDataKey = getStorageKey();
    const hasUserData = localStorage.getItem(userDataKey);
    
    if (oldData && !hasUserData) {
      console.log('[SimpleDataStore] Migrating legacy data to user:', userId);
      try {
        const parsed = JSON.parse(oldData);
        localStorage.setItem(userDataKey, oldData);
        console.log('[SimpleDataStore] Migration completed');
      } catch (e) {
        console.error('[SimpleDataStore] Migration failed:', e);
      }
    }
  }, [getStorageKey]);

  // === 数据加载 ===
  const loadData = useCallback(() => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        console.warn('[SimpleDataStore] No user found, initializing...');
        migrateLegacyData();
        return;
      }

      const storageKey = getStorageKey();
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        const data = JSON.parse(stored);
        const loadedLinks = data.links || [];
        const loadedCategories = data.categories || DEFAULT_CATEGORIES;
        
        setLinks(loadedLinks);
        setCategories(loadedCategories);
        console.log('[SimpleDataStore] Data loaded:', loadedLinks.length, 'links,', loadedCategories.length, 'categories');
      } else {
        // 使用默认数据
        setLinks(INITIAL_LINKS);
        setCategories(DEFAULT_CATEGORIES);
        console.log('[SimpleDataStore] Using default data');
      }
      
      setIsLoaded(true);
    } catch (e) {
      console.error('[SimpleDataStore] Failed to load data:', e);
      // 出错时使用默认数据
      setLinks(INITIAL_LINKS);
      setCategories(DEFAULT_CATEGORIES);
      setIsLoaded(true);
    }
  }, [getStorageKey, migrateLegacyData]);

  // === 数据保存 ===
  const saveData = useCallback((newLinks: LinkItem[], newCategories: Category[]) => {
    try {
      const storageKey = getStorageKey();
      const data = {
        links: newLinks,
        categories: newCategories,
        updatedAt: Date.now(),
        version: '1.0.0'
      };
      
      localStorage.setItem(storageKey, JSON.stringify(data));
      console.log('[SimpleDataStore] Data saved:', newLinks.length, 'links,', newCategories.length, 'categories');
    } catch (e) {
      console.error('[SimpleDataStore] Failed to save data:', e);
      notify('数据保存失败', 'error');
    }
  }, [getStorageKey, notify]);

  // === CRUD 操作 ===
  const updateData = useCallback((newLinks: LinkItem[], newCategories: Category[]) => {
    setLinks(newLinks);
    setCategories(newCategories);
    saveData(newLinks, newCategories);
  }, [saveData]);

  const addLink = useCallback((link: Omit<LinkItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newLink: LinkItem = {
      ...link,
      id: `link-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const newLinks = [...links, newLink];
    updateData(newLinks, categories);
    return newLink;
  }, [links, categories, updateData]);

  const updateLink = useCallback((id: string, updates: Partial<LinkItem>) => {
    const newLinks = links.map(link => 
      link.id === id 
        ? { ...link, ...updates, updatedAt: Date.now() }
        : link
    );
    updateData(newLinks, categories);
  }, [links, categories, updateData]);

  const deleteLink = useCallback((id: string) => {
    const newLinks = links.filter(link => link.id !== id);
    updateData(newLinks, categories);
  }, [links, categories, updateData]);

  const togglePin = useCallback((id: string) => {
    const newLinks = links.map(link => 
      link.id === id 
        ? { ...link, pinned: !link.pinned, updatedAt: Date.now() }
        : link
    );
    updateData(newLinks, categories);
  }, [links, categories, updateData]);

  const reorderLinks = useCallback((activeId: string, overId: string) => {
    const oldIndex = links.findIndex(link => link.id === activeId);
    const newIndex = links.findIndex(link => link.id === overId);
    
    if (oldIndex === -1 || newIndex === -1) return;
    
    const newLinks = arrayMove(links, oldIndex, newIndex);
    updateData(newLinks, categories);
  }, [links, categories, updateData]);

  const reorderPinnedLinks = useCallback((activeId: string, overId: string) => {
    const pinnedLinks = links.filter(link => link.pinned);
    const unpinnedLinks = links.filter(link => !link.pinned);
    
    const oldIndex = pinnedLinks.findIndex(link => link.id === activeId);
    const newIndex = pinnedLinks.findIndex(link => link.id === overId);
    
    if (oldIndex === -1 || newIndex === -1) return;
    
    const reorderedPinned = arrayMove(pinnedLinks, oldIndex, newIndex);
    const newLinks = [...reorderedPinned, ...unpinnedLinks];
    updateData(newLinks, categories);
  }, [links, categories, updateData]);

  const deleteCategory = useCallback((id: string) => {
    const newCategories = categories.filter(cat => cat.id !== id);
    const newLinks = links.map(link => 
      link.categoryId === id ? { ...link, categoryId: null } : link
    );
    updateData(newLinks, newCategories);
  }, [links, categories, updateData]);

  const deleteCategories = useCallback((ids: string[]) => {
    const newCategories = categories.filter(cat => !ids.includes(cat.id));
    const newLinks = links.map(link => 
      link.categoryId && ids.includes(link.categoryId) 
        ? { ...link, categoryId: null } 
        : link
    );
    updateData(newLinks, newCategories);
  }, [links, categories, updateData]);

  const importData = useCallback((importedLinks: LinkItem[], importedCategories: Category[]) => {
    // 合并数据，避免重复
    const existingLinkIds = new Set(links.map(link => link.id));
    const existingCategoryIds = new Set(categories.map(cat => cat.id));
    
    const newLinks = [
      ...links,
      ...importedLinks.filter(link => !existingLinkIds.has(link.id))
    ];
    
    const newCategories = [
      ...categories,
      ...importedCategories.filter(cat => !existingCategoryIds.has(cat.id))
    ];
    
    updateData(newLinks, newCategories);
    notify(`成功导入 ${importedLinks.length} 个链接和 ${importedCategories.length} 个分类`, 'success');
  }, [links, categories, updateData, notify]);

  // === 初始化 ===
  useEffect(() => {
    migrateLegacyData();
  }, [migrateLegacyData]);

  useEffect(() => {
    if (!isLoaded) {
      loadData();
    }
  }, [loadData, isLoaded]);

  // === 多端一致性：Storage Event 监听 ===
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === getStorageKey() && e.newValue) {
        console.log('[SimpleDataStore] Storage changed, reloading data...');
        loadData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [getStorageKey, loadData]);

  return {
    // 数据
    links,
    categories,
    isLoaded,
    currentUserId,
    
    // CRUD 操作
    updateData,
    addLink,
    updateLink,
    deleteLink,
    togglePin,
    reorderLinks,
    reorderPinnedLinks,
    deleteCategory,
    deleteCategories,
    importData,
    
    // 工具方法
    saveData,
    loadData,
  };
}
