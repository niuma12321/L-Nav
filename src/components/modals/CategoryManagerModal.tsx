import React, { useState, useCallback, useMemo } from 'react';
import { 
  X, ArrowUp, ArrowDown, Trash2, Edit2, Plus, Check, 
  Palette, Square, CheckSquare, Eye, EyeOff 
} from 'lucide-react';
import { Category } from '../../types';
import { useDialog } from '../ui/DialogProvider';
import Icon from '../ui/Icon';
import IconSelector from '../ui/IconSelector';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onUpdateCategories: (newCategories: Category[]) => void;
  onDeleteCategory: (id: string) => void;
  onDeleteCategories?: (ids: string[]) => void;
  closeOnBackdrop?: boolean;
}

// 缓存组件，防止父组件渲染导致重绘
const CategoryManagerModal: React.FC<CategoryManagerModalProps> = React.memo(({
  isOpen,
  onClose,
  categories = [], // 默认空数组，防报错
  onUpdateCategories,
  onDeleteCategory,
  onDeleteCategories,
  closeOnBackdrop = true
}) => {
  // 编辑状态
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editHidden, setEditHidden] = useState(false);

  // 新建分类状态
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Folder');
  const [newCatHidden, setNewCatHidden] = useState(false);

  // 图标选择器
  const [isIconSelectorOpen, setIsIconSelectorOpen] = useState(false);
  const [iconSelectorTarget, setIconSelectorTarget] = useState<'edit' | 'new' | null>(null);

  // 批量模式
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  
  const { notify, confirm } = useDialog();

  // ==============================================
  // 核心工具函数（缓存优化）
  // ==============================================
  // 获取备用分类（删除时自动转移书签）
  const getFallbackCategory = useCallback((excludeIds: Set<string>) => {
    const remaining = categories.filter(c => !excludeIds.has(c.id));
    if (remaining.length === 0) return null;
    return remaining.find(c => c.id === 'common') || remaining[0];
  }, [categories]);

  // 判断是否为默认分类（不可删除）
  const isDefaultCategory = useCallback((id: string) => id === 'common', []);

  // ==============================================
  // 批量操作逻辑（缓存优化）
  // ==============================================
  const toggleBatchMode = useCallback(() => {
    setIsBatchMode(prev => !prev);
    setSelectedCategories(new Set());
  }, []);

  const toggleCategorySelection = useCallback((categoryId: string) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      newSet.has(categoryId) ? newSet.delete(categoryId) : newSet.add(categoryId);
      return newSet;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedCategories(prev => 
      prev.size === categories.length ? new Set() : new Set(categories.map(c => c.id))
    );
  }, [categories]);

  // 批量删除
  const handleBatchDelete = useCallback(async () => {
    if (selectedCategories.size === 0) {
      notify('请先选择要删除的分类', 'warning');
      return;
    }

    const fallbackCategory = getFallbackCategory(selectedCategories);
    if (!fallbackCategory) {
      notify('至少保留一个分类', 'warning');
      return;
    }

    // 禁止删除默认分类
    if (selectedCategories.has('common')) {
      notify('默认分类不可删除', 'warning');
      return;
    }

    const shouldDelete = await confirm({
      title: '批量删除分类',
      message: `确定删除选中的 ${selectedCategories.size} 个分类吗？书签将自动转移至「${fallbackCategory.name}」`,
      confirmText: '删除',
      cancelText: '取消',
      variant: 'danger'
    });

    if (!shouldDelete) return;

    onDeleteCategories 
      ? onDeleteCategories(Array.from(selectedCategories)) 
      : selectedCategories.forEach(onDeleteCategory);
    
    setSelectedCategories(new Set());
    setIsBatchMode(false);
  }, [selectedCategories, getFallbackCategory, notify, confirm, onDeleteCategories, onDeleteCategory]);

  // ==============================================
  // 分类排序逻辑
  // ==============================================
  const handleMove = useCallback((index: number, direction: 'up' | 'down') => {
    const newCats = [...categories];
    if (direction === 'up' && index > 0) {
      [newCats[index], newCats[index - 1]] = [newCats[index - 1], newCats[index]];
    } else if (direction === 'down' && index < newCats.length - 1) {
      [newCats[index], newCats[index + 1]] = [newCats[index + 1], newCats[index]];
    }
    onUpdateCategories(newCats);
  }, [categories, onUpdateCategories]);

  // ==============================================
  // 编辑/删除/新增逻辑
  // ==============================================
  const startEdit = useCallback((cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditIcon(cat.icon);
    setEditHidden(!!cat.hidden);
  }, []);

  const saveEdit = useCallback(() => {
    if (!editingId || !editName.trim()) return;
    onUpdateCategories(
      categories.map(c => c.id === editingId 
        ? { ...c, name: editName.trim(), icon: editIcon, hidden: editHidden } 
        : c
      )
    );
    setEditingId(null);
  }, [editingId, editName, editIcon, editHidden, categories, onUpdateCategories]);

  const handleDeleteClick = useCallback(async (cat: Category) => {
    // 保护默认分类
    if (isDefaultCategory(cat.id)) {
      notify('默认分类不可删除', 'warning');
      return;
    }

    const fallbackCategory = getFallbackCategory(new Set([cat.id]));
    if (!fallbackCategory) {
      notify('至少保留一个分类', 'warning');
      return;
    }

    const shouldDelete = await confirm({
      title: '删除分类',
      message: `确定删除「${cat.name}」？书签将自动转移至「${fallbackCategory.name}」`,
      confirmText: '删除',
      cancelText: '取消',
      variant: 'danger'
    });

    shouldDelete && onDeleteCategory(cat.id);
  }, [getFallbackCategory, confirm, notify, onDeleteCategory, isDefaultCategory]);

  const handleAdd = useCallback(() => {
    if (!newCatName.trim()) return;
    const newCat: Category = {
      id: Date.now().toString(),
      name: newCatName.trim(),
      icon: newCatIcon,
      hidden: newCatHidden
    };
    onUpdateCategories([...categories, newCat]);
    // 重置表单
    setNewCatName('');
    setNewCatIcon('Folder');
    setNewCatHidden(false);
  }, [newCatName, newCatIcon, newCatHidden, categories, onUpdateCategories]);

  // ==============================================
  // 图标选择器逻辑
  // ==============================================
  const openIconSelector = useCallback((target: 'edit' | 'new') => {
    setIconSelectorTarget(target);
    setIsIconSelectorOpen(true);
  }, []);

  const handleIconSelect = useCallback((iconName: string) => {
    iconSelectorTarget === 'edit' && setEditIcon(iconName);
    iconSelectorTarget === 'new' && setNewCatIcon(iconName);
    setIsIconSelectorOpen(false);
    setIconSelectorTarget(null);
  }, [iconSelectorTarget]);

  const cancelIconSelector = useCallback(() => {
    setIsIconSelectorOpen(false);
    setIconSelectorTarget(null);
  }, []);

  // 模态框关闭时重置所有状态
  const handleClose = useCallback(() => {
    onClose();
    // 重置所有临时状态
    setEditingId(null);
    setIsBatchMode(false);
    setSelectedCategories(new Set());
    setIsIconSelectorOpen(false);
  }, [onClose]);

  // 空状态判断
  const isEmptyCategories = useMemo(() => categories.length === 0, [categories]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300"
      onClick={closeOnBackdrop ? handleClose : undefined}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[85vh] transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold dark:text-white">分类管理</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleBatchMode}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isBatchMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {isBatchMode ? '取消多选' : '批量操作'}
            </button>
            <button 
              onClick={handleClose} 
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            >
              <X className="w-5 h-5 dark:text-slate-400" />
            </button>
          </div>
        </div>

        {/* 批量模式工具栏 */}
        {isBatchMode && (
          <div className="px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:opacity-80"
              >
                {selectedCategories.size === categories.length ? <CheckSquare size={16} /> : <Square size={16} />}
                <span>全选</span>
              </button>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                已选 {selectedCategories.size} 项
              </span>
            </div>
            <button
              onClick={handleBatchDelete}
              disabled={selectedCategories.size === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              <Trash2 size={14} />
              <span>删除选中</span>
            </button>
          </div>
        )}

        {/* 分类列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin">
          {isEmptyCategories ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Folder size={32} className="mb-3 opacity-30" />
              <p className="text-sm">暂无分类</p>
            </div>
          ) : (
            categories.map((cat, index) => (
              <div 
                key={cat.id} 
                className={`p-3 rounded-xl transition-all duration-200 ${
                  isBatchMode && selectedCategories.has(cat.id)
                    ? 'bg-blue-100/50 dark:bg-blue-900/30 border-2 border-blue-500'
                    : 'bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-600/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {/* 批量选择框 */}
                  {isBatchMode && (
                    <button onClick={() => toggleCategorySelection(cat.id)} className="flex-shrink-0">
                      {selectedCategories.has(cat.id) 
                        ? <CheckSquare size={18} className="text-blue-600" /> 
                        : <Square size={18} className="text-slate-400" />
                      }
                    </button>
                  )}

                  {/* 排序按钮 */}
                  {!isBatchMode && (
                    <div className="flex flex-col gap-1 mr-2">
                      <button onClick={() => handleMove(index, 'up')} disabled={index === 0} 
                        className="p-0.5 text-slate-400 hover:text-blue-500 disabled:opacity-30 transition-colors">
                        <ArrowUp size={14} />
                      </button>
                      <button onClick={() => handleMove(index, 'down')} disabled={index === categories.length - 1} 
                        className="p-0.5 text-slate-400 hover:text-blue-500 disabled:opacity-30 transition-colors">
                        <ArrowDown size={14} />
                      </button>
                    </div>
                  )}

                  {/* 分类内容 - 编辑/展示模式 */}
                  <div className="flex-1 min-w-0">
                    {editingId === cat.id ? (
                      <div className="flex items-center gap-2">
                        <Icon name={editIcon} size={16} />
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 p-1.5 text-sm rounded-lg border border-blue-500 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                          placeholder="输入分类名称"
                          autoFocus
                        />
                        <button onClick={() => openIconSelector('edit')} className="p-1 text-slate-400 hover:text-blue-600" title="选择图标">
                          <Palette size={16} />
                        </button>
                        <button onClick={() => setEditHidden(!editHidden)} className="p-1 text-slate-400 hover:text-slate-600" title={editHidden ? "取消隐藏" : "设为隐藏"}>
                          {editHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button onClick={saveEdit} className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors">
                          <Check size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Icon name={cat.icon} size={16} />
                        <span className="font-medium dark:text-slate-200 truncate">
                          {cat.name}
                          {cat.hidden && (
                            <span className="ml-2 inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                              <EyeOff size={12} />隐藏
                            </span>
                          )}
                          {isDefaultCategory(cat.id) && (
                            <span className="ml-2 text-xs text-slate-400">(默认)</span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  {!isBatchMode && editingId !== cat.id && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => onUpdateCategories(categories.map(c => 
                          c.id === cat.id ? { ...c, hidden: !c.hidden } : c
                        ))}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                        title={cat.hidden ? "取消隐藏" : "设为隐藏"}
                      >
                        {cat.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button onClick={() => startEdit(cat)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(cat)} 
                        disabled={isDefaultCategory(cat.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 添加新分类 */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2 block">添加新分类</label>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Icon name={newCatIcon} size={16} />
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="输入分类名称"
                className="flex-1 p-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button onClick={() => openIconSelector('new')} className="p-1 text-slate-400 hover:text-blue-600" title="选择图标">
                <Palette size={16} />
              </button>
              <button onClick={() => setNewCatHidden(!newCatHidden)} className="p-1 text-slate-400 hover:text-slate-600" title={newCatHidden ? "取消隐藏" : "设为隐藏"}>
                {newCatHidden ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleAdd}
                disabled={!newCatName.trim()}
                className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* 图标选择器弹窗 */}
        {isIconSelectorOpen && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={closeOnBackdrop ? cancelIconSelector : undefined}
          >
            <div
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">选择图标</h3>
                <button onClick={cancelIconSelector} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <IconSelector onSelectIcon={handleIconSelect} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

// 补充缺失的导入
import { Folder } from 'lucide-react';

export default CategoryManagerModal;
