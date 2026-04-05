import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  FolderOpen, 
  Link2, 
  ExternalLink,
  MoreVertical,
  Grid3X3,
  List,
  Import,
  Sparkles,
  ChevronDown,
  Edit3,
  Trash2,
  Globe,
  Pin,
  LayoutGrid,
  Settings,
  Menu,
  ChevronRight
} from '@/utils/icons';

interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
  color: string;
}

interface Resource {
  id: string;
  title: string;
  url: string;
  description: string;
  categoryId: string;
  categoryName?: string;
  favicon?: string;
  icon?: string;
  createdAt: number;
}

const mockCategories: Category[] = [
  { id: 'all', name: '全部资源', icon: '⊞', count: 128, color: 'bg-emerald-500' },
  { id: 'dev', name: '开发工具', icon: '</>', count: 32, color: 'bg-blue-500' },
  { id: 'design', name: '设计资源', icon: '🎨', count: 24, color: 'bg-purple-500' },
  { id: 'ai', name: 'AI服务', icon: '🤖', count: 18, color: 'bg-amber-500' },
  { id: 'finance', name: '金融数据', icon: '📈', count: 15, color: 'bg-red-500' },
  { id: 'news', name: '资讯阅读', icon: '📰', count: 21, color: 'bg-cyan-500' },
  { id: 'learning', name: '学习教程', icon: '📚', count: 12, color: 'bg-green-500' },
  { id: 'entertainment', name: '娱乐休闲', icon: '🎮', count: 6, color: 'bg-pink-500' },
];

const mockResources: Resource[] = [
  { id: '1', title: 'GitHub', url: 'github.com', description: '全球最大代码托管平台', categoryId: 'dev', favicon: 'https://github.com/favicon.ico', createdAt: Date.now() },
  { id: '2', title: 'Figma', url: 'figma.com', description: '在线协作设计工具', categoryId: 'design', favicon: 'https://figma.com/favicon.ico', createdAt: Date.now() },
  { id: '3', title: 'Vercel', url: 'vercel.com', description: '前端部署云平台', categoryId: 'dev', favicon: 'https://vercel.com/favicon.ico', createdAt: Date.now() },
  { id: '4', title: 'ChatGPT', url: 'chat.openai.com', description: 'OpenAI智能对话', categoryId: 'ai', favicon: 'https://chat.openai.com/favicon.ico', createdAt: Date.now() },
  { id: '5', title: '东方财富', url: 'eastmoney.com', description: 'A股行情资讯平台', categoryId: 'finance', favicon: 'https://eastmoney.com/favicon.ico', createdAt: Date.now() },
  { id: '6', title: '腾讯新闻', url: 'news.qq.com', description: '24小时热点资讯', categoryId: 'news', favicon: 'https://news.qq.com/favicon.ico', createdAt: Date.now() },
  { id: '7', title: 'MDN Web Docs', url: 'developer.mozilla.org', description: 'Web开发权威文档', categoryId: 'learning', favicon: 'https://developer.mozilla.org/favicon.ico', createdAt: Date.now() },
  { id: '8', title: 'Bilibili', url: 'bilibili.com', description: '年轻人文化社区', categoryId: 'entertainment', favicon: 'https://bilibili.com/favicon.ico', createdAt: Date.now() },
  { id: '9', title: 'Midjourney', url: 'midjourney.com', description: 'AI绘画生成工具', categoryId: 'ai', favicon: 'https://midjourney.com/favicon.ico', createdAt: Date.now() },
  { id: '10', title: 'Dribbble', url: 'dribbble.com', description: '设计师作品展示', categoryId: 'design', favicon: 'https://dribbble.com/favicon.ico', createdAt: Date.now() },
  { id: '11', title: 'Stack Overflow', url: 'stackoverflow.com', description: '程序员问答社区', categoryId: 'dev', favicon: 'https://stackoverflow.com/favicon.ico', createdAt: Date.now() },
  { id: '12', title: '财联社', url: 'cls.cn', description: '财经快讯7x24', categoryId: 'finance', favicon: 'https://cls.cn/favicon.ico', createdAt: Date.now() },
];

