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
  Pin,
  Clock,
  Zap,
  Image as ImageIcon,
  Coins,
  History,
  Gamepad2,
  Medal,
  Droplets,
  CloudRain,
  Coffee,
  Music,
  MessageCircle,
  Laugh,
  HelpCircle,
  Utensils,
  Flame,
  Sparkles,
  Search,
  FileJson,
  FileText,
  List,
  AlignLeft
} from 'lucide-react';
import { useWidgetSystem } from '../../hooks/useWidgetSystem';
import { 
  WidgetConfig, 
  DEFAULT_WIDGETS, 
  createAPIWidget, 
  APIDataConfig,
  ALL_API_60S_PRESETS,
  API_60S_PERIODIC,
  API_60S_UTILITY,
  API_60S_TRENDING,
  API_60S_ENTERTAINMENT,
  API60sPreset,
  API60sCategory
} from './widgetTypes';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Search: LayoutDashboard,
  LayoutDashboard,
  FolderOpen,
  FlaskConical,
  Cloud,
  TrendingUp,
  CheckSquare,
  Newspaper,
  Grid3X3,
  Clock,
  Zap,
  Image: ImageIcon,
  Coins,
  History,
  Gamepad2,
  Medal,
  Droplets,
  CloudRain,
  Coffee,
  Music,
  MessageCircle,
  Laugh,
  HelpCircle,
  Utensils,
  Flame,
  Sparkles
};

// 键值对编辑器组件
interface KeyValueItem {
  id: string;
  key: string;
  value: string;
}

