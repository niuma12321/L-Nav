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
    description: '实时天气监测与未来7天预报。结合实时天气和天气预报接口，支持自定义城市查询。',
    icon: 'Cloud',
    enabled: true,
    isFixed: true, // 固定组件
    position: {
      desktop: { x: 8, y: 0, w: 4, h: 2 },
      mobile: { order: 2 }
    },
    settings: {
      city: '北京',
      showAirQuality: true,
      showForecast: true,
      refreshInterval: 1800
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
  body?: any;
  bodyType?: 'none' | 'json' | 'form-data' | 'x-www-form-urlencoded';
  queryParams?: Array<{ key: string; value: string }>;
  refreshInterval: number; // 秒，0表示不自动刷新
  dataPath: string; // 数据路径，如 'data.items' 或 'results'
  displayType: 'list' | 'table' | 'card' | 'text' | 'media-list';
  fields: {
    title: string;
    value?: string;
    subtitle?: string;
    image?: string;
    link?: string;
  };
  maxItems: number;
  emptyText: string;
  // 自定义渲染器标识，如 '60s-news', 'douyin-hot', 'bing-wallpaper' 等
  // 如果指定了 renderer，将使用对应的自定义渲染组件替代默认 displayType 渲染
  renderer?: string;
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
      renderer: '60s-news',
      fields: { title: '' },
      maxItems: 15,
      emptyText: '今日资讯加载中...'
    }
  },
  {
    id: 'ai-news',
    name: 'AI资讯快报',
    description: 'AI、大模型等领域最新资讯',
    category: 'periodic',
    categoryLabel: '周期资讯',
    icon: 'Bot',
    config: {
      id: 'ai-news',
      name: 'AI资讯快报',
      apiUrl: `${API_60S_BASE}/v2/ai-news`,
      method: 'GET',
      refreshInterval: 3600,
      dataPath: 'data',
      displayType: 'list',
      renderer: 'ai-news',
      fields: { title: 'title', value: 'source', link: 'link' },
      maxItems: 10,
      emptyText: 'AI资讯加载中...'
    }
  },
  {
    id: 'it-news',
    name: '实时IT资讯',
    description: 'IT之家实时更新科技资讯',
    category: 'periodic',
    categoryLabel: '周期资讯',
    icon: 'Cpu',
    config: {
      id: 'it-news',
      name: '实时IT资讯',
      apiUrl: `${API_60S_BASE}/v2/ithome`,
      method: 'GET',
      refreshInterval: 1800,
      dataPath: 'data',
      displayType: 'list',
      renderer: 'it-news',
      fields: { title: 'title', value: 'time', link: 'link' },
      maxItems: 10,
      emptyText: 'IT资讯加载中...'
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
      renderer: 'bing-wallpaper',
      fields: { title: 'title', image: 'cover', subtitle: 'description' },
      maxItems: 1,
      emptyText: '壁纸加载中...'
    }
  },
  {
    id: 'exchange-rate',
    name: '当日货币汇率',
    description: '实时汇率查询',
    category: 'periodic',
    categoryLabel: '周期资讯',
    icon: 'Banknote',
    config: {
      id: 'exchange-rate',
      name: '当日货币汇率',
      apiUrl: `${API_60S_BASE}/v2/exchange-rate`,
      method: 'GET',
      refreshInterval: 3600,
      dataPath: 'data',
      displayType: 'table',
      renderer: 'exchange-rate',
      fields: { title: 'currency', value: 'rate', subtitle: 'update_time' },
      maxItems: 10,
      emptyText: '汇率加载中...'
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
      renderer: 'history-today',
      fields: { title: 'title', subtitle: 'year', value: 'description', link: 'link' },
      maxItems: 5,
      emptyText: '历史事件加载中...'
    }
  },
  {
    id: 'epic-games',
    name: 'Epic免费游戏',
    description: 'Epic Games每周免费游戏',
    category: 'periodic',
    categoryLabel: '周期资讯',
    icon: 'Gamepad2',
    config: {
      id: 'epic-games',
      name: 'Epic免费游戏',
      apiUrl: `${API_60S_BASE}/v2/epic`,
      method: 'GET',
      refreshInterval: 86400,
      dataPath: 'data',
      displayType: 'media-list',
      renderer: 'epic-games',
      fields: { title: 'title', image: 'cover', subtitle: 'description', value: 'end_date', link: 'link' },
      maxItems: 5,
      emptyText: '游戏列表加载中...'
    }
  }
];

