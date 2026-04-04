import { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api/v1/notifications';

export interface Notification {
  id: number;
  type: 'task_success' | 'task_failed' | 'device_alert' | 'price_alert' | 'system_notice' | 'reminder';
  title: string;
  content?: string;
  related_type?: string;
  related_id?: string;
  is_read: boolean;
  created_at: number;
}

// 新的完整通知配置接口
export interface FullNotificationSettings {
  // 邮箱配置
  email_to: string;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_pass: string;

  // 浏览器推送配置
  vapid_public_key: string;
  vapid_private_key: string;

  // 通用 Webhook
  webhook_url: string;
  webhook_headers: string;

  // 飞书
  feishu_webhook: string;
  feishu_secret: string;

  // 钉钉
  dingtalk_webhook: string;
  dingtalk_secret: string;

  // 企业微信
  wecom_webhook: string;

  // 微信（Server酱）
  serverchan_sckey: string;

  // Telegram 机器人
  telegram_bot_token: string;
  telegram_chat_id: string;

  // 任务成功开关
  success_browser: number;
  success_email: number;
  success_webhook: number;
  success_feishu: number;
  success_dingtalk: number;
  success_wecom: number;
  success_wechat: number;
  success_telegram: number;

  // 任务失败开关
  fail_browser: number;
  fail_email: number;
  fail_webhook: number;
  fail_feishu: number;
  fail_dingtalk: number;
  fail_wecom: number;
  fail_wechat: number;
  fail_telegram: number;

  // 设备告警开关
  alert_browser: number;
  alert_email: number;
  alert_webhook: number;
  alert_feishu: number;
  alert_dingtalk: number;
  alert_wecom: number;
  alert_wechat: number;
  alert_telegram: number;

  // 系统通知开关
  notice_browser: number;
  notice_email: number;
  notice_webhook: number;
  notice_feishu: number;
  notice_dingtalk: number;
  notice_wecom: number;
  notice_wechat: number;
  notice_telegram: number;
}

export function useNotifications(userId?: string) {
  const uid = userId || localStorage.getItem('user_id') || 'default';
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<FullNotificationSettings | null>(null);

  // 获取通知列表
  const fetchNotifications = useCallback(async (options?: { isRead?: boolean; type?: string; limit?: number }) => {
    if (!userId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ userId });
      if (options?.isRead !== undefined) params.set('isRead', String(options.isRead ? 1 : 0));
      if (options?.type) params.set('type', options.type);
      if (options?.limit) params.set('limit', String(options.limit));

      const res = await fetch(`${API_BASE}?${params}`);
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (e) {
      console.error('获取通知失败', e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // 获取未读数量（轻量轮询）
  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE}/unread-count?userId=${userId}`);
      const data = await res.json();
      setUnreadCount(data.count || 0);
    } catch (e) {
      console.error('获取未读数量失败', e);
    }
  }, [userId]);

  // 标记已读
  const markAsRead = useCallback(async (id: number) => {
    if (!userId) return;
    try {
      await fetch(`${API_BASE}/${id}/read?userId=${userId}`, { method: 'POST' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error('标记已读失败', e);
    }
  }, [userId]);

  // 标记全部已读
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    try {
      await fetch(`${API_BASE}/read-all?userId=${userId}`, { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error('标记全部已读失败', e);
    }
  }, [userId]);

  // 删除通知
  const deleteNotification = useCallback(async (id: number) => {
    if (!userId) return;
    try {
      await fetch(`${API_BASE}/${id}?userId=${userId}`, { method: 'DELETE' });
      const deleted = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (deleted && !deleted.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (e) {
      console.error('删除通知失败', e);
    }
  }, [userId, notifications]);

  // 清空已读
  const clearRead = useCallback(async () => {
    if (!userId) return;
    try {
      await fetch(`${API_BASE}/clear-read?userId=${userId}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => !n.is_read));
    } catch (e) {
      console.error('清空已读失败', e);
    }
  }, [userId]);

  // 获取通知设置
  const fetchSettings = useCallback(async () => {
    if (!uid) return;
    try {
      const res = await fetch(`${API_BASE}/settings?userId=${uid}`);
      const data = await res.json();
      setSettings(data);
    } catch (e) {
      console.error('获取通知设置失败', e);
    }
  }, [uid]);

  // 保存通知设置
  const saveSettings = async (data: Partial<FullNotificationSettings>) => {
    if (!uid || !settings) return;
    setLoading(true);
    const updated = { ...settings, ...data };
    try {
      await fetch(`${API_BASE}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid, ...updated })
      });
      setSettings(updated);
    } catch (e) {
      console.error('保存通知设置失败', e);
    }
    setLoading(false);
  };

  // 测试推送
  const testPush = async (channel: string) => {
    if (!uid) return;
    try {
      await fetch(`${API_BASE}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid, channel })
      });
    } catch (e) {
      console.error('测试推送失败', e);
    }
  };

  // 初始化：每30秒轮询未读数量
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // 初始化时加载设置
  useEffect(() => {
    if (uid) fetchSettings();
  }, [uid, fetchSettings]);

  // 请求浏览器通知权限
  useEffect(() => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('通知权限已获取');
        }
      });
    }
  }, []);

  // 监听新通知并触发桌面推送
  useEffect(() => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    const shownNotifications = new Set<number>();
    
    (notifications || []).forEach(n => {
      if (!n.is_read && !shownNotifications.has(n.id)) {
        shownNotifications.add(n.id);
        new Notification(`【L-Nav】${n.title}`, {
          body: n.content,
          icon: '/favicon.ico',
          tag: `notification-${n.id}`
        });
      }
    });
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    loading,
    settings,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearRead,
    fetchSettings,
    saveSettings,
    testPush
  };
}
