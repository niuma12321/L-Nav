import React, { useState } from 'react';
import { GripVertical, Pencil, Trash2, Eye, EyeOff, Plus, X, Check } from '@/utils/icons';
import { Category } from '../../types';

interface MobileCategoryManagerProps {
  categories: Category[];
  onAddCategory: (name: string) => void;
  onEditCategory: (id: string, name: string) => void;
  onDeleteCategory: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onReorder: (oldIndex: number, newIndex: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

const MobileCategoryManager: React.FC<MobileCategoryManagerProps> = ({
  categories,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onToggleVisibility,
  onReorder,
  isOpen,
  onClose
}) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const activeCategories = categories.filter(c => !c.hidden);
  const hiddenCategories = categories.filter(c => c.hidden);

  const handleAdd = () => {
    if (newCategoryName.trim()) {
      onAddCategory(newCategoryName.trim());
      setNewCategoryName('');
    }
  };

  const handleEditStart = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  const handleEditSave = () => {
    if (editingId && editName.trim()) {
      onEditCategory(editingId, editName.trim());
      setEditingId(null);
      setEditName('');
    }
  };

  const handleDragStart = (id: string) => {
    setDraggingId(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (draggingId && draggingId !== targetId) {
      const oldIndex = categories.findIndex(c => c.id === draggingId);
      const newIndex = categories.findIndex(c => c.id === targetId);
      onReorder(oldIndex, newIndex);
    }
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#0d0e10]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0d0e10]/95 backdrop-blur-xl border-b border-white/5 px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose} className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-white">Categories</h1>
          <div className="w-10" />
        </div>
        <p className="text-sm text-slate-400">Manage and prioritize your navigation clusters</p>
      </div>

      {/* Stats */}
      <div className="px-4 py-4 grid grid-cols-2 gap-3">
        <div className="bg-[#1e2127] rounded-2xl p-4 border border-white/5">
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">Total</p>
          <p className="text-3xl font-bold text-white">{categories.length.toString().padStart(2, '0')}</p>
        </div>
        <div className="bg-[#1e2127] rounded-2xl p-4 border border-white/5">
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">Active</p>
          <p className="text-3xl font-bold text-white">{activeCategories.length.toString().padStart(2, '0')}</p>
        </div>
      </div>

      {/* Category List */}
      <div className="px-4 pb-32 space-y-3">
        {categories.map((category, index) => (
          <div
            key={category.id}
            draggable
            onDragStart={() => handleDragStart(category.id)}
            onDragOver={(e) => handleDragOver(e, category.id)}
            onDragEnd={handleDragEnd}
            className={`
              flex items-center gap-3 p-4 rounded-2xl bg-[#1e2127] border border-white/5
              ${draggingId === category.id ? 'opacity-50' : ''}
              ${category.hidden ? 'opacity-60' : ''}
            `}
          >
            {/* Drag Handle */}
            <div className="p-2 rounded-xl bg-white/5 text-slate-500">
              <GripVertical className="w-5 h-5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {editingId === category.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-3 py-2 bg-[#0d0e10] rounded-xl text-white text-sm border border-white/10 focus:border-emerald-500/50 outline-none"
                    autoFocus
                  />
                  <button onClick={handleEditSave} className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <span className={`font-medium ${category.hidden ? 'text-slate-500' : 'text-white'}`}>
                  {category.name}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleVisibility(category.id)}
                className={`p-2 rounded-xl ${category.hidden ? 'text-slate-500' : 'text-emerald-400'}`}
              >
                {category.hidden ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              <button
                onClick={() => handleEditStart(category)}
                className="p-2 rounded-xl text-slate-400 hover:text-white"
              >
                <Pencil className="w-5 h-5" />
              </button>
              <button
                onClick={() => onDeleteCategory(category.id)}
                className="p-2 rounded-xl text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Category */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0d0e10] border-t border-white/5 p-4 pb-safe">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Add new category..."
            className="flex-1 px-4 py-3 bg-[#1e2127] rounded-xl text-white placeholder-slate-500 border border-white/5 focus:border-emerald-500/50 outline-none"
          />
          <button
            onClick={handleAdd}
            disabled={!newCategoryName.trim()}
            className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:shadow-none"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileCategoryManager;
