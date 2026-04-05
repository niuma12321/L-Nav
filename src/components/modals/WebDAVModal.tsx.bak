import React, { useState } from 'react';
import { X, Server, TestTube, Save, Trash2, Cloud, CloudOff, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { WebDAVConfig, SyncResult } from '../../hooks/useWebDAV';

interface WebDAVModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: WebDAVConfig | null;
  onSave: (config: WebDAVConfig) => void;
  onClear: () => void;
  lastSync: number;
  isSyncing: boolean;
  onTest: (config: WebDAVConfig) => Promise<boolean>;
  onSync: (direction: 'upload' | 'download') => Promise<SyncResult>;
}

const WebDAVModal: React.FC<WebDAVModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
  onClear,
  lastSync,
  isSyncing,
  onTest,
  onSync
}) => {
  const [formData, setFormData] = useState<WebDAVConfig>({
    serverUrl: config?.serverUrl || '',
    username: config?.username || '',
    password: config?.password || '',
    syncPath: config?.syncPath || 'y-nav',
    autoSync: config?.autoSync || false,
    syncInterval: config?.syncInterval || 30
  });
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [syncStatus, setSyncStatus] = useState<SyncResult | null>(null);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTestStatus('testing');
    const success = await onTest(formData);
    setTestStatus(success ? 'success' : 'error');
    setTimeout(() => setTestStatus('idle'), 3000);
  };

  const handleSave = () => {
    onSave(formData);
  };

  const handleSync = async (direction: 'upload' | 'download') => {
    const result = await onSync(direction);
    setSyncStatus(result);
    setTimeout(() => setSyncStatus(null), 5000);
  };

  const formatLastSync = (timestamp: number) => {
    if (!timestamp) return '从未同步';
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <Server className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">WebDAV 同步</h2>
              <p className="text-sm text-slate-500">配置您的 WebDAV 服务器实现跨设备同步</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* 连接状态 */}
          {config && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <Cloud className="w-5 h-5 text-blue-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">已配置 WebDAV</p>
                <p className="text-xs text-slate-500">上次同步: {formatLastSync(lastSync)}</p>
              </div>
              {isSyncing && <Loader className="w-5 h-5 animate-spin text-blue-500" />}
            </div>
          )}

          {/* 表单 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                服务器地址
              </label>
              <input
                type="url"
                value={formData.serverUrl}
                onChange={(e) => setFormData({ ...formData, serverUrl: e.target.value })}
                placeholder="https://dav.example.com"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700
                         bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300
                         focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  用户名
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700
                           bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300
                           focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  密码
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700
                           bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300
                           focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                同步路径
              </label>
              <input
                type="text"
                value={formData.syncPath}
                onChange={(e) => setFormData({ ...formData, syncPath: e.target.value })}
                placeholder="y-nav"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700
                         bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300
                         focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-slate-500">数据将保存在此目录下</p>
            </div>

            {/* 测试状态 */}
            {testStatus !== 'idle' && (
              <div className={`flex items-center gap-2 p-3 rounded-lg text-sm
                ${testStatus === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 
                  testStatus === 'error' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                  'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'}`}>
                {testStatus === 'testing' ? <Loader className="w-4 h-4 animate-spin" /> :
                 testStatus === 'success' ? <CheckCircle className="w-4 h-4" /> :
                 <AlertCircle className="w-4 h-4" />}
                <span>
                  {testStatus === 'testing' ? '正在测试连接...' :
                   testStatus === 'success' ? '连接测试成功！' :
                   '连接测试失败，请检查配置'}
                </span>
              </div>
            )}

            {/* 同步状态 */}
            {syncStatus && (
              <div className={`flex items-center gap-2 p-3 rounded-lg text-sm
                ${syncStatus.success ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 
                  'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
                {syncStatus.success ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{syncStatus.message}</span>
              </div>
            )}
          </div>

          {/* 按钮组 */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleTest}
              disabled={testStatus === 'testing'}
              className="flex items-center gap-2 px-4 py-2 rounded-lg
                       border border-slate-200 dark:border-slate-700
                       text-slate-700 dark:text-slate-300
                       hover:bg-slate-50 dark:hover:bg-slate-800
                       disabled:opacity-50 transition-colors"
            >
              <TestTube className="w-4 h-4" />
              测试连接
            </button>
            
            <div className="flex-1" />
            
            {config && (
              <>
                <button
                  onClick={() => handleSync('download')}
                  disabled={isSyncing}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg
                           bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300
                           hover:bg-slate-200 dark:hover:bg-slate-700
                           disabled:opacity-50 transition-colors"
                >
                  <Cloud className="w-4 h-4" />
                  拉取
                </button>
                <button
                  onClick={() => handleSync('upload')}
                  disabled={isSyncing}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg
                           bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300
                           hover:bg-slate-200 dark:hover:bg-slate-700
                           disabled:opacity-50 transition-colors"
                >
                  <CloudOff className="w-4 h-4" />
                  推送
                </button>
              </>
            )}
            
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 rounded-lg
                       bg-blue-500 text-white hover:bg-blue-600
                       transition-colors"
            >
              <Save className="w-4 h-4" />
              保存
            </button>
          </div>

          {config && (
            <button
              onClick={onClear}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg
                       border border-red-200 dark:border-red-800
                       text-red-600 dark:text-red-400
                       hover:bg-red-50 dark:hover:bg-red-900/20
                       transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              清除配置
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebDAVModal;
