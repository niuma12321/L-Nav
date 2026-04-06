/**
 * ========================================
 * Y-Nav v9 - ljq 个人专属配置
 * ========================================
 */

// 个人专属账号配置
export const OWNER_CONFIG = {
  username: 'ljq',
  password: 'jk712732',
  siteName: 'ljq的导航站',
  version: 'v9.0.0_ljq'
};

// 固定存储前缀（所有设备统一，保证同步一致性）
const STORAGE_PREFIX = 'ynav_ljq_v9_';

/**
 * 生成完整存储键
 * @param baseKey 基础键名
 * @returns 带前缀的完整存储键
 */
export const getStorageKey = (baseKey: string): string => {
  return `${STORAGE_PREFIX}${baseKey}`;
};

/**
 * 读取数据（自动迁移旧格式）
 * @param key 基础键名
 * @param defaultValue 默认值
 * @returns 解析后的数据
 */
export const getData = <T>(key: string, defaultValue: T): T => {
  try {
    const fullKey = getStorageKey(key);
    const value = localStorage.getItem(fullKey);
    
    if (value === null) {
      // 自动迁移所有历史格式数据
      const oldKeys = [
        key,
        `user_default_${key}`,
        `user_ljq_${key}`,
        `user_${localStorage.getItem('ynav_current_user')}_${key}` 
      ];
      
      for (const oldKey of oldKeys) {
        const oldValue = localStorage.getItem(oldKey);
        if (oldValue !== null) {
          localStorage.setItem(fullKey, oldValue);
          localStorage.removeItem(oldKey);
          console.log(`✅ 数据迁移成功: ${key}`);
          return JSON.parse(oldValue) as T;
        }
      }
      
      return defaultValue;
    }
    
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`❌ 读取数据失败 [${key}]:`, error);
    return defaultValue;
  }
};

/**
 * 写入数据（自动触发备份）
 * @param key 基础键名
 * @param value 要存储的数据
 */
export const setData = <T>(key: string, value: T): void => {
  try {
    const fullKey = getStorageKey(key);
    localStorage.setItem(fullKey, JSON.stringify(value));
    
    // 写入后自动触发备份检查
    autoBackup();
  } catch (error) {
    console.error(`❌ 写入数据失败 [${key}]:`, error);
  }
};

/**
 * 删除数据
 * @param key 基础键名
 */
export const deleteData = (key: string): void => {
  try {
    const fullKey = getStorageKey(key);
    localStorage.removeItem(fullKey);
  } catch (error) {
    console.error(`❌ 删除数据失败 [${key}]:`, error);
  }
};

/**
 * 验证访问密码
 * @param password 用户输入的密码
 * @returns 验证结果
 */
export const verifyAccessPassword = (password: string): boolean => {
  return password === OWNER_CONFIG.password;
};

/**
 * ========================================
 * 存储Key常量
 * ========================================
 */
export const STORAGE_KEYS = {
  // 核心数据
  LOCAL_DATA: 'ynav_data_cache_v2',
  AI_CONFIG: 'ynav_ai_config',
  SEARCH_CONFIG: 'ynav_search_config',
  SITE_SETTINGS: 'ynav_site_settings',
  THEME: 'theme',

  // 同步系统
  DEVICE_ID: 'ynav_device_id',
  DEVICE_INFO: 'ynav_device_info',
  SYNC_META: 'ynav_sync_meta',
  SYNC_PASSWORD: 'ynav_sync_password',
  VIEW_PASSWORD: 'ynav_view_password',
  LAST_SYNC: 'ynav_last_sync',
  WEBMASTER_UNLOCKED: 'ynav_webmaster_unlocked',

  // 用户系统 - 保留兼容
  CURRENT_USER: 'ynav_current_user',
  USER_PROFILES: 'ynav_user_profiles',

  // 隐私保险箱
  PRIVATE_VAULT: 'ynav_private_vault_v1',
  PRIVACY_PASSWORD: 'ynav_privacy_password',
  PRIVACY_USE_SEPARATE_PWD: 'ynav_privacy_use_separate_password',
  PRIVACY_GROUP_ENABLED: 'ynav_privacy_group_enabled',
  PRIVACY_AUTO_UNLOCK: 'ynav_privacy_auto_unlock',
  PRIVACY_SESSION_UNLOCKED: 'ynav_privacy_session_unlocked',
  PRIVATE_CATEGORY: '__private__',

  // 缓存
  FAVICON_CACHE: 'ynav_favicon_cache'
} as const;

