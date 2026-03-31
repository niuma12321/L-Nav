import React, { useState, useEffect, useCallback } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Droplets, Loader } from 'lucide-react';
import { WeatherWidgetSettings } from '../../types/widgets';

interface WeatherWidgetProps {
  settings: WeatherWidgetSettings;
  onUpdateSettings: (settings: Partial<WeatherWidgetSettings>) => void;
}

interface WeatherData {
  city: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  icon: string;
  updatedAt: number;
}

const WEATHER_CACHE_KEY = 'ynav:weather:cache:v1';
const CACHE_DURATION = 30 * 60 * 1000; // 30分钟

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ settings, onUpdateSettings }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取天气数据
  const fetchWeather = useCallback(async () => {
    if (!settings.city) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // 检查缓存
      const cached = localStorage.getItem(WEATHER_CACHE_KEY);
      if (cached) {
        const cachedData: WeatherData & { _cachedAt: number } = JSON.parse(cached);
        if (cachedData.city === settings.city && 
            Date.now() - cachedData._cachedAt < CACHE_DURATION) {
          setWeather(cachedData);
          setLoading(false);
          return;
        }
      }
      
      // 使用和风天气 API（需要申请 key，这里使用演示数据）
      // 实际项目中应该使用真实的天气 API
      const mockWeather: WeatherData = {
        city: settings.city,
        temperature: 22 + Math.floor(Math.random() * 10 - 5),
        condition: ['晴', '多云', '阴', '小雨'][Math.floor(Math.random() * 4)],
        humidity: 45 + Math.floor(Math.random() * 30),
        windSpeed: 3 + Math.floor(Math.random() * 5),
        icon: 'sun',
        updatedAt: Date.now()
      };
      
      // 缓存数据
      localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({
        ...mockWeather,
        _cachedAt: Date.now()
      }));
      
      setWeather(mockWeather);
    } catch (err) {
      setError('获取天气失败');
    } finally {
      setLoading(false);
    }
  }, [settings.city]);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case '晴': return <Sun className="w-8 h-8 text-yellow-500" />;
      case '多云': return <Cloud className="w-8 h-8 text-gray-400" />;
      case '阴': return <Cloud className="w-8 h-8 text-slate-500" />;
      case '小雨': return <CloudRain className="w-8 h-8 text-blue-400" />;
      case '雪': return <CloudSnow className="w-8 h-8 text-blue-200" />;
      default: return <Sun className="w-8 h-8 text-yellow-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-sm text-slate-500">
        <Cloud className="w-8 h-8 mb-2 opacity-50" />
        <span>{error || '未设置城市'}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {weather.city}
        </span>
        <button
          onClick={fetchWeather}
          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="刷新"
        >
          <Loader className={`w-3 h-3 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      <div className="flex items-center gap-3 flex-1">
        {getWeatherIcon(weather.condition)}
        <div>
          <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            {weather.temperature}°
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {weather.condition}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
        {settings.showHumidity && (
          <div className="flex items-center gap-1">
            <Droplets className="w-3 h-3" />
            <span>{weather.humidity}%</span>
          </div>
        )}
        {settings.showWind && (
          <div className="flex items-center gap-1">
            <Wind className="w-3 h-3" />
            <span>{weather.windSpeed}级</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherWidget;
