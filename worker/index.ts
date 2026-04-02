/**
 * Y-Nav Cloudflare Worker 入口 (简化修复版)
 * 支持 D1 + R2 + KV 多存储架构
 */

import { getAssetFromKV, NotFoundError } from '@cloudflare/kv-asset-handler';
// @ts-ignore
import manifestJSON from '__STATIC_CONTENT_MANIFEST';

const assetManifest = JSON.parse(manifestJSON);

// ============================================
// 1. 类型定义
// ============================================

interface Env {
    YNAV_WORKER_KV: KVNamespace;
    YNAV_D1_DB?: D1Database;
    YNAV_R2_BUCKET?: R2Bucket;
    SYNC_PASSWORD_HASH?: string;
    VIEW_PASSWORD_HASH?: string;
    __STATIC_CONTENT: KVNamespace;
    RATE_LIMITER_KV?: KVNamespace;
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

// ============================================
// 2. 常量
// ============================================

const SYNC_API_VERSION = 'v1';
const KV_KEYS = {
    MAIN_DATA: `ynav:data:${SYNC_API_VERSION}`,
    LEGACY_DATA: 'ynav:data',
    BACKUP_PREFIX: `ynav:backup:${SYNC_API_VERSION}:`,
    LEGACY_BACKUP_PREFIX: 'ynav:backup:',
};

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Sync-Password, X-View-Password',
};

// ============================================
// 3. 工具函数
// ============================================

function jsonResponse(data: any, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
        }
    });
}

async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
    const inputHash = await hashPassword(password);
    return inputHash === hash;
}

