import React, { useState, useEffect } from 'react';
import { X, Save, Bot, Globe, Palette, Database } from '@/utils/icons';
import { AIConfig, LinkItem, SiteSettings } from '../../types';
import SiteTab from './settings/SiteTab';
import AITab from './settings/AITab';
import AppearanceTab from './settings/AppearanceTab';
import DataTab from './settings/DataTab';
import DataManagementSection from '../settings/DataManagementSection';
import { getData, setData } from '../../utils/constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AIConfig;
  siteSettings: SiteSettings;
  onSave: (config: AIConfig, siteSettings: SiteSettings) => void;
  links: LinkItem[];
  onUpdateLinks: (links: LinkItem[]) => void;
  onOpenImport: () => void;
  onViewPasswordChange: (password: string) => void;
  useSeparatePrivacyPassword: boolean;
  onMigratePrivacyMode: (payload: { useSeparatePassword: boolean; oldPassword: string; newPassword: string }) => Promise<boolean>;
  privacyGroupEnabled: boolean;
  onTogglePrivacyGroup: (enabled: boolean) => void;
  privacyAutoUnlockEnabled: boolean;
  onTogglePrivacyAutoUnlock: (enabled: boolean) => void;
  webmasterUnlocked?: boolean;
  onWebmasterUnlockedChange?: (unlocked: boolean) => void;
  readOnly?: boolean;
  closeOnBackdrop?: boolean;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  siteSettings,
  onSave,
  links,
  onUpdateLinks,
  onOpenImport,
  onViewPasswordChange,
  useSeparatePrivacyPassword,
  onMigratePrivacyMode,
  privacyGroupEnabled,
  onTogglePrivacyGroup,
  privacyAutoUnlockEnabled,
  onTogglePrivacyAutoUnlock,
  webmasterUnlocked,
  onWebmasterUnlockedChange,
  readOnly = false,
  closeOnBackdrop = true
}) => {
  const [activeTab, setActiveTab] = useState<'site' | 'ai' | 'appearance' | 'data'>(() => {
    return getData('settings_active_tab', 'site');
  });

  // 持久化 activeTab 到用户维度存储
  useEffect(() => {
    setData('settings_active_tab', activeTab);
  }, [activeTab]);

  const [localConfig, setLocalConfig] = useState<AIConfig>(config);
  const [localSiteSettings, setLocalSiteSettings] = useState<SiteSettings>(() => ({
    title: siteSettings?.title || '元启 - AI 智能导航',
    navTitle: siteSettings?.navTitle || '元启',
    favicon: siteSettings?.favicon || '',
    cardStyle: siteSettings?.cardStyle || 'detailed',
    siteMode: siteSettings?.siteMode || 'personal',
    accentColor: siteSettings?.accentColor || '99 102 241',
    grayScale: siteSettings?.grayScale || 'slate',
    closeOnBackdrop: siteSettings?.closeOnBackdrop ?? false,
    backgroundImage: siteSettings?.backgroundImage || '',
    backgroundImageEnabled: siteSettings?.backgroundImageEnabled ?? false,
    backgroundMotion: siteSettings?.backgroundMotion ?? false,
    backgroundSource: siteSettings?.backgroundSource || 'custom',
    bingAutoUpdate: siteSettings?.bingAutoUpdate ?? false,
    bingLastUpdate: siteSettings?.bingLastUpdate
  }));

  useEffect(() => {
    if (isOpen) {
      setLocalConfig(config);
      setLocalSiteSettings({
        title: siteSettings?.title || '元启 - AI 智能导航',
        navTitle: siteSettings?.navTitle || '元启',
        favicon: siteSettings?.favicon || '',
        cardStyle: siteSettings?.cardStyle || 'detailed',
        siteMode: siteSettings?.siteMode || 'personal',
        accentColor: siteSettings?.accentColor || '99 102 241',
        grayScale: siteSettings?.grayScale || 'slate',
        closeOnBackdrop: siteSettings?.closeOnBackdrop ?? false,
        backgroundImage: siteSettings?.backgroundImage || '',
        backgroundImageEnabled: siteSettings?.backgroundImageEnabled ?? false,
        backgroundMotion: siteSettings?.backgroundMotion ?? false,
        backgroundSource: siteSettings?.backgroundSource || 'custom',
        bingAutoUpdate: siteSettings?.bingAutoUpdate ?? false,
        bingLastUpdate: siteSettings?.bingLastUpdate
      });
    }
  }, [isOpen, config, siteSettings]);

  const handleChange = (key: keyof AIConfig, value: string) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSiteChange = (key: keyof SiteSettings, value: any) => {
    setLocalSiteSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (readOnly) return;
    onSave(localConfig, localSiteSettings);
    onClose();
  };

  const handleBackdropClick = () => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="w-full max-w-2xl mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 dark:border-slate-800/50 shrink-0">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            设置
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Tabs - Centered Segmented Control */}
        <div className="px-6 pt-6 shrink-0">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab('site')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'site'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
            >
              <Globe size={16} />
              <span>网站设置</span>
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'ai'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
            >
              <Bot size={16} />
              <span>AI 助手</span>
            </button>
            <button
              onClick={() => setActiveTab('appearance')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'appearance'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
            >
              <Palette size={16} />
              <span>外观</span>
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'data'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
            >
              <Database size={16} />
              <span>数据</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {activeTab === 'site' && (
            <SiteTab settings={localSiteSettings} onChange={handleSiteChange} />
          )}

          {activeTab === 'ai' && (
            <AITab
              config={localConfig}
              onChange={handleChange}
              links={links}
              onUpdateLinks={onUpdateLinks}
            />
          )}

          {activeTab === 'appearance' && (
            <AppearanceTab settings={localSiteSettings} onChange={handleSiteChange} />
          )}

          {activeTab === 'data' && (
            <>
              <DataTab
                onOpenImport={onOpenImport}
                onClose={onClose}
                onViewPasswordChange={onViewPasswordChange}
                useSeparatePrivacyPassword={useSeparatePrivacyPassword}
                onMigratePrivacyMode={onMigratePrivacyMode}
                privacyGroupEnabled={privacyGroupEnabled}
                onTogglePrivacyGroup={onTogglePrivacyGroup}
                privacyAutoUnlockEnabled={privacyAutoUnlockEnabled}
                onTogglePrivacyAutoUnlock={onTogglePrivacyAutoUnlock}
                siteSettings={localSiteSettings}
                onSiteSettingChange={handleSiteChange}
                webmasterUnlocked={webmasterUnlocked}
                onWebmasterUnlockedChange={onWebmasterUnlockedChange}
              />
              <div className="mt-6">
                <DataManagementSection />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-2 border-t border-transparent shrink-0">
          <button
            onClick={handleSave}
            disabled={readOnly}
            title={readOnly ? '站长模式：访客只读，需验证站长密码后才能保存' : undefined}
            className="w-full bg-slate-900 dark:bg-emerald-500 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-slate-800 dark:hover:bg-emerald-400 transition-all shadow-lg shadow-slate-200 dark:shadow-none active:scale-[0.99] text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            <span>保存设置</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
