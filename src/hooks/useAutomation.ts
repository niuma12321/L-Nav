import { useState, useEffect, useCallback } from 'react';
import { useDataStore } from './useDataStore';

const API_BASE = '/api/v1/automation';

export interface AutomationTask {
  id: number;
  name: string;
  description?: string;
  type: 'cron' | 'webhook' | 'manual';
  cron_expression?: string;
  action_type: string;
  action_config: any;
  enabled: number;
  last_run_at?: number;
  next_run_at?: number;
  created_at: number;
  updated_at: number;
}

export interface AutomationLog {
  id: number;
  task_id: number;
  task_name?: string;
  user_id: string;
  status: 'success' | 'failed' | 'running';
  output?: string;
  run_at: number;
  duration?: number;
}

export function useAutomation() {
  // 从localStorage获取用户ID或使用默认值
  const userId = localStorage.getItem('user_id') || 'default';
  const [tasks, setTasks] = useState<AutomationTask[]>([]);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [loading, setLoading] = useState(false);

  // 获取任务列表
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/tasks?userId=${userId}`);
      const data = await res.json();
      if (!data.error) {
        setTasks(data);
      }
    } catch (e) {
      console.error('获取任务失败', e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // 获取日志
  const fetchLogs = useCallback(async (limit = 50) => {
    try {
      const res = await fetch(`${API_BASE}/logs?userId=${userId}&limit=${limit}`);
      const data = await res.json();
      if (!data.error) {
        setLogs(data);
      }
    } catch (e) {
      console.error('获取日志失败', e);
    }
  }, [userId]);

  // 保存任务
  const saveTask = useCallback(async (task: Partial<AutomationTask>) => {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...task, userId })
    });
    await fetchTasks();
    return res.json();
  }, [userId, fetchTasks]);

  // 手动执行
  const runTask = useCallback(async (taskId: number) => {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/run?userId=${userId}`, { method: 'POST' });
    await fetchLogs();
    return res.json();
  }, [userId, fetchLogs]);

  // 删除任务
  const deleteTask = useCallback(async (taskId: number) => {
    await fetch(`${API_BASE}/tasks/${taskId}?userId=${userId}`, { method: 'DELETE' });
    await fetchTasks();
  }, [userId, fetchTasks]);

  // 切换任务启用状态
  const toggleTask = useCallback(async (task: AutomationTask) => {
    await saveTask({ ...task, enabled: task.enabled ? 0 : 1 });
  }, [saveTask]);

  useEffect(() => {
    fetchTasks();
    fetchLogs();
    // 每30秒自动刷新
    const interval = setInterval(() => {
      fetchTasks();
      fetchLogs();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchTasks, fetchLogs]);

  return {
    tasks,
    logs,
    loading,
    fetchTasks,
    fetchLogs,
    saveTask,
    runTask,
    deleteTask,
    toggleTask
  };
}
