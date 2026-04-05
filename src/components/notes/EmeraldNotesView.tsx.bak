import React from 'react';
import { Plus, Filter, ArrowUpRight, Clock, Tag, MoreHorizontal, Pin, Archive } from 'lucide-react';
import { StickyNote } from '../../types';

interface NotesViewProps {
  notes: StickyNote[];
  onAddNote: () => void;
  onEditNote: (note: StickyNote) => void;
  onPinNote: (id: string) => void;
  onArchiveNote: (id: string) => void;
  onDeleteNote: (id: string) => void;
  filter?: 'all' | 'pinned' | 'archived';
  onFilterChange?: (filter: 'all' | 'pinned' | 'archived') => void;
  searchQuery?: string;
}

const formatTimeAgo = (timestamp: number) => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return new Date(timestamp).toLocaleDateString();
};

const NotesView: React.FC<NotesViewProps> = ({
  notes,
  onAddNote,
  onEditNote,
  onPinNote,
  onArchiveNote,
  onDeleteNote,
  filter = 'all',
  onFilterChange,
  searchQuery = ''
}) => {
  const filteredNotes = notes.filter(note => {
    if (filter === 'pinned') return note.pinned;
    if (filter === 'archived') return note.archived;
    return !note.archived;
  }).filter(note => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      note.title?.toLowerCase().includes(query) ||
      note.content?.toLowerCase().includes(query) ||
      note.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  });

  const pinnedNotes = filteredNotes.filter(n => n.pinned);
  const otherNotes = filteredNotes.filter(n => !n.pinned);

  const renderNoteCard = (note: StickyNote, isPinned = false) => (
    <div
      key={note.id}
      onClick={() => onEditNote(note)}
      className={`
        group relative p-5 rounded-2xl cursor-pointer
        transition-all duration-200 active:scale-95
        ${isPinned 
          ? 'bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20' 
          : 'bg-[#1e2127] border border-white/5 hover:border-white/10'
        }
        hover:shadow-lg hover:shadow-black/20
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {note.tags?.map((tag, idx) => (
            <span 
              key={idx}
              className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-medium text-slate-400 uppercase tracking-wider"
            >
              {tag}
            </span>
          ))}
          {!note.tags?.length && (
            <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
              {note.category || 'NOTE'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPinNote(note.id);
            }}
            className={`p-1.5 rounded-lg transition-colors ${note.pinned ? 'text-emerald-400' : 'text-slate-500 hover:text-emerald-400'}`}
          >
            <Pin className={`w-4 h-4 ${note.pinned ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onArchiveNote(note.id);
            }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300"
          >
            <Archive className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Title */}
      {note.title && (
        <h3 className="text-base font-semibold text-white mb-2 line-clamp-2">
          {note.title}
        </h3>
      )}

      {/* Content Preview */}
      <p className="text-sm text-slate-400 line-clamp-4 mb-4 leading-relaxed">
        {note.htmlContent 
          ? note.htmlContent.replace(/<[^>]*>/g, '').substring(0, 200)
          : note.content?.substring(0, 200)
        }
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock className="w-3 h-3" />
          <span>{formatTimeAgo(note.updatedAt)}</span>
        </div>
        {note.attachments && note.attachments > 0 && (
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span>{note.attachments} attached</span>
          </div>
        )}
      </div>

      {/* Hover Action */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="p-2 rounded-lg bg-[#0d0e10]/80 backdrop-blur">
          <ArrowUpRight className="w-4 h-4 text-emerald-400" />
        </div>
      </div>
    </div>
  );

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
        <div className="w-32 h-32 rounded-3xl bg-[#1e2127] flex items-center justify-center mb-6 shadow-2xl">
          <div className="w-24 h-24 rounded-2xl bg-[#252a32] flex items-center justify-center">
            <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">开启你的第一条便签</h2>
        <p className="text-slate-400 text-center max-w-md mb-8">
          记录灵感、待办事项或突发奇想。所有的思考都在这里安全存储。
        </p>
        <button
          onClick={onAddNote}
          className="flex items-center gap-2 px-6 py-3 bg-[#1e2127] hover:bg-[#252a32] text-white rounded-full font-medium transition-all duration-200 active:scale-95"
        >
          <Plus className="w-5 h-5 text-emerald-400" />
          <span>创建第一条便签</span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">我的便签</h1>
          <p className="text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block mr-2" />
            {notes.length} Notes {filter !== 'all' && `• ${filter}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onFilterChange?.('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === 'all' ? 'bg-[#1e2127] text-white' : 'text-slate-400 hover:text-white'}`}
          >
            All
          </button>
          <button
            onClick={() => onFilterChange?.('pinned')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === 'pinned' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'}`}
          >
            <Pin className="w-4 h-4 inline mr-1" />
            Pinned
          </button>
          <button
            onClick={onAddNote}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-200 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New Note
          </button>
        </div>
      </div>

      {/* Pinned Section */}
      {pinnedNotes.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Pinned</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {pinnedNotes.map(note => renderNoteCard(note, true))}
          </div>
        </div>
      )}

      {/* Other Notes */}
      {otherNotes.length > 0 && (
        <div>
          {pinnedNotes.length > 0 && (
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Other Notes</h3>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {otherNotes.map(note => renderNoteCard(note))}
          </div>
        </div>
      )}

      {/* Empty Filter State */}
      {filteredNotes.length === 0 && notes.length > 0 && (
        <div className="text-center py-20">
          <p className="text-slate-500">No notes found for this filter</p>
        </div>
      )}
    </div>
  );
};

export default NotesView;
