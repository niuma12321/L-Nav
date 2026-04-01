import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, GripVertical, LayoutDashboard, FolderOpen, Grid3X3, FlaskConical, Save } from 'lucide-react';

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

export const NavEditModal: React.FC<NavEditModalProps> = ({
  isOpen,
  onClose,
  navItems,
  onSave,
}) => {
  const [items, setItems] = useState<NavItem[]>([]);
  const [editingItem, setEditingItem] = useState<{ id: string; label: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setItems(navItems);
    }
  }, [isOpen, navItems]);

  const handleDelete = (id: string) => {
    if (items.length <= 1) {
      alert('至少保留一个导航项');
      return;
    }
    setItems(items.filter(item => item.id !== id));
  };

  const handleEdit = (id: string, newLabel: string) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, label: newLabel } : item
    ));
    setEditingItem(null);
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
          <div className="space-y-2">
            {items.map((item) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#242629] border border-white/5"
                >
                  <GripVertical className="w-4 h-4 text-slate-500" />
                  <IconComponent className="w-5 h-5 text-emerald-400" />
                  
                  {editingItem?.id === item.id ? (
                    <input
                      type="text"
                      value={editingItem.label}
                      onChange={(e) => setEditingItem({ ...editingItem, label: e.target.value })}
                      onBlur={() => handleEdit(item.id, editingItem.label)}
                      onKeyDown={(e) => e.key === 'Enter' && handleEdit(item.id, editingItem.label)}
                      className="flex-1 bg-transparent text-white border-b border-emerald-500 focus:outline-none px-1"
                      autoFocus
                    />
                  ) : (
                    <span
                      onClick={() => setEditingItem({ id: item.id, label: item.label })}
                      className="flex-1 text-white cursor-pointer hover:text-emerald-400 transition-colors"
                    >
                      {item.label}
                    </span>
                  )}
                  
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-sm text-slate-400">
            提示：点击名称可编辑，拖拽可排序（暂未实现）
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
