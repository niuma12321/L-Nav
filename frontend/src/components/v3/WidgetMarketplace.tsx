import React from 'react';
import { 
  Cloud, 
  CheckSquare, 
  Flame, 
  StickyNote, 
  BarChart3,
  X,
  GripVertical,
  Eye,
  EyeOff
} from 'lucide-react';

interface WidgetMarketplaceProps {
  isOpen: boolean;
  onClose: () => void;
  activeWidgets: string[];
  onToggleWidget: (widgetId: string) => void;
  onReorderWidgets: (oldIndex: number, newIndex: number) => void;
}

interface WidgetItem {
  id: string;
  name: string;
  description: string;
  icon: typeof Cloud;
  color: string;
}

const availableWidgets: WidgetItem[] = [
  { 
    id: 'weather', 
    name: '实时气象', 
    description: '显示当前位置的天气、温度、湿度等信息',
    icon: Cloud,
    color: '#3b82f6'
  },
  { 
    id: 'todo', 
    name: '专注清单', 
    description: '轻量级任务管理，支持状态切换',
    icon: CheckSquare,
    color: '#10b981'
  },
  { 
    id: 'hotlist', 
    name: '动态聚合', 
    description: '微博、知乎、IT之家热榜实时推送',
    icon: Flame,
    color: '#ef4444'
  },
  { 
    id: 'notes', 
    name: '个人便签', 
    description: '瀑布流/列表双模切换，支持Markdown',
    icon: StickyNote,
    color: '#8b5cf6'
  },
  { 
    id: 'stats', 
    name: '数据概览', 
    description: '资源数量、便签统计等核心数据',
    icon: BarChart3,
    color: '#06b6d4'
  },
];

const WidgetMarketplace: React.FC<WidgetMarketplaceProps> = ({
  isOpen,
  onClose,
  activeWidgets,
  onToggleWidget,
  onReorderWidgets
}) => {
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (sourceIndex !== targetIndex) {
      onReorderWidgets(sourceIndex, targetIndex);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[#181a1c] rounded-3xl overflow-hidden shadow-2xl border border-white/5">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">组件市场</h2>
            <p className="text-sm text-slate-400">自定义首页挂载的工具卡片</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
              已启用 ({activeWidgets.length})
            </h3>
            <p className="text-xs text-slate-500">拖拽调整显示顺序</p>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {availableWidgets.map((widget, index) => {
              const isActive = activeWidgets.includes(widget.id);
              const Icon = widget.icon;
              
              return (
                <div
                  key={widget.id}
                  draggable={isActive}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-white/10 cursor-move' 
                      : 'bg-white/5 opacity-60'
                  }`}
                >
                  {/* Drag Handle */}
                  <div className={`p-2 rounded-lg ${isActive ? 'text-slate-400' : 'text-slate-600'}`}>
                    <GripVertical className="w-4 h-4" />
                  </div>

                  {/* Icon */}
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${widget.color}20` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: widget.color }} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white">{widget.name}</h4>
                    <p className="text-xs text-slate-500 truncate">{widget.description}</p>
                  </div>

                  {/* Toggle */}
                  <button
                    onClick={() => onToggleWidget(widget.id)}
                    className={`p-2 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-white/5 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {isActive ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Reset Button */}
          <div className="mt-6 pt-4 border-t border-white/5">
            <button
              onClick={() => {
                // Reset to default
                activeWidgets.forEach(id => {
                  if (!['weather', 'todo', 'hotlist', 'notes'].includes(id)) {
                    onToggleWidget(id);
                  }
                });
              }}
              className="w-full py-3 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-colors text-sm"
            >
              恢复默认配置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WidgetMarketplace;
