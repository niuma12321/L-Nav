import React, { useState, useEffect } from 'react';
import { Plus, LayoutGrid, List, Trash2, MoreHorizontal, Pin } from 'lucide-react';
import { StickyNote } from '../../../types';

interface NotesWidgetProps {
  className?: string;
  notes: StickyNote[];
  onAddNote: (note: Partial<StickyNote>) => void;
  onUpdateNote: (id: string, note: Partial<StickyNote>) => void;
  onDeleteNote: (id: string) => void;
}

type ViewMode = 'masonry' | 'list';

const NotesWidget: React.FC<NotesWidgetProps> = ({
  className = '',
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('masonry');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');

  const handleAddNote = () => {
    if (!newNoteTitle.trim() && !newNoteContent.trim()) return;
    
    onAddNote({
      title: newNoteTitle.trim() || '无标题',
      content: newNoteContent.trim(),
      htmlContent: `<p>${newNoteContent.trim()}</p>`,
      color: '#181a1c',
      pinned: false,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    
    setNewNoteTitle('');
    setNewNoteContent('');
    setShowAddForm(false);
  };

  const togglePin = (note: StickyNote) => {
    onUpdateNote(note.id, { pinned: !note.pinned });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const sortedNotes = [...notes].sort((a, b) => {
    // Pinned notes first
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    // Then by updated time
    return (b.updatedAt || 0) - (a.updatedAt || 0);
  }).slice(0, 6);

  const noteColors = [
    '#181a1c', // default
    '#1e3a5f', // blue
    '#3d2817', // brown
    '#1a4731', // green
    '#4a1c40', // purple
  ];

  return (
    <div className={`v3-card p-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">个人便签</h3>
          <p className="text-xs text-slate-500 mt-1">{notes.length} 个便签</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setViewMode('masonry')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'masonry' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={() => setShowAddForm(true)}
            className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Add Note Form */}
      {showAddForm && (
        <div className="mb-4 p-4 rounded-xl bg-white/5">
          <input
            type="text"
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            placeholder="便签标题..."
            className="w-full mb-2 px-3 py-2 bg-transparent text-white text-sm font-medium placeholder-slate-500 outline-none"
          />
          <textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="输入内容..."
            rows={3}
            className="w-full px-3 py-2 bg-transparent text-slate-300 text-sm placeholder-slate-500 outline-none resize-none"
          />
          <div className="flex items-center justify-end gap-2 mt-2">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-white transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleAddNote}
              className="px-4 py-1.5 rounded-lg text-xs bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
            >
              添加
            </button>
          </div>
        </div>
      )}

      {/* Notes Grid/List */}
      <div className={viewMode === 'masonry' 
        ? 'grid grid-cols-2 gap-3' 
        : 'space-y-2'
      }>
        {sortedNotes.length === 0 ? (
          <div className={`text-center py-8 text-slate-500 text-sm ${viewMode === 'masonry' ? 'col-span-2' : ''}`}>
            <p>暂无便签</p>
            <p className="text-xs mt-1">点击 + 添加第一个便签</p>
          </div>
        ) : (
          sortedNotes.map((note) => (
            <div
              key={note.id}
              className={`group relative p-4 rounded-xl transition-all hover:scale-[1.02] active:scale-95 ${
                viewMode === 'list' ? 'flex items-center gap-3' : ''
              }`}
              style={{ backgroundColor: note.color || '#181a1c' }}
            >
              {/* Pin indicator */}
              {note.pinned && (
                <div className="absolute top-2 right-2">
                  <Pin className="w-3 h-3 text-emerald-400 fill-current" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                {note.title && (
                  <h4 className={`font-medium text-white mb-1 ${viewMode === 'list' ? 'text-sm truncate' : ''}`}>
                    {note.title}
                  </h4>
                )}
                <p className={`text-slate-400 text-xs ${viewMode === 'masonry' ? 'line-clamp-4' : 'truncate'}`}>
                  {note.htmlContent 
                    ? note.htmlContent.replace(/<[^>]*>/g, '').substring(0, 100)
                    : note.content?.substring(0, 100)
                  }
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-slate-500">{formatDate(note.updatedAt || note.createdAt || Date.now())}</span>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => togglePin(note)}
                      className="p-1 rounded-lg text-slate-500 hover:text-emerald-400"
                    >
                      <Pin className={`w-3 h-3 ${note.pinned ? 'fill-current text-emerald-400' : ''}`} />
                    </button>
                    <button
                      onClick={() => onDeleteNote(note.id)}
                      className="p-1 rounded-lg text-slate-500 hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotesWidget;
