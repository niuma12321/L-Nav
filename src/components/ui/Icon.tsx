import React, { useMemo } from 'react';
import * as LucideIcons from '@/utils/icons';
import type { LucideProps } from '@/utils/icons';

// ==============================================
// 🎯 类型定义（自动推导所有 Lucide 图标名称，完美TS支持）
// ==============================================
export type IconName = keyof typeof LucideIcons;

interface IconProps extends Omit<LucideProps, 'name'> {
  /** 图标名称（自动提示所有Lucide图标） */
  name: IconName | string;
  /** 图标大小 */
  size?: number;
  /** 自定义类名 */
  className?: string;
  /** 图标颜色（优先级高于渐变） */
  color?: string;
  /** 描边宽度 */
  strokeWidth?: number;
  /** 自旋动画（加载状态） */
  spin?: boolean;
  /** 脉冲动画（呼吸效果） */
  pulse?: boolean;
  /** 旋转角度 */
  rotate?: number;
  /** 渐变主题 */
  gradient?: 'primary' | 'success' | 'warning' | 'danger' | 'none';
}

// ==============================================
// 🧠 图标缓存（性能优化：避免重复查找图标组件）
// ==============================================
const ICON_CACHE = new Map<string, React.FC<LucideProps>>();

// ==============================================
// 🎨 内置样式（动画 + 渐变 + 基础样式）
// ==============================================
const ICON_BASE_STYLES = 'inline-flex shrink-0 transition-all duration-200';

// 动画样式
const ANIMATION_STYLES = {
  spin: 'animate-spin',
  pulse: 'animate-pulse',
};

// 渐变色彩配置
const GRADIENT_STYLES = {
  primary: 'text-blue-500 dark:text-blue-400',
  success: 'text-emerald-500 dark:text-emerald-400',
  warning: 'text-amber-500 dark:text-amber-400',
  danger: 'text-rose-500 dark:text-rose-400',
  none: '',
};

// 默认兜底图标（更友好的默认值）
const FALLBACK_ICON = 'HelpCircle';

// 判断是否为 emoji（短字符串且不是 URL 或 Lucide 图标名）
const isEmoji = (str: string): boolean => {
  // 如果是 URL（以 http 或 data: 开头），不是 emoji
  if (str.startsWith('http') || str.startsWith('data:')) {
    return false;
  }
  // 如果长度小于等于 4，可能是 emoji（大多数 emoji 是 2-4 个字符）
  // 且不是常见的 Lucide 图标名（首字母大写）
  if (str.length <= 4 && !/^[A-Z][a-zA-Z]*$/.test(str)) {
    return true;
  }
  return false;
};

// ==============================================
// 🚀 顶级图标组件
// ==============================================
const Icon: React.FC<IconProps> = ({
  name,
  size = 20,
  className = '',
  color,
  strokeWidth = 2,
  spin = false,
  pulse = false,
  rotate,
  gradient = 'none',
  ...rest
}) => {
  // 检查是否为 emoji
  const emojiMode = useMemo(() => isEmoji(name as string), [name]);

  // 如果是 emoji，直接渲染为 span
  if (emojiMode) {
    return (
      <span
        className={`inline-flex items-center justify-center ${className}`}
        style={{ 
          fontSize: size,
          lineHeight: 1,
          ...rest.style 
        }}
        aria-label={`${name} emoji`}
      >
        {name}
      </span>
    );
  }

  // 动态获取图标组件 + 缓存优化
  const IconComponent = useMemo(() => {
    const cacheKey = name as string;
    
    // 缓存命中
    if (ICON_CACHE.has(cacheKey)) {
      return ICON_CACHE.get(cacheKey)!;
    }

    // 查找图标（容错处理）
    let Component = LucideIcons[name as IconName];
    if (!Component) {
      console.warn(`[Icon] 图标 "${name}" 不存在，使用默认图标: ${FALLBACK_ICON}`);
      Component = LucideIcons[FALLBACK_ICON];
    }

    // 写入缓存
    ICON_CACHE.set(cacheKey, Component);
    return Component;
  }, [name]);

  // 合并所有样式类名
  const mergedClassNames = useMemo(() => {
    const classes = [ICON_BASE_STYLES, className];

    // 动画
    if (spin) classes.push(ANIMATION_STYLES.spin);
    if (pulse) classes.push(ANIMATION_STYLES.pulse);
    
    // 渐变（无自定义颜色时生效）
    if (!color && gradient !== 'none') {
      classes.push(GRADIENT_STYLES[gradient]);
    }

    return classes.filter(Boolean).join(' ');
  }, [className, spin, pulse, gradient, color]);

  // 旋转样式
  const rotateStyle = useMemo(() => 
    rotate !== undefined ? { transform: `rotate(${rotate}deg)` } : {},
    [rotate]
  );

  return (
    <IconComponent
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={mergedClassNames}
      style={{ ...rotateStyle, ...rest.style }}
      aria-label={`${name} 图标`}
      {...rest}
    />
  );
};

// 优化重渲染
export default React.memo(Icon);
