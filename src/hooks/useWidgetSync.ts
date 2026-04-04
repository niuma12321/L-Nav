import { useState, useEffect, useCallback, useRef } from 'react';
import { WidgetConfig } from '../components/v6/widgetTypes';

const SYNC_API_BASE = '/api/v1';
const WIDGETS_STORAGE_KEY = 'ynav_widgets_v1';

export const useWidgetSync = () => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  // 推送数据到云端
  const pushToCloud = useCallback(async (widgetsToPush: WidgetConfig[]) => {
    try {
      console.log('[Widgets] Pushing to cloud:', widgetsToPush.length, 'widgets');
      
      const response = await fetch(`${SYNC_API_BASE}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widgets: widgetsToPush
        })
      });
      
      const result = await response.json();
      console.log('[Widgets] Push result:', result);
      
      return result.success;
    } catch (e) {
      console.error('[Widgets] Failed to push to cloud:', e);
      return false;
    }
  }, []);

  // 从云端拉取 - 以云端为唯一真相源
  const pullFromCloud = useCallback(async () => {
    try {
      setIsSyncing(true);
      console.log('[Widgets] Pulling from cloud...');
      
      const response = await fetch(`${SYNC_API_BASE}/sync`);
      const result = await response.json();
      
      if (result.success && result.data) {
        const cloudData = result.data;
        const cloudWidgets = cloudData.widgets || [];
        
        console.log('[Widgets] Cloud data:', cloudWidgets.length, 'widgets');
        
        return { widgets: cloudWidgets };
      }
      return { widgets: [] };
    } catch (e) {
      console.error('[Widgets] Failed to pull from cloud:', e);
      return { widgets: [] };
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // 延迟同步（防抖）
  const debouncedSync = useCallback((newWidgets: WidgetConfig[]) => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    syncTimeoutRef.current = setTimeout(() => {
      pushToCloud(newWidgets);
    }, 2000); // 2秒后同步
  }, [pushToCloud]);

  // 初始化加载 - 以云端为真相源
  useEffect(() => {
    const init = async () => {
      console.log('[Widgets] Initializing...');
      
      // 1. 先加载本地数据（快速显示）
      const stored = localStorage.getItem(WIDGETS_STORAGE_KEY);
      let localWidgets: WidgetConfig[] = [];
      
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            localWidgets = parsed;
            setWidgets(localWidgets);
            console.log('[Widgets] Loaded from local:', localWidgets.length, 'widgets');
          }
        } catch (e) {
          console.error('[Widgets] Failed to parse local data:', e);
        }
      }
      
      setIsLoading(false);
      
      // 2. 从云端拉取最新数据
      const cloudData = await pullFromCloud();
      
      if (cloudData.widgets.length > 0) {
        // 云端有数据，完全以云端为准（覆盖本地）
        setWidgets(cloudData.widgets);
        localStorage.setItem(WIDGETS_STORAGE_KEY, JSON.stringify(cloudData.widgets));
        console.log('[Widgets] Overridden with cloud data');
      } else if (localWidgets.length > 0) {
        // 云端无数据，上传本地数据
        const success = await pushToCloud(localWidgets);
        if (success) {
          console.log('[Widgets] Local data uploaded to cloud');
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
        localStorage.setItem(WIDGETS_STORAGE_KEY, JSON.stringify(widgets));
        console.log('[Widgets] Saved to localStorage');
        
        // 同步到云端
        debouncedSync(widgets);
      } catch (error) {
        console.error('[Widgets] Failed to save:', error);
      }
    }
  }, [widgets, isLoading, debouncedSync]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  // 更新 widgets
  const updateWidgets = useCallback((newWidgets: WidgetConfig[] | ((prev: WidgetConfig[]) => WidgetConfig[])) => {
    setWidgets(newWidgets);
  }, []);

  // 强制同步
  const forceSync = useCallback(async () => {
    return await pushToCloud(widgets);
  }, [pushToCloud, widgets]);

  return {
    widgets,
    setWidgets: updateWidgets,
    isLoading,
    isSyncing,
    forceSync
  };
};

export default useWidgetSync;