// 实用功能类 API
export const API_60S_UTILITY: API60sPreset[] = [
  {
    id: 'gold-price',
    name: '黄金价格',
    description: '实时黄金价格行情',
    category: 'utility',
    categoryLabel: '实用功能',
    icon: 'CircleDollarSign',
    config: {
      id: 'gold-price',
      name: '黄金价格',
      apiUrl: `${API_60S_BASE}/v2/gold`,
      method: 'GET',
      refreshInterval: 1800,
      dataPath: 'data',
      displayType: 'table',
      renderer: 'gold-price',
      fields: { title: 'name', value: 'price', subtitle: 'change' },
      maxItems: 10,
      emptyText: '金价加载中...'
    }
  },
  {
    id: 'oil-price',
    name: '汽油价格',
    description: '全国各地汽油价格',
    category: 'utility',
    categoryLabel: '实用功能',
    icon: 'Fuel',
    config: {
      id: 'oil-price',
      name: '汽油价格',
      apiUrl: `${API_60S_BASE}/v2/oil`,
      method: 'GET',
      refreshInterval: 3600,
      dataPath: 'data',
      displayType: 'table',
      renderer: 'oil-price',
      fields: { title: 'region', value: 'price_92', subtitle: 'price_95' },
      maxItems: 10,
      emptyText: '油价加载中...'
    }
  },
  {
    id: 'moyu-daily',
    name: '摸鱼日报',
    description: '每日摸鱼晨报、午报、晚报',
    category: 'utility',
    categoryLabel: '实用功能',
    icon: 'Coffee',
    config: {
      id: 'moyu-daily',
      name: '摸鱼日报',
      apiUrl: `${API_60S_BASE}/v2/moyu`,
      method: 'GET',
      refreshInterval: 3600,
      dataPath: 'data',
      displayType: 'text',
      renderer: 'moyu-daily',
      fields: { title: 'content' },
      maxItems: 1,
      emptyText: '摸鱼日报加载中...'
    }
  },
  {
    id: 'weather',
    name: '实时天气',
    description: '实时天气查询，支持自定义城市',
    category: 'utility',
    categoryLabel: '实用功能',
    icon: 'CloudSun',
    config: {
      id: 'weather',
      name: '实时天气',
      apiUrl: `${API_60S_BASE}/v2/weather`,
      method: 'GET',
      refreshInterval: 1800,
      dataPath: 'data',
      displayType: 'card',
      renderer: 'weather',
      fields: { title: 'city', value: 'temp', subtitle: 'weather', image: 'icon' },
      maxItems: 1,
      emptyText: '天气加载中...'
    }
  },
  {
    id: 'weather-forecast',
    name: '天气预报',
    description: '未来3天天气预报',
    category: 'utility',
    categoryLabel: '实用功能',
    icon: 'CalendarDays',
    config: {
      id: 'weather-forecast',
      name: '天气预报',
      apiUrl: `${API_60S_BASE}/v2/weather/forecast`,
      method: 'GET',
      refreshInterval: 3600,
      dataPath: 'data.forecast',
      displayType: 'list',
      renderer: 'weather-forecast',
      fields: { title: 'date', value: 'temp', subtitle: 'weather' },
      maxItems: 3,
      emptyText: '天气预报加载中...'
    }
  },
  {
    id: 'ip-info',
    name: '公网IP地址',
    description: '查询当前公网IP信息',
    category: 'utility',
    categoryLabel: '实用功能',
    icon: 'Network',
    config: {
      id: 'ip-info',
      name: '公网IP地址',
      apiUrl: `${API_60S_BASE}/v2/ip`,
      method: 'GET',
      refreshInterval: 0,
      dataPath: 'data',
      displayType: 'text',
      renderer: 'ip-info',
      fields: { title: 'ip', subtitle: 'location' },
      maxItems: 1,
      emptyText: 'IP信息加载中...'
    }
  }
];

