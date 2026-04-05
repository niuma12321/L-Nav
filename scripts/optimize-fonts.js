#!/usr/bin/env node

/**
 * 字体优化脚本
 * 移除不必要的字体语言变体，仅保留拉丁字符集
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, '../dist/assets');

// 要保留的字体文件模式（仅拉丁字符）
const keepPatterns = [
  /manrope-latin-[4567]00-normal/,
  /outfit-latin-[4567]00-normal/,
  /vendor-fonts.*\.css$/,
  /index.*\.css$/
];

// 要删除的字体文件模式（其他语言变体）
const deletePatterns = [
  /manrope-(vietnamese|greek|cyrillic|latin-ext)/,
  /outfit-(vietnamese|greek|cyrillic|latin-ext)/
];

function optimizeFonts() {
  console.log('🚀 开始字体优化...');
  
  if (!fs.existsSync(distDir)) {
    console.log('❌ dist 目录不存在，请先运行构建');
    return;
  }

  const files = fs.readdirSync(distDir);
  let deletedCount = 0;
  let totalSize = 0;
  let deletedSize = 0;

  files.forEach(file => {
    const filePath = path.join(distDir, file);
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    totalSize += fileSize;

    // 检查是否应该删除
    const shouldDelete = deletePatterns.some(pattern => pattern.test(file));
    const shouldKeep = keepPatterns.some(pattern => pattern.test(file));

    if (shouldDelete && !shouldKeep) {
      fs.unlinkSync(filePath);
      console.log(`🗑️  删除: ${file} (${(fileSize / 1024).toFixed(2)}KB)`);
      deletedCount++;
      deletedSize += fileSize;
    }
  });

  console.log(`\n✨ 字体优化完成!`);
  console.log(`📊 统计:`);
  console.log(`   - 删除文件: ${deletedCount} 个`);
  console.log(`   - 节省空间: ${(deletedSize / 1024).toFixed(2)}KB`);
  console.log(`   - 剩余文件: ${files.length - deletedCount} 个`);
  console.log(`   - 压缩率: ${((deletedSize / totalSize) * 100).toFixed(1)}%`);
}

optimizeFonts();
