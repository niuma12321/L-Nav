-- Cloudflare D1 数据库初始化脚本
-- 用于云端同步功能

-- 用户同步数据表
CREATE TABLE IF NOT EXISTS user_sync_data (
  user_id TEXT PRIMARY KEY,
  data TEXT NOT NULL,  -- JSON 格式的同步数据
  last_modified INTEGER NOT NULL,  -- 时间戳
  device_id TEXT,  -- 最后同步的设备ID
  device_name TEXT,  -- 设备名称
  created_at INTEGER DEFAULT (unixepoch() * 1000)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_sync_modified ON user_sync_data(last_modified);

-- 同步历史表（可选，用于审计和冲突解决）
CREATE TABLE IF NOT EXISTS sync_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  device_id TEXT,
  device_name TEXT,
  action TEXT NOT NULL,  -- 'push', 'pull', 'merge'
  status TEXT NOT NULL,  -- 'success', 'error', 'conflict'
  timestamp INTEGER DEFAULT (unixepoch() * 1000),
  details TEXT  -- JSON 格式的详细信息
);

CREATE INDEX IF NOT EXISTS idx_sync_history_user ON sync_history(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_history_time ON sync_history(timestamp);
