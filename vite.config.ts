import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    // 开发服务器配置
    // 注意: API 请求在开发环境直接访问 /api/*
    // 生产环境由 Cloudflare Workers 统一处理
    server: {
      port: 3000,
      host: '0.0.0.0',
      // 开发环境 API 代理已移除
      // 生产环境: Workers 自动处理 /api/* 路由
    },
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      '__APP_VERSION__': JSON.stringify(process.env.npm_package_version)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    },
    // 构建配置
    build: {
      // 输出到 dist 目录，由 Workers Assets 自动部署
      outDir: 'dist',
      // 与 tsconfig ES2022 对齐，减少旧环境 polyfill
      target: 'es2022',
      // 代码分割配置
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // React 核心库 - 单独分组避免循环
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            
            // 拖拽库
            if (id.includes('@dnd-kit')) {
              return 'vendor-dnd';
            }
            
            // 图标库
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            
            // AI 库
            if (id.includes('@google/genai')) {
              return 'vendor-ai';
            }
            
            // 字体库
            if (id.includes('@fontsource')) {
              return 'vendor-fonts';
            }
            
            // 大型组件分组到主包，避免循环依赖
            if (id.includes('V9Dashboard') || 
                id.includes('LinkModal') ||
                id.includes('CategoryManagerModal') ||
                id.includes('ImportModal') ||
                id.includes('SettingsModal') ||
                id.includes('DataBackupModal')) {
              return 'index';
            }
            
            // 工具函数和 hooks 分组到主包
            if (id.includes('utils/') || id.includes('/utils') || 
                id.includes('hooks/') || id.includes('/hooks')) {
              return 'index';
            }
            
            // 默认分组
            return 'chunk-common';
          }
        }
      },
      // 增加 chunk 大小警告阈值
      chunkSizeWarningLimit: 1000,
      // 字体优化配置
      assetsInlineLimit: 4096, // 小于 4KB 的字体内联
      cssCodeSplit: true
    }
  };
});
