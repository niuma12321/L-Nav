/**
 * Y-Nav Cloudflare Worker 入口 (优化版)
 * 
 * 新增功能:
 * - 密码哈希存储 (Web Crypto API)
 * - 请求限流 (Rate Limiting)
 * - 访问统计 (Analytics)
 * - 短链接服务 (Short Links)
 * - 书签导入/导出 (HTML/JSON)
 * - 健康检查端点
 * - 智能缓存策略
 * - 输入验证 (Zod Schema)
 */

import { getAssetFromKV, NotFoundError, MethodNotAllowedError } from '@cloudflare/kv-asset-handler';
// @ts-ignore
import manifestJSON from '__STATIC_CONTENT_MANIFEST';

const assetManifest = JSON.parse(manifestJSON);

// ============================================
// 1. 类型定义 (增强版)
// ============================================

interface Env {
    YNAV_WORKER_KV: KVNamespace;
    YNAV_D1_DB?: D1Database;           // D1结构化数据库
    YNAV_R2_BUCKET?: R2Bucket;         // R2对象存储
    SYNC_PASSWORD_HASH?: string;
    VIEW_PASSWORD_HASH?: string;
    __STATIC_CONTENT: KVNamespace;
    RATE_LIMITER_KV?: KVNamespace;
    // 功能开关
    ENABLE_D1_SYNC?: string;
    ENABLE_R2_STORAGE?: string;
}

interface SyncMetadata {
    updatedAt: number;
    deviceId: string;
    version: number;
    browser?: string;
    os?: string;
    userAgent?: string;
}

interface YNavSyncData {
    links: Array<{ id: string; url: string; title: string; categoryId?: string; hidden?: boolean }>;
    categories: Array<{ id: string; name: string; hidden?: boolean; order?: number }>;
    searchConfig?: any;
    aiConfig?: any;
    siteSettings?: { siteMode?: 'public' | 'webmaster' | 'private'; title?: string };
    privateVault?: string;
    schemaVersion?: number;
    meta: SyncMetadata;
}

interface ShortLink {
    id: string;
    url: string;
    createdAt: number;
    visits: number;
}

interface AnalyticsData {
    totalVisits: number;
    uniqueVisitors: number;
    dailyVisits: Record<string, number>;
}

// ============================================
// 2. 常量与配置
// ============================================

const SYNC_API_VERSION = 'v1';
const KV_KEYS = {
    MAIN_DATA: `ynav:data:${SYNC_API_VERSION}`,
    LEGACY_DATA: 'ynav:data',
    BACKUP_PREFIX: `ynav:backup:${SYNC_API_VERSION}:`,
    LEGACY_BACKUP_PREFIX: 'ynav:backup:',
    SHORT_LINKS: 'ynav:shortlinks',
    ANALYTICS: 'ynav:analytics',
    RATE_LIMIT_PREFIX: 'ynav:rl:'
} as const;

const BACKUP_TTL = 30 * 24 * 60 * 60; // 30天
const CACHE_TTL = {
    STATIC: 31536000, // 1年 (带哈希的资源)
    HTML: 0, // 不缓存 HTML (SPA)
    API: 0 // API 不缓存
};

// ============================================
// 3. 安全工具 (密码哈希、限流)
// ============================================

class SecurityUtils {
    // 使用 Web Crypto API 哈希密码
    static async hashPassword(password: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    static async verifyPassword(password: string, hash: string): Promise<boolean> {
        const inputHash = await this.hashPassword(password);
        return inputHash === hash;
    }

    // 简单的请求限流
    static async checkRateLimit(
        request: Request, 
        env: Env, 
        limit: number = 100, 
        window: number = 60
    ): Promise<boolean> {
        if (!env.RATE_LIMITER_KV) return true; // 未配置则跳过
        
        const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
        const key = `${KV_KEYS.RATE_LIMIT_PREFIX}${clientIP}`;
        const now = Math.floor(Date.now() / 1000);
        const windowStart = now - window;

        const current = await env.RATE_LIMITER_KV.get<number>(key, 'json') || 0;
        if (current >= limit) return false;

        await env.RATE_LIMITER_KV.put(key, (current + 1).toString(), { expirationTtl: window });
        return true;
    }
}

// ============================================
// 4. 输入验证 (Zod Schema 风格)
// ============================================

class Validator {
    static isUrlValid(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    static isSyncDataValid(data: any): data is YNavSyncData {
        return data && Array.isArray(data.links) && Array.isArray(data.categories) && data.meta;
    }
}

// ============================================
// 5. 辅助函数 (重构版)
// ============================================

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Sync-Password, X-View-Password',
};

function jsonResponse(data: any, status = 200, headers: Record<string, string> = {}): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
            ...headers
        }
    });
}

