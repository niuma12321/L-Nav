/**
 * 数据备份和恢复模块
 * 防止数据丢失，提供完整的数据保护策略
 */

import { 
  getCurrentUserId, 
  getUserStorageKey, 
  STORAGE_KEYS,
  getDeviceId
} from '@/utils/constants';

// 备份元数据
export interface BackupMetadata {
  id: string;
  userId: string;
  deviceId: string;
  createdAt: number;
  size: number;
  checksum: string;
  version: string;
  dataTypes: string[];
  compressed: boolean;
}

// 备份结果
export interface BackupResult {
  success: boolean;
  backupId?: string;
  size?: number;
  error?: string;
}

// 恢复结果
export interface RestoreResult {
  success: boolean;
  restoredDataTypes?: string[];
  conflicts?: string[];
  error?: string;
}

// 存储容量信息
export interface StorageCapacity {
  used: number;
  total: number;
  available: number;
  percentage: number;
  warning: boolean;
}

// 所有可备份的数据类型
const BACKUP_DATA_TYPES = [
  'links_data',
  'ynav-widgets-v9', 
  'site_settings',
  'ai_config',
  'ynav-notes',
  'theme',
  'search_config',
  'rss_sources',
  'weather_city',
  'view_password'
];

/**
 * 生成数据校验和
 */
export function generateChecksum(data: any): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

/**
 * 压缩数据
 */
export async function compressData(data: any): Promise<{ compressed: string; ratio: number }> {
  try {
    const str = JSON.stringify(data);
    const compressed = await new Promise<string>((resolve) => {
      // 使用简单的压缩算法 (生产环境建议使用 compression 库)
      const compressed = str
        .replace(/\s+/g, ' ')
        .replace(/"/g, '\\"')
        .replace(/'/g, "\\'");
      resolve(compressed);
    });
    
    const ratio = compressed.length / str.length;
    return { compressed, ratio };
  } catch (error) {
    throw new Error(`压缩失败: ${error}`);
  }
}

/**
 * 解压数据
 */
export async function decompressData(compressed: string): Promise<any> {
  try {
    // 对应的解压算法
    const decompressed = compressed
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\s+/g, ' ');
    
    return JSON.parse(decompressed);
  } catch (error) {
    throw new Error(`解压失败: ${error}`);
  }
}

/**
 * 检查存储容量
 */
export function checkStorageCapacity(): StorageCapacity {
  if (typeof window === 'undefined') {
    return {
      used: 0,
      total: 5 * 1024 * 1024, // 假设5MB限制
      available: 5 * 1024 * 1024,
      percentage: 0,
      warning: false
    };
  }
  
  let used = 0;
  const testKey = 'storage_test_key';
  
  try {
    // 计算当前使用量
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('user_')) {
        const value = localStorage.getItem(key);
        used += new Blob([value || '']).size;
      }
    }
    
    // 测试可用空间
    const testData = 'x'.repeat(1024); // 1KB测试数据
    localStorage.setItem(testKey, testData);
    localStorage.removeItem(testKey);
    
    // 估算总容量 (通常5-10MB)
    const estimated = 5 * 1024 * 1024; // 5MB
    const available = estimated - used;
    const percentage = (used / estimated) * 100;
    
    return {
      used,
      total: estimated,
      available: Math.max(0, available),
      percentage,
      warning: percentage > 80
    };
  } catch (error) {
    // 如果测试失败，可能存储已满
    return {
      used,
      total: 5 * 1024 * 1024,
      available: 0,
      percentage: 100,
      warning: true
    };
  }
}

/**
 * 创建数据备份
 */
