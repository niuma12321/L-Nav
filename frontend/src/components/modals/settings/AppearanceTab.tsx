import React, { useMemo, useCallback } from 'react';
import { SiteSettings } from '../../../types';

interface AppearanceTabProps {
  settings: SiteSettings;
  onChange: (key: keyof SiteSettings, value: any) => void;
}

// ==============================================
// 常量配置（抽离优化，易于维护）
// ==============================================
const DEFAULT_ACCENT_COLOR = '99 102 241';
const THEME_COLORS = [
  { name: 'Indigo', value: '99 102 241', class: 'bg-indigo-500' },
  { name: 'Blue', value: '59 130 246', class: 'bg-blue-500' },
  { name: 'Purple', value: '168 85 247', class: 'bg-purple-500' },
  { name: 'Rose', value: '244 63 94', class: 'bg-rose-500' },
  { name: 'Orange', value: '249 115 22', class: 'bg-orange-500' },
  { name: 'Emerald', value: '16 185 129', class: 'bg-emerald-500' },
  { name: 'Gray', value: '100 116 139', class: 'bg-slate-500' },
];
const GRAY_SCALE_OPTIONS = [
  { id: 'zinc', label: '高级灰', desc: '纯净无色偏', colorClass: 'bg-zinc-500' },
  { id: 'slate', label: '青灰', desc: '经典冷色调', colorClass: 'bg-slate-500' },
  { id: 'neutral', label: '暖灰', desc: '柔和舒适', colorClass: 'bg-neutral-500' },
];

// ==============================================
// 工具函数（加固健壮性，纯函数无副作用）
// ==============================================
const parseRgbString = (value: string): number[] | null => {
  try {
    if (!value || typeof value !== 'string') return null;
    const parts = String(value ?? '').trim().split(/\s+/).map(Number);
    if (parts.length < 3 || parts.some(isNaN)) return null;
    return parts.slice(0, 3).map(v => Math.min(255, Math.max(0, Math.round(v))));
  } catch {
    return null;
  }
};

const rgbStringToHex = (value: string): string => {
  const rgb = parseRgbString(value) || parseRgbString(DEFAULT_ACCENT_COLOR)!;
  return `#${rgb.map(v => v.toString(16).padStart(2, '0')).join('')}`;
};

const hexToRgbString = (hex: string): string | null => {
  try {
    if (!hex || typeof hex !== 'string') return null;
    const normalized = String(hex.replace('#', '') ?? '').trim();
    const fullHex = normalized.length === 3
      ? normalized.split('').map(c => `${c}${c}`).join('')
      : normalized;

    if (fullHex.length !== 6) return null;

    const r = parseInt(fullHex.slice(0, 2), 16);
    const g = parseInt(fullHex.slice(2, 4), 16);
    const b = parseInt(fullHex.slice(4, 6), 16);

    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return `${r} ${g} ${b}`;
  } catch {
    return null;
  }
};

