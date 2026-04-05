import React, { useState, useEffect } from 'react';
import { Plus, X, Pin, StickyNote } from '@/utils/icons';

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  createdAt: number;
}

const COLORS = [
  { name: 'yellow', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-200' },
  { name: 'blue', bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-200' },
  { name: 'green', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', text: 'text-emerald-200' },
  { name: 'purple', bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-200' },
  { name: 'pink', bg: 'bg-pink-500/20', border: 'border-pink-500/30', text: 'text-pink-200' },
  { name: 'orange', bg: 'bg-orange-500/20', border: 'border-orange-500/30', text: 'text-orange-200' },
];

const LabView: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [showAddForm, setShowAddForm] = useState(false);

  // Load notes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('lab-notes');
    if (saved) {
      try {
        setNotes(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load notes:', e);
      }
    }
  }, []);

  // Save notes to localStorage
  useEffect(() => {
    localStorage.setItem('lab-notes', JSON.stringify(notes));
  }, [notes]);

  const addNote = () => {
    if (!newNoteTitle.trim() && !newNoteContent.trim()) return;
    
    const note: Note = {
      id: Date.now().toString(),
      title: newNoteTitle.trim() || '无标题',
      content: newNoteContent,
      color: selectedColor.name,
      pinned: false,
      createdAt: Date.now(),
    };
    
    setNotes([note, ...notes]);
    setNewNoteTitle('');
    setNewNoteContent('');
    setShowAddForm(false);
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  const togglePin = (id: string) => {
    setNotes(notes.map(n => 
      n.id === id ? { ...n, pinned: !n.pinned } : n
    ).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)));
  };

  const getColorClasses = (colorName: string) => {
    return COLORS.find(c => c.name === colorName) || COLORS[0];
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header - 响应式优化 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 lg:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">创意实验室</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            记录灵感、整理思路、管理创意便签。
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-[#0d0e10] font-medium hover:bg-emerald-400 transition-colors w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">新建便签</span>
        </button>
      </div>

      {/* Add Note Form - 响应式优化 */}
      {showAddForm && (
        <div className="mb-6 p-4 rounded-2xl bg-[#181a1c] border border-white/10">
          <div className="space-y-3">
            <input
              type="text"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              placeholder="便签标题..."
              className="w-full px-4 py-2 bg-[#0d0e10] rounded-xl border border-white/5 focus:border-emerald-500/50 focus:outline-none text-white placeholder:text-slate-500 text-sm"
            />
            <textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="写下你的想法..."
              rows={3}
              className="w-full px-4 py-2 bg-[#0d0e10] rounded-xl border border-white/5 focus:border-emerald-500/50 focus:outline-none text-white placeholder:text-slate-500 resize-none text-sm"
            />
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-2">
              <div className="flex items-center gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color)}
                    className={`w-6 h-6 rounded-full ${color.bg} border-2 ${selectedColor.name === color.name ? color.border : 'border-transparent'}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 sm:flex-none px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={addNote}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-500 text-[#0d0e10] text-sm font-medium hover:bg-emerald-400 transition-colors"
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notes Grid */}
      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <div className="w-20 h-20 rounded-full bg-[#181a1c] flex items-center justify-center mb-4">
            <StickyNote className="w-10 h-10" />
          </div>
          <p className="text-lg font-medium text-white mb-2">还没有便签</p>
          <p className="text-sm">点击上方按钮创建你的第一个便签</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {notes.map((note) => {
            const colorClasses = getColorClasses(note.color);
            return (
              <div
                key={note.id}
                className={`group relative p-4 rounded-2xl ${colorClasses.bg} border ${colorClasses.border} hover:shadow-lg transition-all`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className={`font-medium ${colorClasses.text} pr-8`}>
                    {note.title}
                  </h3>
                  <button
                    onClick={() => togglePin(note.id)}
                    className={`absolute top-4 right-4 p-1 rounded transition-colors ${note.pinned ? 'text-emerald-400' : 'text-slate-400 opacity-0 group-hover:opacity-100'}`}
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                </div>
                <p className={`text-sm ${colorClasses.text} opacity-80 whitespace-pre-wrap`}>
                  {note.content}
                </p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
                  <span className="text-xs text-slate-500">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LabView;
