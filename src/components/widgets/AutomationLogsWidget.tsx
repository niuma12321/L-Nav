import React from 'react';
import { FileText, RefreshCw, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import { useAutomation } from '../../hooks/useAutomation';

interface AutomationLogsWidgetProps {
  onClick?: () => void;
}

const StatusIcon = ({ status }: { status: 'success' | 'failed' | 'running' }) => {
  if (status === 'success') {
    return <CheckCircle className="w-4 h-4 text-[#10b981]" />;
  }
  if (status === 'failed') {
    return <XCircle className="w-4 h-4 text-red-500" />;
  }
  return <div className="w-4 h-4 rounded-full border-2 border-yellow-500 animate-spin" />;
};

export const AutomationLogsWidget: React.FC<AutomationLogsWidgetProps> = ({ onClick }) => {
  const { logs, loading, fetchLogs } = useAutomation();
  
  const recentLogs = logs.slice(0, 4);

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;
    return `${Math.floor(hours / 24)}天前`;
  };

  return (
    <div className="h-full flex flex-col bg-[#171717] rounded-lg p-4 border border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-[#f5f5f5]">执行日志</h3>
        <div className="flex items-center gap-1">
          <button 
            onClick={fetchLogs}
            className="p-1 rounded hover:bg-white/10 text-[#a3a3a3]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button className="p-1 rounded hover:bg-white/10 text-[#a3a3a3]">
            <span className="text-xs">⋮</span>
          </button>
        </div>
      </div>

      {/* Log List */}
      <div className="flex-1 space-y-2">
        {recentLogs.length === 0 ? (
          <p className="text-sm text-[#525252] text-center py-4">暂无执行日志</p>
        ) : (
          recentLogs.map(log => (
            <div key={log.id} className="flex items-center gap-2 py-1.5">
              <StatusIcon status={log.status as 'success' | 'failed' | 'running'} />
              <span className="text-sm text-[#a3a3a3] flex-1 truncate">{log.task_name || `任务 #${log.task_id}`}</span>
              <span className="text-xs text-[#525252]">{formatTime(log.run_at)}</span>
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

export default AutomationLogsWidget;
