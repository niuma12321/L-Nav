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
  Tablet,
  Database,
  Globe,
  Link2,
  Type,
  RefreshCw,
  Code2,
  Trash2,
  Eye,
  EyeOff,
  Pin
} from 'lucide-react';
import { useWidgetSystem } from '../../hooks/useWidgetSystem';
import { WidgetConfig, DEFAULT_WIDGETS, createAPIWidget, APIDataConfig } from './widgetTypes';

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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#181a1c] rounded-2xl border border-white/10 w-full max-w-md p-6 shadow-2xl my-auto">
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
  const { widgets, toggleWidget, updateWidgetPosition, addWidget, removeWidget, updateWidget } = useWidgetSystem();
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showAddWidgetModal, setShowAddWidgetModal] = useState(false);
  const [editingWidget, setEditingWidget] = useState<WidgetConfig | null>(null);
  const [settingsWidget, setSettingsWidget] = useState<WidgetConfig | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Add/Edit widget form state
  const [newWidgetType, setNewWidgetType] = useState<'api-data'>('api-data');
  const [newWidgetTitle, setNewWidgetTitle] = useState('');
  const [newWidgetDesc, setNewWidgetDesc] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [apiMethod, setApiMethod] = useState<'GET' | 'POST'>('GET');
  const [apiHeaders, setApiHeaders] = useState('');
  const [apiBody, setApiBody] = useState('');
  const [refreshInterval, setRefreshInterval] = useState(0);
  const [dataPath, setDataPath] = useState('');
  const [displayType, setDisplayType] = useState<'list' | 'table' | 'json' | 'cards'>('list');
  const [addError, setAddError] = useState('');

  // 分离固定组件和自定义组件
  const fixedWidgets = widgets.filter(w => w.isFixed);
  const customWidgets = widgets.filter(w => !w.isFixed);
  const enabledCount = widgets.filter(w => w.enabled).length;

  // 打开编辑弹窗
  const handleEditWidget = (widget: WidgetConfig) => {
    setEditingWidget(widget);
    // 填充表单数据
    if (widget.settings?.api) {
      const api = widget.settings.api;
      setNewWidgetTitle(widget.title);
      setNewWidgetDesc(widget.description);
      setApiUrl(api.apiUrl || '');
      setApiMethod(api.method || 'GET');
      setApiHeaders(api.headers ? JSON.stringify(api.headers, null, 2) : '');
      setApiBody(api.body ? JSON.stringify(api.body, null, 2) : '');
      setRefreshInterval(api.refreshInterval || 0);
      setDataPath(api.dataPath || '');
      setDisplayType(api.displayType || 'list');
    }
    setShowAddWidgetModal(true);
  };

  // 关闭弹窗时重置表单
  const handleCloseModal = () => {
    setShowAddWidgetModal(false);
    setEditingWidget(null);
    // Reset form
    setNewWidgetTitle('');
    setNewWidgetDesc('');
    setApiUrl('');
    setApiMethod('GET');
    setApiHeaders('');
    setApiBody('');
    setRefreshInterval(0);
    setDataPath('');
    setDisplayType('list');
    setAddError('');
  };

  const handleSaveLayout = () => {
    // Save current widget order and settings
    localStorage.setItem('ynav-widgets-v9', JSON.stringify(widgets));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleAddWidget = () => {
    setAddError('');
    
    if (!newWidgetTitle.trim()) {
      setAddError('请输入组件标题');
      return;
    }
    
    if (!apiUrl.trim()) {
      setAddError('请输入API URL');
      return;
    }
    
    try {
      // Parse headers if provided
      let parsedHeaders: Record<string, string> = {};
      if (apiHeaders.trim()) {
        try {
          parsedHeaders = JSON.parse(apiHeaders);
        } catch {
          setAddError('请求头格式错误，请输入有效的JSON');
          return;
        }
      }
      
      // Parse body if provided
      let parsedBody: any = undefined;
      if (apiBody.trim()) {
        try {
          parsedBody = JSON.parse(apiBody);
        } catch {
          setAddError('请求体格式错误，请输入有效的JSON');
          return;
        }
      }
      
      const apiConfig: APIDataConfig = {
        id: editingWidget?.id || `custom-${Date.now()}`,
        name: newWidgetTitle,
        apiUrl: apiUrl,
        method: apiMethod,
        headers: Object.keys(parsedHeaders).length > 0 ? parsedHeaders : undefined,
        body: parsedBody,
        refreshInterval: refreshInterval,
        dataPath: dataPath || '',
        displayType: displayType as any,
        fields: {
          title: 'title',
          value: 'value'
        },
        maxItems: 10,
        emptyText: '暂无数据'
      };
      
      if (editingWidget) {
        // 更新现有组件
        const updatedWidget = {
          ...editingWidget,
          title: newWidgetTitle,
          description: newWidgetDesc,
          settings: { api: apiConfig }
        };
        updateWidget(updatedWidget);
      } else {
        // 创建新组件
        const newWidget = createAPIWidget(apiConfig);
        addWidget(newWidget);
      }
      
      handleCloseModal();
    } catch (err) {
      setAddError(editingWidget ? '更新组件失败' : '创建组件失败');
    }
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

      {/* 固定组件区域 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Pin className="w-4 h-4 text-emerald-400" />
          <h3 className="text-lg font-bold text-white">固定组件</h3>
          <span className="text-xs text-slate-500">(不可删除)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fixedWidgets.map((widget, index) => (
            <WidgetConfigCard 
              key={widget.id} 
              widget={widget} 
              index={index}
              isFixed={true}
              onToggle={() => toggleWidget(widget.id)}
              onEdit={() => {}}
              onSettings={() => {
                setSettingsWidget(widget);
                setShowSettingsModal(true);
              }}
              onDelete={() => {}}
            />
          ))}
        </div>
      </div>

      {/* 自定义组件区域 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-emerald-400" />
          <h3 className="text-lg font-bold text-white">自定义组件</h3>
          <span className="text-xs text-slate-500">(可修改删除)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customWidgets.map((widget, index) => (
            <WidgetConfigCard 
              key={widget.id} 
              widget={widget} 
              index={index}
              isFixed={false}
              onToggle={() => toggleWidget(widget.id)}
              onEdit={() => handleEditWidget(widget)}
              onSettings={() => {
                setSettingsWidget(widget);
                setShowSettingsModal(true);
              }}
              onDelete={() => removeWidget(widget.id)}
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

      {/* Add/Edit Widget Modal */}
      {showAddWidgetModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#181a1c] rounded-2xl border border-white/10 w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">{editingWidget ? '编辑组件' : '添加组件'}</h3>
              <button onClick={handleCloseModal} className="p-2 rounded-lg hover:bg-white/10 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Widget Type Selection */}
            <div className="mb-6">
              <label className="block text-sm text-slate-400 mb-2">组件类型</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setNewWidgetType('api-data')}
                  className={`flex-1 p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    newWidgetType === 'api-data' 
                      ? 'border-emerald-500 bg-emerald-500/10' 
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <Database className={`w-5 h-5 ${newWidgetType === 'api-data' ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span className={`text-sm ${newWidgetType === 'api-data' ? 'text-emerald-400' : 'text-slate-400'}`}>API数据</span>
                </button>
              </div>
            </div>

            {/* Basic Info */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-slate-400 mb-2">组件标题 *</label>
                <input
                  type="text"
                  value={newWidgetTitle}
                  onChange={(e) => setNewWidgetTitle(e.target.value)}
                  placeholder="例如：GitHub Trending"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">描述</label>
                <input
                  type="text"
                  value={newWidgetDesc}
                  onChange={(e) => setNewWidgetDesc(e.target.value)}
                  placeholder="可选，描述此组件的用途"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* API Configuration */}
            <div className="space-y-4 mb-6">
              <h4 className="text-sm font-medium text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                API配置
              </h4>
              
              <div>
                <label className="block text-sm text-slate-400 mb-2">API URL *</label>
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://api.example.com/data"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">请求方法</label>
                  <select
                    value={apiMethod}
                    onChange={(e) => setApiMethod(e.target.value as 'GET' | 'POST')}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:border-emerald-500/50 focus:outline-none transition-colors"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">刷新间隔(秒)</label>
                  <input
                    type="number"
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(parseInt(e.target.value) || 0)}
                    placeholder="0为不自动刷新"
                    min="0"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">请求头 (JSON格式)</label>
                <textarea
                  value={apiHeaders}
                  onChange={(e) => setApiHeaders(e.target.value)}
                  placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none transition-colors text-sm font-mono"
                />
              </div>

              {apiMethod === 'POST' && (
                <div>
                  <label className="block text-sm text-slate-400 mb-2">请求体 (JSON格式)</label>
                  <textarea
                    value={apiBody}
                    onChange={(e) => setApiBody(e.target.value)}
                    placeholder='{"key": "value"}'
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none transition-colors text-sm font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm text-slate-400 mb-2">数据路径</label>
                <input
                  type="text"
                  value={dataPath}
                  onChange={(e) => setDataPath(e.target.value)}
                  placeholder="例如：data.items 或 results (留空使用根数据)"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">显示方式</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['list', 'table', 'card', 'text'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setDisplayType(type)}
                      className={`px-3 py-2 rounded-lg text-sm border transition-all ${
                        displayType === type 
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' 
                          : 'border-white/10 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      {type === 'list' && '列表'}
                      {type === 'table' && '表格'}
                      {type === 'card' && '卡片'}
                      {type === 'text' && '文本'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Error Message */}
            {addError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {addError}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button 
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 transition-colors text-sm"
              >
                取消
              </button>
              <button 
                onClick={handleAddWidget}
                className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 text-[#0d0e10] hover:bg-emerald-400 transition-colors text-sm font-medium"
              >
                {editingWidget ? '保存修改' : '添加组件'}
              </button>
            </div>
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
  isFixed: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onSettings: () => void;
  onDelete: () => void;
}> = ({ widget, index, isFixed, onToggle, onEdit, onSettings, onDelete }) => {
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
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">{widget.title}</h3>
              {isFixed && (
                <span className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 text-[10px]">固定</span>
              )}
            </div>
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
        {!isFixed && (
          <button 
            onClick={onEdit}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 text-sm text-white hover:bg-white/10 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            进入编辑
          </button>
        )}
        {isFixed && <div />}
        <div className="flex items-center gap-1">
          <button 
            onClick={onSettings}
            className="p-2 rounded-xl text-slate-500 hover:text-emerald-400 hover:bg-white/10 transition-colors"
            title="组件设置"
          >
            <Settings className="w-4 h-4" />
          </button>
          {!isFixed && (
            <button 
              onClick={onDelete}
              className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="删除组件"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WidgetConfigCenter;