// 辅助函数：渲染图标（支持 emoji、自定义图片、默认 favicon）
const renderResourceIcon = (resource: Resource, size: number = 24) => {
  // 优先显示自定义 icon（emoji 或图片 URL）
  if (resource.icon) {
    // 如果是图片 URL
    if (resource.icon.startsWith('http') || resource.icon.startsWith('data:')) {
      return <img src={resource.icon} alt="" className={`w-${size/4} h-${size/4} rounded`} style={{ width: size, height: size }} />;
    }
    // 如果是 emoji（短字符串）
    if (resource.icon.length <= 4) {
      return <span style={{ fontSize: size, lineHeight: 1 }}>{resource.icon}</span>;
    }
  }
  
  // 其次显示 favicon - 使用Google Favicon服务
  if (resource.url) {
    try {
      const url = resource.url.startsWith('http') ? resource.url : `https://${resource.url}`;
      const domain = new URL(url).hostname;
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
      return <img src={faviconUrl} alt="" className={`w-${size/4} h-${size/4} rounded`} style={{ width: size, height: size }} onError={(e) => {
        // 加载失败时显示默认图标
        e.currentTarget.style.display = 'none';
      }} />;
    } catch {
      // URL解析失败，显示默认图标
    }
  }
  
  // 默认图标
  return <Link2 className={`w-${size/4} h-${size/4} text-slate-500`} style={{ width: size, height: size }} />;
};

// 提取域名显示
const getDisplayUrl = (url: string) => {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0];
  }
};

// 获取分类颜色
const getCategoryColor = (categoryId: string) => {
  const colors: Record<string, string> = {
    'dev': 'bg-blue-500/20 text-blue-400',
    'design': 'bg-purple-500/20 text-purple-400',
    'ai': 'bg-amber-500/20 text-amber-400',
    'finance': 'bg-red-500/20 text-red-400',
    'news': 'bg-cyan-500/20 text-cyan-400',
    'learning': 'bg-green-500/20 text-green-400',
    'entertainment': 'bg-pink-500/20 text-pink-400',
    'uncategorized': 'bg-slate-500/20 text-slate-400'
  };
  return colors[categoryId] || 'bg-emerald-500/20 text-emerald-400';
};

const scoreResourceMatch = (resource: Resource, normalizedQuery: string) => {
  if (!normalizedQuery) return 0;

  const title = resource.title.toLowerCase();
  const description = resource.description.toLowerCase();
  const url = resource.url.toLowerCase();
  let score = 0;

  if (title === normalizedQuery) score += 120;
  if (title.startsWith(normalizedQuery)) score += 80;
  if (title.includes(normalizedQuery)) score += 50;
  if (description.includes(normalizedQuery)) score += 20;
  if (url.includes(normalizedQuery)) score += 15;

  return score;
};

interface ResourceCenterViewCNProps {
  onAddResource?: () => void;
  onImport?: () => void;
  onPreviewLink?: (url: string) => void;
  onOpenSettings?: () => void;
  onOpenMenuSettings?: () => void;
  onOpenWidgetSettings?: () => void;
  onEditLink?: (link: any) => void;
  onDeleteLink?: (id: string) => void;
  links?: Array<{
    id: string;
    title: string;
    url: string;
    description?: string;
    icon?: string;
    categoryId?: string;
    favicon?: string;
    pinned?: boolean;
    hidden?: boolean;
    pinnedOrder?: number;
    createdAt?: number;
    updatedAt?: number;
  }>;
  categories?: Array<{
    id: string;
    name: string;
    icon?: string;
  }>;
}

