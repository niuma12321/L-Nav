/**
 * Y-Nav Multi-Storage Service
 * 统一数据存储层: D1(结构化) + R2(对象) + KV(缓存)
 */

import { LinkItem, Category, StickyNote, SyncMetadata, UserData } from '../types';

// ============================================
// 存储类型定义
// ============================================

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

// ============================================
// D1 Database Service
// ============================================

export class D1StorageService {
  private db: D1Database;
  private userId: string;

  constructor(db: D1Database, userId: string) {
    this.db = db;
    this.userId = userId;
  }

  // ---------- 用户管理 ----------
  async getOrCreateUser(passwordHash?: string): Promise<{ id: string; version: number }> {
    const stmt = this.db.prepare(
      `INSERT INTO users (id, password_hash, created_at, updated_at, sync_version)
       VALUES (?, ?, ?, ?, 0)
       ON CONFLICT(id) DO UPDATE SET
         updated_at = excluded.updated_at
       RETURNING id, sync_version as version`
    );
    
    const now = Date.now();
    const result = await stmt.bind(this.userId, passwordHash || null, now, now).first();
    return result as { id: string; version: number };
  }

  async getUser(): Promise<{ id: string; version: number; updatedAt: number } | null> {
    const stmt = this.db.prepare(
      'SELECT id, sync_version as version, updated_at FROM users WHERE id = ?'
    );
    return await stmt.bind(this.userId).first() as any;
  }

  async updateSyncVersion(version: number): Promise<void> {
    const stmt = this.db.prepare(
      `UPDATE users SET sync_version = ?, last_sync_at = ?, updated_at = ? WHERE id = ?`
    );
    const now = Date.now();
    await stmt.bind(version, now, now, this.userId).run();
  }

  // ---------- Links CRUD ----------
  async getLinks(): Promise<LinkItem[]> {
    const stmt = this.db.prepare(
      `SELECT id, url, title, description, icon, category_id as categoryId,
              is_pinned as pinned, is_hidden as hidden, is_private as isPrivate,
              sort_order as sortOrder, created_at as createdAt
       FROM links WHERE user_id = ? ORDER BY sort_order ASC, created_at DESC`
    );
    const results = await stmt.bind(this.userId).all();
    return (results.results || []).map(row => ({
      ...row,
      pinned: Boolean(row.pinned),
      hidden: Boolean(row.hidden),
      isPrivate: Boolean(row.isPrivate)
    })) as LinkItem[];
  }

  async saveLinks(links: LinkItem[]): Promise<void> {
    const now = Date.now();
    
    // 使用事务批量插入/更新
    const insertStmt = this.db.prepare(`
      INSERT INTO links (id, user_id, url, title, description, icon, category_id,
                        is_pinned, is_hidden, is_private, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        url = excluded.url,
        title = excluded.title,
        description = excluded.description,
        icon = excluded.icon,
        category_id = excluded.category_id,
        is_pinned = excluded.is_pinned,
        is_hidden = excluded.is_hidden,
        is_private = excluded.is_private,
        sort_order = excluded.sort_order,
        updated_at = excluded.updated_at
    `);

    const batch = links.map(link => 
      insertStmt.bind(
        link.id,
        this.userId,
        link.url,
        link.title,
        link.description || null,
        link.icon || null,
        link.categoryId,
        link.pinned ? 1 : 0,
        link.hidden ? 1 : 0,
        link.isPrivate ? 1 : 0,
        link.sortOrder || 0,
        link.createdAt || now,
        now
      )
    );

    await this.db.batch(batch);
  }

  async deleteLinks(linkIds: string[]): Promise<void> {
    if (linkIds.length === 0) return;
    const placeholders = linkIds.map(() => '?').join(',');
    const stmt = this.db.prepare(
      `DELETE FROM links WHERE user_id = ? AND id IN (${placeholders})`
    );
    await stmt.bind(this.userId, ...linkIds).run();
  }

