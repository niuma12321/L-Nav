import { useState, useCallback, useEffect } from 'react';
import { StickyNote } from '../types';

const NOTES_STORAGE_KEY = 'ynav_notes';

export interface UseNotesReturn {
  notes: StickyNote[];
  addNote: (content?: string) => StickyNote;
  updateNote: (id: string, content: string, htmlContent?: string, isRichText?: boolean) => void;
  deleteNote: (id: string) => void;
  getNoteById: (id: string) => StickyNote | undefined;
  importNotes: (newNotes: StickyNote[]) => void;
}

/**
 * 便签数据管理 Hook
 * 提供便签的增删改查功能，数据持久化到 localStorage
 */
export function useNotes(): UseNotesReturn {
  // 从 localStorage 加载初始数据
  const [notes, setNotes] = useState<StickyNote[]>(() => {
    try {
      const stored = localStorage.getItem(NOTES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Notes] Failed to load notes:', error);
      }
    }
    return [];
  });

  // 数据变化时保存到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Notes] Failed to save notes:', error);
      }
    }
  }, [notes]);

  /**
   * 创建新便签
   */
  const addNote = useCallback((content?: string): StickyNote => {
    const now = Date.now();
    const safeContent = content && typeof content === 'string' ? content.trim() : '';
    const newNote: StickyNote = {
      id: `note_${now}`,
      content: safeContent,
      createdAt: now,
      updatedAt: now,
    };
    
    setNotes(prev => [newNote, ...prev]);
    return newNote;
  }, []);

  /**
   * 更新便签内容（支持富文本）
   */
  const updateNote = useCallback((id: string, content: string, htmlContent?: string, isRichText?: boolean) => {
    const trimmedContent = (content && typeof content === 'string') ? content.trim() : '';
    
    setNotes(prev =>
      prev.map(note =>
        note.id === id
          ? { 
              ...note, 
              content: trimmedContent, 
              htmlContent: htmlContent || note.htmlContent,
              isRichText: isRichText ?? note.isRichText,
              updatedAt: Date.now() 
            }
          : note
      )
    );
  }, []);

  /**
   * 删除便签
   */
  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  }, []);

  /**
   * 批量导入便签
   */
  const importNotes = useCallback((newNotes: StickyNote[]) => {
    setNotes(newNotes);
  }, []);

  /**
   * 根据 ID 获取便签
   */
  const getNoteById = useCallback(
    (id: string): StickyNote | undefined => {
      return notes.find(note => note.id === id);
    },
    [notes]
  );

  return {
    notes,
    addNote,
    updateNote,
    deleteNote,
    getNoteById,
    importNotes,
  };
}

export default useNotes;
