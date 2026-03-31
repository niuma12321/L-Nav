import React, { useState, useCallback, useRef, useEffect } from 'react';
import { StickyNote } from '../../types';
import { Edit3, Trash2, FileText } from 'lucide-react';

interface StickyNoteCardProps {
  note: StickyNote;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}

const StickyNoteCard: React.FC<StickyNoteCardProps> = React.memo(({
  note,
  onUpdate,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // 进入编辑状态时自动聚焦
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // 将光标移到文本末尾
      const len = editContent.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [isEditing, editContent.length]);

  // 点击外部自动保存
  useEffect(() => {
    if (!isEditing) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        handleSave();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditing, editContent]);

  const handleSave = useCallback(() => {
    const trimmed = (editContent && typeof editContent === 'string') ? editContent.trim() : '';
    if (trimmed !== note.content) {
      onUpdate(note.id, trimmed);
    }
    setIsEditing(false);
  }, [editContent, note.id, note.content, onUpdate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setEditContent(note.content);
      setIsEditing(false);
    }
  }, [handleSave, note.content]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这条便签吗？')) {
      onDelete(note.id);
    }
  }, [note.id, onDelete]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditContent(note.content);
    setIsEditing(true);
  }, [note.content]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      ref={cardRef}
      className="group relative rounded-2xl transition-all duration-300 ease-out
        bg-white dark:bg-slate-900/40 backdrop-blur-md
        border border-slate-200/60 dark:border-white/8
        overflow-hidden cursor-pointer
        shadow-sm shadow-slate-200/50 dark:shadow-none
        hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 dark:hover:shadow-emerald-500/5
        hover:border-emerald-500/30 dark:hover:border-emerald-500/30
        active:scale-98"
      onClick={() => !isEditing && setIsEditing(true)}
    >
      {/* 头部图标区域 */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl
          bg-emerald-50 dark:bg-emerald-900/20
          border border-emerald-200/50 dark:border-emerald-700/30
          text-emerald-600 dark:text-emerald-400">
          <FileText size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
            便签
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {formatDate(note.updatedAt)}
          </p>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="px-4 pb-4">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className="w-full min-h-[100px] p-3 rounded-xl resize-none
              bg-slate-50 dark:bg-slate-800/50
              border border-slate-200 dark:border-slate-700
              text-slate-700 dark:text-slate-200 text-sm
              focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50
              placeholder:text-slate-400 dark:placeholder:text-slate-500"
            placeholder="输入便签内容..."
          />
        ) : (
          <div className="min-h-[60px] p-3 rounded-xl
            bg-slate-50/50 dark:bg-slate-800/30
            border border-slate-100 dark:border-white/5">
            {note.content ? (
              <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap break-words leading-relaxed">
                {note.content}
              </p>
            ) : (
              <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                点击编辑便签内容...
              </p>
            )}
          </div>
        )}
      </div>

      {/* 悬停操作按钮 */}
      {!isEditing && (
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5
          transition-all duration-200 opacity-0 group-hover:opacity-100">
          <button
            onClick={handleEdit}
            className="p-2 rounded-lg backdrop-blur-sm
              bg-white/90 dark:bg-slate-800/90
              text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400
              border border-slate-200/50 dark:border-white/10
              shadow-sm transition-colors"
            title="编辑"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 rounded-lg backdrop-blur-sm
              bg-white/90 dark:bg-slate-800/90
              text-slate-400 hover:text-rose-500
              border border-slate-200/50 dark:border-white/10
              shadow-sm transition-colors"
            title="删除"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      {/* 编辑提示 */}
      {isEditing && (
        <div className="absolute bottom-2 right-3 text-xs text-slate-400 dark:text-slate-500">
          按 Enter 保存，Esc 取消
        </div>
      )}
    </div>
  );
});

export default StickyNoteCard;
