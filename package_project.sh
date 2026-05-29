#!/bin/bash
# 百日营学员管理系统 - 打包便携版
set -e

OUTPUT_DIR="bairiying-portable"
echo "正在打包便携版..."

# Clean
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"/backend/src
mkdir -p "$OUTPUT_DIR"/backend/data
mkdir -p "$OUTPUT_DIR"/frontend

# 1. 复制后端代码（保持 src/ 目录结构，app.js 中的 require 相对路径才能正常工作）
cp backend/src/server.js "$OUTPUT_DIR/backend/src/"
cp backend/src/app.js "$OUTPUT_DIR/backend/src/"
cp backend/knexfile.js "$OUTPUT_DIR/backend/"
# 注意：cp -r src/ dest 当 dest 不存在时，会复制 src 作为 dest
# 所以这里不预先创建子目录，让 cp 自动创建
cp -r backend/src/middleware "$OUTPUT_DIR/backend/src/middleware"
cp -r backend/src/controllers "$OUTPUT_DIR/backend/src/controllers"
cp -r backend/src/routes "$OUTPUT_DIR/backend/src/routes"
cp -r backend/src/utils "$OUTPUT_DIR/backend/src/utils"
cp -r backend/src/config "$OUTPUT_DIR/backend/src/config"
cp -r backend/migrations "$OUTPUT_DIR/backend/migrations"
cp -r backend/seeds "$OUTPUT_DIR/backend/seeds"

# 2. 复制前端构建产物
cp -r frontend/dist "$OUTPUT_DIR/frontend/dist"

# 3. 创建顶层 package.json
cat > "$OUTPUT_DIR/package.json" << 'JSONEND'
{
  "name": "bairiying-portable",
  "version": "1.0.0",
  "description": "百日营学员管理系统 - 便携版"
}
JSONEND

# 4. 创建 backend/package.json
cat > "$OUTPUT_DIR/backend/package.json" << 'JSONEND'
{
  "name": "bairiying-backend",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.2",
    "better-sqlite3": "^9.4.3",
    "knex": "^3.1.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "dotenv": "^16.4.5"
  }
}
JSONEND

# 5. 创建 .env 文件
cat > "$OUTPUT_DIR/backend/.env" << 'ENVEND'
PORT=3001
CORS_ORIGIN=*
JWT_SECRET=bairiying-portable-secret-key-2024
ENVEND

# 6. 创建启动脚本 - Windows (.bat)
cat > "$OUTPUT_DIR/启动.bat" << 'BATEND'
@echo off
chcp 65001 >nul
title 百日营学员管理系统
echo ========================================
echo   百日营学员管理系统 - 便携版
echo ========================================
echo.

if not exist "backend\node_modules\express" (
    echo [1/3] 正在安装依赖...
    cd backend
    call npm install --registry=https://registry.npmmirror.com
    cd ..
    echo [2/3] 正在初始化数据库...
    cd backend
    call npx knex migrate:latest
    call npx knex seed:run
    cd ..
)

echo [3/3] 启动服务...
echo.
echo ========================================
echo   服务已启动！
echo   浏览器打开: http://localhost:3001
echo   管理员: admin@bairiying.com / admin123
echo ========================================
echo.
echo   按 Ctrl+C 停止服务
echo.
node backend/src/server.js
pause
BATEND

# 7. 创建启动脚本 - macOS/Linux (.sh)
cat > "$OUTPUT_DIR/启动.sh" << 'SHEND'
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
SHEND
chmod +x "$OUTPUT_DIR/启动.sh"

echo ""
echo "打包完成: $OUTPUT_DIR/"
echo ""
echo "使用方法："
echo "  Windows:  双击 启动.bat"
echo "  Mac:      终端运行 bash 启动.sh"
echo "  需要:     Node.js (https://nodejs.org)"
echo ""
echo "打包成 ZIP..."
zip -r "${OUTPUT_DIR}.zip" "$OUTPUT_DIR" -x "*/node_modules/*" > /dev/null

SIZE=$(du -sh "${OUTPUT_DIR}.zip" | cut -f1)
echo "ZIP 包: ${OUTPUT_DIR}.zip (${SIZE})"
echo ""
echo "把这个 ZIP 发给同事即可！"
