import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Wind, Droplets, Eye } from 'lucide-react';

interface WeatherWidgetProps {
  className?: string;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ className = '' }) => {
  const [weather, setWeather] = useState({
    temp: 22,
    condition: '多云',
    humidity: 65,
    windSpeed: 12,
    visibility: 10,
    location: '北京',
    feelsLike: 24,
  });
  const [loading, setLoading] = useState(false);

  // Simulate fetching weather data
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const getWeatherIcon = () => {
    switch (weather.condition) {
      case '晴': return <Sun className="w-8 h-8 text-amber-400" />;
      case '多云': return <Cloud className="w-8 h-8 text-slate-400" />;
      case '雨': return <CloudRain className="w-8 h-8 text-blue-400" />;
      default: return <Sun className="w-8 h-8 text-amber-400" />;
    }
  };

  return (
    <div className={`v3-card p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">实时气象</h3>
        <span className="text-xs text-slate-500">{weather.location}</span>
      </div>

      {loading ? (
        <div className="h-32 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4 mb-4">
            {getWeatherIcon()}
            <div>
              <div className="text-4xl font-bold text-white">{weather.temp}°</div>
              <div className="text-sm text-slate-400">{weather.condition} · 体感 {weather.feelsLike}°</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5">
              <Droplets className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-slate-300">{weather.humidity}%</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5">
              <Wind className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-slate-300">{weather.windSpeed}km/h</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5">
              <Eye className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-slate-300">{weather.visibility}km</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WeatherWidget;
