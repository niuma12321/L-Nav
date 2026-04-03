import React from 'react';
import { useSmartHome } from '../../hooks/useSmartHome';
import { Lightbulb, Power, Wind, Home, LogOut, Moon, Film, BookOpen, RefreshCw } from 'lucide-react';

interface SmartHomeViewCNProps {
  onBack?: () => void;
}

const DEVICE_ICONS: Record<string, React.ElementType> = {
  light: Lightbulb,
  switch: Power,
  climate: Wind,
  cover: Wind,
  sensor: Power
};

const SCENE_ICONS: Record<string, React.ElementType> = {
  '回家模式': Home,
  '离家模式': LogOut,
  '睡眠模式': Moon,
  '观影模式': Film,
  '阅读模式': BookOpen
};

export const SmartHomeViewCN: React.FC<SmartHomeViewCNProps> = ({ onBack }) => {
  const { devices, scenes, loading, controlDevice, toggleDevice, runScene, refreshDevices } = useSmartHome();

  // 按类型分组设备
  const groupedDevices = devices.reduce((acc, device) => {
    const type = device.type || 'switch';
    if (!acc[type]) acc[type] = [];
    acc[type].push(device);
    return acc;
  }, {} as Record<string, typeof devices>);

  const getTypeName = (type: string) => {
    const names: Record<string, string> = {
      light: '灯光',
      switch: '开关',
      climate: '空调',
      cover: '窗帘',
      sensor: '传感器'
    };
    return names[type] || type;
  };

  const getDeviceStatus = (device: typeof devices[0]) => {
    const isOn = device.state === 'on' || device.state === 'heat' || device.state === 'cool';
    const temp = device.attributes?.temperature;
    return {
      isOn,
      display: temp ? `${device.state} ${temp}℃` : device.state
    };
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] text-[#f5f5f5]">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/5">
        <div>
          <h1 className="text-xl font-bold text-[#10b981]">智能家居控制中心</h1>
          <p className="text-sm text-[#a3a3a3] mt-1">统一控制所有智能设备，一键执行场景</p>
        </div>
        <button
          onClick={refreshDevices}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 text-[#a3a3a3] rounded-lg hover:bg-white/10 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          同步设备
        </button>
      </div>

      {/* Quick Scenes */}
      {scenes.length > 0 && (
        <div className="px-6 py-4">
          <h2 className="text-sm font-medium text-[#a3a3a3] mb-3">快捷场景</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {scenes.map(scene => {
              const Icon = SCENE_ICONS[scene.name] || Home;
              return (
                <button
                  key={scene.id}
                  onClick={() => runScene(scene.scene_id)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#171717] rounded-lg border border-white/5 hover:border-[#10b981]/50 hover:bg-[#171717]/80 transition-all text-[#f5f5f5] text-sm whitespace-nowrap"
                >
                  <Icon className="w-4 h-4" />
                  {scene.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Device Groups */}
      <div className="flex-1 px-6 pb-6 overflow-auto space-y-6">
        {loading ? (
          <div className="text-center py-12 text-[#a3a3a3]">加载中...</div>
        ) : devices.length === 0 ? (
          <div className="text-center py-12 text-[#525252]">
            <Home className="w-12 h-12 mx-auto mb-4" />
            <p>暂无设备，请配置Home Assistant连接</p>
          </div>
        ) : (
          Object.entries(groupedDevices).map(([type, typeDevices]) => (
            <div key={type}>
              <h2 className="text-sm font-medium text-[#a3a3a3] mb-3">{getTypeName(type)}控制</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {typeDevices.map(device => {
                  const Icon = DEVICE_ICONS[type] || Power;
                  const { isOn, display } = getDeviceStatus(device);
                  
                  return (
                    <div
                      key={device.id}
                      className={`bg-[#171717] rounded-lg p-4 border transition-all cursor-pointer ${
                        isOn ? 'border-[#10b981]/50' : 'border-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className={`p-2 rounded-lg ${isOn ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-white/5 text-[#525252]'}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className={`text-xs ${isOn ? 'text-[#10b981]' : 'text-[#525252]'}`}>
                          {isOn ? '●' : '○'}
                        </span>
                      </div>
                      <h3 className="font-medium text-sm">{device.name}</h3>
                      <p className="text-xs text-[#a3a3a3] mb-3">{display}</p>
                      <button
                        onClick={() => toggleDevice(device)}
                        className={`w-full py-1.5 rounded text-xs font-medium transition-colors ${
                          isOn
                            ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                            : 'bg-[#10b981]/20 text-[#10b981] hover:bg-[#10b981]/30'
                        }`}
                      >
                        {isOn ? '关闭' : '开启'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SmartHomeViewCN;
