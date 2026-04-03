import { getAssetFromKV, serveSinglePageApp } from '@cloudflare/kv-asset-handler';

export interface Env {
  YNAV_WORKER_KV: KVNamespace;
  YNAV_D1: D1Database;
  YNAV_R2: R2Bucket;
}

// CORS 响应头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// 处理 CORS 预检请求
function handleCORS(request: Request): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

// ==========================================
// D1 数据库初始化
// ==========================================
async function initializeDB(db: D1Database): Promise<void> {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS links (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      description TEXT,
      category_id TEXT,
      icon TEXT,
      favicon TEXT,
      is_pinned INTEGER DEFAULT 0,
      is_hidden INTEGER DEFAULT 0,
      order_index INTEGER DEFAULT 0,
      created_at INTEGER,
      updated_at INTEGER,
      user_id TEXT DEFAULT 'default'
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT,
      is_hidden INTEGER DEFAULT 0,
      order_index INTEGER DEFAULT 0,
      user_id TEXT DEFAULT 'default'
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY,
      theme TEXT DEFAULT 'dark',
      sync_password_hash TEXT,
      view_password_hash TEXT,
      ai_config TEXT,
      site_settings TEXT,
      updated_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS backups (
      id TEXT PRIMARY KEY,
      name TEXT,
      size INTEGER,
      r2_key TEXT,
      created_at INTEGER,
      user_id TEXT DEFAULT 'default'
    );

    CREATE TABLE IF NOT EXISTS analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT,
      event_data TEXT,
      created_at INTEGER DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// API 路由处理
async function handleAPI(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  // 处理 CORS 预检
  if (request.method === 'OPTIONS') {
    return handleCORS(request);
  }

  // 初始化数据库
  try {
    await initializeDB(env.YNAV_D1);
  } catch (e) {
    console.error('D1 init failed, using KV fallback:', e);
  }

  // 同步 API - 优先 D1，回退 KV
  if (path === '/api/v1/sync' || path === '/api/sync') {
    return handleSyncAPI(request, env);
  }

  // 备份 API - 使用 R2 存储大文件
  if (path.startsWith('/api/v1/backup')) {
    return handleBackupAPI(request, env);
  }

  // 链接管理 API
  if (path.startsWith('/api/v1/links')) {
    return handleLinksAPI(request, env);
  }

  // 分类管理 API
  if (path.startsWith('/api/v1/categories')) {
    return handleCategoriesAPI(request, env);
  }

  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

  // 同步 API - D1 优先，KV 回退
async function handleSyncAPI(request: Request, env: Env): Promise<Response> {
  if (request.method === 'GET') {
    try {
      // 尝试从 D1 获取
      const links = await env.YNAV_D1.prepare(
        'SELECT * FROM links WHERE user_id = ? ORDER BY order_index'
      ).bind('default').all();

      const categories = await env.YNAV_D1.prepare(
        'SELECT * FROM categories WHERE user_id = ? ORDER BY order_index'
      ).bind('default').all();

      const settings = await env.YNAV_D1.prepare(
        'SELECT * FROM user_settings WHERE user_id = ?'
      ).bind('default').first();

      const syncData = {
        links: links.results || [],
        categories: categories.results || [],
        settings: settings || {},
        meta: { version: 1, updatedAt: Date.now(), deviceId: 'cloud' }
      };

      return new Response(JSON.stringify(syncData), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (e) {
      // D1 失败，回退到 KV
      const data = await env.YNAV_WORKER_KV.get('sync:data', 'text');
      if (!data) {
        return new Response(JSON.stringify({ error: 'No data found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      return new Response(data, {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  if (request.method === 'POST') {
    const body = await request.text();
    const data = JSON.parse(body);

    // 保存到 KV（始终）
    await env.YNAV_WORKER_KV.put('sync:data', body);

    // 尝试保存到 D1
    try {
      await saveToD1(env.YNAV_D1, data);
      return new Response(JSON.stringify({ success: true, storage: 'd1+kv' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (e) {
      return new Response(JSON.stringify({ success: true, storage: 'kv' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

// 保存到 D1
async function saveToD1(db: D1Database, data: any): Promise<void> {
  const { links, categories } = data;

  if (links && links.length > 0) {
    for (const link of links) {
      await db.prepare(`
        INSERT OR REPLACE INTO links 
        (id, title, url, description, category_id, icon, favicon, is_pinned, is_hidden, order_index, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        link.id, link.title, link.url, link.description || '', link.categoryId || link.category_id,
        link.icon || '', link.favicon || '', link.pinned ? 1 : 0, link.hidden ? 1 : 0,
        link.order || 0, link.createdAt || Date.now(), Date.now(), 'default'
      ).run();
    }
  }

  if (categories && categories.length > 0) {
    for (const cat of categories) {
      await db.prepare(`
        INSERT OR REPLACE INTO categories 
        (id, name, icon, is_hidden, order_index, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        cat.id, cat.name, cat.icon || '', cat.hidden ? 1 : 0, cat.order || 0, 'default'
      ).run();
    }
  }
}

  // 备份 API - R2 存储文件，D1 记录元数据
async function handleBackupAPI(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const backupKey = url.searchParams.get('key');
  const name = url.searchParams.get('name') || backupKey;

  if (request.method === 'POST' && backupKey) {
    const body = await request.arrayBuffer();
    const r2Key = `backups/${backupKey}.json`;

    // 保存到 R2
    await env.YNAV_R2.put(r2Key, body, {
      httpMetadata: { contentType: 'application/json' },
      customMetadata: { name: name || backupKey, createdAt: Date.now().toString() }
    });

    // 记录元数据到 D1
    try {
      await env.YNAV_D1.prepare(`
        INSERT OR REPLACE INTO backups (id, name, size, r2_key, created_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(backupKey, name, body.byteLength, r2Key, Date.now(), 'default').run();
    } catch (e) {
      // D1 失败时记录到 KV
      await env.YNAV_WORKER_KV.put(`backup_meta:${backupKey}`, JSON.stringify({
        id: backupKey, name, size: body.byteLength, r2Key, createdAt: Date.now()
      }));
    }

    return new Response(JSON.stringify({ success: true, key: backupKey }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  if (request.method === 'GET') {
    if (backupKey) {
      // 从 R2 获取备份文件
      const r2Key = `backups/${backupKey}.json`;
      const object = await env.YNAV_R2.get(r2Key);

      if (!object) {
        return new Response(JSON.stringify({ error: 'Backup not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      return new Response(object.body, {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } else {
      // 列出所有备份（优先 D1，回退 KV）
      try {
        const result = await env.YNAV_D1.prepare(
          'SELECT id, name, size, created_at FROM backups WHERE user_id = ? ORDER BY created_at DESC'
        ).bind('default').all();

        return new Response(JSON.stringify({ backups: result.results || [] }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (e) {
        // 从 KV 获取备份列表
        const list = await env.YNAV_WORKER_KV.list({ prefix: 'backup_meta:' });
        const backups = [];
        for (const key of list.keys) {
          const meta = await env.YNAV_WORKER_KV.get(key.name, 'text');
          if (meta) backups.push(JSON.parse(meta));
        }
        return new Response(JSON.stringify({ backups }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }
  }

  if (request.method === 'DELETE' && backupKey) {
    const r2Key = `backups/${backupKey}.json`;
    await env.YNAV_R2.delete(r2Key);

    // 同时删除元数据
    try {
      await env.YNAV_D1.prepare('DELETE FROM backups WHERE id = ?').bind(backupKey).run();
    } catch (e) {
      await env.YNAV_WORKER_KV.delete(`backup_meta:${backupKey}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  return new Response(JSON.stringify({ error: 'Invalid request' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

  // 链接管理 API
async function handleLinksAPI(request: Request, env: Env): Promise<Response> {
  if (request.method === 'GET') {
    try {
      const result = await env.YNAV_D1.prepare(
        'SELECT * FROM links WHERE user_id = ? ORDER BY order_index'
      ).bind('default').all();
      return new Response(JSON.stringify({ links: result.results || [] }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  if (request.method === 'POST') {
    const link = await request.json() as any;
    try {
      await env.YNAV_D1.prepare(`
        INSERT OR REPLACE INTO links 
        (id, title, url, description, category_id, icon, favicon, is_pinned, is_hidden, order_index, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        link.id, link.title, link.url, link.description || '', link.categoryId,
        link.icon || '', link.favicon || '', link.pinned ? 1 : 0, link.hidden ? 1 : 0,
        link.order || 0, link.createdAt || Date.now(), Date.now(), 'default'
      ).run();
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Failed to save link' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

// 分类管理 API
async function handleCategoriesAPI(request: Request, env: Env): Promise<Response> {
  if (request.method === 'GET') {
    try {
      const result = await env.YNAV_D1.prepare(
        'SELECT * FROM categories WHERE user_id = ? ORDER BY order_index'
      ).bind('default').all();
      return new Response(JSON.stringify({ categories: result.results || [] }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  if (request.method === 'POST') {
    const cat = await request.json() as any;
    try {
      await env.YNAV_D1.prepare(`
        INSERT OR REPLACE INTO categories 
        (id, name, icon, is_hidden, order_index, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        cat.id, cat.name, cat.icon || '', cat.hidden ? 1 : 0, cat.order || 0, 'default'
      ).run();
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Failed to save category' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // 处理 API 请求
    if (url.pathname.startsWith('/api/')) {
      return handleAPI(request, env);
    }

    // 处理静态资源请求
    try {
      const response = await getAssetFromKV(
        {
          request,
          waitUntil: ctx.waitUntil.bind(ctx),
        },
        {
          ASSET_NAMESPACE: env.YNAV_WORKER_KV,
          mapRequestToAsset: serveSinglePageApp,
        }
      );
      return response;
    } catch (e) {
      // 如果资源不存在，返回 index.html (SPA 路由)
      return new Response('Not Found', { status: 404 });
    }
  },
};
