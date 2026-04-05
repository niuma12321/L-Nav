import React, { useState, useEffect, useCallback } from 'react';
import { Search, Bell, Command, ArrowRight, X } from '@/utils/icons';
import { LinkItem } from '../../types';

interface TopBarProps {
  onSearch: (query: string) => void;
  searchResults: LinkItem[];
  recentSearches: string[];
  onResultClick: (link: LinkItem) => void;
  unreadCount?: number;
  onNotificationClick?: () => void;
  onProfileClick?: () => void;
  siteTitle?: string;
  userName?: string;
}

const TopBar: React.FC<TopBarProps> = ({
  onSearch,
  searchResults,
  recentSearches,
  onResultClick,
  unreadCount = 0,
  onNotificationClick,
  onProfileClick,
  siteTitle = 'Dashboard',
  userName = 'Alex'
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcut: Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchSubmit = useCallback(() => {
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  }, [searchQuery, onSearch]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase();
  };

  return (
    <>
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-[#0d0e10]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left: Title & Greeting */}
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-white font-display">
              Good Evening, {userName}
            </h1>
            <p className="text-sm text-slate-400">
              Your workspace is optimized and ready for deep work.
            </p>
          </div>

          {/* Right: Search, Time, Notifications, Profile */}
          <div className="flex items-center gap-4">
            {/* Search Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="hidden md:flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#1e2127] border border-white/10 text-slate-400 hover:border-emerald-500/30 hover:text-slate-200 transition-all duration-200"
            >
              <Search className="w-4 h-4" />
              <span className="text-sm">Search Obsidian...</span>
              <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-800/50 px-1.5 py-0.5 rounded">
                <Command className="w-3 h-3" />
                <span>K</span>
              </div>
            </button>

            {/* Time Display */}
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-3xl font-bold text-emerald-400 font-display tabular-nums">
                {formatTime(currentTime)}
              </span>
              <span className="text-xs text-slate-500 font-medium tracking-wide">
                {formatDate(currentTime)}
              </span>
            </div>

            {/* Notification Bell */}
            <button
              onClick={onNotificationClick}
              className="relative p-2.5 rounded-xl bg-[#1e2127] border border-white/10 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all duration-200"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>

            {/* User Avatar */}
            <button
              onClick={onProfileClick}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 border-2 border-emerald-500/30 flex items-center justify-center overflow-hidden hover:border-emerald-500/60 transition-all duration-200"
            >
              <span className="text-sm font-semibold text-white">{userName[0]}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Full Screen Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] bg-[#0d0e10]/95 backdrop-blur-xl">
          <div className="max-w-2xl mx-auto pt-20 px-6">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                placeholder="Search resources, notes, or tools..."
                className="w-full pl-14 pr-14 py-4 bg-[#1e2127] border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 text-lg"
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="absolute right-5 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="mt-8">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                {['Go to Dashboard', 'View Analytics', 'Open Notes', 'Settings'].map((action, idx) => (
                  <button
                    key={idx}
                    className="flex items-center justify-between p-4 rounded-xl bg-[#1e2127]/50 border border-white/5 hover:border-emerald-500/30 hover:bg-[#1e2127] transition-all duration-200 group"
                  >
                    <span className="text-sm text-slate-300">{action}</span>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Recent</h3>
                <div className="space-y-2">
                  {recentSearches.map((term, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSearchQuery(term);
                        handleSearchSubmit();
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#1e2127] text-slate-400 hover:text-slate-200 transition-colors text-left"
                    >
                      <Search className="w-4 h-4" />
                      <span>{term}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default TopBar;
