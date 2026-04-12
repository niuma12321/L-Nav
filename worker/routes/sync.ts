/**
 * Cloudflare Worker 同步路由
 * 支持 D1 数据库存储结构化数据，KV 存储复杂对象
 */

export interface SyncData {
  links?: any[];
  categories?: any[];
  widgets?: any[];
  notes?: any[];
  rssSources?: any[];
  settings?: Record<string, any>;
  theme?: string;
  searchConfig?: any;
  aiConfig?: any;
  siteSettings?: any;
  lastModified?: number;
}

export interface SyncRequest {
  deviceId: string;
  deviceName: string;
  data: SyncData;
  lastSync?: number;
}

// CORS 响应头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// 处理 OPTIONS 预检请求
function handleOptions(request: Request): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// 验证请求
async function validateRequest(request: Request): Promise<{ valid: boolean; userId?: string; error?: string }> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or invalid authorization header' };
  }
  
  const token = authHeader.substring(7);
  // 简单的令牌验证（生产环境应使用 JWT）
  if (token !== 'ynav_ljq_token_2024') {
    return { valid: false, error: 'Invalid token' };
  }
  
  return { valid: true, userId: 'ljq' };
}

// GET /api/sync - 拉取数据
async function handleGetSync(request: Request, env: any): Promise<Response> {
  try {
    const validation = await validateRequest(request);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    const userId = validation.userId!;
    
    // 尝试从 D1 获取数据
    try {
      const result = await env.YNAV_D1.prepare(
        `SELECT data, last_modified FROM user_sync_data WHERE user_id = ?`
      ).bind(userId).first();
      
      if (result) {
        return new Response(JSON.stringify({
          success: true,
          data: JSON.parse(result.data as string),
          lastModified: result.last_modified,
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    } catch (e) {
      console.error('D1 query failed:', e);
    }
    
    // 回退到 KV
    const kvData = await env.YNAV_WORKER_KV.get(`sync:${userId}`);
    if (kvData) {
      const parsed = JSON.parse(kvData);
      return new Response(JSON.stringify({
        success: true,
        data: parsed.data,
        lastModified: parsed.lastModified,
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    // 没有数据
    return new Response(JSON.stringify({
      success: true,
      data: {},
      lastModified: 0,
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
    
  } catch (error) {
    console.error('Sync GET error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

// POST /api/sync - 推送数据
async function handlePostSync(request: Request, env: any): Promise<Response> {
  try {
    const validation = await validateRequest(request);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    const userId = validation.userId!;
    const body: SyncRequest = await request.json();
    const { deviceId, deviceName, data, lastSync } = body;
    
    const now = Date.now();
    
    // 保存到 D1
    try {
      await env.YNAV_D1.prepare(
        `INSERT INTO user_sync_data (user_id, data, last_modified, device_id, device_name) 
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (user_id) DO UPDATE SET
         data = excluded.data,
         last_modified = excluded.last_modified,
         device_id = excluded.device_id,
         device_name = excluded.device_name`
      ).bind(
        userId,
        JSON.stringify(data),
        now,
        deviceId,
        deviceName
      ).run();
    } catch (e) {
      console.error('D1 save failed, falling back to KV:', e);
      
      // 回退到 KV
      await env.YNAV_WORKER_KV.put(`sync:${userId}`, JSON.stringify({
        data,
        lastModified: now,
        deviceId,
        deviceName,
      }));
    }
    
    return new Response(JSON.stringify({
      success: true,
      lastModified: now,
      message: 'Data synced successfully',
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
    
  } catch (error) {
    console.error('Sync POST error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

// PUT /api/sync - 合并数据（解决冲突）
async function handlePutSync(request: Request, env: any): Promise<Response> {
  try {
    const validation = await validateRequest(request);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    const userId = validation.userId!;
    const body: SyncRequest = await request.json();
    const { data } = body;
    
    // 获取服务器现有数据
    let serverData: SyncData = {};
    try {
      const result = await env.YNAV_D1.prepare(
        `SELECT data FROM user_sync_data WHERE user_id = ?`
      ).bind(userId).first();
      
      if (result) {
        serverData = JSON.parse(result.data as string);
      }
    } catch (e) {
      const kvData = await env.YNAV_WORKER_KV.get(`sync:${userId}`);
      if (kvData) {
        serverData = JSON.parse(kvData).data || {};
      }
    }
    
    // 简单合并策略：客户端数据优先，保留服务器独有的数据
    const mergedData: SyncData = {
      ...serverData,
      ...data,
      // 数组类型的数据需要特殊处理
      links: data.links || serverData.links,
      categories: data.categories || serverData.categories,
      widgets: data.widgets || serverData.widgets,
      notes: data.notes || serverData.notes,
      rssSources: data.rssSources || serverData.rssSources,
      settings: { ...serverData.settings, ...data.settings },
      lastModified: Date.now(),
    };
    
    // 保存合并后的数据
    const now = Date.now();
    try {
      await env.YNAV_D1.prepare(
        `INSERT INTO user_sync_data (user_id, data, last_modified) 
         VALUES (?, ?, ?)
         ON CONFLICT (user_id) DO UPDATE SET
         data = excluded.data,
         last_modified = excluded.last_modified`
      ).bind(userId, JSON.stringify(mergedData), now).run();
    } catch (e) {
      await env.YNAV_WORKER_KV.put(`sync:${userId}`, JSON.stringify({
        data: mergedData,
        lastModified: now,
      }));
    }
    
    return new Response(JSON.stringify({
      success: true,
      data: mergedData,
      lastModified: now,
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
    
  } catch (error) {
    console.error('Sync PUT error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

// 主处理函数
export default async function handleSync(request: Request, env: any): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return handleOptions(request);
  }
  
  switch (request.method) {
    case 'GET':
      return handleGetSync(request, env);
    case 'POST':
      return handlePostSync(request, env);
    case 'PUT':
      return handlePutSync(request, env);
    default:
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
  }
}
