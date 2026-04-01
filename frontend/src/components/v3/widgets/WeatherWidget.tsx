import React, { useState, useEffect } from 'react';
import { MapPin, Cloud, Sun, CloudRain, CloudSnow } from 'lucide-react';

interface WeatherWidgetProps {
  className?: string;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ className = '' }) => {
  const [weather, setWeather] = useState({
    temp: 24,
    condition: '多云转晴',
    humidity: 45,
    windSpeed: 12,
    uvIndex: '中等',
    airQuality: 42,
    airQualityText: '优',
    location: '上海',
    district: '静安区',
    feelsLike: 26,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
  }, []);

  const getWeatherIcon = () => {
    switch (weather.condition) {
      case '晴':
      case '多云转晴':
        return <Sun className="w-16 h-16 text-emerald-400" strokeWidth={1.5} />;
      case '多云':
        return <Cloud className="w-16 h-16 text-slate-400" strokeWidth={1.5} />;
      case '雨':
        return <CloudRain className="w-16 h-16 text-blue-400" strokeWidth={1.5} />;
      case '雪':
        return <CloudSnow className="w-16 h-16 text-white" strokeWidth={1.5} />;
      default:
        return <Sun className="w-16 h-16 text-emerald-400" strokeWidth={1.5} />;
    }
  };

  return (
    <div 
      className={`relative overflow-hidden rounded-3xl bg-[#181a1c] p-6 ${className}`}
    >
      {loading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Location */}
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-white font-medium">{weather.location},</span>
            <span className="text-sm text-emerald-400">{weather.district}</span>
          </div>

          {/* Main Weather Display */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="text-6xl font-bold text-white tracking-tight">{weather.temp}°C</div>
              <div className="text-base text-slate-400 mt-1">{weather.condition} · 空气优</div>
            </div>
            <div className="mt-2">
              {getWeatherIcon()}
            </div>
          </div>

          {/* Air Quality Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-500">Air Quality</span>
              <span className="text-emerald-400 font-medium">Excellent {weather.airQuality}</span>
            </div>
            <div className="h-1.5 bg-[#0d0e10] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                style={{ width: `${(weather.airQuality / 100) * 100}%` }}
              />
            </div>
          </div>

          {/* Weather Details */}
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="text-xs text-slate-500 mb-1">湿度</div>
              <div className="text-base font-semibold text-white">{weather.humidity}%</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-500 mb-1">风速</div>
              <div className="text-base font-semibold text-white">{weather.windSpeed} km/h</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-500 mb-1">紫外线</div>
              <div className="text-base font-semibold text-white">{weather.uvIndex}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WeatherWidget;
