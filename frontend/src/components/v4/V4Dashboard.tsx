import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Wallet, 
  Newspaper, 
  Settings,
  Plus,
  HelpCircle,
  LogOut,
  Search,
  Bell
} from 'lucide-react';

// V4 Widgets
import MarketIndicesWidget from './widgets/MarketIndicesWidget';
import WatchlistWidget from './widgets/WatchlistWidget';
import CryptoWidget from './widgets/CryptoWidget';
import MarketNewsWidget from './widgets/MarketNewsWidget';
import WeatherWidget from '../v3/widgets/WeatherWidget';
import TodoWidget from '../v3/widgets/TodoWidget';

interface V4DashboardProps {
  onAddResource?: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'markets', label: 'Markets', icon: TrendingUp },
  { id: 'portfolio', label: 'Portfolio', icon: Wallet },
  { id: 'news', label: 'News', icon: Newspaper },
];

const V4Dashboard: React.FC<V4DashboardProps> = ({ onAddResource }) => {
  const [activeView, setActiveView] = useState('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  return (
    <div className="min-h-screen bg-[#0d0e10] text-white">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-[260px] bg-[#0d0e10] flex flex-col z-50 hidden lg:flex">
        {/* Logo */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#0d0e10]" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-emerald-400">Y-Nav V4.0</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest">Financial Intelligence</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-2 space-y-1">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                  isActive 
                    ? 'bg-[#242629] text-white shadow-lg shadow-black/20' 
                    : 'text-[#ababad] hover:text-white hover:bg-[#181a1c]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400 stroke-[2.5px]' : 'stroke-2'}`} />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Upgrade Card */}
        <div className="p-4 mx-4 mb-4 rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-500">
          <p className="text-xs font-semibold text-[#0d0e10] mb-2">Pro Access Active</p>
          <button className="w-full py-2 rounded-xl bg-[#0d0e10] text-emerald-400 text-xs font-semibold">
            Upgrade to Pro
          </button>
        </div>

        {/* Bottom Actions */}
        <div className="p-4">
          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[#ababad] hover:text-white hover:bg-[#181a1c] transition-all">
              <HelpCircle className="w-5 h-5 stroke-2" />
              <span className="font-medium text-sm">Support</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all">
              <LogOut className="w-5 h-5 stroke-2" />
              <span className="font-medium text-sm">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-[260px] min-h-screen pb-24 lg:pb-0">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#0d0e10]/95 backdrop-blur-xl px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Search */}
            <div className="flex items-center gap-3 flex-1 max-w-xl">
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#181a1c] border border-white/5 w-full">
                <Search className="w-4 h-4 text-slate-500" />
                <input 
                  type="text"
                  placeholder="Global Search: Indices, Stocks, or News..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              <button className="relative p-2 rounded-xl bg-[#181a1c] text-slate-400 hover:text-white">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500" />
              </button>
              <button className="p-2 rounded-xl bg-[#181a1c] text-slate-400 hover:text-white">
                <Settings className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 pl-4 border-l border-white/10">
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">Alex Chen</p>
                  <p className="text-xs text-emerald-400">Premium Member</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">A</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6">
          {/* Top Row: Weather + Market Pulse */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <WeatherWidget />
            <div className="lg:col-span-2">
              <MarketIndicesWidget />
            </div>
          </div>

          {/* Middle Row: Watchlist + Todo + News */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="space-y-6">
              <TodoWidget />
            </div>
            <WatchlistWidget />
            <MarketNewsWidget />
          </div>

          {/* Bottom Row: Crypto */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <CryptoWidget />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0d0e10]/95 backdrop-blur-xl px-4 py-3 border-b border-white/5">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-emerald-400">Y-Nav V4.0</span>
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-slate-400" />
            <Bell className="w-5 h-5 text-slate-400" />
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <span className="text-sm font-bold text-white">A</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Dock */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0d0e10] border-t border-white/5">
        <div className="flex items-center justify-around px-4 py-3 pb-safe">
          {[
            { id: 'home', label: 'HOME', icon: LayoutDashboard },
            { id: 'markets', label: 'MARKETS', icon: TrendingUp },
            { id: 'news', label: 'NEWS', icon: Newspaper },
            { id: 'me', label: 'ME', icon: Wallet },
          ].map((item) => {
            const isActive = activeView === item.id || (item.id === 'home' && activeView === 'dashboard');
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id === 'home' ? 'dashboard' : item.id)}
                className={`flex flex-col items-center justify-center min-w-[64px] py-2 rounded-2xl transition-all`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-1 ${
                  isActive ? 'bg-emerald-400 text-[#0d0e10]' : 'text-slate-500'
                }`}>
                  <Icon className="w-5 h-5" strokeWidth={2} />
                </div>
                <span className={`text-[10px] font-semibold tracking-wider ${isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default V4Dashboard;
