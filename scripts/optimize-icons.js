#!/usr/bin/env node

/**
 * 图标导入优化脚本
 * 将所有 'lucide-react' 导入替换为 '@/utils/icons'
 * 减少打包体积
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.join(__dirname, '../src');

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // 替换导入语句
  let newContent = content.replace(
    /from\s+['"]lucide-react['"]/g,
    "from '@/utils/icons'"
  );
  
  // 如果内容有变化，写回文件
  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent);
    console.log(`✅ 更新: ${filePath}`);
    return true;
  }
  
  return false;
}

function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // 跳过 node_modules 和 .git
      if (file !== 'node_modules' && file !== '.git') {
        walkDir(filePath, callback);
      }
    } else if (file.match(/\.(ts|tsx)$/)) {
      callback(filePath);
    }
  }
}

console.log('🚀 开始优化图标导入...');
let updatedCount = 0;

walkDir(srcDir, (filePath) => {
  if (processFile(filePath)) {
    updatedCount++;
  }
});

console.log(`✨ 完成! 更新了 ${updatedCount} 个文件`);