  // ---------- Categories CRUD ----------
  async getCategories(): Promise<Category[]> {
    const stmt = this.db.prepare(
      `SELECT id, name, icon, color, sort_order as sortOrder,
              is_system as isSystem, created_at as createdAt
       FROM categories WHERE user_id = ? ORDER BY sort_order ASC`
    );
    const results = await stmt.bind(this.userId).all();
    return (results.results || []).map(row => ({
      ...row,
      isSystem: Boolean(row.isSystem)
    })) as Category[];
  }

  async saveCategories(categories: Category[]): Promise<void> {
    const now = Date.now();
    const insertStmt = this.db.prepare(`
      INSERT INTO categories (id, user_id, name, icon, color, sort_order, is_system, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        icon = excluded.icon,
        color = excluded.color,
        sort_order = excluded.sort_order,
        updated_at = excluded.updated_at
    `);

    const batch = categories.map(cat =>
      insertStmt.bind(
        cat.id,
        this.userId,
        cat.name,
        cat.icon || null,
        cat.color || null,
        cat.sortOrder || 0,
        cat.isSystem ? 1 : 0,
        cat.createdAt || now,
        now
      )
    );

    await this.db.batch(batch);
  }

  async deleteCategories(categoryIds: string[]): Promise<void> {
    if (categoryIds.length === 0) return;
    const placeholders = categoryIds.map(() => '?').join(',');
    const stmt = this.db.prepare(
      `DELETE FROM categories WHERE user_id = ? AND id IN (${placeholders})`
    );
    await stmt.bind(this.userId, ...categoryIds).run();
  }

  // ---------- Notes CRUD ----------
  async getNotes(): Promise<StickyNote[]> {
    const stmt = this.db.prepare(
      `SELECT id, content, color, sort_order as sortOrder,
              created_at as createdAt, updated_at as updatedAt
       FROM notes WHERE user_id = ? ORDER BY sort_order ASC, updated_at DESC`
    );
    const results = await stmt.bind(this.userId).all();
    return results.results as StickyNote[] || [];
  }

  async saveNotes(notes: StickyNote[]): Promise<void> {
    const now = Date.now();
    const insertStmt = this.db.prepare(`
      INSERT INTO notes (id, user_id, content, color, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        content = excluded.content,
        color = excluded.color,
        sort_order = excluded.sort_order,
        updated_at = excluded.updated_at
    `);

    const batch = notes.map(note =>
      insertStmt.bind(
        note.id,
        this.userId,
        note.content,
        note.color || 'yellow',
        note.sortOrder || 0,
        note.createdAt || now,
        now
      )
    );

    await this.db.batch(batch);
  }

  async deleteNotes(noteIds: string[]): Promise<void> {
    if (noteIds.length === 0) return;
    const placeholders = noteIds.map(() => '?').join(',');
    const stmt = this.db.prepare(
      `DELETE FROM notes WHERE user_id = ? AND id IN (${placeholders})`
    );
    await stmt.bind(this.userId, ...noteIds).run();
  }

  // ---------- Settings ----------
  async getSettings(): Promise<Record<string, any> | null> {
    const stmt = this.db.prepare(
      `SELECT ai_config, search_config, site_settings, theme_settings, privacy_settings
       FROM user_settings WHERE user_id = ?`
    );
    const result = await stmt.bind(this.userId).first();
    if (!result) return null;
    
    return {
      ai: result.ai_config ? JSON.parse(result.ai_config as string) : null,
      search: result.search_config ? JSON.parse(result.search_config as string) : null,
      site: result.site_settings ? JSON.parse(result.site_settings as string) : null,
      theme: result.theme_settings ? JSON.parse(result.theme_settings as string) : null,
      privacy: result.privacy_settings ? JSON.parse(result.privacy_settings as string) : null
    };
  }

