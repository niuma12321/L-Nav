import React from 'react';
import { Home, RefreshCw, ChevronRight, Lightbulb, Wind, Power } from 'lucide-react';
import { useSmartHome } from '../../hooks/useSmartHome';

interface SmartHomeStatusWidgetProps {
  onClick?: () => void;
}

const DeviceIcon = ({ type, isOn }: { type: string; isOn: boolean }) => {
  const className = `w-4 h-4 ${isOn ? 'text-[#10b981]' : 'text-[#525252]'}`;
  switch (type) {
    case 'light':
      return <Lightbulb className={className} />;
    case 'climate':
      return <Wind className={className} />;
    case 'switch':
      return <Power className={className} />;
    default:
      return <Home className={className} />;
  }
};

export const SmartHomeStatusWidget: React.FC<SmartHomeStatusWidgetProps> = ({ onClick }) => {
  const { devices, loading, refreshDevices } = useSmartHome();
  
  // 获取前4个在线设备
  const displayDevices = devices
    .filter(d => d.state !== 'unavailable')
    .slice(0, 4);

  const getDeviceStatus = (device: typeof devices[0]) => {
    const isOn = device.state === 'on' || device.state === 'heat' || device.state === 'cool';
    const temp = device.attributes?.temperature;
    return {
      isOn,
      display: temp ? `${temp}℃` : isOn ? '开启' : '关闭'
    };
  };

  return (
    <div className="h-full flex flex-col bg-[#171717] rounded-lg p-4 border border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-[#f5f5f5]">智能家居</h3>
        <div className="flex items-center gap-1">
          <button 
            onClick={refreshDevices}
            className="p-1 rounded hover:bg-white/10 text-[#a3a3a3]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button className="p-1 rounded hover:bg-white/10 text-[#a3a3a3]">
            <span className="text-xs">⋮</span>
          </button>
        </div>
      </div>

      {/* Device List */}
      <div className="flex-1 space-y-2">
        {displayDevices.length === 0 ? (
          <p className="text-sm text-[#525252] text-center py-4">暂无设备</p>
        ) : (
          displayDevices.map(device => {
            const { isOn, display } = getDeviceStatus(device);
            return (
              <div key={device.id} className="flex items-center gap-2 py-1.5">
                <DeviceIcon type={device.type} isOn={isOn} />
                <span className="text-sm text-[#a3a3a3] flex-1 truncate">{device.name}</span>
                <span className={`text-xs ${isOn ? 'text-[#10b981]' : 'text-[#525252]'}`}>
                  {display}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <button 
        onClick={onClick}
        className="flex items-center gap-1 mt-3 pt-3 border-t border-white/5 text-xs text-[#10b981] hover:text-[#059669] transition-colors"
      >
        查看全部
        <ChevronRight className="w-3 h-3" />
      </button>
    </div>
  );
};

export default SmartHomeStatusWidget;
