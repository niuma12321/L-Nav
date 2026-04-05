/**
 * 配置管理 Hook - 类型安全、高性能的应用配置管理器
 * @version 2.0.0
 * @description 管理 AI 配置和站点设置，支持数据验证、迁移、备份和开发工具
 * 
 * @example
 * ```tsx
 * const {
 *   // AI 配置
 *   aiConfig,
 *   saveAIConfig,
 *   updateAIConfig,
 *   resetAIConfig,
 *   validateAIConfig,
 *   
 *   // 站点设置
 *   siteSettings,
 *   updateSiteSettings,
 *   resetSiteSettings,
 *   handleViewModeChange,
 *   
 *   // 配置操作
 *   exportConfig,
 *   importConfig,
 *   resetAllConfig,
 *   
 *   // 派生状态
 *   navTitleText,
 *   navTitleShort,
 *   isDefaultConfig,
 *   configVersion
 * } = useConfig();
 * ```
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AIConfig, SiteSettings } from '../types';
import { 
  AI_CONFIG_KEY, 
  SITE_SETTINGS_KEY,
  clearUserData,
  getCanonicalUserStorageKey,
  getUserData,
  setUserData,
  YNAV_DATA_SYNCED_EVENT,
  YNAV_USER_STORAGE_UPDATED_EVENT
} from '../utils/constants';

// ============ 类型定义 ============

export interface ConfigState {
    aiConfig: AIConfig;
    siteSettings: SiteSettings;
    lastUpdated: number;
    version: string;
}

export interface ConfigValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

export interface ConfigExport {
    aiConfig: AIConfig;
    siteSettings: SiteSettings;
    exportedAt: number;
    version: string;
}

// ============ 常量配置 ============

const CONFIG_VERSION = '2.0.0';
const CONFIG_SCHEMA_VERSION = 2;

const DEFAULT_AI_CONFIG: AIConfig = {
    provider: 'gemini',
    apiKey: '',
    baseUrl: '',
    model: 'gemini-2.5-flash'
} as const;

const DEFAULT_SITE_SETTINGS: SiteSettings = {
    title: '元启 - AI 智能导航',
    navTitle: '元启',
    favicon: '',
    cardStyle: 'detailed',
    siteMode: 'personal',
    accentColor: '99 102 241',
    grayScale: 'slate',
    closeOnBackdrop: false,
    backgroundImage: '',
    backgroundImageEnabled: false,
    backgroundMotion: true,
    backgroundSource: 'custom',
    bingAutoUpdate: false,
    bingLastUpdate: ''
} as const;

// ============ 工具函数 ============

    // 安全 localStorage 操作 - 使用用户维度存储
const safeStorage = {
    get: <T>(key: string, defaultValue: T): T => {
        return getUserData(key, defaultValue);
    },
    set: <T>(key: string, value: T): boolean => {
        try {
            setUserData(key, value);
            return true;
        } catch (error) {
            if (import.meta.env.DEV) {
                console.error(`[Config] Failed to save ${key}:`, error);
            }
            return false;
        }
    },
    remove: (key: string): void => {
        try {
            clearUserData(key);
        } catch (error) {
            if (import.meta.env.DEV) {
                console.warn(`[Config] Failed to remove ${key}:`, error);
            }
        }
    }
};

/**
 * 数据验证函数
 */
const validateAIConfig = (config: Partial<AIConfig>): ConfigValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (config.provider && !['gemini', 'openai', 'anthropic', 'custom'].includes(config.provider)) {
        errors.push(`不支持的 AI 提供商: ${config.provider}`);
    }

    if (config.apiKey && config.apiKey.length < 8) {
        warnings.push('API Key 长度过短，可能无效');
    }

    if (config.baseUrl && !config.baseUrl.startsWith('http')) {
        errors.push('Base URL 必须以 http:// 或 https:// 开头');
    }

    if (config.model && typeof config.model === 'string' && config.model.trim().length === 0) {
        errors.push('模型名称不能为空');
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
};

