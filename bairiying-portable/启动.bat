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
