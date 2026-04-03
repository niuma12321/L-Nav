-- ============================================
-- Y-Nav D1 Database Schema
-- 多存储架构: D1(结构化) + R2(对象) + KV(缓存)
-- ============================================

-- 用户表 (按user_id分片)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,                    -- user_id (设备ID或用户标识)
    password_hash TEXT,                     -- 同步密码哈希
    view_password_hash TEXT,                -- 只读密码哈希(可选)
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    sync_version INTEGER DEFAULT 0,         -- 数据版本号，用于乐观锁
    last_sync_at INTEGER,                   -- 最后同步时间
    metadata TEXT                           -- JSON: 设备信息、配额等
);

-- 链接表
CREATE TABLE IF NOT EXISTS links (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT,                              -- 图标URL或R2 key
    category_id TEXT NOT NULL,
    is_pinned INTEGER DEFAULT 0,            -- 0/1
    is_hidden INTEGER DEFAULT 0,            -- 0/1
    is_private INTEGER DEFAULT 0,           -- 0/1
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
    icon TEXT,                              -- Lucide图标名称
    color TEXT,                             -- 颜色代码
    sort_order INTEGER DEFAULT 0,
    is_system INTEGER DEFAULT 0,            -- 0/1 系统内置分类
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 便签表
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    color TEXT DEFAULT 'yellow',            -- 便签颜色
    sort_order INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 用户设置表
CREATE TABLE IF NOT EXISTS user_settings (
    user_id TEXT PRIMARY KEY,
    ai_config TEXT,                         -- JSON: AI配置
    search_config TEXT,                     -- JSON: 搜索配置
    site_settings TEXT,                     -- JSON: 站点设置
    theme_settings TEXT,                    -- JSON: 主题设置
    privacy_settings TEXT,                  -- JSON: 隐私设置
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 同步日志表 (用于追踪和审计)
CREATE TABLE IF NOT EXISTS sync_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    device_id TEXT,
    action TEXT NOT NULL,                   -- 'push', 'pull', 'backup', 'restore'
    status TEXT NOT NULL,                   -- 'success', 'conflict', 'error'
    details TEXT,                           -- JSON: 详细信息
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建索引优化查询
CREATE INDEX IF NOT EXISTS idx_links_user_id ON links(user_id);
CREATE INDEX IF NOT EXISTS idx_links_category ON links(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_links_pinned ON links(user_id, is_pinned);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_user_id ON sync_logs(user_id, created_at);

-- 触发器: 自动更新 updated_at
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

-- ==========================================
-- 自动化任务调度模块表
-- ==========================================

-- 自动化任务表
CREATE TABLE IF NOT EXISTS automation_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('cron', 'webhook', 'manual')),
  cron_expression TEXT,
  action_type TEXT NOT NULL,
  action_config TEXT NOT NULL, -- JSON格式存储动作配置
  enabled BOOLEAN DEFAULT 1,
  last_run_at INTEGER,
  next_run_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- 任务执行日志表
CREATE TABLE IF NOT EXISTS automation_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'running')),
  output TEXT,
  run_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  duration INTEGER, -- 执行时长(毫秒)
  FOREIGN KEY (task_id) REFERENCES automation_tasks(id) ON DELETE CASCADE
);

-- ==========================================
-- 智能家居控制模块表
-- ==========================================

-- 智能家居设备表
CREATE TABLE IF NOT EXISTS smart_devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('homeassistant', 'mijia', 'tuya')),
  device_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('light', 'switch', 'sensor', 'climate', 'cover')),
  state TEXT NOT NULL,
  attributes TEXT, -- JSON格式存储设备属性
  last_updated INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  UNIQUE(user_id, platform, device_id)
);

-- 智能家居场景表
CREATE TABLE IF NOT EXISTS smart_scenes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  scene_id TEXT NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  last_triggered INTEGER,
  UNIQUE(user_id, platform, scene_id)
);

-- 创建索引提升查询性能
CREATE INDEX IF NOT EXISTS idx_automation_tasks_user ON automation_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_user ON automation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_task ON automation_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_smart_devices_user ON smart_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_smart_scenes_user ON smart_scenes(user_id);

-- 触发器: 自动化任务更新时间戳
CREATE TRIGGER IF NOT EXISTS update_automation_tasks_timestamp 
AFTER UPDATE ON automation_tasks
BEGIN
    UPDATE automation_tasks SET updated_at = (strftime('%s', 'now') * 1000) WHERE id = NEW.id;
END;
