import React, { useState, useEffect, useCallback } from 'react';
import { Command, Search, X, ArrowRight, Clock, TrendingUp } from 'lucide-react';
import { LinkItem } from '../../types';

interface GlobalCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  links: LinkItem[];
  onNavigate: (url: string) => void;
  onSearch: (query: string, engine?: string) => void;
}

const searchEngines = [
  { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=' },
  { id: 'baidu', name: '百度', url: 'https://www.baidu.com/s?wd=' },
  { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q=' },
  { id: 'duckduckgo', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
];

const GlobalCommandPalette: React.FC<GlobalCommandPaletteProps> = ({
  isOpen,
  onClose,
  links,
  onNavigate,
  onSearch
}) => {
  const [query, setQuery] = useState('');
  const [selectedEngine, setSelectedEngine] = useState('google');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('ynav:recentSearches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored).slice(0, 5));
      } catch {}
    }
  }, []);

  // Filter links based on query
  const filteredLinks = query.trim()
    ? links.filter(link =>
        link.title.toLowerCase().includes(query.toLowerCase()) ||
        link.url.toLowerCase().includes(query.toLowerCase()) ||
        (link.description && link.description.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, 5)
    : [];

  const suggestions = query.trim()
    ? [
        { type: 'search', title: `搜索 "${query}"`, engine: selectedEngine },
        ...filteredLinks.map(link => ({ type: 'link', ...link })),
      ]
    : recentSearches.map((term, i) => ({ type: 'recent', title: term, id: `recent-${i}` }));

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!isOpen) {
          setQuery('');
          setSelectedIndex(0);
        }
      }

      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
      }

      if (e.key === 'Enter' && suggestions[selectedIndex]) {
        e.preventDefault();
        const item = suggestions[selectedIndex];
        if (item.type === 'link') {
          onNavigate((item as LinkItem).url);
          onClose();
        } else if (item.type === 'search') {
          handleSearch(query);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, suggestions, selectedIndex, query, onClose, onNavigate]);

  const handleSearch = (searchQuery: string) => {
    const engine = searchEngines.find(e => e.id === selectedEngine);
    if (engine) {
      onSearch(searchQuery, engine.id);
      // Save to recent searches
      const newRecent = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 10);
      setRecentSearches(newRecent);
      localStorage.setItem('ynav:recentSearches', JSON.stringify(newRecent));
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Command Palette */}
      <div className="relative w-full max-w-2xl mx-4 bg-[#181a1c] rounded-3xl shadow-2xl overflow-hidden border border-white/5">
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-white/5">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="搜索资源、链接或输入关键词..."
            className="flex-1 bg-transparent text-white text-lg placeholder-slate-500 outline-none"
            autoFocus
          />
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5">
              <Command className="w-3 h-3 text-slate-400" />
              <span className="text-xs text-slate-400">K</span>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Engine Selector */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-white/5 overflow-x-auto scrollbar-hide">
          <span className="text-xs text-slate-500 uppercase tracking-wider mr-2">搜索引擎</span>
          {searchEngines.map((engine) => (
            <button
              key={engine.id}
              onClick={() => setSelectedEngine(engine.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedEngine === engine.id
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {engine.name}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto">
          {suggestions.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-500">
              <p>开始输入以搜索</p>
            </div>
          ) : (
            <div className="py-2">
              {suggestions.map((item, index) => (
                <button
                  key={item.type === 'link' ? (item as LinkItem).id : item.type === 'recent' ? item.id : 'search'}
                  onClick={() => {
                    if (item.type === 'link') {
                      onNavigate((item as LinkItem).url);
                      onClose();
                    } else {
                      handleSearch(item.type === 'recent' ? item.title : query);
                    }
                  }}
                  className={`w-full flex items-center gap-4 px-6 py-3 text-left transition-all ${
                    selectedIndex === index
                      ? 'bg-emerald-500/10 border-l-2 border-emerald-500'
                      : 'hover:bg-white/5'
                  }`}
                >
                  {item.type === 'search' && <Search className="w-4 h-4 text-emerald-400" />}
                  {item.type === 'recent' && <Clock className="w-4 h-4 text-slate-400" />}
                  {item.type === 'link' && (
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs"
                      style={{ backgroundColor: (item as LinkItem).iconColor || '#64748b' }}
                    >
                      {(item as LinkItem).title.charAt(0)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className={`truncate ${selectedIndex === index ? 'text-emerald-100' : 'text-white'}`}>
                      {item.title}
                    </p>
                    {item.type === 'link' && (
                      <p className="text-xs text-slate-500 truncate">{(item as LinkItem).url}</p>
                    )}
                  </div>

                  {selectedIndex === index && <ArrowRight className="w-4 h-4 text-emerald-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 bg-white/5 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10">↑↓</kbd>
              <span>导航</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10">↵</kbd>
              <span>选择</span>
            </span>
          </div>
          <span>{filteredLinks.length} 个结果</span>
        </div>
      </div>
    </div>
  );
};

export default GlobalCommandPalette;