const validateSiteSettings = (settings: Partial<SiteSettings>): ConfigValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (settings.title && settings.title.length > 100) {
        warnings.push('标题过长，可能显示不完整');
    }

    if (settings.navTitle && settings.navTitle.length > 20) {
        warnings.push('导航标题过长');
    }

    if (settings.cardStyle && !['detailed', 'simple'].includes(settings.cardStyle)) {
        errors.push(`不支持的卡片样式: ${settings.cardStyle}`);
    }

    if (settings.siteMode && !['personal', 'webmaster'].includes(settings.siteMode)) {
        errors.push(`不支持的站点模式: ${settings.siteMode}`);
    }

    if (settings.accentColor) {
        const rgbPattern = /^\d{1,3}\s+\d{1,3}\s+\d{1,3}$/;
        if (!rgbPattern.test(settings.accentColor)) {
            errors.push('强调色格式错误，应为 "R G B" 格式');
        }
    }

    if (settings.grayScale && !['slate', 'zinc', 'neutral'].includes(settings.grayScale)) {
        errors.push(`不支持的灰度色调: ${settings.grayScale}`);
    }

    if (settings.favicon && !settings.favicon.startsWith('data:') && !settings.favicon.startsWith('http')) {
        warnings.push('Favicon URL 格式可能不正确');
    }

    if (settings.backgroundImage && !settings.backgroundImage.startsWith('data:') && !settings.backgroundImage.startsWith('http')) {
        warnings.push('背景图片 URL 格式可能不正确');
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
};

/**
 * 数据迁移函数
 */
const migrateAIConfig = (config: any): AIConfig => {
    // 如果没有版本号，说明是旧版本
    if (!config._schemaVersion) {
        return {
            ...DEFAULT_AI_CONFIG,
            ...config,
            _schemaVersion: CONFIG_SCHEMA_VERSION
        };
    }

    // 已经是最新版本
    if (config._schemaVersion === CONFIG_SCHEMA_VERSION) {
        return config;
    }

    // 未来可以添加更多迁移逻辑
    return config;
};

const migrateSiteSettings = (settings: any): SiteSettings => {
    if (!settings._schemaVersion) {
        return {
            ...DEFAULT_SITE_SETTINGS,
            ...settings,
            _schemaVersion: CONFIG_SCHEMA_VERSION
        };
    }

    if (settings._schemaVersion === CONFIG_SCHEMA_VERSION) {
        return settings;
    }

    return settings;
};

// ============ Hook 实现 ============

