import React, { useState } from 'react';
import { X, Save, ExternalLink } from '@/utils/icons';
import { WidgetConfig, IframeWidgetSettings } from '../../types/widgets';

interface IframeWidgetSettingsProps {
  widget: WidgetConfig;
  onClose: () => void;
  onSave: (settings: Partial<IframeWidgetSettings>) => void;
}

export const IframeWidgetSettingsModal: React.FC<IframeWidgetSettingsProps> = ({ 
  widget, 
  onClose, 
  onSave 
}) => {
  const [form, setForm] = useState<IframeWidgetSettings>({
    url: widget.settings?.url || '',
    width: widget.settings?.width || '100%',
    height: widget.settings?.height || '300px',
    allowScroll: widget.settings?.allowScroll !== false,
    showBorder: widget.settings?.showBorder !== false,
    showHeader: widget.settings?.showHeader !== false
  });

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#181a1c] rounded-2xl border border-white/10 w-full max-w-md p-6 shadow-2xl my-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">配置内嵌组件</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* URL 输入 */}
          <div>
            <label className="block text-xs text-slate-500 mb-2">
              内嵌 URL <span className="text-red-400">*</span>
            </label>
            <input 
              type="url"
              className="w-full px-3 py-2 bg-[#0d0e10] rounded-lg border border-white/5 text-white text-sm focus:border-emerald-500/50 focus:outline-none"
              placeholder="https://example.com"
              value={form.url}
              onChange={e => setForm({ ...form, url: e.target.value })}
            />
          </div>

          {/* 尺寸设置 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-2">宽度</label>
              <input 
                className="w-full px-3 py-2 bg-[#0d0e10] rounded-lg border border-white/5 text-white text-sm focus:border-emerald-500/50 focus:outline-none"
                placeholder="100%"
                value={form.width}
                onChange={e => setForm({ ...form, width: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-2">高度</label>
              <input 
                className="w-full px-3 py-2 bg-[#0d0e10] rounded-lg border border-white/5 text-white text-sm focus:border-emerald-500/50 focus:outline-none"
                placeholder="300px"
                value={form.height}
                onChange={e => setForm({ ...form, height: e.target.value })}
              />
            </div>
          </div>

          {/* 选项开关 */}
          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer">
              <input 
                type="checkbox" 
                checked={form.allowScroll}
                onChange={e => setForm({ ...form, allowScroll: e.target.checked })}
                className="w-4 h-4 rounded border-slate-600 bg-[#0d0e10] text-emerald-500 focus:ring-emerald-500/20 focus:ring-2"
              />
              允许滚动
            </label>
            <label className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer">
              <input 
                type="checkbox" 
                checked={form.showBorder}
                onChange={e => setForm({ ...form, showBorder: e.target.checked })}
                className="w-4 h-4 rounded border-slate-600 bg-[#0d0e10] text-emerald-500 focus:ring-emerald-500/20 focus:ring-2"
              />
              显示边框
            </label>
            <label className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer">
              <input 
                type="checkbox" 
                checked={form.showHeader}
                onChange={e => setForm({ ...form, showHeader: e.target.checked })}
                className="w-4 h-4 rounded border-slate-600 bg-[#0d0e10] text-emerald-500 focus:ring-emerald-500/20 focus:ring-2"
              />
              显示标题栏
            </label>
          </div>

          {/* 提示信息 */}
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-xs text-blue-400 flex items-start gap-2">
              <ExternalLink className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              注意：部分网站可能因安全策略限制无法内嵌显示
            </p>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-white/5">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 transition-colors text-sm"
          >
            取消
          </button>
          <button 
            onClick={handleSave}
            className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 text-[#0d0e10] font-medium hover:bg-emerald-400 transition-colors text-sm flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default IframeWidgetSettingsModal;
