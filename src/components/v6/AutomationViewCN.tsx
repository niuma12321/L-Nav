import React, { useState } from 'react';
import { useAutomation } from '../../hooks/useAutomation';
import { Clock, Play, Pencil, Trash2, Plus, CheckCircle2, XCircle, Loader2, Calendar, FileText } from '@/utils/icons';

interface AutomationViewCNProps {
  onBack?: () => void;
}

export const AutomationViewCN: React.FC<AutomationViewCNProps> = ({ onBack }) => {
  const { tasks, logs, loading, saveTask, runTask, deleteTask, toggleTask } = useAutomation();
  const [activeTab, setActiveTab] = useState<'tasks' | 'logs'>('tasks');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  const handleSaveTask = async (taskData: any) => {
    await saveTask(taskData);
    setShowCreateModal(false);
    setEditingTask(null);
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] text-[#f5f5f5]">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/5">
        <div>
          <h1 className="text-xl font-bold text-[#10b981]">自动化调度中心</h1>
          <p className="text-sm text-[#a3a3a3] mt-1">管理定时任务、Webhook和自动化工作流</p>
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
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'tasks'
              ? 'bg-[#10b981]/20 text-[#10b981]'
              : 'text-[#a3a3a3] hover:bg-white/5'
          }`}
        >
          <Calendar className="w-4 h-4" />
          任务列表
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'logs'
              ? 'bg-[#10b981]/20 text-[#10b981]'
              : 'text-[#a3a3a3] hover:bg-white/5'
          }`}
        >
          <FileText className="w-4 h-4" />
          执行日志
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        {activeTab === 'tasks' ? (
          <div className="grid gap-4">
            {loading ? (
              <div className="text-center py-12 text-[#a3a3a3]">加载中...</div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-12 text-[#525252]">
                <Clock className="w-12 h-12 mx-auto mb-4" />
                <p>暂无任务，点击右上角创建新任务</p>
              </div>
            ) : (
              tasks.map(task => (
                <div
                  key={task.id}
                  className="bg-[#171717] rounded-lg p-4 border border-white/5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${task.enabled ? 'bg-[#10b981]' : 'bg-[#525252]'}`} />
                    <div>
                      <h3 className="font-medium">{task.name}</h3>
                      <p className="text-sm text-[#a3a3a3]">
                        {task.type === 'cron' ? (
                          <><Clock className="w-3 h-3 inline mr-1" /> {task.cron_expression}</>
                        ) : task.type === 'manual' ? '手动执行' : 'Webhook触发'}
                        {' · '}
                        {task.action_type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => runTask(task.id)}
                      className="p-2 rounded-lg bg-white/5 text-[#a3a3a3] hover:bg-[#10b981]/20 hover:text-[#10b981] transition-colors"
                      title="执行"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingTask(task)}
                      className="p-2 rounded-lg bg-white/5 text-[#a3a3a3] hover:bg-white/10 transition-colors"
                      title="编辑"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleTask(task)}
                      className={`p-2 rounded-lg transition-colors ${
                        task.enabled
                          ? 'bg-[#10b981]/20 text-[#10b981]'
                          : 'bg-white/5 text-[#a3a3a3]'
                      }`}
                      title={task.enabled ? '禁用' : '启用'}
                    >
                      {task.enabled ? 'ON' : 'OFF'}
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-2 rounded-lg bg-white/5 text-[#a3a3a3] hover:bg-red-500/20 hover:text-red-500 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {logs.length === 0 ? (
              <div className="text-center py-12 text-[#525252]">
                <FileText className="w-12 h-12 mx-auto mb-4" />
                <p>暂无执行日志</p>
              </div>
            ) : (
              logs.map(log => (
                <div
                  key={log.id}
                  className="bg-[#171717] rounded-lg p-4 border border-white/5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(log.status)}
                    <div>
                      <p className="font-medium">{log.task_name || `任务 #${log.task_id}`}</p>
                      <p className="text-sm text-[#a3a3a3]">{formatTime(log.run_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {log.duration && (
                      <span className="text-sm text-[#a3a3a3]">{log.duration}ms</span>
                    )}
                    {log.output && (
                      <span className="text-sm text-[#525252] truncate max-w-xs">
                        {log.output}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingTask) && (
        <TaskModal
          task={editingTask}
          onClose={() => {
            setShowCreateModal(false);
            setEditingTask(null);
          }}
          onSave={handleSaveTask}
        />
      )}
    </div>
  );
};

// Task Modal Component
interface TaskModalProps {
  task: any;
  onClose: () => void;
  onSave: (task: any) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ task, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: task?.name || '',
    description: task?.description || '',
    type: task?.type || 'cron',
    cron_expression: task?.cron_expression || '0 0 * * *',
    action_type: task?.action_type || 'http_request',
    action_config: task?.action_config ? JSON.parse(task.action_config) : {},
    enabled: task?.enabled ?? 1
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...task,
      ...formData,
      action_config: JSON.stringify(formData.action_config)
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#171717] rounded-lg border border-white/10 w-full max-w-lg max-h-[90vh] overflow-auto">
        <div className="p-4 border-b border-white/5">
          <h2 className="text-lg font-bold">{task ? '编辑任务' : '新建任务'}</h2>
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
            <label className="block text-sm text-[#a3a3a3] mb-1">任务类型</label>
            <select
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-lg text-[#f5f5f5] text-sm focus:border-[#10b981] focus:outline-none"
            >
              <option value="cron">定时任务 (Cron)</option>
              <option value="manual">手动执行</option>
              <option value="webhook">Webhook</option>
            </select>
          </div>
          {formData.type === 'cron' && (
            <div>
              <label className="block text-sm text-[#a3a3a3] mb-1">Cron 表达式</label>
              <input
                type="text"
                value={formData.cron_expression}
                onChange={e => setFormData({ ...formData, cron_expression: e.target.value })}
                className="w-full px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-lg text-[#f5f5f5] text-sm focus:border-[#10b981] focus:outline-none"
                placeholder="0 0 * * *"
              />
            </div>
          )}
          <div>
            <label className="block text-sm text-[#a3a3a3] mb-1">执行动作</label>
            <select
              value={formData.action_type}
              onChange={e => setFormData({ ...formData, action_type: e.target.value })}
              className="w-full px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-lg text-[#f5f5f5] text-sm focus:border-[#10b981] focus:outline-none"
            >
              <option value="http_request">HTTP请求</option>
              <option value="send_notification">发送通知</option>
              <option value="rclone_sync">Rclone同步</option>
              <option value="script">执行脚本</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enabled"
              checked={formData.enabled}
              onChange={e => setFormData({ ...formData, enabled: e.target.checked ? 1 : 0 })}
              className="w-4 h-4 rounded border-white/10 bg-[#0a0a0a] text-[#10b981]"
            />
            <label htmlFor="enabled" className="text-sm">启用任务</label>
          </div>
          <div className="flex gap-3 pt-4">
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
              {task ? '保存' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AutomationViewCN;