// 热门榜单类 API
export const API_60S_TRENDING: API60sPreset[] = [
  {
    id: 'douyin-hot',
    name: '抖音热搜',
    description: '抖音实时热搜榜，带封面图片和热度值',
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
      displayType: 'media-list',
      renderer: 'douyin-hot',
      fields: { title: 'title', value: 'hot_value', image: 'cover', link: 'link', subtitle: 'active_time' },
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
    icon: 'Heart',
    config: {
      id: 'xiaohongshu-hot',
      name: '小红书热点',
      apiUrl: `${API_60S_BASE}/v2/rednote`,
      method: 'GET',
      refreshInterval: 600,
      dataPath: 'data',
      displayType: 'list',
      renderer: 'xiaohongshu-hot',
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
    icon: 'Play',
    config: {
      id: 'bilibili-hot',
      name: '哔哩哔哩热搜',
      apiUrl: `${API_60S_BASE}/v2/bili`,
      method: 'GET',
      refreshInterval: 600,
      dataPath: 'data',
      displayType: 'list',
      renderer: 'bilibili-hot',
      fields: { title: 'title', value: 'hot_value', link: 'link' },
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
    icon: 'AtSign',
    config: {
      id: 'weibo-hot',
      name: '微博热搜',
      apiUrl: `${API_60S_BASE}/v2/weibo`,
      method: 'GET',
      refreshInterval: 300,
      dataPath: 'data',
      displayType: 'list',
      renderer: 'weibo-hot',
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
      renderer: 'zhihu-hot',
      fields: { title: 'title', value: 'hot_value_desc', link: 'link' },
      maxItems: 10,
      emptyText: '话题加载中...'
    }
  },
  {
    id: 'baidu-hot',
    name: '百度实时热搜',
    description: '百度实时热搜榜',
    category: 'trending',
    categoryLabel: '热门榜单',
    icon: 'Search',
    config: {
      id: 'baidu-hot',
      name: '百度实时热搜',
      apiUrl: `${API_60S_BASE}/v2/baidu`,
      method: 'GET',
      refreshInterval: 300,
      dataPath: 'data',
      displayType: 'list',
      renderer: 'baidu-hot',
      fields: { title: 'title', value: 'hot_value', link: 'link' },
      maxItems: 10,
      emptyText: '热搜加载中...'
    }
  },
  {
    id: 'quark-hot',
    name: '夸克热点',
    description: '夸克7x24小时实时热点',
    category: 'trending',
    categoryLabel: '热门榜单',
    icon: 'Zap',
    config: {
      id: 'quark-hot',
      name: '夸克热点',
      apiUrl: `${API_60S_BASE}/v2/quark`,
      method: 'GET',
      refreshInterval: 300,
      dataPath: 'data',
      displayType: 'list',
      renderer: 'quark-hot',
      fields: { title: 'title', value: 'hot_value', link: 'link' },
      maxItems: 10,
      emptyText: '热点加载中...'
    }
  },
  {
    id: 'dongchedi-hot',
    name: '懂车帝热搜',
    description: '懂车帝实时汽车热点',
    category: 'trending',
    categoryLabel: '热门榜单',
    icon: 'Car',
    config: {
      id: 'dongchedi-hot',
      name: '懂车帝热搜',
      apiUrl: `${API_60S_BASE}/v2/dongchedi`,
      method: 'GET',
      refreshInterval: 600,
      dataPath: 'data',
      displayType: 'list',
      renderer: 'dongchedi-hot',
      fields: { title: 'title', value: 'hot_value', link: 'link' },
      maxItems: 10,
      emptyText: '热搜加载中...'
    }
  },
  {
    id: 'toutiao-hot',
    name: '头条热搜榜',
    description: '今日头条实时热搜',
    category: 'trending',
    categoryLabel: '热门榜单',
    icon: 'FileText',
    config: {
      id: 'toutiao-hot',
      name: '头条热搜榜',
      apiUrl: `${API_60S_BASE}/v2/toutiao`,
      method: 'GET',
      refreshInterval: 300,
      dataPath: 'data',
      displayType: 'list',
      renderer: 'toutiao-hot',
      fields: { title: 'title', value: 'hot_value', link: 'link' },
      maxItems: 10,
      emptyText: '热搜加载中...'
    }
  },
  {
    id: 'hackernews-hot',
    name: 'Hacker News',
    description: 'Hacker News热帖',
    category: 'trending',
    categoryLabel: '热门榜单',
    icon: 'Terminal',
    config: {
      id: 'hackernews-hot',
      name: 'Hacker News',
      apiUrl: `${API_60S_BASE}/v2/hackernews`,
      method: 'GET',
      refreshInterval: 600,
      dataPath: 'data',
      displayType: 'list',
      renderer: 'hackernews-hot',
      fields: { title: 'title', value: 'points', link: 'link' },
      maxItems: 10,
      emptyText: '热帖加载中...'
    }
  }
];

// 消遣娱乐类 API
export const API_60S_ENTERTAINMENT: API60sPreset[] = [
  {
    id: 'random-quote',
    name: '随机一言',
    description: '随机 inspirational 名言警句',
    category: 'entertainment',
    categoryLabel: '消遣娱乐',
    icon: 'Quote',
    config: {
      id: 'random-quote',
      name: '随机一言',
      apiUrl: `${API_60S_BASE}/v2/hitokoto`,
      method: 'GET',
      refreshInterval: 0,
      dataPath: 'data',
      displayType: 'text',
      renderer: 'random-quote',
      fields: { title: 'hitokoto', subtitle: 'from' },
      maxItems: 1,
      emptyText: '一言加载中...'
    }
  },
  {
    id: 'random-joke',
    name: '随机搞笑段子',
    description: '每日一笑',
    category: 'entertainment',
    categoryLabel: '消遣娱乐',
    icon: 'Laugh',
    config: {
      id: 'random-joke',
      name: '随机搞笑段子',
      apiUrl: `${API_60S_BASE}/v2/joke`,
      method: 'GET',
      refreshInterval: 0,
      dataPath: 'data',
      displayType: 'text',
      renderer: 'random-joke',
      fields: { title: 'content' },
      maxItems: 1,
      emptyText: '段子加载中...'
    }
  },
  {
    id: 'random-cold-joke',
    name: '随机冷笑话',
    description: '冷到发抖的笑话',
    category: 'entertainment',
    categoryLabel: '消遣娱乐',
    icon: 'Snowflake',
    config: {
      id: 'random-cold-joke',
      name: '随机冷笑话',
      apiUrl: `${API_60S_BASE}/v2/cold-joke`,
      method: 'GET',
      refreshInterval: 0,
      dataPath: 'data',
      displayType: 'text',
      renderer: 'random-cold-joke',
      fields: { title: 'content' },
      maxItems: 1,
      emptyText: '冷笑话加载中...'
    }
  },
  {
    id: 'random-fortune',
    name: '随机运势',
    description: '今日运势占卜',
    category: 'entertainment',
    categoryLabel: '消遣娱乐',
    icon: 'Sparkles',
    config: {
      id: 'random-fortune',
      name: '随机运势',
      apiUrl: `${API_60S_BASE}/v2/fortune`,
      method: 'GET',
      refreshInterval: 0,
      dataPath: 'data',
      displayType: 'text',
      renderer: 'random-fortune',
      fields: { title: 'fortune', subtitle: 'lucky_color' },
      maxItems: 1,
      emptyText: '运势加载中...'
    }
  },
  {
    id: 'kfc-v50',
    name: 'KFC V50文案',
    description: '疯狂星期四V50文案',
    category: 'entertainment',
    categoryLabel: '消遣娱乐',
    icon: 'Utensils',
    config: {
      id: 'kfc-v50',
      name: 'KFC V50文案',
      apiUrl: `${API_60S_BASE}/v2/kfc`,
      method: 'GET',
      refreshInterval: 0,
      dataPath: 'data',
      displayType: 'text',
      renderer: 'kfc-v50',
      fields: { title: 'content' },
      maxItems: 1,
      emptyText: '文案加载中...'
    }
  }
];

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
