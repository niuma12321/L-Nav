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
  const isFirstLoadRef = useRef(true);

  // 合并小组件（云端优先，补充本地独有）
  const mergeWidgets = useCallback((local: WidgetConfig[], cloud: WidgetConfig[]): WidgetConfig[] => {
    const merged = [...cloud];
    const cloudIds = new Set(cloud.map(w => w.id));
    
    // 添加本地独有的小组件
    local.forEach(localWidget => {
      if (!cloudIds.has(localWidget.id)) {
        merged.push(localWidget);
      }
    });
    
    return merged;
  }, []);

  // 推送到云端
  const pushToCloud = useCallback(async (widgetsToPush: WidgetConfig[]) => {
    try {
      console.log('[Widgets] Pushing to cloud...');
      
      const response = await fetch(`${SYNC_API_BASE}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          links: [],
          categories: [],
          widgets: widgetsToPush
        })
      });
      
      const responseJson = await response.json();
      console.log('[Widgets] Push result:', responseJson);
      
      if (responseJson.success) {
        console.log('[Widgets] Synced to cloud successfully');
      }
    } catch (e) {
      console.error('[Widgets] Failed to push to cloud:', e);
    }
  }, []);

  // 延迟同步（防抖）
  const debouncedSync = useCallback((newWidgets: WidgetConfig[]) => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    syncTimeoutRef.current = setTimeout(() => {
      pushToCloud(newWidgets);
    }, 3000); // 3秒后同步
  }, [pushToCloud]);

  // 从云端拉取
  const pullFromCloud = useCallback(async () => {
    try {
      setIsSyncing(true);
      console.log('[Widgets] Pulling from cloud...');
      
      const response = await fetch(`${SYNC_API_BASE}/sync`);
      const responseJson = await response.json();
      
      if (responseJson.success && responseJson.data) {
        const cloudWidgets = responseJson.data.widgets || [];
        
        console.log('[Widgets] Cloud data:', cloudWidgets.length, 'widgets');
        
        // 如果云端有数据，合并到本地
        if (cloudWidgets.length > 0) {
          const mergedWidgets = mergeWidgets(widgets, cloudWidgets);
          
          setWidgets(mergedWidgets);
          localStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(mergedWidgets));
          
          console.log('[Widgets] Merged with cloud:', mergedWidgets.length, 'widgets');
          
          // 推送合并后的数据到云端统一
          await pushToCloud(mergedWidgets);
        }
      }
    } catch (e) {
      console.error('[Widgets] Failed to pull from cloud:', e);
    } finally {
      setIsSyncing(false);
    }
  }, [widgets, mergeWidgets, pushToCloud]);

  // 从 localStorage 加载小组件配置
  useEffect(() => {
    try {
      const stored = localStorage.getItem(WIDGET_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWidgets(parsed);
        } else {
          setWidgets(DEFAULT_WIDGETS);
        }
      } else {
        setWidgets(DEFAULT_WIDGETS);
      }
    } catch (error) {
      console.error('加载小组件配置失败:', error);
      setWidgets(DEFAULT_WIDGETS);
    } finally {
      setIsLoading(false);
      isFirstLoadRef.current = false;
      
      // 从云端拉取并合并
      (async () => { await pullFromCloud(); })();
    }
  }, [pullFromCloud]);

  // 保存到 localStorage 并同步到云端
  useEffect(() => {
    if (!isLoading && widgets.length > 0) {
      try {
        localStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(widgets));
        
        // 同步到云端（防抖）
        if (!isFirstLoadRef.current) {
          debouncedSync(widgets);
        }
      } catch (error) {
        console.error('[Widgets] 保存失败:', error);
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