// 兼容旧代码导出
export const LOCAL_STORAGE_KEY = STORAGE_KEYS.LOCAL_DATA;
export const AI_CONFIG_KEY = STORAGE_KEYS.AI_CONFIG;
export const SEARCH_CONFIG_KEY = STORAGE_KEYS.SEARCH_CONFIG;
export const FAVICON_CACHE_KEY = STORAGE_KEYS.FAVICON_CACHE;
export const SITE_SETTINGS_KEY = STORAGE_KEYS.SITE_SETTINGS;
export const THEME_KEY = STORAGE_KEYS.THEME;
export const NOTES_STORAGE_KEY = 'ynav_notes';
export const RSS_ITEMS_KEY = 'rss_items_cache';
export const LAB_NOTES_KEY = 'lab_notes_v1';
export const SMART_HOME_PREFERENCES_KEY = 'smart_home_preferences';
export const AUTOMATION_PREFERENCES_KEY = 'automation_preferences';

export const CURRENT_USER_KEY = STORAGE_KEYS.CURRENT_USER;
export const USER_PROFILES_KEY = STORAGE_KEYS.USER_PROFILES;
export const DEVICE_ID_KEY = STORAGE_KEYS.DEVICE_ID;
export const DEVICE_INFO_KEY = STORAGE_KEYS.DEVICE_INFO;
export const SYNC_META_KEY = STORAGE_KEYS.SYNC_META;
export const SYNC_PASSWORD_KEY = STORAGE_KEYS.SYNC_PASSWORD;
export const VIEW_PASSWORD_KEY = STORAGE_KEYS.VIEW_PASSWORD;
export const LAST_SYNC_KEY = STORAGE_KEYS.LAST_SYNC;
export const WEBMASTER_UNLOCKED_KEY = STORAGE_KEYS.WEBMASTER_UNLOCKED;

export const PRIVATE_VAULT_KEY = STORAGE_KEYS.PRIVATE_VAULT;
export const PRIVACY_PASSWORD_KEY = STORAGE_KEYS.PRIVACY_PASSWORD;
export const PRIVACY_USE_SEPARATE_PASSWORD_KEY = STORAGE_KEYS.PRIVACY_USE_SEPARATE_PWD;
export const PRIVACY_GROUP_ENABLED_KEY = STORAGE_KEYS.PRIVACY_GROUP_ENABLED;
export const PRIVACY_AUTO_UNLOCK_KEY = STORAGE_KEYS.PRIVACY_AUTO_UNLOCK;
export const PRIVACY_SESSION_UNLOCKED_KEY = STORAGE_KEYS.PRIVACY_SESSION_UNLOCKED;
export const PRIVATE_CATEGORY_ID = STORAGE_KEYS.PRIVATE_CATEGORY;

// 图标缓存过期时间 (7天)
export const FAVICON_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

/**
 * ========================================
 * 自动备份系统
 * ========================================
 */

const BACKUP_KEY = 'auto_backups';
const MAX_BACKUPS = 30; // 保留最近 30 天的备份
const BACKUP_INTERVAL = 24 * 60 * 60 * 1000; // 每天备份一次

/**
 * 获取所有需要备份的数据
 */
const getAllData = (): Record<string, any> => {
  return {
    links_data: getData('links_data', []),
    ynav_widgets_v9: getData('ynav-widgets-v9', []),
    site_settings: getData('site_settings', {}),
    ai_config: getData('ai_config', {}),
    ynav_notes: getData('ynav-notes', []),
    theme: getData('theme', 'dark'),
    search_config: getData('search_config', {}),
    rss_sources: getData('rss_sources', []),
    rss_items_cache: getData('rss_items_cache', {}),
    weather_city: getData('weather_city', '北京'),
    ynav_private_vault_v1: getData('ynav_private_vault_v1', {}),
    ynav_privacy_password: getData('ynav_privacy_password', ''),
    ynav_privacy_group_enabled: getData('ynav_privacy_group_enabled', false)
  };
};

/**
 * 自动备份数据（每天一次）
 */
export const autoBackup = (): void => {
  try {
    const now = Date.now();
    const backups = getData<Array<{ timestamp: number; date: string; data: any }>>(BACKUP_KEY, []);
    
    // 检查今天是否已经备份过
    if (backups.length > 0 && now - backups[0].timestamp < BACKUP_INTERVAL) {
      return;
    }
    
    // 创建新备份
    const newBackup = {
      timestamp: now,
      date: new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      data: getAllData()
    };
    
    // 保留最近 MAX_BACKUPS 个备份
    const updatedBackups = [newBackup, ...backups].slice(0, MAX_BACKUPS);
    
    // 直接保存备份（不触发 autoBackup 避免递归）
    const fullKey = getStorageKey(BACKUP_KEY);
    localStorage.setItem(fullKey, JSON.stringify(updatedBackups));
    
    console.log(`✅ 自动备份完成，共保留 ${updatedBackups.length} 个备份`);
  } catch (error) {
    console.error('❌ 自动备份失败:', error);
  }
};

