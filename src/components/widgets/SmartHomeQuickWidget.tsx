import React from 'react';
import { Zap, Home, LogOut, Moon, Film } from '@/utils/icons';
import { useSmartHome } from '../../hooks/useSmartHome';

interface SmartHomeQuickWidgetProps {
  onClick?: () => void;
}

export const SmartHomeQuickWidget: React.FC<SmartHomeQuickWidgetProps> = ({ onClick }) => {
  const { scenes } = useSmartHome();

  // 预设场景（如果后端没有返回则使用预设）
  const defaultScenes = [
    { id: 'scene_home', name: '回家模式', icon: Home },
    { id: 'scene_away', name: '离家模式', icon: LogOut },
    { id: 'scene_sleep', name: '睡眠模式', icon: Moon },
    { id: 'scene_movie', name: '观影模式', icon: Film }
  ];

  const displayScenes = scenes.length > 0 
    ? scenes.slice(0, 4).map(s => ({ ...s, icon: defaultScenes.find(d => d.name === s.name)?.icon || Home }))
    : defaultScenes;

  const handleAllLightsOn = () => {
    console.log('开启所有灯光');
  };

  const handleAllLightsOff = () => {
    console.log('关闭所有灯光');
  };

  return (
    <div className="h-full flex flex-col bg-[#171717] rounded-lg p-4 border border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-[#f5f5f5]">快捷控制</h3>
        <button className="p-1 rounded hover:bg-white/10 text-[#a3a3a3]">
          <span className="text-xs">⋮</span>
        </button>
      </div>

      {/* Quick Scenes */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {displayScenes.map(scene => {
          const Icon = scene.icon || Home;
          return (
            <button
              key={scene.id}
              onClick={onClick}
              className="flex items-center justify-center gap-1.5 px-2 py-2 bg-white/5 rounded-lg text-xs text-[#a3a3a3] hover:bg-[#10b981]/20 hover:text-[#10b981] transition-colors"
            >
              <Icon className="w-3.5 h-3.5" />
              {scene.name}
            </button>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="pt-3 border-t border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-[#a3a3a3]">
            <Zap className="w-4 h-4" />
            全部灯光
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleAllLightsOn}
              className="px-3 py-1 bg-[#10b981]/20 text-[#10b981] rounded text-xs hover:bg-[#10b981]/30 transition-colors"
            >
              开启
            </button>
            <button 
              onClick={handleAllLightsOff}
              className="px-3 py-1 bg-white/5 text-[#a3a3a3] rounded text-xs hover:bg-red-500/20 hover:text-red-500 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartHomeQuickWidget;
