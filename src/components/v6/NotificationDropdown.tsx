import React from 'react';
import { Notification } from '../../hooks/useNotifications';
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
  ChevronRight
} from 'lucide-react';

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  onClose: () => void;
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: number) => void;
  onViewAll: () => void;
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  task_success: { label: '任务成功', icon: CheckCircle2, color: '#10b981' },
  task_failed: { label: '任务失败', icon: XCircle, color: '#ef4444' },
  device_alert: { label: '设备告警', icon: AlertTriangle, color: '#f59e0b' },
  price_alert: { label: '行情提醒', icon: TrendingUp, color: '#3b82f6' },
  system_notice: { label: '系统公告', icon: Info, color: '#8b5cf6' },
  reminder: { label: '自定义提醒', icon: Clock, color: '#ec4899' }
};

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  unreadCount,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onViewAll
}) => {
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
    return <Icon className="w-4 h-4" style={{ color: config.color }} />;
  };

  // 只显示最新的10条通知
  const recentNotifications = notifications.slice(0, 10);

  return (
    <div className="absolute right-0 top-full mt-2 w-[360px] max-h-[480px] bg-[#171717] rounded-xl border border-white/10 shadow-xl overflow-hidden z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#10b981]" />
          <span className="font-medium text-sm">通知中心</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="text-xs text-[#10b981] hover:text-[#059669] transition-colors"
            >
              全部已读
            </button>
          )}
          <button
            onClick={onClose}
            className="text-[#a3a3a3] hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/5">
        <span className="text-xs text-[#a3a3a3]">
          未读：{unreadCount}条
        </span>
        <span className="text-xs text-[#525252]">
          共{notifications.length}条
        </span>
      </div>

      {/* Notification List */}
      <div className="overflow-y-auto max-h-[320px]">
        {recentNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-[#525252]">
            <Bell className="w-10 h-10 mb-2" />
            <p className="text-sm">暂无通知</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {recentNotifications.map(notification => (
              <div
                key={notification.id}
                className={`group relative px-4 py-3 hover:bg-white/5 transition-colors ${
                  !notification.is_read ? 'bg-white/5' : ''
                }`}
              >
                {/* 未读标识 */}
                {!notification.is_read && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#10b981]" />
                )}

                <div className="flex items-start gap-3">
                  {/* 类型图标 */}
                  <div className="flex-shrink-0 mt-0.5">
                    {getTypeIcon(notification.type)}
                  </div>

                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium truncate ${
                        notification.is_read ? 'text-[#a3a3a3]' : 'text-[#f5f5f5]'
                      }`}>
                        {notification.title}
                      </p>
                      <span className="text-xs text-[#525252] whitespace-nowrap">
                        {formatTime(notification.created_at)}
                      </span>
                    </div>
                    
                    {notification.content && (
                      <p className="text-xs text-[#a3a3a3] mt-1 line-clamp-2">
                        {notification.content}
                      </p>
                    )}
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center gap-1 mt-2 pl-7 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!notification.is_read && (
                    <button
                      onClick={() => onMarkAsRead(notification.id)}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-[#10b981] hover:bg-[#10b981]/10 rounded transition-colors"
                    >
                      <Check className="w-3 h-3" />
                      已读
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(notification.id)}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-red-500 hover:bg-red-500/10 rounded transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-white/5 px-4 py-3">
        <button
          onClick={onViewAll}
          className="flex items-center justify-center gap-1 w-full text-sm text-[#10b981] hover:text-[#059669] transition-colors"
        >
          查看全部
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default NotificationDropdown;
