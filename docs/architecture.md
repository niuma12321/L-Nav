# Y-Nav Cloudflare 统一架构说明

## 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                      Cloudflare 平台                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              Workers (home 项目) - 一体化部署                   ││
│  │                                                              ││
│  │   前端层: dist/ (React + Vite 构建)                          ││
│  │   ├── index.html                ← 入口 HTML                  ││
│  │   ├── assets/                   ← JS/CSS/字体/图片            ││
│  │   └── sw.js                     ← Service Worker (PWA)       ││
│  │                                                              ││
│  │   后端层: worker/index.ts (TypeScript)                       ││
│  │   ├── /api/v1/sync              ← 数据同步 (D1 + KV)         ││
│  │   ├── /api/v1/backup            ← 备份管理 (R2)              ││
│  │   ├── /api/v1/links             ← 链接 CRUD (D1)             ││
│  │   └── /api/v1/categories        ← 分类 CRUD (D1)           ││
│  │                                                              ││
│  │   路由分发:                                                   ││
│  │   ├── /api/* → API 处理                                      ││
│  │   └── /* → 静态资源 (SPA 回退 index.html)                    ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                    │
│           ┌──────────────────┼──────────────────┐                │
│           │                  │                  │                │
│           ▼                  ▼                  ▼                │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐       │
│  │     KV       │   │      D1      │   │      R2      │       │
│  │   键值存储    │   │   数据库      │   │  对象存储     │       │
│  ├──────────────┤   ├──────────────┤   ├──────────────┤       │
│  │ • 同步状态    │   │ • links 表   │   │ • 备份文件   │       │
│  │ • 缓存数据    │   │ • categories │   │ • 图标缓存   │       │
│  │ • 临时会话    │   │ • settings   │   │ • 导出数据   │       │
│  │ • 限流计数    │   │ • backups    │   │              │       │
│  │ • 静态资源    │   │ • analytics  │   │              │       │
│  └──────────────┘   └──────────────┘   └──────────────┘       │
│                                                                  │
│  域名绑定:                                                        │
│  ├── 678870.xyz (自定义域名)  → 主入口                          │
│  └── *.workers.dev (默认)      → 备用/调试                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 存储用途详解

### 1. KV 存储 (YNAV_WORKER_KV)
**用途**: 快速缓存和边缘数据
**数据**:
- `sync:data` - 完整数据同步缓存
- `sync:meta` - 同步元数据
- `backup:{key}` - 小备份（KV 回退）
- `session:*` - 临时会话数据
- `rate_limit:*` - API 限流计数
- `static:*` - 静态资源缓存（Assets 自动管理）

**特点**: 全球边缘缓存，读取极快，适合高频访问数据

### 2. D1 数据库 (ynav-db)
**用途**: 结构化数据持久化
**表结构**:
- `links` - 链接数据（标题、URL、分类、排序、固定状态）
- `categories` - 分类数据（名称、图标、排序、隐藏状态）
- `user_settings` - 用户设置（主题、密码哈希、AI配置）
- `backups` - 备份元数据（名称、大小、R2位置、时间）
- `analytics` - 访问统计（事件类型、数据、时间戳）

**特点**: 支持 SQL 查询、关系型数据、复杂筛选和排序

### 3. R2 存储桶 (ynav-storage)
**用途**: 大文件对象存储
**数据**:
- `backups/{key}.json` - 完整数据备份文件
- `icons/{domain}.png` - 网站图标缓存
- `exports/` - 数据导出文件
- `uploads/` - 用户上传文件

**特点**: S3 兼容 API、大容量、低成本、支持 CDN 加速

## 文件配置说明

### wrangler.toml
```toml
name = "home"                    # Workers 项目名称
main = "worker/index.ts"         # 入口文件
compatibility_date = "2024-01-01" # 功能兼容日期

# 存储绑定
[[kv_namespaces]]                 # KV 配置
binding = "YNAV_WORKER_KV"       # 代码中使用的变量名
id = "..."                       # KV 命名空间 ID

[[d1_databases]]                  # D1 配置
binding = "YNAV_D1"
database_name = "ynav-db"
database_id = "..."

[[r2_buckets]]                    # R2 配置
binding = "YNAV_R2"
bucket_name = "ynav-storage"

[assets]                          # 静态资源
directory = "dist"                # 构建输出目录
```

### vite.config.ts
```typescript
export default {
  server: {
    port: 3000,
    host: '0.0.0.0'
    // 注意: 生产环境没有代理，API 由 Workers 处理
  },
  build: {
    outDir: 'dist',  // 输出到 dist，Workers Assets 自动部署
    // ... 其他配置
  }
}
```

### worker/index.ts
```typescript
// Workers 入口文件，统一处理：
// 1. API 路由 (/api/*)
// 2. 静态资源 (/* → SPA 回退)
// 3. 数据存储访问 (D1 + R2 + KV)
```

## API 端点

| 端点 | 方法 | 存储 | 用途 |
|------|------|------|------|
| `/api/v1/sync` | GET | D1 → KV 回退 | 拉取完整数据 |
| `/api/v1/sync` | POST | D1 + KV | 保存完整数据 |
| `/api/v1/backup` | GET | D1 元数据 | 列出备份列表 |
| `/api/v1/backup?key=x` | GET | R2 | 下载备份文件 |
| `/api/v1/backup?key=x` | POST | R2 + D1 | 创建备份 |
| `/api/v1/backup?key=x` | DELETE | R2 + D1 | 删除备份 |
| `/api/v1/links` | GET | D1 | 获取所有链接 |
| `/api/v1/links` | POST | D1 | 保存链接 |
| `/api/v1/categories` | GET | D1 | 获取所有分类 |
| `/api/v1/categories` | POST | D1 | 保存分类 |

## 数据流向

### 1. 页面加载时数据同步
```
浏览器 → GET /api/v1/sync
              ↓
         Worker
              ↓
    ┌─────────┴─────────┐
    │                   │ (D1 失败)
    ▼                   ▼
  D1: 查询所有表      KV: sync:data
  links              (完整 JSON)
  categories         
  settings           
    │                   
    ▼                   
  合并返回 JSON        
```

### 2. 保存数据
```
浏览器 → POST /api/v1/sync (JSON)
              ↓
         Worker
              ↓
    ┌─────────┴─────────┐
    │                   │
    ▼                   ▼
  D1: 更新表         KV: put sync:data
  (事务写入)          (冗余备份)
    │                   
    ▼                   
  返回 {storage: "d1+kv"}
```

### 3. 创建备份
```
浏览器 → POST /api/v1/backup?key=xxx
              ↓
         Worker
              ↓
    ┌─────────┴─────────┐
    │                   │
    ▼                   ▼
  R2: put              D1: INSERT
  backups/xxx.json     backups 表
  (大文件)             (元数据)
```

## 部署流程

```
1. 本地开发
   npm run dev → localhost:3000
   
2. 构建
   npm run build → dist/
   
3. 部署
   wrangler deploy → Cloudflare Workers
   
4. 访问
   https://678870.xyz (自定义域名)
   https://home.xxx.workers.dev (默认域名)
```

## 已删除的配置

- ✅ `vercel.json` - Vercel 部署配置（不再使用）
- ✅ `.vercel/` - Vercel 部署缓存
- ✅ `functions/` - Cloudflare Pages Functions（改用 Workers）
- ✅ `api/` - Vercel Serverless Functions（改用 Workers）
- ✅ `netlify.toml` - Netlify 配置（如果存在）
- ✅ vite.config.ts 中的 proxy 配置（API 由 Workers 处理）

## 监控和调试

### Workers Dashboard
- URL: https://dash.cloudflare.com → Workers & Pages → home
- 查看: 请求量、错误率、CPU 时间、存储使用情况

### D1 数据库
- URL: https://dash.cloudflare.com → D1 → ynav-db
- 查看: 表结构、数据行数、执行查询

### R2 存储
- URL: https://dash.cloudflare.com → R2 → ynav-storage
- 查看: 对象列表、存储用量、访问日志

### KV 存储
- URL: https://dash.cloudflare.com → KV
- 查看: 键值列表、命名空间详情
