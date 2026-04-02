import React from 'react';
import { Moon, Sun, Monitor, X } from 'lucide-react';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeToggleProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: ThemeMode;
  onModeChange: (mode: ThemeMode) => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
  isOpen,
  onClose,
  currentMode,
  onModeChange
}) => {
  const modes: { id: ThemeMode; name: string; description: string; icon: typeof Sun }[] = [
    {
      id: 'light',
      name: '浅色模式',
      description: '明亮的界面，适合白天使用',
      icon: Sun
    },
    {
      id: 'dark',
      name: '深色模式',
      description: '翡翠黑曜石主题，护眼省电',
      icon: Moon
    },
    {
      id: 'system',
      name: '跟随系统',
      description: '自动匹配系统设置',
      icon: Monitor
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#181a1c] rounded-3xl overflow-hidden shadow-2xl border border-white/5">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">外观设置</h2>
            <p className="text-sm text-slate-400">选择你喜欢的主题模式</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Theme Options */}
        <div className="p-6 space-y-3">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const isActive = currentMode === mode.id;
            
            return (
              <button
                key={mode.id}
                onClick={() => {
                  onModeChange(mode.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
                  isActive
                    ? 'bg-emerald-500/10 border border-emerald-500/30'
                    : 'bg-white/5 hover:bg-white/10 border border-transparent'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isActive ? 'bg-emerald-500/20' : 'bg-white/5'
                }`}>
                  <Icon className={`w-6 h-6 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                </div>
                <div className="flex-1 text-left">
                  <h3 className={`font-medium ${isActive ? 'text-emerald-100' : 'text-white'}`}>
                    {mode.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{mode.description}</p>
                </div>
                {isActive && (
                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="px-6 py-4 bg-white/5 border-t border-white/5">
          <p className="text-xs text-slate-500 text-center">
            深色模式采用「翡翠黑曜石」设计语言，提供沉浸式体验
          </p>
        </div>
      </div>
    </div>
  );
};

export default ThemeToggle;
