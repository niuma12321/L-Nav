/**
 * Cloudflare Pages Function: Y-Nav KV 同步 API v2.0
 * 
 * 端点:
 *   GET    /api/sync              - 读取云端数据
 *   POST   /api/sync              - 写入云端数据 (带版本校验)
 *   DELETE /api/sync              - 清空所有数据 (危险操作)
 *   GET    /api/sync/health       - 健康检查
 *   GET    /api/sync/stats        - 获取数据统计
 *   GET    /api/sync/whoami       - 验证权限状态
 *   POST   /api/sync/backup       - 创建快照备份
 *   POST   /api/sync/restore      - 从备份恢复
 *   GET    /api/sync/backups      - 获取备份列表
 *   DELETE /api/sync/backup       - 删除指定备份
 *   POST   /api/sync/migrate      - 数据迁移/修复
 */

// ============ 类型定义 ============

interface KVNamespaceInterface {
    get(key: string, type?: 'text' | 'json' | 'arrayBuffer' | 'stream'): Promise<any>;
    put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
    delete(key: string): Promise<void>;
    list(options?: { prefix?: string, limit?: number }): Promise<{ keys: Array<{ name: string; expiration?: number }> }>;
}

interface Env {
    YNAV_KV: KVNamespaceInterface;
    SYNC_PASSWORD?: string;
    VIEW_PASSWORD?: string;
    RATE_LIMITER_KV?: KVNamespaceInterface;
}

interface SyncMetadata {
    updatedAt: number;
    deviceId: string;
    version: number;
    browser?: string;
    os?: string;
    userAgent?: string;
    ip?: string;
}

interface LinkItem {
    id: string;
    title: string;
    url: string;
    icon?: string;
    description?: string;
    categoryId: string;
    createdAt: number;
    hidden?: boolean;
    pinned?: boolean;
    order?: number;
}

interface Category {
    id: string;
    name: string;
    icon: string;
    hidden?: boolean;
}

interface YNavSyncData {
    links: LinkItem[];
    categories: Category[];
    searchConfig?: any;
    aiConfig?: any;
    siteSettings?: any;
    privateVault?: string;
    schemaVersion?: number;
    meta: SyncMetadata;
}

interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    apiVersion?: string;
    conflict?: boolean;
}

// ============ 常量配置 ============

const SYNC_API_VERSION = 'v2';
const KV_MAIN_DATA_KEY = `ynav:data:${SYNC_API_VERSION}`;
const KV_BACKUP_PREFIX = `ynav:backup:${SYNC_API_VERSION}:`;
const KV_LEGACY_MAIN_DATA_KEY = 'ynav:data';
const KV_LEGACY_BACKUP_PREFIX = 'ynav:backup:';
const KV_STATS_KEY = `ynav:stats:${SYNC_API_VERSION}`;
const KV_LOCK_KEY = `ynav:lock:${SYNC_API_VERSION}`;

const BACKUP_TTL_SECONDS = 30 * 24 * 60 * 60;
const MAX_BACKUPS = 50;
const LOCK_TIMEOUT_MS = 10000;
const RATE_LIMIT_WINDOW_MS = 60000;
const RATE_LIMIT_MAX_REQUESTS = 100;

// ============ 工具函数 ============

const generateId = () => Math.random().toString(36).substring(2, 15);

const getClientIp = (request: Request): string => {
    return request.headers.get('cf-connecting-ip') || 
           request.headers.get('x-forwarded-for') || 
           'unknown';
};

const isBackupKeyValid = (backupKey: string) => (
    backupKey.startsWith(KV_BACKUP_PREFIX) || backupKey.startsWith(KV_LEGACY_BACKUP_PREFIX)
);

const getBackupTimestamp = (backupKey: string) => {
    if (backupKey.startsWith(KV_BACKUP_PREFIX)) return backupKey.replace(KV_BACKUP_PREFIX, '');
    if (backupKey.startsWith(KV_LEGACY_BACKUP_PREFIX)) return backupKey.replace(KV_LEGACY_BACKUP_PREFIX, '');
    return backupKey;
};

const getBackupApiVersion = (backupKey: string) => (
    backupKey.startsWith(KV_BACKUP_PREFIX) ? SYNC_API_VERSION : 'legacy'
);

const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// ============ 数据验证 ============

