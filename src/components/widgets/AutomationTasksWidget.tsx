import React from 'react';
import { Clock, RefreshCw, ChevronRight } from 'lucide-react';
import { useAutomation } from '../../hooks/useAutomation';

interface AutomationTasksWidgetProps {
  onClick?: () => void;
}

export const AutomationTasksWidget: React.FC<AutomationTasksWidgetProps> = ({ onClick }) => {
  const { tasks, loading, fetchTasks } = useAutomation();
  
  // 获取启用的定时任务，按下次执行时间排序
  const upcomingTasks = tasks
    .filter(t => t.enabled && t.next_run_at)
    .sort((a, b) => (a.next_run_at || 0) - (b.next_run_at || 0))
    .slice(0, 4);

  return (
    <div className="h-full flex flex-col bg-[#171717] rounded-lg p-4 border border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-[#f5f5f5]">待执行任务</h3>
        <div className="flex items-center gap-1">
          <button 
            onClick={fetchTasks}
            className="p-1 rounded hover:bg-white/10 text-[#a3a3a3]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button className="p-1 rounded hover:bg-white/10 text-[#a3a3a3]">
            <span className="text-xs">⋮</span>
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 space-y-2">
        {upcomingTasks.length === 0 ? (
          <p className="text-sm text-[#525252] text-center py-4">暂无待执行任务</p>
        ) : (
          upcomingTasks.map(task => (
            <div key={task.id} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-[#a3a3a3] truncate">{task.name}</span>
              <div className="flex items-center gap-1 text-xs text-[#525252]">
                <Clock className="w-3 h-3" />
                {task.next_run_at ? new Date(task.next_run_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '-'}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <button 
        onClick={onClick}
        className="flex items-center gap-1 mt-3 pt-3 border-t border-white/5 text-xs text-[#10b981] hover:text-[#059669] transition-colors"
      >
        查看全部
        <ChevronRight className="w-3 h-3" />
      </button>
    </div>
  );
};

export default AutomationTasksWidget;
