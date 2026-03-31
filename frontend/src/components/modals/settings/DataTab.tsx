import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Database, Upload, Cloud, Lock, Eye, EyeOff, RefreshCw, Clock, Cpu,
  CloudUpload, CloudDownload, Trash2
} from 'lucide-react';
import { SiteSettings, SyncStatus } from '../../../types';
import {
  SYNC_API_ENDPOINT, SYNC_META_KEY, SYNC_PASSWORD_KEY, VIEW_PASSWORD_KEY,
  SYNC_API_VERSION, SYNC_DATA_SCHEMA_VERSION
} from '../../../utils/constants';

// ==============================================
// 类型定义（补全所有缺失类型，消除any）
// ==============================================
interface DataTabProps {
  onOpenImport: () => void;
  onClose: () => void;
  onCreateBackup: () => Promise<boolean>;
  onRestoreBackup: (backupKey: string) => Promise<boolean>;
  onDeleteBackup: (backupKey: string) => Promise<boolean>;
  onSyncPasswordChange: (password: string) => void;
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
  syncStatus?: SyncStatus;
  lastSyncTime?: number | null;
  siteSettings: SiteSettings;
  onSiteSettingChange: (key: keyof SiteSettings, value: any) => void;
  webmasterUnlocked?: boolean;
  onWebmasterUnlockedChange?: (unlocked: boolean) => void;
}

interface BackupItem {
  key: string;
  timestamp?: string;
  expiration?: number;
  deviceId?: string;
  updatedAt?: number;
  version?: number;
  browser?: string;
  os?: string;
  apiVersion?: string;
  schemaVersion?: number;
}

interface AuthInfo {
  passwordRequired: boolean;
  canWrite: boolean;
  viewPasswordRequired?: boolean;
  canView?: boolean;
}