const validateLink = (link: any): link is LinkItem => {
    if (!link || typeof link !== 'object') return false;
    if (typeof link.id !== 'string' || !link.id) return false;
    if (typeof link.title !== 'string' || !link.title) return false;
    if (typeof link.url !== 'string' || !link.url) return false;
    if (typeof link.categoryId !== 'string' || !link.categoryId) return false;
    if (typeof link.createdAt !== 'number') return false;
    return true;
};

const validateCategory = (category: any): category is Category => {
    if (!category || typeof category !== 'object') return false;
    if (typeof category.id !== 'string' || !category.id) return false;
    if (typeof category.name !== 'string' || !category.name) return false;
    if (typeof category.icon !== 'string' || !category.icon) return false;
    return true;
};

const validateSyncData = (data: any): data is YNavSyncData => {
    if (!data || typeof data !== 'object') return false;
    if (!Array.isArray(data.links)) return false;
    if (!Array.isArray(data.categories)) return false;
    if (!data.meta || typeof data.meta !== 'object') return false;
    if (typeof data.meta.version !== 'number') return false;
    if (typeof data.meta.updatedAt !== 'number') return false;
    if (typeof data.meta.deviceId !== 'string') return false;
    
    // 验证链接和分类
    if (!data.links.every(validateLink)) return false;
    if (!data.categories.every(validateCategory)) return false;
    
    return true;
};

// ============ 分布式锁 (防止并发写入冲突) ============

const acquireLock = async (env: Env): Promise<boolean> => {
    const lockValue = `${Date.now()}:${generateId()}`;
    try {
        // 检查是否已有锁
        const existing = await env.YNAV_KV.get(KV_LOCK_KEY);
        if (existing) {
            const [timestamp] = existing.split(':');
            if (Date.now() - parseInt(timestamp) < LOCK_TIMEOUT_MS) {
                return false; // 锁被占用且未超时
            }
        }
        // 获取锁
        await env.YNAV_KV.put(KV_LOCK_KEY, lockValue, {
            expirationTtl: Math.ceil(LOCK_TIMEOUT_MS / 1000)
        });
        return true;
    } catch {
        return false;
    }
};

const releaseLock = async (env: Env): Promise<void> => {
    try {
        await env.YNAV_KV.delete(KV_LOCK_KEY);
    } catch {
        // 忽略释放锁的错误
    }
};

// ============ 请求限流 ============

const checkRateLimit = async (request: Request, env: Env): Promise<{ allowed: boolean; remaining: number; resetTime: number }> => {
    if (!env.RATE_LIMITER_KV) {
        return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS, resetTime: Date.now() + RATE_LIMIT_WINDOW_MS };
    }

    const clientId = getClientIp(request);
    const now = Date.now();
    const windowStart = now - (now % RATE_LIMIT_WINDOW_MS);
    const key = `rate-limit:${clientId}:${windowStart}`;

    try {
        const current = await env.RATE_LIMITER_KV.get(key, 'text');
        const count = current ? parseInt(current) : 0;
        
        if (count >= RATE_LIMIT_MAX_REQUESTS) {
            return { 
                allowed: false, 
                remaining: 0, 
                resetTime: windowStart + RATE_LIMIT_WINDOW_MS 
            };
        }

        await env.RATE_LIMITER_KV.put(key, (count + 1).toString(), {
            expirationTtl: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)
        });

        return { 
            allowed: true, 
            remaining: RATE_LIMIT_MAX_REQUESTS - count - 1, 
            resetTime: windowStart + RATE_LIMIT_WINDOW_MS 
        };
    } catch {
        return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS, resetTime: now + RATE_LIMIT_WINDOW_MS };
    }
};

// ============ 权限验证 ============

const isWriteAuthenticated = (request: Request, env: Env): boolean => {
    if (!env.SYNC_PASSWORD || env.SYNC_PASSWORD.trim() === '') {
        return true;
    }
    const authHeader = request.headers.get('X-Sync-Password');
    return authHeader === env.SYNC_PASSWORD;
};

const getWriteAuthStatus = (request: Request, env: Env) => {
    const passwordRequired = !!(env.SYNC_PASSWORD && env.SYNC_PASSWORD.trim() !== '');
    const canWrite = !passwordRequired || isWriteAuthenticated(request, env);
    return { passwordRequired, canWrite };
};

