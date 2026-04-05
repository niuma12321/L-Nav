import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  getCurrentUserId, 
  initDefaultUser,
  readSyncableUserData,
  writeSyncableUserData,
  SYNC_STORAGE_REGISTRY,
  YNAV_USER_STORAGE_UPDATED_EVENT
} from '@/utils/constants';

const SYNC_DATA_TYPES = [...SYNC_STORAGE_REGISTRY];

export function useUnifiedSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<number>(0);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitialPullRef = useRef(false);

  // 获取所有本地数据
  const getAllLocalData = useCallback(() => {
    const data: Record<string, any> = {};
    for (const type of SYNC_DATA_TYPES) {
      data[type.remoteType] = readSyncableUserData(type.remoteType, null);
    }
    return data;
  }, []);

  // 从云端拉取所有数据 - 直接覆盖本地
  const pullFromCloud = useCallback(async () => {
    const userId = getCurrentUserId() || initDefaultUser();
    if (!userId) return;

    setIsSyncing(true);
    console.log('[Sync] 开始从云端拉取数据...');

    try {
      for (const type of SYNC_DATA_TYPES) {
        try {
          const res = await fetch(`/api/sync?userId=${userId}&dataType=${type.remoteType}`, {
            cache: 'no-store'
          });
          if (res.ok) {
            const result = await res.json();
            if (result && result.data) {
              // 直接覆盖本地数据
              writeSyncableUserData(type.remoteType, result.data);
              console.log(`[Sync] 已拉取 ${type.name} 数据`);
            }
          }
        } catch (e) {
          console.error(`[Sync] 拉取 ${type.name} 失败:`, e);
        }
      }

      setLastSyncAt(Date.now());
      
      // 触发页面刷新
      window.dispatchEvent(new CustomEvent(YNAV_USER_STORAGE_UPDATED_EVENT, {
        detail: { source: 'cloud', timestamp: Date.now() }
      }));
      
      console.log('[Sync] 云端数据拉取完成');
    } catch (e) {
      console.error('[Sync] 拉取失败:', e);
    } finally {
      hasInitialPullRef.current = true;
      setIsSyncing(false);
    }
  }, []);

  // 推送所有数据到云端 - 直接覆盖云端
  const pushToCloud = useCallback(async (immediate = false) => {
    const userId = getCurrentUserId() || initDefaultUser();
    if (!userId) return;

    // 防抖：非立即推送时延迟2秒
    if (!immediate && syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    const doPush = async () => {
      setIsSyncing(true);
      console.log('[Sync] 开始推送数据到云端...');

      try {
        const allData = getAllLocalData();
        
        for (const type of SYNC_DATA_TYPES) {
          const data = allData[type.remoteType];
          if (data !== null && data !== undefined) {
            try {
              await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId,
                  dataType: type.remoteType,
                  data,
                  timestamp: Date.now()
                })
              });
              console.log(`[Sync] 已推送 ${type.name} 数据`);
            } catch (e) {
              console.error(`[Sync] 推送 ${type.name} 失败:`, e);
            }
          }
        }

        setLastSyncAt(Date.now());
        console.log('[Sync] 数据推送完成');
      } catch (e) {
        console.error('[Sync] 推送失败:', e);
      } finally {
        setIsSyncing(false);
      }
    };

    if (immediate) {
      await doPush();
    } else {
      syncTimeoutRef.current = setTimeout(doPush, 2000);
    }
  }, [getAllLocalData]);

  // 初始化时拉取云端数据
  useEffect(() => {
    if (!hasInitialPullRef.current) {
      pullFromCloud();
    }
    
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [pullFromCloud]);

  // 监听本地数据变化，自动推送到云端
  useEffect(() => {
    const handleStorageChange = () => {
      console.log('[Sync] 检测到数据变化，准备推送...');
      pushToCloud(false);
    };

    window.addEventListener('ynav-data-changed', handleStorageChange);
    window.addEventListener(YNAV_USER_STORAGE_UPDATED_EVENT, handleStorageChange);
    return () => {
      window.removeEventListener('ynav-data-changed', handleStorageChange);
      window.removeEventListener(YNAV_USER_STORAGE_UPDATED_EVENT, handleStorageChange);
    };
  }, [pushToCloud]);

  return {
    isSyncing,
    lastSyncAt,
    pullFromCloud,
    pushToCloud
  };
}
