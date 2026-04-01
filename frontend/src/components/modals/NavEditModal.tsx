import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, GripVertical, LayoutDashboard, FolderOpen, Grid3X3, FlaskConical, Save } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
  onSave: (items: NavItem[]) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  FolderOpen,
  Grid3X3,
  FlaskConical,
};

// Sortable item component
const SortableNavItem = ({ item, isEditing, editingLabel, onLabelChange, onEditStart, onEditConfirm, onDelete }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const IconComponent = item.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 rounded-xl bg-[#242629] border border-white/5"
    >
      <div {...attributes} {...listeners} className="cursor-grab">
        <GripVertical className="w-4 h-4 text-slate-500" />
      </div>
      <IconComponent className="w-5 h-5 text-emerald-400" />
      
      {isEditing ? (
        <input
          type="text"
          value={editingLabel}
          onChange={(e) => onLabelChange(e.target.value)}
          onBlur={() => onEditConfirm(item.id, editingLabel)}
          onKeyDown={(e) => e.key === 'Enter' && onEditConfirm(item.id, editingLabel)}
          className="flex-1 bg-transparent text-white border-b border-emerald-500 focus:outline-none px-1"
          autoFocus
        />
      ) : (
        <span
          onClick={() => onEditStart(item.id, item.label)}
          className="flex-1 text-white cursor-pointer hover:text-emerald-400 transition-colors"
        >
          {item.label}
        </span>
      )}
      
      <button
        onClick={() => onDelete(item.id)}
        className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

export const NavEditModal: React.FC<NavEditModalProps> = ({
  isOpen,
  onClose,
  navItems,
  onSave,
}) => {
  const [items, setItems] = useState<NavItem[]>([]);
  const [editingItem, setEditingItem] = useState<{ id: string; label: string } | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newItemLabel, setNewItemLabel] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (isOpen) {
      setItems(navItems);
    }
  }, [isOpen, navItems]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleDelete = (id: string) => {
    if (items.length <= 1) {
      alert('至少保留一个导航项');
      return;
    }
    setItems(items.filter(item => item.id !== id));
  };

  const handleEdit = (id: string, newLabel: string) => {
    if (newLabel.trim()) {
      setItems(items.map(item =>
        item.id === id ? { ...item, label: newLabel.trim() } : item
      ));
    }
    setEditingItem(null);
  };

  const handleAddItem = () => {
    if (newItemLabel.trim()) {
      const newId = 'nav-' + Date.now();
      const newItem: NavItem = {
        id: newId,
        label: newItemLabel.trim(),
        icon: LayoutDashboard
      };
      setItems([...items, newItem]);
      setNewItemLabel('');
      setIsAdding(false);
    }
  };

  const handleSave = () => {
    onSave(items);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#181a1c] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">编辑导航菜单</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {items.map((item) => (
                  <SortableNavItem
                    key={item.id}
                    item={item}
                    isEditing={editingItem?.id === item.id}
                    editingLabel={editingItem?.label || ''}
                    onLabelChange={(label: string) => setEditingItem(prev => prev ? { ...prev, label } : null)}
                    onEditStart={(id: string, label: string) => setEditingItem({ id, label })}
                    onEditConfirm={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Add new item */}
          {isAdding ? (
            <div className="flex items-center gap-2 mt-3 p-3 rounded-xl bg-[#242629] border border-white/5">
              <input
                type="text"
                value={newItemLabel}
                onChange={(e) => setNewItemLabel(e.target.value)}
                onBlur={handleAddItem}
                onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                placeholder="输入菜单名称"
                className="flex-1 bg-transparent text-white border-b border-emerald-500 focus:outline-none px-1"
                autoFocus
              />
              <button
                onClick={handleAddItem}
                className="p-2 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-all"
              >
                <Save className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 mt-3 px-4 py-2 rounded-xl bg-[#242629] border border-white/5 text-slate-400 hover:text-white hover:bg-white/5 transition-all w-full"
            >
              <Plus className="w-4 h-4" />
              <span>添加菜单项</span>
            </button>
          )}

          <p className="mt-4 text-sm text-slate-400">
            提示：拖拽可排序，点击名称可编辑
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-[#0d0e10] font-semibold hover:bg-emerald-400 transition-all"
          >
            <Save className="w-4 h-4" />
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default NavEditModal;
