import React, { useState, useEffect } from 'react';
import { useNotifications, Notification } from '../../hooks/useNotifications';
import { 
  Bell, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  TrendingUp, 
  Info, 
  Clock,
  Check,
  Trash2,
  Settings,
  Filter,
  RefreshCw
} from 'lucide-react';

interface NotificationsViewCNProps {
  onBack?: () => void;
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  task_success: { label: '任务成功', icon: CheckCircle2, color: '#10b981' },
  task_failed: { label: '任务失败', icon: XCircle, color: '#ef4444' },
  device_alert: { label: '设备告警', icon: AlertTriangle, color: '#f59e0b' },
  price_alert: { label: '行情提醒', icon: TrendingUp, color: '#3b82f6' },
  system_notice: { label: '系统公告', icon: Info, color: '#8b5cf6' },
  reminder: { label: '自定义提醒', icon: Clock, color: '#ec4899' }
};

const TABS = [
  { id: 'all', label: '全部' },
  { id: 'unread', label: '未读' },
  { id: 'task_success', label: '任务成功' },
  { id: 'task_failed', label: '任务失败' },
  { id: 'device_alert', label: '设备告警' },
  { id: 'price_alert', label: '行情提醒' }
];

export const NotificationsViewCN: React.FC<NotificationsViewCNProps> = ({ onBack }) => {
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearRead
  } = useNotifications();

  const [activeTab, setActiveTab] = useState('all');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const options: { isRead?: boolean; type?: string } = {};
    if (activeTab === 'unread') {
      options.isRead = false;
    } else if (activeTab !== 'all') {
      options.type = activeTab;
    }
    fetchNotifications(options);
  }, [activeTab, fetchNotifications]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  const getTypeIcon = (type: string) => {
    const config = TYPE_CONFIG[type] || TYPE_CONFIG.system_notice;
    const Icon = config.icon;
    return <Icon className="w-5 h-5" style={{ color: config.color }} />;
  };

  const groupedNotifications = notifications.reduce((acc, notification) => {
    const date = new Date(notification.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let group: string;
    if (date.toDateString() === today.toDateString()) {
      group = '今天';
    } else if (date.toDateString() === yesterday.toDateString()) {
      group = '昨天';
    } else {
      group = date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
    }

    if (!acc[group]) acc[group] = [];
    acc[group].push(notification);
    return acc;
  }, {} as Record<string, Notification[]>);

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] text-[#f5f5f5]">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-[#10b981]">通知中心</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-medium">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <p className="text-sm text-[#a3a3a3] mt-1">管理所有系统通知和提醒</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchNotifications()}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 text-[#a3a3a3] rounded-lg hover:bg-white/10 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm">刷新</span>
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 text-[#a3a3a3] rounded-lg hover:bg-white/10 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm">设置</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-6 pt-4 pb-2 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-[#10b981]/20 text-[#10b981]'
                : 'text-[#a3a3a3] hover:bg-white/5'
            }`}
          >
            {tab.label}
            {tab.id === 'unread' && unreadCount > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/5">
        <span className="text-sm text-[#a3a3a3]">
          共 {notifications.length} 条通知
          {unreadCount > 0 && `，${unreadCount} 条未读`}
        </span>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#10b981] hover:bg-[#10b981]/10 rounded-lg transition-colors"
            >
              <Check className="w-4 h-4" />
              全部已读
            </button>
          )}
          <button
            onClick={clearRead}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#a3a3a3] hover:bg-white/5 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            清空已读
          </button>
        </div>
      </div>

      {/* Notification List */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 text-[#10b981] animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-[#525252]">
            <Bell className="w-16 h-16 mb-4" />
            <p className="text-lg font-medium">暂无通知</p>
            <p className="text-sm mt-1">当系统有新消息时会在这里显示</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedNotifications).map(([group, items]) => (
              <div key={group}>
                <h3 className="text-sm font-medium text-[#525252] mb-3 sticky top-0 bg-[#0a0a0a] py-2">
                  {group}
                </h3>
                <div className="space-y-2">
                  {items.map(notification => (
                    <div
                      key={notification.id}
                      className={`group relative bg-[#171717] rounded-lg p-4 border transition-all ${
                        notification.is_read
                          ? 'border-white/5'
                          : 'border-[#10b981]/30 bg-[#171717]/80'
                      }`}
                    >
                      {/* 未读标识 */}
                      {!notification.is_read && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#10b981] rounded-l-lg" />
                      )}

                      <div className="flex items-start gap-3">
                        {/* 类型图标 */}
                        <div className="flex-shrink-0 mt-0.5">
                          {getTypeIcon(notification.type)}
                        </div>

                        {/* 内容 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`text-sm font-medium ${notification.is_read ? 'text-[#a3a3a3]' : 'text-[#f5f5f5]'}`}>
                              {notification.title}
                            </h4>
                            <span className="text-xs text-[#525252] whitespace-nowrap">
                              {formatTime(notification.created_at)}
                            </span>
                          </div>
                          
                          {notification.content && (
                            <p className="text-sm text-[#a3a3a3] mt-1 line-clamp-2">
                              {notification.content}
                            </p>
                          )}

                          {/* 关联信息 */}
                          {notification.related_type && (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-[#525252] bg-white/5 px-2 py-1 rounded">
                                {notification.related_type}: {notification.related_id}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notification.is_read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-1.5 text-[#10b981] hover:bg-[#10b981]/10 rounded-lg transition-colors"
                              title="标记已读"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <NotificationSettingsModal
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

// 通知设置模态框
const NotificationSettingsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { settings, fetchSettings, saveSettings } = useNotifications();
  const [localSettings, setLocalSettings] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    const settingsMap: Record<string, any> = {};
    (settings || []).forEach(s => {
      settingsMap[s.type] = s;
    });
    setLocalSettings(settingsMap);
  }, [settings]);

  const handleSave = async (type: string) => {
    const s = localSettings[type];
    if (s) {
      await saveSettings(type, {
        enabled: s.enabled,
        push_browser: s.push_browser,
        push_email: s.push_email,
        push_webhook: s.push_webhook,
        webhook_url: s.webhook_url,
        email_address: s.email_address
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#171717] rounded-lg border border-white/10 w-full max-w-2xl max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h2 className="text-lg font-bold">通知设置</h2>
          <button
            onClick={onClose}
            className="p-2 text-[#a3a3a3] hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-6">
          {Object.entries(TYPE_CONFIG).map(([type, config]) => {
            const s = localSettings[type] || {
              enabled: true,
              push_browser: true,
              push_email: false,
              push_webhook: false
            };

            return (
              <div key={type} className="bg-[#0a0a0a] rounded-lg p-4">
                <div className="flex items-center gap-3 mb-4">
                  <config.icon className="w-5 h-5" style={{ color: config.color }} />
                  <h3 className="font-medium">{config.label}</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={s.enabled}
                      onChange={e => {
                        setLocalSettings(prev => ({
                          ...prev,
                          [type]: { ...s, enabled: e.target.checked }
                        }));
                      }}
                      className="w-4 h-4 rounded border-white/10 bg-[#171717] text-[#10b981]"
                    />
                    <span className="text-sm text-[#a3a3a3]">启用通知</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={s.push_browser}
                      onChange={e => {
                        setLocalSettings(prev => ({
                          ...prev,
                          [type]: { ...s, push_browser: e.target.checked }
                        }));
                      }}
                      className="w-4 h-4 rounded border-white/10 bg-[#171717] text-[#10b981]"
                    />
                    <span className="text-sm text-[#a3a3a3]">浏览器推送</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={s.push_email}
                      onChange={e => {
                        setLocalSettings(prev => ({
                          ...prev,
                          [type]: { ...s, push_email: e.target.checked }
                        }));
                      }}
                      className="w-4 h-4 rounded border-white/10 bg-[#171717] text-[#10b981]"
                    />
                    <span className="text-sm text-[#a3a3a3]">邮件推送</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={s.push_webhook}
                      onChange={e => {
                        setLocalSettings(prev => ({
                          ...prev,
                          [type]: { ...s, push_webhook: e.target.checked }
                        }));
                      }}
                      className="w-4 h-4 rounded border-white/10 bg-[#171717] text-[#10b981]"
                    />
                    <span className="text-sm text-[#a3a3a3]">Webhook推送</span>
                  </label>
                </div>

                {(s.push_email || s.push_webhook) && (
                  <div className="mt-4 space-y-3">
                    {s.push_email && (
                      <input
                        type="email"
                        placeholder="邮件地址"
                        value={s.email_address || ''}
                        onChange={e => {
                          setLocalSettings(prev => ({
                            ...prev,
                            [type]: { ...s, email_address: e.target.value }
                          }));
                        }}
                        className="w-full px-3 py-2 bg-[#171717] border border-white/10 rounded-lg text-sm text-[#f5f5f5] placeholder-[#525252] focus:border-[#10b981] focus:outline-none"
                      />
                    )}
                    {s.push_webhook && (
                      <input
                        type="url"
                        placeholder="Webhook URL（飞书/钉钉/企业微信）"
                        value={s.webhook_url || ''}
                        onChange={e => {
                          setLocalSettings(prev => ({
                            ...prev,
                            [type]: { ...s, webhook_url: e.target.value }
                          }));
                        }}
                        className="w-full px-3 py-2 bg-[#171717] border border-white/10 rounded-lg text-sm text-[#f5f5f5] placeholder-[#525252] focus:border-[#10b981] focus:outline-none"
                      />
                    )}
                  </div>
                )}

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => handleSave(type)}
                    className="px-4 py-2 bg-[#10b981] text-[#0a0a0a] rounded-lg text-sm font-medium hover:bg-[#059669] transition-colors"
                  >
                    保存设置
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default NotificationsViewCN;
