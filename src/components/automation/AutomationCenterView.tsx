import React, { useState, useCallback, useMemo } from 'react';
import {
  Play,
  Square,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Clock,
  Zap,
  Webhook,
  CheckCircle,
  XCircle,
  Loader2,
  MoreVertical,
  RefreshCw,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  Bell,
  Globe,
  Server,
  Container,
  Code
} from '@/utils/icons';
import type { AutomationTask, TaskExecutionLog, TaskType, TaskAction, TaskStatus } from './types';

interface AutomationCenterViewProps {
  onBack?: () => void;
}

// Mock data
const MOCK_TASKS: AutomationTask[] = [
  {
    id: 'task-1',
    name: '每日Rclone同步',
    description: '同步本地数据到云存储',
    type: 'scheduled',
    enabled: true,
    cronExpression: '0 0 * * *',
    action: 'rclone',
    actionConfig: { source: '/data', dest: 'remote:backup' },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: 'task-2',
    name: '每日NAS备份',
    description: '备份重要文件到NAS',
    type: 'scheduled',
    enabled: true,
    cronExpression: '0 2 * * *',
    action: 'script',
    actionConfig: { script: '/scripts/backup.sh' },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: 'task-3',
    name: '每周Docker清理',
    description: '清理无用镜像和容器',
    type: 'scheduled',
    enabled: true,
    cronExpression: '0 3 * * 0',
    action: 'docker',
    actionConfig: { command: 'prune' },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: 'task-4',
    name: '股票到价提醒',
    description: '监控股票价格并推送通知',
    type: 'manual',
    enabled: true,
    action: 'notification',
    actionConfig: { channel: 'feishu', template: 'stock_alert' },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: 'task-5',
    name: '飞书消息推送',
    description: '定期推送系统状态到飞书',
    type: 'scheduled',
    enabled: true,
    cronExpression: '*/15 * * * *',
    action: 'notification',
    actionConfig: { channel: 'feishu', message: '系统正常运行' },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: 'task-6',
    name: '服务健康检测',
    description: '检测关键服务可用性',
    type: 'scheduled',
    enabled: true,
    cronExpression: '*/5 * * * *',
    action: 'http',
    actionConfig: { url: 'http://localhost:8080/health', method: 'GET' },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: 'task-7',
    name: 'RSS自动同步',
    description: '自动获取RSS更新并归档',
    type: 'scheduled',
    enabled: true,
    cronExpression: '0 */1 * * *',
    action: 'script',
    actionConfig: { script: '/scripts/rss-sync.py' },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  }
];

const MOCK_LOGS: TaskExecutionLog[] = [
  {
    id: 'log-1',
    taskId: 'task-1',
    taskName: '每日Rclone同步',
    status: 'success',
    startTime: '2026-04-03T00:00:00',
    endTime: '2026-04-03T00:01:14',
    duration: 1234,
    output: '同步完成，共传输 1.2GB 数据'
  },
  {
    id: 'log-2',
    taskId: 'task-6',
    taskName: '服务健康检测',
    status: 'success',
    startTime: '2026-04-03T00:05:00',
    endTime: '2026-04-03T00:05:01',
    duration: 234,
    output: '所有服务运行正常'
  },
  {
    id: 'log-3',
    taskId: 'task-4',
    taskName: '股票到价提醒',
    status: 'failed',
    startTime: '2026-04-03T00:10:00',
    endTime: '2026-04-03T00:10:01',
    duration: 567,
    error: 'API调用失败: 超出频率限制'
  },
  {
    id: 'log-4',
    taskId: 'task-2',
    taskName: '每日NAS备份',
    status: 'running',
    startTime: '2026-04-03T02:00:00',
    output: '正在备份中...'
  }
];

