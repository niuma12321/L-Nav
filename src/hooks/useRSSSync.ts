import { useState, useEffect, useCallback, useRef } from 'react';

const SYNC_API_BASE = '/api/v1';
const RSS_SOURCES_KEY = 'ynav_rss_sources';
const RSS_ITEMS_KEY = 'ynav_rss_items_cache';

// RSS 源类型
export interface RSSSource {
  id: string;
  title: string;
  url: string;
  description?: string;
  favicon?: string;
  addedAt: number;
  lastFetched?: number;
  error?: string;
}

// RSS 条目类型
export interface RSSItem {
  id: string;
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  author?: string;
  sourceId: string;
  sourceTitle: string;
  isRead?: boolean;
}

// 默认 RSS 源
export const DEFAULT_RSS_SOURCES: RSSSource[] = [
  {
    id: 'default-1',
    title: '阮一峰的网络日志',
    url: 'https://feeds.feedburner.com/ruanyifeng',
    description: '科技爱好者周刊',
    addedAt: Date.now()
  },
  {
    id: 'default-2',
    title: 'V2EX',
    url: 'https://www.v2ex.com/index.xml',
    description: '创意工作者社区',
    addedAt: Date.now()
  }
];

export const useRSSSync = () => {
  const [sources, setSources] = useState<RSSSource[]>([]);
  const [items, setItems] = useState<RSSItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  // 推送数据到云端
  const pushToCloud = useCallback(async (sourcesToPush: RSSSource[], itemsToPush: RSSItem[]) => {
    try {
      console.log('[RSS] Pushing to cloud:', sourcesToPush.length, 'sources,', itemsToPush.length, 'items');
      
      const response = await fetch(`${SYNC_API_BASE}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rssSources: sourcesToPush,
          rssItems: itemsToPush
        })
      });
      
      const result = await response.json();
      console.log('[RSS] Push result:', result);
      
      return result.success;
    } catch (e) {
      console.error('[RSS] Failed to push to cloud:', e);
      return false;
    }
  }, []);

  // 从云端拉取 - 以云端为唯一真相源
  const pullFromCloud = useCallback(async () => {
    try {
      setIsSyncing(true);
      console.log('[RSS] Pulling from cloud...');
      
      const response = await fetch(`${SYNC_API_BASE}/sync`);
      const result = await response.json();
      
      if (result.success && result.data) {
        const cloudData = result.data;
        const cloudSources = cloudData.rssSources || [];
        const cloudItems = cloudData.rssItems || [];
        
        console.log('[RSS] Cloud data:', cloudSources.length, 'sources,', cloudItems.length, 'items');
        
        return { sources: cloudSources, items: cloudItems };
      }
      return { sources: [], items: [] };
    } catch (e) {
      console.error('[RSS] Failed to pull from cloud:', e);
      return { sources: [], items: [] };
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // 延迟同步（防抖）
  const debouncedSync = useCallback((newSources: RSSSource[], newItems: RSSItem[]) => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    syncTimeoutRef.current = setTimeout(() => {
      pushToCloud(newSources, newItems);
    }, 2000); // 2秒后同步
  }, [pushToCloud]);

  // 初始化加载 - 以云端为真相源
  useEffect(() => {
    const init = async () => {
      console.log('[RSS] Initializing...');
      
      // 1. 先加载本地数据（快速显示）
      const storedSources = localStorage.getItem(RSS_SOURCES_KEY);
      const storedItems = localStorage.getItem(RSS_ITEMS_KEY);
      let localSources: RSSSource[] = [];
      let localItems: RSSItem[] = [];
      
      if (storedSources) {
        try {
          const parsed = JSON.parse(storedSources);
          if (Array.isArray(parsed) && parsed.length > 0) {
            localSources = parsed;
            setSources(localSources);
            console.log('[RSS] Loaded from local:', localSources.length, 'sources');
          }
        } catch (e) {
          console.error('[RSS] Failed to parse local sources:', e);
        }
      }
      
      if (storedItems) {
        try {
          const parsed = JSON.parse(storedItems);
          if (Array.isArray(parsed)) {
            localItems = parsed;
            setItems(localItems);
            console.log('[RSS] Loaded from local:', localItems.length, 'items');
          }
        } catch (e) {
          console.error('[RSS] Failed to parse local items:', e);
        }
      }
      
      // 如果没有本地数据，使用默认值
      if (localSources.length === 0) {
        setSources(DEFAULT_RSS_SOURCES);
        localSources = DEFAULT_RSS_SOURCES;
        console.log('[RSS] Using default sources');
      }
      
      setIsLoading(false);
      
      // 2. 从云端拉取最新数据
      const cloudData = await pullFromCloud();
      
      if (cloudData.sources.length > 0) {
        // 云端有数据，完全以云端为准（覆盖本地）
        setSources(cloudData.sources);
        setItems(cloudData.items);
        localStorage.setItem(RSS_SOURCES_KEY, JSON.stringify(cloudData.sources));
        localStorage.setItem(RSS_ITEMS_KEY, JSON.stringify(cloudData.items));
        console.log('[RSS] Overridden with cloud data');
      } else {
        // 云端无数据，上传本地数据
        const success = await pushToCloud(localSources, localItems);
        if (success) {
          console.log('[RSS] Local data uploaded to cloud');
        }
      }
      
      isInitializedRef.current = true;
    };
    
    init();
  }, [pullFromCloud, pushToCloud]);

  // 保存到 localStorage 并同步到云端
  useEffect(() => {
    if (!isLoading && isInitializedRef.current) {
      try {
        localStorage.setItem(RSS_SOURCES_KEY, JSON.stringify(sources));
        localStorage.setItem(RSS_ITEMS_KEY, JSON.stringify(items));
        console.log('[RSS] Saved to localStorage');
        
        // 同步到云端
        debouncedSync(sources, items);
      } catch (error) {
        console.error('[RSS] Failed to save:', error);
      }
    }
  }, [sources, items, isLoading, debouncedSync]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  // 更新数据源
  const updateSources = useCallback((newSources: RSSSource[] | ((prev: RSSSource[]) => RSSSource[])) => {
    setSources(newSources);
  }, []);

  // 更新条目
  const updateItems = useCallback((newItems: RSSItem[] | ((prev: RSSItem[]) => RSSItem[])) => {
    setItems(newItems);
  }, []);

  // 标记条目已读
  const markItemRead = useCallback((itemId: string) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, isRead: true } : item
    ));
  }, []);

  // 强制同步
  const forceSync = useCallback(async () => {
    return await pushToCloud(sources, items);
  }, [pushToCloud, sources, items]);

  return {
    sources,
    items,
    updateSources,
    updateItems,
    markItemRead,
    isLoading,
    isSyncing,
    forceSync
  };
};
