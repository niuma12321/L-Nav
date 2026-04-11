import { useState, useEffect, useCallback, useRef } from 'react';
import { LinkItem, Category, DEFAULT_CATEGORIES, INITIAL_LINKS } from '../types';
import { arrayMove } from '@dnd-kit/sortable';
import {
  LOCAL_STORAGE_KEY,
  initDefaultUser,
  getCurrentUserId,
  getCanonicalUserStorageKey,
  readSyncableUserData,
  writeSyncableUserData,
  YNAV_DATA_SYNCED_EVENT,
  YNAV_USER_STORAGE_UPDATED_EVENT
} from '../utils/constants';
import { useDialog } from '../components/ui/DialogProvider';

interface StoredLinksData {
  links: LinkItem[];
  categories: Category[];
  updatedAt: number;
  version: string;
  userId: string;
}

const LINKS_DATA_TYPE = 'links_data';
const STORAGE_VERSION = '2.0.0';

const sortLinksByOrder = (items: LinkItem[]) => {
  return items.slice().sort((a, b) => {
    const aOrder = a.order ?? a.createdAt;
    const bOrder = b.order ?? b.createdAt;
    return aOrder - bOrder;
  });
};

const normalizeLinks = (items: LinkItem[]) => {
  return sortLinksByOrder(items).map((link, index) => ({
    ...link,
    updatedAt: link.updatedAt ?? link.createdAt,
    order: link.order ?? index,
    pinnedOrder: link.pinned ? (link.pinnedOrder ?? index) : undefined
  }));
};

const normalizeCategories = (items: Category[]) => {
  if (!Array.isArray(items) || items.length === 0) {
    return DEFAULT_CATEGORIES;
  }

  return items.map((category) => ({
    ...category,
    icon: category.icon || 'Folder'
  }));
};

const buildStoredData = (links: LinkItem[], categories: Category[], userId: string): StoredLinksData => ({
  links: normalizeLinks(links),
  categories: normalizeCategories(categories),
  updatedAt: Date.now(),
  version: STORAGE_VERSION,
  userId
});

/**
 * 简化的数据存储 Hook
 * 基于用户维度本地存储，并与统一同步引擎共享同一份数据。
 */
