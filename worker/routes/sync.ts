import { Hono } from 'hono';

const sync = new Hono();

// 所有支持的数据类型
const SUPPORTED_DATA_TYPES = [
  'links_data',
  'ynav-widgets-v9',
  'site_settings',
  'ai_config',
  'ynav-notes',
  'theme',
  'search_config',
  'rss_sources',
  'weather_city',
  'view_password'
];

// 获取数据
sync.get('/', async (c) => {
  const userId = c.req.query('userId');
  const dataType = c.req.query('dataType');
  
  if (!userId || !dataType) {
    return c.json({ error: 'missing parameters' }, 400);
  }

  if (!SUPPORTED_DATA_TYPES.includes(dataType)) {
    return c.json({ error: 'unsupported data type' }, 400);
  }

  try {
    // 从 Cloudflare KV 获取数据
    const key = `user:${userId}:${dataType}`;
    const data = await c.env.YNAV_KV.get(key);
    
    return c.json({
      userId,
      dataType,
      data: data ? JSON.parse(data) : null,
      timestamp: Date.now()
    });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// 保存数据
sync.post('/', async (c) => {
  const { userId, dataType, data, deviceId, version } = await c.req.json();
  
  if (!userId || !dataType) {
    return c.json({ error: 'missing parameters' }, 400);
  }

  if (!SUPPORTED_DATA_TYPES.includes(dataType)) {
    return c.json({ error: 'unsupported data type' }, 400);
  }

  try {
    // 检查版本冲突
    const key = `user:${userId}:${dataType}`;
    const existingMeta = await c.env.YNAV_KV.get(`meta:${key}`);
    
    if (existingMeta) {
      const meta = JSON.parse(existingMeta);
      if (meta.version && version && meta.version > version) {
        return c.json({ 
          conflict: true,
          message: '版本冲突，请先拉取最新数据'
        }, 409);
      }
    }

    // 保存数据
    await c.env.YNAV_KV.put(key, JSON.stringify(data));
    
    // 保存元数据
    await c.env.YNAV_KV.put(`meta:${key}`, JSON.stringify({
      version: (version || 0) + 1,
      deviceId,
      updatedAt: Date.now()
    }));

    return c.json({ 
      ok: true,
      version: (version || 0) + 1,
      timestamp: Date.now()
    });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// 全量同步（获取所有数据）
sync.get('/all', async (c) => {
  const userId = c.req.query('userId');
  if (!userId) {
    return c.json({ error: 'missing userId' }, 400);
  }

  try {
    const allData: Record<string, any> = {};
    
    for (const dataType of SUPPORTED_DATA_TYPES) {
      const key = `user:${userId}:${dataType}`;
      const data = await c.env.YNAV_KV.get(key);
      if (data) {
        allData[dataType] = JSON.parse(data);
      }
    }

    return c.json({
      userId,
      data: allData,
      timestamp: Date.now()
    });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

export { sync };
