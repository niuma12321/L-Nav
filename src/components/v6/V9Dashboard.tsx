import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Search,
  Zap,
  Loader2,
  Grid3X3,
  LayoutDashboard,
  FolderOpen,
  FlaskConical,
  Plus,
  Cloud,
  Droplets,
  Wind,
  CheckSquare,
  TrendingUp,
  Flame,
  ExternalLink,
  RefreshCw,
  Settings,
  Menu,
  House,
  Pin,
  EyeOff,
  LayoutGrid,
  List,
  Monitor,
  Bell,
  User,
  X,
  Trash2,
  Clock,
  MapPin,
  Navigation,
  Newspaper,
  Rss,
  MoreVertical,
  GripVertical,
  ChevronDown,
  Database,
  Globe,
} from 'lucide-react';
import { useWidgetSystem } from '../../hooks/useWidgetSystem';
import { getUserData, setUserData } from '../../utils/constants';

import { APIDataWidget } from './APIDataWidget';
import ContentPreview from './ContentPreview';
import NavEditModal from '../modals/NavEditModal';

// Static imports - fixed dynamic import issues
import ResourceCenterViewCN from './ResourceCenterViewCN';
import RSSReaderViewCN from './RSSReaderViewCN';
import WidgetConfigCenter from './WidgetConfigCenter';
import { EmbeddedNewsWidget } from './EmbeddedNewsWidget';
import { SmartHomeView } from '../smartHome/SmartHomeView';
import { NotificationsViewCN } from './NotificationsViewCN';
import LabView from './LabView';
import EmojiPicker from '../ui/EmojiPicker';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationDropdown } from './NotificationDropdown';
import AutomationCenterView from './AutomationViewCN';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface V9DashboardProps {
  onAddResource?: () => void;
  onOpenSettings?: () => void;
  onOpenImport?: () => void;
  onEditLink?: (link: any) => void;
  onDeleteLink?: (id: string) => void;
  links?: Array<{
    id: string;
    title: string;
    url: string;
    description?: string;
    icon?: string;
    categoryId?: string;
    pinned?: boolean;
    hidden?: boolean;
  }>;
  categories?: Array<{
    id: string;
    name: string;
    icon?: string;
  }>;
}

