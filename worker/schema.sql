-- Cloudflare D1 数据库初始化脚本
-- 用于云端同步功能
-- ==========================================

-- 1. 用户同步数据主表（核心同步表）
CREATE TABLE IF NOT EXISTS user_sync_data (
  user_id TEXT PRIMARY KEY,
  data TEXT NOT NULL,  -- JSON 格式的完整同步数据
  last_modified INTEGER NOT NULL,
  device_id TEXT,
  device_name TEXT,
  created_at INTEGER DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS idx_user_sync_modified ON user_sync_data(last_modified);

-- 2. 链接表（结构化存储，支持单独查询）
CREATE TABLE IF NOT EXISTS links (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  category_id TEXT,
  icon TEXT,
  favicon TEXT,
  is_pinned INTEGER DEFAULT 0,
  is_hidden INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch() * 1000),
  updated_at INTEGER DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS idx_links_user_id ON links(user_id);
CREATE INDEX IF NOT EXISTS idx_links_category ON links(category_id);
CREATE INDEX IF NOT EXISTS idx_links_order ON links(user_id, order_index);

-- 3. 分类表
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  is_hidden INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_order ON categories(user_id, order_index);

-- 4. 备份元数据表
CREATE TABLE IF NOT EXISTS backups (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT,
  size INTEGER,
  r2_key TEXT,
  created_at INTEGER DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS idx_backups_user_id ON backups(user_id);
CREATE INDEX IF NOT EXISTS idx_backups_created ON backups(created_at);

-- 5. 用户设置表
CREATE TABLE IF NOT EXISTS user_settings (
  user_id TEXT PRIMARY KEY,
  settings TEXT NOT NULL,  -- JSON 格式
  updated_at INTEGER DEFAULT (unixepoch() * 1000)
);

-- 6. 通知设置表
CREATE TABLE IF NOT EXISTS notification_settings (
  user_id TEXT PRIMARY KEY,
  channels TEXT,  -- JSON 格式 ["telegram", "email", ...]
  telegram_bot_token TEXT,
  telegram_chat_id TEXT,
  email_smtp_host TEXT,
  email_smtp_port INTEGER,
  email_username TEXT,
  email_password TEXT,
  email_to TEXT,
  webhook_url TEXT,
  feishu_webhook TEXT,
  dingtalk_webhook TEXT,
  wecom_webhook TEXT,
  serverchan_sckey TEXT,
  updated_at INTEGER DEFAULT (unixepoch() * 1000)
);

-- 7. 通知记录表
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  is_read INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

-- 8. 同步历史表（审计用）
CREATE TABLE IF NOT EXISTS sync_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  device_id TEXT,
  device_name TEXT,
  action TEXT NOT NULL,  -- 'push', 'pull', 'merge'
  status TEXT NOT NULL,  -- 'success', 'error', 'conflict'
  timestamp INTEGER DEFAULT (unixepoch() * 1000),
  details TEXT  -- JSON 格式
);

CREATE INDEX IF NOT EXISTS idx_sync_history_user ON sync_history(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_history_time ON sync_history(timestamp);
