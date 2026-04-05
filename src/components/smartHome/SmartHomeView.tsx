import React, { useState, useCallback } from 'react';
import {
  Lightbulb,
  Power,
  Thermometer,
  Droplets,
  Wind,
  Lock,
  Unlock,
  Video,
  Home,
  LogOut,
  Moon,
  Film,
  BookOpen,
  Plus,
  Minus,
  RotateCcw,
  ChevronLeft,
  Zap
} from '@/utils/icons';
import type { SmartDevice, SmartScene, DeviceType } from '../automation/types';

interface SmartHomeViewProps {
  onBack?: () => void;
}

// Mock data
const MOCK_SCENES: SmartScene[] = [
  { id: 'scene-1', name: '回家模式', icon: 'Home', deviceIds: ['dev-1', 'dev-2', 'dev-3'], actions: [] },
  { id: 'scene-2', name: '离家模式', icon: 'LogOut', deviceIds: ['dev-1', 'dev-2', 'dev-3', 'dev-4'], actions: [] },
  { id: 'scene-3', name: '睡眠模式', icon: 'Moon', deviceIds: ['dev-1', 'dev-2', 'dev-5'], actions: [] },
  { id: 'scene-4', name: '观影模式', icon: 'Film', deviceIds: ['dev-1', 'dev-3'], actions: [] },
  { id: 'scene-5', name: '阅读模式', icon: 'BookOpen', deviceIds: ['dev-1', 'dev-3'], actions: [] }
];

const MOCK_DEVICES: SmartDevice[] = [
  {
    id: 'dev-1',
    name: '客厅主灯',
    type: 'light',
    status: 'online',
    isOn: true,
    attributes: { brightness: 75 },
    entityId: 'light.living_room',
    room: '客厅',
    lastUpdated: '2024-01-01T10:00:00'
  },
  {
    id: 'dev-2',
    name: '餐厅灯',
    type: 'light',
    status: 'online',
    isOn: false,
    attributes: {},
    entityId: 'light.dining_room',
    room: '餐厅',
    lastUpdated: '2024-01-01T10:00:00'
  },
  {
    id: 'dev-3',
    name: '卧室灯',
    type: 'light',
    status: 'online',
    isOn: true,
    attributes: { brightness: 50 },
    entityId: 'light.bedroom',
    room: '卧室',
    lastUpdated: '2024-01-01T10:00:00'
  },
  {
    id: 'dev-4',
    name: '阳台灯',
    type: 'light',
    status: 'online',
    isOn: false,
    attributes: {},
    entityId: 'light.balcony',
    room: '阳台',
    lastUpdated: '2024-01-01T10:00:00'
  },
  {
    id: 'dev-5',
    name: '客厅插座',
    type: 'switch',
    status: 'online',
    isOn: true,
    attributes: {},
    entityId: 'switch.living_room_socket',
    room: '客厅',
    lastUpdated: '2024-01-01T10:00:00'
  },
  {
    id: 'dev-6',
    name: '电视插座',
    type: 'switch',
    status: 'online',
    isOn: false,
    attributes: {},
    entityId: 'switch.tv_socket',
    room: '客厅',
    lastUpdated: '2024-01-01T10:00:00'
  },
  {
    id: 'dev-7',
    name: '打印机',
    type: 'switch',
    status: 'online',
    isOn: true,
    attributes: {},
    entityId: 'switch.printer',
    room: '书房',
    lastUpdated: '2024-01-01T10:00:00'
  },
  {
    id: 'dev-8',
    name: '路由器',
    type: 'switch',
    status: 'online',
    isOn: true,
    attributes: {},
    entityId: 'switch.router',
    room: '客厅',
    lastUpdated: '2024-01-01T10:00:00'
  },
  {
    id: 'dev-9',
    name: '客厅空调',
    type: 'climate',
    status: 'online',
    isOn: true,
    attributes: { temperature: 24, mode: 'cool', fan: 'medium' },
    entityId: 'climate.living_room_ac',
    room: '客厅',
    lastUpdated: '2024-01-01T10:00:00'
  },
  {
    id: 'dev-10',
    name: '卧室空调',
    type: 'climate',
    status: 'online',
    isOn: false,
    attributes: { temperature: 26, mode: 'off' },
    entityId: 'climate.bedroom_ac',
    room: '卧室',
    lastUpdated: '2024-01-01T10:00:00'
  }
];

