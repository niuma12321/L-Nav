import { useState, useCallback } from 'react';
import { BackupData } from '../components/modals/DataBackupModal';

export interface WebDAVConfig {
  serverUrl: string;
  username: string;
  password: string;
  syncPath: string;
  autoSync: boolean;
  syncInterval: number; // 分钟
}

export interface SyncResult {
  success: boolean;
  message: string;
  direction?: 'upload' | 'download' | 'conflict';
  timestamp?: number;
}

const WEBDAV_CONFIG_KEY = 'ynav:webdav:config:v1';
const WEBDAV_LAST_SYNC_KEY = 'ynav:webdav:lastsync:v1';

export function useWebDAV() {
  const [config, setConfig] = useState<WebDAVConfig | null>(() => {
    try {
      const stored = localStorage.getItem(WEBDAV_CONFIG_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [lastSync, setLastSync] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(WEBDAV_LAST_SYNC_KEY);
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [isSyncing, setIsSyncing] = useState(false);

  const saveConfig = useCallback((newConfig: WebDAVConfig) => {
    localStorage.setItem(WEBDAV_CONFIG_KEY, JSON.stringify(newConfig));
    setConfig(newConfig);
  }, []);

  const clearConfig = useCallback(() => {
    localStorage.removeItem(WEBDAV_CONFIG_KEY);
    setConfig(null);
  }, []);

  // WebDAV 基础请求
  const webDAVRequest = useCallback(async (
    method: string,
    path: string,
    body?: string | Blob,
    headers: Record<string, string> = {}
  ): Promise<Response> => {
    if (!config) throw new Error('WebDAV 未配置');

    const url = `${config.serverUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
    const auth = btoa(`${config.username}:${config.password}`);

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/octet-stream',
        ...headers
      },
      body
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(`WebDAV 请求失败: ${response.status} ${response.statusText}`);
    }

    return response;
  }, [config]);

  // 上传数据到 WebDAV
  const uploadToWebDAV = useCallback(async (data: BackupData): Promise<SyncResult> => {
    if (!config) return { success: false, message: 'WebDAV 未配置' };

    try {
      setIsSyncing(true);

      const filename = 'y-nav-backup.json';
      const path = config.syncPath ? `${config.syncPath}/${filename}` : filename;

      // 将数据转为 Blob
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });

      // 上传到服务器
      const response = await webDAVRequest('PUT', path, blob, {
        'Content-Type': 'application/json'
      });

      if (response.ok) {
        const now = Date.now();
        localStorage.setItem(WEBDAV_LAST_SYNC_KEY, now.toString());
        setLastSync(now);
        return { success: true, message: '上传成功', direction: 'upload', timestamp: now };
      } else {
        return { success: false, message: `上传失败: ${response.statusText}` };
      }
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : '上传失败' 
      };
    } finally {
      setIsSyncing(false);
    }
  }, [config, webDAVRequest]);

  // 从 WebDAV 下载数据
  const downloadFromWebDAV = useCallback(async (): Promise<BackupData | null> => {
    if (!config) return null;

    try {
      setIsSyncing(true);

      const filename = 'y-nav-backup.json';
      const path = config.syncPath ? `${config.syncPath}/${filename}` : filename;

      const response = await webDAVRequest('GET', path);

      if (response.status === 404) {
        return null; // 文件不存在
      }

      if (!response.ok) {
        throw new Error(`下载失败: ${response.statusText}`);
      }

      const text = await response.text();
      const data: BackupData = JSON.parse(text);

      const now = Date.now();
      localStorage.setItem(WEBDAV_LAST_SYNC_KEY, now.toString());
      setLastSync(now);

      return data;
    } catch (error) {
      console.error('WebDAV 下载失败:', error);
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [config, webDAVRequest]);

  // 测试连接
  const testConnection = useCallback(async (testConfig?: WebDAVConfig): Promise<boolean> => {
    const cfg = testConfig || config;
    if (!cfg) return false;

    try {
      const url = `${cfg.serverUrl.replace(/\/$/, '')}/${cfg.syncPath || ''}`;
      const auth = btoa(`${cfg.username}:${cfg.password}`);

      const response = await fetch(url, {
        method: 'PROPFIND',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Depth': '0'
        }
      });

      return response.ok || response.status === 207; // 207 Multi-Status
    } catch {
      return false;
    }
  }, [config]);

  // 创建目录
  const createDirectory = useCallback(async (dirName: string): Promise<boolean> => {
    if (!config) return false;

    try {
      const response = await webDAVRequest('MKCOL', dirName);
      return response.ok || response.status === 405; // 405 表示目录已存在
    } catch {
      return false;
    }
  }, [config, webDAVRequest]);

  return {
    config,
    lastSync,
    isSyncing,
    saveConfig,
    clearConfig,
    uploadToWebDAV,
    downloadFromWebDAV,
    testConnection,
    createDirectory
  };
}

export type UseWebDAVReturn = ReturnType<typeof useWebDAV>;
