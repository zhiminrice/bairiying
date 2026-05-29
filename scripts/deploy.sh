#!/bin/bash
# =============================================
# 百日营学员管理系统 - 国内服务器一键部署脚本
# 用法: bash scripts/deploy.sh
# =============================================
set -e

echo "========================================="
echo "  百日营学员管理系统 - 一键部署"
echo "========================================="

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo ""
    echo "❌ 未检测到 Docker，正在安装..."
    curl -fsSL https://get.docker.com | bash
    sudo systemctl enable docker
    sudo systemctl start docker
    echo "✅ Docker 安装完成"
fi

# 检查 docker compose
if ! docker compose version &> /dev/null; then
    echo ""
    echo "❌ docker compose 不可用，正在安装..."
    sudo apt update && sudo apt install -y docker-compose-plugin
    echo "✅ docker compose 安装完成"
fi

# 构建前端
echo ""
echo "📦 正在构建前端..."
cd frontend && npm install && npm run build && cd ..
echo "✅ 前端构建完成"

# 启动
echo ""
echo "🚀 正在启动服务..."
docker compose -f docker-compose.prod.yml down 2>/dev/null
docker compose -f docker-compose.prod.yml up -d --build

# 等待启动
echo "⏳ 等待服务就绪..."
sleep 8

# 测试
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health | grep -q 200; then
    echo ""
    echo "========================================="
    echo "  ✅ 部署成功！"
    echo "========================================="
    echo ""
    echo "  系统地址: http://$(curl -s ifconfig.me):3001"
    echo "  管理员:   admin@bairiying.com / admin123"
    echo "  组长:     13800000001 / leader123"
    echo ""
    echo "  查看日志: docker compose -f docker-compose.prod.yml logs -f"
    echo "  重启:     docker compose -f docker-compose.prod.yml restart"
    echo "  停止:     docker compose -f docker-compose.prod.yml down"
    echo ""
else
    echo ""
    echo "⚠️  服务已启动但健康检查失败，查看日志:"
    docker compose -f docker-compose.prod.yml logs --tail 30
fi
