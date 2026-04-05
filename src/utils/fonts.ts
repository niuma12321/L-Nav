// 字体优化配置
// 仅加载必要的字体子集，减少字体文件数量

// Manrope 字体 - 主要用于界面
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';

// Outfit 字体 - 主要用于标题
import '@fontsource/outfit/500.css';
import '@fontsource/outfit/600.css';
import '@fontsource/outfit/700.css';

// 字体回退配置
export const fontConfig = {
  // 主要字体栈 - Manrope 优先
  primary: '"Manrope", "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif',
  
  // 显示字体 - Outfit 用于标题
  display: '"Outfit", "Manrope", "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif',
  
  // 等宽字体
  mono: '"Fira Code", "SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace'
};

// 预加载关键字体
export const preloadFonts = [
  'Manrope-400-normal',
  'Manrope-500-normal', 
  'Manrope-600-normal',
  'Outfit-500-normal'
];
