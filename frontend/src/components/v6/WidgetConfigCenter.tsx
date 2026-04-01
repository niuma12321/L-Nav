import React from 'react';
import { 
  Search, 
  Grid3X3,
  LayoutDashboard,
  FolderOpen,
  FlaskConical,
  Cloud,
  TrendingUp,
  CheckSquare,
  Newspaper,
  Plus,
  Settings,
  ToggleLeft,
  ToggleRight,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit3
} from 'lucide-react';
import { useWidgetSystem } from '../../hooks/useWidgetSystem';
import { WidgetConfig, DEFAULT_WIDGETS, WidgetType } from './widgetTypes';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Search,
  LayoutDashboard,
  FolderOpen,
  FlaskConical,
  Cloud,
  TrendingUp,
  CheckSquare,
  Newspaper,
  Grid3X3
};

const WidgetConfigCenter: React.FC = () => {
  const { widgets, toggleWidget, reorderWidgets } = useWidgetSystem();

  const enabledCount = widgets.filter(w => w.enabled).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">组件配置中心</h1>
          <p className="text-sm text-slate-400">管理您的工作区仪表盘组件，定制专属的数字化生产力矩阵。</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#181a1c] text-slate-300 hover:text-white text-sm font-medium">
            <Grid3X3 className="w-4 h-4" />
            拖拽重排预览
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-[#0d0e10] font-semibold text-sm">
            <Plus className="w-4 h-4" />
            保存当前布局
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#181a1c]">
          <p className="text-3xl font-bold text-white">{enabledCount}</p>
          <p className="text-sm text-slate-500 mt-1">已启用组件</p>
        </div>
        <div className="p-5 rounded-2xl bg-[#181a1c]">
          <p className="text-3xl font-bold text-emerald-400">{widgets.length}</p>
          <p className="text-sm text-slate-500 mt-1">可用组件</p>
        </div>
        <div className="p-5 rounded-2xl bg-[#181a1c]">
          <p className="text-3xl font-bold text-white">12</p>
          <p className="text-sm text-slate-500 mt-1">桌面列数</p>
        </div>
        <div className="p-5 rounded-2xl bg-[#181a1c]">
          <p className="text-3xl font-bold text-white">1</p>
          <p className="text-sm text-slate-500 mt-1">移动端列</p>
        </div>
      </div>

      {/* Component Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {widgets.map((widget, index) => (
          <WidgetConfigCard 
            key={widget.id} 
            widget={widget} 
            index={index}
            onToggle={() => toggleWidget(widget.id)}
          />
        ))}

        {/* Add More Placeholder */}
        <button className="p-6 rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-4 text-slate-500 hover:border-emerald-500/30 hover:text-emerald-400 transition-all min-h-[200px]">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
            <Plus className="w-6 h-6" />
          </div>
          <span className="text-sm font-medium">添加更多组件</span>
        </button>
      </div>

      {/* Layout Preview */}
      <div className="mt-8 p-6 rounded-3xl bg-[#181a1c] border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">布局预览 (Drag-and-Drop)</h3>
          <div className="flex items-center gap-2 bg-[#0d0e10] rounded-xl p-1">
            <button className="px-4 py-1.5 rounded-lg bg-emerald-500 text-[#0d0e10] text-xs font-medium">
              Desktop
            </button>
            <button className="px-4 py-1.5 rounded-lg text-slate-500 text-xs">
              Tablet
            </button>
            <button className="px-4 py-1.5 rounded-lg text-slate-500 text-xs">
              Mobile
            </button>
          </div>
        </div>
        <p className="text-sm text-slate-500 mb-4">当前主屏幕 12 列网格排列。拖动组件卡片以调整位置。</p>
        
        {/* Preview Grid */}
        <div className="grid grid-cols-12 gap-3">
          {widgets.filter(w => w.enabled).map((widget) => (
            <div 
              key={`preview-${widget.id}`}
              className="col-span-6 p-6 rounded-2xl bg-[#0d0e10] border border-white/5 flex flex-col items-center justify-center gap-3 hover:border-emerald-500/30 transition-colors cursor-move"
              style={{
                gridColumn: `span ${Math.min(widget.position.desktop.w, 12)}`
              }}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <span className="text-emerald-400 text-sm">≡</span>
              </div>
              <span className="text-xs text-slate-500 uppercase tracking-wider">{widget.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const WidgetConfigCard: React.FC<{
  widget: WidgetConfig;
  index: number;
  onToggle: () => void;
}> = ({ widget, index, onToggle }) => {
  const Icon = iconMap[widget.icon] || Grid3X3;

  return (
    <div className={`p-5 rounded-3xl bg-[#181a1c] border ${widget.enabled ? 'border-emerald-500/20' : 'border-white/5'} hover:border-emerald-500/30 transition-all group`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${widget.enabled ? 'bg-emerald-500/10' : 'bg-white/5'}`}>
            <Icon className={`w-5 h-5 ${widget.enabled ? 'text-emerald-400' : 'text-slate-500'}`} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{widget.title}</h3>
            <p className="text-xs text-slate-500">{widget.position.desktop.w}×{widget.position.desktop.h} 栅格</p>
          </div>
        </div>
        
        {/* Toggle Switch */}
        <button 
          onClick={onToggle}
          className={`w-12 h-6 rounded-full transition-colors relative ${widget.enabled ? 'bg-emerald-500' : 'bg-slate-600'}`}
        >
          <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${widget.enabled ? 'left-7' : 'left-1'}`} />
        </button>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-400 leading-relaxed mb-4 line-clamp-2">
        {widget.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 text-sm text-white hover:bg-white/10 transition-colors">
          <Edit3 className="w-3.5 h-3.5" />
          进入编辑
        </button>
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/10">
            <GripVertical className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/10">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WidgetConfigCenter;
