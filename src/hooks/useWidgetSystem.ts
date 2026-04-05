import { useState, useEffect, useCallback, useRef } from 'react';
import { WidgetConfig, DEFAULT_WIDGETS } from '../components/v6/widgetTypes';
import {
  initDefaultUser,
  getCurrentUserId,
  getCanonicalUserStorageKey,
  getUserData,
  setUserData,
  YNAV_DATA_SYNCED_EVENT,
  YNAV_USER_STORAGE_UPDATED_EVENT
} from '../utils/constants';

const WIDGETS_STORAGE_KEY = 'ynav-widgets-v9';
const WIDGETS_SYNC_CHANNEL = 'ynav-widgets-sync';

const normalizeWidgets = (storedWidgets: WidgetConfig[]) => {
  const safeWidgets = Array.isArray(storedWidgets) ? storedWidgets : [];
  const mergedWidgets = safeWidgets.map((widget, index) => ({
    ...widget,
    order: widget.order ?? index,
    position: {
      desktop: widget.position?.desktop || widget.position || { x: 0, y: 0, w: 4, h: 2 },
      mobile: widget.position?.mobile || { order: index }
    }
  }));

  DEFAULT_WIDGETS.forEach((defaultWidget) => {
    const exists = mergedWidgets.find((widget) => widget.id === defaultWidget.id);
    if (!exists) {
      mergedWidgets.push({
        ...defaultWidget,
        order: mergedWidgets.length
      });
    }
  });

  return mergedWidgets
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((widget, index) => ({
      ...widget,
      order: index,
      position: {
        desktop: widget.position.desktop,
        mobile: {
          ...(widget.position.mobile || { order: index }),
          order: widget.position.mobile?.order ?? index
        }
      }
    }));
};

export function useWidgetSystem() {
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return initDefaultUser();
  });

  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const bcRef = useRef<BroadcastChannel | null>(null);

  const loadWidgets = useCallback(() => {
    const userId = getCurrentUserId() || initDefaultUser();
    setCurrentUserId(userId);

    const storedWidgets = getUserData<WidgetConfig[]>(WIDGETS_STORAGE_KEY, []);
    const nextWidgets = normalizeWidgets(storedWidgets.length > 0 ? storedWidgets : DEFAULT_WIDGETS);
    setWidgets(nextWidgets);
    setIsLoaded(true);
  }, []);

  const persistWidgets = useCallback((nextWidgets: WidgetConfig[]) => {
    const normalizedWidgets = normalizeWidgets(nextWidgets);
    setWidgets(normalizedWidgets);
    setUserData(WIDGETS_STORAGE_KEY, normalizedWidgets);

    if (bcRef.current) {
      bcRef.current.postMessage({ type: 'WIDGETS_UPDATED', widgets: normalizedWidgets });
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkUserChange = () => {
      const nextUserId = getCurrentUserId();
      if (nextUserId && nextUserId !== currentUserId) {
        setCurrentUserId(nextUserId);
        setIsLoaded(false);
        loadWidgets();
      }
    };

    const interval = setInterval(checkUserChange, 1000);
    return () => clearInterval(interval);
  }, [currentUserId, loadWidgets]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bcRef.current = new BroadcastChannel(WIDGETS_SYNC_CHANNEL);
      bcRef.current.onmessage = (event) => {
        if (event.data.type === 'WIDGETS_UPDATED') {
          setWidgets(normalizeWidgets(event.data.widgets || []));
        }
      };
    }

    return () => {
      bcRef.current?.close();
    };
  }, []);

  useEffect(() => {
    loadWidgets();
  }, [loadWidgets]);

  useEffect(() => {
    const syncableKeys = new Set([
      WIDGETS_STORAGE_KEY,
      getCanonicalUserStorageKey(WIDGETS_STORAGE_KEY)
    ]);

    const reloadWidgets = (changedKeys: string[] = []) => {
      if (changedKeys.some((changedKey) => syncableKeys.has(changedKey))) {
        loadWidgets();
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key && syncableKeys.has(event.key)) {
        loadWidgets();
      }
    };

    const handleCustomEvent = (event: Event) => {
      const changedKeys = (event as CustomEvent<{ changedKeys?: string[] }>).detail?.changedKeys || [];
      reloadWidgets(changedKeys);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(YNAV_DATA_SYNCED_EVENT, handleCustomEvent as EventListener);
    window.addEventListener(YNAV_USER_STORAGE_UPDATED_EVENT, handleCustomEvent as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(YNAV_DATA_SYNCED_EVENT, handleCustomEvent as EventListener);
      window.removeEventListener(YNAV_USER_STORAGE_UPDATED_EVENT, handleCustomEvent as EventListener);
    };
  }, [loadWidgets]);

  const toggleWidget = useCallback((id: string) => {
    persistWidgets(widgets.map((widget) =>
      widget.id === id ? { ...widget, enabled: !widget.enabled } : widget
    ));
  }, [persistWidgets, widgets]);

  const updateWidgetPosition = useCallback((id: string, position: WidgetConfig['position']) => {
    persistWidgets(widgets.map((widget) =>
      widget.id === id
        ? {
            ...widget,
            position: {
              desktop: position.desktop || widget.position.desktop,
              mobile: position.mobile || widget.position.mobile
            }
          }
        : widget
    ));
  }, [persistWidgets, widgets]);

  const updateWidgetSettings = useCallback((id: string, settings: Record<string, any>) => {
    persistWidgets(widgets.map((widget) =>
      widget.id === id ? { ...widget, settings: { ...widget.settings, ...settings } } : widget
    ));
  }, [persistWidgets, widgets]);

  const reorderWidgets = useCallback((newOrder: string[]) => {
    const currentWidgets = normalizeWidgets(widgets);
    const orderedWidgets: WidgetConfig[] = [];

    newOrder.forEach((id) => {
      const widget = currentWidgets.find((item) => item.id === id);
      if (widget) orderedWidgets.push(widget);
    });

    currentWidgets.forEach((widget) => {
      if (!newOrder.includes(widget.id)) {
        orderedWidgets.push(widget);
      }
    });

    persistWidgets(orderedWidgets.map((widget, index) => ({
      ...widget,
      order: index,
      position: {
        desktop: widget.position.desktop,
        mobile: {
          ...(widget.position.mobile || { order: index }),
          order: index
        }
      }
    })));
  }, [persistWidgets, widgets]);

  const addWidget = useCallback((widget: WidgetConfig) => {
    persistWidgets([
      ...widgets,
      {
        ...widget,
        order: widgets.length,
        position: {
          desktop: widget.position?.desktop || { x: 0, y: 0, w: 4, h: 3 },
          mobile: widget.position?.mobile || { order: widgets.length }
        }
      }
    ]);
  }, [persistWidgets, widgets]);

  const removeWidget = useCallback((id: string) => {
    const nextWidgets = widgets.filter((widget) => !(widget.id === id && !widget.isFixed));
    persistWidgets(nextWidgets);
  }, [persistWidgets, widgets]);

  const updateWidget = useCallback((updatedWidget: WidgetConfig) => {
    persistWidgets(widgets.map((widget) =>
      widget.id === updatedWidget.id ? updatedWidget : widget
    ));
  }, [persistWidgets, widgets]);

  const enabledWidgets = widgets.filter((widget) => widget.enabled);

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
