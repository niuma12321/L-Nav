import { Hono } from 'hono';

const notifications = new Hono<{ Bindings: Env }>();

// ==========================================
// 1. 通知查询接口
// ==========================================

// 获取通知列表（支持分页、筛选）
notifications.get('/', async (c) => {
  const userId = c.req.query('userId');
  const isRead = c.req.query('isRead'); // '0' | '1' | undefined
  const type = c.req.query('type');
  const limit = Number(c.req.query('limit')) || 50;
  const offset = Number(c.req.query('offset')) || 0;

  if (!userId) return c.json({ error: '缺少用户ID' }, 400);

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

  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  
  // 获取未读数量
  const unreadResult = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0'
  ).bind(userId).first();

  return c.json({
    notifications: results,
    unreadCount: unreadResult?.count || 0,
    total: results.length
  });
});

// 获取未读数量（轻量接口，用于顶部角标）
notifications.get('/unread-count', async (c) => {
  const userId = c.req.query('userId');
  if (!userId) return c.json({ count: 0 });

  const result = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0'
  ).bind(userId).first();

  return c.json({ count: result?.count || 0 });
});

// ==========================================
// 2. 通知操作接口
// ==========================================

// 标记单条已读
notifications.post('/:id/read', async (c) => {
  const id = c.req.param('id');
  const userId = c.req.query('userId');
  await c.env.DB.prepare(
    'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?'
  ).bind(id, userId).run();
  return c.json({ success: true });
});

// 标记全部已读
notifications.post('/read-all', async (c) => {
  const userId = c.req.query('userId');
  await c.env.DB.prepare(
    'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0'
  ).bind(userId).run();
  return c.json({ success: true });
});

// 删除通知
notifications.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const userId = c.req.query('userId');
  await c.env.DB.prepare(
    'DELETE FROM notifications WHERE id = ? AND user_id = ?'
  ).bind(id, userId).run();
  return c.json({ success: true });
});

// 清空所有已读
notifications.delete('/clear-read', async (c) => {
  const userId = c.req.query('userId');
  await c.env.DB.prepare(
    'DELETE FROM notifications WHERE user_id = ? AND is_read = 1'
  ).bind(userId).run();
  return c.json({ success: true });
});

// ==========================================
// 3. 通知创建接口（供内部模块调用）
// ==========================================

// 创建通知（同时触发推送）
notifications.post('/create', async (c) => {
  const body = await c.req.json();
  const { userId, type, title, content, relatedType, relatedId } = body;

  // 1. 检查用户是否启用该类型通知
  const settings = await c.env.DB.prepare(
    'SELECT * FROM notification_settings WHERE user_id = ? AND type = ?'
  ).bind(userId, type).first();

  if (settings && !settings.enabled) {
    return c.json({ success: true, skipped: true });
  }

  // 2. 存储通知
  const result = await c.env.DB.prepare(`
    INSERT INTO notifications (user_id, type, title, content, related_type, related_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(userId, type, title, content, relatedType, relatedId).run();

  const notificationId = result.meta.last_row_id;

  // 3. 异步触发推送
  c.executionCtx.waitUntil((async () => {
    if (settings?.push_browser) {
      // 浏览器推送通过前端Service Worker实现，这里标记待推送
      await c.env.DB.prepare('UPDATE notifications SET is_pushed = 1 WHERE id = ?').bind(notificationId).run();
    }
    if (settings?.push_email && settings.email_address) {
      await sendEmail(settings.email_address, title, content, c.env);
    }
    if (settings?.push_webhook && settings.webhook_url) {
      await sendWebhook(settings.webhook_url, title, content, type, c.env);
    }
  })());

  return c.json({ success: true, notificationId });
});

// ==========================================
// 4. 通知配置接口
// ==========================================

notifications.get('/settings', async (c) => {
  const userId = c.req.query('userId');
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM notification_settings WHERE user_id = ?'
  ).bind(userId).all();
  return c.json(results);
});

notifications.post('/settings', async (c) => {
  const body = await c.req.json();
  const { userId, type, ...settings } = body;
  
  await c.env.DB.prepare(`
    INSERT OR REPLACE INTO notification_settings 
    (user_id, type, enabled, push_browser, push_email, push_webhook, webhook_url, email_address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    userId, type,
    settings.enabled ?? 1,
    settings.push_browser ?? 1,
    settings.push_email ?? 0,
    settings.push_webhook ?? 0,
    settings.webhook_url,
    settings.email_address
  ).run();

  return c.json({ success: true });
});

// ==========================================
// 辅助函数：推送渠道
// ==========================================

async function sendEmail(to: string, title: string, content: string, env: Env) {
  // 对接MailChannels/Resend等邮件服务（Cloudflare Workers友好）
  // 这里简化，实际使用时接入邮件API
  console.log(`发送邮件到 ${to}: ${title}`);
}

async function sendWebhook(url: string, title: string, content: string, type: string, env: Env) {
  // 统一Webhook格式，兼容飞书/钉钉/企业微信
  const payload = {
    msg_type: 'text',
    content: { text: `【L-Nav通知】${title}\n${content}` }
  };

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

// 封装通知创建函数（供其他模块调用）
export async function createNotification(
  userId: string,
  type: string,
  title: string,
  content: string,
  relatedType: string | undefined,
  relatedId: string | undefined,
  env: Env
) {
  const result = await env.DB.prepare(`
    INSERT INTO notifications (user_id, type, title, content, related_type, related_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(userId, type, title, content, relatedType, relatedId).run();

  return result.meta.last_row_id;
}

export default notifications;
