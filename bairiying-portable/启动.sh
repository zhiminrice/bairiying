#!/bin/bash
echo "========================================"
echo "  百日营学员管理系统 - 便携版"
echo "========================================"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "[错误] 需要安装 Node.js"
    echo "  下载: https://nodejs.org (选择 LTS 版本)"
    read -p "按回车退出..."
    exit 1
fi

# 首次运行：安装依赖 + 初始化数据库
if [ ! -d "backend/node_modules/express" ]; then
    echo "[1/3] 正在安装依赖（使用国内镜像加速）..."
    cd backend
    npm install --registry=https://registry.npmmirror.com
    echo "[2/3] 正在初始化数据库..."
    npx knex migrate:latest
    npx knex seed:run
    cd ..
else
    echo "[跳过] 依赖已安装"
fi

echo "[3/3] 启动服务..."
echo ""
echo "========================================"
echo "  服务已启动！"
echo "  浏览器打开: http://localhost:3001"
echo "  管理员: admin@bairiying.com / admin123"
echo "========================================"
echo ""
echo "  按 Ctrl+C 停止服务"
echo ""
node backend/src/server.js
