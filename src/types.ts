// ============ 核心数据类型定义 ============

export interface LinkItem {
  id: string;
  title: string;
  url: string;
  icon?: string;
  iconTone?: string;
  description?: string;
  categoryId: string;
  createdAt: number;
  hidden?: boolean;
  pinned?: boolean;
  pinnedOrder?: number;
  order?: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  hidden?: boolean;
}

export interface SiteSettings {
  title: string;
  navTitle: string;
  favicon: string;
  cardStyle: 'detailed' | 'simple';
  siteMode?: 'personal' | 'webmaster';
  accentColor?: string;
  grayScale?: 'slate' | 'zinc' | 'neutral';
  closeOnBackdrop?: boolean;
  backgroundImage?: string;
  backgroundImageEnabled?: boolean;
  backgroundMotion?: boolean;
  // Bing wallpaper settings
  backgroundSource?: 'custom' | 'bing';
  bingAutoUpdate?: boolean;
  bingLastUpdate?: string;
}

export interface StickyNote {
  id: string;
  content: string;
  htmlContent?: string;
  createdAt: number;
  updatedAt: number;
  color?: string;
  tags?: string[];
  title?: string;
  isRichText?: boolean;
}

export interface AppState {
  links: LinkItem[];
  categories: Category[];
  darkMode: boolean;
  settings?: SiteSettings;
  notes?: StickyNote[];
}

// ============ AI 配置类型定义 ============

export type AIProvider = 'gemini' | 'openai' | 'anthropic' | 'custom';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
  websiteTitle?: string;
  faviconUrl?: string;
  navigationName?: string;
}

// ============ 搜索系统类型定义 ============

export type SearchMode = 'internal' | 'external';

export interface ExternalSearchSource {
  id: string;
  name: string;
  url: string;
  icon?: string;
  enabled: boolean;
  createdAt: number;
}

export interface SearchConfig {
  mode: SearchMode;
  externalSources: ExternalSearchSource[];
  selectedSource?: ExternalSearchSource | null;
  selectedSourceId?: string;
}

// ============ 同步系统类型定义 ============

export interface SyncMetadata {
  updatedAt: number;
  deviceId: string;
  version: number;
  browser?: string;
  os?: string;
  userAgent?: string;
}

export interface YNavSyncData {
  links: LinkItem[];
  categories: Category[];
  searchConfig?: SearchConfig;
  aiConfig?: AIConfig;
  siteSettings?: SiteSettings;
  privateVault?: string;
  schemaVersion?: number;
  meta: SyncMetadata;
}

export interface SyncConflict {
  localData: YNavSyncData;
  remoteData: YNavSyncData;
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'pending' | 'error' | 'conflict';

export interface SyncApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  apiVersion?: string;
  conflict?: boolean;
}

// ============ 默认数据配置 ============

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'common', name: '常用推荐', icon: 'Star' },
  { id: 'dev', name: '开发工具', icon: 'Code' },
  { id: 'design', name: '设计资源', icon: 'Palette' },
  { id: 'read', name: '阅读资讯', icon: 'BookOpen' },
  { id: 'ent', name: '休闲娱乐', icon: 'Gamepad2' },
  { id: 'ai', name: '人工智能', icon: 'Bot' },
];