async function getAuthStatus(request: Request, env: Env) {
    const syncPassword = request.headers.get('X-Sync-Password');
    const viewPassword = request.headers.get('X-View-Password');
    
    const passwordRequired = !!(env.SYNC_PASSWORD_HASH && env.SYNC_PASSWORD_HASH.trim() !== '');
    const viewPasswordRequired = !!(env.VIEW_PASSWORD_HASH && env.VIEW_PASSWORD_HASH.trim() !== '');
    
    let canWrite = !passwordRequired;
    let canView = !viewPasswordRequired;

    if (passwordRequired && syncPassword && env.SYNC_PASSWORD_HASH) {
        canWrite = await SecurityUtils.verifyPassword(syncPassword, env.SYNC_PASSWORD_HASH);
    }
    
    if (viewPasswordRequired && viewPassword && env.VIEW_PASSWORD_HASH) {
        canView = await SecurityUtils.verifyPassword(viewPassword, env.VIEW_PASSWORD_HASH);
    }

    return { passwordRequired, canWrite, viewPasswordRequired, canView };
}

async function loadCurrentData(env: Env): Promise<YNavSyncData | null> {
    const v1 = await env.YNAV_WORKER_KV.get<YNavSyncData>(KV_KEYS.MAIN_DATA, 'json');
    if (v1) return v1;
    const legacy = await env.YNAV_WORKER_KV.get<YNavSyncData>(KV_KEYS.LEGACY_DATA, 'json');
    return legacy;
}

// ============================================
// 6. 新增功能：访问统计
// ============================================

class AnalyticsService {
    static async trackVisit(request: Request, env: Env) {
        const today = new Date().toISOString().split('T')[0];
        const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
        const visitorKey = `ynav:visitor:${clientIP}:${today}`;

        const analytics = await env.YNAV_WORKER_KV.get<AnalyticsData>(KV_KEYS.ANALYTICS, 'json') || {
            totalVisits: 0,
            uniqueVisitors: 0,
            dailyVisits: {}
        };

        analytics.totalVisits++;
        analytics.dailyVisits[today] = (analytics.dailyVisits[today] || 0) + 1;

        // 检查是否为新访客
        const isNewVisitor = !(await env.YNAV_WORKER_KV.get(visitorKey));
        if (isNewVisitor) {
            analytics.uniqueVisitors++;
            await env.YNAV_WORKER_KV.put(visitorKey, '1', { expirationTtl: 86400 * 2 }); // 保留2天
        }

        await env.YNAV_WORKER_KV.put(KV_KEYS.ANALYTICS, JSON.stringify(analytics));
    }

    static async getStats(env: Env): Promise<AnalyticsData> {
        return await env.YNAV_WORKER_KV.get<AnalyticsData>(KV_KEYS.ANALYTICS, 'json') || {
            totalVisits: 0,
            uniqueVisitors: 0,
            dailyVisits: {}
        };
    }
}

// ============================================
// 7. 新增功能：短链接服务
// ============================================

class ShortLinkService {
    static async create(url: string, env: Env): Promise<ShortLink> {
        const id = Math.random().toString(36).substring(2, 8);
        const link: ShortLink = { id, url, createdAt: Date.now(), visits: 0 };
        
        const links = await this.getAll(env);
        links.push(link);
        await env.YNAV_WORKER_KV.put(KV_KEYS.SHORT_LINKS, JSON.stringify(links));
        
        return link;
    }