const isViewAuthenticated = (request: Request, env: Env): boolean => {
    if (!env.VIEW_PASSWORD || env.VIEW_PASSWORD.trim() === '') {
        return false;
    }
    const authHeader = request.headers.get('X-View-Password');
    return authHeader === env.VIEW_PASSWORD;
};

const getViewAuthStatus = (request: Request, env: Env) => {
    const viewPasswordRequired = !!(env.VIEW_PASSWORD && env.VIEW_PASSWORD.trim() !== '');
    const canView = !viewPasswordRequired ? false : isViewAuthenticated(request, env);
    return { viewPasswordRequired, canView };
};

// ============ 数据操作 ============

const loadCurrentData = async (env: Env): Promise<YNavSyncData | null> => {
    try {
        const v1 = await env.YNAV_KV.get(KV_MAIN_DATA_KEY, 'json') as YNavSyncData | null;
        if (v1) return v1;
        const legacy = await env.YNAV_KV.get(KV_LEGACY_MAIN_DATA_KEY, 'json') as YNavSyncData | null;
        return legacy;
    } catch {
        return null;
    }
};

const saveData = async (env: Env, data: YNavSyncData): Promise<void> => {
    await env.YNAV_KV.put(KV_MAIN_DATA_KEY, JSON.stringify(data));
    
    // 更新统计信息
    const stats = {
        lastUpdated: Date.now(),
        totalLinks: data.links.length,
        totalCategories: data.categories.length,
        version: data.meta.version,
        dataSize: JSON.stringify(data).length
    };
    await env.YNAV_KV.put(KV_STATS_KEY, JSON.stringify(stats));
};

const buildSafeData = (data: YNavSyncData, includeHidden: boolean): YNavSyncData => {
    if (includeHidden) {
        return {
            ...data,
            privateVault: undefined,
            aiConfig: undefined
        };
    }

    const visibleCategories = (data.categories || []).filter((c: any) => !c?.hidden);
    const visibleCategoryIds = new Set(visibleCategories.map((c: any) => c.id));
    const visibleLinks = (data.links || []).filter((l: any) => {
        if (l?.hidden) return false;
        if (l?.categoryId && !visibleCategoryIds.has(l.categoryId)) return false;
        return true;
    });

    return {
        ...data,
        links: visibleLinks,
        categories: visibleCategories,
        privateVault: undefined,
        aiConfig: undefined
    };
};

// ============ API 响应生成器 ============

const jsonResponse = <T>(data: ApiResponse<T>, status: number = 200, headers: Record<string, string> = {}): Response => {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Sync-Password, X-View-Password',
            ...headers
        }
    });
};

const successResponse = <T>(data?: T, message?: string): Response => {
    return jsonResponse({
        success: true,
        data,
        message,
        apiVersion: SYNC_API_VERSION
    });
};

const errorResponse = (error: string, status: number = 400): Response => {
    return jsonResponse({
        success: false,
        error,
        apiVersion: SYNC_API_VERSION
    }, status);
};

// ============ API 处理函数 ============

// OPTIONS - CORS 预检
async function handleOptions(): Promise<Response> {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Sync-Password, X-View-Password',
            'Access-Control-Max-Age': '86400'
        }
    });
}

// GET /api/sync/health - 健康检查
async function handleHealth(env: Env): Promise<Response> {
    try {
        const testKey = `health:${Date.now()}`;
        await env.YNAV_KV.put(testKey, 'ok', { expirationTtl: 60 });
        await env.YNAV_KV.delete(testKey);
        
        return successResponse({
            status: 'healthy',
            timestamp: Date.now(),
            kv: 'connected',
            apiVersion: SYNC_API_VERSION
        });
    } catch (error) {
        return errorResponse('KV 连接失败', 503);
    }
}

