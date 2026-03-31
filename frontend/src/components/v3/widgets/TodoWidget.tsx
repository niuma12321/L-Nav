import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Clock, Plus, X, MoreHorizontal } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
}

interface TodoWidgetProps {
  className?: string;
}

const TodoWidget: React.FC<TodoWidgetProps> = ({ className = '' }) => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const stored = localStorage.getItem('ynav:v3:tasks');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {}
    }
    return [
      { id: '1', title: '完成 Y-Nav V3 重构', status: 'in_progress', priority: 'high', createdAt: Date.now() },
      { id: '2', title: '优化移动端交互', status: 'todo', priority: 'medium', createdAt: Date.now() },
      { id: '3', title: '设计新图标集', status: 'done', priority: 'low', createdAt: Date.now() },
    ];
  });
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showInput, setShowInput] = useState(false);

  // Persist tasks
  useEffect(() => {
    localStorage.setItem('ynav:v3:tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      status: 'todo',
      priority: 'medium',
      createdAt: Date.now(),
    };
    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');
    setShowInput(false);
  };

  const toggleStatus = (id: string) => {
    setTasks(tasks.map(task => {
      if (task.id === id) {
        const statusOrder: Task['status'][] = ['todo', 'in_progress', 'done'];
        const currentIndex = statusOrder.indexOf(task.status);
        const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
        return { ...task, status: nextStatus };
      }
      return task;
    }));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'done':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-amber-400" />;
      default:
        return <Circle className="w-5 h-5 text-slate-500" />;
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400';
      case 'medium': return 'bg-amber-500/20 text-amber-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const stats = {
    total: tasks.length,
    done: tasks.filter(t => t.status === 'done').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    todo: tasks.filter(t => t.status === 'todo').length,
  };

  return (
    <div className={`v3-card p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">专注清单</h3>
          <p className="text-xs text-slate-500 mt-1">
            {stats.done}/{stats.total} 完成 · {stats.inProgress} 进行中
          </p>
        </div>
        <button
          onClick={() => setShowInput(true)}
          className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Add Task Input */}
      {showInput && (
        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            placeholder="添加新任务..."
            className="flex-1 px-3 py-2 bg-white/5 rounded-xl text-white text-sm placeholder-slate-500 outline-none focus:ring-1 focus:ring-emerald-500/50"
            autoFocus
          />
          <button
            onClick={() => setShowInput(false)}
            className="p-2 rounded-xl text-slate-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-hide">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            <p>暂无任务</p>
            <p className="text-xs mt-1">点击 + 添加第一个任务</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="group flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <button
                onClick={() => toggleStatus(task.id)}
                className="flex-shrink-0 transition-transform active:scale-90"
              >
                {getStatusIcon(task.status)}
              </button>
              
              <div className="flex-1 min-w-0">
                <p className={`text-sm truncate ${task.status === 'done' ? 'line-through text-slate-500' : 'text-white'}`}>
                  {task.title}
                </p>
              </div>

              <span className={`text-[10px] px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}>
                {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
              </span>

              <button
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-500 hover:text-red-400 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TodoWidget;
