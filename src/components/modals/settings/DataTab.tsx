import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  Upload,
  Lock,
  Eye,
  EyeOff,
  X,
  AlertCircle,
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
