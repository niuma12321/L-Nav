#!/usr/bin/env node

/**
 * 代码分割分析脚本
 * 分析主包内容，制定分割策略
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 分析构建结果
function analyzeBundle() {
  const manifestPath = path.join(__dirname, '../dist/.vite/manifest.json');
  
  if (!fs.existsSync(manifestPath)) {
    console.log('❌ 构建清单不存在，请先运行构建');
    return;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const mainEntry = manifest['src/main.tsx'] || manifest['main.tsx'] || manifest['index.html'];
  
  console.log('📊 构建分析结果:');
  console.log('主包内容分析:');
  
  // 分析主包大小
  if (mainEntry && mainEntry.file) {
    const mainPath = path.join(__dirname, '../dist', mainEntry.file);
    if (fs.existsSync(mainPath)) {
      const stats = fs.statSync(mainPath);
      console.log(`  📦 主包大小: ${(stats.size / 1024).toFixed(2)}KB`);
    }
  }

  // 分析依赖
  console.log('\n🔍 依赖分析:');
  Object.entries(manifest).forEach(([key, entry]) => {
    if (key.includes('node_modules')) {
      console.log(`  📄 ${key}: ${(entry.isEntry ? '入口' : '模块')}`);
    }
  });

  // 建议分割策略
  console.log('\n💡 分割建议:');
  console.log('  1. 大型组件懒加载 (Modal, Dashboard)');
  console.log('  2. 第三方库独立分包 (已完成)');
  console.log('  3. 路由级别代码分割');
  console.log('  4. 功能模块按需加载');
}

analyzeBundle();