  async saveSettings(settings: Record<string, any>): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO user_settings (user_id, ai_config, search_config, site_settings, 
                                theme_settings, privacy_settings, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        ai_config = excluded.ai_config,
        search_config = excluded.search_config,
        site_settings = excluded.site_settings,
        theme_settings = excluded.theme_settings,
        privacy_settings = excluded.privacy_settings,
        updated_at = excluded.updated_at
    `);
    
    const now = Date.now();
    await stmt.bind(
      this.userId,
      settings.ai ? JSON.stringify(settings.ai) : null,
      settings.search ? JSON.stringify(settings.search) : null,
      settings.site ? JSON.stringify(settings.site) : null,
      settings.theme ? JSON.stringify(settings.theme) : null,
      settings.privacy ? JSON.stringify(settings.privacy) : null,
      now
    ).run();
  }

  // ---------- Full Data Operations ----------
  async getAllData(): Promise<UserData> {
    const [links, categories, notes, settings, user] = await Promise.all([
      this.getLinks(),
      this.getCategories(),
      this.getNotes(),
      this.getSettings(),
      this.getUser()
    ]);

    return {
      links,
      categories,
      notes,
      settings: settings || {},
      meta: {
        updatedAt: user?.updatedAt || Date.now(),
        deviceId: this.userId,
        version: user?.version || 0
      }
    };
  }

  async saveAllData(data: UserData): Promise<void> {
    await Promise.all([
      this.saveLinks(data.links),
      this.saveCategories(data.categories),
      this.saveNotes(data.notes),
      data.settings && this.saveSettings(data.settings)
    ]);
    
    if (data.meta?.version !== undefined) {
      await this.updateSyncVersion(data.meta.version);
    }
  }

  // ---------- Sync Log ----------
  async logSync(action: string, status: string, details?: any): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO sync_logs (user_id, action, status, details, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    await stmt.bind(
      this.userId,
      action,
      status,
      details ? JSON.stringify(details) : null,
      Date.now()
    ).run();
  }

  async cleanupOldLogs(days: number = 30): Promise<void> {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    const stmt = this.db.prepare(
      'DELETE FROM sync_logs WHERE user_id = ? AND created_at < ?'
    );
    await stmt.bind(this.userId, cutoff).run();
  }
}

// ============================================
// R2 Object Storage Service
// ============================================

export class R2StorageService {
  private bucket: R2Bucket;
  private userId: string;

  constructor(bucket: R2Bucket, userId: string) {
    this.bucket = bucket;
    this.userId = userId;
  }

  private getKey(type: string, id: string): string {
    return `${this.userId}/${type}/${id}`;
  }

  // 上传图标
  async uploadIcon(id: string, data: ArrayBuffer, contentType: string = 'image/png'): Promise<string> {
    const key = this.getKey('icons', id);
    await this.bucket.put(key, data, {
      httpMetadata: { contentType },
      customMetadata: { 
        uploadedAt: Date.now().toString(),
        userId: this.userId 
      }
    });
    return key;
  }

  // 获取图标
  async getIcon(id: string): Promise<ArrayBuffer | null> {
    const key = this.getKey('icons', id);
    const object = await this.bucket.get(key);
    if (!object) return null;
    return await object.arrayBuffer();
  }

  // 删除图标
  async deleteIcon(id: string): Promise<void> {
    const key = this.getKey('icons', id);
    await this.bucket.delete(key);
  }

  // 创建备份归档
  async createBackupArchive(id: string, data: any): Promise<string> {
    const key = this.getKey('backups', `${id}.json`);
    const jsonData = JSON.stringify(data);
    await this.bucket.put(key, jsonData, {
      httpMetadata: { contentType: 'application/json' },
      customMetadata: {
        createdAt: Date.now().toString(),
        userId: this.userId,
        type: 'backup'
      }
    });
    return key;
  }

  // 获取备份归档
  async getBackupArchive(id: string): Promise<any | null> {
    const key = this.getKey('backups', `${id}.json`);
    const object = await this.bucket.get(key);
    if (!object) return null;
    const text = await object.text();
    return JSON.parse(text);
  }

  // 删除备份归档
  async deleteBackupArchive(id: string): Promise<void> {
    const key = this.getKey('backups', `${id}.json`);
    await this.bucket.delete(key);
  }

  // 列出用户所有对象
  async listObjects(type: string): Promise<string[]> {
    const prefix = `${this.userId}/${type}/`;
    const objects = await this.bucket.list({ prefix });
    return objects.objects?.map(o => o.key) || [];
  }

  // 清理旧备份
  async cleanupOldBackups(maxAgeDays: number = 30): Promise<void> {
    const cutoff = Date.now() - (maxAgeDays * 24 * 60 * 60 * 1000);
    const prefix = `${this.userId}/backups/`;
    const objects = await this.bucket.list({ prefix });
    
    const toDelete = objects.objects?.filter(o => {
      const uploadedAt = parseInt(o.customMetadata?.uploadedAt || '0');
      return uploadedAt < cutoff;
    }) || [];

    for (const obj of toDelete) {
      await this.bucket.delete(obj.key);
    }
  }
}

// ============================================
// KV Cache Service (高频访问数据)
// ============================================

export class KVCacheService {
  private kv: KVNamespace;
  private userId: string;

  constructor(kv: KVNamespace, userId: string) {
    this.kv = kv;
    this.userId = userId;
  }

  private getKey(suffix: string): string {
    return `ynav:cache:${this.userId}:${suffix}`;
  }

  // 缓存聚合数据 (短期TTL)
  async cacheAggregatedData(data: any, ttlSeconds: number = 300): Promise<void> {
    const key = this.getKey('aggregated');
    await this.kv.put(key, JSON.stringify(data), { expirationTtl: ttlSeconds });
  }

  async getCachedAggregatedData(): Promise<any | null> {
    const key = this.getKey('aggregated');
    const cached = await this.kv.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  // 缓存统计数据
  async cacheStats(stats: any, ttlSeconds: number = 3600): Promise<void> {
    const key = this.getKey('stats');
    await this.kv.put(key, JSON.stringify(stats), { expirationTtl: ttlSeconds });
  }

  async getCachedStats(): Promise<any | null> {
    const key = this.getKey('stats');
    const cached = await this.kv.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  // 速率限制计数器
  async incrementRateLimitCounter(windowMs: number = 60000): Promise<number> {
    const key = this.getKey(`ratelimit:${Math.floor(Date.now() / windowMs)}`);
    const current = parseInt(await this.kv.get(key) || '0');
    const next = current + 1;
    await this.kv.put(key, next.toString(), { expirationTtl: windowMs / 1000 });
    return next;
  }

  // 清理用户所有缓存
  async clearAllCache(): Promise<void> {
    // KV不支持前缀删除，需要列出并删除
    const prefix = this.getKey('');
    // 这里简化处理，实际可能需要通过list API
  }
}

// ============================================
// Hybrid Storage Service (统一入口)
// ============================================

export class HybridStorageService {
  d1: D1StorageService | null = null;
  r2: R2StorageService | null = null;
  kv: KVCacheService | null = null;
  userId: string;

  constructor(config: StorageConfig) {
    this.userId = config.userId;
    
    if (config.d1) {
      this.d1 = new D1StorageService(config.d1, config.userId);
    }
    if (config.r2) {
      this.r2 = new R2StorageService(config.r2, config.userId);
    }
    if (config.kv) {
      this.kv = new KVCacheService(config.kv, config.userId);
    }
  }

  // 检查D1是否可用
  isD1Available(): boolean {
    return this.d1 !== null;
  }

  // 检查R2是否可用
  isR2Available(): boolean {
    return this.r2 !== null;
  }

  // 检查KV是否可用
  isKVAvailable(): boolean {
    return this.kv !== null;
  }
}

// 工厂函数
export function createStorageService(
  env: { YNAV_D1_DB?: D1Database; YNAV_R2_BUCKET?: R2Bucket; YNAV_WORKER_KV?: KVNamespace },
  userId: string
): HybridStorageService {
  return new HybridStorageService({
    backend: 'hybrid',
    d1: env.YNAV_D1_DB,
    r2: env.YNAV_R2_BUCKET,
    kv: env.YNAV_WORKER_KV,
    userId
  });
}