export function useSimpleDataStore() {
  const { notify } = useDialog();
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const linksRef = useRef<LinkItem[]>([]);
  const categoriesRef = useRef<Category[]>([]);

  const loadData = useCallback(() => {
    try {
      const userId = getCurrentUserId() || initDefaultUser();
      setCurrentUserId(userId);

      const stored = readSyncableUserData<StoredLinksData | null>(LINKS_DATA_TYPE, null);

      if (stored?.links || stored?.categories) {
        const nextLinks = normalizeLinks(stored.links || []);
        const nextCategories = normalizeCategories(stored.categories || []);
        linksRef.current = nextLinks;
        categoriesRef.current = nextCategories;
        setLinks(nextLinks);
        setCategories(nextCategories);
      } else {
        const nextLinks = normalizeLinks(INITIAL_LINKS);
        const nextCategories = normalizeCategories(DEFAULT_CATEGORIES);
        const initialData = buildStoredData(nextLinks, nextCategories, userId);
        linksRef.current = initialData.links;
        categoriesRef.current = initialData.categories;
        setLinks(initialData.links);
        setCategories(initialData.categories);
        writeSyncableUserData(LINKS_DATA_TYPE, initialData);
      }

      setIsLoaded(true);
    } catch {
      const fallbackLinks = normalizeLinks(INITIAL_LINKS);
      const fallbackCategories = normalizeCategories(DEFAULT_CATEGORIES);
      linksRef.current = fallbackLinks;
      categoriesRef.current = fallbackCategories;
      setLinks(fallbackLinks);
      setCategories(fallbackCategories);
      setIsLoaded(true);
    }
  }, []);

  const saveData = useCallback((nextLinks: LinkItem[], nextCategories: Category[]) => {
    try {
      const userId = getCurrentUserId() || initDefaultUser();
      const payload = buildStoredData(nextLinks, nextCategories, userId);
      linksRef.current = payload.links;
      categoriesRef.current = payload.categories;
      setLinks(payload.links);
      setCategories(payload.categories);
      writeSyncableUserData(LINKS_DATA_TYPE, payload);
    } catch {
      notify('数据保存失败', 'error');
    }
  }, [notify]);

  const updateData = useCallback((nextLinks: LinkItem[], nextCategories: Category[]) => {
    saveData(nextLinks, nextCategories);
  }, [saveData]);

  const addLink = useCallback((link: Omit<LinkItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = Date.now();
    const existingLinks = linksRef.current;
    const maxOrder = existingLinks.reduce((max, item) => Math.max(max, item.order ?? item.createdAt), -1);
    const nextPinnedOrder = existingLinks
      .filter((item) => item.pinned)
      .reduce((max, item) => Math.max(max, item.pinnedOrder ?? 0), -1);

    const newLink: LinkItem = {
      ...link,
      id: `link-${now}-${Math.random().toString(36).slice(2, 10)}`,
      createdAt: now,
      updatedAt: now,
      order: maxOrder + 1,
      pinnedOrder: link.pinned ? nextPinnedOrder + 1 : undefined
    };

    saveData([...existingLinks, newLink], categoriesRef.current);
    return newLink;
  }, [saveData]);

  const updateLink = useCallback((idOrLink: string | (Partial<LinkItem> & { id: string }), updates?: Partial<LinkItem>) => {
    const id = typeof idOrLink === 'string' ? idOrLink : idOrLink.id;
    const nextUpdates = typeof idOrLink === 'string' ? (updates || {}) : idOrLink;

    const nextLinks = linksRef.current.map((link) => {
      if (link.id !== id) return link;

      const mergedLink = {
        ...link,
        ...nextUpdates,
        updatedAt: Date.now()
      };

      if (!mergedLink.pinned) {
        mergedLink.pinnedOrder = undefined;
      } else if (mergedLink.pinnedOrder === undefined) {
        const maxPinnedOrder = linksRef.current
          .filter((item) => item.id !== id && item.pinned)
          .reduce((max, item) => Math.max(max, item.pinnedOrder ?? 0), -1);
        mergedLink.pinnedOrder = maxPinnedOrder + 1;
      }

      return mergedLink;
    });

    saveData(nextLinks, categoriesRef.current);
  }, [saveData]);

  const deleteLink = useCallback((id: string) => {
    saveData(linksRef.current.filter((link) => link.id !== id), categoriesRef.current);
  }, [saveData]);

  const togglePin = useCallback((id: string) => {
    const maxPinnedOrder = linksRef.current
      .filter((link) => link.id !== id && link.pinned)
      .reduce((max, link) => Math.max(max, link.pinnedOrder ?? 0), -1);

    const nextLinks = linksRef.current.map((link) => (
      link.id === id
        ? {
            ...link,
            pinned: !link.pinned,
            pinnedOrder: link.pinned ? undefined : maxPinnedOrder + 1,
            updatedAt: Date.now()
          }
        : link
    ));

    saveData(nextLinks, categoriesRef.current);
  }, [saveData]);

  const reorderLinks = useCallback((activeId: string, overId: string, categoryId: string = 'all') => {
    const currentLinks = linksRef.current;
    const targetLinks = sortLinksByOrder(currentLinks.filter((link) => {
      if (categoryId === 'all') return !link.pinned;
      return link.categoryId === categoryId;
    }));

    const oldIndex = targetLinks.findIndex((link) => link.id === activeId);
    const newIndex = targetLinks.findIndex((link) => link.id === overId);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedTargetLinks = arrayMove(targetLinks, oldIndex, newIndex).map((link, index) => ({
      ...link,
      order: index,
      updatedAt: Date.now()
    }));

    const reorderedMap = new Map(reorderedTargetLinks.map((link) => [link.id, link]));
    const nextLinks = currentLinks.map((link) => reorderedMap.get(link.id) || link);
    saveData(nextLinks, categoriesRef.current);
  }, [saveData]);

  const reorderPinnedLinks = useCallback((activeId: string, overId: string) => {
    const pinnedLinks = sortLinksByOrder(linksRef.current.filter((link) => link.pinned));
    const oldIndex = pinnedLinks.findIndex((link) => link.id === activeId);
    const newIndex = pinnedLinks.findIndex((link) => link.id === overId);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedPinnedLinks = arrayMove(pinnedLinks, oldIndex, newIndex).map((link, index) => ({
      ...link,
      pinnedOrder: index,
      updatedAt: Date.now()
    }));

    const reorderedMap = new Map(reorderedPinnedLinks.map((link) => [link.id, link]));
    const nextLinks = linksRef.current.map((link) => reorderedMap.get(link.id) || link);
    saveData(nextLinks, categoriesRef.current);
  }, [saveData]);

  const deleteCategory = useCallback((id: string) => {
    const nextCategories = categoriesRef.current.filter((category) => category.id !== id);
    const nextLinks = linksRef.current.map((link) => (
      link.categoryId === id
        ? { ...link, categoryId: 'uncategorized', updatedAt: Date.now() }
        : link
    ));
    saveData(nextLinks, nextCategories);
  }, [saveData]);

  const deleteCategories = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    const nextCategories = categoriesRef.current.filter((category) => !idSet.has(category.id));
    const nextLinks = linksRef.current.map((link) => (
      link.categoryId && idSet.has(link.categoryId)
        ? { ...link, categoryId: 'uncategorized', updatedAt: Date.now() }
        : link
    ));
    saveData(nextLinks, nextCategories);
  }, [saveData]);

  const importData = useCallback((importedLinks: LinkItem[], importedCategories: Category[]) => {
    const existingLinkIds = new Set(linksRef.current.map((link) => link.id));
    const existingCategoryIds = new Set(categoriesRef.current.map((category) => category.id));

    const mergedLinks = [
      ...linksRef.current,
      ...importedLinks.filter((link) => !existingLinkIds.has(link.id))
    ];

    const mergedCategories = [
      ...categoriesRef.current,
      ...importedCategories.filter((category) => !existingCategoryIds.has(category.id))
    ];

    saveData(mergedLinks, mergedCategories);
    notify(`成功导入 ${importedLinks.length} 个链接和 ${importedCategories.length} 个分类`, 'success');
  }, [notify, saveData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const syncableKeys = new Set([
      LINKS_DATA_TYPE,
      LOCAL_STORAGE_KEY,
      getCanonicalUserStorageKey(LINKS_DATA_TYPE)
    ]);

    const shouldReload = (changedKeys: string[] = []) => {
      return changedKeys.some((changedKey) => syncableKeys.has(changedKey));
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key && syncableKeys.has(event.key)) {
        loadData();
      }
    };

    const handleUserDataChange = (event: Event) => {
      const changedKeys = (event as CustomEvent<{ changedKeys?: string[] }>).detail?.changedKeys || [];
      if (shouldReload(changedKeys)) {
        loadData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(YNAV_DATA_SYNCED_EVENT, handleUserDataChange as EventListener);
    window.addEventListener(YNAV_USER_STORAGE_UPDATED_EVENT, handleUserDataChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(YNAV_DATA_SYNCED_EVENT, handleUserDataChange as EventListener);
      window.removeEventListener(YNAV_USER_STORAGE_UPDATED_EVENT, handleUserDataChange as EventListener);
    };
  }, [loadData]);

  return {
    links,
    categories,
    isLoaded,
    currentUserId,
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
    saveData,
    loadData
  };
}
