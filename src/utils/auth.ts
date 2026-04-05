/**
 * 安全认证管理模块
 * 替换硬编码凭据，提供统一的权限管理
 */

import { createHash, randomBytes } from 'crypto';

// 认证配置接口
export interface AuthConfig {
  adminUsername: string;
  adminPasswordHash: string;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
}

// 认证结果接口
export interface AuthResult {
  success: boolean;
  token?: string;
  error?: string;
  attemptsRemaining?: number;
  lockoutUntil?: number;
}

// 会话信息接口
export interface SessionInfo {
  userId: string;
  username: string;
  loginTime: number;
  expiresAt: number;
  permissions: string[];
}

// 权限枚举
export enum Permission {
  VIEW_DATA = 'view_data',
  EDIT_DATA = 'edit_data',
  DELETE_DATA = 'delete_data',
  MANAGE_USERS = 'manage_users',
  SYSTEM_CONFIG = 'system_config',
  EXPORT_DATA = 'export_data',
  IMPORT_DATA = 'import_data',
  MANAGE_PRIVACY = 'manage_privacy'
}

// 默认配置 (生产环境应从环境变量读取)
const DEFAULT_CONFIG: AuthConfig = {
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH || '',
  sessionTimeout: 24 * 60 * 60 * 1000, // 24小时
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000 // 15分钟
};

// 登录尝试记录
interface LoginAttempt {
  count: number;
  lastAttempt: number;
  lockoutUntil?: number;
}

const loginAttempts = new Map<string, LoginAttempt>();

/**
 * 生成密码哈希
 */
export function hashPassword(password: string, salt?: string): string {
  const actualSalt = salt || randomBytes(16).toString('hex');
  const hash = createHash('sha256')
    .update(password + actualSalt)
    .digest('hex');
  return `${actualSalt}:${hash}`;
}

/**
 * 验证密码
 */
export function verifyPassword(password: string, hashedPassword: string): boolean {
  const [salt, hash] = hashedPassword.split(':');
  if (!salt || !hash) return false;
  
  const computedHash = createHash('sha256')
    .update(password + salt)
    .digest('hex');
  
  return computedHash === hash;
}

/**
 * 生成会话令牌
 */
export function generateSessionToken(userId: string, username: string): string {
  const payload = {
    userId,
    username,
    iat: Date.now(),
    exp: Date.now() + DEFAULT_CONFIG.sessionTimeout
  };
  
  const token = Buffer.from(JSON.stringify(payload)).toString('base64');
  return token;
}

/**
 * 验证会话令牌
 */
export function verifySessionToken(token: string): SessionInfo | null {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    
    if (Date.now() > payload.exp) {
      return null; // 令牌已过期
    }
    
    return {
      userId: payload.userId,
      username: payload.username,
      loginTime: payload.iat,
      expiresAt: payload.exp,
      permissions: getDefaultPermissions(payload.username)
    };
  } catch {
    return null;
  }
}

/**
 * 获取默认权限
 */
export function getDefaultPermissions(username: string): string[] {
  const adminPermissions = Object.values(Permission);
  const userPermissions = [
    Permission.VIEW_DATA,
    Permission.EDIT_DATA,
    Permission.EXPORT_DATA,
    Permission.IMPORT_DATA
  ];
  
  return username === DEFAULT_CONFIG.adminUsername ? adminPermissions : userPermissions;
}

/**
 * 检查登录尝试限制
 */
export function checkLoginAttempts(identifier: string): { allowed: boolean; lockoutUntil?: number } {
  const attempts = loginAttempts.get(identifier);
  
  if (!attempts) {
    return { allowed: true };
  }
  
  // 检查是否在锁定期
  if (attempts.lockoutUntil && Date.now() < attempts.lockoutUntil) {
    return { 
      allowed: false, 
      lockoutUntil: attempts.lockoutUntil 
    };
  }
  
  // 检查尝试次数
  if (attempts.count >= DEFAULT_CONFIG.maxLoginAttempts) {
    const lockoutUntil = Date.now() + DEFAULT_CONFIG.lockoutDuration;
    loginAttempts.set(identifier, {
      ...attempts,
      lockoutUntil: lockoutUntil
    });
    
    return { 
      allowed: false, 
      lockoutUntil: lockoutUntil
    };
  }
  
  return { allowed: true };
}

/**
 * 记录登录尝试
 */
export function recordLoginAttempt(identifier: string, success: boolean): void {
  const current = loginAttempts.get(identifier) || { count: 0, lastAttempt: 0 };
  
  if (success) {
    // 成功登录，重置计数
    loginAttempts.set(identifier, { count: 0, lastAttempt: Date.now() });
  } else {
    // 失败登录，增加计数
    loginAttempts.set(identifier, {
      count: current.count + 1,
      lastAttempt: Date.now(),
      lockoutUntil: current.lockoutUntil
    });
  }
}

/**
 * 认证用户
 */
export async function authenticateUser(
  identifier: string, 
  password: string
): Promise<AuthResult> {
  // 检查登录限制
  const rateLimit = checkLoginAttempts(identifier);
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `账户已锁定，请在 ${new Date(rateLimit.lockoutUntil!).toLocaleTimeString()} 后重试`,
      lockoutUntil: rateLimit.lockoutUntil
    };
  }
  
  // 验证管理员凭据
  if (identifier === DEFAULT_CONFIG.adminUsername) {
    if (verifyPassword(password, DEFAULT_CONFIG.adminPasswordHash)) {
      recordLoginAttempt(identifier, true);
      
      const token = generateSessionToken('admin', DEFAULT_CONFIG.adminUsername);
      return {
        success: true,
        token
      };
    }
  }
  
  // 验证失败
  recordLoginAttempt(identifier, false);
  const attempts = loginAttempts.get(identifier);
  
  return {
    success: false,
    error: '用户名或密码错误',
    attemptsRemaining: Math.max(0, DEFAULT_CONFIG.maxLoginAttempts - (attempts?.count || 0))
  };
}

/**
 * 检查权限
 */
export function hasPermission(
  session: SessionInfo | null, 
  permission: Permission
): boolean {
  if (!session) return false;
  return session.permissions.includes(permission);
}

/**
 * 安全存储敏感数据
 */
export function secureStore(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    // 简单加密存储 (生产环境应使用更强的加密)
    const encrypted = Buffer.from(value).toString('base64');
    localStorage.setItem(`secure_${key}`, encrypted);
  } catch (error) {
    console.error('安全存储失败:', error);
  }
}

/**
 * 安全读取敏感数据
 */
export function secureRetrieve(key: string): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const encrypted = localStorage.getItem(`secure_${key}`);
    if (!encrypted) return null;
    
    // 解密
    return Buffer.from(encrypted, 'base64').toString();
  } catch (error) {
    console.error('安全读取失败:', error);
    return null;
  }
}

/**
 * 清除敏感数据
 */
export function secureClear(key: string): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(`secure_${key}`);
}

// 初始化默认管理员密码哈希 (仅用于开发环境)
if (process.env.NODE_ENV === 'development' && !DEFAULT_CONFIG.adminPasswordHash) {
  console.warn('⚠️ 开发环境：使用默认管理员密码，请设置 ADMIN_PASSWORD_HASH 环境变量');
  DEFAULT_CONFIG.adminPasswordHash = hashPassword('admin123');
}