interface KeyValueEditorProps {
  items: KeyValueItem[];
  onChange: (items: KeyValueItem[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  addButtonText?: string;
}

const KeyValueEditor: React.FC<KeyValueEditorProps> = ({
  items,
  onChange,
  keyPlaceholder = '参数名',
  valuePlaceholder = '参数值',
  addButtonText = '添加'
}) => {
  const addItem = () => {
    onChange([...items, { id: `${Date.now()}-${Math.random()}`, key: '', value: '' }]);
  };

  const removeItem = (id: string) => {
    onChange(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: 'key' | 'value', value: string) => {
    onChange(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-2">
          <input
            type="text"
            value={item.key}
            onChange={(e) => updateItem(item.id, 'key', e.target.value)}
            placeholder={keyPlaceholder}
            className="flex-1 px-3 py-2 bg-[#181a1c] rounded-lg border border-white/10 text-white text-sm focus:border-emerald-500/50 focus:outline-none"
          />
          <input
            type="text"
            value={item.value}
            onChange={(e) => updateItem(item.id, 'value', e.target.value)}
            placeholder={valuePlaceholder}
            className="flex-1 px-3 py-2 bg-[#181a1c] rounded-lg border border-white/10 text-white text-sm focus:border-emerald-500/50 focus:outline-none"
          />
          <button
            onClick={() => removeItem(item.id)}
            className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        onClick={addItem}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors text-sm"
      >
        <Plus className="w-4 h-4" />
        {addButtonText}
      </button>
    </div>
  );
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
  const [show60sAPIModal, setShow60sAPIModal] = useState(false);
  const [editingWidget, setEditingWidget] = useState<WidgetConfig | null>(null);
  const [settingsWidget, setSettingsWidget] = useState<WidgetConfig | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeCategory, setActiveCategory] = useState<API60sCategory | 'all'>('all');

  // API配置弹窗标签页状态
  const [apiConfigTab, setApiConfigTab] = useState<'basic' | 'params' | 'headers' | 'body'>('basic');
  
  // Query参数状态（键值对数组）
  const [queryParams, setQueryParams] = useState<Array<{ key: string; value: string; id: string }>>([]);
  
  // 请求头编辑模式
  const [headersRawMode, setHeadersRawMode] = useState(false);
  const [headersKeyValue, setHeadersKeyValue] = useState<Array<{ key: string; value: string; id: string }>>([]);
  
  // 请求体类型和状态
  const [bodyType, setBodyType] = useState<'none' | 'json' | 'form-data' | 'x-www-form-urlencoded'>('none');
  const [bodyFormData, setBodyFormData] = useState<Array<{ key: string; value: string; id: string }>>([]);
  const [bodyRawJson, setBodyRawJson] = useState('');
  
  // 自定义API编辑模式状态
  const [isEditingCustomAPI, setIsEditingCustomAPI] = useState(false);
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);

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
  const [fieldsTitle, setFieldsTitle] = useState('title');
  const [fieldsValue, setFieldsValue] = useState('value');
  const [fieldsSubtitle, setFieldsSubtitle] = useState('');
  const [fieldsImage, setFieldsImage] = useState('');
  const [fieldsLink, setFieldsLink] = useState('');
  const [maxItems, setMaxItems] = useState(10);
  const [emptyText, setEmptyText] = useState('暂无数据');
  const [addError, setAddError] = useState('');

  // API preset config modal state
  const [showAPIConfigModal, setShowAPIConfigModal] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<API60sPreset | null>(null);

  // 分离固定组件和自定义组件
  const fixedWidgets = widgets.filter(w => w.isFixed);
  const customWidgets = widgets.filter(w => !w.isFixed);
  const enabledCount = widgets.filter(w => w.enabled).length;

  // 打开编辑弹窗
  const handleEditWidget = (widget: WidgetConfig) => {
    setEditingWidget(widget);
    setIsEditingCustomAPI(true);
    setEditingWidgetId(widget.id);
    // 填充表单数据
    if (widget.settings?.api) {
      const api = widget.settings.api;
      setNewWidgetTitle(widget.title);
      setNewWidgetDesc(widget.description);
      setApiUrl(api.apiUrl || '');
      setApiMethod(api.method || 'GET');
      setRefreshInterval(api.refreshInterval || 0);
      setDataPath(api.dataPath || '');
      setDisplayType(api.displayType || 'list');
      setFieldsTitle(api.fields?.title || 'title');
      setFieldsValue(api.fields?.value || '');
      setFieldsSubtitle(api.fields?.subtitle || '');
      setFieldsImage(api.fields?.image || '');
      setFieldsLink(api.fields?.link || '');
      setMaxItems(api.maxItems || 10);
      setEmptyText(api.emptyText || '暂无数据');
      
      // 解析headers到键值对格式
      if (api.headers && Object.keys(api.headers).length > 0) {
        const headerEntries = Object.entries(api.headers).map(([key, value], index) => ({
          id: `header-${index}-${Date.now()}`,
          key,
          value: String(value)
        }));
        setHeadersKeyValue(headerEntries);
        setApiHeaders(JSON.stringify(api.headers, null, 2));
      } else {
        setHeadersKeyValue([]);
        setApiHeaders('');
      }
      
      // 解析body和bodyType
      if (api.bodyType) {
        setBodyType(api.bodyType);
      } else if (api.body) {
        // 兼容旧数据，根据body类型推断
        if (typeof api.body === 'string') {
          setBodyType('json');
        } else if (typeof api.body === 'object') {
          setBodyType('json');
        } else {
          setBodyType('none');
        }
      } else {
        setBodyType(api.method === 'GET' || api.method === 'DELETE' ? 'none' : 'json');
      }
      
      if (api.body) {
        if (typeof api.body === 'string') {
          try {
            const parsed = JSON.parse(api.body);
            setBodyRawJson(JSON.stringify(parsed, null, 2));
          } catch {
            setBodyRawJson(api.body);
          }
        } else if (typeof api.body === 'object') {
          setBodyRawJson(JSON.stringify(api.body, null, 2));
        }
      } else {
        setBodyRawJson('');
      }
      setBodyFormData([]);
      
      // Query参数从配置加载或从URL解析
      if (api.queryParams && api.queryParams.length > 0) {
        setQueryParams(api.queryParams.map((p, index) => ({
          id: `param-${index}-${Date.now()}`,
          key: p.key,
          value: p.value
        })));
      } else {
        // 尝试从URL解析query参数
        try {
          const urlObj = new URL(api.apiUrl);
          const params: Array<{ key: string; value: string; id: string }> = [];
          urlObj.searchParams.forEach((value, key) => {
            params.push({ id: `param-${params.length}-${Date.now()}`, key, value });
          });
          setQueryParams(params);
        } catch {
          setQueryParams([]);
        }
      }
    }
    setApiConfigTab('basic');
    setHeadersRawMode(false);
    setShowAddWidgetModal(true);
  };

  // 关闭弹窗时重置表单
  const handleCloseModal = () => {
    setShowAddWidgetModal(false);
    setEditingWidget(null);
    setIsEditingCustomAPI(false);
    setEditingWidgetId(null);
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
    setFieldsTitle('title');
    setFieldsValue('value');
    setFieldsSubtitle('');
    setFieldsImage('');
    setFieldsLink('');
    setMaxItems(10);
    setEmptyText('暂无数据');
    setAddError('');
    // Reset new states
    setApiConfigTab('basic');
    setQueryParams([]);
    setHeadersRawMode(false);
    setHeadersKeyValue([]);
    setBodyType('none');
    setBodyFormData([]);
    setBodyRawJson('');
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
      // 构建headers
      let parsedHeaders: Record<string, string> = {};
      if (headersRawMode) {
        // Raw JSON模式
        if (apiHeaders.trim()) {
          try {
            parsedHeaders = JSON.parse(apiHeaders);
          } catch {
            setAddError('请求头JSON格式错误');
            return;
          }
        }
      } else {
        // 键值对模式
        (headersKeyValue || []).forEach(item => {
          if (item.key.trim()) {
            parsedHeaders[item.key.trim()] = item.value;
          }
        });
      }
      
      // 构建请求体
      let parsedBody: any = undefined;
      if (bodyType !== 'none' && apiMethod !== 'GET' && apiMethod !== 'DELETE') {
        if (bodyType === 'json') {
          if (bodyRawJson.trim()) {
            try {
              parsedBody = JSON.parse(bodyRawJson);
            } catch {
              setAddError('请求体JSON格式错误');
              return;
            }
          }
        } else if (bodyType === 'form-data' || bodyType === 'x-www-form-urlencoded') {
          const formDataObj: Record<string, string> = {};
          (bodyFormData || []).forEach(item => {
            if (item.key.trim()) {
              formDataObj[item.key.trim()] = item.value;
            }
          });
          parsedBody = formDataObj;
        }
      }
      
      // 构建带Query参数的URL
      let finalUrl = apiUrl.trim();
      const validParams = queryParams.filter(p => p.key.trim());
      if (validParams.length > 0) {
        const urlObj = new URL(finalUrl);
        validParams.forEach(param => {
          urlObj.searchParams.set(param.key.trim(), param.value);
        });
        finalUrl = urlObj.toString();
      }
      
      const apiConfig: APIDataConfig = {
        id: isEditingCustomAPI && editingWidgetId ? editingWidgetId : `custom-${Date.now()}`,
        name: newWidgetTitle,
        apiUrl: finalUrl,
        method: apiMethod,
        headers: Object.keys(parsedHeaders).length > 0 ? parsedHeaders : undefined,
        body: parsedBody,
        bodyType: bodyType,
        queryParams: validParams.map(p => ({ key: p.key.trim(), value: p.value })),
        refreshInterval: refreshInterval,
        dataPath: dataPath || '',
        displayType: displayType as any,
        fields: {
          title: fieldsTitle || 'title',
          value: fieldsValue || undefined,
          subtitle: fieldsSubtitle || undefined,
          image: fieldsImage || undefined,
          link: fieldsLink || undefined
        },
        maxItems: maxItems || 10,
        emptyText: emptyText || '暂无数据'
      };
      
      if (isEditingCustomAPI && editingWidget) {
        // 更新现有组件
        const updatedWidget = {
          ...editingWidget,
          title: newWidgetTitle,
          description: newWidgetDesc,
          settings: { 
            ...editingWidget.settings,
            api: apiConfig 
          }
        };
        updateWidget(updatedWidget);
      } else {
        // 创建新组件
        const newWidget = createAPIWidget(apiConfig);
        addWidget(newWidget);
      }
      
      handleCloseModal();
    } catch (err) {
      setAddError(isEditingCustomAPI ? '更新组件失败' : '创建组件失败');
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
            <span className="text-sm font-medium">自定义API组件</span>
          </button>

          {/* 60s API快速添加 */}
          <button 
            onClick={() => setShow60sAPIModal(true)}
            className="p-6 rounded-3xl border-2 border-dashed border-orange-500/20 flex flex-col items-center justify-center gap-4 text-slate-500 hover:border-orange-500/50 hover:text-orange-400 transition-all min-h-[200px]"
          >
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-orange-400" />
            </div>
            <span className="text-sm font-medium">API组件</span>
            <span className="text-xs text-slate-600">{ALL_API_60S_PRESETS.length} 个预设接口</span>
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
                API配置 <span className="text-xs text-slate-500">(必填)</span>
              </h4>
              
              {/* 标签页导航 */}
              <div className="flex gap-1 bg-[#0d0e10] p-1 rounded-xl">
                {[
                  { key: 'basic', label: '基础配置', icon: FileJson },
                  { key: 'params', label: '请求参数', icon: List },
                  { key: 'headers', label: '请求头', icon: AlignLeft },
                  { key: 'body', label: '请求体', icon: FileText }
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setApiConfigTab(key as any)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      apiConfigTab === key
                        ? 'bg-emerald-500 text-[#0d0e10]'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              {/* 基础配置标签 */}
              {apiConfigTab === 'basic' && (
                <div className="space-y-3">
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
                      <label className="block text-sm text-slate-400 mb-2">请求方法 *</label>
                      <select
                        value={apiMethod}
                        onChange={(e) => {
                          const method = e.target.value as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
                          setApiMethod(method as 'GET' | 'POST');
                          // 自动切换请求体类型
                          if (method === 'GET' || method === 'DELETE') {
                            setBodyType('none');
                          } else if (bodyType === 'none') {
                            setBodyType('json');
                          }
                        }}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:border-emerald-500/50 focus:outline-none transition-colors"
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="PATCH">PATCH</option>
                        <option value="DELETE">DELETE</option>
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
                    <label className="block text-sm text-slate-400 mb-2">数据路径</label>
                    <input
                      type="text"
                      value={dataPath}
                      onChange={(e) => setDataPath(e.target.value)}
                      placeholder="例如：data.items 或 results (留空使用根数据)"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* 请求参数标签 */}
              {apiConfigTab === 'params' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm text-slate-400">Query 参数</label>
                    <span className="text-xs text-slate-500">自动拼接到 URL</span>
                  </div>
                  <KeyValueEditor
                    items={queryParams}
                    onChange={setQueryParams}
                    keyPlaceholder="参数名"
                    valuePlaceholder="参数值"
                    addButtonText="添加参数"
                  />
                </div>
              )}

              {/* 请求头标签 */}
              {apiConfigTab === 'headers' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm text-slate-400">请求头</label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Raw JSON</span>
                      <button
                        onClick={() => {
                          if (!headersRawMode) {
                            // 切换到Raw模式，转换键值对为JSON
                            const obj: Record<string, string> = {};
                            (headersKeyValue || []).forEach(item => {
                              if (item.key.trim()) obj[item.key] = item.value;
                            });
                            setApiHeaders(JSON.stringify(obj, null, 2));
                          } else {
                            // 切换到键值对模式，解析JSON
                            try {
                              const obj = JSON.parse(apiHeaders || '{}');
                              const items = Object.entries(obj).map(([key, value], idx) => ({
                                id: `h-${idx}-${Date.now()}`,
                                key,
                                value: String(value)
                              }));
                              setHeadersKeyValue(items);
                            } catch {
                              setHeadersKeyValue([]);
                            }
                          }
                          setHeadersRawMode(!headersRawMode);
                        }}
                        className={`w-10 h-5 rounded-full transition-colors relative ${
                          headersRawMode ? 'bg-emerald-500' : 'bg-slate-600'
                        }`}
                      >
                        <span className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform ${
                          headersRawMode ? 'left-6' : 'left-1'
                        }`} />
                      </button>
                    </div>
                  </div>
                  {headersRawMode ? (
                    <textarea
                      value={apiHeaders}
                      onChange={(e) => setApiHeaders(e.target.value)}
                      placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                      rows={5}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none transition-colors text-sm font-mono"
                    />
                  ) : (
                    <KeyValueEditor
                      items={headersKeyValue}
                      onChange={setHeadersKeyValue}
                      keyPlaceholder="Header 名称"
                      valuePlaceholder="Header 值"
                      addButtonText="添加请求头"
                    />
                  )}
                </div>
              )}

              {/* 请求体标签 */}
              {apiConfigTab === 'body' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm text-slate-400">请求体类型</label>
                    {(apiMethod === 'GET' || apiMethod === 'DELETE') && (
                      <span className="text-xs text-amber-400">{apiMethod} 请求通常不需要请求体</span>
                    )}
                  </div>
                  <select
                    value={bodyType}
                    onChange={(e) => setBodyType(e.target.value as any)}
                    disabled={apiMethod === 'GET' || apiMethod === 'DELETE'}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:border-emerald-500/50 focus:outline-none transition-colors disabled:opacity-50"
                  >
                    <option value="none">none (无请求体)</option>
                    <option value="json">JSON</option>
                    <option value="form-data">Form Data</option>
                    <option value="x-www-form-urlencoded">x-www-form-urlencoded</option>
                  </select>
                  
                  {bodyType === 'json' && (
                    <textarea
                      value={bodyRawJson}
                      onChange={(e) => setBodyRawJson(e.target.value)}
                      placeholder='{"key": "value"}'
                      rows={5}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none transition-colors text-sm font-mono"
                    />
                  )}
                  
                  {(bodyType === 'form-data' || bodyType === 'x-www-form-urlencoded') && (
                    <KeyValueEditor
                      items={bodyFormData}
                      onChange={setBodyFormData}
                      keyPlaceholder="字段名"
                      valuePlaceholder="字段值"
                      addButtonText="添加字段"
                    />
                  )}
                </div>
              )}
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

      {/* 60s API选择弹窗 */}
      {show60sAPIModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#181a1c] rounded-2xl border border-white/10 w-full max-w-4xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">API 组件库</h3>
                <p className="text-sm text-slate-400 mt-1">点击添加预设API组件到您的仪表盘，添加后可在组件设置中配置参数</p>
              </div>
              <button 
                onClick={() => setShow60sAPIModal(false)} 
                className="p-2 rounded-lg hover:bg-white/10 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 分类筛选 */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {[
                { key: 'all', label: '全部', icon: Grid3X3 },
                { key: 'periodic', label: '周期资讯', icon: Clock },
                { key: 'utility', label: '实用功能', icon: Zap },
                { key: 'trending', label: '热门榜单', icon: Flame },
                { key: 'entertainment', label: '消遣娱乐', icon: Laugh }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveCategory(key as API60sCategory | 'all')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                    activeCategory === key
                      ? 'bg-orange-500 text-[#0d0e10]'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* API列表 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(activeCategory === 'all' 
                ? ALL_API_60S_PRESETS 
                : ALL_API_60S_PRESETS.filter(p => p.category === activeCategory)
              ).map((preset) => {
                const PresetIcon = iconMap[preset.icon] || Globe;
                const isAdded = widgets.some(w => w.settings?.api?.id === preset.id);
                
                return (
                  <div
                    key={preset.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isAdded 
                        ? 'border-emerald-500/30 bg-emerald-500/5' 
                        : 'border-white/10 hover:border-orange-500/30 bg-[#0d0e10]'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                        <PresetIcon className="w-5 h-5 text-orange-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">{preset.name}</h4>
                        <p className="text-xs text-slate-500">{preset.categoryLabel}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mb-4 line-clamp-2">{preset.description}</p>
                    <button
                      onClick={() => {
                        if (!isAdded) {
                          setSelectedPreset(preset);
                          // 预填充配置参数
                          setNewWidgetTitle(preset.config.name);
                          setNewWidgetDesc(preset.description);
                          setApiUrl(preset.config.apiUrl);
                          setApiMethod(preset.config.method);
                          setRefreshInterval(preset.config.refreshInterval);
                          setDataPath(preset.config.dataPath);
                          setDisplayType(preset.config.displayType as any);
                          setFieldsTitle(preset.config.fields.title);
                          setFieldsValue(preset.config.fields.value || '');
                          setFieldsSubtitle(preset.config.fields.subtitle || '');
                          setFieldsImage(preset.config.fields.image || '');
                          setFieldsLink(preset.config.fields.link || '');
                          setMaxItems(preset.config.maxItems);
                          setEmptyText(preset.config.emptyText);
                          // 初始化新状态
                          setApiConfigTab('basic');
                          setQueryParams([]);
                          setHeadersRawMode(false);
                          setHeadersKeyValue([]);
                          setApiHeaders(preset.config.headers ? JSON.stringify(preset.config.headers, null, 2) : '');
                          if (preset.config.headers) {
                            const headerEntries = Object.entries(preset.config.headers).map(([key, value], index) => ({
                              id: `preset-header-${index}-${Date.now()}`,
                              key,
                              value: String(value)
                            }));
                            setHeadersKeyValue(headerEntries);
                          }
                          setBodyType('none');
                          setBodyFormData([]);
                          setBodyRawJson(preset.config.body ? JSON.stringify(preset.config.body, null, 2) : '');
                          if (preset.config.body && typeof preset.config.body === 'object') {
                            setBodyType('json');
                          }
                          setShowAPIConfigModal(true);
                        }
                      }}
                      disabled={isAdded}
                      className={`w-full py-2 rounded-xl text-sm font-medium transition-colors ${
                        isAdded
                          ? 'bg-emerald-500/20 text-emerald-400 cursor-default'
                          : 'bg-orange-500 text-[#0d0e10] hover:bg-orange-400'
                      }`}
                    >
                      {isAdded ? '已添加' : '配置并添加'}
                    </button>
                  </div>
                );
              })}
            </div>

            {activeCategory !== 'all' && 
              ALL_API_60S_PRESETS.filter(p => p.category === activeCategory).length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <p>该分类下暂无API组件</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* API参数配置弹窗 */}
      {showAPIConfigModal && selectedPreset && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#181a1c] rounded-2xl border border-white/10 w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">配置API组件 - {selectedPreset.name}</h3>
                <p className="text-sm text-slate-400 mt-1">配置API参数和显示选项</p>
              </div>
              <button 
                onClick={() => {
                  setShowAPIConfigModal(false);
                  setSelectedPreset(null);
                  handleCloseModal();
                }} 
                className="p-2 rounded-lg hover:bg-white/10 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 基本信息 */}
              <div className="p-4 rounded-xl bg-[#0d0e10] border border-white/5">
                <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  基本信息
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">组件名称 <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      value={newWidgetTitle}
                      onChange={(e) => setNewWidgetTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-[#181a1c] rounded-lg border border-white/10 text-white text-sm focus:border-emerald-500/50 focus:outline-none"
                      placeholder="组件显示名称"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">描述</label>
                    <input
                      type="text"
                      value={newWidgetDesc}
                      onChange={(e) => setNewWidgetDesc(e.target.value)}
                      className="w-full px-3 py-2 bg-[#181a1c] rounded-lg border border-white/10 text-white text-sm focus:border-emerald-500/50 focus:outline-none"
                      placeholder="组件描述"
                    />
                  </div>
                </div>
              </div>

              {/* API配置 - 必填 */}
              <div className="p-4 rounded-xl bg-[#0d0e10] border border-white/5">
                <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  API配置 <span className="text-xs text-slate-500 font-normal">(必填)</span>
                </h4>
                
                {/* 标签页导航 */}
                <div className="flex gap-1 bg-[#0d0e10] p-1 rounded-xl mb-3 border border-white/5">
                  {[
                    { key: 'basic', label: '基础配置', icon: FileJson },
                    { key: 'params', label: '请求参数', icon: List },
                    { key: 'headers', label: '请求头', icon: AlignLeft },
                    { key: 'body', label: '请求体', icon: FileText }
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setApiConfigTab(key as any)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        apiConfigTab === key
                          ? 'bg-emerald-500 text-[#0d0e10]'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>

                {/* 基础配置标签 */}
                {apiConfigTab === 'basic' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">API URL <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        value={apiUrl}
                        onChange={(e) => setApiUrl(e.target.value)}
                        className="w-full px-3 py-2 bg-[#181a1c] rounded-lg border border-white/10 text-white text-sm focus:border-emerald-500/50 focus:outline-none"
                        placeholder="https://api.example.com/endpoint"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">请求方法 <span className="text-red-400">*</span></label>
                        <select
                          value={apiMethod}
                          onChange={(e) => {
                            const method = e.target.value as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
                            setApiMethod(method as 'GET' | 'POST');
                            if (method === 'GET' || method === 'DELETE') {
                              setBodyType('none');
                            } else if (bodyType === 'none') {
                              setBodyType('json');
                            }
                          }}
                          className="w-full px-3 py-2 bg-[#181a1c] rounded-lg border border-white/10 text-white text-sm focus:border-emerald-500/50 focus:outline-none"
                        >
                          <option value="GET">GET</option>
                          <option value="POST">POST</option>
                          <option value="PUT">PUT</option>
                          <option value="PATCH">PATCH</option>
                          <option value="DELETE">DELETE</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">数据路径 <span className="text-red-400">*</span></label>
                        <input
                          type="text"
                          value={dataPath}
                          onChange={(e) => setDataPath(e.target.value)}
                          className="w-full px-3 py-2 bg-[#181a1c] rounded-lg border border-white/10 text-white text-sm focus:border-emerald-500/50 focus:outline-none"
                          placeholder="data.items"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 请求参数标签 */}
                {apiConfigTab === 'params' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-slate-400">Query 参数</label>
                      <span className="text-xs text-slate-500">自动拼接到 URL</span>
                    </div>
                    <KeyValueEditor
                      items={queryParams}
                      onChange={setQueryParams}
                      keyPlaceholder="参数名"
                      valuePlaceholder="参数值"
                      addButtonText="添加参数"
                    />
                  </div>
                )}

                {/* 请求头标签 */}
                {apiConfigTab === 'headers' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-slate-400">请求头</label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Raw JSON</span>
                        <button
                          onClick={() => {
                            if (!headersRawMode) {
                              const obj: Record<string, string> = {};
                              (headersKeyValue || []).forEach(item => {
                                if (item.key.trim()) obj[item.key] = item.value;
                              });
                              setApiHeaders(JSON.stringify(obj, null, 2));
                            } else {
                              try {
                                const obj = JSON.parse(apiHeaders || '{}');
                                const items = Object.entries(obj).map(([key, value], idx) => ({
                                  id: `h-${idx}-${Date.now()}`,
                                  key,
                                  value: String(value)
                                }));
                                setHeadersKeyValue(items);
                              } catch {
                                setHeadersKeyValue([]);
                              }
                            }
                            setHeadersRawMode(!headersRawMode);
                          }}
                          className={`w-10 h-5 rounded-full transition-colors relative ${
                            headersRawMode ? 'bg-emerald-500' : 'bg-slate-600'
                          }`}
                        >
                          <span className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform ${
                            headersRawMode ? 'left-6' : 'left-1'
                          }`} />
                        </button>
                      </div>
                    </div>
                    {headersRawMode ? (
                      <textarea
                        value={apiHeaders}
                        onChange={(e) => setApiHeaders(e.target.value)}
                        placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                        rows={5}
                        className="w-full px-3 py-2 bg-[#181a1c] rounded-lg border border-white/10 text-white text-sm focus:border-emerald-500/50 focus:outline-none font-mono"
                      />
                    ) : (
                      <KeyValueEditor
                        items={headersKeyValue}
                        onChange={setHeadersKeyValue}
                        keyPlaceholder="Header 名称"
                        valuePlaceholder="Header 值"
                        addButtonText="添加请求头"
                      />
                    )}
                  </div>
                )}

                {/* 请求体标签 */}
                {apiConfigTab === 'body' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-slate-400">请求体类型</label>
                      {(apiMethod === 'GET' || apiMethod === 'DELETE') && (
                        <span className="text-xs text-amber-400">{apiMethod} 请求通常不需要请求体</span>
                      )}
                    </div>
                    <select
                      value={bodyType}
                      onChange={(e) => setBodyType(e.target.value as any)}
                      disabled={apiMethod === 'GET' || apiMethod === 'DELETE'}
                      className="w-full px-3 py-2 bg-[#181a1c] rounded-lg border border-white/10 text-white text-sm focus:border-emerald-500/50 focus:outline-none disabled:opacity-50"
                    >
                      <option value="none">none (无请求体)</option>
                      <option value="json">JSON</option>
                      <option value="form-data">Form Data</option>
                      <option value="x-www-form-urlencoded">x-www-form-urlencoded</option>
                    </select>
                    
                    {bodyType === 'json' && (
                      <textarea
                        value={bodyRawJson}
                        onChange={(e) => setBodyRawJson(e.target.value)}
                        placeholder='{"key": "value"}'
                        rows={5}
                        className="w-full px-3 py-2 bg-[#181a1c] rounded-lg border border-white/10 text-white text-sm focus:border-emerald-500/50 focus:outline-none font-mono"
                      />
                    )}
                    
                    {(bodyType === 'form-data' || bodyType === 'x-www-form-urlencoded') && (
                      <KeyValueEditor
                        items={bodyFormData}
                        onChange={setBodyFormData}
                        keyPlaceholder="字段名"
                        valuePlaceholder="字段值"
                        addButtonText="添加字段"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* 显示配置 - 必填 */}
              <div className="p-4 rounded-xl bg-[#0d0e10] border border-white/5">
                <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                  显示配置 <span className="text-xs text-slate-500 font-normal">(必填)</span>
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">显示方式 <span className="text-red-400">*</span></label>
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
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">标题字段 <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        value={fieldsTitle}
                        onChange={(e) => setFieldsTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-[#181a1c] rounded-lg border border-white/10 text-white text-sm focus:border-emerald-500/50 focus:outline-none"
                        placeholder="title"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">最大条目数 <span className="text-red-400">*</span></label>
                      <input
                        type="number"
                        value={maxItems}
                        onChange={(e) => setMaxItems(parseInt(e.target.value) || 10)}
                        min={1}
                        max={50}
                        className="w-full px-3 py-2 bg-[#181a1c] rounded-lg border border-white/10 text-white text-sm focus:border-emerald-500/50 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 可选参数 - 已移除请求头和请求体配置，移至API配置标签页 */}
              <div className="p-4 rounded-xl bg-[#0d0e10] border border-white/5">
                <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-slate-400" />
                  可选参数 <span className="text-xs text-slate-500 font-normal">(选填)</span>
                </h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">副标题字段</label>
                      <input
                        type="text"
                        value={fieldsSubtitle}
                        onChange={(e) => setFieldsSubtitle(e.target.value)}
                        className="w-full px-3 py-2 bg-[#181a1c] rounded-lg border border-white/10 text-white text-sm focus:border-emerald-500/50 focus:outline-none"
                        placeholder="subtitle"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">数值字段</label>
                      <input
                        type="text"
                        value={fieldsValue}
                        onChange={(e) => setFieldsValue(e.target.value)}
                        className="w-full px-3 py-2 bg-[#181a1c] rounded-lg border border-white/10 text-white text-sm focus:border-emerald-500/50 focus:outline-none"
                        placeholder="value"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">图片字段</label>
                      <input
                        type="text"
                        value={fieldsImage}
                        onChange={(e) => setFieldsImage(e.target.value)}
                        className="w-full px-3 py-2 bg-[#181a1c] rounded-lg border border-white/10 text-white text-sm focus:border-emerald-500/50 focus:outline-none"
                        placeholder="image"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">链接字段</label>
                      <input
                        type="text"
                        value={fieldsLink}
                        onChange={(e) => setFieldsLink(e.target.value)}
                        className="w-full px-3 py-2 bg-[#181a1c] rounded-lg border border-white/10 text-white text-sm focus:border-emerald-500/50 focus:outline-none"
                        placeholder="link"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">刷新间隔(秒)</label>
                      <input
                        type="number"
                        value={refreshInterval}
                        onChange={(e) => setRefreshInterval(parseInt(e.target.value) || 0)}
                        min={0}
                        className="w-full px-3 py-2 bg-[#181a1c] rounded-lg border border-white/10 text-white text-sm focus:border-emerald-500/50 focus:outline-none"
                        placeholder="0为不自动刷新"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">空数据提示</label>
                      <input
                        type="text"
                        value={emptyText}
                        onChange={(e) => setEmptyText(e.target.value)}
                        className="w-full px-3 py-2 bg-[#181a1c] rounded-lg border border-white/10 text-white text-sm focus:border-emerald-500/50 focus:outline-none"
                        placeholder="暂无数据"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 错误提示 */}
            {addError && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {addError}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="mt-6 flex gap-3">
              <button 
                onClick={() => {
                  setShowAPIConfigModal(false);
                  setSelectedPreset(null);
                  handleCloseModal();
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 transition-colors text-sm"
              >
                取消
              </button>
              <button 
                onClick={() => {
                  // 验证必填参数
                  if (!newWidgetTitle.trim()) {
                    setAddError('请输入组件名称');
                    return;
                  }
                  if (!apiUrl.trim()) {
                    setAddError('请输入API URL');
                    return;
                  }
                  if (!dataPath.trim()) {
                    setAddError('请输入数据路径');
                    return;
                  }
                  if (!fieldsTitle.trim()) {
                    setAddError('请输入标题字段');
                    return;
                  }

                  // 构建headers
                  let parsedHeaders: Record<string, string> = {};
                  if (headersRawMode) {
                    if (apiHeaders.trim()) {
                      try {
                        parsedHeaders = JSON.parse(apiHeaders);
                      } catch {
                        setAddError('请求头JSON格式错误');
                        return;
                      }
                    }
                  } else {
                    headersKeyValue.forEach(item => {
                      if (item.key.trim()) {
                        parsedHeaders[item.key.trim()] = item.value;
                      }
                    });
                  }

                  // 构建请求体
                  let parsedBody: any = undefined;
                  if (bodyType !== 'none' && apiMethod !== 'GET' && apiMethod !== 'DELETE') {
                    if (bodyType === 'json') {
                      if (bodyRawJson.trim()) {
                        try {
                          parsedBody = JSON.parse(bodyRawJson);
                        } catch {
                          setAddError('请求体JSON格式错误');
                          return;
                        }
                      }
                    } else if (bodyType === 'form-data' || bodyType === 'x-www-form-urlencoded') {
                      const formDataObj: Record<string, string> = {};
                      bodyFormData.forEach(item => {
                        if (item.key.trim()) {
                          formDataObj[item.key.trim()] = item.value;
                        }
                      });
                      parsedBody = formDataObj;
                    }
                  }
                  
                  // 构建带Query参数的URL
                  let finalUrl = apiUrl.trim();
                  const validParams = queryParams.filter(p => p.key.trim());
                  if (validParams.length > 0) {
                    try {
                      const urlObj = new URL(finalUrl);
                      validParams.forEach(param => {
                        urlObj.searchParams.set(param.key.trim(), param.value);
                      });
                      finalUrl = urlObj.toString();
                    } catch {
                      // URL无效，使用原始URL
                    }
                  }

                  // 创建API配置
                  const apiConfig: APIDataConfig = {
                    id: selectedPreset.config.id,
                    name: newWidgetTitle,
                    apiUrl: finalUrl,
                    method: apiMethod,
                    headers: Object.keys(parsedHeaders).length > 0 ? parsedHeaders : undefined,
                    body: parsedBody,
                    refreshInterval: refreshInterval,
                    dataPath: dataPath,
                    displayType: displayType as any,
                    fields: {
                      title: fieldsTitle,
                      value: fieldsValue || undefined,
                      subtitle: fieldsSubtitle || undefined,
                      image: fieldsImage || undefined,
                      link: fieldsLink || undefined
                    },
                    maxItems: maxItems,
                    emptyText: emptyText || '暂无数据'
                  };

                  // 创建组件
                  const widget = createAPIWidget(apiConfig);
                  addWidget(widget);

                  // 关闭弹窗
                  setShowAPIConfigModal(false);
                  setSelectedPreset(null);
                  handleCloseModal();
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 text-[#0d0e10] hover:bg-emerald-400 transition-colors text-sm font-medium"
              >
                添加组件
              </button>
            </div>
          </div>
        </div>
      )}
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