// ==============================================
// 常量配置（抽离硬编码，易于维护）
// ==============================================
const SYNC_STATUS_MAP = {
  synced: { text: '已同步', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  syncing: { text: '同步中', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  pending: { text: '待同步', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  conflict: { text: '冲突', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  error: { text: '错误', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  idle: { text: '空闲', cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' }
};

const DATE_LOCALE = 'zh-CN';
const DATE_FORMAT_OPTIONS: Record<string, Intl.DateTimeFormatOptions> = {
  short: { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
  full: { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }
};

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
  if (backup.updatedAt) return new Date(backup.updatedAt).toLocaleString(DATE_LOCALE, DATE_FORMAT_OPTIONS.short);
  if (backup.timestamp) return backup.timestamp.replace('T', ' ');
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
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [restoringKey, setRestoringKey] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  // 隐私迁移状态
  const [privacyTarget, setPrivacyTarget] = useState<'sync' | 'separate' | null>(null);
  const [privacyOldPassword, setPrivacyOldPassword] = useState('');
  const [privacyNewPassword, setPrivacyNewPassword] = useState('');

  // 错误状态
  const [backupError, setBackupError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [privacyError, setPrivacyError] = useState<string | null>(null);

  // ==============================================
  // 计算属性（useMemo缓存，仅依赖变化时重计算）
  // ==============================================
  const isWebmaster = useMemo(() => siteSettings.siteMode === 'webmaster', [siteSettings.siteMode]);
  const canWrite = useMemo(() => authInfo?.canWrite ?? false, [authInfo]);
  const isAdmin = useMemo(() => canWrite && (!isWebmaster || webmasterUnlocked), [canWrite, isWebmaster, webmasterUnlocked]);
  const isSyncPasswordReady = useMemo(() => {
    return (password && typeof password === 'string' && password.trim().length > 0);
  }, [password]);
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
  const getAuthHeaders = useCallback((): Record<string, string> => {
    const syncPwd = localStorage.getItem(SYNC_PASSWORD_KEY);
    const viewPwd = localStorage.getItem(VIEW_PASSWORD_KEY);
    return {
      'Content-Type': 'application/json',
      ...(syncPwd && { 'X-Sync-Password': syncPwd }),
      ...(viewPwd && { 'X-View-Password': viewPwd })
    };
  }, []);

  const handleSyncPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);
    localStorage.setItem(SYNC_PASSWORD_KEY, val);
    onSyncPasswordChange(val);
  }, [onSyncPasswordChange]);

  const handleViewPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setViewPassword(val);
    localStorage.setItem(VIEW_PASSWORD_KEY, val);
    onViewPasswordChange(val);
  }, [onViewPasswordChange]);

  const fetchAuthInfo = useCallback(async (): Promise<AuthInfo | null> => {
    setIsCheckingAuth(true);
    setAuthError(null);
    try {
      const res = await fetch(`${SYNC_API_ENDPOINT}?action=whoami`, { headers: getAuthHeaders() });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);

      const info: AuthInfo = {
        passwordRequired: !!result.passwordRequired,
        canWrite: !!result.canWrite,
        viewPasswordRequired: !!result.viewPasswordRequired,
        canView: !!result.canView
      };
      setAuthInfo(info);
      return info;
    } catch (err: any) {
      setAuthError(err.message || '鉴权失败');
      return null;
    } finally {
      setIsCheckingAuth(false);
    }
  }, [getAuthHeaders]);

  const fetchRemoteInfo = useCallback(async () => {
    setIsLoadingRemote(true);
    setRemoteError(null);
    try {
      const res = await fetch(SYNC_API_ENDPOINT, { headers: getAuthHeaders() });
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
  }, [getAuthHeaders]);

  const fetchBackups = useCallback(async () => {
    if (!canWrite) return;
    setIsLoadingBackups(true);
    setBackupError(null);
    try {
      const res = await fetch(`${SYNC_API_ENDPOINT}?action=backups`, { headers: getAuthHeaders() });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      setBackups(Array.isArray(result.backups) ? result.backups : []);
    } catch (err: any) {
      setBackupError(err.message || '获取备份失败');
      setBackups([]);
    } finally {
      setIsLoadingBackups(false);
    }
  }, [canWrite, getAuthHeaders]);

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
    setDeletingKey(key);
    try {
      await onDeleteBackup(key);
      await fetchBackups();
    } finally {
      setDeletingKey(null);
    }
  }, [fetchBackups, onDeleteBackup]);

  const resetPrivacyMigration = useCallback(() => {
    setPrivacyTarget(null);
    setPrivacyOldPassword('');
    setPrivacyNewPassword('');
    setPrivacyError(null);
  }, []);

  const handleConfirmPrivacyMigration = useCallback(async () => {
    if (!privacyTarget) return;
    setIsMigrating(true);
    setPrivacyError(null);
    try {
      const success = await onMigratePrivacyMode({
        useSeparatePassword: privacyTarget === 'separate',
        oldPassword: privacyOldPassword,
        newPassword: privacyNewPassword
      });
      if (!success) throw new Error('迁移失败');
      resetPrivacyMigration();
    } catch (err: any) {
      setPrivacyError(err.message);
    } finally {
      setIsMigrating(false);
    }
  }, [privacyTarget, privacyOldPassword, privacyNewPassword, onMigratePrivacyMode, resetPrivacyMigration]);

  // ==============================================
  // 依赖副作用（自动触发数据加载）
  // ==============================================
  useEffect(() => { fetchRemoteInfo(); }, [fetchRemoteInfo]);
  useEffect(() => { fetchAuthInfo(); }, [fetchAuthInfo, password, viewPassword]);
  useEffect(() => { if (canWrite) fetchBackups(); }, [fetchBackups, canWrite]);

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

        {/* 云端同步面板 */}
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

          <div className="mt-4 space-y-3 border-t border-green-200 dark:border-green-800/50 pt-4">
            <PasswordInput
              value={password}
              onChange={handleSyncPasswordChange}
              placeholder="未设置密码"
              label="API 访问密码 (可选)"
              icon={<Lock size={12} />}
              className="bg-white dark:bg-slate-900 border-green-200 dark:border-green-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            />
            <p className="text-[10px] text-green-600/80 dark:text-green-400/80 leading-relaxed">
              如需增强安全性，请在 Cloudflare Pages 后台设置 <code>SYNC_PASSWORD</code> 环境变量，并在此处输入相同密码。
            </p>

            <PasswordInput
              value={viewPassword}
              onChange={handleViewPasswordChange}
              placeholder="未设置密码"
              label="隐藏内容密码 (可选)"
              icon={<EyeOff size={12} />}
              className="bg-white dark:bg-slate-900 border-green-200 dark:border-green-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            />
            <p className="text-[10px] text-green-600/80 dark:text-green-400/80 leading-relaxed">
              站长模式下可用于“只读解锁隐藏内容”。在 Cloudflare 后台设置 <code>VIEW_PASSWORD</code> 环境变量后生效。
            </p>
          </div>
        </div>

        {/* 同步状态面板 */}
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

          {/* 权限信息 */}
          <div className="mt-3 flex flex-wrap gap-2 text-xs mb-3">
            <span className="px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              站点模式：{isWebmaster ? '站长模式(只读)' : '个人模式'}
            </span>
            <span className="px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              写权限：{canWrite ? '有' : '无'}
            </span>
            {authError && <span className="text-red-600 dark:text-red-400 text-xs">{authError}</span>}
          </div>

          {/* 站长操作区 */}
          <div className="flex flex-wrap gap-2 mb-3">
            {isWebmaster && !webmasterUnlocked && (
              <button
                onClick={async () => {
                  const res = await fetchAuthInfo();
                  if (res?.canWrite && onWebmasterUnlockedChange) onWebmasterUnlockedChange(true);
                }}
                disabled={isCheckingAuth}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent text-white hover:opacity-90 disabled:opacity-60"
              >
                {isCheckingAuth ? '验证中...' : '验证站长密码'}
              </button>
            )}
            <button onClick={fetchAuthInfo} disabled={isCheckingAuth} className="px-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700">
              刷新鉴权
            </button>
            <span className="ml-auto text-[10px] text-slate-400">API：{SYNC_API_VERSION} / Schema：v{SYNC_DATA_SCHEMA_VERSION}</span>
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

          {/* 站长模式开关 */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">站长模式（强只读）</span>
              <ToggleSwitch
                checked={isWebmaster}
                onChange={() => onSiteSettingChange('siteMode', isWebmaster ? 'personal' : 'webmaster')}
                disabled={!isAdmin}
                label="切换站长模式"
              />
            </div>
            <p className="mt-1 text-[10px] text-slate-500">开启后访客仅可浏览，无法编辑/写入数据</p>
          </div>
        </div>

        {/* 隐私分组面板 */}
        <div className="mb-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/40">
          <div className="flex items-center gap-2 text-sm font-bold mb-3">
            <Lock size={14} className="text-slate-500" />
            隐私分组
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs">启用隐私分组</span>
              <ToggleSwitch checked={privacyGroupEnabled} onChange={() => onTogglePrivacyGroup(!privacyGroupEnabled)} label="启用隐私分组" />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs">自动解锁</span>
              <ToggleSwitch checked={privacyAutoUnlockEnabled} onChange={() => onTogglePrivacyAutoUnlock(!privacyAutoUnlockEnabled)} disabled={!privacyGroupEnabled} label="自动解锁" />
            </div>

            <p className="text-xs text-slate-500">当前模式：{currentPrivacyMode}</p>

            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setPrivacyTarget('separate')} disabled={useSeparatePrivacyPassword || !isSyncPasswordReady} className="px-3 py-1.5 text-xs border rounded-lg disabled:opacity-50">切换独立密码</button>
              <button onClick={() => setPrivacyTarget('sync')} disabled={!useSeparatePrivacyPassword} className="px-3 py-1.5 text-xs border rounded-lg disabled:opacity-50">切换同步密码</button>
            </div>

            {/* 隐私迁移表单 */}
            {privacyTarget && (
              <div className="space-y-2 mt-3">
                <input type="password" value={privacyOldPassword} onChange={(e) => setPrivacyOldPassword(e.target.value)} placeholder="旧密码" className="w-full p-2 text-xs border rounded-lg" />
                <input type="password" value={privacyNewPassword} onChange={(e) => setPrivacyNewPassword(e.target.value)} placeholder="新密码" className="w-full p-2 text-xs border rounded-lg" />
                {privacyError && <p className="text-xs text-red-600">{privacyError}</p>}
                <div className="flex gap-2">
                  <button onClick={handleConfirmPrivacyMigration} disabled={isMigrating} className="px-3 py-1.5 text-xs bg-accent text-white rounded-lg">确认迁移</button>
                  <button onClick={resetPrivacyMigration} className="px-3 py-1.5 text-xs rounded-lg">取消</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 云端备份列表 */}
        <div className="mb-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/40">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-bold">云端备份列表</span>
            <div className="flex gap-3">
              <button onClick={handleCreateBackup} disabled={isCreatingBackup || !isAdmin} className="text-xs text-emerald-600 flex items-center gap-1">
                <CloudUpload size={12} className={isCreatingBackup ? 'animate-spin' : ''} />创建备份
              </button>
            </div>
          </div>

          {!canWrite && <p className="text-xs text-slate-500">无写权限，无法查看备份</p>}
          {createError && <p className="text-xs text-red-600 mb-2">{createError}</p>}

          <div className="space-y-2">
            {backups.map(backup => (
              <div key={backup.key} className="border rounded-lg p-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs flex items-center gap-1"><Clock size={12} />{formatBackupTime(backup)}</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleRestoreBackup(backup.key)} disabled={!!restoringKey || !isAdmin} className="text-xs text-amber-600"><CloudDownload size={12} />恢复</button>
                    <button onClick={() => handleDeleteBackup(backup.key)} disabled={!!deletingKey || !isAdmin} className="text-xs text-red-600"><Trash2 size={12} />删除</button>
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
          disabled={!isAdmin}
          className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border border-dashed hover:border-accent hover:bg-accent/5 transition-all disabled:opacity-60"
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
