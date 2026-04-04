import { useState, useCallback, useEffect, useRef } from 'react';
import { WidgetConfig, DEFAULT_WIDGETS, WIDGET_STORAGE_KEY } from '../types/widgets';

const SYNC_API_BASE = '/api/v1';

export interface UseWidgetsReturn {
  widgets: WidgetConfig[];
  addWidget: (type: WidgetConfig['type']) => void;
  removeWidget: (id: string) => void;
  updateWidget: (id: string, updates: Partial<WidgetConfig>) => void;
  updateWidgetSettings: (id: string, settings: Record<string, any>) => void;
  reorderWidgets: (newOrder: WidgetConfig[]) => void;
  toggleWidget: (id: string) => void;
  isLoading: boolean;
  isSyncing: boolean;
}

export function useWidgets(): UseWidgetsReturn {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  // 推送到云端
  const pushToCloud = useCallback(async (widgetsToPush: WidgetConfig[]) => {
    try {
      console.log('[Widgets] Pushing to cloud:', widgetsToPush.length, 'widgets');
      
      const response = await fetch(`${SYNC_API_BASE}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          links: [],
          categories: [],
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
  const pullFromCloud = useCallback(async (): Promise<WidgetConfig[]> => {
    try {
      setIsSyncing(true);
      console.log('[Widgets] Pulling from cloud...');
      
      const response = await fetch(`${SYNC_API_BASE}/sync`);
      const result = await response.json();
      
      if (result.success && result.data) {
        const cloudWidgets = result.data.widgets || [];
        console.log('[Widgets] Cloud data:', cloudWidgets.length, 'widgets');
        return cloudWidgets;
      }
      return [];
    } catch (e) {
      console.error('[Widgets] Failed to pull from cloud:', e);
      return [];
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
      const stored = localStorage.getItem(WIDGET_STORAGE_KEY);
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
      
      if (localWidgets.length === 0) {
        setWidgets(DEFAULT_WIDGETS);
        localWidgets = DEFAULT_WIDGETS;
        console.log('[Widgets] Using default widgets');
      }
      
      setIsLoading(false);
      
      // 2. 从云端拉取最新数据
      const cloudWidgets = await pullFromCloud();
      
      if (cloudWidgets.length > 0) {
        // 云端有数据，完全以云端为准（覆盖本地）
        setWidgets(cloudWidgets);
        localStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(cloudWidgets));
        console.log('[Widgets] Overridden with cloud data:', cloudWidgets.length, 'widgets');
      } else {
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
    if (!isLoading && isInitializedRef.current && widgets.length > 0) {
      try {
        localStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(widgets));
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

  const addWidget = useCallback((type: WidgetConfig['type']) => {
    const { WIDGET_DISPLAY_CONFIG } = require('../types/widgets');
    const config = WIDGET_DISPLAY_CONFIG[type];
    
    const newWidget: WidgetConfig = {
      id: `widget-${type}-${Date.now()}`,
      type,
      title: config.name,
      enabled: true,
      position: { 
        x: 0, 
        y: 0, 
        w: config.defaultW, 
        h: config.defaultH 
      },
      settings: getDefaultSettings(type)
    };
    
    setWidgets(prev => [...prev, newWidget]);
  }, []);

  const removeWidget = useCallback((id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
  }, []);

  const updateWidget = useCallback((id: string, updates: Partial<WidgetConfig>) => {
    setWidgets(prev => prev.map(w => 
      w.id === id ? { ...w, ...updates } : w
    ));
  }, []);

  const updateWidgetSettings = useCallback((id: string, settings: Record<string, any>) => {
    setWidgets(prev => prev.map(w => 
      w.id === id ? { ...w, settings: { ...w.settings, ...settings } } : w
    ));
  }, []);

  const reorderWidgets = useCallback((newOrder: WidgetConfig[]) => {
    setWidgets(newOrder);
  }, []);

  const toggleWidget = useCallback((id: string) => {
    setWidgets(prev => prev.map(w => 
      w.id === id ? { ...w, enabled: !w.enabled } : w
    ));
  }, []);

  return {
    widgets,
    addWidget,
    removeWidget,
    updateWidget,
    updateWidgetSettings,
    reorderWidgets,
    toggleWidget,
    isLoading,
    isSyncing
  };
}

// 获取默认设置
function getDefaultSettings(type: WidgetConfig['type']): Record<string, any> {
  switch (type) {
    case 'weather':
      return { city: '北京', showHumidity: true, showWind: true, unit: 'celsius' };
    case 'todo':
      return { showCompleted: false, maxItems: 5 };
    case 'hotsearch':
      return { sources: ['weibo', 'zhihu'], maxItems: 10 };
    case 'rss':
      return { feeds: [], maxItems: 5, updateInterval: 30 };
    case 'countdown':
      return { events: [] };
    case 'exchange':
      return { fromCurrency: 'USD', toCurrency: 'CNY', amount: 100 };
    case 'lifeprogress':
      return { birthDate: '1990-01-01', lifeExpectancy: 80 };
    case 'zen':
      return { soundEnabled: true, animationEnabled: true };
    default:
      return {};
  }
}