async function getAuthStatus(request: Request, env: Env) {
    const syncPassword = request.headers.get('X-Sync-Password');
    const viewPassword = request.headers.get('X-View-Password');
    
    const passwordRequired = !!(env.SYNC_PASSWORD_HASH?.trim());
    const viewPasswordRequired = !!(env.VIEW_PASSWORD_HASH?.trim());
    
    let canWrite = !passwordRequired;
    let canView = !viewPasswordRequired;

    if (passwordRequired && syncPassword && env.SYNC_PASSWORD_HASH) {
        canWrite = await verifyPassword(syncPassword, env.SYNC_PASSWORD_HASH);
    }
    
    if (viewPasswordRequired && viewPassword && env.VIEW_PASSWORD_HASH) {
        canView = await verifyPassword(viewPassword, env.VIEW_PASSWORD_HASH);
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
// 4. D1 数据库操作（简化版）
// ============================================

async function checkD1Health(db: D1Database): Promise<{ healthy: boolean; message: string }> {
    try {
        await db.prepare('SELECT 1').first();
        return { healthy: true, message: 'D1 database connected' };
    } catch (e: any) {
        return { healthy: false, message: e.message };
    }
}

async function initD1Schema(db: D1Database): Promise<{ success: boolean; message: string }> {
    try {
        await db.prepare(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                password_hash TEXT,
                created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
                updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
                sync_version INTEGER DEFAULT 0
            )
        `).run();

        await db.prepare(`
            CREATE TABLE IF NOT EXISTS links (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                url TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                icon TEXT,
                category_id TEXT,
                is_pinned INTEGER DEFAULT 0,
                is_hidden INTEGER DEFAULT 0,
                created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
                updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
            )
        `).run();

        await db.prepare(`
            CREATE TABLE IF NOT EXISTS categories (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                icon TEXT,
                color TEXT,
                sort_order INTEGER DEFAULT 0,
                is_hidden INTEGER DEFAULT 0,
                created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
            )
        `).run();

        await db.prepare(`
            CREATE TABLE IF NOT EXISTS notes (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                content TEXT NOT NULL,
                color TEXT DEFAULT 'yellow',
                sort_order INTEGER DEFAULT 0,
                created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
            )
        `).run();

        return { success: true, message: 'Database schema initialized' };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

// ============================================
// 5. API 处理器
// ============================================

class ApiHandler {
    private static isD1Enabled(env: Env): boolean {
        return !!(env.YNAV_D1_DB && env.ENABLE_D1_SYNC === 'true');
    }

    static async handleSync(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);
        const action = url.searchParams.get('action');

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        const auth = await getAuthStatus(request, env);

        try {
            // 健康检查
            if (action === 'health') {
                if (!this.isD1Enabled(env)) {
                    return jsonResponse({ 
                        success: true, 
                        healthy: true, 
                        storage: 'kv_only',
                        message: '使用KV存储模式'
                    });
                }
                const health = await checkD1Health(env.YNAV_D1_DB!);
                return jsonResponse({ 
                    success: true, 
                    ...health,
                    storage: 'hybrid'
                });
            }

            // 初始化数据库
            if (action === 'migrate' && request.method === 'POST') {
                if (!this.isD1Enabled(env)) {
                    return jsonResponse({ success: false, error: 'D1 not enabled' }, 400);
                }
                const result = await initD1Schema(env.YNAV_D1_DB!);
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
                        r2: false,
                        kv: true
                    }
                });
            }

            // 需要写权限
            if (!auth.canWrite && request.method !== 'GET') {
                return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
            }

            // GET 请求
            if (request.method === 'GET') {
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

                // 过滤隐藏内容
                const visibleCategories = data.categories?.filter((c: any) => !c.hidden) || [];
                const visibleCategoryIds = new Set(visibleCategories.map((c: any) => c.id));
                const visibleLinks = data.links?.filter((l: any) => 
                    !l.hidden && (!l.categoryId || visibleCategoryIds.has(l.categoryId))
                ) || [];

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

            // POST 请求 - 保存数据
            if (request.method === 'POST') {
                const body = await request.json() as { data: YNavSyncData; expectedVersion?: number };
                
                if (!body.data || !body.data.links || !body.data.categories || !body.data.meta) {
                    return jsonResponse({ success: false, error: 'Invalid data' }, 400);
                }

                const existingData = await loadCurrentData(env);
                
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

                // 保存到 KV
                await env.YNAV_WORKER_KV.put(KV_KEYS.MAIN_DATA, JSON.stringify(dataToSave));

                return jsonResponse({ success: true, data: dataToSave });
            }

            return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
        } catch (error: any) {
            console.error('API Error:', error);
            return jsonResponse({ success: false, error: error.message || 'Server error' }, 500);
        }
    }
}

// ============================================
// 6. 静态资源处理
// ============================================

async function handleStaticAssets(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // 保护：API 路径不应进入静态资源处理
    if (url.pathname.startsWith('/api/')) {
        return new Response('Not Found', { status: 404 });
    }
    
    try {
        const response = await getAssetFromKV(
            { request, waitUntil: ctx.waitUntil.bind(ctx) },
            { ASSET_NAMESPACE: env.__STATIC_CONTENT, ASSET_MANIFEST: assetManifest }
        );

        const isHTML = url.pathname.endsWith('.html') || url.pathname === '/';
        const isHashedAsset = /\.[0-9a-f]{8,}\./.test(url.pathname);

        const newResponse = new Response(response.body, response);
        if (isHTML) {
            newResponse.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
        } else if (isHashedAsset) {
            newResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        } else {
            newResponse.headers.set('Cache-Control', 'public, max-age=3600');
        }

        newResponse.headers.set('X-Content-Type-Options', 'nosniff');
        newResponse.headers.set('X-Frame-Options', 'DENY');
        
        return newResponse;
    } catch (e) {
        if (e instanceof NotFoundError) {
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
// 7. 主入口
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

        // 2. API 路由
        if (url.pathname.startsWith('/api/sync') || url.pathname.startsWith('/api/v1/sync')) {
            return ApiHandler.handleSync(request, env);
        }

        // 3. 静态资源
        return handleStaticAssets(request, env, ctx);
    }
};
