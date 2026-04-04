import { useState, useEffect, useCallback, useRef } from 'react';
import { StickyNote } from '../types';

const SYNC_API_BASE = '/api/v1';
const NOTES_STORAGE_KEY = 'ynav_notes_v1';

export const useNotesSync = () => {
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  // 推送数据到云端
  const pushToCloud = useCallback(async (notesToPush: StickyNote[]) => {
    try {
      console.log('[Notes] Pushing to cloud:', notesToPush.length, 'notes');
      
      const response = await fetch(`${SYNC_API_BASE}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: notesToPush
        })
      });
      
      const result = await response.json();
      console.log('[Notes] Push result:', result);
      
      return result.success;
    } catch (e) {
      console.error('[Notes] Failed to push to cloud:', e);
      return false;
    }
  }, []);

  // 从云端拉取 - 以云端为唯一真相源
  const pullFromCloud = useCallback(async () => {
    try {
      setIsSyncing(true);
      console.log('[Notes] Pulling from cloud...');
      
      const response = await fetch(`${SYNC_API_BASE}/sync`);
      const result = await response.json();
      
      if (result.success && result.data) {
        const cloudData = result.data;
        const cloudNotes = cloudData.notes || [];
        
        console.log('[Notes] Cloud data:', cloudNotes.length, 'notes');
        
        return { notes: cloudNotes };
      }
      return { notes: [] };
    } catch (e) {
      console.error('[Notes] Failed to pull from cloud:', e);
      return { notes: [] };
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // 延迟同步（防抖）
  const debouncedSync = useCallback((newNotes: StickyNote[]) => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    syncTimeoutRef.current = setTimeout(() => {
      pushToCloud(newNotes);
    }, 2000); // 2秒后同步
  }, [pushToCloud]);

  // 初始化加载 - 以云端为真相源
  useEffect(() => {
    const init = async () => {
      console.log('[Notes] Initializing...');
      
      // 1. 先加载本地数据（快速显示）
      const stored = localStorage.getItem(NOTES_STORAGE_KEY);
      let localNotes: StickyNote[] = [];
      
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            localNotes = parsed;
            setNotes(localNotes);
            console.log('[Notes] Loaded from local:', localNotes.length, 'notes');
          }
        } catch (e) {
          console.error('[Notes] Failed to parse local data:', e);
        }
      }
      
      setIsLoading(false);
      
      // 2. 从云端拉取最新数据
      const cloudData = await pullFromCloud();
      
      if (cloudData.notes.length > 0) {
        // 云端有数据，完全以云端为准（覆盖本地）
        setNotes(cloudData.notes);
        localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(cloudData.notes));
        console.log('[Notes] Overridden with cloud data');
      } else if (localNotes.length > 0) {
        // 云端无数据，上传本地数据
        const success = await pushToCloud(localNotes);
        if (success) {
          console.log('[Notes] Local data uploaded to cloud');
        }
      }
      
      isInitializedRef.current = true;
    };
    
    init();
  }, [pullFromCloud, pushToCloud]);

  // 保存到 localStorage 并同步到云端
  useEffect(() => {
    if (!isLoading && isInitializedRef.current) {
      try {
        localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
        console.log('[Notes] Saved to localStorage');
        
        // 同步到云端
        debouncedSync(notes);
      } catch (error) {
        console.error('[Notes] Failed to save:', error);
      }
    }
  }, [notes, isLoading, debouncedSync]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  // 添加笔记
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

  // 更新笔记
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

  // 删除笔记
  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  }, []);

  // 批量导入
  const importNotes = useCallback((newNotes: StickyNote[]) => {
    setNotes(newNotes);
  }, []);

  // 根据 ID 获取笔记
  const getNoteById = useCallback(
    (id: string): StickyNote | undefined => {
      return notes.find(note => note.id === id);
    },
    [notes]
  );

  // 强制同步
  const forceSync = useCallback(async () => {
    return await pushToCloud(notes);
  }, [pushToCloud, notes]);

  return {
    notes,
    addNote,
    updateNote,
    deleteNote,
    getNoteById,
    importNotes,
    isLoading,
    isSyncing,
    forceSync
  };
};

export default useNotesSync;
