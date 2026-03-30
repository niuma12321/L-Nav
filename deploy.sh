#!/bin/bash

# ============================================
# Y-Nav Cloudflare 部署脚本
# 域名: 678870.xyz
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
PROJECT_NAME="home"
D1_DB_NAME="ynav-db"
R2_BUCKET="ynav-storage"
KV_NAMESPACE="YNAV_WORKER_KV"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Y-Nav Cloudflare 部署脚本${NC}"
echo -e "${BLUE}  域名: 678870.xyz${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查命令行参数
COMMAND=${1:-deploy}

# 初始化函数
init_database() {
    echo -e "${YELLOW}[1/3] 检查并初始化 D1 数据库...${NC}"
    
    # 检查数据库是否存在
    if ! wrangler d1 list | grep -q "$D1_DB_NAME"; then
        echo -e "${YELLOW}  创建 D1 数据库: $D1_DB_NAME${NC}"
        wrangler d1 create "$D1_DB_NAME"
    else
        echo -e "${GREEN}  D1 数据库已存在: $D1_DB_NAME${NC}"
    fi
    
    # 执行数据库迁移
    echo -e "${YELLOW}  执行数据库迁移...${NC}"
    wrangler d1 execute "$D1_DB_NAME" --file=./database/schema.sql --local=false
    
    echo -e "${GREEN}  D1 数据库初始化完成${NC}"
}

# 初始化 R2
init_r2() {
    echo -e "${YELLOW}[2/3] 检查并初始化 R2 存储...${NC}"
    
    # 检查 R2 Bucket 是否存在 (通过尝试列出对象来检查)
    if ! wrangler r2 bucket list | grep -q "$R2_BUCKET"; then
        echo -e "${YELLOW}  创建 R2 Bucket: $R2_BUCKET${NC}"
        wrangler r2 bucket create "$R2_BUCKET"
    else
        echo -e "${GREEN}  R2 Bucket 已存在: $R2_BUCKET${NC}"
    fi
    
    echo -e "${GREEN}  R2 存储初始化完成${NC}"
}

# 构建项目
build_project() {
    echo -e "${YELLOW}[3/3] 构建项目...${NC}"
    
    # 安装依赖
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}  安装依赖...${NC}"
        npm install
    fi
    
    # 构建
    npm run build
    
    echo -e "${GREEN}  项目构建完成${NC}"
}

# 部署到 Cloudflare
deploy() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  开始部署流程${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    # 初始化
    init_database
    init_r2
    build_project
    
    echo ""
    echo -e "${YELLOW}[4/4] 部署到 Cloudflare...${NC}"
    
    # 部署 Worker
    wrangler deploy --env production
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  部署完成!${NC}"
    echo -e "${GREEN}  访问: https://678870.xyz${NC}"
    echo -e "${GREEN}========================================${NC}"
}

# 本地开发
dev() {
    echo -e "${BLUE}启动本地开发服务器...${NC}"
    wrangler dev --env dev
}

# 数据库迁移
migrate() {
    echo -e "${YELLOW}执行数据库迁移...${NC}"
    wrangler d1 execute "$D1_DB_NAME" --file=./database/schema.sql --local=false
    echo -e "${GREEN}数据库迁移完成${NC}"
}

# 健康检查
health() {
    echo -e "${YELLOW}检查服务健康状态...${NC}"
    curl -s https://678870.xyz/api/v1/sync?action=health | jq .
}

# 显示帮助
show_help() {
    echo "用法: ./deploy.sh [命令]"
    echo ""
    echo "命令:"
    echo "  deploy     - 完整部署流程 (默认)"
    echo "  init       - 仅初始化数据库和存储"
    echo "  build      - 仅构建项目"
    echo "  dev        - 本地开发"
    echo "  migrate    - 执行数据库迁移"
    echo "  health     - 检查服务健康状态"
    echo "  help       - 显示帮助"
    echo ""
    echo "示例:"
    echo "  ./deploy.sh deploy    # 完整部署"
    echo "  ./deploy.sh dev       # 本地开发"
}

# 主逻辑
case "$COMMAND" in
    deploy)
        deploy
        ;;
    init)
        init_database
        init_r2
        ;;
    build)
        build_project
        ;;
    dev)
        dev
        ;;
    migrate)
        migrate
        ;;
    health)
        health
        ;;
    help)
        show_help
        ;;
    *)
        echo -e "${RED}未知命令: $COMMAND${NC}"
        show_help
        exit 1
        ;;
esac
