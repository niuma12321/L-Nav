import { Hono } from 'hono';

const smartHome = new Hono<{ Bindings: Env }>();

// 从环境变量读取配置
const getHAConfig = (c: any) => ({
  baseUrl: c.env.HA_BASE_URL || '',
  token: c.env.HA_TOKEN || ''
});

// 1. 同步并获取所有设备
smartHome.get('/devices', async (c) => {
  const userId = c.req.query('userId');
  if (!userId) return c.json({ error: '缺少用户ID' }, 400);

  // 返回缓存数据
  const cached = await c.env.DB.prepare('SELECT * FROM smart_devices WHERE user_id = ?').bind(userId).all();

  // 异步从Home Assistant拉取最新状态
  const { baseUrl, token } = getHAConfig(c);
  if (baseUrl && token) {
    c.executionCtx.waitUntil(syncDevicesFromHA(userId, c.env, baseUrl, token));
  }

  return c.json(cached.results);
});

// 2. 控制设备
smartHome.post('/devices/:deviceId/control', async (c) => {
  const deviceId = c.req.param('deviceId');
  const { action, params } = await c.req.json();
  const userId = c.req.query('userId');
  if (!userId) return c.json({ error: '缺少用户ID' }, 400);

  const { baseUrl, token } = getHAConfig(c);
  if (baseUrl && token) {
    // 调用Home Assistant API
    const res = await fetch(`${baseUrl}/services/${action}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ entity_id: deviceId, ...params })
    });

    if (res.ok) {
      // 更新本地缓存状态
      await c.env.DB.prepare(`
        UPDATE smart_devices 
        SET state = ?, attributes = ?, last_updated = (strftime('%s', 'now') * 1000)
        WHERE device_id = ? AND user_id = ?
      `).bind(params.state || 'on', JSON.stringify(params), deviceId, userId).run();
    }

    return c.json({ success: res.ok });
  }

  // 如果没有配置，直接更新本地状态
  await c.env.DB.prepare(`
    UPDATE smart_devices 
    SET state = ?, attributes = ?, last_updated = (strftime('%s', 'now') * 1000)
    WHERE device_id = ? AND user_id = ?
  `).bind(params.state || 'on', JSON.stringify(params), deviceId, userId).run();

  return c.json({ success: true });
});

// 3. 获取场景列表
smartHome.get('/scenes', async (c) => {
  const userId = c.req.query('userId');
  if (!userId) return c.json({ error: '缺少用户ID' }, 400);

  const cached = await c.env.DB.prepare('SELECT * FROM smart_scenes WHERE user_id = ?').bind(userId).all();
  
  const { baseUrl, token } = getHAConfig(c);
  if (baseUrl && token) {
    c.executionCtx.waitUntil(syncScenesFromHA(userId, c.env, baseUrl, token));
  }
  
  return c.json(cached.results);
});

// 4. 执行场景
smartHome.post('/scenes/:sceneId/run', async (c) => {
  const sceneId = c.req.param('sceneId');
  const userId = c.req.query('userId');
  if (!userId) return c.json({ error: '缺少用户ID' }, 400);

  const { baseUrl, token } = getHAConfig(c);
  if (baseUrl && token) {
    await fetch(`${baseUrl}/services/scene/turn_on`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ entity_id: sceneId })
    });
  }

  await c.env.DB.prepare('UPDATE smart_scenes SET last_triggered = (strftime(\'%s\', \'now\') * 1000) WHERE scene_id = ? AND user_id = ?').bind(sceneId, userId).run();
  return c.json({ success: true });
});

// ==========================================
// 同步函数
// ==========================================
async function syncDevicesFromHA(userId: string, env: Env, baseUrl: string, token: string) {
  try {
    const res = await fetch(`${baseUrl}/states`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const states = await res.json();

    for (const state of states) {
      if (['light.', 'switch.', 'climate.', 'sensor.', 'cover.'].some(prefix => state.entity_id.startsWith(prefix))) {
        await env.DB.prepare(`
          INSERT OR REPLACE INTO smart_devices 
          (user_id, platform, device_id, name, type, state, attributes, last_updated)
          VALUES (?, ?, ?, ?, ?, ?, ?, (strftime('%s', 'now') * 1000))
        `).bind(
          userId, 'homeassistant', state.entity_id,
          state.attributes.friendly_name || state.entity_id,
          state.entity_id.split('.')[0],
          state.state,
          JSON.stringify(state.attributes)
        ).run();
      }
    }
  } catch (e) {
    console.error('同步设备失败', e);
  }
}

async function syncScenesFromHA(userId: string, env: Env, baseUrl: string, token: string) {
  try {
    const res = await fetch(`${baseUrl}/states`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const states = await res.json();

    for (const state of states) {
      if (state.entity_id.startsWith('scene.')) {
        await env.DB.prepare(`
          INSERT OR REPLACE INTO smart_scenes 
          (user_id, platform, scene_id, name, icon, last_triggered)
          VALUES (?, ?, ?, ?, ?, (strftime('%s', 'now') * 1000))
        `).bind(
          userId, 'homeassistant', state.entity_id,
          state.attributes.friendly_name || state.entity_id,
          state.attributes.icon
        ).run();
      }
    }
  } catch (e) {
    console.error('同步场景失败', e);
  }
}

// ==========================================
// 设备告警通知函数
// ==========================================

// 创建设备告警通知
async function createDeviceAlert(
  userId: string,
  deviceName: string,
  deviceId: string,
  alertType: 'offline' | 'error' | 'battery_low',
  message: string,
  env: Env
) {
  try {
    const titles: Record<string, string> = {
      offline: `⚠️ 设备「${deviceName}」离线`,
      error: `⚠️ 设备「${deviceName}」异常`,
      battery_low: `🔋 设备「${deviceName}」电量不足`
    };

    await env.DB.prepare(`
      INSERT INTO notifications (user_id, type, title, content, related_type, related_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      userId,
      'device_alert',
      titles[alertType],
      message,
      'device',
      deviceId
    ).run();
  } catch (e) {
    console.error('创建设备告警通知失败:', e);
  }
}

export { createDeviceAlert };
export default smartHome;
