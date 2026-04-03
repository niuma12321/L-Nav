import { useState, useEffect, useCallback, useRef } from 'react';
import { WidgetConfig, DEFAULT_WIDGETS } from '../components/v6/widgetTypes';

const WIDGETS_STORAGE_KEY = 'ynav-widgets-v9';
const WIDGETS_SYNC_CHANNEL = 'ynav-widgets-sync';

export function useWidgetSystem() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const bcRef = useRef<BroadcastChannel | null>(null);

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

  // Load widgets from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(WIDGETS_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setWidgets(parsed);
      } catch {
        setWidgets(DEFAULT_WIDGETS);
      }
    } else {
      setWidgets(DEFAULT_WIDGETS);
    }
    setIsLoaded(true);
  }, []);

  // Save widgets to localStorage and sync
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(WIDGETS_STORAGE_KEY, JSON.stringify(widgets));
      syncWidgets(widgets);
    }
  }, [widgets, isLoaded, syncWidgets]);

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
    removeWidget
  };
}
