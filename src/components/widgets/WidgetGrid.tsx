import React, { useState } from 'react';
import { Plus, LayoutGrid, X, Check } from '@/utils/icons';
import { WidgetConfig, WIDGET_DISPLAY_CONFIG, WidgetType } from '../../types/widgets';
import WidgetContainer from './WidgetContainer';

interface WidgetGridProps {
  widgets: WidgetConfig[];
  onAddWidget: (type: WidgetType) => void;
  onRemoveWidget: (id: string) => void;
  onUpdateSettings: (id: string, settings: Record<string, any>) => void;
  onToggleWidget: (id: string) => void;
}

const WidgetGrid: React.FC<WidgetGridProps> = ({
  widgets,
  onAddWidget,
  onRemoveWidget,
  onUpdateSettings,
  onToggleWidget
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  // 过滤出启用的小组件
  const enabledWidgets = widgets.filter(w => w.enabled);

  // 计算网格布局
  const getGridStyle = (widget: WidgetConfig) => ({
    gridColumn: `span ${widget.position.w}`,
    gridRow: `span ${widget.position.h}`,
    minHeight: widget.position.h * 120
  });

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-accent" />
          我的小组件
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium
                     bg-accent text-white rounded-lg
                     hover:bg-accent/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            添加小组件
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
                     ${isEditing 
                       ? 'bg-green-500 text-white hover:bg-green-600' 
                       : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                     }`}
          >
            {isEditing ? (
              <span className="flex items-center gap-1">
                <Check className="w-4 h-4" />
                完成
              </span>
            ) : (
              '编辑'
            )}
          </button>
        </div>
      </div>

      {/* 添加小组件菜单 */}
      {showAddMenu && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              选择要添加的小组件
            </span>
            <button
              onClick={() => setShowAddMenu(false)}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(Object.keys(WIDGET_DISPLAY_CONFIG) as WidgetType[]).map(type => {
              const config = WIDGET_DISPLAY_CONFIG[type];
              const isAdded = widgets.some(w => w.type === type);
              return (
                <button
                  key={type}
                  onClick={() => {
                    onAddWidget(type);
                    setShowAddMenu(false);
                  }}
                  disabled={isAdded}
                  className={`p-3 rounded-xl border text-left transition-all
                           ${isAdded 
                             ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800' 
                             : 'bg-white dark:bg-slate-800 hover:border-accent hover:shadow-md'
                           }
                           border-slate-200 dark:border-slate-700`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {React.createElement(config.icon as any, { 
                      className: 'w-4 h-4 text-accent' 
                    })}
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {config.name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {config.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 小组件网格 */}
      {enabledWidgets.length === 0 ? (
        <div className="py-12 text-center">
          <LayoutGrid className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            还没有添加任何小组件
          </p>
          <button
            onClick={() => setShowAddMenu(true)}
            className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium
                     hover:bg-accent/90 transition-colors"
          >
            添加第一个小组件
          </button>
        </div>
      ) : (
        <div 
          className="grid gap-4"
          style={{
            gridTemplateColumns: 'repeat(6, 1fr)',
            gridAutoRows: '120px'
          }}
        >
          {enabledWidgets.map(widget => (
            <div key={widget.id} style={getGridStyle(widget)}>
              <WidgetContainer
                widget={widget}
                onRemove={onRemoveWidget}
                onUpdateSettings={onUpdateSettings}
                isEditing={isEditing}
              />
            </div>
          ))}
        </div>
      )}

      {/* 未启用的小组件列表（编辑模式） */}
      {isEditing && widgets.filter(w => !w.enabled).length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
            已隐藏的小组件
          </h3>
          <div className="flex flex-wrap gap-2">
            {widgets.filter(w => !w.enabled).map(widget => (
              <button
                key={widget.id}
                onClick={() => onToggleWidget(widget.id)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 
                         text-sm text-slate-600 dark:text-slate-400 rounded-lg
                         hover:bg-slate-200 dark:hover:bg-slate-700
                         transition-colors"
              >
                {widget.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WidgetGrid;