const DeviceIcon = ({ type, isOn }: { type: DeviceType; isOn?: boolean }) => {
  const props = { className: `w-5 h-5 ${isOn ? 'text-[#10b981]' : 'text-[#525252]'}` };
  switch (type) {
    case 'light':
      return <Lightbulb {...props} />;
    case 'switch':
      return <Power {...props} />;
    case 'climate':
      return <Wind {...props} />;
    case 'sensor':
      return <Droplets {...props} />;
    case 'camera':
      return <Video {...props} />;
    case 'lock':
      return isOn ? <Lock {...props} /> : <Unlock {...props} />;
    default:
      return <Zap {...props} />;
  }
};

const SceneIcon = ({ icon }: { icon: string }) => {
  const props = { className: "w-5 h-5" };
  switch (icon) {
    case 'Home':
      return <Home {...props} />;
    case 'LogOut':
      return <LogOut {...props} />;
    case 'Moon':
      return <Moon {...props} />;
    case 'Film':
      return <Film {...props} />;
    case 'BookOpen':
      return <BookOpen {...props} />;
    default:
      return <Zap {...props} />;
  }
};

const getDeviceStatusText = (device: SmartDevice) => {
  if (device.status === 'offline') return '离线';
  if (!device.isOn) return '已关闭';
  
  switch (device.type) {
    case 'light':
      return device.attributes.brightness ? `${device.attributes.brightness}%` : '开启';
    case 'climate':
      return `${device.attributes.mode === 'cool' ? '制冷' : '制热'} ${device.attributes.temperature}℃`;
    default:
      return '开启';
  }
};

