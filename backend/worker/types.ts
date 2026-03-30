/**
 * Worker 内部类型定义
 * 不依赖外部 src/types.ts
 */

// 基础数据类型
export interface LinkItem {
  id: string;
  url: string;
  title: string;
  description?: string;
  icon?: string;
  categoryId: string;
  pinned?: boolean;
  hidden?: boolean;
  isPrivate?: boolean;
  sortOrder?: number;
  createdAt?: number;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
  isSystem?: boolean;
  createdAt?: number;
}

export interface StickyNote {
  id: string;
  content: string;
  color?: string;
  sortOrder?: number;
  createdAt: number;
  updatedAt: number;
}

export interface SyncMetadata {
  updatedAt: number;
  deviceId: string;
  version: number;
  browser?: string;
  os?: string;
  userAgent?: string;
}

export interface YNavSyncData {
  links: LinkItem[];
  categories: Category[];
  notes?: StickyNote[];
  searchConfig?: any;
  aiConfig?: any;
  siteSettings?: {
    siteMode?: 'public' | 'webmaster' | 'private';
    title?: string;
    cardStyle?: 'detailed' | 'simple';
  };
  privateVault?: string;
  schemaVersion?: number;
  meta: SyncMetadata;
}

export interface SyncConflict {
  localData: YNavSyncData;
  remoteData: YNavSyncData;
}

// 存储相关类型
export type StorageBackend = 'd1' | 'kv' | 'r2' | 'hybrid';

export interface StorageConfig {
  backend: StorageBackend;
  d1?: D1Database;
  kv?: KVNamespace;
  r2?: R2Bucket;
  userId: string;
}

export interface UserData {
  links: LinkItem[];
  categories: Category[];
  notes: StickyNote[];
  settings?: Record<string, any>;
  meta: SyncMetadata;
}

// D1 表结构类型
export interface D1UserRow {
  id: string;
  password_hash: string | null;
  view_password_hash: string | null;
  created_at: number;
  updated_at: number;
  sync_version: number;
  last_sync_at: number | null;
  metadata: string | null;
}

export interface D1LinkRow {
  id: string;
  user_id: string;
  url: string;
  title: string;
  description: string | null;
  icon: string | null;
  category_id: string;
  is_pinned: number;
  is_hidden: number;
  is_private: number;
  sort_order: number;
  created_at: number;
  updated_at: number;
}

export interface D1CategoryRow {
  id: string;
  user_id: string;
  name: string;
  icon: string | null;
  color: string | null;
  sort_order: number;
  is_system: number;
  created_at: number;
  updated_at: number;
}

export interface D1NoteRow {
  id: string;
  user_id: string;
  content: string;
  color: string;
  sort_order: number;
  created_at: number;
  updated_at: number;
}
