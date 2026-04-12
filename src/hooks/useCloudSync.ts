/**
 * Cloudflare 云端同步 Hook
 * 处理数据与 Cloudflare Worker 之间的同步
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getData, setData } from '../utils/constants';

// 同步配置
const SYNC_CONFIG = {
  API_ENDPOINT: 'https://678870.xyz/api/sync',
  AUTH_TOKEN: 'ynav_ljq_token_2024',
  SYNC_INTERVAL: 30000, // 30秒自动同步
  DEBOUNCE_DELAY: 2000, // 防抖延迟
};

// 同步状态类型
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'offline';

export interface CloudSyncState {
  status: SyncStatus;
  lastSync: number;
  lastError: string | null;
  pendingChanges: boolean;
}

// 需要同步的数据键
const SYNCABLE_KEYS = [
  'links_data',
  'ynav-widgets-v9',
  'site_settings',
  'ai_config',
  'ynav_notes',
  'theme',
  'search_config',
  'rss_sources',
  'rss_items_cache',
  'weather_city',
  'ynav_private_vault_v1',
];

// 获取设备信息
const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  const platform = navigator.platform;
  
  let browser = 'Unknown';
  let os = 'Unknown';
  
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';
  
  if (/Win/i.test(platform)) os = 'Windows';
  else if (/Mac/i.test(platform)) os = 'macOS';
  else if (/Linux/i.test(platform)) os = 'Linux';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  
  return { browser, os };
};

// 生成设备 ID
const getDeviceId = () => {
  let deviceId = localStorage.getItem('ynav_device_id');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem('ynav_device_id', deviceId);
  }
  return deviceId;
};

export function useCloudSync() {
  const [state, setState] = useState<CloudSyncState>(() => {
    const savedLastSync = localStorage.getItem('ynav_last_sync');
    return {
      status: 'idle',
      lastSync: savedLastSync ? parseInt(savedLastSync, 10) : 0,
      lastError: null,
      pendingChanges: false,
    };
  });
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const pendingSyncRef = useRef<NodeJS.Timeout | null>(null);
  const syncInProgressRef = useRef(false);

  // 监听网络状态
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setState(prev => ({ ...prev, status: 'idle' }));
      // 网络恢复时触发同步
      debouncedSync();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setState(prev => ({ ...prev, status: 'offline', lastError: '网络已断开' }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 收集要同步的数据
  const collectSyncData = useCallback(() => {
    const data: Record<string, any> = {};
    
    SYNCABLE_KEYS.forEach(key => {
      const value = getData(key, null);
      if (value !== null) {
        data[key] = value;
      }
    });
    
    return data;
  }, []);

  // 应用服务器数据到本地
  const applyServerData = useCallback((serverData: Record<string, any>) => {
    Object.entries(serverData).forEach(([key, value]) => {
      if (SYNCABLE_KEYS.includes(key) && value !== null) {
        // 合并策略：取时间戳最新的
        const localValue = getData(key, null);
        if (!localValue || !value._modifiedAt || !localValue._modifiedAt || 
            value._modifiedAt >= localValue._modifiedAt) {
          setData(key, value);
        }
      }
    });
  }, []);

  // 执行同步
  const performSync = useCallback(async () => {
    if (syncInProgressRef.current || !isOnline) return;
    
    syncInProgressRef.current = true;
    setState(prev => ({ ...prev, status: 'syncing' }));

    try {
      const deviceId = getDeviceId();
      const { browser, os } = getDeviceInfo();
      
      // 1. 先获取服务器数据
      const getResponse = await fetch(SYNC_CONFIG.API_ENDPOINT, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SYNC_CONFIG.AUTH_TOKEN}`,
        },
      });

      if (!getResponse.ok) {
        throw new Error(`获取服务器数据失败: ${getResponse.status}`);
      }

      const serverResult = await getResponse.json();
      
      if (serverResult.success && serverResult.data) {
        // 应用服务器数据
        applyServerData(serverResult.data);
      }

      // 2. 推送本地数据到服务器
      const localData = collectSyncData();
      const payload = {
        deviceId,
        deviceName: `${browser} (${os})`,
        data: localData,
        lastSync: state.lastSync,
      };

      const postResponse = await fetch(SYNC_CONFIG.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SYNC_CONFIG.AUTH_TOKEN}`,
        },
        body: JSON.stringify(payload),
      });

      if (!postResponse.ok) {
        throw new Error(`推送数据失败: ${postResponse.status}`);
      }

      const postResult = await postResponse.json();
      
      const now = Date.now();
      localStorage.setItem('ynav_last_sync', now.toString());
      
      setState({
        status: 'success',
        lastSync: now,
        lastError: null,
        pendingChanges: false,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '同步失败';
      setState(prev => ({
        ...prev,
        status: 'error',
        lastError: errorMessage,
      }));
    } finally {
      syncInProgressRef.current = false;
    }
  }, [isOnline, state.lastSync, collectSyncData, applyServerData]);

  // 防抖同步
  const debouncedSync = useCallback(() => {
    if (pendingSyncRef.current) {
      clearTimeout(pendingSyncRef.current);
    }
    
    setState(prev => ({ ...prev, pendingChanges: true }));
    
    pendingSyncRef.current = setTimeout(() => {
      performSync();
    }, SYNC_CONFIG.DEBOUNCE_DELAY);
  }, [performSync]);

  // 立即同步
  const syncNow = useCallback(async () => {
    if (pendingSyncRef.current) {
      clearTimeout(pendingSyncRef.current);
      pendingSyncRef.current = null;
    }
    await performSync();
  }, [performSync]);

  // 监听数据变化，自动触发同步
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key?.startsWith('ynav_ljq_v9_')) {
        debouncedSync();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [debouncedSync]);

  // 自动同步定时器
  useEffect(() => {
    if (!isOnline) return;

    const interval = setInterval(() => {
      performSync();
    }, SYNC_CONFIG.SYNC_INTERVAL);

    return () => clearInterval(interval);
  }, [isOnline, performSync]);

  // 初始同步
  useEffect(() => {
    if (isOnline) {
      performSync();
    }
  }, [isOnline]);

  return {
    ...state,
    isOnline,
    syncNow,
    debouncedSync,
  };
}
