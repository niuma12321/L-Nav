import { Hono } from 'hono';
import type { Env } from '../index';

const notifications = new Hono<{ Bindings: Env }>();

// 错误处理中间件
notifications.onError((err, c) => {
  console.error('[Notifications Error]', err);
  return c.json({ error: 'Internal Server Error', message: err.message }, 500);
});

// ==========================================
// 1. 通知查询接口
// ==========================================

// 获取通知列表（支持分页、筛选）
notifications.get('/', async (c) => {
  try {
    const userId = c.req.query('userId');
    const isRead = c.req.query('isRead');
    const type = c.req.query('type');
    const limit = Number(c.req.query('limit')) || 50;
    const offset = Number(c.req.query('offset')) || 0;

    if (!userId) return c.json({ error: 'missing userId' }, 400);

    let query = 'SELECT * FROM notifications WHERE user_id = ?';
    const params: any[] = [userId];

    if (isRead !== undefined) {
      query += ' AND is_read = ?';
      params.push(isRead === '1' ? 1 : 0);
    }

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const { results } = await c.env.YNAV_D1.prepare(query).bind(...params).all();

    const unreadResult = await c.env.YNAV_D1.prepare(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0'
    ).bind(userId).first();

    return c.json({
      notifications: results,
      unreadCount: unreadResult?.count || 0,
      total: results.length
    });
  } catch (err: any) {
    console.error('[Notifications GET / Error]', err);
    return c.json({ error: err.message }, 500);
  }
});

// 获取未读数量（轻量接口，用于顶部角标）
notifications.get('/unread-count', async (c) => {
  try {
    const userId = c.req.query('userId');
    if (!userId) return c.json({ count: 0 });

    const result = await c.env.YNAV_D1.prepare(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0'
    ).bind(userId).first();

    return c.json({ count: result?.count || 0 });
  } catch (err: any) {
    console.error('[Notifications GET /unread-count Error]', err);
    return c.json({ count: 0 });
  }
});

// ==========================================
// 2. 通知操作接口
// ==========================================

// 标记单条已读
notifications.post('/:id/read', async (c) => {
  const id = c.req.param('id');
  const userId = c.req.query('userId');
  await c.env.YNAV_D1.prepare(
    'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?'
  ).bind(id, userId).run();
  return c.json({ success: true });
});

// 标记全部已读
notifications.post('/read-all', async (c) => {
  const userId = c.req.query('userId');
  await c.env.YNAV_D1.prepare(
    'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0'
  ).bind(userId).run();
  return c.json({ success: true });
});

// 删除通知
notifications.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const userId = c.req.query('userId');
  await c.env.YNAV_D1.prepare(
    'DELETE FROM notifications WHERE id = ? AND user_id = ?'
  ).bind(id, userId).run();
  return c.json({ success: true });
});

// 清空所有已读
notifications.delete('/clear-read', async (c) => {
  const userId = c.req.query('userId');
  await c.env.YNAV_D1.prepare(
    'DELETE FROM notifications WHERE user_id = ? AND is_read = 1'
  ).bind(userId).run();
  return c.json({ success: true });
});

// ==========================================
// 3. 通知配置接口（新 - 单条记录模式）
// ==========================================

// 获取配置
notifications.get('/settings', async (c) => {
  try {
    console.log('[Notifications] /settings called, checking env...');
    console.log('[Notifications] c.env keys:', Object.keys(c.env || {}));
    
    const userId = c.req.query('userId');
    if (!userId) {
      console.log('[Notifications] Missing userId');
      return c.json({ error: 'missing userId' }, 400);
    }
    
    console.log('[Notifications] Querying D1 for userId:', userId);
    console.log('[Notifications] D1 object:', c.env.YNAV_D1 ? 'exists' : 'MISSING');

    let settings = null;
    try {
      settings = await c.env.YNAV_D1.prepare(
        'SELECT * FROM notification_settings WHERE user_id = ?'
      ).bind(userId).first();
      console.log('[Notifications] D1 query result:', settings);
    } catch (d1Err: any) {
      console.error('[Notifications] D1 query error:', d1Err);
      return c.json({ error: 'D1 query failed', details: d1Err.message }, 500);
    }

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

    return c.json(settings);
  } catch (err: any) {
    console.error('[Notifications GET /settings Error]', err);
    return c.json({ error: err.message }, 500);
  }
});

// 保存配置
notifications.post('/settings', async (c) => {
  const body = await c.req.json();
  const { userId, ...data } = body;
  if (!userId) return c.json({ error: 'missing userId' }, 400);

  const keys = Object.keys(data);
  const values = Object.values(data);

  // 构建 INSERT OR REPLACE 语句
  const columns = ['user_id', ...keys].join(', ');
  const placeholders = values.map(() => '?').join(', ');

  await c.env.YNAV_D1.prepare(
    `INSERT OR REPLACE INTO notification_settings (${columns}) VALUES (?, ${placeholders})`
  ).bind(userId, ...values).run();

  return c.json({ ok: true });
});

