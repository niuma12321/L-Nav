import { useState, useCallback, useEffect } from 'react';
import { StickyNote } from '../types';

const NOTES_STORAGE_KEY = 'ynav_notes';

export interface UseNotesReturn {
  notes: StickyNote[];
  addNote: (content?: string) => StickyNote;
  updateNote: (id: string, content: string) => void;
  deleteNote: (id: string) => void;
  getNoteById: (id: string) => StickyNote | undefined;
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
  const addNote = useCallback((content: string = ''): StickyNote => {
    const now = Date.now();
    const newNote: StickyNote = {
      id: `note_${now}`,
      content: content.trim(),
      createdAt: now,
      updatedAt: now,
    };
    
    setNotes(prev => [newNote, ...prev]);
    return newNote;
  }, []);

  /**
   * 更新便签内容
   */
  const updateNote = useCallback((id: string, content: string) => {
    const trimmedContent = content.trim();
    
    setNotes(prev =>
      prev.map(note =>
        note.id === id
          ? { ...note, content: trimmedContent, updatedAt: Date.now() }
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
  };
}

export default useNotes;
