// ==============================================
// 🎯 类型定义 (Type Definitions) - 严格类型校验
// ==============================================
/** 设备信息 */
export interface DeviceInfo {
  id: string;
  browser: string;
  os: string;
  createdAt: number;
  formattedCreatedAt?: string;
}

/** 存储版本配置 */
interface StorageVersion {
  readonly current: number;
  readonly legacy: string[];
}

// ==============================================
// 🔐 本地存储 Key 常量 (只读 + 严格分组)
// ==============================================
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

// 兼容旧代码导出 (不破坏原有项目引用)
export const LOCAL_STORAGE_KEY = STORAGE_KEYS.LOCAL_DATA;
export const AI_CONFIG_KEY = STORAGE_KEYS.AI_CONFIG;
export const SEARCH_CONFIG_KEY = STORAGE_KEYS.SEARCH_CONFIG;
export const FAVICON_CACHE_KEY = STORAGE_KEYS.FAVICON_CACHE;
export const SITE_SETTINGS_KEY = STORAGE_KEYS.SITE_SETTINGS;
export const THEME_KEY = STORAGE_KEYS.THEME;

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

// ==============================================
// ⚙️ 系统配置常量
// ==============================================
/** 同步防抖时间 (3秒) */
export const SYNC_DEBOUNCE_MS = 3000;
/** 同步 API 地址 */
export const SYNC_API_ENDPOINT = '/api/v1/sync';
/** 同步 API 版本 */
export const SYNC_API_VERSION = 'v1';
/** 数据结构版本 */
export const SYNC_DATA_SCHEMA_VERSION = 1;
/** GitHub 地址 */
export const GITHUB_REPO_URL = 'https://github.com/yml2213/Y-Nav.git';

/** 存储版本管理 */
export const STORAGE_VERSION: StorageVersion = {
  current: 2,
  legacy: ['v1', 'ynav_data_cache']
};

/** 图标缓存过期时间 (7天) */
export const FAVICON_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

// ==============================================
// 🛡️ 安全工具函数 (SSR 兼容 + 防崩溃)
// ==============================================
/**
 * SSR 安全判断：是否在浏览器环境
 */
const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

/**
 * 安全获取 Navigator 对象
 */
const getNavigator = (): Navigator | null => isBrowser ? navigator : null;

// ==============================================
// 🖥️ 浏览器/操作系统检测 (缓存优化 + 安全兼容)
// ==============================================
let cachedBrowser: string | null = null;
let cachedOS: string | null = null;

/**
 * 获取浏览器类型 (缓存结果，避免重复计算)
 */
export const getBrowserInfo = (): string => {
  if (cachedBrowser) return cachedBrowser;
  const ua = getNavigator()?.userAgent || '';

  if (ua.includes('Edg/')) cachedBrowser = 'Edge';
  else if (ua.includes('Chrome/')) cachedBrowser = 'Chrome';
  else if (ua.includes('Firefox/')) cachedBrowser = 'Firefox';
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) cachedBrowser = 'Safari';
  else if (ua.includes('OPR/') || ua.includes('Opera/')) cachedBrowser = 'Opera';
  else cachedBrowser = 'Unknown';

  return cachedBrowser;
};

/**
 * 获取操作系统类型 (缓存结果)
 */
export const getOSInfo = (): string => {
  if (cachedOS) return cachedOS;
  const ua = getNavigator()?.userAgent || '';

  if (ua.includes('Win')) cachedOS = 'Windows';
  else if (ua.includes('Mac')) cachedOS = 'macOS';
  else if (ua.includes('Linux')) cachedOS = 'Linux';
  else if (ua.includes('Android')) cachedOS = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) cachedOS = 'iOS';
  else cachedOS = 'Unknown';

  return cachedOS;
};

// ==============================================
// 📱 设备管理 (增强版 + 永不崩溃 + 格式化)
// ==============================================
/**
 * 生成/获取设备唯一ID (增强版，全局唯一)
 */
export const getDeviceId = (): string => {
  if (!isBrowser) return `server_${Date.now()}`;

  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    // 生成更稳定的唯一ID
    deviceId = `device_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
    // 初始化设备信息
    initDeviceInfo(deviceId);
  } else {
    // 补全旧版本设备信息
    const info = localStorage.getItem(DEVICE_INFO_KEY);
    !info && initDeviceInfo(deviceId);
  }

  return deviceId;
};

/**
 * 初始化设备信息
 */
const initDeviceInfo = (deviceId: string): void => {
  if (!isBrowser) return;

  const deviceInfo: DeviceInfo = {
    id: deviceId,
    browser: getBrowserInfo(),
    os: getOSInfo(),
    createdAt: Date.now(),
    formattedCreatedAt: new Date().toLocaleString('zh-CN')
  };

  localStorage.setItem(DEVICE_INFO_KEY, JSON.stringify(deviceInfo));
};

/**
 * 获取设备信息 (安全解析 + 兜底)
 */
export const getDeviceInfo = (): DeviceInfo => {
  if (!isBrowser) {
    return { id: 'server_device', browser: 'Server', os: 'Unknown', createdAt: Date.now() };
  }

  const infoStr = localStorage.getItem(DEVICE_INFO_KEY);
  if (!infoStr) {
    getDeviceId();
    return JSON.parse(localStorage.getItem(DEVICE_INFO_KEY)!);
  }

  try {
    return JSON.parse(infoStr);
  } catch {
    // 解析失败，重新初始化
    localStorage.removeItem(DEVICE_INFO_KEY);
    return getDeviceInfo();
  }
};

// ==============================================
// ✨ 新增高级功能 (生产必备)
// ==============================================
/**
 * 安全清空指定存储 (支持批量)
 */
export const clearStorage = (...keys: string[]): void => {
  if (!isBrowser) return;
  keys.forEach(key => localStorage.removeItem(key));
};

/**
 * 清空所有应用存储 (保留系统存储)
 */
export const clearAllAppStorage = (): void => {
  if (!isBrowser) return;
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
};

/**
 * 检查存储是否过期
 */
export const isStorageExpired = (timestamp: number, ttl: number): boolean => {
  return Date.now() - timestamp > ttl;
};

/**
 * 获取格式化设备名称 (用于同步冲突面板)
 */
export const getFormattedDeviceName = (deviceId?: string): string => {
  if (!deviceId) return '未知设备';
  const info = getDeviceInfo();
  return `${info.browser} (${info.os})`;
};
