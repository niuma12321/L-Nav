import { useState, useCallback, useEffect } from 'react';
import { StickyNote } from '../types';
import {
  NOTES_STORAGE_KEY,
  getCanonicalUserStorageKey,
  getData,
  setData,
  YNAV_DATA_SYNCED_EVENT,
  YNAV_USER_STORAGE_UPDATED_EVENT
} from '../utils/constants';

export interface UseNotesReturn {
  notes: StickyNote[];
  addNote: (content?: string) => StickyNote;
  updateNote: (id: string, content: string, htmlContent?: string, isRichText?: boolean) => void;
  deleteNote: (id: string) => void;
  getNoteById: (id: string) => StickyNote | undefined;
  importNotes: (newNotes: StickyNote[]) => void;
}

const loadNotesFromStorage = () => {
  const storedNotes = getData<StickyNote[]>(NOTES_STORAGE_KEY, []);
  return Array.isArray(storedNotes) ? storedNotes : [];
};

/**
 * 便签数据管理 Hook
 * 提供便签的增删改查功能，数据持久化到用户维度存储。
 */
export function useNotes(): UseNotesReturn {
  const [notes, setNotes] = useState<StickyNote[]>(() => loadNotesFromStorage());

  useEffect(() => {
    setData(NOTES_STORAGE_KEY, notes);
  }, [notes]);

  useEffect(() => {
    const syncableKeys = new Set([
      NOTES_STORAGE_KEY,
      'ynav-notes',
      getCanonicalUserStorageKey('ynav-notes')
    ]);

    const reloadNotes = (changedKeys: string[] = []) => {
      if (changedKeys.some((changedKey) => syncableKeys.has(changedKey))) {
        setNotes(loadNotesFromStorage());
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key && syncableKeys.has(event.key)) {
        setNotes(loadNotesFromStorage());
      }
    };

    const handleCustomEvent = (event: Event) => {
      const changedKeys = (event as CustomEvent<{ changedKeys?: string[] }>).detail?.changedKeys || [];
      reloadNotes(changedKeys);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(YNAV_DATA_SYNCED_EVENT, handleCustomEvent as EventListener);
    window.addEventListener(YNAV_USER_STORAGE_UPDATED_EVENT, handleCustomEvent as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(YNAV_DATA_SYNCED_EVENT, handleCustomEvent as EventListener);
      window.removeEventListener(YNAV_USER_STORAGE_UPDATED_EVENT, handleCustomEvent as EventListener);
    };
  }, []);

  const addNote = useCallback((content?: string): StickyNote => {
    const now = Date.now();
    const safeContent = content && typeof content === 'string' ? content.trim() : '';
    const newNote: StickyNote = {
      id: `note_${now}`,
      content: safeContent,
      createdAt: now,
      updatedAt: now,
    };

    setNotes((prev) => [newNote, ...prev]);
    return newNote;
  }, []);

  const updateNote = useCallback((id: string, content: string, htmlContent?: string, isRichText?: boolean) => {
    const trimmedContent = (content && typeof content === 'string') ? content.trim() : '';

    setNotes((prev) =>
      prev.map((note) =>
        note.id === id
          ? {
              ...note,
              content: trimmedContent,
              htmlContent: htmlContent ?? note.htmlContent,
              isRichText: isRichText ?? note.isRichText,
              updatedAt: Date.now()
            }
          : note
      )
    );
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  }, []);

  const importNotes = useCallback((newNotes: StickyNote[]) => {
    setNotes(Array.isArray(newNotes) ? newNotes : []);
  }, []);

  const getNoteById = useCallback((id: string): StickyNote | undefined => {
    return notes.find((note) => note.id === id);
  }, [notes]);

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