// 测试推送
notifications.post('/test', async (c) => {
  const { userId, channel } = await c.req.json();
  if (!userId || !channel) return c.json({ error: 'invalid params' }, 400);

  const settings = await c.env.YNAV_D1.prepare(
    'SELECT * FROM notification_settings WHERE user_id = ?'
  ).bind(userId).first();

  if (!settings) return c.json({ error: 'no settings' }, 400);

  const title = 'L-Nav 测试推送';
  const content = `渠道 [${channel}] 配置正常！`;

  try {
    if (channel === 'email') await sendEmail(settings, title, content, c.env);
    if (channel === 'webhook') await sendWebhook(settings, title, content);
    if (channel === 'feishu') await sendFeishu(settings, title, content);
    if (channel === 'dingtalk') await sendDingtalk(settings, title, content);
    if (channel === 'wecom') await sendWecom(settings, title, content);
    if (channel === 'wechat') await sendWechat(settings, title, content);
    return c.json({ ok: true });
  } catch (e: any) {
    return c.json({ ok: false, error: String(e) }, 500);
  }
});

// ==========================================
// 4. 创建通知并自动推送
// ==========================================

notifications.post('/create', async (c) => {
  const { userId, type, title, content, relatedType, relatedId } = await c.req.json();
  if (!userId || !type || !title) return c.json({ error: 'invalid params' }, 400);

  // 存储通知
  await c.env.YNAV_D1.prepare(
    `INSERT INTO notifications (user_id, type, title, content, related_type, related_id, is_read, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, datetime('now'))`
  ).bind(userId, type, title, content, relatedType || null, relatedId || null).run();

  // 异步推送
  c.executionCtx.waitUntil((async () => {
    const settings = await c.env.YNAV_D1.prepare(
      'SELECT * FROM notification_settings WHERE user_id = ?'
    ).bind(userId).first();

    if (!settings) return;

    // 类型前缀映射
    const prefixMap: Record<string, string> = {
      task_success: 'success',
      task_failed: 'fail',
      device_alert: 'alert',
      system_notice: 'notice',
      price_alert: 'alert',
      reminder: 'notice'
    };
    const prefix = prefixMap[type] || 'notice';

    // 根据开关决定推送渠道
    if (settings[`${prefix}_browser`]) {
      // 浏览器推送通过前端实现
    }
    if (settings[`${prefix}_email`]) await sendEmail(settings, title, content, c.env);
    if (settings[`${prefix}_webhook`]) await sendWebhook(settings, title, content);
    if (settings[`${prefix}_feishu`]) await sendFeishu(settings, title, content);
    if (settings[`${prefix}_dingtalk`]) await sendDingtalk(settings, title, content);
    if (settings[`${prefix}_wecom`]) await sendWecom(settings, title, content);
    if (settings[`${prefix}_wechat`]) await sendWechat(settings, title, content);
  })());

  return c.json({ ok: true });
});

// ==========================================
// 5. 推送工具函数
// ==========================================

async function sendEmail(s: any, title: string, content: string, env: Env) {
  if (!s.email_to || !s.smtp_host) return;
  // TODO: 接入邮件服务
  console.log(`[Email] ${s.email_to}: ${title}`);
}

async function sendWebhook(s: any, title: string, content: string) {
  if (!s.webhook_url) return;
  await fetch(s.webhook_url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...JSON.parse(s.webhook_headers || '{}') },
    body: JSON.stringify({ title, content })
  });
}

async function sendFeishu(s: any, title: string, content: string) {
  if (!s.feishu_webhook) return;
  await fetch(s.feishu_webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      msg_type: 'text',
      content: { text: `[${title}] ${content}` }
    })
  });
}

async function sendDingtalk(s: any, title: string, content: string) {
  if (!s.dingtalk_webhook) return;
  await fetch(s.dingtalk_webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      msgtype: 'text',
      text: { content: `[${title}] ${content}` }
    })
  });
}

async function sendWecom(s: any, title: string, content: string) {
  if (!s.wecom_webhook) return;
  await fetch(s.wecom_webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      msgtype: 'text',
      text: { content: `[${title}] ${content}` }
    })
  });
}

async function sendWechat(s: any, title: string, content: string) {
  if (!s.serverchan_sckey) return;
  await fetch(`https://sctapi.ftqq.com/${s.serverchan_sckey}.send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `title=${encodeURIComponent(title)}&desp=${encodeURIComponent(content)}`
  });
}

// ==========================================
// 6. 导出工具函数
// ==========================================

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  content: string,
  relatedType: string | undefined,
  relatedId: string | undefined,
  env: Env
) {
  const result = await env.YNAV_D1.prepare(
    `INSERT INTO notifications (user_id, type, title, content, related_type, related_id)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(userId, type, title, content, relatedType, relatedId).run();

  return result.meta.last_row_id;
}

export default notifications;