// GET /api/sync/stats - 获取数据统计
async function handleStats(request: Request, env: Env): Promise<Response> {
    if (!isWriteAuthenticated(request, env)) {
        return errorResponse('Unauthorized', 401);
    }

    try {
        const data = await loadCurrentData(env);
        const stats = await env.YNAV_KV.get(KV_STATS_KEY, 'json');
        
        const [v1Backups, legacyBackups] = await Promise.all([
            env.YNAV_KV.list({ prefix: KV_BACKUP_PREFIX }),
            env.YNAV_KV.list({ prefix: KV_LEGACY_BACKUP_PREFIX })
        ]);
        
        const legacyOnly = legacyBackups.keys.filter(k => !k.name.startsWith(KV_BACKUP_PREFIX));
        const totalBackups = v1Backups.keys.length + legacyOnly.length;

        return successResponse({
            hasData: !!data,
            version: data?.meta?.version || 0,
            lastUpdated: data?.meta?.updatedAt || null,
            totalLinks: data?.links?.length || 0,
            totalCategories: data?.categories?.length || 0,
            totalBackups,
            dataSize: data ? formatBytes(JSON.stringify(data).length) : '0 B',
            cachedStats: stats || null
        });
    } catch (error: any) {
        return errorResponse(error.message || '获取统计失败', 500);
    }
}

// GET /api/sync/whoami - 验证权限状态
async function handleWhoAmI(request: Request, env: Env): Promise<Response> {
    const { passwordRequired, canWrite } = getWriteAuthStatus(request, env);
    const { viewPasswordRequired, canView } = getViewAuthStatus(request, env);
    
    return successResponse({
        apiVersion: SYNC_API_VERSION,
        passwordRequired,
        canWrite,
        viewPasswordRequired,
        canView: canWrite ? true : canView,
        clientIp: getClientIp(request)
    });
}

// GET /api/sync - 读取云端数据
async function handleGet(request: Request, env: Env): Promise<Response> {
    try {
        const data = await loadCurrentData(env);

        if (!data) {
            return successResponse(null, '云端暂无数据');
        }

        const auth = getWriteAuthStatus(request, env);
        const viewAuth = getViewAuthStatus(request, env);
        const siteMode = (data as any)?.siteSettings?.siteMode;
        const isWebmaster = siteMode === 'webmaster';

        if (!isWebmaster) {
            if (!auth.canWrite) {
                return errorResponse('Unauthorized', 401);
            }
            return successResponse(data);
        }

        return successResponse(
            auth.canWrite
                ? data
                : (viewAuth.canView ? buildSafeData(data, true) : buildSafeData(data, false))
        );
    } catch (error: any) {
        return errorResponse(error.message || '读取失败', 500);
    }
}

// POST /api/sync - 写入云端数据
async function handlePost(request: Request, env: Env): Promise<Response> {
    if (!isWriteAuthenticated(request, env)) {
        return errorResponse('Unauthorized: 密码错误或未配置', 401);
    }

    // 获取分布式锁
    const lockAcquired = await acquireLock(env);
    if (!lockAcquired) {
        return errorResponse('服务器繁忙，请稍后重试', 429);
    }

    try {
        const body = await request.json() as {
            data: YNavSyncData;
            expectedVersion?: number;
            createBackup?: boolean;
        };

        if (!body.data) {
            return errorResponse('缺少 data 字段', 400);
        }

        // 数据验证
        if (!validateSyncData(body.data)) {
            return errorResponse('数据格式验证失败', 400);
        }

        const existingData = await loadCurrentData(env);

        // 版本冲突检测
        if (existingData && body.expectedVersion !== undefined) {
            if (existingData.meta.version !== body.expectedVersion) {
                return jsonResponse({
                    success: false,
                    conflict: true,
                    data: existingData,
                    error: '版本冲突，云端数据已被其他设备更新',
                    apiVersion: SYNC_API_VERSION
                }, 409);
            }
        }

        // 自动创建备份
        if (body.createBackup && existingData) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
            const backupKey = `${KV_BACKUP_PREFIX}auto-${timestamp}`;
            await env.YNAV_KV.put(backupKey, JSON.stringify(existingData), {
                expirationTtl: BACKUP_TTL_SECONDS
            });
        }

        // 准备新数据
        const newVersion = existingData ? existingData.meta.version + 1 : 1;
        const dataToSave: YNavSyncData = {
            ...body.data,
            meta: {
                ...body.data.meta,
                updatedAt: Date.now(),
                version: newVersion,
                userAgent: request.headers.get('user-agent') || undefined,
                ip: getClientIp(request)
            }
        };

        await saveData(env, dataToSave);

        return successResponse(dataToSave, '同步成功');
    } catch (error: any) {
        return errorResponse(error.message || '写入失败', 500);
    } finally {
        await releaseLock(env);
    }
}

