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
  Filter
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
}

const ResourceCenterViewCN: React.FC<ResourceCenterViewCNProps> = ({ 
  onAddResource,
  onImport 
}) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAIRecommend, setShowAIRecommend] = useState(false);

  // 过滤资源
  const filteredResources = useMemo(() => {
    let filtered = mockResources;
    
    // 按分类过滤
    if (activeCategory !== 'all') {
      filtered = filtered.filter(r => r.categoryId === activeCategory);
    }
    
    // 按搜索词过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query) ||
        r.url.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [activeCategory, searchQuery]);

  // AI推荐资源
  const aiRecommendations = useMemo(() => {
    return mockResources.slice(0, 4);
  }, []);

  const activeCategoryData = mockCategories.find(c => c.id === activeCategory);

  return (
    <div className="min-h-screen bg-[#0d0e10] text-white">
      <div className="flex h-screen">
        {/* 左侧分类栏 */}
        <aside className="w-64 bg-[#181a1c] border-r border-white/5 flex flex-col">
          <div className="p-5 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-[#0d0e10]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">资源中心</h2>
                <p className="text-xs text-slate-500">{mockResources.length} 个资源链接</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {mockCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeCategory === category.id
                    ? 'bg-emerald-500/15 text-emerald-400 border-l-2 border-emerald-400'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${category.color}`} />
                <span className="flex-1 text-left text-sm font-medium">{category.name}</span>
                <span className="text-xs text-slate-500 px-2 py-0.5 rounded-full bg-white/5">
                  {category.count}
                </span>
              </button>
            ))}
          </div>

          {/* AI推荐开关 */}
          <div className="p-4 border-t border-white/5">
            <button
              onClick={() => setShowAIRecommend(!showAIRecommend)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                showAIRecommend ? 'bg-amber-500/15 text-amber-400' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-medium">AI智能推荐</span>
            </button>
          </div>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* 顶部工具栏 */}
          <header className="px-6 py-4 border-b border-white/5 bg-[#0d0e10]/50 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              {/* 搜索框 */}
              <div className="flex-1 max-w-xl">
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#181a1c] border border-white/5">
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

              {/* 操作按钮 */}
              <div className="flex items-center gap-3">
                {/* 视图切换 */}
                <div className="flex items-center bg-[#181a1c] rounded-xl p-1">
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
                  <span className="text-sm">添加资源</span>
                </button>
              </div>
            </div>

            {/* 分类标题和统计 */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-white">
                  {activeCategoryData?.name || '全部资源'}
                </h1>
                <span className="px-2 py-1 rounded-full bg-white/10 text-xs text-slate-400">
                  {filteredResources.length} 个资源
                </span>
              </div>
              
              {searchQuery && (
                <p className="text-sm text-slate-500">
                  搜索 "{searchQuery}" 找到 {filteredResources.length} 个结果
                </p>
              )}
            </div>
          </header>

          {/* 资源列表 */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* AI推荐区 */}
            {showAIRecommend && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white">AI智能推荐</h3>
                  <span className="text-xs text-slate-500">根据您的使用习惯推荐</span>
                </div>
                <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                  {aiRecommendations.map((resource) => (
                    <ResourceCard 
                      key={`ai-${resource.id}`} 
                      resource={resource} 
                      viewMode={viewMode}
                      isAIRecommended
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 资源网格 */}
            <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
              {filteredResources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} viewMode={viewMode} />
              ))}
            </div>

            {/* 空状态 */}
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
        </main>
      </div>
    </div>
  );
};

// 资源卡片组件
interface ResourceCardProps {
  resource: Resource;
  viewMode: 'grid' | 'list';
  isAIRecommended?: boolean;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resource, viewMode, isAIRecommended }) => {
  const category = mockCategories.find(c => c.id === resource.categoryId);
  
  if (viewMode === 'list') {
    return (
      <div className={`flex items-center gap-4 p-4 rounded-2xl bg-[#181a1c] hover:bg-[#242629] transition-colors group ${isAIRecommended ? 'border border-amber-500/30' : ''}`}>
        <div className="w-12 h-12 rounded-xl bg-[#0d0e10] flex items-center justify-center shrink-0">
          {resource.favicon ? (
            <img src={resource.favicon} alt="" className="w-6 h-6 rounded" />
          ) : (
            <Link2 className="w-6 h-6 text-slate-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-base font-medium text-white truncate">{resource.title}</h4>
            {isAIRecommended && <Sparkles className="w-4 h-4 text-amber-400" />}
          </div>
          <p className="text-sm text-slate-500 truncate">{resource.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs ${category?.color.replace('bg-', 'bg-')?.replace('500', '500/20') || 'bg-slate-500/20'} ${category?.color.replace('bg-', 'text-') || 'text-slate-400'}`}>
            {category?.name}
          </span>
          <button className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all">
            <ExternalLink className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-2xl bg-[#181a1c] hover:bg-[#242629] transition-all group cursor-pointer ${isAIRecommended ? 'border border-amber-500/30' : ''}`}>
      {/* 头部 */}
      <div className="flex items-start justify-between mb-3">
        <div className="w-12 h-12 rounded-xl bg-[#0d0e10] flex items-center justify-center">
          {resource.favicon ? (
            <img src={resource.favicon} alt="" className="w-6 h-6 rounded" />
          ) : (
            <Link2 className="w-6 h-6 text-slate-500" />
          )}
        </div>
        <div className="flex items-center gap-1">
          {isAIRecommended && <Sparkles className="w-4 h-4 text-amber-400" />}
          <button className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 内容 */}
      <h4 className="text-base font-medium text-white mb-1 truncate">{resource.title}</h4>
      <p className="text-sm text-slate-500 mb-3 line-clamp-2">{resource.description}</p>

      {/* 底部 */}
      <div className="flex items-center justify-between">
        <span className={`px-2 py-1 rounded-full text-xs ${category?.color.replace('bg-', 'bg-')?.replace('500', '500/20') || 'bg-slate-500/20'} ${category?.color.replace('bg-', 'text-') || 'text-slate-400'}`}>
          {category?.name}
        </span>
        <button className="p-2 rounded-xl text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all">
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ResourceCenterViewCN;
