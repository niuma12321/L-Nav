// V9.0 Modular Widget System Types

export type WidgetType = 
  | 'search-hub' 
  | 'custom-links' 
  | 'stock-widget' 
  | 'weather'
  | 'todo-list'
  | 'notes'
  | 'news-feed'
  | 'market-overview'
  | 'api-data' // API数据组件
  | 'automation-tasks' // 待执行任务
  | 'automation-logs' // 执行日志
  | 'smart-home-status' // 设备状态
  | 'smart-home-quick'; // 快捷控制

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  description: string;
  icon: string;
  enabled: boolean;
  isFixed?: boolean; // 是否为固定组件（不可修改删除）
  position: {
    desktop: { x: number; y: number; w: number; h: number };
    mobile: { order: number };
  };
  settings: Record<string, any>;
}

export interface SearchEngine {
  id: string;
  name: string;
  url: string;
  queryParam: string;
  icon?: string;
}

export interface CustomLink {
  id: string;
  title: string;
  url: string;
  icon: string | File;
  categoryId: string;
  order: number;
}

export interface LinkCategory {
  id: string;
  name: string;
  icon: string;
  parentId?: string;
  order: number;
  isFolder: boolean;
}

export interface StockConfig {
  symbols: string[];
  refreshInterval: number; // seconds
  showKLine: boolean;
}

export const DEFAULT_WIDGETS: WidgetConfig[] = [
  {
    id: 'search-hub',
    type: 'search-hub',
    title: '搜索配置面板',
    description: '管理多引擎搜索、搜索建议及隐私过滤设置。支持快速切换 Google、Baidu、GitHub 模式。',
    icon: 'Search',
    enabled: true,
    isFixed: true, // 固定组件
    position: {
      desktop: { x: 0, y: 0, w: 4, h: 2 },
      mobile: { order: 0 }
    },
    settings: {
      engines: [
        { id: 'google', name: 'Google', url: 'https://google.com/search', queryParam: 'q' },
        { id: 'baidu', name: '百度', url: 'https://www.baidu.com/s', queryParam: 'wd' },
        { id: 'github', name: 'GitHub', url: 'https://github.com/search', queryParam: 'q' }
      ],
      defaultEngine: 'google',
      transparency: 0.95,
      borderRadius: 12
    }
  },
  {
    id: 'stock-widget',
    type: 'stock-widget',
    title: '金融看板',
    description: '实时追踪 NASDAQ、HKEX 股票行情及加密货币波动。内置 K 线图预览与资产组合摘要。',
    icon: 'TrendingUp',
    enabled: true,
    isFixed: true, // 固定组件
    position: {
      desktop: { x: 4, y: 0, w: 4, h: 2 },
      mobile: { order: 1 }
    },
    settings: {
      symbols: ['sh000001', 'sz399001', 'sh000300'],
      refreshInterval: 30,
      showKLine: true
    }
  },
  {
    id: 'weather',
    type: 'weather',
    title: '天气插件 Pro',
    description: '高精度气象数据、空气质量监测及未来7天预报。支持多城市自动轮播显示。',
    icon: 'Cloud',
    enabled: true,
    isFixed: true, // 固定组件
    position: {
      desktop: { x: 8, y: 0, w: 4, h: 2 },
      mobile: { order: 2 }
    },
    settings: {
      cities: ['北京'],
      currentCity: '北京',
      cityId: '101010100',
      showAirQuality: true,
      showForecast: true
    }
  },
  {
    id: 'custom-links',
    type: 'custom-links',
    title: '待办模块',
    description: '轻量级任务管理，支持 Todoist 与 Microsoft To Do 同步。番茄钟功能可选开启。',
    icon: 'CheckSquare',
    enabled: true,
    isFixed: true, // 固定组件
    position: {
      desktop: { x: 0, y: 2, w: 4, h: 2 },
      mobile: { order: 3 }
    },
    settings: {
      maxItems: 5,
      showCompleted: false
    }
  },
  {
    id: 'news-feed',
    type: 'news-feed',
    title: '资讯流中心',
    description: '聚合 RSS、科技头条及社交媒体热点。支持 AI 智能摘要功能，快速掌握资讯要点。',
    icon: 'Newspaper',
    enabled: true,
    isFixed: true, // 固定组件
    position: {
      desktop: { x: 4, y: 2, w: 8, h: 2 },
      mobile: { order: 4 }
    },
    settings: {
      sources: ['tech', 'finance', 'rss'],
      maxItems: 10
    }
  }
];