const ResourceCenterViewCN: React.FC<ResourceCenterViewCNProps> = ({ 
  onAddResource,
  onImport,
  onPreviewLink,
  onOpenSettings,
  onOpenMenuSettings,
  onOpenWidgetSettings,
  onEditLink,
  onDeleteLink,
  links = [],
  categories = []
}) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);

  const visibleLinks = useMemo(() => links.filter((link) => !link.hidden), [links]);

  const categoryNameMap = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category.name]));
  }, [categories]);

  // 将真实的 links 数据转换为 Resource 格式
  const resources = useMemo(() => {
    return visibleLinks.map(link => {
      let favicon = link.favicon;
      if (!favicon || favicon.includes('faviconextractor')) {
        let domain = link.url;
        try {
          if (link.url.startsWith('http://') || link.url.startsWith('https://')) {
            domain = new URL(link.url).hostname;
          } else {
            domain = link.url.split('/')[0];
          }
        } catch {
          domain = link.url.replace(/^https?:\/\//, '').split('/')[0];
        }
        domain = domain.split(':')[0];
        if (domain && !domain.includes('localhost') && !domain.startsWith('127.') && !domain.startsWith('192.168.')) {
          favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
        }
      }

      const categoryId = link.categoryId || 'uncategorized';

      return {
        id: link.id,
        title: link.title,
        url: link.url,
        description: link.description || '',
        categoryId,
        categoryName: categoryNameMap.get(categoryId) || '未分类',
        favicon: favicon || '',
        icon: link.icon,
        createdAt: link.updatedAt || link.createdAt || Date.now()
      };
    });
  }, [categoryNameMap, visibleLinks]);

  // 构建分类数据
  const categoryList = useMemo(() => {
    const allCategory = { id: 'all', name: '全部资源', icon: '⊞', count: visibleLinks.length, color: 'bg-emerald-500' };
    if (categories.length === 0) {
      return [allCategory];
    }

    const mappedCategories = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon || '📁',
      count: visibleLinks.filter(link => link.categoryId === cat.id).length,
      color: 'bg-blue-500'
    }));

    return [allCategory, ...mappedCategories];
  }, [categories, visibleLinks]);

  // 过滤资源
  const filteredResources = useMemo(() => {
    let filtered = resources;
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (activeCategory !== 'all') {
      filtered = filtered.filter(r => r.categoryId === activeCategory);
    }

    if (normalizedQuery) {
      filtered = filtered
        .filter(r => scoreResourceMatch(r, normalizedQuery) > 0)
        .sort((a, b) => {
          const scoreDiff = scoreResourceMatch(b, normalizedQuery) - scoreResourceMatch(a, normalizedQuery);
          if (scoreDiff !== 0) return scoreDiff;
          return b.createdAt - a.createdAt;
        });
    } else {
      filtered = [...filtered].sort((a, b) => b.createdAt - a.createdAt);
    }

    return filtered;
  }, [activeCategory, searchQuery, resources]);

  const activeCategoryData = categoryList.find(c => c.id === activeCategory);

  // 置顶和常用链接计算
  const pinnedLinks = useMemo(() => {
    return [...visibleLinks]
      .filter(link => link.pinned)
      .sort((a, b) => {
        const pinnedOrderA = a.pinnedOrder ?? Number.MAX_SAFE_INTEGER;
        const pinnedOrderB = b.pinnedOrder ?? Number.MAX_SAFE_INTEGER;
        if (pinnedOrderA !== pinnedOrderB) return pinnedOrderA - pinnedOrderB;
        return (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0);
      })
      .slice(0, 8);
  }, [visibleLinks]);

  const frequentLinks = useMemo(() => {
    return [...visibleLinks]
      .filter(link => !link.pinned)
      .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0))
      .slice(0, 8);
  }, [visibleLinks]);

  return (
    <div className="space-y-6">
      {/* Header Section - 添加统一设置入口 */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">数字资源中心</h1>
          <p className="text-sm text-slate-400">
            高效整理您的数字化资产，一站式管理您的工作流。
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* 统一设置入口下拉框 */}
          <div className="relative">
            <button
              onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#181a1c] text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">设置</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showSettingsDropdown ? 'rotate-180' : ''}`} />
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
                    onOpenMenuSettings?.();
                    setShowSettingsDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-2"
                >
                  <Menu className="w-4 h-4" />
                  菜单配置
                </button>
                <button
                  onClick={() => {
                    onOpenWidgetSettings?.();
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

          <button
            onClick={onImport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#181a1c] text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Import className="w-4 h-4" />
            <span className="text-sm font-medium">导入</span>
          </button>
          <button
            onClick={onAddResource}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-[#0d0e10] font-medium hover:bg-emerald-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">添加</span>
          </button>
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#181a1c]">
        <div className="relative">
          <button
            onClick={() => setShowCategoryMenu(!showCategoryMenu)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-sm font-medium"
          >
            <FolderOpen className="w-4 h-4" />
            {activeCategoryData?.name || '全部资源'}
            <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-500/20 text-xs">
              {filteredResources.length}
            </span>
            <ChevronDown className="w-4 h-4" />
          </button>
          
          {/* Dropdown Menu */}
          {showCategoryMenu && (
            <div className="absolute top-full left-0 mt-2 w-56 rounded-2xl bg-[#181a1c] border border-white/10 shadow-xl z-50">
              {categoryList.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setActiveCategory(category.id);
                    setShowCategoryMenu(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors first:rounded-t-2xl last:rounded-b-2xl ${
                    activeCategory === category.id
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${category.color}`} />
                  <span className="flex-1 text-left text-sm">{category.name}</span>
                  <span className="text-xs text-slate-500">{category.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-[#0d0e10] border border-white/5">
            <Search className="w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索资源名称、描述..."
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="text-slate-500 hover:text-white"
              >
                ×
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-[#0d0e10] rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-emerald-500 text-[#0d0e10]' : 'text-slate-400 hover:text-white'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-emerald-500 text-[#0d0e10]' : 'text-slate-400 hover:text-white'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 置顶/常用 - 卡片形式展示 */}
      {(pinnedLinks.length > 0 || frequentLinks.length > 0) && (
        <div className="space-y-4">
          {/* 置顶链接 - 卡片形式 */}
          {pinnedLinks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Pin className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">置顶链接</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {pinnedLinks.map((link) => {
                  const getFaviconUrl = (url: string) => {
                    try {
                      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
                      const domain = urlObj.hostname;
                      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
                    } catch {
                      return '';
                    }
                  };
                  const faviconUrl = link.favicon && !link.favicon.includes('faviconextractor') 
                    ? link.favicon 
                    : getFaviconUrl(link.url);
                  
                  return (
                    <a
                      key={link.id}
                      href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#181a1c] hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/20 transition-all group"
                      title={link.title}
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#0d0e10] flex items-center justify-center overflow-hidden">
                        {link.icon && link.icon.includes('http') ? (
                          <img src={link.icon} alt="" className="w-6 h-6 rounded" />
                        ) : link.icon ? (
                          <span className="text-lg">{link.icon}</span>
                        ) : faviconUrl ? (
                          <img src={faviconUrl} alt="" className="w-6 h-6 rounded" />
                        ) : (
                          <Globe className="w-5 h-5 text-slate-500 group-hover:text-emerald-400" />
                        )}
                      </div>
                      <span className="text-xs text-slate-300 group-hover:text-emerald-400 truncate w-full text-center">{link.title}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* 常用链接 - 卡片形式 */}
          {frequentLinks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <LayoutGrid className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-400">常用链接</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {frequentLinks.slice(0, 8).map((link) => {
                  const getFaviconUrl = (url: string) => {
                    try {
                      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
                      const domain = urlObj.hostname;
                      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
                    } catch {
                      return '';
                    }
                  };
                  const faviconUrl = link.favicon && !link.favicon.includes('faviconextractor') 
                    ? link.favicon 
                    : getFaviconUrl(link.url);
                  
                  return (
                    <a
                      key={link.id}
                      href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#181a1c] hover:bg-white/5 border border-white/5 hover:border-white/10 transition-all group"
                      title={link.title}
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#0d0e10] flex items-center justify-center overflow-hidden">
                        {link.icon && link.icon.includes('http') ? (
                          <img src={link.icon} alt="" className="w-6 h-6 rounded" />
                        ) : link.icon ? (
                          <span className="text-lg">{link.icon}</span>
                        ) : faviconUrl ? (
                          <img src={faviconUrl} alt="" className="w-6 h-6 rounded" />
                        ) : (
                          <Globe className="w-5 h-5 text-slate-500" />
                        )}
                      </div>
                      <span className="text-xs text-slate-400 group-hover:text-slate-200 truncate w-full text-center">{link.title}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Recommendations Banner */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border border-amber-500/20">
        <Sparkles className="w-5 h-5 text-amber-400" />
        <div className="flex-1">
          <p className="text-sm text-white font-medium">AI 智能推荐</p>
          <p className="text-xs text-slate-400">根据您的使用习惯，为您推荐相关资源</p>
        </div>
        <button className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-400 text-sm font-medium hover:bg-amber-500/30 transition-colors">
          查看推荐
        </button>
      </div>

      {/* 资源网格 - 响应式布局 */}
      <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5' : 'grid-cols-1'}`}>
        {filteredResources.map((resource) => (
          <ResourceCard 
            key={resource.id} 
            resource={resource} 
            viewMode={viewMode} 
            onEdit={onEditLink}
            onDelete={onDeleteLink}
            onPreview={onPreviewLink}
          />
        ))}
        
        {/* Add New Placeholder */}
        <button 
          onClick={onAddResource}
          className={`rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 text-slate-500 hover:border-emerald-500/30 hover:text-emerald-400 transition-all ${viewMode === 'list' ? 'p-4 flex-row' : 'p-6 min-h-[200px]'}`}
        >
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
            <Plus className="w-6 h-6" />
          </div>
          <span className="text-sm font-medium">快速添加</span>
        </button>
      </div>

      {/* Empty State */}
      {filteredResources.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 rounded-full bg-[#181a1c] flex items-center justify-center mb-4">
            <Search className="w-10 h-10 text-slate-500" />
          </div>
          <p className="text-lg font-medium text-white mb-2">没有找到相关资源</p>
          <p className="text-sm text-slate-500">试试其他搜索词或分类</p>
        </div>
      )}
    </div>
  );
};

// 资源卡片组件
interface ResourceCardProps {
  resource: Resource;
  viewMode: 'grid' | 'list';
  onEdit?: (link: any) => void;
  onDelete?: (id: string) => void;
  onPreview?: (url: string) => void;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resource, viewMode, onEdit, onDelete, onPreview }) => {
  const [showMenu, setShowMenu] = useState(false);
  
  // 使用 resource 的 categoryId 直接显示，或显示默认文本
  const categoryName = resource.categoryId && resource.categoryId !== 'uncategorized' 
    ? resource.categoryId 
    : '未分类';

  const handleCardClick = () => {
    if (onPreview && resource.url) {
      let url = resource.url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      onPreview(url);
    } else if (resource.url) {
      let url = resource.url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit({
        id: resource.id,
        title: resource.title,
        url: resource.url,
        description: resource.description,
        categoryId: resource.categoryId,
        icon: resource.icon,
        favicon: resource.favicon,
      });
    }
    setShowMenu(false);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(resource.id);
    }
    setShowMenu(false);
  };

  const handleExternalLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (resource.url) {
      let url = resource.url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      window.open(url, '_blank');
    }
  };

  if (viewMode === 'list') {
    return (
      <div 
        onClick={handleCardClick}
        className="flex items-center gap-4 p-4 rounded-2xl bg-[#181a1c] hover:bg-[#242629] transition-colors group cursor-pointer"
      >
        <div className="w-12 h-12 rounded-xl bg-[#0d0e10] flex items-center justify-center shrink-0">
          {renderResourceIcon(resource, 24)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-medium text-white truncate" title={resource.title}>{resource.title}</h4>
          <p className="text-xs text-slate-500 truncate" title={resource.url}>{resource.url}</p>
          <p className="text-sm text-slate-400 truncate">{resource.description}</p>
        </div>
        <span className="px-2 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-400">
          {categoryName}
        </span>
        
        {/* Edit/Delete buttons for list view */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleEditClick}
            className="p-2 rounded-xl text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
            title="编辑"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={handleDeleteClick}
            className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button 
            onClick={handleExternalLinkClick}
            className="p-2 rounded-xl text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={handleCardClick}
      className="p-5 rounded-2xl bg-[#181a1c] hover:bg-[#242629] transition-all group cursor-pointer relative"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-[#0d0e10] flex items-center justify-center">
          {renderResourceIcon(resource, 24)}
        </div>
        <div className="relative">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-32 rounded-xl bg-[#242629] border border-white/10 shadow-lg z-50 py-1">
              <button
                onClick={handleEditClick}
                className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-2"
              >
                <Edit3 className="w-3.5 h-3.5" />
                编辑
              </button>
              <button
                onClick={handleDeleteClick}
                className="w-full px-3 py-2 text-left text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                删除
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <h4 className="text-base font-bold text-white mb-1 truncate" title={resource.title}>
        {resource.title}
      </h4>
      <p className="text-xs text-slate-500 mb-1 truncate" title={resource.url}>
        {getDisplayUrl(resource.url)}
      </p>
      <p className="text-sm text-slate-400 mb-4 line-clamp-2">{resource.description}</p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className={`px-2 py-1 rounded-full text-xs ${getCategoryColor(resource.categoryId)}`}>
          {categoryName}
        </span>
        <button 
          onClick={handleExternalLinkClick}
          className="p-2 rounded-xl text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ResourceCenterViewCN;
