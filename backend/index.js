import { getAssetFromKV, NotFoundError } from '@cloudflare/kv-asset-handler';
import manifestJSON from '__STATIC_CONTENT_MANIFEST';

const assetManifest = JSON.parse(manifestJSON);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Sync-Password, X-View-Password',
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password, hash) {
  const inputHash = await hashPassword(password);
  return inputHash === hash;
}

async function getAuthStatus(request, env) {
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

async function loadCurrentData(env) {
  const v1 = await env.YNAV_WORKER_KV.get('ynav:data:v1', 'json');
  if (v1) return v1;
  const legacy = await env.YNAV_WORKER_KV.get('ynav:data', 'json');
  return legacy;
}

class ApiHandler {
  static isD1Enabled(env) {
    return !!(env.YNAV_D1_DB && env.ENABLE_D1_SYNC === 'true');
  }

  static async handleSync(request, env) {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const auth = await getAuthStatus(request, env);

    try {
      if (action === 'health') {
        return jsonResponse({ 
          success: true, 
          healthy: true, 
          storage: this.isD1Enabled(env) ? 'hybrid' : 'kv_only'
        });
      }

      if (request.method === 'GET' && action === 'whoami') {
        return jsonResponse({
          success: true,
          apiVersion: 'v1',
          passwordRequired: auth.passwordRequired,
          canWrite: auth.canWrite,
          viewPasswordRequired: auth.viewPasswordRequired,
          canView: auth.canWrite || auth.canView,
          storageMode: this.isD1Enabled(env) ? 'hybrid' : 'kv_only',
          features: { d1: this.isD1Enabled(env), kv: true }
        });
      }

      if (!auth.canWrite && request.method !== 'GET') {
        return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
      }

      if (request.method === 'GET') {
        const data = await loadCurrentData(env);
        if (!data) {
          return jsonResponse({ success: true, data: null, message: 'No data' });
        }
        return jsonResponse({ success: true, data });
      }

      if (request.method === 'POST') {
        const body = await request.json();
        if (!body.data || !body.data.links || !body.data.categories) {
          return jsonResponse({ success: false, error: 'Invalid data' }, 400);
        }

        const existingData = await loadCurrentData(env);
        const newVersion = (existingData?.meta?.version || 0) + 1;
        const dataToSave = {
          ...body.data,
          meta: {
            ...body.data.meta,
            updatedAt: Date.now(),
            version: newVersion
          }
        };

        await env.YNAV_WORKER_KV.put('ynav:data:v1', JSON.stringify(dataToSave));
        return jsonResponse({ success: true, data: dataToSave });
      }

      return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
    } catch (error) {
      console.error('API Error:', error);
      return jsonResponse({ success: false, error: error.message || 'Server error' }, 500);
    }
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return jsonResponse({ status: 'ok', timestamp: Date.now() });
    }

    if (url.pathname.startsWith('/api/sync') || url.pathname.startsWith('/api/v1/sync')) {
      return ApiHandler.handleSync(request, env);
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
};
