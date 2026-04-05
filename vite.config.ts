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
          manualChunks: {
            // React 核心库
            'vendor-react': ['react', 'react-dom'],
            // 拖拽库
            'vendor-dnd': [
              '@dnd-kit/core',
              '@dnd-kit/sortable',
              '@dnd-kit/utilities'
            ],
            // 图标库 - 按需加载优化
            'vendor-icons': ['lucide-react'],
            // AI 库
            'vendor-ai': ['@google/genai'],
            // 字体库 - 优化字体加载
            'vendor-fonts': [
              '@fontsource/manrope',
              '@fontsource/outfit'
            ]
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
