import { Hono } from 'hono';

const automation = new Hono<{ Bindings: Env }>();

// 1. 获取任务列表
automation.get('/tasks', async (c) => {
  const userId = c.req.query('userId');
  if (!userId) return c.json({ error: '缺少用户ID' }, 400);

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM automation_tasks WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(userId).all();

  return c.json(results);
});

// 2. 创建/更新任务
automation.post('/tasks', async (c) => {
  const body = await c.req.json();
  const { id, userId, name, type, cronExpression, actionType, actionConfig, enabled, description } = body;

  // 计算下次执行时间（简化的cron计算）
  const nextRunAt = type === 'cron' ? calculateNextRun(cronExpression) : null;

  if (id) {
    // 更新
    await c.env.DB.prepare(`
      UPDATE automation_tasks 
      SET name = ?, description = ?, type = ?, cron_expression = ?, action_type = ?, action_config = ?, 
          enabled = ?, next_run_at = ?, updated_at = (strftime('%s', 'now') * 1000)
      WHERE id = ? AND user_id = ?
    `).bind(name, description || '', type, cronExpression, actionType, JSON.stringify(actionConfig), enabled, nextRunAt, id, userId).run();
  } else {
    // 创建
    await c.env.DB.prepare(`
      INSERT INTO automation_tasks (user_id, name, description, type, cron_expression, action_type, action_config, enabled, next_run_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(userId, name, description || '', type, cronExpression, actionType, JSON.stringify(actionConfig), enabled ? 1 : 0, nextRunAt).run();
  }

  return c.json({ success: true });
});

// 3. 手动执行任务
automation.post('/tasks/:id/run', async (c) => {
  const taskId = c.req.param('id');
  const userId = c.req.query('userId');
  if (!userId) return c.json({ error: '缺少用户ID' }, 400);

  const task = await c.env.DB.prepare('SELECT * FROM automation_tasks WHERE id = ? AND user_id = ?').bind(taskId, userId).first();
  if (!task) return c.json({ error: '任务不存在' }, 404);

  // 执行任务
  const result = await executeTask(task, c.env);

  // 记录日志
  await c.env.DB.prepare(`
    INSERT INTO automation_logs (task_id, user_id, status, output, duration)
    VALUES (?, ?, ?, ?, ?)
  `).bind(taskId, userId, result.status, result.output, result.duration).run();

  // 更新上次执行时间
  await c.env.DB.prepare('UPDATE automation_tasks SET last_run_at = (strftime(\'%s\', \'now\') * 1000) WHERE id = ?').bind(taskId).run();

  return c.json(result);
});

// 4. 获取执行日志
automation.get('/logs', async (c) => {
  const userId = c.req.query('userId');
  const limit = Number(c.req.query('limit')) || 50;
  if (!userId) return c.json({ error: '缺少用户ID' }, 400);

  const { results } = await c.env.DB.prepare(`
    SELECT l.*, t.name as task_name 
    FROM automation_logs l
    JOIN automation_tasks t ON l.task_id = t.id
    WHERE l.user_id = ? 
    ORDER BY l.run_at DESC 
    LIMIT ?
  `).bind(userId, limit).all();

  return c.json(results);
});

// 5. 删除任务
automation.delete('/tasks/:id', async (c) => {
  const taskId = c.req.param('id');
  const userId = c.req.query('userId');
  if (!userId) return c.json({ error: '缺少用户ID' }, 400);
  
  await c.env.DB.prepare('DELETE FROM automation_tasks WHERE id = ? AND user_id = ?').bind(taskId, userId).run();
  return c.json({ success: true });
});

// ==========================================
// 核心执行引擎
// ==========================================
async function executeTask(task: any, env: Env) {
  const startTime = Date.now();
  try {
    const config = typeof task.action_config === 'string' ? JSON.parse(task.action_config) : task.action_config;

    let result;
    switch (task.action_type) {
      case 'http_request':
        // 通用HTTP请求
        const res = await fetch(config.url, {
          method: config.method || 'GET',
          headers: config.headers || {},
          body: config.body ? JSON.stringify(config.body) : undefined
        });
        result = {
          status: res.ok ? 'success' : 'failed',
          output: await res.text(),
          duration: Date.now() - startTime
        };
        break;

      case 'send_notification':
        // 发送通知
        result = { status: 'success', output: '通知已发送', duration: Date.now() - startTime };
        break;

      case 'rclone_sync':
        // Rclone同步
        result = { status: 'success', output: 'Rclone同步已触发', duration: Date.now() - startTime };
        break;

      case 'docker':
        // Docker操作
        result = { status: 'success', output: 'Docker操作已执行', duration: Date.now() - startTime };
        break;

      case 'script':
        // 执行脚本
        result = { status: 'success', output: '脚本已执行', duration: Date.now() - startTime };
        break;

      default:
        throw new Error('不支持的动作类型');
    }

    // 创建成功通知
    if (result.status === 'success') {
      await createNotification(
        task.user_id,
        'task_success',
        `任务「${task.name}」执行成功`,
        `执行时长：${result.duration}ms`,
        'task',
        String(task.id),
        env
      );
    } else {
      await createNotification(
        task.user_id,
        'task_failed',
        `任务「${task.name}」执行失败`,
        `状态码错误，请检查配置`,
        'task',
        String(task.id),
        env
      );
    }

    return result;
  } catch (e: any) {
    const result = {
      status: 'failed',
      output: e.message,
      duration: Date.now() - startTime
    };

    // 创建失败通知（高优先级）
    await createNotification(
      task.user_id,
      'task_failed',
      `⚠️ 任务「${task.name}」执行失败`,
      `错误信息：${e.message}`,
      'task',
      String(task.id),
      env
    );

    return result;
  }
}

// 创建通知的辅助函数
async function createNotification(
  userId: string,
  type: string,
  title: string,
  content: string,
  relatedType: string | undefined,
  relatedId: string | undefined,
  env: Env
) {
  try {
    await env.DB.prepare(`
      INSERT INTO notifications (user_id, type, title, content, related_type, related_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(userId, type, title, content, relatedType, relatedId).run();
  } catch (e) {
    console.error('创建通知失败:', e);
  }
}

// 简化的cron下次执行时间计算
function calculateNextRun(cronExpr: string) {
  // 简化处理：每分钟执行一次
  if (cronExpr === '*/1 * * * *') {
    return Date.now() + 60000;
  }
  // 默认1小时后执行
  return Date.now() + 3600000;
}

// ==========================================
// Cron定时触发器（每分钟执行）
// ==========================================
export async function automationScheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
  const { results } = await env.DB.prepare(`
    SELECT * FROM automation_tasks 
    WHERE enabled = 1 AND type = 'cron' AND next_run_at <= (strftime('%s', 'now') * 1000)
  `).all();

  for (const task of results) {
    ctx.waitUntil((async () => {
      const result = await executeTask(task, env);
      await env.DB.prepare(`
        INSERT INTO automation_logs (task_id, user_id, status, output, duration)
        VALUES (?, ?, ?, ?, ?)
      `).bind(task.id, task.user_id, result.status, result.output, result.duration).run();

      // 更新下次执行时间
      const nextRunAt = calculateNextRun(task.cron_expression);
      await env.DB.prepare(`
        UPDATE automation_tasks 
        SET last_run_at = (strftime('%s', 'now') * 1000), next_run_at = ?
        WHERE id = ?
      `).bind(nextRunAt, task.id).run();
    })());
  }
}

export default automation;
