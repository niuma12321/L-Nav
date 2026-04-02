import React, { useState } from 'react';
import { 
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
  Edit3,
  X,
  Save,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';
import { useWidgetSystem } from '../../hooks/useWidgetSystem';
import { WidgetConfig, DEFAULT_WIDGETS } from './widgetTypes';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Search: LayoutDashboard,
  LayoutDashboard,
  FolderOpen,
  FlaskConical,
  Cloud,
  TrendingUp,
  CheckSquare,
  Newspaper,
  Grid3X3
};

// Widget settings modal
const WidgetSettingsModal: React.FC<{
  widget: WidgetConfig | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, position: any) => void;
}> = ({ widget, isOpen, onClose, onSave }) => {
  const [position, setPosition] = useState({ x: 0, y: 0, w: 4, h: 2 });

  React.useEffect(() => {
    if (widget) {
      setPosition(widget.position.desktop);
    }
  }, [widget]);

  if (!isOpen || !widget) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#181a1c] rounded-2xl border border-white/10 w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">组件设置 - {widget.title}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">X 位置</label>
              <input
                type="number"
                value={position.x}
                onChange={(e) => setPosition({ ...position, x: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-[#0d0e10] rounded-lg border border-white/5 text-white text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Y 位置</label>
              <input
                type="number"
                value={position.y}
                onChange={(e) => setPosition({ ...position, y: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-[#0d0e10] rounded-lg border border-white/5 text-white text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">宽度 (列数)</label>
              <input
                type="number"
                value={position.w}
                onChange={(e) => setPosition({ ...position, w: parseInt(e.target.value) || 1 })}
                min={1}
                max={12}
                className="w-full px-3 py-2 bg-[#0d0e10] rounded-lg border border-white/5 text-white text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">高度 (行数)</label>
              <input
                type="number"
                value={position.h}
                onChange={(e) => setPosition({ ...position, h: parseInt(e.target.value) || 1 })}
                min={1}
                max={12}
                className="w-full px-3 py-2 bg-[#0d0e10] rounded-lg border border-white/5 text-white text-sm"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 transition-colors text-sm"
            >
              取消
            </button>
            <button
              onClick={() => {
                onSave(widget.id, { desktop: position });
                onClose();
              }}
              className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 text-[#0d0e10] font-medium hover:bg-emerald-400 transition-colors text-sm"
            >
              保存设置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const WidgetConfigCenter: React.FC = () => {
  const { widgets, toggleWidget, updateWidgetPosition } = useWidgetSystem();
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showAddWidgetModal, setShowAddWidgetModal] = useState(false);
  const [settingsWidget, setSettingsWidget] = useState<WidgetConfig | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const enabledCount = widgets.filter(w => w.enabled).length;

  const handleSaveLayout = () => {
    // Save current widget order and settings
    localStorage.setItem('ynav-widgets-v9', JSON.stringify(widgets));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">组件配置中心</h1>
          <p className="text-sm text-slate-400">管理您的工作区仪表盘组件，定制专属的数字化生产力矩阵。</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSaveLayout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-[#0d0e10] font-semibold text-sm hover:bg-emerald-400 transition-colors relative"
          >
            <Save className="w-4 h-4" />
            <span>保存当前布局</span>
            {saveSuccess && (
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-emerald-500 text-white text-xs rounded whitespace-nowrap animate-in fade-in slide-in-from-bottom-2">
                保存成功!
              </span>
            )}
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
            onEdit={() => {}}
            onSettings={() => {
              setSettingsWidget(widget);
              setShowSettingsModal(true);
            }}
          />
        ))}

        {/* Add More Placeholder */}
        <button 
          onClick={() => setShowAddWidgetModal(true)}
          className="p-6 rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-4 text-slate-500 hover:border-emerald-500/30 hover:text-emerald-400 transition-all min-h-[200px]"
        >
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
            <Plus className="w-6 h-6" />
          </div>
          <span className="text-sm font-medium">添加更多组件</span>
        </button>
      </div>

      {/* Layout Preview */}
      <div className="mt-8 p-6 rounded-3xl bg-[#181a1c] border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">布局预览</h3>
          <div className="flex items-center gap-2 bg-[#0d0e10] rounded-xl p-1">
            <button 
              onClick={() => setPreviewMode('desktop')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                previewMode === 'desktop' 
                  ? 'bg-emerald-500 text-[#0d0e10]' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              Desktop
            </button>
            <button 
              onClick={() => setPreviewMode('tablet')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                previewMode === 'tablet' 
                  ? 'bg-emerald-500 text-[#0d0e10]' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
              Tablet
            </button>
            <button 
              onClick={() => setPreviewMode('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                previewMode === 'mobile' 
                  ? 'bg-emerald-500 text-[#0d0e10]' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Mobile
            </button>
          </div>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          {previewMode === 'desktop' && '桌面端预览：12列网格布局，适合大屏幕展示'}
          {previewMode === 'tablet' && '平板端预览：8列网格布局，适合中等屏幕'}
          {previewMode === 'mobile' && '移动端预览：4列网格布局，适合小屏幕'}
        </p>
        
        {/* Device Simulator Frame */}
        <div className={`mx-auto transition-all duration-500 ease-in-out overflow-hidden rounded-2xl border-4 border-[#0d0e10] bg-[#0d0e10] shadow-2xl ${
          previewMode === 'desktop' ? 'w-full max-w-6xl' : 
          previewMode === 'tablet' ? 'w-[768px] max-w-full' : 
          'w-[375px] max-w-full'
        }`}>
          {/* Device Status Bar */}
          <div className={`flex items-center justify-between px-4 py-2 bg-[#181a1c] border-b border-white/5 ${
            previewMode === 'mobile' ? 'h-7' : previewMode === 'tablet' ? 'h-6' : 'h-5'
          }`}>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-slate-600" />
              <span className="text-[10px] text-slate-500">
                {previewMode === 'desktop' ? 'Desktop 1920×1080' : 
                 previewMode === 'tablet' ? 'Tablet 768×1024' : 
                 'Mobile 375×812'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-slate-600" />
              <div className="w-3 h-3 rounded-full bg-slate-600" />
            </div>
          </div>
          
          {/* Preview Content Area */}
          <div className={`p-4 bg-[#0d0e10] min-h-[300px] ${
            previewMode === 'mobile' ? 'h-[600px] overflow-y-auto' : 
            previewMode === 'tablet' ? 'h-[500px] overflow-y-auto' : 
            'h-[400px]'
          }`}>
            <div className={`grid gap-3 transition-all duration-300 ${
              previewMode === 'desktop' ? 'grid-cols-12' : 
              previewMode === 'tablet' ? 'grid-cols-8' : 
              'grid-cols-4'
            }`}>
              {widgets.filter(w => w.enabled).map((widget) => {
                const position = widget.position.desktop;
                const colSpan = previewMode === 'desktop' 
                  ? Math.min(position.w, 12) 
                  : previewMode === 'tablet' 
                    ? Math.min(position.w, 8) 
                    : Math.min(position.w, 4);
                
                return (
                  <div 
                    key={`preview-${widget.id}`}
                    className={`rounded-xl bg-[#181a1c] border border-white/5 flex flex-col items-center justify-center gap-2 hover:border-emerald-500/30 transition-all ${
                      previewMode === 'desktop' ? 'p-4' : 
                      previewMode === 'tablet' ? 'p-3' : 
                      'p-2'
                    }`}
                    style={{ gridColumn: `span ${colSpan}` }}
                  >
                    <div className={`rounded-lg bg-emerald-500/10 flex items-center justify-center ${
                      previewMode === 'desktop' ? 'w-12 h-12' : 
                      previewMode === 'tablet' ? 'w-10 h-10' : 
                      'w-8 h-8'
                    }`}>
                      <span className="text-emerald-400 text-lg">≡</span>
                    </div>
                    <span className={`text-slate-400 text-center ${
                      previewMode === 'mobile' ? 'text-[10px]' : 'text-xs'
                    }`}>{widget.title}</span>
                    <span className="text-[10px] text-slate-600">
                      {position.w}×{position.h}
                    </span>
                  </div>
                );
              })}
              
              {/* Empty State */}
              {widgets.filter(w => w.enabled).length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-500">
                  <Grid3X3 className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">未启用任何组件</p>
                  <p className="text-xs mt-1 opacity-50">请在上方启用组件以预览</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Widget Modal */}
      {showAddWidgetModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181a1c] rounded-2xl border border-white/10 w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">添加组件</h3>
              <button onClick={() => setShowAddWidgetModal(false)} className="p-2 rounded-lg hover:bg-white/10 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-400 mb-4">敬请期待更多组件...</p>
            <button 
              onClick={() => setShowAddWidgetModal(false)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 transition-colors text-sm"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <WidgetSettingsModal
        widget={settingsWidget}
        isOpen={showSettingsModal}
        onClose={() => {
          setShowSettingsModal(false);
          setSettingsWidget(null);
        }}
        onSave={updateWidgetPosition}
      />
    </div>
  );
};

const WidgetConfigCard: React.FC<{
  widget: WidgetConfig;
  index: number;
  onToggle: () => void;
  onEdit: () => void;
  onSettings: () => void;
}> = ({ widget, index, onToggle, onEdit, onSettings }) => {
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
        <button 
          onClick={onEdit}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 text-sm text-white hover:bg-white/10 transition-colors"
        >
          <Edit3 className="w-3.5 h-3.5" />
          进入编辑
        </button>
        <div className="flex items-center gap-1">
          <button 
            onClick={onSettings}
            className="p-2 rounded-xl text-slate-500 hover:text-emerald-400 hover:bg-white/10 transition-colors"
            title="组件设置"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WidgetConfigCenter;
