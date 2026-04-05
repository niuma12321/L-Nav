import { useState, useEffect, useCallback, useRef } from 'react';
import { getUserData, setUserData } from '../utils/constants';

const SYNC_API_BASE = '/api/v1';
const RSS_SOURCES_KEY = 'rss_sources';
const RSS_ITEMS_KEY = 'rss_items_cache';

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
      
      // 1. 先加载本地数据（快速显示）- 使用用户维度存储
      const storedSources = getUserData<RSSSource[]>(RSS_SOURCES_KEY, []);
      const storedItems = getUserData<RSSItem[]>(RSS_ITEMS_KEY, []);
      let localSources: RSSSource[] = [];
      let localItems: RSSItem[] = [];
      
      if (storedSources && storedSources.length > 0) {
        localSources = storedSources;
        setSources(localSources);
        console.log('[RSS] Loaded from local:', localSources.length, 'sources');
      }
      
      if (storedItems && storedItems.length > 0) {
        localItems = storedItems;
        setItems(localItems);
        console.log('[RSS] Loaded from local:', localItems.length, 'items');
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
        setUserData(RSS_SOURCES_KEY, cloudData.sources);
        setUserData(RSS_ITEMS_KEY, cloudData.items);
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

  // 保存到 localStorage 并同步到云端 - 使用用户维度存储，增加数据完整性保护
  useEffect(() => {
    if (!isLoading && isInitializedRef.current) {
      try {
        // 数据验证：确保数据完整性
        const validSources = sources.filter(s => s && s.id && s.url);
        const validItems = items.filter(i => i && i.id && i.sourceId);
        
        if (validSources.length !== sources.length) {
          console.warn('[RSS] 过滤了无效的源数据:', sources.length, '->', validSources.length);
        }
        if (validItems.length !== items.length) {
          console.warn('[RSS] 过滤了无效的条目数据:', items.length, '->', validItems.length);
        }
        
        setUserData(RSS_SOURCES_KEY, validSources);
        setUserData(RSS_ITEMS_KEY, validItems);
        console.log('[RSS] 已保存到用户存储，源:', validSources.length, '条目:', validItems.length);
        
        // 同步到云端
        debouncedSync(validSources, validItems);
      } catch (error) {
        console.error('[RSS] 保存失败:', error);
        // 保存失败时，尝试恢复本地备份
        try {
          const backupSources = getUserData<RSSSource[]>(RSS_SOURCES_KEY, []);
          const backupItems = getUserData<RSSItem[]>(RSS_ITEMS_KEY, []);
          if (backupSources.length > 0 || backupItems.length > 0) {
            console.log('[RSS] 从备份恢复数据');
            setSources(backupSources);
            setItems(backupItems);
          }
        } catch (backupError) {
          console.error('[RSS] 备份恢复也失败:', backupError);
        }
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
