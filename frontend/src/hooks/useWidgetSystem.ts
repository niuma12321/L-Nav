import { useState, useEffect, useCallback } from 'react';
import { WidgetConfig, DEFAULT_WIDGETS } from '../components/v6/widgetTypes';

const WIDGETS_STORAGE_KEY = 'ynav-widgets-v9';

export function useWidgetSystem() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [editMode, setEditMode] = useState(false);

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

  // Save widgets to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(WIDGETS_STORAGE_KEY, JSON.stringify(widgets));
    }
  }, [widgets, isLoaded]);

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
    reorderWidgets
  };
}