const TaskTypeIcon = ({ type }: { type: TaskType }) => {
  switch (type) {
    case 'scheduled':
      return <Clock className="w-4 h-4 text-[#10b981]" />;
    case 'manual':
      return <Zap className="w-4 h-4 text-yellow-500" />;
    case 'webhook':
      return <Webhook className="w-4 h-4 text-blue-500" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
};

const TaskActionIcon = ({ action }: { action: TaskAction }) => {
  switch (action) {
    case 'http':
      return <Globe className="w-4 h-4" />;
    case 'notification':
      return <Bell className="w-4 h-4" />;
    case 'rclone':
      return <Server className="w-4 h-4" />;
    case 'docker':
      return <Container className="w-4 h-4" />;
    case 'script':
      return <Code className="w-4 h-4" />;
    default:
      return <Zap className="w-4 h-4" />;
  }
};

const StatusBadge = ({ status }: { status: TaskStatus }) => {
  const config = {
    success: { icon: CheckCircle, color: '#10b981', text: '成功' },
    failed: { icon: XCircle, color: '#ef4444', text: '失败' },
    running: { icon: Loader2, color: '#eab308', text: '运行中' },
    pending: { icon: Clock, color: '#6b7280', text: '等待中' }
  };
  const { icon: Icon, color, text } = config[status];
  
  return (
    <span className="inline-flex items-center gap-1 text-xs" style={{ color }}>
      <Icon className={`w-4 h-4 ${status === 'running' ? 'animate-spin' : ''}`} />
      {text}
    </span>
  );
};

export const AutomationCenterView: React.FC<AutomationCenterViewProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'logs' | 'webhooks'>('tasks');
  const [tasks, setTasks] = useState<AutomationTask[]>(MOCK_TASKS);
  const [logs] = useState<TaskExecutionLog[]>(MOCK_LOGS);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<AutomationTask | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;

  const handleExecuteTask = useCallback((taskId: string) => {
    // 执行任务逻辑待实现
  }, []);

  const handleToggleTask = useCallback((taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, enabled: !task.enabled } : task
    ));
  }, []);

  const handleDeleteTask = useCallback((taskId: string) => {
    if (confirm('确定要删除这个任务吗？')) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
    }
  }, []);

  const formatCron = (cron?: string) => {
    if (!cron) return '-';
    // 简化显示，实际应该解析cron表达式
    if (cron === '0 0 * * *') return '每天 00:00';
    if (cron === '0 2 * * *') return '每天 02:00';
    if (cron === '0 3 * * 0') return '每周日 03:00';
    if (cron === '*/15 * * * *') return '每15分钟';
    if (cron === '*/5 * * * *') return '每5分钟';
    if (cron === '0 */1 * * *') return '每小时';
    return cron;
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatTime = (timeStr: string) => {
    return new Date(timeStr).toLocaleString('zh-CN');
  };

  // 分页
  const totalPages = Math.ceil(logs.length / logsPerPage);
  const paginatedLogs = logs.slice((currentPage - 1) * logsPerPage, currentPage * logsPerPage);

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-white/10 text-[#a3a3a3] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-[#f5f5f5]">自动化调度中心</h1>
            <p className="text-sm text-[#a3a3a3]">管理定时任务、Webhook和自动化工作流</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#10b981] text-[#0a0a0a] rounded-lg font-medium hover:bg-[#059669] transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建任务
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-6 pt-4">
        {[
          { id: 'tasks', label: '任务列表', icon: Calendar },
          { id: 'logs', label: '执行日志', icon: FileText },
          { id: 'webhooks', label: 'Webhook管理', icon: Webhook }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-[#10b981]/20 text-[#10b981]'
                : 'text-[#a3a3a3] hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        {activeTab === 'tasks' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tasks.map(task => (
              <div
                key={task.id}
                className="bg-[#171717] rounded-lg p-4 border border-white/5 hover:border-[#10b981]/50 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-[#f5f5f5] text-sm">{task.name}</h3>
                    <p className="text-xs text-[#525252] mt-1">{task.description}</p>
                  </div>
                  <div className="p-1.5 bg-white/5 rounded">
                    <TaskTypeIcon type={task.type} />
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3 text-xs text-[#a3a3a3]">
                  <TaskTypeIcon type={task.type} />
                  <span>{task.type === 'scheduled' ? formatCron(task.cronExpression) : task.type === 'manual' ? '手动执行' : 'Webhook'}</span>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs ${
                    task.enabled
                      ? 'bg-[#10b981]/20 text-[#10b981]'
                      : 'bg-white/5 text-[#525252]'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${task.enabled ? 'bg-[#10b981]' : 'bg-[#525252]'}`} />
                    {task.enabled ? '已启用' : '已禁用'}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                  <button
                    onClick={() => handleExecuteTask(task.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-white/5 text-[#a3a3a3] rounded hover:bg-[#10b981]/20 hover:text-[#10b981] transition-colors text-xs"
                  >
                    <Play className="w-3 h-3" />
                    执行
                  </button>
                  <button
                    onClick={() => setEditingTask(task)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-white/5 text-[#a3a3a3] rounded hover:bg-white/10 transition-colors text-xs"
                  >
                    <Edit2 className="w-3 h-3" />
                    编辑
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-white/5 text-[#a3a3a3] rounded hover:bg-red-500/20 hover:text-red-500 transition-colors text-xs"
                  >
                    <Trash2 className="w-3 h-3" />
                    删除
                  </button>
                </div>
              </div>
            ))}

            {/* Add Task Card */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-[#171717] rounded-lg p-4 border border-white/5 border-dashed hover:border-[#10b981]/50 hover:bg-[#171717]/80 transition-all flex flex-col items-center justify-center gap-2 text-[#525252] hover:text-[#10b981] min-h-[180px]"
            >
              <Plus className="w-8 h-8" />
              <span className="text-sm font-medium">添加任务</span>
            </button>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-4">
            <div className="bg-[#171717] rounded-lg border border-white/5 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left px-4 py-3 text-[#a3a3a3] font-medium">任务名称</th>
                    <th className="text-left px-4 py-3 text-[#a3a3a3] font-medium">状态</th>
                    <th className="text-left px-4 py-3 text-[#a3a3a3] font-medium">执行时间</th>
                    <th className="text-left px-4 py-3 text-[#a3a3a3] font-medium">耗时</th>
                    <th className="text-left px-4 py-3 text-[#a3a3a3] font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.map((log, index) => (
                    <tr
                      key={log.id}
                      className={`border-t border-white/5 hover:bg-white/5 transition-colors ${index % 2 === 1 ? 'bg-white/[0.02]' : ''}`}
                    >
                      <td className="px-4 py-3 text-[#f5f5f5]">{log.taskName}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={log.status} />
                      </td>
                      <td className="px-4 py-3 text-[#a3a3a3]">{formatTime(log.startTime)}</td>
                      <td className="px-4 py-3 text-[#a3a3a3]">{formatDuration(log.duration)}</td>
                      <td className="px-4 py-3">
                        <button className="text-[#10b981] hover:text-[#059669] text-xs">
                          详情
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-white/5 text-[#a3a3a3] hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-[#a3a3a3]">
                  第 {currentPage} 页，共 {totalPages} 页
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-white/5 text-[#a3a3a3] hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'webhooks' && (
          <div className="flex flex-col items-center justify-center py-20 text-[#525252]">
            <Webhook className="w-16 h-16 mb-4" />
            <p className="text-lg font-medium">Webhook管理</p>
            <p className="text-sm mt-2">即将上线，敬请期待</p>
          </div>
        )}
      </div>

      {/* Create/Edit Task Modal */}
      {(showCreateModal || editingTask) && (
        <TaskModal
          task={editingTask}
          onClose={() => {
            setShowCreateModal(false);
            setEditingTask(null);
          }}
          onSave={(task) => {
            if (editingTask) {
              setTasks(prev => prev.map(t => t.id === task.id ? task : t));
            } else {
              setTasks(prev => [...prev, { ...task, id: `task-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]);
            }
            setShowCreateModal(false);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
};

// Task Modal Component
interface TaskModalProps {
  task: AutomationTask | null;
  onClose: () => void;
  onSave: (task: AutomationTask) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ task, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<AutomationTask>>({
    name: task?.name || '',
    description: task?.description || '',
    type: task?.type || 'scheduled',
    enabled: task?.enabled ?? true,
    cronExpression: task?.cronExpression || '',
    action: task?.action || 'http',
    actionConfig: task?.actionConfig || {}
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    
    onSave({
      ...(task || {}),
      ...formData,
    } as AutomationTask);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#171717] rounded-lg border border-white/10 w-full max-w-lg max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h2 className="text-lg font-bold text-[#f5f5f5]">
            {task ? '编辑任务' : '新建任务'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 text-[#a3a3a3]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-[#a3a3a3] mb-1">任务名称</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-lg text-[#f5f5f5] text-sm focus:border-[#10b981] focus:outline-none"
              placeholder="输入任务名称"
            />
          </div>

          <div>
            <label className="block text-sm text-[#a3a3a3] mb-1">任务描述</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-lg text-[#f5f5f5] text-sm focus:border-[#10b981] focus:outline-none resize-none"
              placeholder="输入任务描述"
            />
          </div>

          <div>
            <label className="block text-sm text-[#a3a3a3] mb-1">任务类型</label>
            <select
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value as TaskType })}
              className="w-full px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-lg text-[#f5f5f5] text-sm focus:border-[#10b981] focus:outline-none"
            >
              <option value="scheduled">定时任务</option>
              <option value="manual">手动任务</option>
              <option value="webhook">Webhook</option>
            </select>
          </div>

          {formData.type === 'scheduled' && (
            <div>
              <label className="block text-sm text-[#a3a3a3] mb-1">Cron表达式</label>
              <input
                type="text"
                value={formData.cronExpression}
                onChange={e => setFormData({ ...formData, cronExpression: e.target.value })}
                className="w-full px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-lg text-[#f5f5f5] text-sm focus:border-[#10b981] focus:outline-none"
                placeholder="0 0 * * *"
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-[#a3a3a3] mb-1">执行动作</label>
            <select
              value={formData.action}
              onChange={e => setFormData({ ...formData, action: e.target.value as TaskAction })}
              className="w-full px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-lg text-[#f5f5f5] text-sm focus:border-[#10b981] focus:outline-none"
            >
              <option value="http">HTTP请求</option>
              <option value="notification">发送通知</option>
              <option value="rclone">Rclone同步</option>
              <option value="docker">Docker操作</option>
              <option value="script">执行脚本</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enabled"
              checked={formData.enabled}
              onChange={e => setFormData({ ...formData, enabled: e.target.checked })}
              className="w-4 h-4 rounded border-white/10 bg-[#0a0a0a] text-[#10b981] focus:ring-[#10b981]"
            />
            <label htmlFor="enabled" className="text-sm text-[#f5f5f5]">启用任务</label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white/5 text-[#a3a3a3] rounded-lg hover:bg-white/10 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[#10b981] text-[#0a0a0a] rounded-lg font-medium hover:bg-[#059669] transition-colors"
            >
              {task ? '保存' : '创建任务'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AutomationCenterView;
