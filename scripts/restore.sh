#!/bin/bash
# 百日营学员管理系统 - 数据库恢复脚本
# 用法: bash scripts/restore.sh <备份文件路径>

set -e

if [ -z "$1" ]; then
    echo "用法: bash scripts/restore.sh <备份文件>"
    echo "示例: bash scripts/restore.sh backups/bairiying_20260101_020000.sql.gz"
    ls -lt backups/*.gz 2>/dev/null | head -10
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "错误: 文件不存在 - ${BACKUP_FILE}"
    exit 1
fi

echo "警告: 此操作将覆盖当前数据库中的所有数据！"
echo "备份文件: ${BACKUP_FILE}"
read -p "确认恢复? (输入 yes 确认): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "已取消"
    exit 0
fi

if docker ps --format '{{.Names}}' | grep -q "bairiying-db"; then
    echo "开始恢复..."
    if [[ "$BACKUP_FILE" == *.gz ]]; then
        gunzip -c "$BACKUP_FILE" | docker exec -i bairiying-db psql -U bairiying -d bairiying
    else
        docker exec -i bairiying-db psql -U bairiying -d bairiying < "$BACKUP_FILE"
    fi
else
    if [[ "$BACKUP_FILE" == *.gz ]]; then
        gunzip -c "$BACKUP_FILE" | PGPASSWORD=bairiying123 psql -h localhost -U bairiying -d bairiying
    else
        PGPASSWORD=bairiying123 psql -h localhost -U bairiying -d bairiying < "$BACKUP_FILE"
    fi
fi

echo "恢复完成"
