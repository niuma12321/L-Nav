import React, { useState } from 'react';
import { X, ChevronRight, Globe, Bot, Palette, Database, Trash2, AlertTriangle } from '@/utils/icons';

interface MobileSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  siteTitle: string;
  onSiteTitleChange: (title: string) => void;
  siteIcon: string;
  onSiteIconChange: (icon: string) => void;
  clickMaskToClose: boolean;
  onClickMaskToCloseChange: (value: boolean) => void;
  onDeleteWorkspace: () => void;
}

type TabId = 'website' | 'ai' | 'appearance' | 'data';

const tabs = [
  { id: 'website' as TabId, label: 'Website', icon: Globe },
  { id: 'ai' as TabId, label: 'AI', icon: Bot },
  { id: 'appearance' as TabId, label: 'Appearance', icon: Palette },
  { id: 'data' as TabId, label: 'Data', icon: Database },
];

const iconColors = [
  { color: '#34d399', label: 'Emerald' },
  { color: '#60a5fa', label: 'Blue' },
  { color: '#2dd4bf', label: 'Teal' },
  { color: '#f87171', label: 'Red' },
  { color: '#1e2127', label: 'Dark' },
  { color: '#0e7490', label: 'Cyan' },
];

const MobileSettings: React.FC<MobileSettingsProps> = ({
  isOpen,
  onClose,
  siteTitle,
  onSiteTitleChange,
  siteIcon,
  onSiteIconChange,
  clickMaskToClose,
  onClickMaskToCloseChange,
  onDeleteWorkspace
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('website');
  const [localTitle, setLocalTitle] = useState(siteTitle);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = () => {
    onSiteTitleChange(localTitle);
    onClose();
  };

  const renderWebsiteTab = () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <label className="text-sm font-medium text-white">Site Title</label>
        <input
          type="text"
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          className="w-full px-4 py-3.5 bg-black rounded-2xl text-white border border-white/10 focus:border-emerald-500/50 outline-none"
        />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-white">Site Icon</label>
        <div className="flex items-center gap-4">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl border-2 border-white/10"
            style={{ backgroundColor: siteIcon }}
          >
            <Globe className="w-7 h-7 text-white" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {iconColors.map((opt) => (
              <button
                key={opt.color}
                onClick={() => onSiteIconChange(opt.color)}
                className={`w-10 h-10 rounded-xl border-2 transition-all ${siteIcon === opt.color ? 'border-white scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: opt.color }}
              />
            ))}
            <button className="w-10 h-10 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center text-white/50">
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 bg-[#1e2127] rounded-2xl border border-white/5">
        <div>
          <h3 className="font-medium text-white">Click mask to close</h3>
          <p className="text-sm text-slate-400 mt-0.5">Close the navigation panel by clicking outside.</p>
        </div>
        <button
          onClick={() => onClickMaskToCloseChange(!clickMaskToClose)}
          className={`w-12 h-7 rounded-full transition-colors ${clickMaskToClose ? 'bg-emerald-500' : 'bg-slate-700'}`}
        >
          <div className={`w-5 h-5 rounded-full bg-white transition-transform ${clickMaskToClose ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>
    </div>
  );

  const renderDataTab = () => (
    <div className="space-y-6">
      <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-400">Delete Workspace</h3>
            <p className="text-sm text-slate-400 mt-1">This action cannot be undone. All data will be permanently removed.</p>
          </div>
        </div>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="mt-4 w-full py-3 rounded-xl bg-red-500/20 text-red-400 font-medium flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Delete Workspace
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[110] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#1e2127] rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-white mb-2">Are you sure?</h3>
            <p className="text-sm text-slate-400 mb-6">This will permanently delete all your links, categories, and settings.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 text-white font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteWorkspace();
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAITab = () => (
    <div className="space-y-6">
      <div className="p-4 bg-[#1e2127] rounded-2xl border border-white/5">
        <h3 className="font-medium text-white mb-2">AI Assistant</h3>
        <p className="text-sm text-slate-400">Configure your AI assistant settings here.</p>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#0d0e10]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0d0e10]/95 backdrop-blur-xl border-b border-white/5 px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose} className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-white">Settings</h1>
          <div className="w-10" />
        </div>
        <p className="text-sm text-slate-400">Configure your workspace and preferences.</p>
      </div>

      {/* Tabs */}
      <div className="px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm whitespace-nowrap
                  transition-all duration-200
                  ${activeTab === tab.id
                    ? 'bg-emerald-500 text-white'
                    : 'bg-[#1e2127] text-slate-400 border border-white/5'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-32">
        {activeTab === 'website' && renderWebsiteTab()}
        {activeTab === 'appearance' && renderAppearanceTab()}
        {activeTab === 'data' && renderDataTab()}
        {activeTab === 'ai' && renderAITab()}
      </div>

      {/* Save Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0d0e10] border-t border-white/5 p-4 pb-safe">
        <button
          onClick={handleSave}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold text-lg shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default MobileSettings;
