#!/bin/bash
# 百日营学员管理系统 - 数据库备份脚本
# 用法: bash scripts/backup.sh
# 建议配合 cron 每日执行: 0 2 * * * cd /path/to/bairiying && bash scripts/backup.sh

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/bairiying_${TIMESTAMP}.sql"

mkdir -p "${BACKUP_DIR}"

# Docker 环境
if docker ps --format '{{.Names}}' | grep -q "bairiying-db"; then
    echo "[$(date)] 开始备份数据库..."
    docker exec bairiying-db pg_dump -U bairiying -d bairiying > "${BACKUP_FILE}"
    echo "[$(date)] 备份完成: ${BACKUP_FILE}"
else
    # 本地环境
    echo "[$(date)] 开始备份数据库..."
    PGPASSWORD=bairiying123 pg_dump -h localhost -U bairiying -d bairiying > "${BACKUP_FILE}"
    echo "[$(date)] 备份完成: ${BACKUP_FILE}"
fi

# 压缩
gzip "${BACKUP_FILE}"
echo "[$(date)] 已压缩: ${BACKUP_FILE}.gz"

# 保留最近 30 天的备份
find "${BACKUP_DIR}" -name "*.gz" -mtime +30 -delete
echo "[$(date)] 已清理 30 天前的旧备份"

echo "[$(date)] 备份任务完成"
