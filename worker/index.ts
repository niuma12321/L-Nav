import { getAssetFromKV, serveSinglePageApp } from '@cloudflare/kv-asset-handler';

export interface Env {
  YNAV_WORKER_KV: KVNamespace;
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

// API 路由处理
async function handleAPI(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  // 处理 CORS 预检
  if (request.method === 'OPTIONS') {
    return handleCORS(request);
  }

  // 同步 API
  if (path === '/api/v1/sync' || path === '/api/sync') {
    if (request.method === 'GET') {
      // 拉取数据
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

    if (request.method === 'POST') {
      // 推送数据
      const body = await request.text();
      await env.YNAV_WORKER_KV.put('sync:data', body);
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  // 备份相关 API
  if (path.startsWith('/api/v1/backup')) {
    const backupKey = url.searchParams.get('key');
    
    if (request.method === 'POST' && backupKey) {
      // 创建备份
      const body = await request.text();
      await env.YNAV_WORKER_KV.put(`backup:${backupKey}`, body);
      return new Response(JSON.stringify({ success: true, key: backupKey }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    if (request.method === 'GET') {
      if (backupKey) {
        // 获取特定备份
        const data = await env.YNAV_WORKER_KV.get(`backup:${backupKey}`, 'text');
        if (!data) {
          return new Response(JSON.stringify({ error: 'Backup not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        return new Response(data, {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } else {
        // 列出所有备份
        const list = await env.YNAV_WORKER_KV.list({ prefix: 'backup:' });
        const backups = list.keys.map(k => ({
          key: k.name.replace('backup:', '')
        }));
        return new Response(JSON.stringify({ backups }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    if (request.method === 'DELETE' && backupKey) {
      // 删除备份
      await env.YNAV_WORKER_KV.delete(`backup:${backupKey}`);
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
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
