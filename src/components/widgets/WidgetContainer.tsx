import React, { useState } from 'react';
import { 
  WidgetConfig, 
  WidgetType, 
  WIDGET_DISPLAY_CONFIG,
  WeatherWidgetSettings,
  TodoWidgetSettings,
  HotSearchWidgetSettings,
  CountdownWidgetSettings,
  ExchangeWidgetSettings,
  LifeProgressWidgetSettings,
  ZenWidgetSettings,
  RSSWidgetSettings,
  ApiWidgetSettings,
  IframeWidgetSettings
} from '../../types/widgets';
import WeatherWidget from './WeatherWidget';
import TodoWidget from './TodoWidget';
import HotSearchWidget from './HotSearchWidget';
import CountdownWidget from './CountdownWidget';
import ExchangeWidget from './ExchangeWidget';
import LifeProgressWidget from './LifeProgressWidget';
import ZenWidget from './ZenWidget';
import RSSWidget from './RSSWidget';
import ApiWidget from './ApiWidget';
import IframeWidget from './IframeWidget';
import { Settings, X, GripVertical } from '@/utils/icons';

interface WidgetContainerProps {
  widget: WidgetConfig;
  onRemove: (id: string) => void;
  onUpdateSettings: (id: string, settings: Record<string, any>) => void;
  isEditing?: boolean;
}

const WidgetContainer: React.FC<WidgetContainerProps> = ({
  widget,
  onRemove,
  onUpdateSettings,
  isEditing = false
}) => {
  const config = WIDGET_DISPLAY_CONFIG[widget.type];
  const [showSettings, setShowSettings] = useState(false);

  const renderWidget = () => {
    switch (widget.type) {
      case 'weather':
        return (
          <WeatherWidget
            settings={widget.settings as WeatherWidgetSettings}
            onUpdateSettings={(newSettings) => onUpdateSettings(widget.id, newSettings)}
          />
        );
      case 'todo':
        return (
          <TodoWidget
            settings={widget.settings as TodoWidgetSettings}
            onUpdateSettings={(newSettings) => onUpdateSettings(widget.id, newSettings)}
          />
        );
      case 'hotsearch':
        return (
          <HotSearchWidget
            settings={widget.settings as HotSearchWidgetSettings}
            onUpdateSettings={(newSettings) => onUpdateSettings(widget.id, newSettings)}
          />
        );
      case 'countdown':
        return (
          <CountdownWidget
            settings={widget.settings as CountdownWidgetSettings}
            onUpdateSettings={(newSettings) => onUpdateSettings(widget.id, newSettings)}
          />
        );
      case 'exchange':
        return (
          <ExchangeWidget
            settings={widget.settings as ExchangeWidgetSettings}
            onUpdateSettings={(newSettings) => onUpdateSettings(widget.id, newSettings)}
          />
        );
      case 'lifeprogress':
        return (
          <LifeProgressWidget
            settings={widget.settings as LifeProgressWidgetSettings}
            onUpdateSettings={(newSettings) => onUpdateSettings(widget.id, newSettings)}
          />
        );
      case 'zen':
        return (
          <ZenWidget
            settings={widget.settings as ZenWidgetSettings}
            onUpdateSettings={(newSettings) => onUpdateSettings(widget.id, newSettings)}
          />
        );
      case 'rss':
        return (
          <RSSWidget
            settings={widget.settings as RSSWidgetSettings}
            onUpdateSettings={(newSettings) => onUpdateSettings(widget.id, newSettings)}
          />
        );
      case 'api':
        return (
          <ApiWidget
            config={widget.settings as ApiWidgetSettings}
          />
        );
      case 'iframe':
        return (
          <IframeWidget
            widget={widget as WidgetConfig & { settings: IframeWidgetSettings }}
          />
        );
      default:
        return (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            暂未实现的小组件
          </div>
        );
    }
  };

  return (
    <div className={`
      relative bg-white dark:bg-slate-900/60 
      rounded-2xl border border-slate-200/60 dark:border-white/10
      shadow-sm hover:shadow-md transition-shadow duration-300
      overflow-hidden group
      ${!widget.enabled ? 'opacity-50' : ''}
    `}>
      {/* 编辑模式下的操作栏 */}
      {isEditing && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded-lg transition-colors ${showSettings ? 'bg-accent text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-accent hover:bg-slate-200'}`}
            title="设置"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onRemove(widget.id)}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 
                     text-slate-500 hover:text-red-500 hover:bg-red-50
                     transition-colors"
            title="删除"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 设置面板 */}
      {showSettings && isEditing && (
        <div className="absolute inset-x-0 top-8 bottom-0 z-20 bg-white dark:bg-slate-800 p-3 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">小组件设置</span>
            <button
              onClick={() => setShowSettings(false)}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center justify-between">
              <span>标题</span>
              <input
                type="text"
                value={widget.title || config.name}
                onChange={(e) => onUpdateSettings(widget.id, { title: e.target.value })}
                className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm w-24"
              />
            </div>
            <div className="flex items-center justify-between">
              <span>宽度</span>
              <select
                value={widget.position.w}
                onChange={(e) => onUpdateSettings(widget.id, { position: { ...widget.position, w: parseInt(e.target.value) } })}
                className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm"
              >
                {[1, 2, 3, 4].map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span>高度</span>
              <select
                value={widget.position.h}
                onChange={(e) => onUpdateSettings(widget.id, { position: { ...widget.position, h: parseInt(e.target.value) } })}
                className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm"
              >
                {[1, 2, 3, 4].map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 拖拽手柄 */}
      {isEditing && (
        <div className="absolute top-2 left-2 z-10 cursor-move">
          <GripVertical className="w-4 h-4 text-slate-300" />
        </div>
      )}

      {/* 小组件标题 */}
      <div className={`px-3 ${isEditing ? 'pt-8' : 'pt-3'} pb-0`}>
        {!isEditing && (
          <div className="flex items-center gap-2 mb-2">
            {React.createElement(config.icon as any, { className: 'w-4 h-4 text-accent' })}
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {widget.title || config.name}
            </span>
          </div>
        )}
      </div>

      {/* 小组件内容 */}
      <div className="h-[calc(100%-2rem)]">
        {renderWidget()}
      </div>
    </div>
  );
};

export default WidgetContainer;