// DELETE /api/sync - 清空所有数据
async function handleDelete(request: Request, env: Env): Promise<Response> {
    if (!isWriteAuthenticated(request, env)) {
        return errorResponse('Unauthorized', 401);
    }

    const lockAcquired = await acquireLock(env);
    if (!lockAcquired) {
        return errorResponse('服务器繁忙，请稍后重试', 429);
    }

    try {
        // 先创建备份
        const existingData = await loadCurrentData(env);
        if (existingData) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
            const backupKey = `${KV_BACKUP_PREFIX}pre-delete-${timestamp}`;
            await env.YNAV_KV.put(backupKey, JSON.stringify(existingData), {
                expirationTtl: BACKUP_TTL_SECONDS
            });
        }

        // 删除主数据
        await env.YNAV_KV.delete(KV_MAIN_DATA_KEY);
        await env.YNAV_KV.delete(KV_STATS_KEY);

        return successResponse(null, '数据已清空，已自动创建备份');
    } catch (error: any) {
        return errorResponse(error.message || '删除失败', 500);
    } finally {
        await releaseLock(env);
    }
}

// POST /api/sync/backup - 创建快照备份
async function handleBackup(request: Request, env: Env): Promise<Response> {
    if (!isWriteAuthenticated(request, env)) {
        return errorResponse('Unauthorized', 401);
    }

    try {
        const body = await request.json() as { data?: YNavSyncData; label?: string };
        const data = body.data || await loadCurrentData(env);

        if (!data) {
            return errorResponse('没有可备份的数据', 400);
        }

        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-').split('.')[0];
        const label = body.label ? `-${body.label}` : '';
        const backupKey = `${KV_BACKUP_PREFIX}${timestamp}${label}`;

        await env.YNAV_KV.put(backupKey, JSON.stringify(data), {
            expirationTtl: BACKUP_TTL_SECONDS
        });

        // 清理旧备份
        const backups = await env.YNAV_KV.list({ prefix: KV_BACKUP_PREFIX });
        if (backups.keys.length > MAX_BACKUPS) {
            const sortedKeys = backups.keys.sort((a, b) => {
                const aTime = getBackupTimestamp(a.name);
                const bTime = getBackupTimestamp(b.name);
                return aTime.localeCompare(bTime);
            });
            
            const keysToDelete = sortedKeys.slice(0, sortedKeys.length - MAX_BACKUPS);
            await Promise.all(keysToDelete.map(key => env.YNAV_KV.delete(key.name)));
        }

        return successResponse({ backupKey }, `备份成功: ${backupKey}`);
    } catch (error: any) {
        return errorResponse(error.message || '备份失败', 500);
    }
}

// POST /api/sync/restore - 从备份恢复
async function handleRestoreBackup(request: Request, env: Env): Promise<Response> {
    if (!isWriteAuthenticated(request, env)) {
        return errorResponse('Unauthorized', 401);
    }

    const lockAcquired = await acquireLock(env);
    if (!lockAcquired) {
        return errorResponse('服务器繁忙，请稍后重试', 429);
    }

    try {
        const body = await request.json() as { backupKey?: string; deviceId?: string };
        const backupKey = body.backupKey;

        if (!backupKey || !isBackupKeyValid(backupKey)) {
            return errorResponse('无效的备份 key', 400);
        }

        const backupData = await env.YNAV_KV.get(backupKey, 'json') as YNavSyncData | null;
        if (!backupData) {
            return errorResponse('备份不存在或已过期', 404);
        }

        const existingData = await loadCurrentData(env);
        const now = Date.now();
        let rollbackKey: string | null = null;

        if (existingData) {
            const rollbackTimestamp = new Date(now).toISOString().replace(/[:.]/g, '-').split('.')[0];
            rollbackKey = `${KV_BACKUP_PREFIX}rollback-${rollbackTimestamp}`;
            const rollbackData: YNavSyncData = {
                ...existingData,
                meta: {
                    ...existingData.meta,
                    updatedAt: now,
                    deviceId: body.deviceId || existingData.meta.deviceId
                }
            };
            await env.YNAV_KV.put(rollbackKey, JSON.stringify(rollbackData), {
                expirationTtl: BACKUP_TTL_SECONDS
            });
        }

        const newVersion = (existingData?.meta?.version ?? 0) + 1;
        const restoredData: YNavSyncData = {
            ...backupData,
            meta: {
                ...(backupData.meta || {}),
                updatedAt: now,
                deviceId: body.deviceId || backupData.meta?.deviceId || 'unknown',
                version: newVersion
            }
        };

        await saveData(env, restoredData);

        return successResponse({ data: restoredData, rollbackKey }, '恢复成功');
    } catch (error: any) {
        return errorResponse(error.message || '恢复失败', 500);
    } finally {
        await releaseLock(env);
    }
}

