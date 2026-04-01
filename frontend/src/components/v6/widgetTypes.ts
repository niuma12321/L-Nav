// V9.0 Modular Widget System Types

export type WidgetType = 
  | 'search-hub' 
  | 'custom-links' 
  | 'stock-widget' 
  | 'weather'
  | 'todo-list'
  | 'notes'
  | 'news-feed'
  | 'market-overview';

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  description: string;
  icon: string;
  enabled: boolean;
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
    position: {
      desktop: { x: 8, y: 0, w: 4, h: 2 },
      mobile: { order: 2 }
    },
    settings: {
      cities: ['上海'],
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

export const DEFAULT_SEARCH_ENGINES: SearchEngine[] = [
  { id: 'google', name: 'Google', url: 'https://google.com/search', queryParam: 'q' },
  { id: 'baidu', name: '百度', url: 'https://www.baidu.com/s', queryParam: 'wd' },
  { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search', queryParam: 'q' },
  { id: 'github', name: 'GitHub', url: 'https://github.com/search', queryParam: 'q' },
  { id: 'stackoverflow', name: 'StackOverflow', url: 'https://stackoverflow.com/search', queryParam: 'q' },
  { id: 'zhihu', name: '知乎', url: 'https://www.zhihu.com/search', queryParam: 'q' },
  { id: 'bilibili', name: 'Bilibili', url: 'https://search.bilibili.com/all', queryParam: 'keyword' }
];
