/**
 * Y-Nav Database Migration Utility
 * 用于初始化和管理D1数据库结构
 */

import { D1StorageService } from '../services/storage';

export interface MigrationResult {
  success: boolean;
  message: string;
  executedMigrations: string[];
  errors: string[];
}

// 迁移脚本列表
const MIGRATIONS = [
  {
    version: 1,
    name: 'init_schema',
    description: '初始化数据库结构',
    sql: `
      -- 用户表
      CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          password_hash TEXT,
          view_password_hash TEXT,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
          updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
          sync_version INTEGER DEFAULT 0,
          last_sync_at INTEGER,
          metadata TEXT
      );

      -- 链接表
      CREATE TABLE IF NOT EXISTS links (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          url TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          icon TEXT,
          category_id TEXT NOT NULL,
          is_pinned INTEGER DEFAULT 0,
          is_hidden INTEGER DEFAULT 0,
          is_private INTEGER DEFAULT 0,
          sort_order INTEGER DEFAULT 0,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
          updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      -- 分类表
      CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          icon TEXT,
          color TEXT,
          sort_order INTEGER DEFAULT 0,
          is_system INTEGER DEFAULT 0,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
          updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      -- 便签表
      CREATE TABLE IF NOT EXISTS notes (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          content TEXT NOT NULL,
          color TEXT DEFAULT 'yellow',
          sort_order INTEGER DEFAULT 0,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
          updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      -- 用户设置表
      CREATE TABLE IF NOT EXISTS user_settings (
          user_id TEXT PRIMARY KEY,
          ai_config TEXT,
          search_config TEXT,
          site_settings TEXT,
          theme_settings TEXT,
          privacy_settings TEXT,
          updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      -- 同步日志表
      CREATE TABLE IF NOT EXISTS sync_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          device_id TEXT,
          action TEXT NOT NULL,
          status TEXT NOT NULL,
          details TEXT,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      -- 创建索引
      CREATE INDEX IF NOT EXISTS idx_links_user_id ON links(user_id);
      CREATE INDEX IF NOT EXISTS idx_links_category ON links(user_id, category_id);
      CREATE INDEX IF NOT EXISTS idx_links_pinned ON links(user_id, is_pinned);
      CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
      CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
      CREATE INDEX IF NOT EXISTS idx_sync_logs_user_id ON sync_logs(user_id, created_at);

      -- 创建触发器
      CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
      AFTER UPDATE ON users
      BEGIN
          UPDATE users SET updated_at = (strftime('%s', 'now') * 1000) WHERE id = NEW.id;
      END;

      CREATE TRIGGER IF NOT EXISTS update_links_timestamp 
      AFTER UPDATE ON links
      BEGIN
          UPDATE links SET updated_at = (strftime('%s', 'now') * 1000) WHERE id = NEW.id;
      END;

      CREATE TRIGGER IF NOT EXISTS update_categories_timestamp 
      AFTER UPDATE ON categories
      BEGIN
          UPDATE categories SET updated_at = (strftime('%s', 'now') * 1000) WHERE id = NEW.id;
      END;

      CREATE TRIGGER IF NOT EXISTS update_notes_timestamp 
      AFTER UPDATE ON notes
      BEGIN
          UPDATE notes SET updated_at = (strftime('%s', 'now') * 1000) WHERE id = NEW.id;
      END;

      -- 迁移记录表
      CREATE TABLE IF NOT EXISTS schema_migrations (
          version INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          executed_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
      );
    `
  },
  {
    version: 2,
    name: 'add_metadata_index',
    description: '添加元数据索引优化',
    sql: `
      -- 添加复合索引优化常见查询
      CREATE INDEX IF NOT EXISTS idx_links_user_hidden ON links(user_id, is_hidden);
      CREATE INDEX IF NOT EXISTS idx_links_user_private ON links(user_id, is_private);
      CREATE INDEX IF NOT EXISTS idx_categories_user_system ON categories(user_id, is_system);
    `
  }
];

/**
 * 执行数据库迁移
 */
export async function runMigrations(
  db: D1Database,
  targetVersion?: number
): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    message: '',
    executedMigrations: [],
    errors: []
  };

  try {
    // 获取当前版本
    const currentVersion = await getCurrentVersion(db);
    const target = targetVersion || Math.max(...MIGRATIONS.map(m => m.version));

    if (currentVersion >= target) {
      result.message = `数据库已是最新版本 (v${currentVersion})`;
      return result;
    }

    // 执行未应用的迁移
    for (const migration of MIGRATIONS) {
      if (migration.version > currentVersion && migration.version <= target) {
        try {
          // 执行迁移SQL
          await db.exec(migration.sql);
          
          // 记录迁移
          await db.prepare(
            'INSERT INTO schema_migrations (version, name, executed_at) VALUES (?, ?, ?)'
          ).bind(migration.version, migration.name, Date.now()).run();
          
          result.executedMigrations.push(`${migration.version}: ${migration.name}`);
        } catch (error: any) {
          result.errors.push(`迁移 ${migration.version} 失败: ${error.message}`);
          result.success = false;
        }
      }
    }

    if (result.errors.length === 0) {
      result.message = `成功迁移到版本 v${target}`;
    } else {
      result.message = `迁移完成，但有 ${result.errors.length} 个错误`;
    }

  } catch (error: any) {
    result.success = false;
    result.message = `迁移过程出错: ${error.message}`;
    result.errors.push(error.message);
  }

  return result;
}

