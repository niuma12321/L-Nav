import { useState, useCallback, useEffect } from 'react';
import { WidgetConfig, DEFAULT_WIDGETS, WIDGET_STORAGE_KEY } from '../types/widgets';

export interface UseWidgetsReturn {
  widgets: WidgetConfig[];
  addWidget: (type: WidgetConfig['type']) => void;
  removeWidget: (id: string) => void;
  updateWidget: (id: string, updates: Partial<WidgetConfig>) => void;
  updateWidgetSettings: (id: string, settings: Record<string, any>) => void;
  reorderWidgets: (newOrder: WidgetConfig[]) => void;
  toggleWidget: (id: string) => void;
  isLoading: boolean;
}

export function useWidgets(): UseWidgetsReturn {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    }
  }, []);

  // 保存到 localStorage
  useEffect(() => {
    if (!isLoading && widgets.length > 0) {
      try {
        localStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(widgets));
      } catch (error) {
        console.error('保存小组件配置失败:', error);
      }
    }
  }, [widgets, isLoading]);

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
    isLoading
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
