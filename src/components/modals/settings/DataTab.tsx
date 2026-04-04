import React, { useState, useEffect } from 'react';
import {
  Database, Upload, Lock, Eye, EyeOff
} from 'lucide-react';
import { SiteSettings } from '../../../types';
import { VIEW_PASSWORD_KEY } from '../../../utils/constants';

// ==============================================
// 类型定义
// ==============================================
interface DataTabProps {
  onOpenImport: () => void;
  onClose: () => void;
  onViewPasswordChange: (password: string) => void;
  useSeparatePrivacyPassword: boolean;
  onMigratePrivacyMode: (payload: {
    useSeparatePassword: boolean;
    oldPassword: string;
    newPassword: string;
  }) => Promise<boolean>;
  privacyGroupEnabled: boolean;
  onTogglePrivacyGroup: (enabled: boolean) => void;
  privacyAutoUnlockEnabled: boolean;
  onTogglePrivacyAutoUnlock: (enabled: boolean) => void;
  siteSettings: SiteSettings;
  onSiteSettingChange: (key: keyof SiteSettings, value: any) => void;
  webmasterUnlocked?: boolean;
  onWebmasterUnlockedChange?: (unlocked: boolean) => void;
}

// ==============================================
// DataTab 组件（已移除同步功能）
// ==============================================
const DataTab: React.FC<DataTabProps> = ({
  onOpenImport,
  onClose,
  onViewPasswordChange,
  useSeparatePrivacyPassword,
  onMigratePrivacyMode,
  privacyGroupEnabled,
  onTogglePrivacyGroup,
  privacyAutoUnlockEnabled,
  onTogglePrivacyAutoUnlock,
  siteSettings,
  onSiteSettingChange,
  webmasterUnlocked,
  onWebmasterUnlockedChange,
}) => {
  // === 本地状态 ===
  const [viewPassword, setViewPassword] = useState('');
  const [showViewPassword, setShowViewPassword] = useState(false);
  const [migrateOldPassword, setMigrateOldPassword] = useState('');
  const [migrateNewPassword, setMigrateNewPassword] = useState('');
  const [showMigrateOld, setShowMigrateOld] = useState(false);
  const [showMigrateNew, setShowMigrateNew] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrateError, setMigrateError] = useState<string | null>(null);

  // === 初始化加载 ===
  useEffect(() => {
    const saved = localStorage.getItem(VIEW_PASSWORD_KEY);
    if (saved) setViewPassword(saved);
  }, []);

  // === 查看密码管理 ===
  const handleSaveViewPassword = () => {
    if (!viewPassword.trim()) {
      localStorage.removeItem(VIEW_PASSWORD_KEY);
      onViewPasswordChange('');
      alert('查看密码已清除');
      return;
    }
    localStorage.setItem(VIEW_PASSWORD_KEY, viewPassword);
    onViewPasswordChange(viewPassword);
    alert('查看密码已保存');
  };

  // === 隐私模式迁移 ===
  const handleMigrate = async () => {
    setMigrateError(null);
    if (!migrateOldPassword || !migrateNewPassword) {
      setMigrateError('请填写两个密码');
      return;
    }
    setIsMigrating(true);
    try {
      const success = await onMigratePrivacyMode({
        useSeparatePassword: !useSeparatePrivacyPassword,
        oldPassword: migrateOldPassword,
        newPassword: migrateNewPassword,
      });
      if (success) {
        setMigrateOldPassword('');
        setMigrateNewPassword('');
        alert(useSeparatePrivacyPassword ? '已切换为统一密码' : '已切换为独立密码');
      } else {
        setMigrateError('密码验证失败，请重试');
      }
    } catch {
      setMigrateError('迁移失败，请重试');
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="space-y-6 p-1">
      {/* === 导入/导出 === */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Database className="w-4 h-4" />
          数据管理
        </h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onOpenImport}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            导入/导出
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          所有数据仅保存在本地浏览器中
        </p>
      </section>

      {/* === 查看密码设置 === */}
      <section className="space-y-3 border-t border-slate-200 dark:border-slate-700 pt-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Eye className="w-4 h-4" />
          查看密码（用于只读模式解锁）
        </h3>
        <div className="space-y-2">
          <div className="relative">
            <input
              type={showViewPassword ? 'text' : 'password'}
              value={viewPassword}
              onChange={(e) => setViewPassword(e.target.value)}
              placeholder="设置查看密码（可选）"
              className="w-full px-3 py-2 pr-10 text-sm border border-slate-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
            <button
              onClick={() => setShowViewPassword(!showViewPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              {showViewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <button
            onClick={handleSaveViewPassword}
            className="px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600"
          >
            保存查看密码
          </button>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            设置查看密码后，访客需要输入密码才能查看隐藏链接
          </p>
        </div>
      </section>

      {/* === 隐私分组设置 === */}
      <section className="space-y-3 border-t border-slate-200 dark:border-slate-700 pt-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Lock className="w-4 h-4" />
          隐私分组设置
        </h3>

        {/* 启用隐私分组 */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={privacyGroupEnabled}
            onChange={(e) => onTogglePrivacyGroup(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300">启用隐私分组</span>
        </label>

        {/* 自动解锁 */}
        {privacyGroupEnabled && (
          <label className="flex items-center gap-2 cursor-pointer ml-6">
            <input
              type="checkbox"
              checked={privacyAutoUnlockEnabled}
              onChange={(e) => onTogglePrivacyAutoUnlock(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">会话内自动解锁</span>
          </label>
        )}

        {/* 密码模式切换 */}
        {privacyGroupEnabled && (
          <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-md space-y-3">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              当前模式: {useSeparatePrivacyPassword ? '独立密码' : '与查看密码一致'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {useSeparatePrivacyPassword
                ? '隐私分组使用独立的密码，更安全'
                : '隐私分组使用与查看密码相同的密码'}
            </p>

            <div className="space-y-2">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                切换到{useSeparatePrivacyPassword ? '统一密码' : '独立密码'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <input
                    type={showMigrateOld ? 'text' : 'password'}
                    value={migrateOldPassword}
                    onChange={(e) => setMigrateOldPassword(e.target.value)}
                    placeholder={useSeparatePrivacyPassword ? '当前独立密码' : '当前查看密码'}
                    className="w-full px-3 py-2 pr-8 text-sm border border-slate-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                  <button
                    onClick={() => setShowMigrateOld(!showMigrateOld)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showMigrateOld ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showMigrateNew ? 'text' : 'password'}
                    value={migrateNewPassword}
                    onChange={(e) => setMigrateNewPassword(e.target.value)}
                    placeholder={useSeparatePrivacyPassword ? '查看密码' : '新独立密码'}
                    className="w-full px-3 py-2 pr-8 text-sm border border-slate-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                  <button
                    onClick={() => setShowMigrateNew(!showMigrateNew)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showMigrateNew ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                </div>
              </div>
              {migrateError && <p className="text-xs text-red-500">{migrateError}</p>}
              <button
                onClick={handleMigrate}
                disabled={isMigrating}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isMigrating ? '切换中...' : '确认切换'}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default DataTab;
// ==============================================
interface DataTabProps {
  onOpenImport: () => void;
  onClose: () => void;
  onViewPasswordChange: (password: string) => void;
  useSeparatePrivacyPassword: boolean;
  onMigratePrivacyMode: (payload: {
    useSeparatePassword: boolean;
    oldPassword: string;
    newPassword: string;
  }) => Promise<boolean>;
  privacyGroupEnabled: boolean;
  onTogglePrivacyGroup: (enabled: boolean) => void;
  privacyAutoUnlockEnabled: boolean;
  onTogglePrivacyAutoUnlock: (enabled: boolean) => void;
  siteSettings: SiteSettings;
  onSiteSettingChange: (key: keyof SiteSettings, value: any) => void;
  webmasterUnlocked?: boolean;
  onWebmasterUnlockedChange?: (unlocked: boolean) => void;
}

// ==============================================
// 复用子组件（抽离重复UI，统一设计语言）
// ==============================================
const ToggleSwitch = React.memo(({
  checked,
  onChange,
  disabled = false,
  label
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  label: string;
}) => (
  <button
    type="button"
    onClick={onChange}
    disabled={disabled}
    aria-pressed={checked}
    aria-label={label}
    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-300
      ${checked ? 'bg-accent' : 'bg-slate-200 dark:bg-slate-700'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-300
        ${checked ? 'translate-x-5' : 'translate-x-1'}`}
    />
  </button>
));

const PasswordInput = React.memo(({
  value,
  onChange,
  placeholder,
  label,
  icon,
  className = ''
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  label: string;
  icon: React.ReactNode;
  className?: string;
}) => {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold flex items-center gap-1.5 dark:text-green-200">
        {icon} {label}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full pl-3 pr-10 py-2 rounded-lg text-sm border transition-all outline-none ${className}`}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
});

const StatusBadge = React.memo(({ status }: { status: SyncStatus }) => {
  const { text, cls } = SYNC_STATUS_MAP[status];
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cls}`}>{text}</span>
  );
});

// ==============================================
// 工具函数（纯函数+缓存，无副作用）
// ==============================================
const formatSyncTime = (ts?: number | null): string => {
  if (!ts) return '未同步';
  return new Date(ts).toLocaleString(DATE_LOCALE, DATE_FORMAT_OPTIONS.full);
};

const formatDeviceLabel = (deviceId?: string, browser?: string, os?: string): string => {
  if (browser && os) return `${browser} • ${os}`;
  if (!deviceId) return '未知设备';

  const parts = deviceId.split('_');
  if (parts.length >= 3 && parts[0] === 'device') {
    const timestamp = Number(parts[1]);
    if (!Number.isNaN(timestamp)) {
      return `设备 ${new Date(timestamp).toLocaleString(DATE_LOCALE, DATE_FORMAT_OPTIONS.short)}`;
    }
  }
  return deviceId;
};

const formatBackupTime = (backup: BackupItem): string => {
  if (backup.updatedAt && typeof backup.updatedAt === 'number') {
    try {
      return new Date(backup.updatedAt).toLocaleString(DATE_LOCALE, DATE_FORMAT_OPTIONS.short);
    } catch {
      return '时间格式错误';
    }
  }
  if (backup.timestamp && typeof backup.timestamp === 'string') {
    return backup.timestamp.replace('T', ' ');
  }
  return '未知时间';
};

// ==============================================
// 核心组件（缓存优化，顶级性能）
// ==============================================
const DataTab: React.FC<DataTabProps> = React.memo(({
  onOpenImport,
  onClose,
  onCreateBackup,
  onRestoreBackup,
  onDeleteBackup,
  onSyncPasswordChange,
  onViewPasswordChange,
  useSeparatePrivacyPassword,
  onMigratePrivacyMode,
  privacyGroupEnabled,
  onTogglePrivacyGroup,
  privacyAutoUnlockEnabled,
  onTogglePrivacyAutoUnlock,
  syncStatus = 'idle',
  lastSyncTime = null,
  siteSettings,
  onSiteSettingChange,
  webmasterUnlocked = false,
  onWebmasterUnlockedChange
}) => {
  const { confirm } = useDialog();
  // ==============================================
  // 状态管理（精简分组，无冗余）
  // ==============================================
  const [password, setPassword] = useState('');
  const [viewPassword, setViewPassword] = useState('');
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [localMeta, setLocalMeta] = useState<any | null>(null);
  const [remoteInfo, setRemoteInfo] = useState<{
    apiVersion?: string; schemaVersion?: number; meta?: any
  } | null>(null);
  const [authInfo, setAuthInfo] = useState<AuthInfo | null>(null);

  // 加载/错误状态
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [isLoadingRemote, setIsLoadingRemote] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [restoringKey, setRestoringKey] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  // 错误状态
  const [backupError, setBackupError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [remoteError, setRemoteError] = useState<string | null>(null);

  // 计算属性（useMemo缓存，仅依赖变化时重计算）
  // ==============================================
  const currentPrivacyMode = useMemo(() => useSeparatePrivacyPassword ? '独立密码' : '同步密码', [useSeparatePrivacyPassword]);

  // ==============================================
  // 初始化副作用（合并依赖，精简逻辑）
  // ==============================================
  useEffect(() => {
    setPassword(localStorage.getItem(SYNC_PASSWORD_KEY) || '');
    setViewPassword(localStorage.getItem(VIEW_PASSWORD_KEY) || '');
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SYNC_META_KEY);
      setLocalMeta(stored ? JSON.parse(stored) : null);
    } catch {
      setLocalMeta(null);
    }
  }, [syncStatus, lastSyncTime]);

  // ==============================================
  // 核心回调（useCallback缓存，无重复创建）
  // ==============================================
  const fetchRemoteInfo = useCallback(async () => {
    setIsLoadingRemote(true);
    setRemoteError(null);
    try {
      const res = await fetch(SYNC_API_ENDPOINT);
      const result = await res.json();
      if (!result.success) throw new Error(result.error);

      setRemoteInfo({
        apiVersion: result.apiVersion,
        schemaVersion: result.data?.schemaVersion,
        meta: result.data?.meta
      });
    } catch (err: any) {
      setRemoteError(err.message || '获取云端状态失败');
    } finally {
      setIsLoadingRemote(false);
    }
  }, []);

  const fetchBackups = useCallback(async () => {
    setIsLoadingBackups(true);
    setBackupError(null);
    try {
      const res = await fetch(`${SYNC_API_ENDPOINT}?action=backups`);
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      setBackups(Array.isArray(result.backups) ? result.backups : []);
    } catch (err: any) {
      setBackupError(err.message || '获取备份失败');
      setBackups([]);
    } finally {
      setIsLoadingBackups(false);
    }
  }, []);

  const handleCreateBackup = useCallback(async () => {
    setIsCreatingBackup(true);
    setCreateError(null);
    try {
      const success = await onCreateBackup();
      if (!success) throw new Error('备份失败');
      await fetchBackups();
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setIsCreatingBackup(false);
    }
  }, [fetchBackups, onCreateBackup]);

  const handleRestoreBackup = useCallback(async (key: string) => {
    setRestoringKey(key);
    try {
      await onRestoreBackup(key);
      await fetchBackups();
    } finally {
      setRestoringKey(null);
    }
  }, [fetchBackups, onRestoreBackup]);

  const handleDeleteBackup = useCallback(async (key: string) => {
    const shouldDelete = await confirm({
      title: '删除备份',
      message: '确定要删除这个备份吗？此操作不可恢复。',
      confirmText: '删除',
      cancelText: '取消',
      variant: 'danger'
    });
    if (!shouldDelete) return;
    
    setDeletingKey(key);
    try {
      await onDeleteBackup(key);
      await fetchBackups();
    } finally {
      setDeletingKey(null);
    }
  }, [fetchBackups, onDeleteBackup, confirm]);

  const handleDeleteAllBackups = useCallback(async () => {
    const shouldDelete = await confirm({
      title: '删除全部备份',
      message: `确定要删除全部 ${backups.length} 个备份吗？此操作不可恢复。`,
      confirmText: '全部删除',
      cancelText: '取消',
      variant: 'danger'
    });
    if (!shouldDelete) return;
    
    let deletedCount = 0;
    for (const backup of backups) {
      if (backup.key) {
        try {
          await onDeleteBackup(backup.key);
          deletedCount++;
        } catch {
          // 继续删除其他备份
        }
      }
    }
    await fetchBackups();
  }, [backups, fetchBackups, onDeleteBackup, confirm]);

  // ==============================================
  // 依赖副作用（自动触发数据加载）
  // ==============================================
  useEffect(() => { fetchRemoteInfo(); }, [fetchRemoteInfo]);
  useEffect(() => { fetchBackups(); }, [fetchBackups]);

  // ==============================================
  // 主渲染
  // ==============================================
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
          <Database size={16} className="text-slate-500" />
          数据管理 (Data Management)
        </h4>

        {/* 云端同步面板 - 简化版 */}
        <div className="mb-4 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3">
            <Cloud className="w-5 h-5 text-green-600 dark:text-green-400" />
            <div className="flex-1">
              <div className="font-medium text-green-700 dark:text-green-300">云端自动同步已启用</div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                数据变更会自动同步到 Cloudflare KV，多端实时同步
              </div>
            </div>
          </div>
        </div>

        {/* 同步状态面板 - 简化版 */}
        <div className="mb-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/40 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
              <Cloud size={14} className="text-slate-500" />
              同步状态
            </div>
            <button
              onClick={fetchRemoteInfo}
              disabled={isLoadingRemote}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-accent transition-colors"
            >
              <RefreshCw size={12} className={isLoadingRemote ? 'animate-spin' : ''} />
              刷新
            </button>
          </div>

          {/* 本地/云端状态卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div className="rounded-lg border p-3 bg-slate-50/60 dark:bg-slate-800/40">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-600 dark:text-slate-400">本地</span>
                <StatusBadge status={syncStatus} />
              </div>
              <div className="text-xs space-y-1 dark:text-slate-200">
                <p>最后同步：{formatSyncTime(lastSyncTime)}</p>
                <p>Revision：{localMeta?.version ?? '-'}</p>
                <p>设备：{formatDeviceLabel(localMeta?.deviceId, localMeta?.browser, localMeta?.os)}</p>
              </div>
            </div>

            <div className="rounded-lg border p-3 bg-slate-50/60 dark:bg-slate-800/40">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-600 dark:text-slate-400">云端</span>
              </div>
              <div className="text-xs space-y-1 dark:text-slate-200">
                {remoteError ? <p className="text-red-600">{remoteError}</p> : (
                  <>
                    <p>Revision：{remoteInfo?.meta?.version ?? '-'}</p>
                    <p>Schema：{remoteInfo?.schemaVersion ? `v${remoteInfo.schemaVersion}` : '-'}</p>
                    <p>设备：{formatDeviceLabel(remoteInfo?.meta?.deviceId)}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 云端备份列表 */}
        <div className="mb-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/40">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-bold">云端备份列表{backups.length > 0 && ` (${backups.length}个)`}</span>
            <div className="flex gap-3">
              <button onClick={handleCreateBackup} disabled={isCreatingBackup} className="text-xs text-emerald-600 flex items-center gap-1">
                <CloudUpload size={12} className={isCreatingBackup ? 'animate-spin' : ''} />创建备份
              </button>
              {backups.length > 0 && (
                <button onClick={handleDeleteAllBackups} disabled={!!deletingKey} className="text-xs text-red-600 flex items-center gap-1">
                  <Trash size={12} />全部删除
                </button>
              )}
            </div>
          </div>

          {createError && <p className="text-xs text-red-600 mb-2">{createError}</p>}

          <div className="space-y-2">
            {backups.map(backup => (
              <div key={backup.key} className="border rounded-lg p-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs flex items-center gap-1"><Clock size={12} />{formatBackupTime(backup)}</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleRestoreBackup(backup.key)} disabled={!!restoringKey} className="text-xs text-amber-600"><CloudDownload size={12} />恢复</button>
                    <button onClick={() => handleDeleteBackup(backup.key)} disabled={!!deletingKey} className="text-xs text-red-600"><Trash2 size={12} />删除</button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Cpu size={12} />{formatDeviceLabel(backup.deviceId, backup.browser, backup.os)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 导入数据按钮 */}
        <button
          onClick={() => { onOpenImport(); onClose(); }}
          className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border border-dashed hover:border-accent hover:bg-accent/5 transition-all"
        >
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Upload size={24} />
          </div>
          <div className="text-center">
            <div className="font-bold">导入数据</div>
            <div className="text-xs text-slate-500 mt-1">支持书签/JSON格式导入</div>
          </div>
        </button>
      </div>
    </div>
  );
});

export default DataTab;