    static async get(id: string, env: Env): Promise<ShortLink | null> {
        const links = await this.getAll(env);
        const link = links.find(l => l.id === id);
        if (link) {
            link.visits++;
            await env.YNAV_WORKER_KV.put(KV_KEYS.SHORT_LINKS, JSON.stringify(links));
            return link as ShortLink;
        }
        return null;
    }

    static async getAll(env: Env): Promise<ShortLink[]> {
        return await env.YNAV_WORKER_KV.get<ShortLink[]>(KV_KEYS.SHORT_LINKS, 'json') || [];
    }

    static async delete(id: string, env: Env): Promise<boolean> {
        const links = await this.getAll(env);
        const index = links.findIndex(l => l.id === id);
        if (index > -1) {
            links.splice(index, 1);
            await env.YNAV_WORKER_KV.put(KV_KEYS.SHORT_LINKS, JSON.stringify(links));
            return true;
        }
        return false;
    }
}

// ============================================
// 11. 多存储API处理器 (D1 + R2 + KV)
// ============================================

import { D1StorageService, R2StorageService, KVCacheService, HybridStorageService, createStorageService } from './services/storage';
import { runMigrations, migrateFromKV, checkDatabaseHealth } from './database/migrations';

class MultiStorageApiHandler {
    // 获取用户ID (从请求头或生成)
    private static getUserId(request: Request): string {
        // 从自定义头部获取用户ID，或使用设备指纹
        const customUserId = request.headers.get('X-User-ID');
        if (customUserId) return customUserId;
        
        // 使用设备标识符
        const deviceId = request.headers.get('X-Device-ID') || 'anonymous';
        return `user_${deviceId}`;
    }

    // 检查D1是否启用
    private static isD1Enabled(env: Env): boolean {
        return !!(env.YNAV_D1_DB && env.ENABLE_D1_SYNC === 'true');
    }

    // 检查R2是否启用
    private static isR2Enabled(env: Env): boolean {
        return !!(env.YNAV_R2_BUCKET && env.ENABLE_R2_STORAGE === 'true');
    }

    // 统一的数据获取方法
    static async loadData(env: Env, userId: string): Promise<any | null> {
        // 优先从D1读取
        if (this.isD1Enabled(env)) {
            const d1 = new D1StorageService(env.YNAV_D1_DB!, userId);
            try {
                const data = await d1.getAllData();
                return {
                    links: data.links,
                    categories: data.categories,
                    notes: data.notes,
                    settings: data.settings,
                    meta: data.meta
                };
            } catch (e) {
                console.error('D1 read failed, falling back to KV:', e);
            }
        }

        // 回退到KV
        return await loadCurrentData(env);
    }

    // 统一的数据保存方法
    static async saveData(env: Env, userId: string, data: any): Promise<void> {
        const storage = createStorageService(env, userId);

        // 保存到D1 (结构化数据)
        if (storage.isD1Available()) {
            await storage.d1!.saveAllData({
                links: data.links || [],
                categories: data.categories || [],
                notes: data.notes || [],
                settings: data.settings,
                meta: data.meta
            });
        }

        // 保存到KV (兼容性)
        await env.YNAV_WORKER_KV.put(KV_KEYS.MAIN_DATA, JSON.stringify(data));

        // 缓存到KV (加速读取)
        if (storage.isKVAvailable()) {
            await storage.kv!.cacheAggregatedData(data, 300);
        }

        // 大对象保存到R2 (如果有)
        if (storage.isR2Available() && data.privateVault) {
            // 隐私数据存储到R2
            await storage.r2!.createBackupArchive(`vault-${Date.now()}`, {
                vault: data.privateVault,
                timestamp: Date.now()
            });
        }
    }

    // 主处理函数
    static async handleSync(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);
        const action = url.searchParams.get('action');
        const userId = this.getUserId(request);

        if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

