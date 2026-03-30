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
    SYNC_PASSWORD_HASH?: string; // 改为哈希存储
    VIEW_PASSWORD_HASH?: string;
    __STATIC_CONTENT: KVNamespace;
    RATE_LIMITER_KV?: KVNamespace; // 可选：用于限流
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

    if (passwordRequired && syncPassword) {
        canWrite = await SecurityUtils.verifyPassword(syncPassword, env.SYNC_PASSWORD_HASH);
    }
    
    if (viewPasswordRequired && viewPassword) {
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
        }
        return link;
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
// 8. API 处理函数 (重构与扩展)
// ============================================

class ApiHandler {
    static async handleSync(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);
        const action = url.searchParams.get('action');

        if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

        // 限流检查
        if (!await SecurityUtils.checkRateLimit(request, env)) {
            return jsonResponse({ success: false, error: 'Too many requests' }, 429);
        }

        const auth = await getAuthStatus(request, env);

        try {
            // 公共端点
            if (request.method === 'GET' && action === 'whoami') {
                return jsonResponse({
                    success: true,
                    apiVersion: SYNC_API_VERSION,
                    passwordRequired: auth.passwordRequired,
                    canWrite: auth.canWrite,
                    viewPasswordRequired: auth.viewPasswordRequired,
                    canView: auth.canWrite || auth.canView
                });
            }

            // 需要写权限的端点
            if (!auth.canWrite && request.method !== 'GET') {
                return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
            }

            if (request.method === 'GET') {
                if (action === 'backups') return this.handleListBackups(env);
                if (action === 'stats') return jsonResponse({ success: true, data: await AnalyticsService.getStats(env) });
                if (action === 'shortlinks') return jsonResponse({ success: true, data: await ShortLinkService.getAll(env) });
                return this.handleGet(request, env, auth);
            }

            if (request.method === 'POST') {
                if (action === 'backup') return this.handleBackup(request, env);
                if (action === 'restore') return this.handleRestore(request, env);
                if (action === 'shorten') return this.handleShorten(request, env);
                if (action === 'export') return this.handleExport(env);
                if (action === 'import') return this.handleImport(request, env);
                return this.handlePost(request, env);
            }

            if (request.method === 'DELETE') {
                if (action === 'backup') return this.handleDeleteBackup(request, env);
                if (action === 'shortlink') return this.handleDeleteShortLink(request, env);
                return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
            }

            return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
        } catch (error: any) {
            console.error('API Error:', error);
            return jsonResponse({ success: false, error: error.message || 'Server error' }, 500);
        }
    }

    private static async handleGet(request: Request, env: Env, auth: Awaited<ReturnType<typeof getAuthStatus>>): Promise<Response> {
        const data = await loadCurrentData(env);
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
        const visibleCategories = data.categories.filter(c => !c.hidden);
        const visibleCategoryIds = new Set(visibleCategories.map(c => c.id));
        const visibleLinks = data.links.filter(l => !l.hidden && (!l.categoryId || visibleCategoryIds.has(l.categoryId)));

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

    private static async handlePost(request: Request, env: Env): Promise<Response> {
        const body = await request.json() as { data: YNavSyncData; expectedVersion?: number };
        
        if (!Validator.isSyncDataValid(body.data)) {
            return jsonResponse({ success: false, error: 'Invalid data' }, 400);
        }

        const existingData = await loadCurrentData(env);
        
        // 版本冲突检测
        if (existingData && body.expectedVersion !== undefined) {
            if (existingData.meta.version !== body.expectedVersion) {
                return jsonResponse({
                    success: false,
                    conflict: true,
                    data: existingData,
                    error: 'Version conflict'
                }, 409);
            }
        }

        const newVersion = (existingData?.meta.version || 0) + 1;
        const dataToSave: YNavSyncData = {
            ...body.data,
            meta: {
                ...body.data.meta,
                updatedAt: Date.now(),
                version: newVersion,
                userAgent: request.headers.get('user-agent') || undefined
            }
        };

        await env.YNAV_WORKER_KV.put(KV_KEYS.MAIN_DATA, JSON.stringify(dataToSave));
        return jsonResponse({ success: true, data: dataToSave });
    }

    private static async handleBackup(request: Request, env: Env): Promise<Response> {
        const body = await request.json() as { data: YNavSyncData };
        if (!body.data) return jsonResponse({ success: false, error: 'Missing data' }, 400);

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
        const backupKey = `${KV_KEYS.BACKUP_PREFIX}${timestamp}`;

        await env.YNAV_WORKER_KV.put(backupKey, JSON.stringify(body.data), { expirationTtl: BACKUP_TTL });
        return jsonResponse({ success: true, backupKey });
    }

    private static async handleRestore(request: Request, env: Env): Promise<Response> {
        const body = await request.json() as { backupKey: string };
        if (!body.backupKey?.startsWith(KV_KEYS.BACKUP_PREFIX) && !body.backupKey?.startsWith(KV_KEYS.LEGACY_BACKUP_PREFIX)) {
            return jsonResponse({ success: false, error: 'Invalid backup key' }, 400);
        }

        const backupData = await env.YNAV_WORKER_KV.get<YNavSyncData>(body.backupKey, 'json');
        if (!backupData) return jsonResponse({ success: false, error: 'Backup not found' }, 404);

        const existingData = await loadCurrentData(env);
        const now = Date.now();

        // 创建回滚点
        if (existingData) {
            const rollbackKey = `${KV_KEYS.BACKUP_PREFIX}rollback-${new Date(now).toISOString().replace(/[:.]/g, '-').split('.')[0]}`;
            await env.YNAV_WORKER_KV.put(rollbackKey, JSON.stringify(existingData), { expirationTtl: BACKUP_TTL });
        }

        const newVersion = (existingData?.meta.version || 0) + 1;
        const restoredData: YNavSyncData = {
            ...backupData,
            meta: { ...backupData.meta, updatedAt: now, version: newVersion }
        };

        await env.YNAV_WORKER_KV.put(KV_KEYS.MAIN_DATA, JSON.stringify(restoredData));
        return jsonResponse({ success: true, data: restoredData });
    }

    private static async handleListBackups(env: Env): Promise<Response> {
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
                timestamp: key.name.replace(KV_KEYS.BACKUP_PREFIX, '').replace(KV_KEYS.LEGACY_BACKUP_PREFIX, ''),
                expiration: key.expiration,
                ...meta
            };
        }));

        return jsonResponse({ success: true, backups });
    }

    private static async handleDeleteBackup(request: Request, env: Env): Promise<Response> {
        const body = await request.json() as { backupKey: string };
        if (!body.backupKey) return jsonResponse({ success: false, error: 'Missing backup key' }, 400);

        await env.YNAV_WORKER_KV.delete(body.backupKey);
        return jsonResponse({ success: true });
    }

    // 短链接处理
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

    // 导入导出
    private static async handleExport(env: Env): Promise<Response> {
        const data = await loadCurrentData(env);
        if (!data) return jsonResponse({ success: false, error: 'No data' }, 404);

        // 导出为 Netscape 书签格式 (HTML)
        const html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Y-Nav Bookmarks</TITLE>
<H1>Y-Nav Bookmarks</H1>
<DL><p>
${data.categories.map(cat => `
    <DT><H3>${cat.name}</H3>
    <DL><p>
        ${data.links.filter(l => l.categoryId === cat.id).map(link => `
            <DT><A HREF="${link.url}">${link.title}</A>
        `).join('')}
    </DL><p>
`).join('')}
${data.links.filter(l => !l.categoryId).map(link => `
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

    private static async handleImport(request: Request, env: Env): Promise<Response> {
        // 简单的 JSON 导入实现
        const body = await request.json() as { data: YNavSyncData };
        if (!Validator.isSyncDataValid(body.data)) {
            return jsonResponse({ success: false, error: 'Invalid data format' }, 400);
        }

        const existingData = await loadCurrentData(env);
        const newVersion = (existingData?.meta.version || 0) + 1;
        
        const dataToSave: YNavSyncData = {
            ...body.data,
            meta: {
                ...body.data.meta,
                updatedAt: Date.now(),
                version: newVersion
            }
        };

        await env.YNAV_WORKER_KV.put(KV_KEYS.MAIN_DATA, JSON.stringify(dataToSave));
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
            return ApiHandler.handleSync(request, env);
        }

        // 4. 跟踪访问 (非静态资源)
        if (!url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
            ctx.waitUntil(AnalyticsService.trackVisit(request, env));
        }

        // 5. 静态资源
        return handleStaticAssets(request, env, ctx);
    }
};
