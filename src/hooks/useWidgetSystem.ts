import { useState, useEffect, useCallback, useRef } from 'react';
import { WidgetConfig, DEFAULT_WIDGETS } from '../components/v6/widgetTypes';
import { 
  initDefaultUser,
  getUserStorageKey,
  getCurrentUserId
} from '../utils/constants';

const WIDGETS_STORAGE_KEY = 'ynav-widgets-v9';
const WIDGETS_SYNC_CHANNEL = 'ynav-widgets-sync';

export function useWidgetSystem() {
  // 确保有默认用户
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return initDefaultUser();
  });
  
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const bcRef = useRef<BroadcastChannel | null>(null);

  // 监听用户变化
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkUserChange = () => {
      const newUserId = getCurrentUserId();
      if (newUserId && newUserId !== currentUserId) {
        console.log('[WidgetSystem] User changed from', currentUserId, 'to', newUserId);
        setCurrentUserId(newUserId);
        setIsLoaded(false);
      }
    };
    
    const interval = setInterval(checkUserChange, 1000);
    return () => clearInterval(interval);
  }, [currentUserId]);

  // 获取当前用户的存储键
  const getStorageKey = useCallback(() => {
    return getUserStorageKey(WIDGETS_STORAGE_KEY);
  }, [currentUserId]);

  // Initialize BroadcastChannel for cross-tab sync
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bcRef.current = new BroadcastChannel(WIDGETS_SYNC_CHANNEL);
      bcRef.current.onmessage = (event) => {
        if (event.data.type === 'WIDGETS_UPDATED') {
          setWidgets(event.data.widgets);
        }
      };
    }
    return () => {
      bcRef.current?.close();
    };
  }, []);

  // Sync widgets to other tabs
  const syncWidgets = useCallback((newWidgets: WidgetConfig[]) => {
    if (bcRef.current) {
      bcRef.current.postMessage({ type: 'WIDGETS_UPDATED', widgets: newWidgets });
    }
  }, []);

  // Load widgets from localStorage and merge with new default widgets
  useEffect(() => {
    if (!currentUserId) return;
    
    const storageKey = getStorageKey();
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Merge stored widgets with new default widgets
          const mergedWidgets = [...parsed];
          // Add any new default widgets that don't exist in stored data
          DEFAULT_WIDGETS.forEach(defaultWidget => {
            const exists = mergedWidgets.find(w => w.id === defaultWidget.id);
            if (!exists) {
              mergedWidgets.push(defaultWidget);
            }
          });
          setWidgets(mergedWidgets);
        } else {
          setWidgets(DEFAULT_WIDGETS);
        }
      } catch {
        setWidgets(DEFAULT_WIDGETS);
      }
    } else {
      setWidgets(DEFAULT_WIDGETS);
    }
    setIsLoaded(true);
  }, [currentUserId, getStorageKey]);

  // Save widgets to localStorage and sync
  useEffect(() => {
    if (isLoaded && currentUserId) {
      const storageKey = getStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(widgets));
      syncWidgets(widgets);
    }
  }, [widgets, isLoaded, currentUserId, getStorageKey, syncWidgets]);

  const toggleWidget = useCallback((id: string) => {
    setWidgets(prev => prev.map(w => 
      w.id === id ? { ...w, enabled: !w.enabled } : w
    ));
  }, []);

  const updateWidgetPosition = useCallback((id: string, position: WidgetConfig['position']) => {
    setWidgets(prev => prev.map(w => 
      w.id === id ? { ...w, position } : w
    ));
  }, []);

  const updateWidgetSettings = useCallback((id: string, settings: Record<string, any>) => {
    setWidgets(prev => prev.map(w => 
      w.id === id ? { ...w, settings: { ...w.settings, ...settings } } : w
    ));
  }, []);

  const reorderWidgets = useCallback((newOrder: string[]) => {
    setWidgets(prev => {
      const ordered: WidgetConfig[] = [];
      newOrder.forEach(id => {
        const widget = prev.find(w => w.id === id);
        if (widget) ordered.push(widget);
      });
      // Add any widgets not in newOrder
      prev.forEach(w => {
        if (!newOrder.includes(w.id)) ordered.push(w);
      });
      return ordered;
    });
  }, []);

  const addWidget = useCallback((widget: WidgetConfig) => {
    setWidgets(prev => [...prev, widget]);
  }, []);

  const removeWidget = useCallback((id: string) => {
    setWidgets(prev => {
      const widget = prev.find(w => w.id === id);
      if (widget?.isFixed) {
        return prev; // 固定组件不可删除
      }
      return prev.filter(w => w.id !== id);
    });
  }, []);

  const updateWidget = useCallback((updatedWidget: WidgetConfig) => {
    setWidgets(prev => prev.map(w => 
      w.id === updatedWidget.id ? updatedWidget : w
    ));
  }, []);

  const enabledWidgets = widgets.filter(w => w.enabled);

  return {
    widgets,
    enabledWidgets,
    isLoaded,
    editMode,
    setEditMode,
    toggleWidget,
    updateWidgetPosition,
    updateWidgetSettings,
    reorderWidgets,
    addWidget,
    removeWidget,
    updateWidget,
    currentUserId
  };
}