// GET /api/sync/backups - 获取备份列表
async function handleListBackups(request: Request, env: Env): Promise<Response> {
    if (!isWriteAuthenticated(request, env)) {
        return errorResponse('Unauthorized', 401);
    }

    try {
        const [v1List, legacyList] = await Promise.all([
            env.YNAV_KV.list({ prefix: KV_BACKUP_PREFIX, limit: 100 }),
            env.YNAV_KV.list({ prefix: KV_LEGACY_BACKUP_PREFIX, limit: 100 })
        ]);
        
        const legacyOnlyKeys = legacyList.keys.filter(k => !k.name.startsWith(KV_BACKUP_PREFIX));
        const keys = [...v1List.keys, ...legacyOnlyKeys];

        const backups = await Promise.all(keys.map(async (key: { name: string; expiration?: number }) => {
            let meta: SyncMetadata | null = null;
            let schemaVersion: number | undefined;
            let dataSize: number = 0;
            
            try {
                const data = await env.YNAV_KV.get(key.name, 'json') as YNavSyncData | null;
                meta = data?.meta || null;
                schemaVersion = data?.schemaVersion;
                dataSize = JSON.stringify(data).length;
            } catch {
                meta = null;
            }

            return {
                key: key.name,
                apiVersion: getBackupApiVersion(key.name),
                timestamp: getBackupTimestamp(key.name),
                expiration: key.expiration,
                deviceId: meta?.deviceId,
                updatedAt: meta?.updatedAt,
                version: meta?.version,
                browser: meta?.browser,
                os: meta?.os,
                schemaVersion,
                dataSize: formatBytes(dataSize),
                isAuto: key.name.includes('-auto-'),
                isRollback: key.name.includes('-rollback-'),
                isPreDelete: key.name.includes('-pre-delete-')
            };
        }));

        // 按时间倒序排列
        backups.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

        return successResponse({
            backups,
            total: backups.length,
            autoBackups: backups.filter(b => b.isAuto).length,
            rollbackBackups: backups.filter(b => b.isRollback).length
        });
    } catch (error: any) {
        return errorResponse(error.message || '获取备份列表失败', 500);
    }
}

// DELETE /api/sync/backup - 删除指定备份
async function handleDeleteBackup(request: Request, env: Env): Promise<Response> {
    if (!isWriteAuthenticated(request, env)) {
        return errorResponse('Unauthorized', 401);
    }

    try {
        const body = await request.json() as { backupKey?: string };
        const backupKey = body.backupKey;

        if (!backupKey || !isBackupKeyValid(backupKey)) {
            return errorResponse('无效的备份 key', 400);
        }

        const backupData = await env.YNAV_KV.get(backupKey, 'json');
        if (!backupData) {
            return errorResponse('备份不存在或已过期', 404);
        }

        await env.YNAV_KV.delete(backupKey);

        return successResponse(null, '备份已删除');
    } catch (error: any) {
        return errorResponse(error.message || '删除失败', 500);
    }
}