        // 限流检查
        if (!await SecurityUtils.checkRateLimit(request, env)) {
            return jsonResponse({ success: false, error: 'Too many requests' }, 429);
        }

        const auth = await getAuthStatus(request, env);

        try {
            // 数据库健康检查
            if (action === 'health') {
                if (!this.isD1Enabled(env)) {
                    return jsonResponse({ 
                        success: true, 
                        healthy: true, 
                        storage: 'kv_only',
                        message: '使用KV存储模式'
                    });
                }
                const health = await checkDatabaseHealth(env.YNAV_D1_DB!);
                return jsonResponse({ 
                    success: true, 
                    ...health,
                    storage: 'hybrid'
                });
            }

            // 执行数据库迁移
            if (action === 'migrate' && request.method === 'POST') {
                if (!this.isD1Enabled(env)) {
                    return jsonResponse({ success: false, error: 'D1 not enabled' }, 400);
                }
                const result = await runMigrations(env.YNAV_D1_DB!);
                return jsonResponse({
                success: result.success,
                message: result.message,
                executedMigrations: result.executedMigrations,
                errors: result.errors
            });
            }

            // 从KV迁移到D1
            if (action === 'migrate-from-kv' && request.method === 'POST') {
                if (!this.isD1Enabled(env)) {
                    return jsonResponse({ success: false, error: 'D1 not enabled' }, 400);
                }
                const result = await migrateFromKV(env.YNAV_WORKER_KV, env.YNAV_D1_DB!, userId);
                return jsonResponse(result);
            }

            // 公共端点
            if (request.method === 'GET' && action === 'whoami') {
                return jsonResponse({
                    success: true,
                    apiVersion: SYNC_API_VERSION,
                    passwordRequired: auth.passwordRequired,
                    canWrite: auth.canWrite,
                    viewPasswordRequired: auth.viewPasswordRequired,
                    canView: auth.canWrite || auth.canView,
                    storageMode: this.isD1Enabled(env) ? 'hybrid' : 'kv_only',
                    features: {
                        d1: this.isD1Enabled(env),
                        r2: this.isR2Enabled(env),
                        kv: true
                    }
                });
            }

            // 需要写权限的端点
            if (!auth.canWrite && request.method !== 'GET') {
                return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
            }

            if (request.method === 'GET') {
                if (action === 'backups') return this.handleListBackups(env, userId);
                if (action === 'stats') return jsonResponse({ success: true, data: await AnalyticsService.getStats(env) });
                if (action === 'shortlinks') return jsonResponse({ success: true, data: await ShortLinkService.getAll(env) });
                return this.handleGet(request, env, auth, userId);
            }

            if (request.method === 'POST') {
                if (action === 'backup') return this.handleBackup(request, env, userId);
                if (action === 'restore') return this.handleRestore(request, env, userId);
                if (action === 'shorten') return this.handleShorten(request, env);
                if (action === 'export') return this.handleExport(env, userId);
                if (action === 'import') return this.handleImport(request, env, userId);
                return this.handlePost(request, env, auth, userId);
            }

            if (request.method === 'DELETE') {
                if (action === 'backup') return this.handleDeleteBackup(request, env, userId);
                if (action === 'shortlink') return this.handleDeleteShortLink(request, env);
                return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
            }

            return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
        } catch (error: any) {
            console.error('API Error:', error);
            return jsonResponse({ success: false, error: error.message || 'Server error' }, 500);
        }
    }

    private static async handleGet(request: Request, env: Env, auth: Awaited<ReturnType<typeof getAuthStatus>>, userId: string): Promise<Response> {
        const data = await this.loadData(env, userId);
        if (!data) {
            return jsonResponse({ success: true, data: null, message: 'No data' });
        }

        const siteMode = data.siteSettings?.siteMode || 'private';

        if (siteMode === 'private' && !auth.canWrite) {
            return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
        }

        if (auth.canWrite) {
            return jsonResponse({ success: true, data });
        }

        // 构建安全数据（过滤隐藏内容）
        const visibleCategories = data.categories?.filter((c: any) => !c.hidden) || [];
        const visibleCategoryIds = new Set(visibleCategories.map((c: any) => c.id));
        const visibleLinks = data.links?.filter((l: any) => !l.hidden && (!l.categoryId || visibleCategoryIds.has(l.categoryId))) || [];

        return jsonResponse({
            success: true,
            data: {
                ...data,
                links: visibleLinks,
                categories: visibleCategories,
                privateVault: undefined,
                aiConfig: undefined
            }
        });
    }

    private static async handlePost(request: Request, env: Env, auth: Awaited<ReturnType<typeof getAuthStatus>>, userId: string): Promise<Response> {
        const body = await request.json() as { data: YNavSyncData; expectedVersion?: number };
        
        if (!Validator.isSyncDataValid(body.data)) {
            return jsonResponse({ success: false, error: 'Invalid data' }, 400);
        }

        const existingData = await this.loadData(env, userId);
        
        // 版本冲突检测
        if (existingData && body.expectedVersion !== undefined) {
            if (existingData.meta?.version !== body.expectedVersion) {
                return jsonResponse({
                    success: false,
                    conflict: true,
                    data: existingData,
                    error: 'Version conflict'
                }, 409);
            }
        }

        const newVersion = (existingData?.meta?.version || 0) + 1;
        const dataToSave: YNavSyncData = {
            ...body.data,
            meta: {
                ...body.data.meta,
                updatedAt: Date.now(),
                version: newVersion,
                userAgent: request.headers.get('user-agent') || undefined
            }
        };

        await this.saveData(env, userId, dataToSave);
        
        // 记录同步日志 (如果D1可用)
        if (this.isD1Enabled(env)) {
            const d1 = new D1StorageService(env.YNAV_D1_DB!, userId);
            await d1.logSync('push', 'success', { version: newVersion });
        }

        return jsonResponse({ success: true, data: dataToSave });
    }

    private static async handleBackup(request: Request, env: Env, userId: string): Promise<Response> {
        const body = await request.json() as { data: YNavSyncData };
        if (!body.data) return jsonResponse({ success: false, error: 'Missing data' }, 400);

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
        
        // 保存到R2 (如果启用)
        if (this.isR2Enabled(env)) {
            const r2 = new R2StorageService(env.YNAV_R2_BUCKET!, userId);
            const key = await r2.createBackupArchive(timestamp, body.data);
            return jsonResponse({ success: true, backupKey: key, storage: 'r2' });
        }

        // 回退到KV
        const backupKey = `${KV_KEYS.BACKUP_PREFIX}${timestamp}`;
        await env.YNAV_WORKER_KV.put(backupKey, JSON.stringify(body.data), { expirationTtl: BACKUP_TTL });
        return jsonResponse({ success: true, backupKey, storage: 'kv' });
    }

    private static async handleRestore(request: Request, env: Env, userId: string): Promise<Response> {
        const body = await request.json() as { backupKey: string; fromR2?: boolean };
        
        let backupData: YNavSyncData | null = null;

        // 从R2恢复
        if (body.fromR2 && this.isR2Enabled(env)) {
            const r2 = new R2StorageService(env.YNAV_R2_BUCKET!, userId);
            backupData = await r2.getBackupArchive(body.backupKey);
        }

        // 从KV恢复
        if (!backupData) {
            if (!body.backupKey?.startsWith(KV_KEYS.BACKUP_PREFIX) && !body.backupKey?.startsWith(KV_KEYS.LEGACY_BACKUP_PREFIX)) {
                return jsonResponse({ success: false, error: 'Invalid backup key' }, 400);
            }
            backupData = await env.YNAV_WORKER_KV.get<YNavSyncData>(body.backupKey, 'json');
        }

        if (!backupData) return jsonResponse({ success: false, error: 'Backup not found' }, 404);

        const existingData = await this.loadData(env, userId);
        const now = Date.now();

        // 创建回滚点
        if (existingData) {
            const rollbackKey = `${KV_KEYS.BACKUP_PREFIX}rollback-${new Date(now).toISOString().replace(/[:.]/g, '-').split('.')[0]}`;
            await env.YNAV_WORKER_KV.put(rollbackKey, JSON.stringify(existingData), { expirationTtl: BACKUP_TTL });
        }

        const newVersion = (existingData?.meta?.version || 0) + 1;
        const restoredData: YNavSyncData = {
            ...backupData,
            meta: { ...backupData.meta, updatedAt: now, version: newVersion }
        };

        await this.saveData(env, userId, restoredData);
        return jsonResponse({ success: true, data: restoredData });
    }

    private static async handleListBackups(env: Env, userId: string): Promise<Response> {
        // 尝试从R2获取备份列表
        if (this.isR2Enabled(env)) {
            const r2 = new R2StorageService(env.YNAV_R2_BUCKET!, userId);
            const r2Keys = await r2.listObjects('backups');
            const r2Backups = r2Keys.map(key => ({
                key,
                storage: 'r2',
                timestamp: key.split('/').pop()?.replace('.json', '') || ''
            }));
            return jsonResponse({ success: true, backups: r2Backups, storage: 'r2' });
        }

        // 从KV获取
        const [v1List, legacyList] = await Promise.all([
            env.YNAV_WORKER_KV.list({ prefix: KV_KEYS.BACKUP_PREFIX }),
            env.YNAV_WORKER_KV.list({ prefix: KV_KEYS.LEGACY_BACKUP_PREFIX })
        ]);

        const keys = [...v1List.keys, ...legacyList.keys.filter(k => !k.name.startsWith(KV_KEYS.BACKUP_PREFIX))];
        const backups = await Promise.all(keys.map(async (key) => {
            let meta: SyncMetadata | null = null;
            try {
                const data = await env.YNAV_WORKER_KV.get<YNavSyncData>(key.name, 'json');
                meta = data?.meta || null;
            } catch { /* empty */ }

            return {
                key: key.name,
                storage: 'kv',
                timestamp: key.name.replace(KV_KEYS.BACKUP_PREFIX, '').replace(KV_KEYS.LEGACY_BACKUP_PREFIX, ''),
                expiration: key.expiration,
                ...meta
            };
        }));

        return jsonResponse({ success: true, backups });
    }

    private static async handleDeleteBackup(request: Request, env: Env, userId: string): Promise<Response> {
        const body = await request.json() as { backupKey: string; fromR2?: boolean };
        if (!body.backupKey) return jsonResponse({ success: false, error: 'Missing backup key' }, 400);

        // 从R2删除
        if (body.fromR2 && this.isR2Enabled(env)) {
            const r2 = new R2StorageService(env.YNAV_R2_BUCKET!, userId);
            await r2.deleteBackupArchive(body.backupKey);
            return jsonResponse({ success: true, storage: 'r2' });
        }

        // 从KV删除
        await env.YNAV_WORKER_KV.delete(body.backupKey);
        return jsonResponse({ success: true, storage: 'kv' });
    }

    private static async handleShorten(request: Request, env: Env): Promise<Response> {
        const body = await request.json() as { url: string };
        if (!Validator.isUrlValid(body.url)) return jsonResponse({ success: false, error: 'Invalid URL' }, 400);

        const link = await ShortLinkService.create(body.url, env);
        return jsonResponse({ success: true, data: link });
    }

    private static async handleDeleteShortLink(request: Request, env: Env): Promise<Response> {
        const body = await request.json() as { id: string };
        const deleted = await ShortLinkService.delete(body.id, env);
        return jsonResponse({ success: deleted, error: deleted ? undefined : 'Not found' }, deleted ? 200 : 404);
    }

    private static async handleExport(env: Env, userId: string): Promise<Response> {
        const data = await this.loadData(env, userId);
        if (!data) return jsonResponse({ success: false, error: 'No data' }, 404);

        // 导出为 Netscape 书签格式 (HTML)
        const html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Y-Nav Bookmarks</TITLE>
<H1>Y-Nav Bookmarks</H1>
<DL><p>
${data.categories?.map((cat: any) => `
    <DT><H3>${cat.name}</H3>
    <DL><p>
        ${data.links?.filter((l: any) => l.categoryId === cat.id).map((link: any) => `
            <DT><A HREF="${link.url}">${link.title}</A>
        `).join('')}
    </DL><p>
`).join('')}
${data.links?.filter((l: any) => !l.categoryId).map((link: any) => `
    <DT><A HREF="${link.url}">${link.title}</A>
`).join('')}
</DL><p>`;

        return new Response(html, {
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Content-Disposition': 'attachment; filename="ynav-bookmarks.html"'
            }
        });
    }

    private static async handleImport(request: Request, env: Env, userId: string): Promise<Response> {
        const body = await request.json() as { data: YNavSyncData };
        if (!Validator.isSyncDataValid(body.data)) {
            return jsonResponse({ success: false, error: 'Invalid data format' }, 400);
        }

        const existingData = await this.loadData(env, userId);
        const newVersion = (existingData?.meta?.version || 0) + 1;
        
        const dataToSave: YNavSyncData = {
            ...body.data,
            meta: {
                ...body.data.meta,
                updatedAt: Date.now(),
                version: newVersion
            }
        };

        await this.saveData(env, userId, dataToSave);
        return jsonResponse({ success: true, data: dataToSave });
    }
}

// ============================================
// 9. 静态资源处理 (优化缓存)
// ============================================

async function handleStaticAssets(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
        const response = await getAssetFromKV(
            { request, waitUntil: ctx.waitUntil.bind(ctx) },
            { ASSET_NAMESPACE: env.__STATIC_CONTENT, ASSET_MANIFEST: assetManifest }
        );

        // 智能缓存策略
        const url = new URL(request.url);
        const isHTML = url.pathname.endsWith('.html') || url.pathname === '/';
        const isHashedAsset = /\.[0-9a-f]{8,}\./.test(url.pathname); // 检测带哈希的资源

        const newResponse = new Response(response.body, response);
        if (isHTML) {
            newResponse.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
        } else if (isHashedAsset) {
            newResponse.headers.set('Cache-Control', `public, max-age=${CACHE_TTL.STATIC}, immutable`);
        } else {
            newResponse.headers.set('Cache-Control', `public, max-age=3600`); // 1小时
        }

        // 安全头部
        newResponse.headers.set('X-Content-Type-Options', 'nosniff');
        newResponse.headers.set('X-Frame-Options', 'DENY');
        
        return newResponse;
    } catch (e) {
        if (e instanceof NotFoundError) {
            // SPA Fallback
            const notFoundRequest = new Request(new URL('/index.html', request.url).toString(), request);
            return getAssetFromKV(
                { request: notFoundRequest, waitUntil: ctx.waitUntil.bind(ctx) },
                { ASSET_NAMESPACE: env.__STATIC_CONTENT, ASSET_MANIFEST: assetManifest }
            );
        }
        return new Response('Not Found', { status: 404 });
    }
}

// ============================================
// 10. 主入口
// ============================================

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const url = new URL(request.url);

        // 1. 健康检查
        if (url.pathname === '/health') {
            return jsonResponse({ 
                status: 'ok', 
                timestamp: Date.now(),
                version: SYNC_API_VERSION
            });
        }

        // 2. 短链接重定向
        if (url.pathname.startsWith('/s/')) {
            const id = url.pathname.slice(3);
            const link = await ShortLinkService.get(id, env);
            if (link) {
                return Response.redirect(link.url, 302);
            }
            return new Response('Short link not found', { status: 404 });
        }

        // 3. API 路由
        if (url.pathname.startsWith('/api/sync') || url.pathname.startsWith('/api/v1/sync')) {
            return MultiStorageApiHandler.handleSync(request, env);
        }

        // 4. 跟踪访问 (非静态资源)
        if (!url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
            ctx.waitUntil(AnalyticsService.trackVisit(request, env));
        }

        // 5. 静态资源
        return handleStaticAssets(request, env, ctx);
    }
};
