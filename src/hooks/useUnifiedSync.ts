import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  getCurrentUserId, 
  getDeviceId,
  initDefaultUser,
  getCanonicalUserStorageKey,
  readSyncableUserData,
  writeSyncableUserData,
  STORAGE_KEYS,
  SYNC_STORAGE_REGISTRY,
  YNAV_DATA_SYNCED_EVENT,
  YNAV_USER_STORAGE_UPDATED_EVENT
} from '@/utils/constants';

const SYNC_DATA_TYPES = [...SYNC_STORAGE_REGISTRY];

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
  const [syncStatus, setSyncStatus] = useState<'idle' | 'pending' | 'syncing' | 'synced' | 'error' | 'conflict'>('idle');
  const [conflict, setConflict] = useState<{ localData: Record<string, any>; remoteData: Record<string, any> } | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const suppressAutoPushRef = useRef(false);
  const hasInitialPullRef = useRef(false);
  const deviceId = useRef<string>(getDeviceId());

  // 获取同步元数据
  const getSyncMetadata = useCallback((): SyncMetadata => {
    const meta = localStorage.getItem(STORAGE_KEYS.SYNC_META);
    return meta ? JSON.parse(meta) : {
      version: 1,
      lastSyncAt: 0,
      deviceId: deviceId.current,
      dataTypes: SYNC_DATA_TYPES.map(type => type.remoteType)
    };
  }, []);

  // 保存同步元数据
  const saveSyncMetadata = useCallback((meta: SyncMetadata) => {
    localStorage.setItem(STORAGE_KEYS.SYNC_META, JSON.stringify(meta));
  }, []);

  // 从云端拉取所有数据
  const pullFromCloud = useCallback(async (force = false) => {
    const userId = getCurrentUserId() || initDefaultUser();
    if (!userId) return;

    setIsSyncing(true);
    setSyncStatus('syncing');

    try {
      const meta = getSyncMetadata();
      
      // 拉取所有数据类型
      const allData: Record<string, any> = {};
      for (const type of SYNC_DATA_TYPES) {
        try {
          const res = await fetch(`/api/sync?userId=${userId}&dataType=${type.remoteType}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            }
          });
          if (res.ok) {
            const data = await res.json();
            if (data && data.data) {
              allData[type.remoteType] = data.data;
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
        setSyncStatus('conflict');
        return;
      }

      // 覆盖本地数据
      const changedKeys = new Set<string>();
      suppressAutoPushRef.current = true;
      for (const [key, data] of Object.entries(allData)) {
        if (data !== null && data !== undefined) {
          writeSyncableUserData(key, data);
          changedKeys.add(key);
        }
      }
      suppressAutoPushRef.current = false;

      // 更新同步元数据
      const newMeta = {
        ...meta,
        lastSyncAt: Date.now(),
        version: meta.version + 1
      };
      saveSyncMetadata(newMeta);
      setLastSyncAt(newMeta.lastSyncAt);
      setSyncStatus('synced');

      // 触发页面刷新
      if (changedKeys.size > 0) {
        window.dispatchEvent(new CustomEvent(YNAV_DATA_SYNCED_EVENT, {
          detail: { changedKeys: Array.from(changedKeys) }
        }));
      }
    } catch (e) {
      console.error('同步失败', e);
      setSyncStatus('error');
    } finally {
      hasInitialPullRef.current = true;
      suppressAutoPushRef.current = false;
      setIsSyncing(false);
    }
  }, [getSyncMetadata, saveSyncMetadata]);

  // 推送所有数据到云端
  const pushToCloud = useCallback(async (debounce = true) => {
    const userId = getCurrentUserId() || initDefaultUser();
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
            const localData = readSyncableUserData(type.remoteType, null);

            if (localData !== null && localData !== undefined) {
              await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId,
                  dataType: type.remoteType,
                  data: localData,
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
        setSyncStatus('synced');
      } catch (e) {
        console.error('推送失败', e);
        setSyncStatus('error');
      } finally {
        setIsSyncing(false);
      }
    };

    if (debounce) {
      setSyncStatus('pending');
      syncTimeoutRef.current = setTimeout(doPush, 2000);
    } else {
      await doPush();
    }
  }, [getSyncMetadata, saveSyncMetadata]);

  // 检查冲突
  const checkForConflicts = (remoteData: Record<string, any>): boolean => {
    const localData = getAllLocalData();
    
    for (const type of SYNC_DATA_TYPES) {
      const local = localData[type.remoteType];
      const remote = remoteData[type.remoteType];
      
      if (local !== null && local !== undefined && remote !== null && remote !== undefined && JSON.stringify(local) !== JSON.stringify(remote)) {
        return true;
      }
    }
    
    return false;
  };

  // 获取所有本地数据
  const getAllLocalData = (): Record<string, any> => {
    const data: Record<string, any> = {};
    for (const type of SYNC_DATA_TYPES) {
      const local = readSyncableUserData(type.remoteType, null);
      if (local !== null && local !== undefined) {
        data[type.remoteType] = local;
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
      if (!hasInitialPullRef.current) return;
      if (suppressAutoPushRef.current) return;

      // 只监听我们的数据类型
      const isSyncableType = SYNC_DATA_TYPES.some(type => 
        e.key === getCanonicalUserStorageKey(type.remoteType)
      );
      
      if (isSyncableType && e.newValue) {
        pushToCloud();
      }
    };

    const handleUserStorageUpdated = (event: Event) => {
      if (!hasInitialPullRef.current) return;
      if (suppressAutoPushRef.current) return;

      const changedKeys = (event as CustomEvent<{ changedKeys?: string[] }>).detail?.changedKeys || [];
      const isSyncableType = changedKeys.some((changedKey) =>
        SYNC_DATA_TYPES.some(type =>
          changedKey === type.remoteType ||
          changedKey === type.primaryKey ||
          changedKey === getCanonicalUserStorageKey(type.remoteType)
        )
      );

      if (isSyncableType) {
        pushToCloud();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(YNAV_USER_STORAGE_UPDATED_EVENT, handleUserStorageUpdated as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(YNAV_USER_STORAGE_UPDATED_EVENT, handleUserStorageUpdated as EventListener);
    };
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