// POST /api/sync/migrate - 数据迁移/修复
async function handleMigrate(request: Request, env: Env): Promise<Response> {
    if (!isWriteAuthenticated(request, env)) {
        return errorResponse('Unauthorized', 401);
    }

    const lockAcquired = await acquireLock(env);
    if (!lockAcquired) {
        return errorResponse('服务器繁忙，请稍后重试', 429);
    }

    try {
        const body = await request.json() as { 
            fixLinks?: boolean; 
            fixCategories?: boolean;
            regenerateIds?: boolean;
        };

        const data = await loadCurrentData(env);
        if (!data) {
            return errorResponse('没有可迁移的数据', 400);
        }

        const changes: string[] = [];
        const migratedData = { ...data };

        // 修复链接
        if (body.fixLinks) {
            const categoryIds = new Set(migratedData.categories.map(c => c.id));
            const fixedLinks = migratedData.links.map(link => {
                const fixed = { ...link };
                if (!categoryIds.has(fixed.categoryId)) {
                    fixed.categoryId = migratedData.categories[0]?.id || 'common';
                    changes.push(`链接 "${fixed.title}" 分类已修复`);
                }
                if (!fixed.createdAt) {
                    fixed.createdAt = Date.now();
                    changes.push(`链接 "${fixed.title}" 创建时间已设置`);
                }
                return fixed;
            });
            migratedData.links = fixedLinks;
        }

        // 修复分类
        if (body.fixCategories) {
            const fixedCategories = migratedData.categories.map((cat, index) => {
                const fixed = { ...cat };
                if (!fixed.icon) {
                    fixed.icon = 'Link';
                    changes.push(`分类 "${fixed.name}" 图标已设置`);
                }
                return fixed;
            });
            migratedData.categories = fixedCategories;
        }

        // 重新生成 ID
        if (body.regenerateIds) {
            const idMap = new Map<string, string>();
            
            migratedData.categories = migratedData.categories.map(cat => {
                const newId = generateId();
                idMap.set(cat.id, newId);
                changes.push(`分类 "${cat.name}" ID 已重新生成`);
                return { ...cat, id: newId };
            });

            migratedData.links = migratedData.links.map(link => {
                const newId = generateId();
                const newCategoryId = idMap.get(link.categoryId) || link.categoryId;
                changes.push(`链接 "${link.title}" ID 已重新生成`);
                return { ...link, id: newId, categoryId: newCategoryId };
            });
        }

        // 更新版本
        migratedData.meta = {
            ...migratedData.meta,
            version: migratedData.meta.version + 1,
            updatedAt: Date.now()
        };

        // 创建备份
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
        const backupKey = `${KV_BACKUP_PREFIX}pre-migrate-${timestamp}`;
        await env.YNAV_KV.put(backupKey, JSON.stringify(data), {
            expirationTtl: BACKUP_TTL_SECONDS
        });

        await saveData(env, migratedData);

        return successResponse({
            data: migratedData,
            changes,
            backupKey,
            totalChanges: changes.length
        }, changes.length > 0 ? '迁移完成' : '无需迁移');
    } catch (error: any) {
        return errorResponse(error.message || '迁移失败', 500);
    } finally {
        await releaseLock(env);
    }
}

// ============ 主入口 ============

export const onRequest = async (context: { request: Request; env: Env }) => {
    const { request, env } = context;
    const url = new URL(request.url);
    const path = url.pathname;
    const action = url.searchParams.get('action');

    // CORS 预检
    if (request.method === 'OPTIONS') {
        return handleOptions();
    }

    // 请求限流
    const rateLimit = await checkRateLimit(request, env);
    if (!rateLimit.allowed) {
        return errorResponse('请求过于频繁，请稍后重试', 429);
    }

    // 路由分发
    try {
        // 健康检查
        if (path.endsWith('/health')) {
            return handleHealth(env);
        }

        // 统计信息
        if (path.endsWith('/stats')) {
            return handleStats(request, env);
        }

        // 权限验证
        if (path.endsWith('/whoami')) {
            return handleWhoAmI(request, env);
        }

        // 备份列表
        if (path.endsWith('/backups')) {
            return handleListBackups(request, env);
        }

        // 备份操作
        if (path.endsWith('/backup')) {
            if (request.method === 'POST') {
                return handleBackup(request, env);
            }
            if (request.method === 'DELETE') {
                return handleDeleteBackup(request, env);
            }
        }

        // 恢复备份
        if (path.endsWith('/restore')) {
            return handleRestoreBackup(request, env);
        }

        // 数据迁移
        if (path.endsWith('/migrate')) {
            return handleMigrate(request, env);
        }

        // 主同步端点
        if (path.endsWith('/sync')) {
            if (request.method === 'GET') {
                return handleGet(request, env);
            }
            if (request.method === 'POST') {
                return handlePost(request, env);
            }
            if (request.method === 'DELETE') {
                return handleDelete(request, env);
            }
        }

        return errorResponse('Not Found', 404);
    } catch (error: any) {
        console.error('API Error:', error);
        return errorResponse('Internal Server Error', 500);
    }
};
