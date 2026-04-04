# Y-Nav 项目部署指南

## 项目结构

```
L-Nav/
├── .github/workflows/    # GitHub Actions 自动部署配置
│   └── deploy-workers.yml # Cloudflare Workers 部署
├── database/             # 数据库 schema
├── dist/                 # 构建输出（自动生成）
├── worker/               # Cloudflare Workers 后端代码
│   ├── index.ts         # Workers 入口
│   └── routes/          # API 路由
├── public/               # 静态资源
├── src/                  # 前端源代码
├── index.html           # HTML 模板
├── package.json         # 依赖配置
├── wrangler.toml        # Cloudflare Workers 配置
└── vite.config.ts       # Vite 构建配置
```

## 部署方式

### 方式一：GitHub Actions 自动部署（推荐）

1. 推送代码到 `main` 分支
2. GitHub Actions 自动触发构建和部署到 Cloudflare Workers
3. 部署地址：https://678870.xyz

### 方式二：本地手动部署

```bash
# 1. 安装依赖
npm install

# 2. 构建项目
npm run build

# 3. 部署到 Cloudflare Workers
npm run deploy
```

## 开发环境启动

```bash
npm run dev
```

服务默认运行在 http://localhost:5173

## 重要配置

### wrangler.toml
- Workers 名称: `home`
- 自定义域名: `678870.xyz`
- 静态资源目录: `dist`
- 绑定: KV、D1、R2

### GitHub Actions
- 自动推送到 main 分支时触发
- 使用 `cloudflare/wrangler-action@v3`
- 需要配置 Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`

## 技术栈

- **前端**: React 19 + TypeScript + Tailwind CSS
- **构建工具**: Vite 6
- **部署平台**: Cloudflare Workers + Assets
- **后端**: Cloudflare Workers + D1 + KV + R2

