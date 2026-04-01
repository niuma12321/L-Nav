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
  Globe
} from 'lucide-react';

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

interface ResourceCenterViewCNProps {
  onAddResource?: () => void;
  onImport?: () => void;
  onPreviewLink?: (url: string) => void;
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
    createdAt?: number;
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
  onEditLink,
  onDeleteLink,
  links = [],
  categories = []
}) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

  // 将真实的 links 数据转换为 Resource 格式
  const resources = useMemo(() => {
    if (links.length > 0) {
      return links.map(link => {
        // 改进 favicon 获取逻辑
        let favicon = link.favicon;
        if (!favicon || favicon.includes('faviconextractor')) {
          // 提取域名
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
        return {
          id: link.id,
          title: link.title,
          url: link.url,
          description: link.description || '',
          categoryId: link.categoryId || 'uncategorized',
          favicon: favicon || '',
          createdAt: link.createdAt || Date.now()
        };
      });
    }
    // 如果没有真实数据，使用 mock 数据
    return mockResources;
  }, [links]);

  // 构建分类数据
  const categoryList = useMemo(() => {
    if (categories.length > 0) {
      const allCategory = { id: 'all', name: '全部资源', icon: '⊞', count: links.length, color: 'bg-emerald-500' };
      const mappedCategories = categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon || '📁',
        count: links.filter(l => l.categoryId === cat.id).length,
        color: 'bg-blue-500'
      }));
      return [allCategory, ...mappedCategories];
    }
    return mockCategories;
  }, [categories, links]);

  // 过滤资源
  const filteredResources = useMemo(() => {
    let filtered = resources;
    
    if (activeCategory !== 'all') {
      filtered = filtered.filter(r => r.categoryId === activeCategory);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query) ||
        r.url.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [activeCategory, searchQuery, resources]);

  const activeCategoryData = categoryList.find(c => c.id === activeCategory);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">数字资源中心</h1>
          <p className="text-sm text-slate-400">
            高效整理您的数字化资产，从开发工具到灵感采集，一站式管理您的工作流。
          </p>
        </div>
        <div className="flex items-center gap-3">
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
            <span className="text-sm">添加新链接</span>
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

      {/* Resources Grid */}
      <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
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
      window.open(url, '_blank');
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
          {resource.favicon ? (
            <img src={resource.favicon} alt="" className="w-6 h-6 rounded" />
          ) : (
            <Link2 className="w-6 h-6 text-slate-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-medium text-white truncate">{resource.title}</h4>
          <p className="text-sm text-slate-500 truncate">{resource.description}</p>
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
          {resource.favicon ? (
            <img src={resource.favicon} alt="" className="w-6 h-6 rounded" />
          ) : (
            <Link2 className="w-6 h-6 text-slate-500" />
          )}
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
      <h4 className="text-base font-bold text-white mb-1 truncate">{resource.title}</h4>
      <p className="text-sm text-slate-500 mb-4 line-clamp-2">{resource.description}</p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400">
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
