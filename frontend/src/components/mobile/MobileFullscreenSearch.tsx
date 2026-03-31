import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowLeft, Clock, TrendingUp, Sparkles } from 'lucide-react';
import { LinkItem } from '../../types';

interface MobileFullscreenSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
  recentSearches: string[];
  trendingSearches: string[];
  searchResults: LinkItem[];
  searchQuery: string;
  onResultClick: (link: LinkItem) => void;
  aiSuggestion?: string;
}

const MobileFullscreenSearch: React.FC<MobileFullscreenSearchProps> = ({
  isOpen,
  onClose,
  onSearch,
  recentSearches,
  trendingSearches,
  searchResults,
  searchQuery,
  onResultClick,
  aiSuggestion
}) => {
  const [query, setQuery] = useState(searchQuery);
  const [activeTab, setActiveTab] = useState<'all' | 'links' | 'notes'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== searchQuery) {
        onSearch(query);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, onSearch, searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const clearSearch = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col">
      {/* 搜索头部 */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
        <button 
          onClick={onClose}
          className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <form onSubmit={handleSubmit} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索链接、便签..."
              className="w-full pl-10 pr-10 py-2.5 bg-slate-800 text-white rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
            />
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* 标签页切换 */}
      {query && (
        <div className="flex px-4 py-2 gap-2 bg-slate-900 border-b border-slate-800">
          {['all', 'links', 'notes'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab === 'all' ? '全部' : tab === 'links' ? '链接' : '便签'}
            </button>
          ))}
        </div>
      )}

      {/* 搜索内容 */}
      <div className="flex-1 overflow-y-auto">
        {query ? (
          // 搜索结果
          <div className="p-4 space-y-3">
            {aiSuggestion && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-medium">AI 建议</span>
                </div>
                <p className="text-sm text-slate-300">{aiSuggestion}</p>
              </div>
            )}
            
            {searchResults.length > 0 ? (
              searchResults.map((link) => (
                <button
                  key={link.id}
                  onClick={() => onResultClick(link)}
                  className="w-full text-left p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 transition-colors"
                >
                  <h3 className="text-white font-medium mb-1">{link.title}</h3>
                  <p className="text-sm text-slate-400 truncate">{link.url}</p>
                </button>
              ))
            ) : (
              <div className="text-center py-12">
                <Search className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                <p className="text-slate-400">未找到相关结果</p>
              </div>
            )}
          </div>
        ) : (
          // 默认状态 - 最近搜索和热门
          <div className="p-4 space-y-6">
            {/* 最近搜索 */}
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-slate-400 mb-3">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">最近搜索</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term, idx) => (
                    <button
                      key={idx}
                      onClick={() => setQuery(term)}
                      className="px-3 py-1.5 rounded-full bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 热门搜索 */}
            {trendingSearches.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-slate-400 mb-3">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">热门搜索</span>
                </div>
                <div className="space-y-2">
                  {trendingSearches.map((term, idx) => (
                    <button
                      key={idx}
                      onClick={() => setQuery(term)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 text-left hover:bg-slate-800 transition-colors"
                    >
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                        idx < 3 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="text-slate-300">{term}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileFullscreenSearch;
