import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Rss, 
  Plus, 
  Trash2, 
  RefreshCw, 
  ExternalLink, 
  Clock, 
  Globe,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  Loader2,
  Upload,
  FileText,
  Cloud
} from 'lucide-react';
import { useRSSSync, RSSSource, RSSItem, DEFAULT_RSS_SOURCES } from '../../hooks/useRSSSync';

// RSS 代理 API 端点
const RSS_PROXY_API = '/api/v1/rss';

const RSSReaderViewCN: React.FC = () => {
  // 使用云端同步 Hook
  const { 
    sources, 
    items, 
    updateSources, 
    updateItems, 
    markItemRead,
    isLoading: isSyncLoading,
    isSyncing,
    forceSync 
  } = useRSSSync();

  // 加载状态
  const [loading, setLoading] = useState(false);
  const [loadingSourceId, setLoadingSourceId] = useState<string | null>(null);

  // 添加源弹窗
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newSourceTitle, setNewSourceTitle] = useState('');
  const [addError, setAddError] = useState('');
  const [addMode, setAddMode] = useState<'manual' | 'opml'>('manual');
  const [opmlImporting, setOpmlImporting] = useState(false);
  const [opmlStats, setOpmlStats] = useState<{total: number; success: number; failed: number} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 搜索
  const [searchQuery, setSearchQuery] = useState('');

  // 展开/折叠源
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());

  // 保存 RSS 源
  const saveSources = useCallback((newSources: RSSSource[]) => {
    updateSources(newSources);
  }, [updateSources]);

  // 保存 RSS 条目
  const saveItems = useCallback((newItems: RSSItem[]) => {
    updateItems(newItems);
  }, [updateItems]);

  // 解析 RSS XML
  const parseRSS = (xmlText: string, sourceId: string, sourceTitle: string): RSSItem[] => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    // 检查解析错误
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      throw new Error('XML 解析失败');
    }

    const items: RSSItem[] = [];
    const entries = xmlDoc.querySelectorAll('item, entry');
    
    entries.forEach((entry, index) => {
      const title = entry.querySelector('title')?.textContent || '无标题';
      const link = entry.querySelector('link')?.textContent || 
                   entry.querySelector('link')?.getAttribute('href') || '';
      const description = entry.querySelector('description, summary, content')?.textContent || '';
      const pubDate = entry.querySelector('pubDate, published, updated')?.textContent || '';
      const author = entry.querySelector('author, creator')?.textContent || '';
      
      items.push({
        id: `${sourceId}-${index}-${Date.now()}`,
        title: title.trim(),
        link: link.trim(),
        description: description.trim().substring(0, 500),
        pubDate,
        author: author.trim(),
        sourceId,
        sourceTitle
      });
    });

    return items;
  };

  // 获取单个 RSS 源
  const fetchRSSSource = async (source: RSSSource) => {
    setLoadingSourceId(source.id);
    try {
      const response = await fetch(`${RSS_PROXY_API}?url=${encodeURIComponent(source.url)}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const xmlText = await response.text();
      const newItems = parseRSS(xmlText, source.id, source.title);
      
      // 更新源的元数据
      const updatedSource = {
        ...source,
        lastFetched: Date.now(),
        error: undefined
      };
      
      const newSources = sources.map(s => s.id === source.id ? updatedSource : s);
      saveSources(newSources);
      
      // 合并新条目，避免重复
      const existingItemLinks = new Set(items.map(i => i.link));
      const uniqueNewItems = newItems.filter(item => !existingItemLinks.has(item.link));
      
      if (uniqueNewItems.length > 0) {
        const allItems = [...uniqueNewItems, ...items].slice(0, 200); // 最多保留200条
        saveItems(allItems);
      }
      
      return newItems.length;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '获取失败';
      const updatedSource = {
        ...source,
        lastFetched: Date.now(),
        error: errorMsg
      };
      const newSources = sources.map(s => s.id === source.id ? updatedSource : s);
      saveSources(newSources);
      throw error;
    } finally {
      setLoadingSourceId(null);
    }
  };

  // 获取所有 RSS 源
  const fetchAllSources = async () => {
    setLoading(true);
    let successCount = 0;
    
    for (const source of sources) {
      try {
        const count = await fetchRSSSource(source);
        successCount += count;
        // 延迟避免请求过快
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch {
        // 继续处理下一个
      }
    }
    
    setLoading(false);
    return successCount;
  };

  // 解析 OPML 文件
  const parseOPML = (xmlText: string): Array<{title: string; url: string}> => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    // 检查解析错误
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      throw new Error('OPML 文件解析失败');
    }

    const feeds: Array<{title: string; url: string}> = [];
    const outlines = xmlDoc.querySelectorAll('outline[type="rss"], outline[xmlUrl]');
    
    outlines.forEach((outline) => {
      const title = outline.getAttribute('title') || 
                   outline.getAttribute('text') || 
                   '未命名源';
      const url = outline.getAttribute('xmlUrl') || 
                 outline.getAttribute('url');
      
      if (url) {
        feeds.push({ title, url });
      }
    });

    return feeds;
  };

  // 处理 OPML 文件导入 - 一键立即导入，不逐个验证
  const handleOPMLImport = async (file: File) => {
    setOpmlImporting(true);
    setAddError('');
    setOpmlStats(null);

    try {
      const text = await file.text();
      const feeds = parseOPML(text);

      if (feeds.length === 0) {
        throw new Error('未找到有效的 RSS 订阅源，请检查 OPML 文件格式');
      }

      let successCount = 0;
      let failedCount = 0;
      let skippedCount = 0;
      const newSources: RSSSource[] = [];

      for (const feed of feeds) {
        // 检查是否已存在
        const exists = sources.some(s => s.url === feed.url);
        if (exists) {
          skippedCount++;
          continue;
        }

        // 直接添加，不等待网络验证
        const newSource: RSSSource = {
          id: `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: feed.title,
          url: feed.url,
          addedAt: Date.now(),
          lastFetched: Date.now()
        };

        newSources.push(newSource);
        successCount++;
      }

      if (newSources.length > 0) {
        const allSources = [...newSources, ...sources];
        saveSources(allSources);
      }

      setOpmlStats({ 
        total: feeds.length, 
        success: successCount, 
        failed: failedCount,
        skipped: skippedCount 
      });
      
      // 立即关闭弹窗
      if (successCount > 0) {
        setTimeout(() => {
          setShowAddModal(false);
          setAddMode('manual');
          setOpmlStats(null);
          // 后台异步获取文章
          fetchAllSources();
        }, 500);
      }
    } catch (error) {
      setAddError(error instanceof Error ? error.message : '导入失败');
    } finally {
      setOpmlImporting(false);
    }
  };

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleOPMLImport(file);
  };

  // 添加新 RSS 源
  const addSource = async () => {
    if (!newSourceUrl.trim()) {
      setAddError('请输入 RSS 地址');
      return;
    }

    setAddError('');
    setLoading(true);

    try {
      // 尝试获取 RSS 验证
      const response = await fetch(`${RSS_PROXY_API}?url=${encodeURIComponent(newSourceUrl)}`);
      if (!response.ok) {
        throw new Error('无法获取 RSS 源，请检查地址是否正确');
      }

      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      
      // 提取标题
      const channelTitle = xmlDoc.querySelector('channel > title, feed > title')?.textContent || 
                          newSourceTitle || 
                          '未命名源';

      const newSource: RSSSource = {
        id: `source-${Date.now()}`,
        title: newSourceTitle.trim() || channelTitle,
        url: newSourceUrl.trim(),
        addedAt: Date.now(),
        lastFetched: Date.now()
      };

      const newSources = [...sources, newSource];
      saveSources(newSources);

      // 解析并添加条目
      const newItems = parseRSS(xmlText, newSource.id, newSource.title);
      const allItems = [...newItems, ...items].slice(0, 200);
      saveItems(allItems);

      // 重置表单
      setNewSourceUrl('');
      setNewSourceTitle('');
      setShowAddModal(false);
    } catch (error) {
      setAddError(error instanceof Error ? error.message : '添加失败');
    } finally {
      setLoading(false);
    }
  };

  // 删除 RSS 源
  const deleteSource = (sourceId: string) => {
    const newSources = sources.filter(s => s.id !== sourceId);
    saveSources(newSources);
    
    // 同时删除相关条目
    const newItems = items.filter(i => i.sourceId !== sourceId);
    saveItems(newItems);
  };

  // 切换源展开状态
  const toggleSourceExpand = (sourceId: string) => {
    const newExpanded = new Set(expandedSources);
    if (newExpanded.has(sourceId)) {
      newExpanded.delete(sourceId);
    } else {
      newExpanded.add(sourceId);
    }
    setExpandedSources(newExpanded);
  };

  // 格式化日期
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      
      // 小于1小时
      if (diff < 3600000) {
        const mins = Math.floor(diff / 60000);
        return mins < 1 ? '刚刚' : `${mins}分钟前`;
      }
      // 小于24小时
      if (diff < 86400000) {
        return `${Math.floor(diff / 3600000)}小时前`;
      }
      // 小于7天
      if (diff < 604800000) {
        return `${Math.floor(diff / 86400000)}天前`;
      }
      
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // 过滤条目
  const filteredItems = items.filter(item => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return item.title.toLowerCase().includes(query) || 
           item.description?.toLowerCase().includes(query) ||
           item.sourceTitle.toLowerCase().includes(query);
  });

  // 按源分组条目
  const itemsBySource = filteredItems.reduce((acc, item) => {
    if (!acc[item.sourceId]) {
      acc[item.sourceId] = [];
    }
    acc[item.sourceId].push(item);
    return acc;
  }, {} as Record<string, RSSItem[]>);

  // 初始化时获取所有源
  useEffect(() => {
    if (sources.length > 0 && items.length === 0) {
      fetchAllSources();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 每30分钟自动刷新
  useEffect(() => {
    const timer = setInterval(() => {
      fetchAllSources();
    }, 30 * 60 * 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sources]);

  return (
    <div className="h-full flex flex-col">
      {/* 头部工具栏 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-orange-500/10">
            <Rss className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">RSS 阅读器</h2>
            <p className="text-xs text-slate-400">
              {sources.length} 个订阅源 · {items.length} 篇文章
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* 搜索框 */}
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索文章..."
              className="w-full sm:w-48 pl-9 pr-8 py-2 text-sm bg-[#181a1c] rounded-xl border border-white/10 focus:border-orange-500/50 focus:outline-none placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/5"
              >
                <X className="w-3 h-3 text-slate-500" />
              </button>
            )}
          </div>

          {/* 刷新按钮 */}
          <button
            onClick={fetchAllSources}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#181a1c] border border-white/10 text-slate-300 hover:text-white hover:border-orange-500/50 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm hidden sm:inline">刷新</span>
          </button>

          {/* 同步按钮 */}
          <button
            onClick={forceSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#181a1c] border border-white/10 text-slate-300 hover:text-white hover:border-blue-500/50 transition-all disabled:opacity-50"
            title="同步到云端"
          >
            <Cloud className={`w-4 h-4 ${isSyncing ? 'animate-pulse' : ''}`} />
            <span className="text-sm hidden sm:inline">{isSyncing ? '同步中...' : '同步'}</span>
          </button>

          {/* 添加按钮 */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-[#0d0e10] hover:bg-orange-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">添加源</span>
          </button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
        {/* 左侧：源列表 */}
        <div className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-3 overflow-y-auto">
          <h3 className="text-sm font-medium text-slate-400 px-1">订阅源</h3>
          
          {sources.map(source => (
            <div
              key={source.id}
              className={`p-3 rounded-xl border transition-all cursor-pointer group ${
                expandedSources.has(source.id)
                  ? 'bg-orange-500/10 border-orange-500/30'
                  : 'bg-[#181a1c] border-white/5 hover:border-white/10'
              }`}
              onClick={() => toggleSourceExpand(source.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-400" />
                    <h4 className="text-sm font-medium text-white truncate">
                      {source.title}
                    </h4>
                  </div>
                  {source.description && (
                    <p className="text-xs text-slate-500 mt-1 truncate">
                      {source.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-slate-500">
                      {itemsBySource[source.id]?.length || 0} 篇
                    </span>
                    {source.lastFetched && (
                      <span className="text-xs text-slate-600">
                        · {formatDate(new Date(source.lastFetched).toISOString())}更新
                      </span>
                    )}
                  </div>
                  {source.error && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3 text-red-400" />
                      <span className="text-xs text-red-400">{source.error}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  {loadingSourceId === source.id ? (
                    <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        fetchRSSSource(source);
                      }}
                      className="p-1.5 rounded hover:bg-white/5 text-slate-400 hover:text-orange-400 transition-colors"
                      title="刷新"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSource(source.id);
                    }}
                    className="p-1.5 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    title="删除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  {expandedSources.has(source.id) ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* 展开的文章列表 */}
              {expandedSources.has(source.id) && itemsBySource[source.id] && (
                <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
                  {itemsBySource[source.id].slice(0, 5).map(item => (
                    <a
                      key={item.id}
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="block p-2 rounded-lg bg-[#0d0e10] hover:bg-[#1a1c1f] transition-colors group/item"
                    >
                      <p className="text-xs text-slate-300 line-clamp-2 group-hover/item:text-orange-400">
                        {item.title}
                      </p>
                      <span className="text-[10px] text-slate-500 mt-1">
                        {formatDate(item.pubDate)}
                      </span>
                    </a>
                  ))}
                  {itemsBySource[source.id].length > 5 && (
                    <p className="text-xs text-slate-500 text-center py-1">
                      还有 {itemsBySource[source.id].length - 5} 篇...
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}

          {sources.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Rss className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">暂无订阅源</p>
              <p className="text-xs mt-1">点击上方按钮添加</p>
            </div>
          )}
        </div>

        {/* 右侧：文章列表 */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-3">
            {filteredItems.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                {searchQuery ? (
                  <>
                    <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">没有找到匹配的文章</p>
                  </>
                ) : (
                  <>
                    <Rss className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">暂无文章</p>
                    <p className="text-xs mt-1">点击刷新或添加订阅源</p>
                  </>
                )}
              </div>
            ) : (
              filteredItems.map(item => (
                <article
                  key={item.id}
                  className="p-4 rounded-xl bg-[#181a1c] border border-white/5 hover:border-orange-500/30 transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-orange-400">
                          {item.sourceTitle}
                        </span>
                        <span className="text-xs text-slate-500">·</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(item.pubDate)}
                        </span>
                        {item.author && (
                          <>
                            <span className="text-xs text-slate-500">·</span>
                            <span className="text-xs text-slate-500">{item.author}</span>
                          </>
                        )}
                      </div>
                      
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block group/link"
                      >
                        <h3 className="text-base font-medium text-white group-hover/link:text-orange-400 transition-colors line-clamp-2">
                          {item.title}
                        </h3>
                      </a>
                      
                      {item.description && (
                        <p className="text-sm text-slate-400 mt-2 line-clamp-3">
                          {item.description.replace(/<[^>]*>/g, '')}
                        </p>
                      )}
                    </div>
                    
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 p-2 rounded-lg bg-[#0d0e10] text-slate-400 hover:text-orange-400 hover:bg-orange-500/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 添加源弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#181a1c] rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">添加 RSS 源</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setAddError('');
                  setNewSourceUrl('');
                  setNewSourceTitle('');
                }}
                className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setAddMode('manual')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    addMode === 'manual' 
                      ? 'bg-orange-500 text-[#0d0e10]' 
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  手动添加
                </button>
                <button
                  onClick={() => setAddMode('opml')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    addMode === 'opml' 
                      ? 'bg-orange-500 text-[#0d0e10]' 
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  OPML 导入
                </button>
              </div>

              {addMode === 'manual' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      RSS 地址 <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="url"
                      value={newSourceUrl}
                      onChange={(e) => setNewSourceUrl(e.target.value)}
                      placeholder="https://example.com/feed.xml"
                      className="w-full px-4 py-3 bg-[#0d0e10] rounded-xl border border-white/10 focus:border-orange-500/50 focus:outline-none text-white placeholder:text-slate-500"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      支持 RSS 2.0、Atom 格式
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      显示名称 <span className="text-slate-500">(可选)</span>
                    </label>
                    <input
                      type="text"
                      value={newSourceTitle}
                      onChange={(e) => setNewSourceTitle(e.target.value)}
                      placeholder="自动获取"
                      className="w-full px-4 py-3 bg-[#0d0e10] rounded-xl border border-white/10 focus:border-orange-500/50 focus:outline-none text-white placeholder:text-slate-500"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-orange-500/50 transition-colors"
                  >
                    <Upload className="w-10 h-10 mx-auto mb-3 text-slate-400" />
                    <p className="text-sm font-medium text-slate-300 mb-1">
                      点击选择 OPML 文件
                    </p>
                    <p className="text-xs text-slate-500">
                      支持 .opml、.xml 格式的订阅源列表
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".opml,.xml,text/xml"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  {opmlImporting && (
                    <div className="flex items-center justify-center gap-2 py-4">
                      <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
                      <span className="text-sm text-slate-300">正在导入订阅源...</span>
                    </div>
                  )}
                  
                  {opmlStats && (
                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-medium text-green-400">导入完成</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        总计: {opmlStats.total} | 成功: {opmlStats.success} | 跳过: {opmlStats.skipped || 0} | 失败: {opmlStats.failed}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {addError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-red-400">{addError}</span>
                </div>
              )}

              {addMode === 'manual' && (
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setAddError('');
                      setNewSourceUrl('');
                      setNewSourceTitle('');
                    }}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={addSource}
                    disabled={loading || !newSourceUrl.trim()}
                    className="flex-1 px-4 py-3 rounded-xl bg-orange-500 text-[#0d0e10] font-medium hover:bg-orange-400 transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        添加中...
                      </span>
                    ) : (
                      '添加'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RSSReaderViewCN;
