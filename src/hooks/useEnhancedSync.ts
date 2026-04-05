/**
 * 增强的数据同步引擎
 * 解决同步缺陷，提供冲突解决和离线支持
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  getCurrentUserId, 
  getUserStorageKey, 
  getDeviceId,
  STORAGE_KEYS 
} from '@/utils/constants';

// 数据变更类型
export interface DataChange {
  type: 'create' | 'update' | 'delete';
  dataType: string;
  data: any;
  timestamp: number;
  deviceId: string;
  version: number;
}

// 冲突信息
export interface ConflictInfo {
  dataType: string;
  localData: any;
  remoteData: any;
  conflictType: 'version' | 'data' | 'concurrent';
  timestamp: number;
}

// 合并结果
export interface MergeResult {
  success: boolean;
  mergedData?: any;
  conflicts?: ConflictInfo[];
  requiresManualResolution?: boolean;
}

// 数据完整性检查
export interface IntegrityCheck {
  isValid: boolean;
  checksum: string;
  size: number;
  corrupted: boolean;
}

// 同步状态
export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt: number;
  pendingChanges: number;
  failedChanges: number;
  conflicts: ConflictInfo[];
}

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

export function useEnhancedSync() {
  const [syncState, setSyncState] = useState<SyncState>({
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSyncAt: 0,
    pendingChanges: 0,
    failedChanges: 0,
    conflicts: []
  });
  
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const deviceId = useRef<string>(getDeviceId());
  const offlineQueueRef = useRef<DataChange[]>([]);

  // 生成数据校验和
  const generateChecksum = useCallback((data: any): string => {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash.toString(16);
  }, []);

  // 检查数据完整性
  const checkDataIntegrity = useCallback((data: any): IntegrityCheck => {
    try {
      const str = JSON.stringify(data);
      const checksum = generateChecksum(data);
      const size = new Blob([str]).size;
      
      return {
        isValid: true,
        checksum,
        size,
        corrupted: false
      };
    } catch (error) {
      return {
        isValid: false,
        checksum: '',
        size: 0,
        corrupted: true
      };
    }
  }, [generateChecksum]);

  // 检测冲突
  const detectConflicts = useCallback((
    localData: any, 
    remoteData: any, 
    dataType: string
  ): ConflictInfo[] => {
    const conflicts: ConflictInfo[] = [];
    
    // 版本冲突
    if (localData?.version && remoteData?.version) {
      if (localData.version < remoteData.version) {
        conflicts.push({
          dataType,
          localData,
          remoteData,
          conflictType: 'version',
          timestamp: Date.now()
        });
      }
    }
    
    // 数据内容冲突
    if (localData && remoteData) {
      const localChecksum = generateChecksum(localData);
      const remoteChecksum = generateChecksum(remoteData);
      
      if (localChecksum !== remoteChecksum) {
        conflicts.push({
          dataType,
          localData,
          remoteData,
          conflictType: 'data',
          timestamp: Date.now()
        });
      }
    }
    
    // 并发修改冲突 (基于时间戳)
    if (localData?.timestamp && remoteData?.timestamp) {
      const timeDiff = Math.abs(localData.timestamp - remoteData.timestamp);
      if (timeDiff < 5000) { // 5秒内的修改视为并发
        conflicts.push({
          dataType,
          localData,
          remoteData,
          conflictType: 'concurrent',
          timestamp: Date.now()
        });
      }
    }
    
    return conflicts;
  }, [generateChecksum]);

  // 智能合并数据
  const mergeData = useCallback((
    localData: any,
    remoteData: any,
    conflicts: ConflictInfo[]
  ): MergeResult => {
    if (conflicts.length === 0) {
      return {
        success: true,
        mergedData: remoteData || localData
      };
    }
    
    const mergedData = { ...localData };
    let requiresManualResolution = false;
    
    for (const conflict of conflicts) {
      switch (conflict.conflictType) {
        case 'version':
          // 版本冲突：使用最新版本
          if (remoteData.version > localData.version) {
            Object.assign(mergedData, remoteData);
          }
          break;
          
        case 'data':
          // 数据冲突：需要手动解决
          requiresManualResolution = true;
          break;
          
        case 'concurrent':
          // 并发冲突：基于业务逻辑合并
          if (conflict.dataType === 'links_data') {
            // 链接数据：合并数组，去重
            const localLinks = new Set(localData.links || []);
            const remoteLinks = new Set(remoteData.links || []);
            mergedData.links = [...new Set([...localLinks, ...remoteLinks])];
          } else {
            requiresManualResolution = true;
          }
          break;
      }
    }
    
    return {
      success: !requiresManualResolution,
      mergedData: requiresManualResolution ? undefined : mergedData,
      conflicts: requiresManualResolution ? conflicts : [],
      requiresManualResolution
    };
  }, []);

  // 添加离线变更到队列
  const queueOfflineChange = useCallback((change: DataChange) => {
    offlineQueueRef.current.push(change);
    setSyncState(prev => ({
      ...prev,
      pendingChanges: prev.pendingChanges + 1
    }));
  }, []);

  // 处理离线队列
  const processOfflineQueue = useCallback(async () => {
    if (offlineQueueRef.current.length === 0) return;
    
    const queue = [...offlineQueueRef.current];
    offlineQueueRef.current = [];
    
    for (const change of queue) {
      try {
        await pushChangeToCloud(change);
        setSyncState(prev => ({
          ...prev,
          pendingChanges: Math.max(0, prev.pendingChanges - 1)
        }));
      } catch (error) {
        console.error('推送离线变更失败:', error);
        setSyncState(prev => ({
          ...prev,
          failedChanges: prev.failedChanges + 1
        }));
      }
    }
  }, []);

  // 推送变更到云端
  const pushChangeToCloud = useCallback(async (change: DataChange) => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('用户未登录');
    
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        dataType: change.dataType,
        data: change.data,
        deviceId: deviceId.current,
        version: change.version,
        changeType: change.type,
        timestamp: change.timestamp
      })
    });
    
    if (!response.ok) {
      throw new Error(`同步失败: ${response.statusText}`);
    }
    
    return response.json();
  }, []);

  // 从云端拉取数据
  const pullFromCloud = useCallback(async (dataType?: string) => {
    const userId = getCurrentUserId();
    if (!userId) return;
    
    setSyncState(prev => ({ ...prev, isSyncing: true }));
    
    try {
      const dataTypes = dataType ? [dataType] : SYNC_DATA_TYPES.map(t => t.key);
      const allData: Record<string, any> = {};
      const allConflicts: ConflictInfo[] = [];
      
      for (const type of dataTypes) {
        try {
          const res = await fetch(`/api/sync?userId=${userId}&dataType=${type}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            }
          });
          
          if (res.ok) {
            const result = await res.json();
            if (result.data) {
              const localData = localStorage.getItem(getUserStorageKey(type));
              const localParsed = localData ? JSON.parse(localData) : null;
              
              // 检测冲突
              const conflicts = detectConflicts(localParsed, result.data, type);
              if (conflicts.length > 0) {
                allConflicts.push(...conflicts);
              } else {
                // 无冲突，直接更新
                localStorage.setItem(getUserStorageKey(type), JSON.stringify(result.data));
                allData[type] = result.data;
              }
            }
          }
        } catch (error) {
          console.error(`拉取 ${type} 失败:`, error);
        }
      }
      
      setSyncState(prev => ({
        ...prev,
        conflicts: allConflicts,
        lastSyncAt: Date.now()
      }));
      
      return { data: allData, conflicts: allConflicts };
    } finally {
      setSyncState(prev => ({ ...prev, isSyncing: false }));
    }
  }, [detectConflicts]);

  // 推送数据到云端
  const pushToCloud = useCallback(async (debounce = true) => {
    if (!syncState.isOnline) {
      // 离线状态，加入队列
      const changes = SYNC_DATA_TYPES.map(type => {
        const storageKey = getUserStorageKey(type.key);
        const data = localStorage.getItem(storageKey);
        return {
          type: 'update' as const,
          dataType: type.key,
          data: data ? JSON.parse(data) : null,
          timestamp: Date.now(),
          deviceId: deviceId.current,
          version: Date.now()
        };
      });
      
      changes.forEach(change => queueOfflineChange(change));
      return;
    }
    
    const doPush = async () => {
      setSyncState(prev => ({ ...prev, isSyncing: true }));
      
      try {
        for (const type of SYNC_DATA_TYPES) {
          const storageKey = getUserStorageKey(type.key);
          const localData = localStorage.getItem(storageKey);
          
          if (localData) {
            const change: DataChange = {
              type: 'update',
              dataType: type.key,
              data: JSON.parse(localData),
              timestamp: Date.now(),
              deviceId: deviceId.current,
              version: Date.now()
            };
            
            await pushChangeToCloud(change);
          }
        }
        
        setSyncState(prev => ({
          ...prev,
          lastSyncAt: Date.now(),
          pendingChanges: 0,
          failedChanges: 0
        }));
      } finally {
        setSyncState(prev => ({ ...prev, isSyncing: false }));
      }
    };
    
    if (debounce) {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      syncTimeoutRef.current = setTimeout(doPush, 2000);
    } else {
      await doPush();
    }
  }, [syncState.isOnline, queueOfflineChange, pushChangeToCloud]);

  // 解决冲突
  const resolveConflicts = useCallback(async (resolution: 'local' | 'remote' | 'merge') => {
    const { conflicts } = syncState;
    
    for (const conflict of conflicts) {
      try {
        let finalData: any;
        
        switch (resolution) {
          case 'local':
            finalData = conflict.localData;
            break;
          case 'remote':
            finalData = conflict.remoteData;
            break;
          case 'merge':
            const mergeResult = mergeData(conflict.localData, conflict.remoteData, [conflict]);
            if (mergeResult.success) {
              finalData = mergeResult.mergedData;
            } else {
              // 合并失败，跳过
              continue;
            }
            break;
        }
        
        // 保存解决后的数据
        localStorage.setItem(getUserStorageKey(conflict.dataType), JSON.stringify(finalData));
        
        // 推送到云端
        const change: DataChange = {
          type: 'update',
          dataType: conflict.dataType,
          data: finalData,
          timestamp: Date.now(),
          deviceId: deviceId.current,
          version: Date.now()
        };
        
        await pushChangeToCloud(change);
      } catch (error) {
        console.error('解决冲突失败:', error);
      }
    }
    
    // 清除冲突状态
    setSyncState(prev => ({ ...prev, conflicts: [] }));
  }, [syncState.conflicts, mergeData, pushChangeToCloud]);

  // 重试失败的同步
  const retryFailedSync = useCallback(async (maxAttempts = 3) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await processOfflineQueue();
        setSyncState(prev => ({ ...prev, failedChanges: 0 }));
        break;
      } catch (error) {
        console.error(`重试同步失败 (${attempt}/${maxAttempts}):`, error);
        
        if (attempt === maxAttempts) {
          setSyncState(prev => ({ ...prev, failedChanges: offlineQueueRef.current.length }));
        } else {
          // 指数退避
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
  }, [processOfflineQueue]);

  // 监听网络状态
  useEffect(() => {
    const handleOnline = () => {
      setSyncState(prev => ({ ...prev, isOnline: true }));
      // 网络恢复时处理离线队列
      processOfflineQueue();
    };
    
    const handleOffline = () => {
      setSyncState(prev => ({ ...prev, isOnline: false }));
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [processOfflineQueue]);

  // 监听本地数据变化
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.newValue) return; // 删除操作不触发同步
      
      const isSyncableType = SYNC_DATA_TYPES.some(type => 
        e.key?.includes(type.key)
      );
      
      if (isSyncableType) {
        if (syncState.isOnline) {
          pushToCloud();
        } else {
          // 离线状态，加入队列
          const change: DataChange = {
            type: 'update',
            dataType: e.key!.split('_').pop()!,
            data: JSON.parse(e.newValue),
            timestamp: Date.now(),
            deviceId: deviceId.current,
            version: Date.now()
          };
          queueOfflineChange(change);
        }
      }
    };
    
    // 监听同页数据变化 (使用自定义事件)
    const handleDataChange = (e: CustomEvent) => {
      if (syncState.isOnline) {
        pushToCloud();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('ynav-data-changed', handleDataChange as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('ynav-data-changed', handleDataChange as EventListener);
    };
  }, [syncState.isOnline, pushToCloud, queueOfflineChange]);

  // 初始化时拉取数据
  useEffect(() => {
    pullFromCloud();
  }, []);

  // 触发数据变化事件 (用于同页同步)
  const triggerDataChange = useCallback(() => {
    window.dispatchEvent(new CustomEvent('ynav-data-changed'));
  }, []);

  return {
    syncState,
    pullFromCloud,
    pushToCloud,
    resolveConflicts,
    retryFailedSync,
    triggerDataChange,
    checkDataIntegrity,
    generateChecksum
  };
}
