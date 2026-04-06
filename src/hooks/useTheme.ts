import { useState, useEffect, useCallback } from 'react';
import {
    getCanonicalUserStorageKey,
    getData,
    setData,
    YNAV_DATA_SYNCED_EVENT,
    YNAV_USER_STORAGE_UPDATED_EVENT
} from '../utils/constants';

export type ThemeMode = 'light' | 'dark' | 'system';

export function useTheme() {
    const [themeMode, setThemeMode] = useState<ThemeMode>('system');
    const [darkMode, setDarkMode] = useState(false);

    const applyThemeMode = useCallback((mode: ThemeMode) => {
        if (typeof window === 'undefined') return;
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const shouldUseDark = mode === 'dark' || (mode === 'system' && prefersDark);
        setDarkMode(shouldUseDark);
        if (shouldUseDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const setThemeAndApply = useCallback((mode: ThemeMode) => {
        setThemeMode(mode);
        setData('theme', mode);
        applyThemeMode(mode);
    }, [applyThemeMode]);

    const toggleTheme = useCallback(() => {
        const nextMode: ThemeMode = themeMode === 'light'
            ? 'dark'
            : themeMode === 'dark'
                ? 'system'
                : 'light';
        setThemeAndApply(nextMode);
    }, [themeMode, setThemeAndApply]);

    // Initialize theme on mount
    useEffect(() => {
        const storedTheme = getData<ThemeMode>('theme', 'system');
        const initialMode: ThemeMode = storedTheme === 'dark' || storedTheme === 'light' || storedTheme === 'system'
            ? storedTheme
            : 'system';
        setThemeMode(initialMode);
        applyThemeMode(initialMode);
    }, [applyThemeMode]);

    // Listen for system theme changes
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            if (themeMode === 'system') {
                applyThemeMode('system');
            }
        };

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleChange);
        } else {
            mediaQuery.addListener(handleChange);
        }

        return () => {
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener('change', handleChange);
            } else {
                mediaQuery.removeListener(handleChange);
            }
        };
    }, [themeMode, applyThemeMode]);

    useEffect(() => {
        const syncableKeys = new Set(['theme', getCanonicalUserStorageKey('theme')]);

        const reloadTheme = (changedKeys: string[] = []) => {
            if (!changedKeys.some((changedKey) => syncableKeys.has(changedKey))) return;

            const newMode = getData<ThemeMode>('theme', 'system');
            const nextMode: ThemeMode = newMode === 'dark' || newMode === 'light' || newMode === 'system'
                ? newMode
                : 'system';

            setThemeMode(nextMode);
            applyThemeMode(nextMode);
        };

        const handleStorageChange = (event: StorageEvent) => {
            if (event.key && syncableKeys.has(event.key)) {
                reloadTheme([event.key]);
            }
        };

        const handleCustomEvent = (event: Event) => {
            const changedKeys = (event as CustomEvent<{ changedKeys?: string[] }>).detail?.changedKeys || [];
            reloadTheme(changedKeys);
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener(YNAV_DATA_SYNCED_EVENT, handleCustomEvent as EventListener);
        window.addEventListener(YNAV_USER_STORAGE_UPDATED_EVENT, handleCustomEvent as EventListener);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener(YNAV_DATA_SYNCED_EVENT, handleCustomEvent as EventListener);
            window.removeEventListener(YNAV_USER_STORAGE_UPDATED_EVENT, handleCustomEvent as EventListener);
        };
    }, [applyThemeMode]);

    return {
        themeMode,
        darkMode,
        toggleTheme,
        setThemeAndApply
    };
}
