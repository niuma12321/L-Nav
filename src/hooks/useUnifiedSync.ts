import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  getCurrentUserId, 
  getUserStorageKey, 
  getDeviceId,
  STORAGE_KEYS 
} from '@/utils/constants';

// 所有需要同步的数据类型
const SYNC_DATA_TYPES = [
  { key: 'links_data', name: '链接数据' },
  { key: 'ynav-widgets-v9', name: '小组件配置' },
  { key: 'site_settings', name: '站点设置' },
  { key: 'ai_config', name: 'AI配置' },
  { key: 'ynav-notes', name: '笔记数据' },
  { key: 'theme', name: '主题设置' },
  { key: 'search_config', name: '搜索配置' },
  { key: 'rss_sources', name: 'RSS源' },
  { key: 'weather_city', name: '天气城市' },
  { key: 'view_password', name: '查看密码' }
];

// 同步元数据接口
interface SyncMetadata {
  version: number;
  lastSyncAt: number;
  deviceId: string;
  dataTypes: string[];
}

export function useUnifiedSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<number>(0);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [conflict, setConflict] = useState<{ localData: Record<string, any>; remoteData: Record<string, any> } | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const deviceId = useRef<string>(getDeviceId());

  // 获取同步元数据
  const getSyncMetadata = useCallback((): SyncMetadata => {
    const meta = localStorage.getItem(STORAGE_KEYS.SYNC_META);
    return meta ? JSON.parse(meta) : {
      version: 1,
      lastSyncAt: 0,
      deviceId: deviceId.current,
      dataTypes: SYNC_DATA_TYPES.map(t => t.key)
    };
  }, []);

  // 保存同步元数据
  const saveSyncMetadata = useCallback((meta: SyncMetadata) => {
    localStorage.setItem(STORAGE_KEYS.SYNC_META, JSON.stringify(meta));
  }, []);

  // 从云端拉取所有数据
  const pullFromCloud = useCallback(async (force = false) => {
    const userId = getCurrentUserId();
    if (!userId) return;

    setIsSyncing(true);
    setSyncStatus('syncing');

    try {
      const meta = getSyncMetadata();
      
      // 拉取所有数据类型
      const allData: Record<string, any> = {};
      for (const type of SYNC_DATA_TYPES) {
        try {
          const res = await fetch(`/api/sync?userId=${userId}&dataType=${type.key}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            }
          });
          if (res.ok) {
            const data = await res.json();
            if (data && data.data) {
              allData[type.key] = data.data;
            }
          }
        } catch (e) {
          console.error(`拉取 ${type.name} 失败`, e);
        }
      }

      // 检查冲突
      const hasConflict = checkForConflicts(allData);
      if (hasConflict && !force) {
        setConflict({
          localData: getAllLocalData(),
          remoteData: allData
        });
        setSyncStatus('error');
        return;
      }

      // 覆盖本地数据
      for (const [key, data] of Object.entries(allData)) {
        if (data) {
          const storageKey = getUserStorageKey(key);
          localStorage.setItem(storageKey, JSON.stringify(data));
        }
      }

      // 更新同步元数据
      const newMeta = {
        ...meta,
        lastSyncAt: Date.now(),
        version: meta.version + 1
      };
      saveSyncMetadata(newMeta);
      setLastSyncAt(newMeta.lastSyncAt);
      setSyncStatus('success');

      // 触发页面刷新
      window.dispatchEvent(new CustomEvent('ynav-data-synced'));
    } catch (e) {
      console.error('同步失败', e);
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  }, [getSyncMetadata, saveSyncMetadata]);

  // 推送所有数据到云端
  const pushToCloud = useCallback(async (debounce = true) => {
    const userId = getCurrentUserId();
    if (!userId) return;

    // 防抖：延迟2秒推送，避免频繁修改
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    const doPush = async () => {
      setIsSyncing(true);
      setSyncStatus('syncing');

      try {
        const meta = getSyncMetadata();
        
        // 推送所有数据类型
        for (const type of SYNC_DATA_TYPES) {
          try {
            const storageKey = getUserStorageKey(type.key);
            const localData = localStorage.getItem(storageKey);
            
            if (localData) {
              await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId,
                  dataType: type.key,
                  data: JSON.parse(localData),
                  deviceId: deviceId.current,
                  version: meta.version
                })
              });
            }
          } catch (e) {
            console.error(`推送 ${type.name} 失败`, e);
          }
        }

        // 更新同步元数据
        const newMeta = {
          ...meta,
          lastSyncAt: Date.now(),
          version: meta.version + 1
        };
        saveSyncMetadata(newMeta);
        setLastSyncAt(newMeta.lastSyncAt);
        setSyncStatus('success');
      } catch (e) {
        console.error('推送失败', e);
        setSyncStatus('error');
      } finally {
        setIsSyncing(false);
      }
    };

    if (debounce) {
      syncTimeoutRef.current = setTimeout(doPush, 2000);
    } else {
      await doPush();
    }
  }, [getSyncMetadata, saveSyncMetadata]);

  // 检查冲突
  const checkForConflicts = (remoteData: Record<string, any>): boolean => {
    const localData = getAllLocalData();
    
    for (const type of SYNC_DATA_TYPES) {
      const local = localData[type.key];
      const remote = remoteData[type.key];
      
      if (local && remote && JSON.stringify(local) !== JSON.stringify(remote)) {
        return true;
      }
    }
    
    return false;
  };

  // 获取所有本地数据
  const getAllLocalData = (): Record<string, any> => {
    const data: Record<string, any> = {};
    for (const type of SYNC_DATA_TYPES) {
      const storageKey = getUserStorageKey(type.key);
      const local = localStorage.getItem(storageKey);
      if (local) {
        data[type.key] = JSON.parse(local);
      }
    }
    return data;
  };

  // 解决冲突
  const resolveConflict = useCallback((choice: 'local' | 'remote') => {
    if (choice === 'local') {
      pushToCloud(false);
    } else {
      pullFromCloud(true);
    }
    setConflict(null);
  }, [pushToCloud, pullFromCloud]);

  // 手动触发全量同步
  const forceSync = useCallback(async () => {
    await pullFromCloud(true);
    await pushToCloud(false);
  }, [pullFromCloud, pushToCloud]);

  // 监听数据变化，自动推送
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // 只监听我们的数据类型
      const isSyncableType = SYNC_DATA_TYPES.some(type => 
        e.key?.includes(type.key)
      );
      
      if (isSyncableType && e.newValue) {
        pushToCloud();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [pushToCloud]);

  // 初始化时拉取云端数据
  useEffect(() => {
    pullFromCloud();
  }, [pullFromCloud]);

  return {
    isSyncing,
    lastSyncAt,
    syncStatus,
    conflict,
    pullFromCloud,
    pushToCloud,
    forceSync,
    resolveConflict
  };
}