/**
 * 获取当前数据库版本
 */
async function getCurrentVersion(db: D1Database): Promise<number> {
  try {
    // 检查schema_migrations表是否存在
    const tableCheck = await db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_migrations'"
    ).first();
    
    if (!tableCheck) {
      return 0; // 表不存在，返回版本0
    }

    const result = await db.prepare(
      'SELECT MAX(version) as version FROM schema_migrations'
    ).first();
    
    return (result?.version as number) || 0;
  } catch {
    return 0;
  }
}

/**
 * 检查数据库健康状态
 */
export async function checkDatabaseHealth(db: D1Database): Promise<{
  healthy: boolean;
  tables: string[];
  issues: string[];
}> {
  const result = {
    healthy: true,
    tables: [] as string[],
    issues: [] as string[]
  };

  try {
    // 获取所有表
    const tables = await db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table'"
    ).all();
    
    result.tables = (tables.results || []).map((r: any) => r.name);

    // 检查必需表
    const requiredTables = ['users', 'links', 'categories', 'notes', 'user_settings'];
    for (const table of requiredTables) {
      if (!result.tables.includes(table)) {
        result.issues.push(`缺少必需表: ${table}`);
        result.healthy = false;
      }
    }

  } catch (error: any) {
    result.healthy = false;
    result.issues.push(`数据库检查失败: ${error.message}`);
  }

  return result;
}

/**
 * 数据迁移: 从KV迁移到D1
 */
export async function migrateFromKV(
  kv: KVNamespace,
  db: D1Database,
  userId: string
): Promise<{ success: boolean; message: string; migratedItems: number }> {
  const result = {
    success: false,
    message: '',
    migratedItems: 0
  };

  try {
    // 从KV读取数据
    const kvData = await kv.get<{
      links?: any[];
      categories?: any[];
      notes?: any[];
      settings?: any;
      meta?: any;
    }>('ynav:data:v1', 'json');

    if (!kvData) {
      result.message = 'KV中没有找到数据';
      return result;
    }

    const d1Service = new D1StorageService(db, userId);
    
    // 确保用户存在
    await d1Service.getOrCreateUser();

    // 迁移分类
    if (kvData.categories && kvData.categories.length > 0) {
      await d1Service.saveCategories(kvData.categories.map((c: any) => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        color: c.color,
        sortOrder: c.order || c.sortOrder || 0,
        isSystem: c.isSystem || false,
        createdAt: c.createdAt || Date.now()
      })));
      result.migratedItems += kvData.categories.length;
    }

    // 迁移链接
    if (kvData.links && kvData.links.length > 0) {
      await d1Service.saveLinks(kvData.links.map((l: any) => ({
        id: l.id,
        url: l.url,
        title: l.title,
        description: l.description,
        icon: l.icon,
        categoryId: l.categoryId,
        pinned: l.pinned || false,
        hidden: l.hidden || false,
        isPrivate: l.isPrivate || false,
        sortOrder: l.sortOrder || 0,
        createdAt: l.createdAt || Date.now()
      })));
      result.migratedItems += kvData.links.length;
    }

    // 迁移便签
    if (kvData.notes && kvData.notes.length > 0) {
      await d1Service.saveNotes(kvData.notes.map((n: any) => ({
        id: n.id,
        content: n.content,
        color: n.color || 'yellow',
        sortOrder: n.sortOrder || 0,
        createdAt: n.createdAt || Date.now(),
        updatedAt: n.updatedAt || Date.now()
      })));
      result.migratedItems += kvData.notes.length;
    }

    // 迁移设置
    if (kvData.settings) {
      await d1Service.saveSettings(kvData.settings);
      result.migratedItems += 1;
    }

    // 更新版本号
    if (kvData.meta?.version !== undefined) {
      await d1Service.updateSyncVersion(kvData.meta.version);
    }

    result.success = true;
    result.message = `成功迁移 ${result.migratedItems} 个数据项从KV到D1`;

  } catch (error: any) {
    result.message = `迁移失败: ${error.message}`;
  }

  return result;
}