export const INITIAL_LINKS: LinkItem[] = [
  // 开发工具
  { 
    id: '1', 
    title: 'GitHub', 
    url: 'https://github.com', 
    categoryId: 'dev', 
    createdAt: Date.now(), 
    description: '全球最大的代码托管与开源社区', 
    pinned: true, 
    icon: 'https://www.faviconextractor.com/favicon/github.com?larger=true' 
  },
  { 
    id: '2', 
    title: 'React', 
    url: 'https://react.dev', 
    categoryId: 'dev', 
    createdAt: Date.now(), 
    description: 'Meta 开源的 Web 用户界面构建库', 
    pinned: true, 
    icon: 'https://www.faviconextractor.com/favicon/react.dev?larger=true' 
  },
  { 
    id: '6', 
    title: 'Vercel', 
    url: 'https://vercel.com', 
    categoryId: 'dev', 
    createdAt: Date.now(), 
    description: 'AI Cloud 前端部署与托管平台，提供开发者工具和云基础设施', 
    icon: 'https://www.faviconextractor.com/favicon/vercel.com?larger=true' 
  },
  { 
    id: '12', 
    title: 'VS Code', 
    url: 'https://code.visualstudio.com', 
    categoryId: 'dev', 
    createdAt: Date.now(), 
    description: '微软开源 AI 代码编辑器，支持 Claude Sonnet 等多种 AI 模型', 
    icon: 'https://www.faviconextractor.com/favicon/code.visualstudio.com?larger=true' 
  },
  
  // 设计资源
  { 
    id: '3', 
    title: 'Tailwind CSS', 
    url: 'https://tailwindcss.com', 
    categoryId: 'design', 
    createdAt: Date.now(), 
    description: '原子化 CSS 框架，快速构建现代网页', 
    pinned: true, 
    icon: 'https://www.faviconextractor.com/favicon/tailwindcss.com?larger=true' 
  },
  { 
    id: '7', 
    title: 'Figma', 
    url: 'https://figma.com', 
    categoryId: 'design', 
    createdAt: Date.now(), 
    description: '在线协作界面设计工具，探索全球顶尖设计师作品', 
    icon: 'https://www.faviconextractor.com/favicon/figma.com?larger=true' 
  },
  { 
    id: '11', 
    title: 'Dribbble', 
    url: 'https://dribbble.com', 
    categoryId: 'design', 
    createdAt: Date.now(), 
    description: '设计师作品分享社区，发现世界顶级设计师的创意', 
    icon: 'https://www.faviconextractor.com/favicon/dribbble.com?larger=true' 
  },
  
  // 人工智能
  { 
    id: '4', 
    title: 'ChatGPT', 
    url: 'https://chat.openai.com', 
    categoryId: 'ai', 
    createdAt: Date.now(), 
    description: 'OpenAI 开发的 AI 聊天机器人', 
    pinned: true, 
    icon: 'https://www.faviconextractor.com/favicon/chat.openai.com?larger=true' 
  },
  { 
    id: '5', 
    title: 'Gemini', 
    url: 'https://gemini.google.com', 
    categoryId: 'ai', 
    createdAt: Date.now(), 
    description: 'Google DeepMind 开发的 AI 助手', 
    pinned: true, 
    icon: 'https://www.faviconextractor.com/favicon/gemini.google.com?larger=true' 
  },
  { 
    id: '10', 
    title: 'Claude', 
    url: 'https://claude.ai', 
    categoryId: 'ai', 
    createdAt: Date.now(), 
    description: 'Anthropic 开发的 AI 助手（部分地区可用）', 
    icon: 'https://www.faviconextractor.com/favicon/claude.ai?larger=true' 
  },
  { 
    id: '13', 
    title: 'Midjourney', 
    url: 'https://www.midjourney.com', 
    categoryId: 'ai', 
    createdAt: Date.now(), 
    description: '社区资助的 AI 研究实验室，以美丽的 AI 图像模型闻名', 
    icon: 'https://www.faviconextractor.com/favicon/midjourney.com?larger=true' 
  },
  
  // 阅读资讯
  { 
    id: '8', 
    title: 'Hacker News', 
    url: 'https://news.ycombinator.com', 
    categoryId: 'read', 
    createdAt: Date.now(), 
    description: '极客新闻聚合社区，专注于技术和创业', 
    icon: 'https://www.faviconextractor.com/favicon/news.ycombinator.com?larger=true' 
  },
  { 
    id: '14', 
    title: 'The Verge', 
    url: 'https://www.theverge.com', 
    categoryId: 'read', 
    createdAt: Date.now(), 
    description: '科技新闻与评测网站，CES 2026 等展会实时报道', 
    icon: 'https://www.faviconextractor.com/favicon/theverge.com?larger=true' 
  },
  
  // 休闲娱乐
  { 
    id: '9', 
    title: 'YouTube', 
    url: 'https://youtube.com', 
    categoryId: 'ent', 
    createdAt: Date.now(), 
    description: '全球最大的视频分享平台', 
    icon: 'https://www.faviconextractor.com/favicon/youtube.com?larger=true' 
  },
  { 
    id: '15', 
    title: 'Netflix', 
    url: 'https://www.netflix.com', 
    categoryId: 'ent', 
    createdAt: Date.now(), 
    description: '流媒体影视平台，2026 年将带回多部大制作', 
    icon: 'https://www.faviconextractor.com/favicon/netflix.com?larger=true' 
  },
];

// ============ 工具类型与常量 ============

// 数据版本号
export const SCHEMA_VERSION = 1;

// KV 存储键名
export const KV_KEYS = {
  MAIN_DATA: 'ynav:data:v1',
  LEGACY_DATA: 'ynav:data',
  BACKUP_PREFIX: 'ynav:backup:v1:',
  LEGACY_BACKUP_PREFIX: 'ynav:backup:',
  SHORT_LINKS: 'ynav:shortlinks',
  ANALYTICS: 'ynav:analytics'
} as const;

// 备份保留时间（秒）
export const BACKUP_TTL = 30 * 24 * 60 * 60; // 30天

// 隐私分组常量
export const PRIVATE_CATEGORY_ID = 'private';