/**
 * 获取所有备份列表
 */
export const getBackups = () => {
  return getData<Array<{ timestamp: number; date: string; data: any }>>(BACKUP_KEY, []);
};

/**
 * 从指定备份恢复数据
 * @param backupIndex 备份索引
 * @returns 恢复结果
 */
export const restoreFromBackup = (backupIndex: number): boolean => {
  try {
    const backups = getBackups();
    const backup = backups[backupIndex];
    
    if (!backup) {
      return false;
    }
    
    Object.entries(backup.data).forEach(([key, value]) => {
      if (value !== null) {
        setData(key, value);
      }
    });
    
    return true;
  } catch (error) {
    console.error('❌ 恢复备份失败:', error);
    return false;
  }
};

/**
 * 删除指定备份
 * @param backupIndex 备份索引
 */
export const deleteBackup = (backupIndex: number): void => {
  try {
    const backups = getBackups();
    backups.splice(backupIndex, 1);
    
    const fullKey = getStorageKey(BACKUP_KEY);
    localStorage.setItem(fullKey, JSON.stringify(backups));
  } catch (error) {
    console.error('❌ 删除备份失败:', error);
  }
};

/**
 * 导出所有数据为 JSON 文件
 */
export const exportAllData = (): string => {
  return JSON.stringify({
    version: OWNER_CONFIG.version,
    exportDate: new Date().toLocaleString('zh-CN'),
    owner: OWNER_CONFIG.username,
    data: getAllData()
  }, null, 2);
};

/**
 * 从 JSON 文件导入所有数据
 * @param jsonString 导入的 JSON 字符串
 * @returns 导入结果
 */
export const importAllData = (jsonString: string): boolean => {
  try {
    const imported = JSON.parse(jsonString);
    
    // 验证数据格式和所有者
    if (!imported.data || imported.owner !== OWNER_CONFIG.username) {
      return false;
    }
    
    Object.entries(imported.data).forEach(([key, value]) => {
      if (value !== null) {
        setData(key, value);
      }
    });
    
    return true;
  } catch (error) {
    console.error('❌ 导入数据失败:', error);
    return false;
  }
};

/**
 * 清空所有数据（危险操作）
 */
export const clearAllData = (): void => {
  const keysToDelete = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_PREFIX)) {
      keysToDelete.push(key);
    }
  }
  
  keysToDelete.forEach(key => localStorage.removeItem(key));
};

/**
 * ========================================
 * 旧版兼容函数（使用新 getData/setData）
 * ========================================
 */

/** @deprecated 使用 getData */
export const getUserData = <T>(key: string, defaultValue: T): T => {
  return getData(key, defaultValue);
};

/** @deprecated 使用 setData */
export const setUserData = <T>(key: string, value: T): void => {
  setData(key, value);
};

/** @deprecated 使用 deleteData */
export const deleteUserData = (key: string): void => {
  deleteData(key);
};

/** @deprecated 使用 deleteData */
export const clearUserData = (key: string): void => {
  deleteData(key);
};

/** @deprecated 使用 getStorageKey */
export const getUserStorageKey = (baseKey: string): string => {
  return getStorageKey(baseKey);
};

/**
 * ========================================
 * 设备信息工具
 * ========================================
 */

const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

let cachedBrowser: string | null = null;
let cachedOS: string | null = null;

export const getBrowserInfo = (): string => {
  if (cachedBrowser) return cachedBrowser;
  if (!isBrowser) return 'Server';
  
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) cachedBrowser = 'Firefox';
  else if (ua.includes('SamsungBrowser')) cachedBrowser = 'Samsung Internet';
  else if (ua.includes('Opera') || ua.includes('OPR')) cachedBrowser = 'Opera';
  else if (ua.includes('Trident')) cachedBrowser = 'Internet Explorer';
  else if (ua.includes('Edge') || ua.includes('Edg')) cachedBrowser = 'Edge';
  else if (ua.includes('Chrome')) cachedBrowser = 'Chrome';
  else if (ua.includes('Safari')) cachedBrowser = 'Safari';
  else cachedBrowser = 'Unknown';
  
  return cachedBrowser;
};