// API 数据组件配置接口
export interface APIDataConfig {
  id: string;
  name: string;
  apiUrl: string;
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: string;
  refreshInterval: number; // 秒，0表示不自动刷新
  dataPath: string; // 数据路径，如 'data.items' 或 'results'
  displayType: 'list' | 'table' | 'card' | 'text';
  fields: {
    title: string;
    value?: string;
    subtitle?: string;
    image?: string;
    link?: string;
  };
  maxItems: number;
  emptyText: string;
}

export interface CustomAPIWidgetSettings {
  apis: APIDataConfig[];
}

export const createAPIWidget = (apiConfig: APIDataConfig): WidgetConfig => ({
  id: `api-${apiConfig.id}-${Date.now()}`,
  type: 'api-data',
  title: apiConfig.name,
  description: `从 ${apiConfig.apiUrl} 获取数据`,
  icon: 'Database',
  enabled: true,
  isFixed: false, // 自定义组件
  position: {
    desktop: { x: 0, y: 0, w: 4, h: 3 },
    mobile: { order: 0 }
  },
  settings: {
    api: apiConfig
  }
});

export const DEFAULT_SEARCH_ENGINES: SearchEngine[] = [
  { id: 'google', name: 'Google', url: 'https://google.com/search', queryParam: 'q' },
  { id: 'baidu', name: '百度', url: 'https://www.baidu.com/s', queryParam: 'wd' },
  { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search', queryParam: 'q' },
  { id: 'github', name: 'GitHub', url: 'https://github.com/search', queryParam: 'q' },
  { id: 'stackoverflow', name: 'StackOverflow', url: 'https://stackoverflow.com/search', queryParam: 'q' },
  { id: 'zhihu', name: '知乎', url: 'https://www.zhihu.com/search', queryParam: 'q' },
  { id: 'bilibili', name: 'Bilibili', url: 'https://search.bilibili.com/all', queryParam: 'keyword' }
];

// ==========================================
// 60s API 预设组件配置
// ==========================================

export type API60sCategory = 'periodic' | 'utility' | 'trending' | 'entertainment';

export interface API60sPreset {
  id: string;
  name: string;
  description: string;
  category: API60sCategory;
  categoryLabel: string;
  icon: string;
  config: APIDataConfig;
}

// 60s API 基础URL
const API_60S_BASE = 'https://60s.viki.moe';

// 周期资讯类 API (日更/周更/实时)
export const API_60S_PERIODIC: API60sPreset[] = [
  {
    id: '60s-news',
    name: '60秒读懂世界',
    description: '每天60秒，读懂世界新闻',
    category: 'periodic',
    categoryLabel: '周期资讯',
    icon: 'Clock',
    config: {
      id: '60s-news',
      name: '60秒读懂世界',
      apiUrl: `${API_60S_BASE}/v2/60s`,
      method: 'GET',
      refreshInterval: 3600,
      dataPath: 'data.news',
      displayType: 'list',
      fields: { title: '' }, // 字符串数组，直接用item
      maxItems: 15,
      emptyText: '今日资讯加载中...'
    }
  },
  {
    id: 'bing-wallpaper',
    name: '必应每日壁纸',
    description: '必应每日精美壁纸',
    category: 'periodic',
    categoryLabel: '周期资讯',
    icon: 'Image',
    config: {
      id: 'bing-wallpaper',
      name: '必应每日壁纸',
      apiUrl: `${API_60S_BASE}/v2/bing`,
      method: 'GET',
      refreshInterval: 7200,
      dataPath: 'data',
      displayType: 'card',
      fields: { title: 'title', image: 'cover', subtitle: 'description' },
      maxItems: 1,
      emptyText: '壁纸加载中...'
    }
  },
  {
    id: 'history-today',
    name: '历史上的今天',
    description: '历史上的今天大事记',
    category: 'periodic',
    categoryLabel: '周期资讯',
    icon: 'History',
    config: {
      id: 'history-today',
      name: '历史上的今天',
      apiUrl: `${API_60S_BASE}/v2/today-in-history`,
      method: 'GET',
      refreshInterval: 3600,
      dataPath: 'data.items',
      displayType: 'list',
      fields: { title: 'title', subtitle: 'year', value: 'description', link: 'link' },
      maxItems: 5,
      emptyText: '历史事件加载中...'
    }
  }
];

// 实用功能类 API
export const API_60S_UTILITY: API60sPreset[] = [];

// 热门榜单类 API
export const API_60S_TRENDING: API60sPreset[] = [
  {
    id: 'douyin-hot',
    name: '抖音热搜',
    description: '抖音实时热搜榜',
    category: 'trending',
    categoryLabel: '热门榜单',
    icon: 'Flame',
    config: {
      id: 'douyin-hot',
      name: '抖音热搜',
      apiUrl: `${API_60S_BASE}/v2/douyin`,
      method: 'GET',
      refreshInterval: 600,
      dataPath: 'data',
      displayType: 'list',
      fields: { title: 'title', value: 'hot_value', link: 'link' },
      maxItems: 10,
      emptyText: '热搜加载中...'
    }
  },
  {
    id: 'xiaohongshu-hot',
    name: '小红书热点',
    description: '小红书实时热点',
    category: 'trending',
    categoryLabel: '热门榜单',
    icon: 'Flame',
    config: {
      id: 'xiaohongshu-hot',
      name: '小红书热点',
      apiUrl: `${API_60S_BASE}/v2/rednote`,
      method: 'GET',
      refreshInterval: 600,
      dataPath: 'data',
      displayType: 'list',
      fields: { title: 'title', value: 'score', link: 'link' },
      maxItems: 10,
      emptyText: '热点加载中...'
    }
  },
  {
    id: 'bilibili-hot',
    name: '哔哩哔哩热搜',
    description: 'B站实时热搜榜',
    category: 'trending',
    categoryLabel: '热门榜单',
    icon: 'Flame',
    config: {
      id: 'bilibili-hot',
      name: '哔哩哔哩热搜',
      apiUrl: `${API_60S_BASE}/v2/bili`,
      method: 'GET',
      refreshInterval: 600,
      dataPath: 'data',
      displayType: 'list',
      fields: { title: 'title', link: 'link' },
      maxItems: 10,
      emptyText: '热搜加载中...'
    }
  },
  {
    id: 'weibo-hot',
    name: '微博热搜',
    description: '微博实时热搜榜',
    category: 'trending',
    categoryLabel: '热门榜单',
    icon: 'Flame',
    config: {
      id: 'weibo-hot',
      name: '微博热搜',
      apiUrl: `${API_60S_BASE}/v2/weibo`,
      method: 'GET',
      refreshInterval: 300,
      dataPath: 'data',
      displayType: 'list',
      fields: { title: 'title', value: 'hot_value', link: 'link' },
      maxItems: 10,
      emptyText: '热搜加载中...'
    }
  },
  {
    id: 'zhihu-hot',
    name: '知乎话题榜',
    description: '知乎实时话题榜',
    category: 'trending',
    categoryLabel: '热门榜单',
    icon: 'MessageCircle',
    config: {
      id: 'zhihu-hot',
      name: '知乎话题榜',
      apiUrl: `${API_60S_BASE}/v2/zhihu`,
      method: 'GET',
      refreshInterval: 600,
      dataPath: 'data',
      displayType: 'list',
      fields: { title: 'title', value: 'hot_value_desc', link: 'link' },
      maxItems: 10,
      emptyText: '话题加载中...'
    }
  },
];

// 消遣娱乐类 API
export const API_60S_ENTERTAINMENT: API60sPreset[] = [];

// 所有60s API预设
export const ALL_API_60S_PRESETS: API60sPreset[] = [
  ...API_60S_PERIODIC,
  ...API_60S_UTILITY,
  ...API_60S_TRENDING,
  ...API_60S_ENTERTAINMENT
];

// 根据ID获取预设
export const getAPI60sPresetById = (id: string): API60sPreset | undefined => {
  return ALL_API_60S_PRESETS.find(preset => preset.id === id);
};

// 根据分类获取预设
export const getAPI60sPresetsByCategory = (category: API60sCategory): API60sPreset[] => {
  return ALL_API_60S_PRESETS.filter(preset => preset.category === category);
};