// ==============================================
// 核心组件（缓存优化）
// ==============================================
const AppearanceTab: React.FC<AppearanceTabProps> = React.memo(({ settings, onChange }) => {
  // ==============================================
  // 状态计算（useMemo 缓存，避免重复计算）
  // ==============================================
  const isBackgroundEnabled = useMemo(() => !!settings.backgroundImageEnabled, [settings.backgroundImageEnabled]);
  const isBackgroundMotionEnabled = useMemo(() => !!settings.backgroundMotion, [settings.backgroundMotion]);
  const accentHex = useMemo(() => rgbStringToHex(settings.accentColor || DEFAULT_ACCENT_COLOR), [settings.accentColor]);

  // ==============================================
  // 回调函数（useCallback 缓存，防止子组件重渲染）
  // ==============================================
  const handleAccentColorChange = useCallback((value: string) => {
    onChange('accentColor', value);
  }, [onChange]);

  const handleGrayScaleChange = useCallback((value: 'zinc' | 'slate' | 'neutral') => {
    onChange('grayScale', value);
  }, [onChange]);

  const handleToggleBackground = useCallback(() => {
    onChange('backgroundImageEnabled', !isBackgroundEnabled);
  }, [onChange, isBackgroundEnabled]);

  const handleToggleMotion = useCallback(() => {
    onChange('backgroundMotion', !isBackgroundMotionEnabled);
  }, [onChange, isBackgroundMotionEnabled]);

  const handleBackgroundImageChange = useCallback((value: string) => {
    onChange('backgroundImage', value);
  }, [onChange]);

  const handleClearBackground = useCallback(() => {
    onChange('backgroundImage', '');
  }, [onChange]);

  const handleCustomColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const rgb = hexToRgbString(e.target.value);
    if (rgb) handleAccentColorChange(rgb);
  }, [handleAccentColorChange]);

  // ==============================================
  // 渲染：主题色选项
  // ==============================================
  const renderColorOptions = useMemo(() => (
    THEME_COLORS.map(color => (
      <button
        key={color.value}
        onClick={() => handleAccentColorChange(color.value)}
        className={`h-10 rounded-full ${color.class} transition-all duration-300 relative group border border-slate-100 dark:border-slate-700 hover:scale-110`}
        title={color.name}
        aria-label={`选择${color.name}主题色`}
      >
        {settings.accentColor === color.value && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full shadow-sm bg-white animate-pulse" />
          </div>
        )}
      </button>
    ))
  ), [settings.accentColor, handleAccentColorChange]);

  // ==============================================
  // 渲染：灰度风格选项
  // ==============================================
  const renderGrayScaleOptions = useMemo(() => (
    GRAY_SCALE_OPTIONS.map(option => (
      <button
        key={option.id}
        onClick={() => handleGrayScaleChange(option.id as any)}
        className={`p-3 rounded-xl border transition-all duration-200 hover:shadow-sm ${
          settings.grayScale === option.id
            ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-400 dark:border-zinc-500 ring-2 ring-zinc-500/20 scale-[1.02]'
            : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        aria-label={`选择${option.label}背景风格`}
      >
        <div className={`w-full h-12 rounded-lg ${option.colorClass} mb-2 shadow-sm`}></div>
        <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{option.label}</div>
        <div className="text-[10px] text-zinc-500 dark:text-zinc-500 mt-0.5">{option.desc}</div>
      </button>
    ))
  ), [settings.grayScale, handleGrayScaleChange]);

  // ==============================================
  // 自定义开关组件（抽离复用）
  // ==============================================
  const ToggleSwitch = useCallback(({
    checked,
    onChange,
    label
  }: {
    checked: boolean;
    onChange: () => void;
    label: string;
  }) => (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
        checked ? 'bg-accent' : 'bg-slate-300 dark:bg-slate-600'
      }`}
      aria-pressed={checked}
      aria-label={label}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
          checked ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </button>
  ), []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* ==============================================
        主题色调设置
      ============================================== */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">主题色调 (Theme Color)</h3>
        <div className="grid grid-cols-6 gap-3">
          {renderColorOptions}
        </div>
        <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <input
            type="color"
            value={accentHex}
            onChange={handleCustomColorChange}
            className="h-9 w-12 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800 cursor-pointer transition-all hover:scale-105"
            title="自定义颜色"
            aria-label="自定义主题颜色"
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">自定义颜色</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">实时预览</span>
          </div>
        </div>
      </section>

      <div className="h-px bg-slate-100 dark:bg-slate-800" />

      {/* ==============================================
        背景风格设置
      ============================================== */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">背景风格 (Background)</h3>
        <div className="grid grid-cols-3 gap-3">
          {renderGrayScaleOptions}
        </div>
      </section>

      <div className="h-px bg-slate-100 dark:bg-slate-800" />

      {/* ==============================================
        自定义背景设置
      ============================================== */}
      <section className="space-y-3">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">自定义背景</h3>
        
        {/* 背景开关 */}
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <div>
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">启用背景图</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">支持 URL / Base64 格式</div>
          </div>
          <ToggleSwitch
            checked={isBackgroundEnabled}
            onChange={handleToggleBackground}
            label="启用背景图"
          />
        </div>

        {/* 背景图输入框 */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={settings.backgroundImage || ''}
            onChange={(e) => handleBackgroundImageChange(e.target.value)}
            placeholder="https://example.com/background.jpg"
            disabled={!isBackgroundEnabled}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm border transition-all ${
              isBackgroundEnabled
                ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed opacity-70'
            }`}
          />
          <button
            type="button"
            onClick={handleClearBackground}
            disabled={!isBackgroundEnabled || !settings.backgroundImage}
            className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors border ${
              !isBackgroundEnabled || !settings.backgroundImage
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-70'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            清空
          </button>
        </div>

        {/* 背景图预览 */}
        {isBackgroundEnabled && settings.backgroundImage && (
          <div className="mt-2 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/30">
            <div className="text-xs text-slate-500 mb-2">预览</div>
            <div 
              className="w-full h-16 rounded-lg bg-cover bg-center" 
              style={{ backgroundImage: `url(${settings.backgroundImage})` }}
            />
          </div>
        )}
      </section>

      <div className="h-px bg-slate-100 dark:bg-slate-800" />

      {/* ==============================================
        高光动态设置
      ============================================== */}
      <section className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
        <div>
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">高光动态效果</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">轻微流动，提升页面层次感</div>
        </div>
        <ToggleSwitch
          checked={isBackgroundMotionEnabled}
          onChange={handleToggleMotion}
          label="启用高光动态"
        />
      </section>
    </div>
  );
});

export default AppearanceTab;
