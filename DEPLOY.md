# Y-Nav 项目部署指南

## 项目结构

```
L-Nav/
├── .github/workflows/    # GitHub Actions 自动部署配置
│   └── deploy-vercel.yml
├── database/             # 数据库 schema（可选）
├── dist/                 # 构建输出（自动生成）
├── functions/api/        # Vercel Serverless Functions
│   ├── sync.ts         # 主同步 API
│   └── v1/sync.ts      # v1 API 别名
├── public/               # 静态资源
├── src/                  # 前端源代码
│   ├── App.tsx
│   ├── components/      # 所有组件
│   ├── hooks/           # React Hooks
│   ├── services/        # 服务层
│   ├── types.ts         # TypeScript 类型
│   ├── utils/           # 工具函数
│   └── main.tsx         # 入口文件
├── index.html           # HTML 模板
├── package.json         # 依赖配置
├── tsconfig.json        # TypeScript 配置
├── vercel.json          # Vercel 部署配置
└── vite.config.ts       # Vite 构建配置
```

## 部署方式

### 方式一：GitHub Actions 自动部署（推荐）

1. 推送代码到 `main` 分支
2. GitHub Actions 自动触发构建和部署
3. 部署地址：https://678870.xyz

### 方式二：本地手动部署

```bash
# 1. 安装依赖
npm install

# 2. 构建项目
npm run build

# 3. 部署到生产环境
vercel --prod
```

## 开发环境启动

```bash
npm run dev
```

服务默认运行在 http://localhost:3000

## 重要配置

### vercel.json
- 构建输出目录：`dist`
- 缓存控制：`max-age=0, must-revalidate`（强制刷新）
- API 路由：`/api/*` -> `functions/api/`

### GitHub Actions
- 清理构建缓存
- 使用 production 环境
- 强制重新构建

## 注意事项

1. **不要提交 `dist/` 目录** - 这是自动生成的
2. **不要修改 `functions/api/` 路径** - Vercel 依赖此路径
3. **API 变更需要同步更新** - 前端和后端要匹配
4. **CDN 缓存可能需要时间刷新** - 如果看不到最新内容，请等待2-3分钟或强制刷新浏览器

## 故障排查

### 页面显示空白
- 检查浏览器控制台错误
- 强制刷新浏览器（Ctrl+Shift+R / Cmd+Shift+R）
- 检查 Vercel Functions 日志

### 组件未显示
- 检查 `src/App.tsx` 是否正确导入组件
- 检查本地构建输出 `dist/assets/` 是否包含组件文件

### 部署失败
- 检查 GitHub Actions 日志
- 检查 Vercel Dashboard 部署状态
- 确保 `vercel.json` 配置正确

## 技术栈

- **前端**：React 19 + TypeScript + Tailwind CSS
- **构建工具**：Vite 6
- **部署平台**：Vercel
- **后端**：Vercel Serverless Functions
