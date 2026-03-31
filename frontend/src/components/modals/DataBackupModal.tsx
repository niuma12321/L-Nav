import React, { useState, useRef } from 'react';
import { X, Download, Upload, Database, AlertCircle, Check, FileJson } from 'lucide-react';
import { LinkItem, Category, SiteSettings, SearchConfig, AIConfig, StickyNote } from '../../types';

interface DataBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  links: LinkItem[];
  categories: Category[];
  siteSettings: SiteSettings;
  searchConfig?: SearchConfig;
  aiConfig?: AIConfig;
  notes?: StickyNote[];
  onImport: (data: BackupData) => void;
  closeOnBackdrop?: boolean;
}

export interface BackupData {
  links: LinkItem[];
  categories: Category[];
  siteSettings: SiteSettings;
  searchConfig?: SearchConfig;
  aiConfig?: AIConfig;
  notes?: StickyNote[];
  exportTime: string;
  version: string;
}

const DataBackupModal: React.FC<DataBackupModalProps> = ({
  isOpen,
  onClose,
  links,
  categories,
  siteSettings,
  searchConfig,
  aiConfig,
  notes,
  onImport,
  closeOnBackdrop = true
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importData, setImportData] = useState<BackupData | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnBackdrop) {
      onClose();
    }
  };

  // 导出数据
  const handleExport = () => {
    const backupData: BackupData = {
      links,
      categories,
      siteSettings,
      searchConfig,
      aiConfig,
      notes,
      exportTime: new Date().toISOString(),
      version: '1.0.0'
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `y-nav-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        
        // 验证数据结构
        if (!parsed.links || !Array.isArray(parsed.links)) {
          setImportError('无效的数据格式：缺少 links 数组');
          return;
        }
        if (!parsed.categories || !Array.isArray(parsed.categories)) {
          setImportError('无效的数据格式：缺少 categories 数组');
          return;
        }
        if (!parsed.siteSettings) {
          setImportError('无效的数据格式：缺少 siteSettings');
          return;
        }

        setImportData(parsed as BackupData);
        setImportError(null);
      } catch (err) {
        setImportError('无法解析 JSON 文件，请检查文件格式');
        setImportData(null);
      }
    };
    reader.onerror = () => {
      setImportError('读取文件失败');
    };
    reader.readAsText(file);
  };

  // 确认导入
  const handleImport = () => {
    if (!importData) return;

    onImport(importData);
    setImportSuccess(true);
    setTimeout(() => {
      setImportSuccess(false);
      setImportData(null);
      onClose();
    }, 1500);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-2xl mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Database className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                数据备份与恢复
              </h2>
              <p className="text-sm text-slate-500">
                导出或导入您的所有数据
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* 标签页切换 */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors relative
              ${activeTab === 'export' 
                ? 'text-accent' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
          >
            <span className="flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              导出数据
            </span>
            {activeTab === 'export' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors relative
              ${activeTab === 'import' 
                ? 'text-accent' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
          >
            <span className="flex items-center justify-center gap-2">
              <Upload className="w-4 h-4" />
              导入数据
            </span>
            {activeTab === 'import' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
            )}
          </button>
        </div>

        {/* 内容区域 */}
        <div className="p-6">
          {activeTab === 'export' ? (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  即将导出的数据
                </h3>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>{links.length} 个链接</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>{categories.length} 个分类</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>{notes?.length || 0} 个便签</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>站点设置和配置</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={handleExport}
                className="w-full py-3 px-4 bg-accent text-white rounded-xl font-medium
                         hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                下载备份文件 (.json)
              </button>

              <p className="text-xs text-slate-500 text-center">
                备份文件包含您的所有数据，请妥善保管
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {!importData ? (
                <>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl
                             p-8 text-center cursor-pointer hover:border-accent transition-colors"
                  >
                    <FileJson className="w-10 h-10 mx-auto mb-3 text-slate-400" />
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      点击选择备份文件
                    </p>
                    <p className="text-xs text-slate-500">
                      支持 .json 格式的 Y-Nav 备份文件
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="font-medium text-green-700 dark:text-green-400">
                        文件验证成功
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                      <p>链接: {importData.links.length} 个</p>
                      <p>分类: {importData.categories.length} 个</p>
                      <p>便签: {importData.notes?.length || 0} 个</p>
                      <p>导出时间: {new Date(importData.exportTime).toLocaleString('zh-CN')}</p>
                      <p>版本: {importData.version}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      导入将覆盖现有数据，请确保已备份当前数据
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setImportData(null);
                        setImportError(null);
                      }}
                      className="flex-1 py-2.5 px-4 border border-slate-200 dark:border-slate-700
                               text-slate-700 dark:text-slate-300 rounded-xl font-medium
                               hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      重新选择
                    </button>
                    <button
                      onClick={handleImport}
                      className="flex-1 py-2.5 px-4 bg-accent text-white rounded-xl font-medium
                               hover:bg-accent/90 transition-colors"
                    >
                      {importSuccess ? (
                        <span className="flex items-center justify-center gap-2">
                          <Check className="w-4 h-4" />
                          导入成功
                        </span>
                      ) : (
                        '确认导入'
                      )}
                    </button>
                  </div>
                </div>
              )}

              {importError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                  <p className="text-sm text-red-600 dark:text-red-400">{importError}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataBackupModal;