// 天气小组件 - 使用 60s API，结合实时天气和天气预报
const WeatherWidget: React.FC = () => {
  const cities = [
    '北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '武汉', '西安', '重庆',
    '天津', '苏州', '长沙', '郑州', '青岛', '大连', '厦门', '昆明', '合肥', '济南'
  ];

  const [city, setCity] = useState('北京');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCitySelector, setShowCitySelector] = useState(false);
  
  // 实时天气数据
  const [currentWeather, setCurrentWeather] = useState({
    temperature: 23,
    condition: '多云',
    humidity: 61,
    windDirection: '东南风',
    windPower: '3级',
    updated: '',
    weatherIcon: ''
  });
  
  // 空气质量数据
  const [airQuality, setAirQuality] = useState({
    aqi: 75,
    quality: '良',
    pm25: 35,
    pm10: 50
  });
  
  // 预报数据
  const [forecast, setForecast] = useState<Array<{
    date: string;
    dayCondition: string;
    nightCondition: string;
    maxTemp: number;
    minTemp: number;
    dayWeatherIcon: string;
  }>>([]);
  
  // 生活指数
  const [lifeIndices, setLifeIndices] = useState<Array<{
    name: string;
    level: string;
    description: string;
  }>>([]);

  // 获取天气图标
  const getWeatherIcon = (condition: string) => {
    if (condition.includes('晴')) return '☀️';
    if (condition.includes('多云')) return '⛅';
    if (condition.includes('阴')) return '☁️';
    if (condition.includes('雨')) return '🌧️';
    if (condition.includes('雪')) return '❄️';
    if (condition.includes('雷')) return '⛈️';
    if (condition.includes('雾')) return '🌫️';
    return '🌤️';
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    if (isToday) return '今天';
    if (isTomorrow) return '明天';
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // 获取实时天气
  const fetchCurrentWeather = useCallback(async (cityName: string) => {
    try {
      const response = await fetch(`https://60s.viki.moe/v2/weather?query=${encodeURIComponent(cityName)}`);
      const data = await response.json();
      
      if (data.code === 200 && data.data) {
        const { weather, air_quality, life_indices } = data.data;
        
        setCurrentWeather({
          temperature: weather.temperature,
          condition: weather.condition,
          humidity: weather.humidity,
          windDirection: weather.wind_direction,
          windPower: weather.wind_power,
          updated: weather.updated,
          weatherIcon: weather.weather_icon
        });
        
        setAirQuality({
          aqi: air_quality.aqi,
          quality: air_quality.quality,
          pm25: air_quality.pm25,
          pm10: air_quality.pm10
        });
        
        if (life_indices && life_indices.length > 0) {
          setLifeIndices(life_indices.slice(0, 4).map((item: any) => ({
            name: item.name,
            level: item.level,
            description: item.description
          })));
        }
        
        return true;
      }
      return false;
    } catch (err) {
      console.error('获取实时天气失败:', err);
      return false;
    }
  }, []);

  // 获取天气预报
  const fetchForecast = useCallback(async (cityName: string) => {
    try {
      const response = await fetch(`https://60s.viki.moe/v2/weather/forecast?query=${encodeURIComponent(cityName)}&days=7`);
      const data = await response.json();
      
      if (data.code === 200 && data.data) {
        const { daily_forecast } = data.data;
        
        setForecast(daily_forecast.slice(0, 5).map((item: any) => ({
          date: item.date,
          dayCondition: item.day_condition,
          nightCondition: item.night_condition,
          maxTemp: item.max_temperature,
          minTemp: item.min_temperature,
          dayWeatherIcon: item.day_weather_icon
        })));
        
        return true;
      }
      return false;
    } catch (err) {
      console.error('获取天气预报失败:', err);
      return false;
    }
  }, []);

  // 获取所有天气数据
  const fetchWeatherData = useCallback(async (cityName: string) => {
    setLoading(true);
    setError('');
    
    try {
      await Promise.all([
        fetchCurrentWeather(cityName),
        fetchForecast(cityName)
      ]);
      
      setUserData('weather_city', cityName);
    } catch (err) {
      setError('获取天气数据失败');
    } finally {
      setLoading(false);
    }
  }, [fetchCurrentWeather, fetchForecast]);

  // 初始化加载
  useEffect(() => {
    const savedCity = getUserData<string | null>('weather_city', null);
    if (savedCity && cities.includes(savedCity)) {
      setCity(savedCity);
      fetchWeatherData(savedCity);
    } else {
      fetchWeatherData(city);
    }
  }, []);

  // 自动刷新
  useEffect(() => {
    const timer = setInterval(() => {
      fetchWeatherData(city);
    }, 30 * 60 * 1000); // 30分钟刷新
    
    return () => clearInterval(timer);
  }, [city, fetchWeatherData]);

  const handleCitySelect = (selectedCity: string) => {
    setCity(selectedCity);
    fetchWeatherData(selectedCity);
    setShowCitySelector(false);
  };

  const handleRefresh = () => {
    fetchWeatherData(city);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button 
          onClick={() => setShowCitySelector(true)}
          className="flex items-center gap-1 text-sm font-medium text-slate-300 hover:text-emerald-400 transition-colors"
        >
          <MapPin className="w-3.5 h-3.5" />
          {city}
        </button>
        <div className="flex items-center gap-1">
          <button 
            onClick={handleRefresh}
            disabled={loading}
            className="p-1 rounded hover:bg-white/5 transition-colors"
            title="刷新天气"
          >
            <RefreshCw className={`w-3 h-3 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 城市选择弹窗 */}
      {showCitySelector && (
        <div className="absolute inset-0 z-50 bg-[#181a1c] rounded-xl p-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-300">选择城市</span>
            <button 
              onClick={() => setShowCitySelector(false)}
              className="p-1 rounded hover:bg-white/5 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-40">
            {cities.map(cityName => (
              <button
                key={cityName}
                onClick={() => handleCitySelect(cityName)}
                className={`px-2 py-1.5 rounded-lg text-xs transition-colors text-center ${
                  city === cityName 
                    ? 'bg-emerald-500 text-[#0d0e10]' 
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {cityName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 当前天气 */}
      <div className="flex items-center gap-3 mb-3">
        {loading ? (
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
        ) : (
          <>
            <span className="text-4xl">{getWeatherIcon(currentWeather.condition)}</span>
            <div>
              <div className="text-3xl font-bold text-white">{currentWeather.temperature}°</div>
              <div className="text-xs text-slate-400">{currentWeather.condition}</div>
            </div>
          </>
        )}
      </div>

      {/* 天气详情 */}
      <div className="flex items-center gap-4 mb-3 text-xs text-slate-400">
        <div className="flex items-center gap-1">
          <Droplets className="w-3 h-3" />
          <span>{currentWeather.humidity}%</span>
        </div>
        <div className="flex items-center gap-1">
          <Wind className="w-3 h-3" />
          <span>{currentWeather.windPower}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
            airQuality.aqi <= 50 ? 'bg-green-500/20 text-green-400' :
            airQuality.aqi <= 100 ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-orange-500/20 text-orange-400'
          }`}>
            AQI {airQuality.aqi} {airQuality.quality}
          </span>
        </div>
      </div>

      {/* 未来预报 */}
      {forecast.length > 0 && (
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">未来预报</span>
          </div>
          <div className="space-y-1.5 overflow-y-auto max-h-[120px]">
            {forecast.map((day, index) => (
              <div key={index} className="flex items-center justify-between py-1">
                <span className="text-xs text-slate-400 w-10">{formatDate(day.date)}</span>
                <span className="text-sm">{getWeatherIcon(day.dayCondition)}</span>
                <span className="text-xs text-slate-400 flex-1 text-center">{day.dayCondition}</span>
                <span className="text-xs text-slate-300">
                  {day.minTemp}° / {day.maxTemp}°
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="text-xs text-red-400 mt-2">{error}</div>
      )}
    </div>
  );
};

// 待办小组件
const TodoWidget: React.FC = () => {
  const [todos, setTodos] = useState([
    { id: 1, title: '复盘昨日北向资金流入排行', completed: true, createdAt: Date.now() - 86400000 },
    { id: 2, title: '分析半导体板块Q3财报数据', completed: false, priority: 'high', createdAt: Date.now() - 172800000 },
    { id: 3, title: '更新下周自选股池', completed: false, createdAt: Date.now() - 259200000 },
  ]);
  const [newTask, setNewTask] = useState('');

  const toggleTodo = (id: number) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const addTodo = () => {
    if (newTask.trim()) {
      setTodos([...todos, { 
        id: Date.now(), 
        title: newTask, 
        completed: false,
        createdAt: Date.now()
      }]);
      setNewTask('');
    }
  };

  const deleteTodo = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setTodos(todos.filter(t => t.id !== id));
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);
    
    if (days === 0) {
      return '今天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  };

  const completedCount = todos.filter(t => t.completed).length;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-300">待办事项</span>
        <span className="text-xs text-slate-400">{completedCount}/{todos.length}</span>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          placeholder="添加新任务..."
          className="flex-1 px-2 py-1.5 text-sm bg-[#0d0e10] rounded-lg border border-white/5 focus:border-emerald-500/50 focus:outline-none placeholder:text-slate-500"
        />
        <button
          onClick={addTodo}
          disabled={!newTask.trim()}
          className="p-1.5 rounded-lg bg-emerald-500 text-[#0d0e10] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-400 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1.5">
        {todos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <CheckSquare className="w-6 h-6 mb-1 opacity-50" />
            <span className="text-xs">暂无待办</span>
          </div>
        ) : (
          todos.map(todo => (
            <div
              key={todo.id}
              onClick={() => toggleTodo(todo.id)}
              className="flex items-start gap-3 p-3 rounded-xl bg-[#0d0e10] cursor-pointer hover:bg-[#1a1c1f] transition-colors group"
            >
              <button
                className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center transition-colors ${
                  todo.completed ? 'bg-emerald-500' : 'border-2 border-slate-600'
                }`}
              >
                {todo.completed && <span className="text-[#0d0e10] text-xs">✓</span>}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm truncate ${todo.completed ? 'text-slate-500 line-through' : 'text-white'}`}>
                  {todo.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-slate-500">{formatTime(todo.createdAt)}</span>
                  {todo.priority === 'high' && !todo.completed && (
                    <span className="text-[10px] text-emerald-400">高优先级</span>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => deleteTodo(todo.id, e)}
                className="p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                title="删除"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// 热搜小组件 - 接入真实微博热搜API
const NewsWidget: React.FC = () => {
  const [hotList, setHotList] = useState<Array<{id: number; title: string; hot: string; rank: number; url?: string}>>([]);
  const [source, setSource] = useState<'weibo' | 'zhihu' | 'baidu'>('weibo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 获取微博热搜 - 已禁用外部API，使用模拟数据
  const fetchWeiboHot = async () => {
    // 禁用外部API调用，直接使用模拟数据
    setHotList([
      { id: 1, title: '科技发展新动态', hot: '450万', rank: 1, url: '#' },
      { id: 2, title: '今日热门话题讨论', hot: '320万', rank: 2, url: '#' },
      { id: 3, title: '娱乐圈最新消息', hot: '280万', rank: 3, url: '#' },
    ]);
  };

  // 获取知乎热榜 - 已禁用外部API
  const fetchZhihuHot = async () => {
    setHotList([
      { id: 1, title: '如何评价最新技术突破？', hot: '8900', rank: 1, url: '#' },
      { id: 2, title: '有哪些值得收藏的学习资源？', hot: '6500', rank: 2, url: '#' },
      { id: 3, title: '职场新人应该注意什么？', hot: '5200', rank: 3, url: '#' },
    ]);
  };

  // 获取百度热搜 - 已禁用外部API
  const fetchBaiduHot = async () => {
    setHotList([
      { id: 1, title: '最新新闻资讯', hot: '热', rank: 1, url: '#' },
      { id: 2, title: '热门搜索关键词', hot: '热', rank: 2, url: '#' },
      { id: 3, title: '今日焦点事件', hot: '热', rank: 3, url: '#' },
    ]);
  };

  const refreshHot = async () => {
    setLoading(true);
    if (source === 'weibo') {
      await fetchWeiboHot();
    } else if (source === 'zhihu') {
      await fetchZhihuHot();
    } else {
      await fetchBaiduHot();
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshHot();
    // 每5分钟自动刷新
    const timer = setInterval(refreshHot, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [source]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-red-500" />
          <span className="text-sm font-medium text-slate-300">
            {source === 'weibo' ? '微博热搜' : source === 'zhihu' ? '知乎热榜' : '百度热搜'}
          </span>
          {loading && <RefreshCw className="w-3 h-3 text-slate-500 animate-spin" />}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSource('weibo')}
            className={`px-2 py-0.5 text-xs rounded transition-colors ${
              source === 'weibo' ? 'bg-emerald-500 text-[#0d0e10]' : 'bg-white/5 text-slate-400'
            }`}
          >
            微博
          </button>
          <button
            onClick={() => setSource('zhihu')}
            className={`px-2 py-0.5 text-xs rounded transition-colors ${
              source === 'zhihu' ? 'bg-emerald-500 text-[#0d0e10]' : 'bg-white/5 text-slate-400'
            }`}
          >
            知乎
          </button>
          <button
            onClick={() => setSource('baidu')}
            className={`px-2 py-0.5 text-xs rounded transition-colors ${
              source === 'baidu' ? 'bg-emerald-500 text-[#0d0e10]' : 'bg-white/5 text-slate-400'
            }`}
          >
            百度
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1.5">
        {hotList.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : (
          hotList.map((item) => (
            <a
              key={item.id}
              href={item.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-white/5 transition-colors duration-200 group"
            >
              <span className={`w-5 h-5 flex items-center justify-center rounded text-xs font-bold ${
                item.rank <= 3
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-white/5 text-slate-400'
              }`}>
                {item.rank}
              </span>
              <span className="flex-1 text-sm text-slate-300 truncate">{item.title}</span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Flame className="w-3 h-3" />
                {item.hot}
              </span>
              <ExternalLink className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          ))
        )}
      </div>
      <div className="mt-2 pt-2 border-t border-white/5">
        <button
          onClick={refreshHot}
          disabled={loading}
          className="w-full py-1.5 text-xs text-slate-500 hover:text-emerald-400 flex items-center justify-center gap-1 transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          {loading ? '刷新中...' : '刷新热搜'}
        </button>
      </div>
    </div>
  );
};

// 资讯流中心组件
const NewsFeedWidget: React.FC = () => {
  const [news, setNews] = useState<Array<{id: number; title: string; source: string; time: string; url: string; summary?: string}>>([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<'tech' | 'finance' | 'general'>('tech');

  const fetchNews = async () => {
    setLoading(true);
    // 禁用外部API，使用模拟数据
    setNews([
      { id: 1, title: '科技新闻示例标题一', source: '科技', time: '刚刚', url: '#', summary: '这是一条科技新闻摘要...' },
      { id: 2, title: '财经新闻示例标题二', source: '财经', time: '5分钟前', url: '#', summary: '这是一条财经新闻摘要...' },
    ]);
    setLoading(false);
  };

  useEffect(() => {
    fetchNews();
    // 每10分钟刷新一次
    const timer = setInterval(fetchNews, 10 * 60 * 1000);
    return () => clearInterval(timer);
  }, [category]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-slate-300">资讯流中心</span>
          {loading && <Loader2 className="w-3 h-3 text-slate-500 animate-spin" />}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCategory('tech')}
            className={`px-2 py-0.5 text-xs rounded transition-colors ${
              category === 'tech' ? 'bg-emerald-500 text-[#0d0e10]' : 'bg-white/5 text-slate-400'
            }`}
          >
            科技
          </button>
          <button
            onClick={() => setCategory('finance')}
            className={`px-2 py-0.5 text-xs rounded transition-colors ${
              category === 'finance' ? 'bg-emerald-500 text-[#0d0e10]' : 'bg-white/5 text-slate-400'
            }`}
          >
            财经
          </button>
          <button
            onClick={() => setCategory('general')}
            className={`px-2 py-0.5 text-xs rounded transition-colors ${
              category === 'general' ? 'bg-emerald-500 text-[#0d0e10]' : 'bg-white/5 text-slate-400'
            }`}
          >
            综合
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-2">
        {news.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : (
          news.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 rounded-xl bg-[#0d0e10] hover:bg-[#1a1c1f] transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm text-white font-medium truncate group-hover:text-emerald-400 transition-colors">
                    {item.title}
                  </h4>
                  {item.summary && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.summary}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                    <span className="text-emerald-500/80">{item.source}</span>
                    <span>·</span>
                    <span>{item.time}</span>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 shrink-0 mt-0.5" />
              </div>
            </a>
          ))
        )}
      </div>
      
      <div className="mt-2 pt-2 border-t border-white/5">
        <button
          onClick={fetchNews}
          disabled={loading}
          className="w-full py-1.5 text-xs text-slate-500 hover:text-emerald-400 flex items-center justify-center gap-1 transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          {loading ? '刷新中...' : '刷新资讯'}
        </button>
      </div>
    </div>
  );
};

// 搜索组件
const SearchWidget: React.FC = () => {
  const defaultEngines = [
    { name: 'Google', url: 'https://www.google.com/search?q=', icon: '🔍' },
    { name: '百度', url: 'https://www.baidu.com/s?wd=', icon: '🇨🇳' },
    { name: 'GitHub', url: 'https://github.com/search?q=', icon: '⚡' },
    { name: '知乎', url: 'https://www.zhihu.com/search?q=', icon: '💡' }
  ];
  
  const [engines, setEngines] = useState(() => {
    const saved = getUserData<string | null>('search_engines', null);
    return saved ? JSON.parse(saved) : defaultEngines;
  });
  const [activeEngine, setActiveEngine] = useState(engines[0].name);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEngineModal, setShowEngineModal] = useState(false);
  const [newEngine, setNewEngine] = useState({ name: '', url: '', icon: '' });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    return getUserData<string[]>('search_history', []);
  });

  // 保存搜索历史
  const saveSearchHistory = (query: string) => {
    if (!query.trim()) return;
    const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 5);
    setSearchHistory(newHistory);
    setUserData('search_history', newHistory);
  };

  // 清除搜索历史
  const clearSearchHistory = () => {
    setSearchHistory([]);
    setUserData('search_history', []);
  };

  // 从历史记录搜索
  const searchFromHistory = (query: string) => {
    setSearchQuery(query);
    const engine = engines.find(e => e.name === activeEngine);
    if (engine) {
      window.open(`${engine.url}${encodeURIComponent(query)}`, '_blank');
      saveSearchHistory(query);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const engine = engines.find(e => e.name === activeEngine);
      if (engine) {
        window.open(`${engine.url}${encodeURIComponent(searchQuery)}`, '_blank');
        saveSearchHistory(searchQuery);
      }
    }
  };

  // 保存引擎到 localStorage
  const saveEngines = (newEngines: typeof engines) => {
    setEngines(newEngines);
    setUserData('search_engines', JSON.stringify(newEngines));
  };

  // 添加新引擎
  const addEngine = () => {
    if (newEngine.name && newEngine.url) {
      const engine = { ...newEngine, icon: newEngine.icon || '🔍' };
      const updated = [...engines, engine];
      saveEngines(updated);
      setNewEngine({ name: '', url: '', icon: '' });
    }
  };

  // 删除引擎
  const removeEngine = (name: string) => {
    const updated = engines.filter(e => e.name !== name);
    saveEngines(updated);
    if (activeEngine === name && updated.length > 0) {
      setActiveEngine(updated[0].name);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto relative">
      {/* 搜索引擎选择 */}
      <div className="flex items-center gap-2 mb-3 justify-center flex-wrap">
        {engines.map(engine => (
          <button
            key={engine.name}
            onClick={() => setActiveEngine(engine.name)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              activeEngine === engine.name ? 'bg-emerald-500 text-[#0d0e10]' : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <span>{engine.icon}</span>
            <span>{engine.name}</span>
          </button>
        ))}
        <button
          onClick={() => setShowEngineModal(true)}
          className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-emerald-400 transition-colors"
          title="管理搜索引擎"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* 搜索框 */}
      <div className="relative">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#181a1c] border border-white/10">
          <Search className="w-5 h-5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={`在 ${activeEngine} 中搜索...`}
            className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 rounded-full hover:bg-white/10 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 快捷标签 + 搜索历史 横向显示 */}
      <div className="mt-3 flex justify-center gap-2 flex-wrap items-center">
        {/* 搜索历史标签 */}
        {searchHistory.length > 0 && (
          <>
            {searchHistory.map((query, index) => (
              <span
                key={index}
                onClick={() => searchFromHistory(query)}
                className="px-3 py-1 rounded-full bg-white/10 text-sm text-slate-300 hover:text-white hover:bg-white/20 cursor-pointer transition-colors flex items-center gap-1"
              >
                <Clock className="w-3 h-3" />
                {query}
              </span>
            ))}
            <button
              onClick={clearSearchHistory}
              className="p-1 rounded-full hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
              title="清除历史"
            >
              <Trash2 className="w-3 h-3" />
            </button>
            <span className="text-slate-600">|</span>
          </>
        )}
        {/* 默认快捷标签 */}
        {['React 19', 'AI 编程', '美股行情', '前端面试'].map(tag => (
          <span
            key={tag}
            onClick={() => { setSearchQuery(tag); handleSearch(); }}
            className="px-3 py-1 rounded-full bg-white/5 text-sm text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* 搜索引擎管理弹窗 */}
      {showEngineModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 overflow-y-auto" onClick={() => setShowEngineModal(false)}>
          <div className="bg-[#181a1c] rounded-2xl border border-white/10 w-full max-w-md p-6 shadow-2xl my-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">管理搜索引擎</h3>
              <button onClick={() => setShowEngineModal(false)} className="p-2 rounded-lg hover:bg-white/10 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* 现有引擎列表 */}
            <div className="space-y-2 mb-4 max-h-32 sm:max-h-48 overflow-y-auto">
              {engines.map(engine => (
                <div key={engine.name} className="flex items-center justify-between px-3 py-2 bg-[#0d0e10] rounded-lg">
                  <div className="flex items-center gap-2">
                    <span>{engine.icon}</span>
                    <span className="text-sm text-white">{engine.name}</span>
                  </div>
                  <button
                    onClick={() => removeEngine(engine.name)}
                    className="p-1 rounded hover:bg-white/10 text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* 添加新引擎 */}
            <div className="space-y-3 pt-4 border-t border-white/5">
              <p className="text-sm text-slate-400">添加新引擎</p>
              <input
                type="text"
                placeholder="名称 (如: Bing)"
                value={newEngine.name}
                onChange={(e) => setNewEngine({...newEngine, name: e.target.value})}
                className="w-full px-3 py-2 bg-[#0d0e10] rounded-lg border border-white/5 text-white text-sm"
              />
              <input
                type="text"
                placeholder="搜索URL (如: https://bing.com/search?q=)"
                value={newEngine.url}
                onChange={(e) => setNewEngine({...newEngine, url: e.target.value})}
                className="w-full px-3 py-2 bg-[#0d0e10] rounded-lg border border-white/5 text-white text-sm"
              />
              
              {/* Emoji 选择器 */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="w-full px-3 py-2 bg-[#0d0e10] rounded-lg border border-white/5 text-white text-sm flex items-center gap-2 hover:bg-[#1a1c1f] transition-colors"
                >
                  <span className="text-xl">{newEngine.icon || '🔍'}</span>
                  <span className="text-slate-400">{newEngine.icon ? '已选择图标' : '点击选择图标'}</span>
                </button>
                
                {showEmojiPicker && (
                  <div className="fixed sm:absolute z-[60] mt-2 left-4 right-4 sm:left-0 sm:right-0 max-h-[60vh] overflow-hidden">
                    <div className="bg-[#181a1c] rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[60vh]">
                      <div className="p-2 border-b border-white/5 flex justify-between items-center shrink-0">
                        <span className="text-sm text-slate-300">选择图标</span>
                        <button
                          onClick={() => setShowEmojiPicker(false)}
                          className="p-1 rounded hover:bg-white/10 text-slate-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <EmojiPicker
                          onSelect={(emoji) => {
                            setNewEngine({...newEngine, icon: emoji});
                            setShowEmojiPicker(false);
                          }}
                          onClose={() => setShowEmojiPicker(false)}
                          selectedEmoji={newEngine.icon}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={addEngine}
                className="w-full py-2.5 rounded-xl bg-emerald-500 text-[#0d0e10] font-medium hover:bg-emerald-400 transition-colors text-sm"
              >
                添加引擎
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 链接卡片组件
const LinkCard: React.FC<{
  id: string;
  title: string;
  url: string;
  icon?: string;
  description?: string;
  color?: string;
  isHidden?: boolean;
  onEdit?: () => void;
}> = ({ id, title, url, icon, description, color = 'bg-indigo-500/20 text-indigo-400', isHidden, onEdit }) => {
  // 安全地获取域名，处理无效 URL
  const domain = useMemo(() => {
    try {
      return new URL(url).hostname;
    } catch {
      // 如果 URL 无效，尝试添加 https 协议再解析
      try {
        return new URL(`https://${url}`).hostname;
      } catch {
        // 如果仍然无效，返回原始字符串或空字符串
        return url.split('/')[0] || 'unknown';
      }
    }
  }, [url]);
  // 使用更可靠的 favicon 服务，添加错误处理
  const faviconUrl = icon || `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

  const handleCardClick = (e: React.MouseEvent) => {
    // 如果点击的是编辑按钮，不处理
    if ((e.target as HTMLElement).closest('button')) return;
    
    let finalUrl = url;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }
    window.open(finalUrl, '_blank');
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit?.();
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleCardClick}
      className="group relative rounded-2xl transition-all duration-300 ease-out bg-[#181a1c] border overflow-hidden cursor-pointer shadow-sm hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 active:scale-98 border-white/5 hover:border-emerald-500/30 p-4 sm:p-5"
    >
      <div className="flex flex-col min-w-0 gap-3">
        <div className={`flex items-center justify-center shrink-0 rounded-xl overflow-hidden border border-white/5 transition-transform duration-300 group-hover:scale-105 ${color} w-12 h-12`}>
          {icon ? (
            <span className="text-xl">{icon}</span>
          ) : (
            <img 
              src={faviconUrl} 
              alt="" 
              className="w-6 h-6 rounded object-contain"
              onError={(e) => {
                // 如果 favicon 加载失败，显示默认图标
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-xl">🔗</span>';
              }}
            />
          )}
        </div>
        <h3 className="font-medium truncate transition-colors text-base text-white group-hover:text-emerald-400" title={title}>
          {title}
        </h3>
        {description && (
          <p className="leading-relaxed line-clamp-2 mt-1.5 text-sm text-slate-400">
            {description}
          </p>
        )}
      </div>
      
      <div className="absolute transition-all duration-200 opacity-0 group-hover:opacity-100 z-20 flex items-center gap-1 top-3 right-3">
        <button
          className="p-1.5 rounded-lg bg-[#0d0e10] text-slate-400 hover:text-emerald-400 border border-white/5 transition-colors"
          title="编辑链接"
          onClick={handleEdit}
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>

      {isHidden && (
        <div className="absolute bottom-2 right-2 px-1.5 py-1 rounded-md text-[10px] font-medium flex items-center gap-1 bg-[#0d0e10] text-slate-400 border border-white/5">
          <EyeOff className="w-2.5 h-2.5" />
          <span>隐藏</span>
        </div>
      )}
    </a>
  );
};

const V9Dashboard: React.FC<V9DashboardProps> = ({ onAddResource, onOpenSettings, onOpenImport, onEditLink, onDeleteLink, links = [], categories = [] }) => {
  const [activeView, setActiveView] = useState('dashboard');
  
  // 等待数据加载完成
  const [dataLoaded, setDataLoaded] = useState(false);
  useEffect(() => {
    // 检查 links 和 categories 是否已加载（有数据或空数组都表示已加载）
    if (Array.isArray(links) && Array.isArray(categories)) {
      setDataLoaded(true);
    }
  }, [links, categories]);
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchMode, setSearchMode] = useState<'internal' | 'external'>('external');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const { 
    enabledWidgets, 
    isLoaded, 
    editMode, 
    setEditMode,
    toggleWidget,
    updateWidgetPosition,
    reorderWidgets
  } = useWidgetSystem();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleViewChange = (view: string) => {
    setActiveView(view);
    if (view === 'widgets') {
      setEditMode(false);
    }
    setIsMobileMenuOpen(false);
    // 不再刷新页面，改用状态切换
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
    if (!editMode) {
      setActiveView('dashboard');
    }
  };

  // 一言数据
  const [hitokoto, setHitokoto] = useState({
    text: '我们都有底线，而我也许已经越过了自己的底线。',
    source: '英雄联盟 · 青钢影'
  });

  const refreshHitokoto = () => {
    const quotes = [
      { text: '我们都有底线，而我也许已经越过了自己的底线。', source: '英雄联盟 · 青钢影' },
      { text: '人生苦短，我用Python。', source: '程序员格言' },
      { text: 'Stay hungry, stay foolish.', source: 'Steve Jobs' },
      { text: 'Talk is cheap. Show me the code.', source: 'Linus Torvalds' },
    ];
    setHitokoto(quotes[Math.floor(Math.random() * quotes.length)]);
  };

  const [navItems, setNavItems] = useState([
    { id: 'dashboard', label: '控制台', icon: LayoutDashboard },
    { id: 'resources', label: '资源中心', icon: FolderOpen },
    { id: 'rss', label: 'RSS阅读', icon: Rss },
    { id: 'automation', label: '自动化调度', icon: RefreshCw },
    { id: 'smart-home', label: '智能家居', icon: House },
    { id: 'labs', label: '实验室', icon: FlaskConical },
  ]);
  const [isNavEditMode, setIsNavEditMode] = useState(false);
  const [navEditModalOpen, setNavEditModalOpen] = useState(false);
  const [editingNavItem, setEditingNavItem] = useState<{id: string, label: string, originalId: string} | null>(null);

  // 设置下拉菜单状态
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);

  // 通知中心
  const {
    unreadCount,
    notifications,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);

  if (!isLoaded || !dataLoaded) {
    return (
      <div className="min-h-screen bg-[#0d0e10] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0d0e10] text-white">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0d0e10]/80 backdrop-blur-xl">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="h-16 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Zap className="w-5 h-5 text-[#0d0e10]" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white">Y-Nav Elite</span>
                <span className="text-[10px] text-slate-500">V9.0 CONSOLE</span>
              </div>
            </div>

            {/* 导航菜单 - 桌面端 */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = activeView === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleViewChange(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-emerald-500/15 text-emerald-400' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                    <span className="font-medium text-sm">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* 右侧操作区 */}
            <div className="flex items-center gap-2">
              {/* 主题切换 */}
              <button className="p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-white/5 transition-all">
                <Monitor className="w-5 h-5" />
              </button>

              {/* 设置下拉菜单 */}
              <div className="relative">
                <button 
                  onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                  className="flex items-center gap-1 p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-white/5 transition-all"
                >
                  <Settings className="w-5 h-5" />
                  <ChevronDown className={`w-3 h-3 transition-transform ${showSettingsDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showSettingsDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-48 rounded-xl bg-[#181a1c] border border-white/10 shadow-xl z-50 py-1">
                    <button
                      onClick={() => {
                        onOpenSettings?.();
                        setShowSettingsDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      网站设置
                    </button>
                    <button
                      onClick={() => {
                        setNavEditModalOpen(true);
                        setShowSettingsDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-2"
                    >
                      <Menu className="w-4 h-4" />
                      菜单配置
                    </button>
                    <button
                      onClick={() => {
                        setActiveView('widgets');
                        setShowSettingsDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-2"
                    >
                      <Grid3X3 className="w-4 h-4" />
                      组件配置
                    </button>
                  </div>
                )}
              </div>

              {/* 通知 */}
              <div className="relative">
                <button 
                  onClick={() => {
                    setShowNotificationPanel(!showNotificationPanel);
                    if (!showNotificationPanel) {
                      fetchNotifications({ limit: 10 });
                    }
                  }}
                  className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'animate-pulse' : ''}`} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                
                {/* 通知下拉面板 */}
                {showNotificationPanel && (
                  <NotificationDropdown
                    notifications={notifications}
                    unreadCount={unreadCount}
                    onClose={() => setShowNotificationPanel(false)}
                    onMarkAsRead={markAsRead}
                    onMarkAllAsRead={markAllAsRead}
                    onDelete={deleteNotification}
                    onViewAll={() => {
                      setShowNotificationPanel(false);
                      setActiveView('notifications');
                    }}
                  />
                )}
              </div>

              {/* 用户头像 */}
              <button 
                onClick={() => alert('用户功能即将上线')}
                className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center hover:ring-2 hover:ring-white/20 transition-all"
              >
                <span className="text-sm font-bold text-white">李</span>
              </button>

              {/* 移动端菜单按钮 */}
              <button 
                className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 移动端导航菜单 */}
          {isMobileMenuOpen && (
            <nav className="lg:hidden py-4 border-t border-white/5">
              {navItems.map((item) => {
                const isActive = activeView === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleViewChange(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-emerald-500/15 text-emerald-400' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          )}
        </div>
      </header>

      {/* 主内容区 */}
      <main className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6">
        {activeView === 'dashboard' ? (
          <div className="space-y-8">
            {/* 欢迎区域 + 搜索 */}
            <section className="text-center py-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                上午好，<span className="text-emerald-400">home</span>
              </h1>
              <p className="text-slate-400 mb-6">准备开始高效的一天了吗？</p>
              
              {/* 时间显示 */}
              <div className="mb-8">
                <div className="text-5xl sm:text-6xl font-mono font-bold text-white tracking-tight">
                  {currentTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-sm font-medium text-emerald-400 mt-2">
                  {currentTime.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
                </div>
              </div>

              {/* 搜索框 */}
              <SearchWidget />
            </section>

            {/* 我的小组件 */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-emerald-400" />
                  我的小组件
                </h2>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => { setActiveView('widgets'); setEditMode(false); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-emerald-500 text-[#0d0e10] rounded-lg hover:bg-emerald-400 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    添加
                  </button>
                  <div className="hidden sm:flex items-center p-1 rounded-xl bg-white/5 border border-white/10">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-emerald-500 text-[#0d0e10]' : 'text-slate-400 hover:text-white'}`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-emerald-500 text-[#0d0e10]' : 'text-slate-400 hover:text-white'}`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Widget Grid - 支持拖拽排序 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {enabledWidgets
                  .filter(w => w.enabled)
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((widget, index) => {
                    const desktopPosition = widget.position?.desktop || { x: 0, y: 0, w: 4, h: 3 };
                    const colSpan = desktopPosition.w <= 2 ? 1 : desktopPosition.w <= 4 ? 2 : desktopPosition.w <= 6 ? 3 : 4;
                    
                    return (
                      <div 
                        key={widget.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('widgetId', widget.id);
                          e.dataTransfer.effectAllowed = 'move';
                          // 添加拖拽中的样式
                          e.currentTarget.classList.add('opacity-50', 'scale-95');
                        }}
                        onDragEnd={(e) => {
                          // 移除拖拽样式
                          e.currentTarget.classList.remove('opacity-50', 'scale-95');
                          // 清除所有放置区域的高亮
                          document.querySelectorAll('.widget-drop-target').forEach(el => {
                            el.classList.remove('ring-2', 'ring-emerald-500', 'ring-offset-2', 'ring-offset-[#0d0e10]');
                          });
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          // 高亮当前放置区域
                          e.currentTarget.classList.add('ring-2', 'ring-emerald-500', 'ring-offset-2', 'ring-offset-[#0d0e10]');
                        }}
                        onDragLeave={(e) => {
                          // 移除高亮
                          e.currentTarget.classList.remove('ring-2', 'ring-emerald-500', 'ring-offset-2', 'ring-offset-[#0d0e10]');
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          // 移除高亮
                          e.currentTarget.classList.remove('ring-2', 'ring-emerald-500', 'ring-offset-2', 'ring-offset-[#0d0e10]');
                          const draggedId = e.dataTransfer.getData('widgetId');
                          if (draggedId && draggedId !== widget.id) {
                            const currentWidgets = enabledWidgets.filter(w => w.enabled).sort((a, b) => (a.order || 0) - (b.order || 0));
                            const draggedIndex = currentWidgets.findIndex(w => w.id === draggedId);
                            const targetIndex = currentWidgets.findIndex(w => w.id === widget.id);
                            
                            if (draggedIndex !== -1 && targetIndex !== -1) {
                              const newOrder = [...currentWidgets];
                              const [removed] = newOrder.splice(draggedIndex, 1);
                              newOrder.splice(targetIndex, 0, removed);
                              reorderWidgets(newOrder.map(w => w.id));
                            }
                          }
                        }}
                        className={`widget-drop-target bg-[#181a1c] rounded-xl border border-white/5 hover:border-emerald-500/30 transition-all duration-200 overflow-hidden group cursor-move ${
                          colSpan === 1 ? '' : colSpan === 2 ? 'md:col-span-2' : colSpan === 3 ? 'md:col-span-3' : 'md:col-span-4'
                        }`}
                      >
                        {/* 组件头部 - 添加拖拽手柄 */}
                        <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-[#181a1c]">
                          <div className="flex items-center gap-2">
                            {/* 拖拽手柄 */}
                            <div className="flex items-center gap-0.5 text-slate-600 cursor-grab active:cursor-grabbing hover:text-slate-400 transition-colors">
                              <GripVertical className="w-3 h-3" />
                            </div>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
                            <span className="text-xs font-medium text-slate-400 group-hover:text-slate-300 transition-colors">
                              {widget.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-slate-300">
                              <MoreVertical className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        
                        {/* 组件内容区 */}
                        <div className="p-3">
                          {widget.type === 'api-data' && widget.settings?.api && (
                            <APIDataWidget config={widget.settings.api} />
                          )}
                          {widget.type === 'weather' && <WeatherWidget />}
                          {widget.type === 'custom-links' && <TodoWidget />}
                          {widget.type === 'embedded-news' && <EmbeddedNewsWidget />}
                          {widget.type === 'custom-url' && widget.settings?.url && (
                            <iframe 
                              src={widget.settings.url} 
                              className="w-full h-[300px] rounded-lg border-0"
                              sandbox="allow-scripts allow-same-origin"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </section>

            {/* 一言 Footer */}
            <footer className="pt-8 pb-4 flex justify-center">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <button
                  type="button"
                  className="flex min-w-0 max-w-[70vw] items-center gap-1.5 text-left hover:text-slate-300 transition-colors"
                  onClick={() => navigator.clipboard.writeText(hitokoto.text)}
                >
                  <span className="truncate">{hitokoto.text}</span>
                  <span className="shrink-0 text-slate-500">— {hitokoto.source}</span>
                </button>
                <button
                  type="button"
                  onClick={refreshHitokoto}
                  className="h-6 w-6 inline-flex items-center justify-center rounded-full text-slate-400 hover:text-slate-300 transition-colors"
                  title="刷新一言"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
            </footer>
          </div>
        ) : activeView === 'resources' ? (
          <ResourceCenterViewCN 
            onAddResource={onAddResource}
            onImport={() => console.log('Import')}
            onEditLink={onEditLink}
            onDeleteLink={onDeleteLink}
            onPreviewLink={(url) => {
              setPreviewUrl(url);
              setIsPreviewOpen(true);
            }}
            onOpenSettings={onOpenSettings}
            onOpenMenuSettings={() => setNavEditModalOpen(true)}
            onOpenWidgetSettings={() => setActiveView('widgets')}
            links={links}
            categories={categories}
          />
        ) : activeView === 'rss' ? (
          <RSSReaderViewCN />
        ) : activeView === 'automation' ? (
          <AutomationCenterView onBack={() => setActiveView('dashboard')} />
        ) : activeView === 'smart-home' ? (
          <SmartHomeView onBack={() => setActiveView('dashboard')} />
        ) : activeView === 'notifications' ? (
          <NotificationsViewCN onBack={() => setActiveView('dashboard')} />
        ) : activeView === 'labs' ? (
          <LabView />
        ) : (
          <WidgetConfigCenter />
        )}
      </main>
      
      <ContentPreview
        url={previewUrl || ''}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
      
      <NavEditModal
        isOpen={navEditModalOpen}
        onClose={() => setNavEditModalOpen(false)}
        navItems={navItems}
        onSave={(updatedItems) => setNavItems(updatedItems)}
      />
    </div>
  );
};

export default V9Dashboard;
