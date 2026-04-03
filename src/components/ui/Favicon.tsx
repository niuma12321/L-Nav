import React, { useState, useMemo } from 'react';
import Icon from './Icon';
import { FAVICON_CACHE_KEY } from '../../utils/constants';

interface FaviconProps {
  /** 目标域名/URL */
  url?: string;
  /** 自定义图标（emoji 或图片 URL） */
  icon?: string;
  /** 图标大小 */
  size?: number;
  /** 自定义类名 */
  className?: string;
  /** 强制跳过远程获取，直接用兜底图标 */
  forceFallback?: boolean;
}

// ==================== 配置 ====================
// 更稳定的 Favicon 源（优先级从高到低）
const FAVICON_SOURCES = [
  (host: string) => `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${host}&size=64`,
  (host: string) => `https://favicon.im/${host}?size=64`,
  (host: string) => `https://www.google.com/s2/favicons?domain=${host}&sz=64`,
];

// 内网/本地域名特征（匹配到直接跳过远程请求）
const INTERNAL_DOMAIN_KEYWORDS = [
  'nas.', 'local.', 'home.', 'lan.', 'intranet.',
  '192.168.', '10.', '127.0.0.', '::1',
  'pansou.', 'fnys.', 'saver.', 'kvconfig.', 'note.'
];

// 缓存工具
const faviconCache = {
  get: (host: string): string | null => {
    try {
      const cache = JSON.parse(localStorage.getItem(FAVICON_CACHE_KEY) || '{}');
      return cache[host] || null;
    } catch {
      return null;
    }
  },
  set: (host: string, faviconUrl: string) => {
    try {
      const cache = JSON.parse(localStorage.getItem(FAVICON_CACHE_KEY) || '{}');
      cache[host] = faviconUrl;
      localStorage.setItem(FAVICON_CACHE_KEY, JSON.stringify(cache));
    } catch {}
  },
};

// ==================== 核心组件 ====================
const Favicon: React.FC<FaviconProps> = ({
  url,
  icon,
  size = 20,
  className = '',
  forceFallback = false,
}) => {
  const [errorCount, setErrorCount] = useState(0);

  // 如果有自定义图标（emoji 或图片 URL），优先显示
  if (icon) {
    // 如果是图片 URL
    if (icon.startsWith('http') || icon.startsWith('data:')) {
      return (
        <img
          src={icon}
          alt="icon"
          width={size}
          height={size}
          className={`rounded object-contain ${className}`}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      );
    }
    // 如果是 emoji（短字符串）
    if (icon.length <= 4) {
      return (
        <span
          className={`inline-flex items-center justify-center ${className}`}
          style={{ fontSize: size, lineHeight: 1 }}
        >
          {icon}
        </span>
      );
    }
  }

  // 解析纯净域名
  const { host, isInternal } = useMemo(() => {
    if (!url) return { host: '', isInternal: true };
    try {
      const domain = url.replace(/^https?:\/\//, '').split('/')[0];
      const isInternal = INTERNAL_DOMAIN_KEYWORDS.some(k => domain.includes(k));
      return { host: domain, isInternal };
    } catch {
      return { host: '', isInternal: true };
    }
  }, [url]);

  // 跳过远程获取：内网/无域名/强制兜底 → 直接显示图标
  if (!host || isInternal || forceFallback) {
    return (
      <Icon
        name="Globe"
        size={size}
        className={`rounded bg-slate-100/70 p-1 ${className}`}
        gradient="primary"
      />
    );
  }

  // 获取缓存 & 降级源
  const cachedUrl = faviconCache.get(host);
  const currentSourceIndex = Math.min(errorCount, FAVICON_SOURCES.length - 1);
  const src = cachedUrl || FAVICON_SOURCES[currentSourceIndex](host);

  // 错误处理：切换源 or 兜底
  const handleError = () => {
    if (currentSourceIndex < FAVICON_SOURCES.length - 1) {
      setErrorCount(prev => prev + 1);
    } else {
      // 所有源都失败，缓存兜底标记
      faviconCache.set(host, 'fallback');
    }
  };

  // 已标记兜底，不再请求
  if (cachedUrl === 'fallback') {
    return (
      <Icon
        name="Globe"
        size={size}
        className={`rounded bg-slate-100/70 p-1 ${className}`}
        gradient="primary"
      />
    );
  }

  return (
    <img
      src={src}
      alt={`${host} favicon`}
      width={size}
      height={size}
      className={`rounded object-contain ${className}`}
      onError={handleError}
      onLoad={() => faviconCache.set(host, src)}
    />
  );
};

export default React.memo(Favicon);
