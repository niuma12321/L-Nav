import React, { useState, useEffect } from 'react';
import { X, Pin, FolderOpen, Share2, Trash2, Check, ChevronRight } from '@/utils/icons';
import { LinkItem, Category } from '../../types';

interface MobileBulkEditProps {
  isOpen: boolean;
  onClose: () => void;
  links: LinkItem[];
  categories: Category[];
  onPin: (ids: string[]) => void;
  onMove: (ids: string[], categoryId: string) => void;
  onDelete: (ids: string[]) => void;
  onShare?: (ids: string[]) => void;
}

const MobileBulkEdit: React.FC<MobileBulkEditProps> = ({
  isOpen,
  onClose,
  links,
  categories,
  onPin,
  onMove,
  onDelete,
  onShare
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedIds([]);
      setSelectAll(false);
    }
  }, [isOpen]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(links.map(l => l.id));
    }
    setSelectAll(!selectAll);
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return 'UNCATEGORIZED';
    const cat = categories.find(c => c.id === categoryId);
    return cat?.name?.toUpperCase() || 'UNCATEGORIZED';
  };

  const getCategoryColor = (categoryId?: string) => {
    const colors: Record<string, string> = {
      'design': '#34d399',
      'system': '#60a5fa',
      'content': '#f472b6',
      'docs': '#a78bfa',
      'dev': '#fbbf24',
    };
    return colors[categoryId || ''] || '#64748b';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#0d0e10]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0d0e10]/95 backdrop-blur-xl border-b border-white/5 px-4 py-4">
        <div className="flex items-center justify-between mb-2">
          <button onClick={onClose} className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-white">
            {selectedIds.length} item{selectedIds.length !== 1 ? 's' : ''} selected
          </h1>
          <button 
            onClick={toggleSelectAll}
            className="text-sm font-medium text-emerald-400"
          >
            {selectAll ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      </div>

      {/* Link List */}
      <div className="px-4 pb-40 space-y-3 pt-4">
        {links.map((link) => {
          const isSelected = selectedIds.includes(link.id);
          return (
            <div
              key={link.id}
              onClick={() => toggleSelect(link.id)}
              className={`
                flex items-center gap-4 p-4 rounded-2xl border cursor-pointer
                transition-all duration-200 active:scale-[0.98]
                ${isSelected 
                  ? 'bg-emerald-500/10 border-emerald-500/30' 
                  : 'bg-[#1e2127] border-white/5'
                }
              `}
            >
              {/* Checkbox */}
              <div className={`
                w-6 h-6 rounded-lg flex items-center justify-center border-2
                ${isSelected 
                  ? 'bg-emerald-500 border-emerald-500' 
                  : 'border-slate-600'
                }
              `}>
                {isSelected && <Check className="w-4 h-4 text-white" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={`font-medium truncate ${isSelected ? 'text-emerald-100' : 'text-white'}`}>
                    {link.title}
                  </h3>
                  <span 
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                    style={{ 
                      backgroundColor: `${getCategoryColor(link.categoryId)}20`,
                      color: getCategoryColor(link.categoryId)
                    }}
                  >
                    {getCategoryName(link.categoryId)}
                  </span>
                </div>
                <p className={`text-sm truncate mt-0.5 ${isSelected ? 'text-emerald-300/70' : 'text-slate-400'}`}>
                  {link.url}
                </p>
              </div>

              {/* Time */}
              <span className={`text-xs ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`}>
                {formatTimeAgo(Date.now())}
              </span>
            </div>
          );
        })}
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#15171a]/95 backdrop-blur-xl border-t border-white/5 p-4 pb-safe">
        <div className="grid grid-cols-4 gap-3">
          <button
            onClick={() => onPin(selectedIds)}
            disabled={selectedIds.length === 0}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/5 disabled:opacity-30 transition-colors"
          >
            <Pin className="w-5 h-5 text-emerald-400" />
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Pin</span>
          </button>

          <button
            onClick={() => setShowMoveMenu(true)}
            disabled={selectedIds.length === 0}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/5 disabled:opacity-30 transition-colors"
          >
            <FolderOpen className="w-5 h-5 text-emerald-400" />
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Move</span>
          </button>

          {onShare && (
            <button
              onClick={() => onShare(selectedIds)}
              disabled={selectedIds.length === 0}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/5 disabled:opacity-30 transition-colors"
            >
              <Share2 className="w-5 h-5 text-emerald-400" />
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Share</span>
            </button>
          )}

          <button
            onClick={() => {
              onDelete(selectedIds);
              onClose();
            }}
            disabled={selectedIds.length === 0}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-red-500/20 disabled:opacity-30 transition-colors"
          >
            <Trash2 className="w-5 h-5 text-red-400" />
            <span className="text-[10px] font-medium text-red-400 uppercase tracking-wider">Delete</span>
          </button>
        </div>
      </div>

      {/* Move Category Modal */}
      {showMoveMenu && (
        <div className="fixed inset-0 z-[110] bg-black/60 flex items-end">
          <div className="w-full bg-[#1e2127] rounded-t-3xl p-6 animate-in slide-in-from-bottom">
            <h3 className="text-lg font-bold text-white mb-4">Move to Category</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    onMove(selectedIds, cat.id);
                    setShowMoveMenu(false);
                  }}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-[#252a32] text-white hover:bg-[#2d333d] transition-colors"
                >
                  <span>{cat.name}</span>
                  <ChevronRight className="w-5 h-5 text-slate-500" />
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowMoveMenu(false)}
              className="w-full mt-4 py-3 rounded-xl bg-white/5 text-slate-400 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileBulkEdit;