export const SmartHomeView: React.FC<SmartHomeViewProps> = ({ onBack }) => {
  const [devices, setDevices] = useState<SmartDevice[]>(MOCK_DEVICES);
  const [scenes] = useState<SmartScene[]>(MOCK_SCENES);
  const [syncing, setSyncing] = useState(false);

  const handleToggleDevice = useCallback((deviceId: string) => {
    setDevices(prev => prev.map(d => 
      d.id === deviceId ? { ...d, isOn: !d.isOn, lastUpdated: new Date().toISOString() } : d
    ));
  }, []);

  const handleAdjustBrightness = useCallback((deviceId: string, delta: number) => {
    setDevices(prev => prev.map(d => {
      if (d.id !== deviceId) return d;
      const newBrightness = Math.max(0, Math.min(100, (d.attributes.brightness || 50) + delta));
      return { ...d, attributes: { ...d.attributes, brightness: newBrightness }, lastUpdated: new Date().toISOString() };
    }));
  }, []);

  const handleAdjustTemperature = useCallback((deviceId: string, delta: number) => {
    setDevices(prev => prev.map(d => {
      if (d.id !== deviceId) return d;
      const newTemp = Math.max(16, Math.min(30, (d.attributes.temperature || 24) + delta));
      return { ...d, attributes: { ...d.attributes, temperature: newTemp }, lastUpdated: new Date().toISOString() };
    }));
  }, []);

  const handleSync = useCallback(() => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 2000);
  }, []);

  const lights = devices.filter(d => d.type === 'light');
  const switches = devices.filter(d => d.type === 'switch');
  const climates = devices.filter(d => d.type === 'climate');

  const renderDeviceCard = (device: SmartDevice) => {
    const isLight = device.type === 'light';
    const isClimate = device.type === 'climate';

    return (
      <div
        key={device.id}
        className="bg-[#171717] rounded-lg p-4 border border-white/5 hover:border-[#10b981]/50 transition-all cursor-pointer"
        onClick={() => handleToggleDevice(device.id)}
      >
        <div className="flex items-start justify-between mb-3">
          <DeviceIcon type={device.type} isOn={device.isOn} />
          <div className="flex flex-col items-end gap-1">
            <span className={`text-xs ${device.isOn ? 'text-[#10b981]' : 'text-[#525252]'}`}>
              {device.isOn ? '●' : '○'}
            </span>
            <span className="text-xs text-[#525252]">{device.status === 'online' ? '在线' : '离线'}</span>
          </div>
        </div>

        <h3 className="font-medium text-[#f5f5f5] text-sm mb-1">{device.name}</h3>
        <p className="text-xs text-[#a3a3a3] mb-3">{getDeviceStatusText(device)}</p>

        {isLight && device.isOn && (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); handleAdjustBrightness(device.id, -10); }}
              className="p-1 rounded bg-white/5 text-[#a3a3a3] hover:bg-white/10"
            >
              <Minus className="w-3 h-3" />
            </button>
            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#10b981] rounded-full"
                style={{ width: `${device.attributes.brightness || 0}%` }}
              />
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleAdjustBrightness(device.id, 10); }}
              className="p-1 rounded bg-white/5 text-[#a3a3a3] hover:bg-white/10"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        )}

        {isClimate && device.isOn && (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); handleAdjustTemperature(device.id, -1); }}
              className="p-1 rounded bg-white/5 text-[#a3a3a3] hover:bg-white/10"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-sm text-[#f5f5f5] font-medium flex-1 text-center">
              {device.attributes.temperature}℃
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); handleAdjustTemperature(device.id, 1); }}
              className="p-1 rounded bg-white/5 text-[#a3a3a3] hover:bg-white/10"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); handleToggleDevice(device.id); }}
          className={`w-full mt-3 py-1.5 rounded text-xs font-medium transition-colors ${
            device.isOn
              ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
              : 'bg-[#10b981]/20 text-[#10b981] hover:bg-[#10b981]/30'
          }`}
        >
          {device.isOn ? '关闭' : '开启'}
        </button>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-white/10 text-[#a3a3a3] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-[#f5f5f5]">智能家居控制中心</h1>
            <p className="text-sm text-[#a3a3a3]">统一控制所有智能设备，一键执行场景</p>
          </div>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 text-[#a3a3a3] rounded-lg hover:bg-white/10 transition-colors"
        >
          <RotateCcw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          同步设备
        </button>
      </div>

      {/* Quick Scenes */}
      <div className="px-6 py-4">
        <h2 className="text-sm font-medium text-[#a3a3a3] mb-3">快捷场景</h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {scenes.map(scene => (
            <button
              key={scene.id}
              className="flex items-center gap-2 px-4 py-2 bg-[#171717] rounded-lg border border-white/5 hover:border-[#10b981]/50 hover:bg-[#171717]/80 transition-all text-[#f5f5f5] text-sm whitespace-nowrap"
            >
              <SceneIcon icon={scene.icon} />
              {scene.name}
            </button>
          ))}
        </div>
      </div>

      {/* Device Groups */}
      <div className="flex-1 px-6 pb-6 overflow-auto space-y-6">
        {/* Lights */}
        <div>
          <h2 className="text-sm font-medium text-[#a3a3a3] mb-3">灯光控制</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {lights.map(renderDeviceCard)}
          </div>
        </div>

        {/* Switches */}
        <div>
          <h2 className="text-sm font-medium text-[#a3a3a3] mb-3">开关控制</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {switches.map(renderDeviceCard)}
          </div>
        </div>

        {/* Climate */}
        <div>
          <h2 className="text-sm font-medium text-[#a3a3a3] mb-3">空调控制</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {climates.map(renderDeviceCard)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartHomeView;
