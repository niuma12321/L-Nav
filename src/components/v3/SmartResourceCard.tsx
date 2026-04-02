import React, { useState, useCallback } from 'react';
import { Plus, Link2, Type, AlignLeft, Loader2, Image, Globe, Sparkles } from 'lucide-react';
import { LinkItem, Category } from '../../types';

interface SmartResourceCardProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (link: Partial<LinkItem>) => void;
  categories: Category[];
  editingLink?: LinkItem | null;
}

// URL Metadata fetcher simulation
const fetchUrlMetadata = async (url: string): Promise<{
  title: string;
  description: string;
  icon: string;
  image?: string;
}> => {
  // Simulate API call with timeout
  return new Promise((resolve) => {
    setTimeout(() => {
      // Try to extract domain info
      try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname.replace(/^www\./, '');
        const name = domain.split('.')[0];
        
        resolve({
          title: `${name.charAt(0).toUpperCase() + name.slice(1)} - 自动抓取`,
          description: `来自 ${domain} 的资源`,
          icon: domain.charAt(0).toUpperCase(),
        });
      } catch {
        resolve({
          title: '未命名资源',
          description: '',
          icon: '🔗',
        });
      }
    }, 1500);
  });
};

const iconColors = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e'
];

const SmartResourceCard: React.FC<SmartResourceCardProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  editingLink
}) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [iconColor, setIconColor] = useState(iconColors[0]);
  const [isAutoFetch, setIsAutoFetch] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Reset form when opening
  React.useEffect(() => {
    if (isOpen) {
      if (editingLink) {
        setUrl(editingLink.url);
        setTitle(editingLink.title);
        setDescription(editingLink.description || '');
        setSelectedCategory(editingLink.categoryId || categories[0]?.id || '');
        setIconColor(editingLink.iconColor || iconColors[0]);
        setIsAutoFetch(false);
      } else {
        setUrl('');
        setTitle('');
        setDescription('');
        setSelectedCategory(categories[0]?.id || '');
        setIconColor(iconColors[0]);
        setIsAutoFetch(true);
      }
    }
  }, [isOpen, editingLink, categories]);

  const handleAutoFetch = useCallback(async () => {
    if (!url || !isAutoFetch) return;
    
    setIsFetching(true);
    try {
      const metadata = await fetchUrlMetadata(url);
      if (!title) setTitle(metadata.title);
      if (!description) setDescription(metadata.description);
    } catch (error) {
      console.error('Failed to fetch metadata:', error);
    } finally {
      setIsFetching(false);
    }
  }, [url, isAutoFetch, title, description]);

  const handleSave = () => {
    if (!url.trim() || !title.trim()) return;
    
    onSave({
      id: editingLink?.id,
      url: url.trim(),
      title: title.trim(),
      description: description.trim(),
      categoryId: selectedCategory,
      iconColor,
      icon: title.charAt(0).toUpperCase(),
    });
    
    onClose();
  };

  if (!isOpen) return null;

  const isEditing = !!editingLink;

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Card */}
      <div className="relative w-full sm:w-[480px] max-h-[90vh] sm:max-h-[85vh] 
                      bg-[#181a1c] sm:rounded-3xl rounded-t-3xl overflow-hidden
                      shadow-2xl border border-white/5 animate-in slide-in-from-bottom-4">
        {/* Drag Handle (Mobile) */}
        <div className="w-full pt-3 pb-2 flex justify-center sm:hidden">
          <div className="w-12 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              {isEditing ? '编辑资源' : '添加资源'}
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              {isEditing ? '更新资源信息' : '自动抓取链接元数据'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* URL Input with Auto-fetch */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                链接地址
              </label>
              {!isEditing && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-emerald-400">自动抓取</span>
                  <button
                    onClick={() => setIsAutoFetch(!isAutoFetch)}
                    className={`w-10 h-5 rounded-full transition-colors ${
                      isAutoFetch ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      isAutoFetch ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              )}
            </div>
            <div className="relative">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={handleAutoFetch}
                placeholder="https://..."
                disabled={isEditing}
                className="w-full px-4 py-3 bg-[#0d0e10] rounded-xl text-white placeholder-slate-500 
                         border border-white/10 focus:border-emerald-500/50 outline-none
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              />
              {isFetching && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400 animate-spin" />
              )}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Type className="w-4 h-4" />
              资源名称
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入资源名称..."
              className="w-full px-4 py-3 bg-[#0d0e10] rounded-xl text-white placeholder-slate-500 
                       border border-white/10 focus:border-emerald-500/50 outline-none transition-colors"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              所属分类
            </label>
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-[#0d0e10] text-slate-400 border border-white/10 hover:border-white/20'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Icon Color Picker */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              图标颜色
            </label>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg cursor-pointer
                         border-2 border-white/10 hover:border-emerald-500/50 transition-colors"
                style={{ backgroundColor: iconColor }}
                onClick={() => setShowColorPicker(!showColorPicker)}
              >
                {title.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="flex gap-2 flex-wrap">
                {iconColors.slice(0, 6).map((color) => (
                  <button
                    key={color}
                    onClick={() => setIconColor(color)}
                    className={`w-8 h-8 rounded-lg transition-transform hover:scale-110 ${
                      iconColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#181a1c]' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <AlignLeft className="w-4 h-4" />
              资源描述（可选）
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="添加描述帮助记忆..."
              rows={3}
              className="w-full px-4 py-3 bg-[#0d0e10] rounded-xl text-white placeholder-slate-500 
                       border border-white/10 focus:border-emerald-500/50 outline-none resize-none transition-colors"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-[#0d0e10]/50">
          <button
            onClick={handleSave}
            disabled={!url.trim() || !title.trim()}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 
                     text-white font-semibold shadow-lg shadow-emerald-500/20
                     disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed
                     transition-all active:scale-[0.98] hover:shadow-emerald-500/30
                     flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {isEditing ? '保存更改' : '添加资源'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartResourceCard;
