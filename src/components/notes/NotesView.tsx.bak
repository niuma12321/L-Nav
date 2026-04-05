import React from 'react';
import { StickyNote } from '../../types';
import { Plus, FileText } from 'lucide-react';
import StickyNoteCard from './StickyNoteCard';

interface NotesViewProps {
  notes: StickyNote[];
  onAddNote: () => void;
  onUpdateNote: (id: string, content: string) => void;
  onDeleteNote: (id: string) => void;
}

const NotesView: React.FC<NotesViewProps> = ({
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
}) => {
  const isEmpty = notes.length === 0;

  return (
    <div className="w-full">
      {/* 头部工具栏 */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl
            bg-emerald-50 dark:bg-emerald-900/20
            border border-emerald-200/50 dark:border-emerald-700/30
            text-emerald-600 dark:text-emerald-400">
            <FileText size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              我的便签
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {notes.length} 条便签
            </p>
          </div>
        </div>

        <button
          onClick={onAddNote}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl
            bg-emerald-500 hover:bg-emerald-600
            text-white font-medium text-sm
            shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/30
            transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
        >
          <Plus size={18} />
          <span>新建便签</span>
        </button>
      </div>

      {/* 空状态 */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6
            bg-slate-100 dark:bg-slate-800/50
            border border-slate-200 dark:border-slate-700">
            <FileText size={40} className="text-slate-300 dark:text-slate-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">
            还没有便签
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-sm mb-6">
            点击上方的「新建便签」按钮，开始记录你的想法、待办事项或重要信息
          </p>
          <button
            onClick={onAddNote}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl
              bg-emerald-500 hover:bg-emerald-600
              text-white font-medium text-sm
              shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/30
              transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
          >
            <Plus size={18} />
            <span>创建第一条便签</span>
          </button>
        </div>
      ) : (
        /* 便签网格 */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {notes.map((note) => (
            <StickyNoteCard
              key={note.id}
              note={note}
              onUpdate={onUpdateNote}
              onDelete={onDeleteNote}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default NotesView;
