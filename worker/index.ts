import { getAssetFromKV, serveSinglePageApp } from '@cloudflare/kv-asset-handler';
import automation, { automationScheduled } from './routes/automation';
import smartHome from './routes/smart-home';

export interface Env {
  YNAV_WORKER_KV: KVNamespace;
  YNAV_D1: D1Database;
  YNAV_R2: R2Bucket;
  HA_BASE_URL: string;
  HA_TOKEN: string;
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
// D1 数据库初始化 - 使用 batch 批量执行
// ==========================================
async function initializeDB(db: D1Database): Promise<void> {
  const statements = [
    db.prepare(`CREATE TABLE IF NOT EXISTS links (
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
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT,
      is_hidden INTEGER DEFAULT 0,
      order_index INTEGER DEFAULT 0,
      user_id TEXT DEFAULT 'default'
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY,
      theme TEXT DEFAULT 'dark',
      sync_password_hash TEXT,
      view_password_hash TEXT,
      ai_config TEXT,
      site_settings TEXT,
      updated_at INTEGER
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS backups (
      id TEXT PRIMARY KEY,
      name TEXT,
      size INTEGER,
      r2_key TEXT,
      created_at INTEGER,
      user_id TEXT DEFAULT 'default'
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT,
      event_data TEXT,
      created_at INTEGER DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT DEFAULT 'default',
      type TEXT,
      title TEXT NOT NULL,
      content TEXT,
      related_type TEXT,
      related_id TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS notification_settings (
      user_id TEXT PRIMARY KEY,
      email_to TEXT DEFAULT '',
      smtp_host TEXT DEFAULT '',
      smtp_port INTEGER DEFAULT 465,
      smtp_user TEXT DEFAULT '',
      smtp_pass TEXT DEFAULT '',
      vapid_public_key TEXT DEFAULT '',
      vapid_private_key TEXT DEFAULT '',
      webhook_url TEXT DEFAULT '',
      webhook_headers TEXT DEFAULT '{}',
      feishu_webhook TEXT DEFAULT '',
      feishu_secret TEXT DEFAULT '',
      dingtalk_webhook TEXT DEFAULT '',
      dingtalk_secret TEXT DEFAULT '',
      wecom_webhook TEXT DEFAULT '',
      serverchan_sckey TEXT DEFAULT '',
      telegram_bot_token TEXT DEFAULT '',
      telegram_chat_id TEXT DEFAULT '',
      success_browser INTEGER DEFAULT 1,
      success_email INTEGER DEFAULT 0,
      success_webhook INTEGER DEFAULT 0,
      success_feishu INTEGER DEFAULT 0,
      success_dingtalk INTEGER DEFAULT 0,
      success_wecom INTEGER DEFAULT 0,
      success_wechat INTEGER DEFAULT 0,
      success_telegram INTEGER DEFAULT 0,
      fail_browser INTEGER DEFAULT 1,
      fail_email INTEGER DEFAULT 1,
      fail_webhook INTEGER DEFAULT 1,
      fail_feishu INTEGER DEFAULT 1,
      fail_dingtalk INTEGER DEFAULT 1,
      fail_wecom INTEGER DEFAULT 1,
      fail_wechat INTEGER DEFAULT 1,
      fail_telegram INTEGER DEFAULT 0,
      alert_browser INTEGER DEFAULT 1,
      alert_email INTEGER DEFAULT 1,
      alert_webhook INTEGER DEFAULT 1,
      alert_feishu INTEGER DEFAULT 1,
      alert_dingtalk INTEGER DEFAULT 1,
      alert_wecom INTEGER DEFAULT 1,
      alert_wechat INTEGER DEFAULT 1,
      alert_telegram INTEGER DEFAULT 0,
      notice_browser INTEGER DEFAULT 1,
      notice_email INTEGER DEFAULT 0,
      notice_webhook INTEGER DEFAULT 0,
      notice_feishu INTEGER DEFAULT 0,
      notice_dingtalk INTEGER DEFAULT 0,
      notice_wecom INTEGER DEFAULT 0,
      notice_wechat INTEGER DEFAULT 0,
      notice_telegram INTEGER DEFAULT 0
    )`)
  ];

  try {
    await db.batch(statements);
    console.log('[D1] All tables created successfully');
  } catch (e) {
    console.error('[D1 Init Error]', e);
    // 如果 batch 失败，尝试逐个执行
    for (const stmt of statements) {
      try {
        await stmt.run();
      } catch (err) {
        console.error('[D1 Init Single Error]', err);
      }
    }
  }
}

// API 路由处理
async function handleAPI(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
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

  // RSS 代理 API - 解决跨域问题
  if (path === '/api/v1/rss') {
    return handleRSSAPI(request);
  }

  // 通用代理 API - 处理第三方API请求
  if (path === '/api/v1/proxy') {
    return handleProxyAPI(request);
  }

  // 自动化调度 API
  if (path.startsWith('/api/v1/automation')) {
    return automation.fetch(request, env, ctx);
  }

  // 智能家居 API
  if (path.startsWith('/api/v1/smart-home')) {
    return smartHome.fetch(request, env, ctx);
  }

  // 通知中心 API - 直接在主路由中处理
  if (path.startsWith('/api/v1/notifications')) {
    return handleNotificationsAPI(request, env, ctx);
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

      // 检查 D1 是否有有效数据
      const hasD1Data = (links.results && links.results.length > 0) || 
                        (categories.results && categories.results.length > 0);

      if (hasD1Data) {
        // 从 KV 获取 widgets 和 RSS 数据（结构复杂，适合存 KV）
        const kvData = await env.YNAV_WORKER_KV.get('ynav:data:v1', 'text');
        let widgets = [];
        let rssSources = [];
        let rssItems = [];
        if (kvData) {
          const parsed = JSON.parse(kvData);
          widgets = parsed.widgets || parsed.data?.widgets || [];
          rssSources = parsed.rssSources || parsed.data?.rssSources || [];
          rssItems = parsed.rssItems || parsed.data?.rssItems || [];
        }

        const syncData = {
          links: links.results || [],
          categories: categories.results || [],
          widgets: widgets,
          rssSources: rssSources,
          rssItems: rssItems,
          settings: settings || {},
          meta: { version: 1, updatedAt: Date.now(), deviceId: 'cloud' }
        };
        return new Response(JSON.stringify({ success: true, data: syncData }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      // D1 没有数据，继续执行 KV 回退逻辑
    } catch (e) {
      // D1 查询失败，继续执行 KV 回退逻辑
      console.error('D1 query failed, falling back to KV:', e);
    }
    
    // 回退到 KV (ynav:data:v1)
    const kvData = await env.YNAV_WORKER_KV.get('ynav:data:v1', 'text');
    if (!kvData) {
      return new Response(JSON.stringify({ success: false, error: 'No data found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    const parsed = JSON.parse(kvData);
    // KV 存储格式可能是: { links, categories, rssSources, rssItems, ... } 或 { data: { ... }, expectedVersion: ... }
    // 提取实际的同步数据
    let responseData;
    if (parsed.data && (parsed.data.links || parsed.data.categories || parsed.data.rssSources)) {
      // 格式: { data: { links, categories, rssSources, ... }, expectedVersion: ... }
      responseData = parsed.data;
    } else if (parsed.links || parsed.categories || parsed.rssSources) {
      // 格式: { links, categories, rssSources, ... }
      responseData = parsed;
    } else {
      responseData = parsed;
    }
    return new Response(JSON.stringify({ success: true, data: responseData }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  if (request.method === 'POST') {
    const body = await request.text();
    const data = JSON.parse(body);

    // 保存到 KV（始终使用 ynav:data:v1 保持一致性）
    await env.YNAV_WORKER_KV.put('ynav:data:v1', body);

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

      return new Response(JSON.stringify({ success: true, backups: result.results || [] }), {
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
        return new Response(JSON.stringify({ success: true, backups }), {
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

  // 链接管理 API - D1 优先，KV 回退
async function handleLinksAPI(request: Request, env: Env): Promise<Response> {
  if (request.method === 'GET') {
    try {
      const result = await env.YNAV_D1.prepare(
        'SELECT * FROM links WHERE user_id = ? ORDER BY order_index'
      ).bind('default').all();
      
      // 如果 D1 没有数据，回退到 KV
      if (!result.results || result.results.length === 0) {
        const kvData = await env.YNAV_WORKER_KV.get('ynav:data:v1', 'text');
        if (kvData) {
          const parsed = JSON.parse(kvData);
          const links = parsed.links || parsed.data?.links || [];
          return new Response(JSON.stringify({ success: true, links }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
      }
      
      return new Response(JSON.stringify({ success: true, links: result.results || [] }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (e) {
      // D1 失败，回退到 KV
      const kvData = await env.YNAV_WORKER_KV.get('ynav:data:v1', 'text');
      if (kvData) {
        const parsed = JSON.parse(kvData);
        const links = parsed.links || parsed.data?.links || [];
        return new Response(JSON.stringify({ success: true, links }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  if (request.method === 'POST') {
    const link = await request.json() as any;
    
    // 先尝试保存到 D1
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
    } catch (e) {
      console.error('D1 save failed:', e);
    }
    
    // 同时更新 KV 中的数据
    try {
      const kvData = await env.YNAV_WORKER_KV.get('ynav:data:v1', 'text');
      let data = kvData ? JSON.parse(kvData) : { links: [], categories: [] };
      if (data.data) data = data.data; // 解包嵌套
      
      // 更新或添加链接
      const existingIndex = data.links.findIndex((l: any) => l.id === link.id);
      if (existingIndex >= 0) {
        data.links[existingIndex] = { ...data.links[existingIndex], ...link };
      } else {
        data.links.push(link);
      }
      
      await env.YNAV_WORKER_KV.put('ynav:data:v1', JSON.stringify(data));
    } catch (e) {
      console.error('KV update failed:', e);
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

// 分类管理 API - D1 优先，KV 回退
async function handleCategoriesAPI(request: Request, env: Env): Promise<Response> {
  if (request.method === 'GET') {
    try {
      const result = await env.YNAV_D1.prepare(
        'SELECT * FROM categories WHERE user_id = ? ORDER BY order_index'
      ).bind('default').all();
      
      // 如果 D1 没有数据，回退到 KV
      if (!result.results || result.results.length === 0) {
        const kvData = await env.YNAV_WORKER_KV.get('ynav:data:v1', 'text');
        if (kvData) {
          const parsed = JSON.parse(kvData);
          const categories = parsed.categories || parsed.data?.categories || [];
          return new Response(JSON.stringify({ success: true, categories }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
      }
      
      return new Response(JSON.stringify({ success: true, categories: result.results || [] }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (e) {
      // D1 失败，回退到 KV
      const kvData = await env.YNAV_WORKER_KV.get('ynav:data:v1', 'text');
      if (kvData) {
        const parsed = JSON.parse(kvData);
        const categories = parsed.categories || parsed.data?.categories || [];
        return new Response(JSON.stringify({ success: true, categories }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  if (request.method === 'POST') {
    const cat = await request.json() as any;
    
    // 先尝试保存到 D1
    try {
      await env.YNAV_D1.prepare(`
        INSERT OR REPLACE INTO categories 
        (id, name, icon, is_hidden, order_index, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        cat.id, cat.name, cat.icon || '', cat.hidden ? 1 : 0, cat.order || 0, 'default'
      ).run();
    } catch (e) {
      console.error('D1 save failed:', e);
    }
    
    // 同时更新 KV 中的数据
    try {
      const kvData = await env.YNAV_WORKER_KV.get('ynav:data:v1', 'text');
      let data = kvData ? JSON.parse(kvData) : { links: [], categories: [] };
      if (data.data) data = data.data; // 解包嵌套
      
      // 更新或添加分类
      const existingIndex = data.categories.findIndex((c: any) => c.id === cat.id);
      if (existingIndex >= 0) {
        data.categories[existingIndex] = { ...data.categories[existingIndex], ...cat };
      } else {
        data.categories.push(cat);
      }
      
      await env.YNAV_WORKER_KV.put('ynav:data:v1', JSON.stringify(data));
    } catch (e) {
      console.error('KV update failed:', e);
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

// RSS 代理 API - 解决跨域问题
async function handleRSSAPI(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const rssUrl = url.searchParams.get('url');

  if (!rssUrl) {
    return new Response(JSON.stringify({ error: 'Missing URL parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // 验证 URL 格式
  try {
    new URL(rssUrl);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid URL format' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  try {
    const targetUrl = new URL(rssUrl);

    // 设置请求头模拟浏览器
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Referer': targetUrl.origin,
      'Cache-Control': 'no-cache'
    };

    // 获取 RSS 内容
    const response = await fetch(rssUrl, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ 
        error: `Failed to fetch RSS: HTTP ${response.status}` 
      }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // 获取内容类型
    const contentType = response.headers.get('content-type') || 'application/xml';
    
    // 获取文本内容
    const xmlText = await response.text();

    // 返回 XML 内容
    return new Response(xmlText, {
      status: 200,
      headers: {
        'Content-Type': contentType.includes('xml') ? contentType : 'application/xml',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=300'
      }
    });
  } catch (error) {
    console.error('RSS proxy error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to fetch RSS feed'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// 通用代理 API - 处理第三方API请求
async function handleProxyAPI(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  try {
    const body = await request.json() as { url: string; method?: string; headers?: Record<string, string>; body?: string };
    const { url: targetUrl, method = 'GET', headers = {}, body: requestBody } = body;

    if (!targetUrl) {
      return new Response(JSON.stringify({ error: 'Missing URL parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // 验证 URL 格式
    try {
      new URL(targetUrl);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid URL format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // 构建请求头
    const requestHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, text/html, */*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      ...headers
    };

    // 发送请求
    const fetchOptions: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (method === 'POST' && requestBody) {
      fetchOptions.body = requestBody;
    }

    const response = await fetch(targetUrl, fetchOptions);

    // 获取响应内容
    const responseText = await response.text();
    
    // 获取响应头中的内容类型
    const responseContentType = response.headers.get('content-type') || 'application/json';

    // 返回响应
    return new Response(responseText, {
      status: response.status,
      headers: {
        'Content-Type': responseContentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=60'
      }
    });
  } catch (error) {
    console.error('Proxy API error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Proxy request failed'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// 通知中心 API - 直接在主路由中处理
async function handleNotificationsAPI(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  
  try {
    // GET /api/v1/notifications/settings
    if (path === '/api/v1/notifications/settings' && method === 'GET') {
      const userId = url.searchParams.get('userId');
      if (!userId) {
        return new Response(JSON.stringify({ error: 'missing userId' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      let settings = await env.YNAV_D1.prepare(
        'SELECT * FROM notification_settings WHERE user_id = ?'
      ).bind(userId).first();

      // 如果没有配置，返回默认值
      if (!settings) {
        settings = {
          user_id: userId,
          email_to: '',
          smtp_host: '',
          smtp_port: 465,
          smtp_user: '',
          smtp_pass: '',
          vapid_public_key: '',
          vapid_private_key: '',
          webhook_url: '',
          webhook_headers: '{}',
          feishu_webhook: '',
          feishu_secret: '',
          dingtalk_webhook: '',
          dingtalk_secret: '',
          wecom_webhook: '',
          serverchan_sckey: '',
          success_browser: 1,
          success_email: 0,
          success_webhook: 0,
          success_feishu: 0,
          success_dingtalk: 0,
          success_wecom: 0,
          success_wechat: 0,
          fail_browser: 1,
          fail_email: 1,
          fail_webhook: 1,
          fail_feishu: 1,
          fail_dingtalk: 1,
          fail_wecom: 1,
          fail_wechat: 1,
          alert_browser: 1,
          alert_email: 1,
          alert_webhook: 1,
          alert_feishu: 1,
          alert_dingtalk: 1,
          alert_wecom: 1,
          alert_wechat: 1,
          notice_browser: 1,
          notice_email: 0,
          notice_webhook: 0,
          notice_feishu: 0,
          notice_dingtalk: 0,
          notice_wecom: 0,
          notice_wechat: 0,
        };
      }

      return new Response(JSON.stringify(settings), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // GET /api/v1/notifications/unread-count
    if (path === '/api/v1/notifications/unread-count' && method === 'GET') {
      const userId = url.searchParams.get('userId');
      if (!userId) {
        return new Response(JSON.stringify({ count: 0 }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const result = await env.YNAV_D1.prepare(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0'
      ).bind(userId).first();

      return new Response(JSON.stringify({ count: result?.count || 0 }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // GET /api/v1/notifications - 获取通知列表
    if (path === '/api/v1/notifications' && method === 'GET') {
      const userId = url.searchParams.get('userId');
      const isRead = url.searchParams.get('isRead');
      const type = url.searchParams.get('type');
      const limit = Number(url.searchParams.get('limit')) || 50;
      const offset = Number(url.searchParams.get('offset')) || 0;

      if (!userId) {
        return new Response(JSON.stringify({ error: 'missing userId' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      let query = 'SELECT * FROM notifications WHERE user_id = ?';
      const params: any[] = [userId];

      if (isRead !== null) {
        query += ' AND is_read = ?';
        params.push(isRead === '1' ? 1 : 0);
      }

      if (type) {
        query += ' AND type = ?';
        params.push(type);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const { results } = await env.YNAV_D1.prepare(query).bind(...params).all();

      const unreadResult = await env.YNAV_D1.prepare(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0'
      ).bind(userId).first();

      return new Response(JSON.stringify({
        notifications: results,
        unreadCount: unreadResult?.count || 0,
        total: results.length
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // POST /api/v1/notifications/settings - 保存配置
    if (path === '/api/v1/notifications/settings' && method === 'POST') {
      const body = await request.json() as any;
      const { userId, ...data } = body;
      if (!userId) {
        return new Response(JSON.stringify({ error: 'missing userId' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const keys = Object.keys(data);
      const values = Object.values(data);

      const columns = ['user_id', ...keys].join(', ');
      const placeholders = values.map(() => '?').join(', ');

      await env.YNAV_D1.prepare(
        `INSERT OR REPLACE INTO notification_settings (${columns}) VALUES (?, ${placeholders})`
      ).bind(userId, ...values).run();

      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // POST /api/v1/notifications/test - 测试推送
    if (path === '/api/v1/notifications/test' && method === 'POST') {
      const body = await request.json() as any;
      const { userId, channel } = body;
      
      if (!userId || !channel) {
        return new Response(JSON.stringify({ error: 'Missing userId or channel' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // 获取用户设置
      const settings = await env.YNAV_D1.prepare(
        'SELECT * FROM notification_settings WHERE user_id = ?'
      ).bind(userId).first();

      if (!settings) {
        return new Response(JSON.stringify({ error: 'No notification settings found' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const title = 'L-Nav 测试推送';
      const content = `这是一条通过 [${channel}] 渠道发送的测试通知`;
      
      try {
        // 根据渠道发送推送
        if (channel === 'wechat') {
          if (!settings.serverchan_sckey) {
            return new Response(JSON.stringify({ error: 'ServerChan SCKEY not configured' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }
          // 发送到 ServerChan (微信)
          const resp = await fetch(`https://sctapi.ftqq.com/${settings.serverchan_sckey}.send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `title=${encodeURIComponent(title)}&desp=${encodeURIComponent(content)}`
          });
          const result = await resp.json();
          if (!result.code === 0 && result.data) {
            throw new Error(result.message || 'ServerChan API error');
          }
        } else if (channel === 'email') {
          // TODO: 邮件发送
          console.log('[Test] Email push:', settings.email_to);
        } else if (channel === 'webhook') {
          if (settings.webhook_url) {
            await fetch(settings.webhook_url, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                ...JSON.parse(settings.webhook_headers || '{}')
              },
              body: JSON.stringify({ title, content })
            });
          }
        } else if (channel === 'feishu') {
          if (settings.feishu_webhook) {
            await fetch(settings.feishu_webhook, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                msg_type: 'text',
                content: { text: `[${title}] ${content}` }
              })
            });
          }
        } else if (channel === 'dingtalk') {
          if (settings.dingtalk_webhook) {
            await fetch(settings.dingtalk_webhook, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                msgtype: 'text',
                text: { content: `[${title}] ${content}` }
              })
            });
          }
        } else if (channel === 'wecom') {
          if (settings.wecom_webhook) {
            await fetch(settings.wecom_webhook, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                msgtype: 'text',
                text: { content: `[${title}] ${content}` }
              })
            });
          }
        } else if (channel === 'telegram') {
          if (!settings.telegram_bot_token || !settings.telegram_chat_id) {
            return new Response(JSON.stringify({ error: 'Telegram Bot Token 或 Chat ID 未配置' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }
          // 发送到 Telegram Bot
          const resp = await fetch(`https://api.telegram.org/bot${settings.telegram_bot_token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: settings.telegram_chat_id,
              text: `<b>${title}</b>\n\n${content}`,
              parse_mode: 'HTML'
            })
          });
          const result = await resp.json();
          if (!result.ok) {
            throw new Error(result.description || 'Telegram API error');
          }
        }

        // 创建测试通知记录
        await env.YNAV_D1.prepare(`
          INSERT INTO notifications (user_id, type, title, content, is_read, created_at)
          VALUES (?, 'system_notice', ?, ?, 0, datetime('now'))
        `).bind(userId, title, content).run();

        return new Response(JSON.stringify({ 
          ok: true, 
          message: '测试推送已发送',
          channel
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (err: any) {
        console.error('[Test Push Error]', err);
        return new Response(JSON.stringify({ 
          ok: false, 
          error: err.message || 'Push failed'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // 未匹配的路由返回 404
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (err: any) {
    console.error('[Notifications API Error]', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // 处理 API 请求
    if (url.pathname.startsWith('/api/')) {
      return handleAPI(request, env, ctx);
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