export async function createBackup(
  dataTypes?: string[],
  compress = true
): Promise<BackupResult> {
  const userId = getCurrentUserId();
  if (!userId) {
    return { success: false, error: '用户未登录' };
  }
  
  try {
    const backupId = `backup_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const backupData: Record<string, any> = {};
    const includedTypes = dataTypes || BACKUP_DATA_TYPES;
    
    // 收集数据
    for (const dataType of includedTypes) {
      const storageKey = getUserStorageKey(dataType);
      const data = localStorage.getItem(storageKey);
      
      if (data) {
        try {
          backupData[dataType] = JSON.parse(data);
        } catch (error) {
          console.warn(`备份数据 ${dataType} 解析失败:`, error);
        }
      }
    }
    
    // 压缩数据
    let finalData = JSON.stringify(backupData);
    let compressed = false;
    
    if (compress) {
      const { compressed: compressedData } = await compressData(backupData);
      finalData = compressedData;
      compressed = true;
    }
    
    // 生成备份元数据
    const metadata: BackupMetadata = {
      id: backupId,
      userId,
      deviceId: getDeviceId(),
      createdAt: Date.now(),
      size: new Blob([finalData]).size,
      checksum: generateChecksum(backupData),
      version: '1.0.0',
      dataTypes: includedTypes,
      compressed
    };
    
    // 保存备份
    const backupKey = `backup_${backupId}`;
    localStorage.setItem(backupKey, finalData);
    localStorage.setItem(`${backupKey}_meta`, JSON.stringify(metadata));
    
    // 维护备份列表
    const backupsListKey = getUserStorageKey('backups_list');
    const existingBackups = localStorage.getItem(backupsListKey);
    const backups = existingBackups ? JSON.parse(existingBackups) : [];
    backups.push(metadata);
    localStorage.setItem(backupsListKey, JSON.stringify(backups));
    
    return {
      success: true,
      backupId,
      size: metadata.size
    };
  } catch (error) {
    return { 
      success: false, 
      error: `备份失败: ${error}` 
    };
  }
}

/**
 * 获取所有备份列表
 */
export function getBackupsList(): BackupMetadata[] {
  const userId = getCurrentUserId();
  if (!userId) return [];
  
  const backupsListKey = getUserStorageKey('backups_list');
  const backups = localStorage.getItem(backupsListKey);
  
  try {
    return backups ? JSON.parse(backups) : [];
  } catch (error) {
    console.error('获取备份列表失败:', error);
    return [];
  }
}

/**
 * 从备份恢复数据
 */
export async function restoreFromBackup(
  backupId: string,
  dataTypes?: string[]
): Promise<RestoreResult> {
  const userId = getCurrentUserId();
  if (!userId) {
    return { success: false, error: '用户未登录' };
  }
  
  try {
    const backupKey = `backup_${backupId}`;
    const metaKey = `${backupKey}_meta`;
    
    // 获取备份数据和元数据
    const backupData = localStorage.getItem(backupKey);
    const metaDataStr = localStorage.getItem(metaKey);
    
    if (!backupData || !metaDataStr) {
      return { success: false, error: '备份不存在或损坏' };
    }
    
    const metadata: BackupMetadata = JSON.parse(metaDataStr);
    
    // 验证备份完整性
    let actualData: any;
    if (metadata.compressed) {
      actualData = await decompressData(backupData);
    } else {
      actualData = JSON.parse(backupData);
    }
    
    const currentChecksum = generateChecksum(actualData);
    if (currentChecksum !== metadata.checksum) {
      return { success: false, error: '备份数据校验失败' };
    }
    
    // 检查用户权限
    if (metadata.userId !== userId) {
      return { success: false, error: '备份不属于当前用户' };
    }
    
    // 恢复数据
    const targetTypes = dataTypes || metadata.dataTypes;
    const restoredDataTypes: string[] = [];
    const conflicts: string[] = [];
    
    for (const dataType of targetTypes) {
      if (!actualData[dataType]) continue;
      
      const storageKey = getUserStorageKey(dataType);
      const existingData = localStorage.getItem(storageKey);
      
      if (existingData) {
        // 检测冲突
        try {
          const existing = JSON.parse(existingData);
          const existingChecksum = generateChecksum(existing);
          const newChecksum = generateChecksum(actualData[dataType]);
          
          if (existingChecksum !== newChecksum) {
            conflicts.push(dataType);
            continue; // 跳过冲突数据
          }
        } catch (error) {
          conflicts.push(dataType);
          continue;
        }
      }
      
      // 执行恢复
      localStorage.setItem(storageKey, JSON.stringify(actualData[dataType]));
      restoredDataTypes.push(dataType);
    }
    
    return {
      success: true,
      restoredDataTypes,
      conflicts: conflicts.length > 0 ? conflicts : undefined
    };
  } catch (error) {
    return { 
      success: false, 
      error: `恢复失败: ${error}` 
    };
  }
}

/**
 * 删除备份
 */
export function deleteBackup(backupId: string): boolean {
  try {
    const backupKey = `backup_${backupId}`;
    const metaKey = `${backupKey}_meta`;
    const backupsListKey = getUserStorageKey('backups_list');
    
    // 删除备份数据
    localStorage.removeItem(backupKey);
    localStorage.removeItem(metaKey);
    
    // 更新备份列表
    const backups = getBackupsList();
    const filteredBackups = backups.filter(b => b.id !== backupId);
    localStorage.setItem(backupsListKey, JSON.stringify(filteredBackups));
    
    return true;
  } catch (error) {
    console.error('删除备份失败:', error);
    return false;
  }
}

/**
 * 自动备份策略
 */
export async function autoBackup(): Promise<void> {
  const capacity = checkStorageCapacity();
  
  // 容量警告时不自动备份
  if (capacity.warning) {
    console.warn('存储容量不足，跳过自动备份');
    return;
  }
  
  // 检查上次备份时间
  const lastBackupKey = getUserStorageKey('last_auto_backup');
  const lastBackupTime = localStorage.getItem(lastBackupKey);
  const now = Date.now();
  
  // 24小时内已备份则跳过
  if (lastBackupTime && (now - parseInt(lastBackupTime)) < 24 * 60 * 60 * 1000) {
    return;
  }
  
  try {
    const result = await createBackup(undefined, true);
    if (result.success) {
      localStorage.setItem(lastBackupKey, now.toString());
      console.log(`自动备份完成: ${result.backupId}`);
    }
  } catch (error) {
    console.error('自动备份失败:', error);
  }
}

/**
 * 清理旧备份
 */
export function cleanupOldBackups(maxBackups = 10): void {
  try {
    const backups = getBackupsList();
    
    if (backups.length <= maxBackups) {
      return;
    }
    
    // 按时间排序，保留最新的备份
    const sortedBackups = backups.sort((a, b) => b.createdAt - a.createdAt);
    const toDelete = sortedBackups.slice(maxBackups);
    
    for (const backup of toDelete) {
      deleteBackup(backup.id);
    }
    
    console.log(`清理了 ${toDelete.length} 个旧备份`);
  } catch (error) {
    console.error('清理备份失败:', error);
  }
}
