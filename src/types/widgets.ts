// ============ 小组件系统类型定义 ============

export type WidgetType = 
  | 'weather' 
  | 'todo' 
  | 'hotsearch' 
  | 'rss' 
  | 'countdown' 
  | 'exchange' 
  | 'lifeprogress' 
  | 'zen'
  | 'api'
  | 'iframe';

export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  enabled: boolean;
  position: WidgetPosition;
  settings: Record<string, any>;
}

// 天气小组件配置
export interface WeatherWidgetSettings {
  city: string;
  showHumidity: boolean;
  showWind: boolean;
  unit: 'celsius' | 'fahrenheit';
}

// 待办事项小组件配置
export interface TodoWidgetSettings {
  showCompleted: boolean;
  maxItems: number;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

// 热搜榜单小组件配置
export interface HotSearchWidgetSettings {
  sources: ('weibo' | 'zhihu' | 'baidu' | 'bilibili')[];
  maxItems: number;
}

export interface HotSearchItem {
  rank: number;
  title: string;
  url: string;
  hot?: number;
}

// RSS订阅小组件配置
export interface RSSWidgetSettings {
  feeds: string[];
  maxItems: number;
  updateInterval: number; // 分钟
}

export interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

// 倒计时小组件配置
export interface CountdownWidgetSettings {
  events: CountdownEvent[];
}

export interface CountdownEvent {
  id: string;
  name: string;
  targetDate: string;
  color?: string;
}

// 汇率换算小组件配置
export interface ExchangeWidgetSettings {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
}

// 人生进度小组件配置
export interface LifeProgressWidgetSettings {
  birthDate: string;
  lifeExpectancy: number;
}

// 电子木鱼小组件配置
export interface ZenWidgetSettings {
  soundEnabled: boolean;
  animationEnabled: boolean;
}

// API数据小组件配置
export interface ApiWidgetSettings {
  apiUrl: string;
  refreshInterval?: number;
  headers?: Record<string, string>;
  method?: 'GET' | 'POST';
  body?: string;
}

// Iframe内嵌组件配置
export interface IframeWidgetSettings {
  url: string;
  width?: string;
  height?: string;
  allowScroll?: boolean;
  showBorder?: boolean;
  showHeader?: boolean;
}

// 默认小组件配置
export const DEFAULT_WIDGETS: WidgetConfig[] = [
  {
    id: 'widget-weather',
    type: 'weather',
    title: '天气',
    enabled: true,
    position: { x: 0, y: 0, w: 2, h: 2 },
    settings: { city: '北京', showHumidity: true, showWind: true, unit: 'celsius' }
  },
  {
    id: 'widget-todo',
    type: 'todo',
    title: '待办事项',
    enabled: true,
    position: { x: 2, y: 0, w: 2, h: 2 },
    settings: { showCompleted: false, maxItems: 5 }
  },
  {
    id: 'widget-hotsearch',
    type: 'hotsearch',
    title: '热搜榜单',
    enabled: true,
    position: { x: 4, y: 0, w: 2, h: 2 },
    settings: { sources: ['weibo', 'zhihu'], maxItems: 10 }
  }
];

// 小组件显示配置
export const WIDGET_DISPLAY_CONFIG: Record<WidgetType, { 
  name: string; 
  icon: string; 
  description: string;
  minW: number;
  minH: number;
  defaultW: number;
  defaultH: number;
}> = {
  weather: {
    name: '天气',
    icon: 'Sun',
    description: '实时展示当前城市的天气、温度、湿度等信息',
    minW: 2,
    minH: 2,
    defaultW: 2,
    defaultH: 2
  },
  todo: {
    name: '待办事项',
    icon: 'CheckSquare',
    description: '轻量任务管理，展示今日待办任务',
    minW: 2,
    minH: 2,
    defaultW: 2,
    defaultH: 2
  },
  hotsearch: {
    name: '热搜榜单',
    icon: 'TrendingUp',
    description: '聚合微博、知乎等平台的热门热搜',
    minW: 2,
    minH: 2,
    defaultW: 2,
    defaultH: 2
  },
  rss: {
    name: 'RSS订阅',
    icon: 'Rss',
    description: '支持自定义订阅源，实时获取博客、资讯',
    minW: 2,
    minH: 3,
    defaultW: 2,
    defaultH: 3
  },
  countdown: {
    name: '倒计时',
    icon: 'Timer',
    description: '支持自定义倒计时事件',
    minW: 2,
    minH: 2,
    defaultW: 2,
    defaultH: 2
  },
  exchange: {
    name: '汇率换算',
    icon: 'Currency',
    description: '实时汇率换算工具',
    minW: 2,
    minH: 2,
    defaultW: 2,
    defaultH: 2
  },
  lifeprogress: {
    name: '人生进度',
    icon: 'CalendarClock',
    description: '可视化展示人生进度',
    minW: 2,
    minH: 2,
    defaultW: 2,
    defaultH: 2
  },
  zen: {
    name: '电子木鱼',
    icon: 'CircleDot',
    description: '敲击积攒功德，放松心情',
    minW: 1,
    minH: 1,
    defaultW: 1,
    defaultH: 1
  },
  api: {
    name: 'API数据',
    icon: 'ExternalLink',
    description: '根据API返回内容自动渲染显示',
    minW: 2,
    minH: 2,
    defaultW: 3,
    defaultH: 3
  },
  iframe: {
    name: '内嵌组件',
    icon: 'Link',
    description: '输入任意URL，直接内嵌显示',
    minW: 2,
    minH: 2,
    defaultW: 3,
    defaultH: 3
  }
};

export const WIDGET_STORAGE_KEY = 'widgets';
export const TODO_STORAGE_KEY = 'todo';
export const RSS_CACHE_KEY = 'rss_cache';
export const HOTSEARCH_CACHE_KEY = 'hotsearch_cache';
export const WEATHER_CACHE_KEY = 'weather_cache';