export function useConfig() {
    // Refs 用于性能优化
    const isMountedRef = useRef(true);
    const lastUpdateRef = useRef<number>(0);

    // ============ 状态管理 ============

    // AI Config
    const [aiConfig, setAiConfig] = useState<AIConfig>(() => {
        const saved = safeStorage.get(AI_CONFIG_KEY, null);
        if (saved) {
            return migrateAIConfig(saved);
        }
        return { ...DEFAULT_AI_CONFIG, _schemaVersion: CONFIG_SCHEMA_VERSION };
    });

    // Site Settings
    const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => {
        const saved = safeStorage.get(SITE_SETTINGS_KEY, null);
        if (saved) {
            return migrateSiteSettings(saved);
        }
        return { ...DEFAULT_SITE_SETTINGS, _schemaVersion: CONFIG_SCHEMA_VERSION };
    });

    // 配置变更历史（用于开发调试）
    const [configHistory, setConfigHistory] = useState<ConfigState[]>([]);

    // ============ 计算属性 (useMemo 优化) ============

    /**
     * 派生的导航标题
     */
    const navTitleText = useMemo(() => 
        siteSettings.navTitle || '元启',
        [siteSettings.navTitle]
    );

    const navTitleShort = useMemo(() => 
        navTitleText.slice(0, 2),
        [navTitleText]
    );

    /**
     * 是否为默认配置
     */
    const isDefaultConfig = useMemo(() => {
        const aiIsDefault = JSON.stringify(aiConfig) === JSON.stringify({ ...DEFAULT_AI_CONFIG, _schemaVersion: CONFIG_SCHEMA_VERSION });
        const settingsIsDefault = JSON.stringify(siteSettings) === JSON.stringify({ ...DEFAULT_SITE_SETTINGS, _schemaVersion: CONFIG_SCHEMA_VERSION });
        return aiIsDefault && settingsIsDefault;
    }, [aiConfig, siteSettings]);

    /**
     * 配置版本信息
     */
    const configVersion = useMemo(() => ({
        version: CONFIG_VERSION,
        schemaVersion: CONFIG_SCHEMA_VERSION,
        lastUpdated: lastUpdateRef.current
    }), []);

    // ============ 基础操作 ============

    /**
     * 保存 AI 配置
     */
    const saveAIConfig = useCallback((config: AIConfig, newSiteSettings?: SiteSettings) => {
        // 验证配置
        const validation = validateAIConfig(config);
        if (!validation.valid) {
    if (validation.errors.length > 0 && import.meta.env.DEV) {
            console.error('[Config] AI Config validation failed:', validation.errors);
    }
        return false;
        }

        // 保存历史（开发环境）
        if (process.env.NODE_ENV === 'development') {
            setConfigHistory(prev => [{
                aiConfig,
                siteSettings: newSiteSettings || siteSettings,
                lastUpdated: Date.now(),
                version: CONFIG_VERSION
            }, ...prev].slice(0, 20));
        }

        // 更新状态
        const configWithVersion = { ...config, _schemaVersion: CONFIG_SCHEMA_VERSION };
        setAiConfig(configWithVersion);
        safeStorage.set(AI_CONFIG_KEY, configWithVersion);
        lastUpdateRef.current = Date.now();

        // 同时更新站点设置 - 确保合并而非替换，避免丢失必应相关字段
        if (newSiteSettings) {
            const mergedSettings = {
                ...siteSettings,
                ...newSiteSettings,
                // 确保必应壁纸相关字段不会丢失
                backgroundSource: newSiteSettings.backgroundSource ?? siteSettings.backgroundSource ?? 'custom',
                bingAutoUpdate: newSiteSettings.bingAutoUpdate ?? siteSettings.bingAutoUpdate ?? false,
                bingLastUpdate: newSiteSettings.bingLastUpdate ?? siteSettings.bingLastUpdate ?? ''
            };
            const settingsValidation = validateSiteSettings(mergedSettings);
            if (!settingsValidation.valid) {
                console.error('[Config] Site Settings validation failed:', settingsValidation.errors);
                return false;
            }

            const settingsWithVersion = { ...mergedSettings, _schemaVersion: CONFIG_SCHEMA_VERSION };
            setSiteSettings(settingsWithVersion);
            safeStorage.set(SITE_SETTINGS_KEY, settingsWithVersion);
            
            // 触发站点设置更新事件，确保数据同步
            window.dispatchEvent(new CustomEvent('ynav-site-settings-updated', {
                detail: { settings: mergedSettings, timestamp: Date.now() }
            }));
        }

        return true;
    }, [siteSettings]);

    /**
     * 部分更新 AI 配置
     */
    const updateAIConfig = useCallback((updates: Partial<AIConfig>) => {
        setAiConfig(prev => {
            const newConfig = { ...prev, ...updates };
            const validation = validateAIConfig(newConfig);
            
    if (validation.warnings.length > 0 && import.meta.env.DEV) {
            console.warn('[Config] AI Config validation warnings:', validation.warnings);
    }

            const configWithVersion = { ...newConfig, _schemaVersion: CONFIG_SCHEMA_VERSION };
            safeStorage.set(AI_CONFIG_KEY, configWithVersion);
            lastUpdateRef.current = Date.now();
            
            return configWithVersion;
        });
    }, []);

    /**
     * 重置 AI 配置
     */
    const resetAIConfig = useCallback(() => {
        const defaultConfig = { ...DEFAULT_AI_CONFIG, _schemaVersion: CONFIG_SCHEMA_VERSION };
        setAiConfig(defaultConfig);
        safeStorage.set(AI_CONFIG_KEY, defaultConfig);
        lastUpdateRef.current = Date.now();
        return true;
    }, []);

    /**
     * 恢复 AI 配置（从备份）
     */
    const restoreAIConfig = useCallback((config: AIConfig) => {
        const migrated = migrateAIConfig(config);
        const validation = validateAIConfig(migrated);
        
        if (!validation.valid) {
            console.error('[Config] Invalid AI config for restore:', validation.errors);
            return false;
        }

        const configWithVersion = { ...migrated, _schemaVersion: CONFIG_SCHEMA_VERSION };
        setAiConfig(configWithVersion);
        safeStorage.set(AI_CONFIG_KEY, configWithVersion);
        lastUpdateRef.current = Date.now();
        return true;
    }, []);

    /**
     * 更新站点设置 - 简化版：直接保存并触发同步
     */
    const updateSiteSettings = useCallback((updates: Partial<SiteSettings>) => {
        setSiteSettings(prev => {
            const newSettings = { ...prev, ...updates };
            const settingsWithVersion = { ...newSettings, _schemaVersion: CONFIG_SCHEMA_VERSION };
            safeStorage.set(SITE_SETTINGS_KEY, settingsWithVersion);
            lastUpdateRef.current = Date.now();
            
            // 触发同步事件
            window.dispatchEvent(new CustomEvent('ynav-data-changed', {
                detail: { type: 'site_settings', timestamp: Date.now() }
            }));
            
            return settingsWithVersion;
        });
    }, []);

    // 数据一致性检查：确保必应相关字段始终存在
    useEffect(() => {
        const missingFields = [];
        if (siteSettings.backgroundSource === undefined) missingFields.push('backgroundSource');
        if (siteSettings.bingAutoUpdate === undefined) missingFields.push('bingAutoUpdate');
        if (siteSettings.bingLastUpdate === undefined) missingFields.push('bingLastUpdate');
        
        if (missingFields.length > 0) {
            console.warn('[Config] 检测到缺失的必应壁纸字段，正在修复:', missingFields);
            const fixes: Partial<SiteSettings> = {};
            if (siteSettings.backgroundSource === undefined) fixes.backgroundSource = 'custom';
            if (siteSettings.bingAutoUpdate === undefined) fixes.bingAutoUpdate = false;
            if (siteSettings.bingLastUpdate === undefined) fixes.bingLastUpdate = '';
            updateSiteSettings(fixes);
        }
    }, [siteSettings.backgroundSource, siteSettings.bingAutoUpdate, siteSettings.bingLastUpdate, updateSiteSettings]);

    /**
     * 重置站点设置
     */
    const resetSiteSettings = useCallback(() => {
        const defaultSettings = { ...DEFAULT_SITE_SETTINGS, _schemaVersion: CONFIG_SCHEMA_VERSION };
        setSiteSettings(defaultSettings);
        safeStorage.set(SITE_SETTINGS_KEY, defaultSettings);
        lastUpdateRef.current = Date.now();
        return true;
    }, []);

    /**
     * 恢复站点设置（从同步）
     */
    const restoreSiteSettings = useCallback((settings: SiteSettings) => {
        const migrated = migrateSiteSettings(settings);
        const validation = validateSiteSettings(migrated);
        
        if (!validation.valid) {
            console.error('[Config] Invalid site settings for restore:', validation.errors);
            return false;
        }

        const settingsWithVersion = { ...migrated, _schemaVersion: CONFIG_SCHEMA_VERSION };
        setSiteSettings(settingsWithVersion);
        safeStorage.set(SITE_SETTINGS_KEY, settingsWithVersion);
        lastUpdateRef.current = Date.now();
        return true;
    }, []);

    /**
     * 切换视图模式
     */
    const handleViewModeChange = useCallback((cardStyle: 'detailed' | 'simple') => {
        updateSiteSettings({ cardStyle });
    }, [updateSiteSettings]);

    // ============ 高级功能 ============

    /**
     * 导出配置
     */
    const exportConfig = useCallback((): ConfigExport => {
        return {
            aiConfig: { ...aiConfig, apiKey: '' }, // 导出时清空 API Key
            siteSettings,
            exportedAt: Date.now(),
            version: CONFIG_VERSION
        };
    }, [aiConfig, siteSettings]);

    /**
     * 导入配置
     */
    const importConfig = useCallback((data: ConfigExport): boolean => {
        // 验证导入数据
        const aiValidation = validateAIConfig(data.aiConfig);
        const settingsValidation = validateSiteSettings(data.siteSettings);

        if (!aiValidation.valid || !settingsValidation.valid) {
        if (aiValidation.errors.length > 0 && import.meta.env.DEV) {
            console.error('[Config] Import validation failed:', { aiErrors: aiValidation.errors });
        }
        if (settingsValidation.errors.length > 0 && import.meta.env.DEV) {
            console.error('[Config] Import validation failed:', { settingsErrors: settingsValidation.errors });
        }
        return false;
        }

        // 保存配置
        const aiWithVersion = { ...data.aiConfig, _schemaVersion: CONFIG_SCHEMA_VERSION };
        const settingsWithVersion = { ...data.siteSettings, _schemaVersion: CONFIG_SCHEMA_VERSION };

        setAiConfig(aiWithVersion);
        setSiteSettings(settingsWithVersion);
        safeStorage.set(AI_CONFIG_KEY, aiWithVersion);
        safeStorage.set(SITE_SETTINGS_KEY, settingsWithVersion);
        lastUpdateRef.current = Date.now();

        return true;
    }, []);

    /**
     * 重置所有配置
     */
    const resetAllConfig = useCallback(() => {
        resetAIConfig();
        resetSiteSettings();
        return true;
    }, [resetAIConfig, resetSiteSettings]);

    // ============ 副作用 ============

    /**
     * 更新页面标题和 favicon
     */
    useEffect(() => {
        if (!isMountedRef.current) return;

        // 更新页面标题
        if (siteSettings.title) {
            document.title = siteSettings.title;
        }

        // 更新 favicon
        if (siteSettings.favicon) {
            try {
                // 移除现有 favicon
                const existingFavicons = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');
                existingFavicons.forEach(favicon => favicon.remove());

                // 添加新 favicon
                const favicon = document.createElement('link');
                favicon.rel = 'icon';
                favicon.href = siteSettings.favicon;
                document.head.appendChild(favicon);
            } catch (error) {
            // 仅在开发环境显示错误
            if (import.meta.env.DEV) {
              console.error('[Config] Failed to update favicon:', error);
            }
            }
        }
    }, [siteSettings.title, siteSettings.favicon]);

    useEffect(() => {
        const syncableKeys = new Set([
            AI_CONFIG_KEY,
            SITE_SETTINGS_KEY,
            'ai_config',
            'site_settings',
            getCanonicalUserStorageKey('ai_config'),
            getCanonicalUserStorageKey('site_settings')
        ]);

        const reloadConfig = (changedKeys: string[] = []) => {
            if (!changedKeys.some((changedKey) => syncableKeys.has(changedKey))) return;

            const savedAIConfig = safeStorage.get(AI_CONFIG_KEY, null);
            const savedSiteSettings = safeStorage.get(SITE_SETTINGS_KEY, null);

            if (savedAIConfig) {
                setAiConfig(migrateAIConfig(savedAIConfig));
            }

            if (savedSiteSettings) {
                setSiteSettings(migrateSiteSettings(savedSiteSettings));
            }
        };

        const handleStorageChange = (event: StorageEvent) => {
            if (event.key && syncableKeys.has(event.key)) {
                reloadConfig([event.key]);
            }
        };

        const handleCustomEvent = (event: Event) => {
            const changedKeys = (event as CustomEvent<{ changedKeys?: string[] }>).detail?.changedKeys || [];
            reloadConfig(changedKeys);
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener(YNAV_DATA_SYNCED_EVENT, handleCustomEvent as EventListener);
        window.addEventListener(YNAV_USER_STORAGE_UPDATED_EVENT, handleCustomEvent as EventListener);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener(YNAV_DATA_SYNCED_EVENT, handleCustomEvent as EventListener);
            window.removeEventListener(YNAV_USER_STORAGE_UPDATED_EVENT, handleCustomEvent as EventListener);
        };
    }, []);

    /**
     * 清理函数
     */
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // ============ 开发工具（仅开发环境） ============

    const devTools = useMemo(() => {
        if (process.env.NODE_ENV !== 'development') {
            return null;
        }

        return {
            getConfigHistory: () => configHistory,
            clearHistory: () => setConfigHistory([]),
            inspectConfig: () => ({
                aiConfig,
                siteSettings,
                isDefault: isDefaultConfig,
                version: configVersion
            }),
            forceUpdate: () => {
                lastUpdateRef.current = Date.now();
                setAiConfig(prev => ({ ...prev }));
                setSiteSettings(prev => ({ ...prev }));
            }
        };
    }, [aiConfig, siteSettings, configHistory, isDefaultConfig, configVersion]);

    // 暴露到全局（开发环境）
    useEffect(() => {
        if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
            (window as any).__YNAV_CONFIG__ = {
                aiConfig,
                siteSettings,
                updateAIConfig,
                updateSiteSettings,
                resetAllConfig,
                exportConfig,
                devTools
            };
        }
    }, [aiConfig, siteSettings, updateAIConfig, updateSiteSettings, resetAllConfig, exportConfig, devTools]);

    // ============ 返回值 ============

    return {
        // AI 配置
        aiConfig,
        saveAIConfig,
        updateAIConfig,
        resetAIConfig,
        restoreAIConfig,
        validateAIConfig: () => validateAIConfig(aiConfig),

        // 站点设置
        siteSettings,
        updateSiteSettings,
        resetSiteSettings,
        restoreSiteSettings,
        handleViewModeChange,
        validateSiteSettings: () => validateSiteSettings(siteSettings),

        // 配置操作
        exportConfig,
        importConfig,
        resetAllConfig,

        // 派生状态
        navTitleText,
        navTitleShort,
        isDefaultConfig,
        configVersion,

        // 开发工具
        ...(devTools ? { devTools } : {})
    };
}

// ============ 便捷导出 ============

export type UseConfigReturn = ReturnType<typeof useConfig>;