export const getOSInfo = (): string => {
  if (cachedOS) return cachedOS;
  if (!isBrowser) return 'Server';
  
  const ua = navigator.userAgent;
  const platform = navigator.platform;
  
  if (/Win/i.test(platform)) cachedOS = 'Windows';
  else if (/Mac/i.test(platform)) cachedOS = 'macOS';
  else if (/Linux/i.test(platform)) cachedOS = 'Linux';
  else if (/Android/i.test(ua)) cachedOS = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) cachedOS = 'iOS';
  else cachedOS = 'Unknown';
  
  return cachedOS;
};

let deviceIdCache: string | null = null;

export const getDeviceId = (): string => {
  if (deviceIdCache) return deviceIdCache;
  if (!isBrowser) return 'server_device';
  
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  
  deviceIdCache = deviceId;
  return deviceId;
};

export const getDeviceInfo = () => {
  if (!isBrowser) {
    return { id: 'server_device', browser: 'Server', os: 'Unknown', createdAt: Date.now() };
  }
  
  const infoStr = localStorage.getItem(DEVICE_INFO_KEY);
  if (infoStr) {
    try {
      return JSON.parse(infoStr);
    } catch {}
  }
  
  const deviceInfo = {
    id: getDeviceId(),
    browser: getBrowserInfo(),
    os: getOSInfo(),
    createdAt: Date.now()
  };
  
  localStorage.setItem(DEVICE_INFO_KEY, JSON.stringify(deviceInfo));
  return deviceInfo;
};

/**
 * ========================================
 * 用户系统（简化版，仅保留兼容）
 * ========================================
 */

export const getCurrentUserId = (): string | null => {
  if (!isBrowser) return null;
  return 'ljq';
};

export const setCurrentUser = (userId: string, userName?: string): void => {
  if (!isBrowser) return;
  localStorage.setItem(CURRENT_USER_KEY, 'ljq');
};

export const initDefaultUser = (): string => {
  if (!isBrowser) return 'ljq';
  localStorage.setItem(CURRENT_USER_KEY, 'ljq');
  return 'ljq';
};

export const switchUser = (userId: string): void => {
  window.location.reload();
};

export const getUserProfiles = () => {
  return [{ id: 'ljq', name: 'ljq', createdAt: Date.now(), lastActiveAt: Date.now() }];
};

export const getUserStoragePrefix = (): string => {
  return STORAGE_PREFIX;
};

/**
 * ========================================
 * 存储工具函数
 * ========================================
 */

export const clearStorage = (...keys: string[]): void => {
  if (!isBrowser) return;
  keys.forEach(key => localStorage.removeItem(getStorageKey(key)));
};

export const clearAllAppStorage = (): void => {
  if (!isBrowser) return;
  clearAllData();
};

export const isStorageExpired = (timestamp: number, ttl: number): boolean => {
  return Date.now() - timestamp > ttl;
};

export const getFormattedDeviceName = (deviceId?: string): string => {
  if (!deviceId) return '未知设备';
  const info = getDeviceInfo();
  return `${info.browser} (${info.os})`;
};

export const getCanonicalUserStorageKey = (typeOrKey: string): string => {
  return getStorageKey(typeOrKey);
};

export const readSyncableUserData = <T>(typeOrKey: string, defaultValue: T): T => {
  return getData(typeOrKey, defaultValue);
};

export const writeSyncableUserData = <T>(typeOrKey: string, value: T): void => {
  setData(typeOrKey, value);
};

export const clearSyncableUserData = (typeOrKey: string): void => {
  deleteData(typeOrKey);
};

/**
 * ========================================
 * 其他常量
 * ========================================
 */

export const GITHUB_REPO_URL = 'https://github.com/niuma12321/L-Nav.git';

// 安全属性
export const SAFE_LINK_ATTRIBUTES = {
  target: '_blank',
  rel: 'noopener,noreferrer'
};

// 事件名称（保留兼容）
export const YNAV_DATA_SYNCED_EVENT = 'ynav-data-synced';
export const YNAV_USER_STORAGE_UPDATED_EVENT = 'ynav-user-storage-updated';

// 同步配置（保留兼容，实际不使用）
export const SYNC_DEBOUNCE_MS = 3000;
export const SYNC_API_ENDPOINT = '/api/v1/sync';
export const SYNC_API_VERSION = 'v1';
export const SYNC_DATA_SCHEMA_VERSION = 1;
