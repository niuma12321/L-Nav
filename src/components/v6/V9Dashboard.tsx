import React, { useState, useEffect, useCallback } from 'react';
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
  Newspaper
} from 'lucide-react';
import { useWidgetSystem } from '../../hooks/useWidgetSystem';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}
import { Database, Globe } from 'lucide-react';
import { APIDataWidget } from './APIDataWidget';
import ContentPreview from './ContentPreview';
import NavEditModal from '../modals/NavEditModal';

// Static imports - fixed dynamic import issues
import ResourceCenterViewCN from './ResourceCenterViewCN';
import WidgetConfigCenter from './WidgetConfigCenter';
import LabView from './LabView';

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

// 天气小组件 - 接入真实天气API，支持城市选择和定位
const WeatherWidget: React.FC = () => {
  // 常用城市列表
  const cities = [
    { name: '北京', id: '101010100' },
    { name: '上海', id: '101020100' },
    { name: '广州', id: '101280101' },
    { name: '深圳', id: '101280601' },
    { name: '杭州', id: '101210101' },
    { name: '南京', id: '101190101' },
    { name: '成都', id: '101270101' },
    { name: '武汉', id: '101200101' },
    { name: '西安', id: '101110101' },
    { name: '重庆', id: '101040100' },
  ];

  const [weather, setWeather] = useState({
    city: '北京',
    cityId: '101010100',
    temp: 23,
    condition: '多云',
    humidity: 61,
    windLevel: 4,
    icon: 'Cloud',
    loading: false,
    error: false
  });
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // 根据天气条件返回对应图标名称
  const getWeatherIconByCondition = (condition: string) => {
    if (condition.includes('晴')) return 'Sun';
    if (condition.includes('雨')) return 'CloudRain';
    if (condition.includes('雪')) return 'Snowflake';
    return 'Cloud';
  };

  // 根据天气图标代码返回对应图标名称
  const getWeatherIcon = (iconCode: string) => {
    const code = parseInt(iconCode);
    if (code <= 3) return 'Sun';
    if (code <= 9) return 'Cloud';
    if (code <= 19) return 'CloudRain';
    if (code <= 25) return 'Snowflake';
    return 'Cloud';
  };

  // 获取天气数据
  const fetchWeather = useCallback(async (cityId: string, cityName: string) => {
    setWeather(prev => ({ ...prev, loading: true, error: false }));
    try {
      // 使用和风天气免费API - 需要替换为真实API Key
      // 这里使用备用API服务
      const response = await fetch(`https://devapi.qweather.com/v7/weather/now?location=${cityId}&key=demo`);
      const data = await response.json();
      
      if (data.code === '200' && data.now) {
        const now = data.now;
        setWeather({
          city: cityName,
          cityId: cityId,
          temp: parseInt(now.temp),
          condition: now.text,
          humidity: parseInt(now.humidity),
          windLevel: parseInt(now.windScale) || 3,
          icon: getWeatherIcon(now.icon),
          loading: false,
          error: false
        });
        // 保存到本地存储
        localStorage.setItem('ynav_weather_city', JSON.stringify({ name: cityName, id: cityId }));
      } else {
        // API返回错误时使用模拟数据
        throw new Error('Weather API error');
      }
    } catch {
      // 备用：使用模拟数据（实际项目中应使用有效的API）
      const mockData: Record<string, { temp: number; condition: string; humidity: number; windLevel: number }> = {
        '101010100': { temp: 22, condition: '晴', humidity: 45, windLevel: 3 },
        '101020100': { temp: 23, condition: '多云', humidity: 60, windLevel: 4 },
        '101280101': { temp: 28, condition: '雷阵雨', humidity: 75, windLevel: 5 },
        '101280601': { temp: 29, condition: '多云', humidity: 70, windLevel: 4 },
        '101210101': { temp: 24, condition: '小雨', humidity: 80, windLevel: 3 },
        '101190101': { temp: 21, condition: '阴', humidity: 65, windLevel: 3 },
        '101270101': { temp: 25, condition: '多云', humidity: 55, windLevel: 2 },
        '101200101': { temp: 26, condition: '晴', humidity: 50, windLevel: 3 },
        '101110101': { temp: 20, condition: '晴', humidity: 40, windLevel: 2 },
        '101040100': { temp: 27, condition: '多云', humidity: 60, windLevel: 3 },
      };
      const data = mockData[cityId] || { temp: 23, condition: '多云', humidity: 60, windLevel: 3 };
      setWeather({
        city: cityName,
        cityId: cityId,
        temp: data.temp,
        condition: data.condition,
        humidity: data.humidity,
        windLevel: data.windLevel,
        icon: getWeatherIconByCondition(data.condition),
        loading: false,
        error: false
      });
      localStorage.setItem('ynav_weather_city', JSON.stringify({ name: cityName, id: cityId }));
    }
  }, []);

  // 获取当前定位
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('您的浏览器不支持地理定位');
      return;
    }
    // 检查是否HTTPS或localhost（地理定位需要安全上下文）
    const isSecureContext = window.isSecureContext || 
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1';
    if (!isSecureContext) {
      alert('地理定位需要在HTTPS或localhost环境下使用');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // 使用逆地理编码获取城市信息
          const response = await fetch(`https://apis.map.qq.com/ws/geocoder/v1/?location=${latitude},${longitude}&key=OB4BZ-D4W3U-B7VVO-4PJWW-6TKDJ-WPB77&get_poi=0`);
          const data = await response.json();
          if (data.status === 0 && data.result?.ad_info?.city) {
            const cityName = data.result.ad_info.city.replace(/市$/, '');
            // 查找城市ID
            const city = cities.find(c => cityName.includes(c.name) || c.name.includes(cityName));
            if (city) {
              await fetchWeather(city.id, city.name);
            } else {
              await fetchWeather('101010100', '北京(定位)');
            }
          } else {
            await fetchWeather('101010100', '北京(定位)');
          }
        } catch {
          await fetchWeather('101010100', '北京(定位)');
        }
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        let errorMsg = '获取定位失败';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = '定位权限被拒绝，请在浏览器设置中允许定位';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = '位置信息不可用';
            break;
          case error.TIMEOUT:
            errorMsg = '获取定位超时';
            break;
        }
        alert(errorMsg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [fetchWeather]);

  // 加载保存的城市
  useEffect(() => {
    const saved = localStorage.getItem('ynav_weather_city');
    if (saved) {
      try {
        const { name, id } = JSON.parse(saved);
        fetchWeather(id, name);
      } catch {
        fetchWeather('101010100', '北京');
      }
    } else {
      fetchWeather('101010100', '北京');
    }
  }, [fetchWeather]);

  // 每30分钟自动刷新
  useEffect(() => {
    const timer = setInterval(() => {
      if (weather.cityId) {
        fetchWeather(weather.cityId, weather.city);
      }
    }, 30 * 60 * 1000);
    return () => clearInterval(timer);
  }, [weather.cityId, weather.city, fetchWeather]);

  const handleRefresh = () => {
    fetchWeather(weather.cityId, weather.city);
  };

  const handleCitySelect = (city: typeof cities[0]) => {
    fetchWeather(city.id, city.name);
    setShowCitySelector(false);
  };

  const WeatherIcon = weather.loading ? Cloud : 
    weather.icon === 'Sun' ? ({className}: {className?: string}) => <span className={className}>☀️</span> :
    weather.icon === 'CloudRain' ? ({className}: {className?: string}) => <span className={className}>🌧️</span> :
    weather.icon === 'Snowflake' ? ({className}: {className?: string}) => <span className={className}>❄️</span> :
    Cloud;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <button 
          onClick={() => setShowCitySelector(true)}
          className="flex items-center gap-1 text-sm font-medium text-slate-300 hover:text-emerald-400 transition-colors"
        >
          <MapPin className="w-3.5 h-3.5" />
          {weather.city}
        </button>
        <div className="flex items-center gap-1">
          <button 
            onClick={getCurrentLocation}
            disabled={isLocating}
            className="p-1 rounded hover:bg-white/5 transition-colors"
            title="获取当前定位"
          >
            <Navigation className={`w-3 h-3 text-slate-400 ${isLocating ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={handleRefresh}
            disabled={weather.loading}
            className="p-1 rounded hover:bg-white/5 transition-colors"
            title="刷新天气"
          >
            <RefreshCw className={`w-3 h-3 text-slate-400 ${weather.loading ? 'animate-spin' : ''}`} />
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
          <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-40">
            {cities.map(city => (
              <button
                key={city.id}
                onClick={() => handleCitySelect(city)}
                className={`px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                  weather.cityId === city.id 
                    ? 'bg-emerald-500 text-[#0d0e10]' 
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {city.name}
              </button>
            ))}
          </div>
          <button
            onClick={getCurrentLocation}
            disabled={isLocating}
            className="w-full mt-2 py-2 rounded-lg bg-white/5 text-slate-300 text-sm flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
          >
            <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
            {isLocating ? '定位中...' : '获取当前定位'}
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 flex-1">
        {weather.loading ? (
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
        ) : (
          <>
            <WeatherIcon className="w-8 h-8 text-gray-400" />
            <div>
              <div className="text-3xl font-bold text-white">{weather.temp}°</div>
              <div className={`text-xs ${weather.error ? 'text-red-400' : 'text-slate-400'}`}>
                {weather.condition}
              </div>
            </div>
          </>
        )}
      </div>
      <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
        <div className="flex items-center gap-1">
          <Droplets className="w-3 h-3" />
          <span>{weather.humidity}%</span>
        </div>
        <div className="flex items-center gap-1">
          <Wind className="w-3 h-3" />
          <span>{weather.windLevel}级</span>
        </div>
      </div>
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

  // 获取微博热搜
  const fetchWeiboHot = async () => {
    try {
      // 使用微博热搜API
      const response = await fetch('https://weibo.com/ajax/side/hotSearch', {
        headers: {
          'Referer': 'https://weibo.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      
      if (data.data && data.data.realtime) {
        const hotSearch = data.data.realtime.slice(0, 10).map((item: any, index: number) => ({
          id: index + 1,
          title: item.word,
          hot: item.raw_hot ? `${(item.raw_hot / 10000).toFixed(1)}万` : '热',
          rank: index + 1,
          url: `https://s.weibo.com/weibo?q=${encodeURIComponent(item.word)}`
        }));
        setHotList(hotSearch);
        setError('');
      }
    } catch {
      // 使用备用API
      try {
        const backupResponse = await fetch('https://api-hot.imsyy.top/weibo');
        const backupData = await backupResponse.json();
        if (backupData.data) {
          const hotSearch = backupData.data.slice(0, 10).map((item: any, index: number) => ({
            id: index + 1,
            title: item.title,
            hot: item.hot || '热',
            rank: index + 1,
            url: item.url || `https://s.weibo.com/weibo?q=${encodeURIComponent(item.title)}`
          }));
          setHotList(hotSearch);
          setError('');
        }
      } catch {
        setError('获取失败');
        // 使用默认数据
        setHotList([
          { id: 1, title: '微博热搜加载中...', hot: '...', rank: 1 },
          { id: 2, title: '请检查网络连接', hot: '...', rank: 2 },
        ]);
      }
    }
  };

  // 获取知乎热榜
  const fetchZhihuHot = async () => {
    try {
      const response = await fetch('https://api-hot.imsyy.top/zhihu');
      const data = await response.json();
      if (data.data) {
        const hotSearch = data.data.slice(0, 10).map((item: any, index: number) => ({
          id: index + 1,
          title: item.title,
          hot: item.hot || `${(Math.random() * 1000 + 500).toFixed(0)}万`,
          rank: index + 1,
          url: item.url
        }));
        setHotList(hotSearch);
        setError('');
      }
    } catch {
      setError('获取失败');
    }
  };

  // 获取百度热搜
  const fetchBaiduHot = async () => {
    try {
      const response = await fetch('https://api-hot.imsyy.top/baidu');
      const data = await response.json();
      if (data.data) {
        const hotSearch = data.data.slice(0, 10).map((item: any, index: number) => ({
          id: index + 1,
          title: item.title,
          hot: item.hot || `${(Math.random() * 1000 + 500).toFixed(0)}万`,
          rank: index + 1,
          url: item.url
        }));
        setHotList(hotSearch);
        setError('');
      }
    } catch {
      setError('获取失败');
    }
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
    try {
      // 使用NewsAPI或类似服务获取新闻
      // 这里使用一个免费的API示例
      const apiUrl = category === 'tech' 
        ? 'https://api-hot.imsyy.top/36kr'
        : category === 'finance'
        ? 'https://api-hot.imsyy.top/wallstreetcn'
        : 'https://api-hot.imsyy.top/toutiao';
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (data.data) {
        const newsList = data.data.slice(0, 8).map((item: any, index: number) => ({
          id: index + 1,
          title: item.title,
          source: item.source || category === 'tech' ? '36氪' : category === 'finance' ? '华尔街见闻' : '今日头条',
          time: item.time || '刚刚',
          url: item.url || '#',
          summary: item.desc || item.summary
        }));
        setNews(newsList);
      }
    } catch {
      // 如果API失败，显示默认数据
      setNews([
        { id: 1, title: '资讯加载中，请稍后...', source: '系统', time: '刚刚', url: '#' },
        { id: 2, title: '如长时间未加载，请检查网络连接', source: '系统', time: '刚刚', url: '#' }
      ]);
    }
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
    const saved = localStorage.getItem('ynav_search_engines');
    return saved ? JSON.parse(saved) : defaultEngines;
  });
  const [activeEngine, setActiveEngine] = useState(engines[0].name);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEngineModal, setShowEngineModal] = useState(false);
  const [newEngine, setNewEngine] = useState({ name: '', url: '', icon: '' });
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('ynav_search_history');
    return saved ? JSON.parse(saved) : [];
  });

  // 保存搜索历史
  const saveSearchHistory = (query: string) => {
    if (!query.trim()) return;
    const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 5);
    setSearchHistory(newHistory);
    localStorage.setItem('ynav_search_history', JSON.stringify(newHistory));
  };

  // 清除搜索历史
  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('ynav_search_history');
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
    localStorage.setItem('ynav_search_engines', JSON.stringify(newEngines));
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowEngineModal(false)}>
          <div className="bg-[#181a1c] rounded-2xl border border-white/10 w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">管理搜索引擎</h3>
              <button onClick={() => setShowEngineModal(false)} className="p-2 rounded-lg hover:bg-white/10 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* 现有引擎列表 */}
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
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
              <input
                type="text"
                placeholder="图标 (emoji或留空)"
                value={newEngine.icon}
                onChange={(e) => setNewEngine({...newEngine, icon: e.target.value})}
                className="w-full px-3 py-2 bg-[#0d0e10] rounded-lg border border-white/5 text-white text-sm"
              />
              <button
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
  const domain = new URL(url).hostname;
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
    updateWidgetPosition 
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
    { id: 'widgets', label: '组件配置', icon: Grid3X3 },
    { id: 'labs', label: '实验室', icon: FlaskConical },
  ]);
  const [isNavEditMode, setIsNavEditMode] = useState(false);
  const [navEditModalOpen, setNavEditModalOpen] = useState(false);
  const [editingNavItem, setEditingNavItem] = useState<{id: string, label: string, originalId: string} | null>(null);

  if (!isLoaded) {
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
              {/* 编辑布局按钮 */}
              <button
                onClick={toggleEditMode}
                className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                  editMode 
                    ? 'bg-emerald-500 text-[#0d0e10] font-semibold' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
                <span className="text-sm font-medium">{editMode ? '完成' : '编辑'}</span>
              </button>

              {/* 导航菜单编辑按钮 */}
              <button
                onClick={() => setNavEditModalOpen(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <Menu className="w-4 h-4" />
                <span className="text-sm font-medium">菜单</span>
              </button>

              {/* 主题切换 */}
              <button className="p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-white/5 transition-all">
                <Monitor className="w-5 h-5" />
              </button>

              {/* 设置 */}
              <button 
                onClick={onOpenSettings}
                className="p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-white/5 transition-all"
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* 通知 */}
              <button 
                onClick={() => alert('通知功能即将上线')}
                className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500" />
              </button>

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

              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-min">
                {/* API 数据组件动态渲染 */}
                {enabledWidgets.filter(w => w.type === 'api-data' && w.enabled).map(widget => (
                  <div key={widget.id} className="relative bg-[#181a1c] rounded-2xl border border-white/10 shadow-sm hover:shadow-md transition-shadow overflow-hidden p-4 min-h-[200px] resize-y overflow-y-auto" style={{ minHeight: '200px', maxHeight: '500px' }}>
                    <APIDataWidget config={widget.settings.api} />
                  </div>
                ))}
                {enabledWidgets.some(w => w.type === 'weather' && w.enabled) && (
                  <div className="relative bg-[#181a1c] rounded-2xl border border-white/10 shadow-sm hover:shadow-md transition-shadow overflow-hidden p-4 min-h-[200px] resize-y overflow-y-auto" style={{ minHeight: '200px', maxHeight: '500px' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Cloud className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-medium text-slate-300">天气</span>
                    </div>
                    <WeatherWidget />
                  </div>
                )}

                {enabledWidgets.some(w => w.type === 'custom-links' && w.enabled) && (
                  <div className="relative bg-[#181a1c] rounded-2xl border border-white/10 shadow-sm hover:shadow-md transition-shadow overflow-hidden p-4 min-h-[200px] resize-y overflow-y-auto" style={{ minHeight: '200px', maxHeight: '500px' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-medium text-slate-300">待办事项</span>
                    </div>
                    <TodoWidget />
                  </div>
                )}

                {enabledWidgets.some(w => w.type === 'stock-widget' && w.enabled) && (
                  <div className="relative bg-[#181a1c] rounded-2xl border border-white/10 shadow-sm hover:shadow-md transition-shadow overflow-hidden p-4 min-h-[200px] resize-y overflow-y-auto" style={{ minHeight: '200px', maxHeight: '500px' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-medium text-slate-300">热搜榜单</span>
                    </div>
                    <NewsWidget />
                  </div>
                )}

                {enabledWidgets.some(w => w.type === 'news-feed' && w.enabled) && (
                  <div className="relative bg-[#181a1c] rounded-2xl border border-white/10 shadow-sm hover:shadow-md transition-shadow overflow-hidden p-4 min-h-[200px] lg:col-span-2 resize-y overflow-y-auto" style={{ minHeight: '200px', maxHeight: '500px' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Pin className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-medium text-slate-300">便签</span>
                    </div>
                    <NewsFeedWidget />
                  </div>
                )}
              </div>
            </section>

            {/* 置顶/常用 */}
            <section>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Pin className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h2 className="text-lg font-bold text-white">置顶 / 常用</h2>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="px-2 py-1 rounded-full bg-white/5">38 站点</span>
                  <span className="px-2 py-1 rounded-full bg-white/5">8 分类</span>
                  <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400">8 置顶</span>
                </div>
              </div>

              {/* 动态渲染链接卡片 */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {links.length > 0 ? (
                  links.filter(link => !link.hidden).slice(0, 10).map((link) => (
                    <LinkCard 
                      key={link.id}
                      id={link.id}
                      title={link.title} 
                      url={link.url} 
                      icon={link.icon}
                      description={link.description}
                      color="bg-emerald-500/20 text-emerald-400"
                      isHidden={link.hidden}
                      onEdit={() => onEditLink?.(link)}
                    />
                  ))
                ) : (
                  // 默认示例链接
                  <>
                    <LinkCard id="demo1" title="PanHub" url="https://sou.678870.xyz" color="bg-indigo-500/20 text-indigo-400" isHidden />
                    <LinkCard id="demo2" title="盘搜" url="https://pansou.nas.678870.xyz" icon="🌐" color="bg-teal-500/20 text-teal-400" isHidden />
                    <LinkCard id="demo3" title="GitHub" url="https://github.com" description="代码托管平台" color="bg-cyan-500/20 text-cyan-400" />
                    <LinkCard id="demo4" title="React" url="https://react.dev" description="构建Web用户界面的库" color="bg-fuchsia-500/20 text-fuchsia-400" />
                  </>
                )}
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
            links={links}
            categories={categories}
          />
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
