import React, { useState, useRef } from 'react';
import { Upload, Chrome, FileText, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { LinkItem, Category } from '../../types';

interface ChromeBookmarkImportProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onImport: (links: Partial<LinkItem>[]) => void;
}

// Parse Chrome bookmarks HTML
const parseChromeBookmarks = (html: string): Array<{
  title: string;
  url: string;
  folder: string;
}> => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const links: Array<{ title: string; url: string; folder: string }> = [];
  
  const processNode = (node: Element, folderName: string = '未分类') => {
    // If it's a folder (DL element)
    if (node.tagName === 'DL') {
      const children = node.children;
      let currentFolder = folderName;
      
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        
        // If it's a folder header (DT with H3)
        const h3 = child.querySelector('h3');
        if (h3) {
          currentFolder = h3.textContent || folderName;
        }
        
        // If it's a link (A tag)
        const a = child.querySelector('a');
        if (a) {
          const title = a.textContent || '未命名';
          const url = a.getAttribute('href') || '';
          if (url && !url.startsWith('javascript:') && !url.startsWith('chrome:')) {
            links.push({ title, url, folder: currentFolder });
          }
        }
        
        // Recursively process nested DLs
        const nestedDL = child.querySelector('dl');
        if (nestedDL) {
          processNode(nestedDL, currentFolder);
        }
      }
    }
  };
  
  // Start parsing from root DL
  const rootDL = doc.querySelector('dl');
  if (rootDL) {
    processNode(rootDL);
  }
  
  return links;
};

const ChromeBookmarkImport: React.FC<ChromeBookmarkImportProps> = ({
  isOpen,
  onClose,
  categories,
  onImport
}) => {
  const [step, setStep] = useState<'upload' | 'preview' | 'success'>('upload');
  const [parsedBookmarks, setParsedBookmarks] = useState<Array<{
    title: string;
    url: string;
    folder: string;
    selected: boolean;
    categoryId: string;
  }>>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [importStats, setImportStats] = useState({ total: 0, imported: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File) => {
    if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
      alert('请上传 HTML 格式的书签文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const html = e.target?.result as string;
      const bookmarks = parseChromeBookmarks(html);
      
      // Auto-assign categories based on folder names
      const enriched = bookmarks.map(bm => {
        // Try to match folder name with existing category
        const matchedCategory = categories.find(cat => 
          cat.name.toLowerCase().includes(bm.folder.toLowerCase()) ||
          bm.folder.toLowerCase().includes(cat.name.toLowerCase())
        );
        
        return {
          ...bm,
          selected: true,
          categoryId: matchedCategory?.id || categories[0]?.id || ''
        };
      });
      
      setParsedBookmarks(enriched);
      setStep('preview');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleImport = () => {
    const selected = parsedBookmarks.filter(bm => bm.selected);
    const linksToImport: Partial<LinkItem>[] = selected.map(bm => ({
      title: bm.title,
      url: bm.url,
      categoryId: bm.categoryId,
      description: `从 Chrome 书签导入 (${bm.folder})`,
      icon: bm.title.charAt(0).toUpperCase(),
      iconColor: '#10b981',
    }));
    
    onImport(linksToImport);
    setImportStats({ total: parsedBookmarks.length, imported: selected.length });
    setStep('success');
  };

  const toggleSelection = (index: number) => {
    setParsedBookmarks(prev => prev.map((bm, i) => 
      i === index ? { ...bm, selected: !bm.selected } : bm
    ));
  };

  const selectAll = () => {
    setParsedBookmarks(prev => prev.map(bm => ({ ...bm, selected: true })));
  };

  const deselectAll = () => {
    setParsedBookmarks(prev => prev.map(bm => ({ ...bm, selected: false })));
  };

  const updateCategory = (index: number, categoryId: string) => {
    setParsedBookmarks(prev => prev.map((bm, i) => 
      i === index ? { ...bm, categoryId } : bm
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-[#181a1c] rounded-3xl overflow-hidden shadow-2xl border border-white/5">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Chrome className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Chrome 书签导入</h2>
              <p className="text-sm text-slate-400">一键搬家，快速迁移</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'upload' && (
            <div className="space-y-4">
              {/* Instructions */}
              <div className="p-4 rounded-xl bg-white/5 space-y-2">
                <h3 className="font-medium text-white flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  如何导出 Chrome 书签？
                </h3>
                <ol className="text-sm text-slate-400 space-y-1 list-decimal list-inside">
                  <li>Chrome 菜单 → 书签 → 书签管理器</li>
                  <li>点击右上角 ⋮ → 导出书签</li>
                  <li>保存 HTML 文件到本地</li>
                  <li>将文件拖放到下方或点击上传</li>
                </ol>
              </div>

              {/* Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-white/10 bg-[#0d0e10] hover:border-white/20'
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-slate-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium">点击或拖拽上传书签文件</p>
                    <p className="text-sm text-slate-500 mt-1">支持 .html 或 .htm 格式</p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".html,.htm"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-400">
                  共找到 <span className="text-white font-medium">{parsedBookmarks.length}</span> 个书签
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={selectAll}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white bg-white/5"
                  >
                    全选
                  </button>
                  <button
                    onClick={deselectAll}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white bg-white/5"
                  >
                    全不选
                  </button>
                </div>
              </div>

              {/* Bookmark List */}
              <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                {parsedBookmarks.map((bm, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                      bm.selected ? 'bg-white/10' : 'bg-white/5'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={bm.selected}
                      onChange={() => toggleSelection(index)}
                      className="w-4 h-4 rounded border-white/20 bg-transparent text-emerald-500 focus:ring-emerald-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{bm.title}</p>
                      <p className="text-xs text-slate-500 truncate">{bm.url}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 px-2 py-1 rounded-lg bg-white/5">
                        {bm.folder}
                      </span>
                      <select
                        value={bm.categoryId}
                        onChange={(e) => updateCategory(index, e.target.value)}
                        className="text-xs bg-[#0d0e10] text-white border border-white/10 rounded-lg px-2 py-1 outline-none"
                      >
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              {/* Import Button */}
              <button
                onClick={handleImport}
                disabled={parsedBookmarks.filter(bm => bm.selected).length === 0}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 
                         text-white font-semibold shadow-lg shadow-emerald-500/20
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all active:scale-[0.98]"
              >
                导入选中的 {parsedBookmarks.filter(bm => bm.selected).length} 个书签
              </button>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">导入成功！</h3>
              <p className="text-slate-400">
                成功导入 {importStats.imported} 个书签（共 {importStats.total} 个）
              </p>
              <button
                onClick={onClose}
                className="mt-6 px-6 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                完成
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChromeBookmarkImport;
