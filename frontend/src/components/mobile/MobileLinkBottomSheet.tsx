import React, { useState, useEffect } from 'react';
import { X, Link2, Type, AlignLeft, Grid3X3, Check, Loader2, Globe } from 'lucide-react';
import { LinkItem, Category } from '../../types';

interface MobileLinkBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (link: Partial<LinkItem>) => void;
  categories: Category[];
  editingLink?: LinkItem | null;
}

const iconOptions = [
  { id: 'layout', icon: Grid3X3, label: 'Dashboard' },
  { id: 'folder', icon: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-4-4H5a2 2 0 00-2 2z" /></svg>, label: 'Folder' },
  { id: 'globe', icon: Globe, label: 'Website' },
  { id: 'star', icon: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>, label: 'Favorite' },
  { id: 'rocket', icon: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>, label: 'Quick' },
  { id: 'zap', icon: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>, label: 'Flash' },
  { id: 'message', icon: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>, label: 'Chat' },
  { id: 'chart', icon: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>, label: 'Analytics' },
];

const MobileLinkBottomSheet: React.FC<MobileLinkBottomSheetProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  editingLink
}) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('layout');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isAutoFetch, setIsAutoFetch] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (editingLink) {
      setUrl(editingLink.url);
      setTitle(editingLink.title);
      setDescription(editingLink.description || '');
      setSelectedIcon(editingLink.icon || 'layout');
      setSelectedCategory(editingLink.categoryId || categories[0]?.id || '');
    } else {
      setUrl('');
      setTitle('');
      setDescription('');
      setSelectedIcon('layout');
      setSelectedCategory(categories[0]?.id || '');
    }
  }, [editingLink, categories, isOpen]);

  const handleAutoFetch = async () => {
    if (!url || !isAutoFetch) return;
    setIsFetching(true);
    // Simulate API call
    setTimeout(() => {
      if (!title) setTitle('Auto-fetched Title');
      if (!description) setDescription('Auto-fetched description from URL metadata...');
      setIsFetching(false);
    }, 1500);
  };

  const handleSave = () => {
    if (!url.trim() || !title.trim()) return;
    onSave({
      id: editingLink?.id,
      url: url.trim(),
      title: title.trim(),
      description: description.trim(),
      icon: selectedIcon,
      categoryId: selectedCategory,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-[#0d0e10] rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom">
        {/* Handle */}
        <div className="w-full pt-3 pb-2 flex justify-center">
          <div className="w-12 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="px-5 pb-4 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {editingLink ? 'Edit Link' : 'Add New Link'}
              </h2>
              <p className="text-sm text-slate-400 mt-1">Organize your digital workspace</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-[#1e2127] text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* URL Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Destination URL</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-400 font-medium">Auto-Fetch Meta</span>
                <button
                  onClick={() => setIsAutoFetch(!isAutoFetch)}
                  className={`w-10 h-6 rounded-full transition-colors ${isAutoFetch ? 'bg-emerald-500' : 'bg-slate-700'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isAutoFetch ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
            <div className="relative">
              <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={handleAutoFetch}
                placeholder="https://..."
                className="w-full pl-12 pr-4 py-3.5 bg-[#1e2127] rounded-2xl text-white placeholder-slate-500 border border-white/5 focus:border-emerald-500/50 outline-none"
              />
              {isFetching && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400 animate-spin" />
              )}
            </div>
          </div>

          {/* Title Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Link Title</label>
            <div className="relative">
              <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Design Inspiration Portfolio"
                className="w-full pl-12 pr-4 py-3.5 bg-[#1e2127] rounded-2xl text-white placeholder-slate-500 border border-white/5 focus:border-emerald-500/50 outline-none"
              />
            </div>
          </div>

          {/* Icon Selection */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Choose Icon</label>
            <div className="grid grid-cols-4 gap-3">
              {iconOptions.map((opt) => {
                const IconComponent = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedIcon(opt.id)}
                    className={`
                      aspect-square rounded-2xl flex flex-col items-center justify-center gap-1
                      transition-all duration-200 active:scale-95
                      ${selectedIcon === opt.id 
                        ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/50' 
                        : 'bg-[#1e2127] text-slate-400 border border-white/5 hover:border-white/20'
                      }
                    `}
                  >
                    <IconComponent className="w-6 h-6" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Selection */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</label>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`
                    flex-shrink-0 px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap
                    transition-all duration-200
                    ${selectedCategory === cat.id
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-[#1e2127] text-slate-400 border border-white/5'
                    }
                  `}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Short Description</label>
            <div className="relative">
              <AlignLeft className="absolute left-4 top-4 w-5 h-5 text-slate-500" />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe what this link is for..."
                rows={3}
                className="w-full pl-12 pr-4 py-3.5 bg-[#1e2127] rounded-2xl text-white placeholder-slate-500 border border-white/5 focus:border-emerald-500/50 outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-white/5 bg-[#0d0e10]">
          <button
            onClick={handleSave}
            disabled={!url.trim() || !title.trim()}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold text-lg shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
          >
            {editingLink ? 'Save Changes' : 'Add Link'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileLinkBottomSheet;
