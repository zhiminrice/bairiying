# 百日营学员管理系统 — 国内服务器部署指南

> 无需翻墙，国内服务器一键部署，15 分钟上线

---

## 方案总览

```
┌──────────────────────────────────────────┐
│         阿里云 / 腾讯云 轻量应用服务器      │
│                                          │
│   ┌─────────────────────────────────┐   │
│   │   Docker 容器                    │   │
│   │   Node.js + SQLite + 前端静态文件 │   │
│   │   端口 3001                      │   │
│   └─────────────────────────────────┘   │
│                                          │
│   数据: 服务器本地 SQLite 文件             │
│   备份: 每日自动备份 → 自动保留 30 天      │
└──────────────────────────────────────────┘
```

**成本**: 云服务器约 ¥50-100/月，无其他费用  
**流量**: 不设限，国内访问延迟 < 50ms

---

## 第一步：买服务器（5 分钟）

任选一家：

| 平台 | 产品 | 配置 | 价格 |
|------|------|------|------|
| [阿里云](https://swas.console.aliyun.com) | 轻量应用服务器 | 2核2G / 40G | ¥68/月 |
| [腾讯云](https://cloud.tencent.com/product/lighthouse) | 轻量应用服务器 | 2核2G / 40G | ¥56/月 |

**配置选项都选一样的**：
- 镜像：**Ubuntu 22.04**（或 Debian 12）
- 地域：选离团队最近的
- 防火墙：开放 **80** 和 **443** 端口

---

## 第二步：连接服务器 + 部署（5 分钟）

买完服务器后，在控制台找到公网 IP，SSH 连上去：

```bash
ssh root@你的服务器IP
```

然后一次跑完：

```bash
# 1. 安装 Docker（按提示输 y）
curl -fsSL https://get.docker.com | bash

# 2. 上传项目代码
#    在你的本地电脑执行（不是服务器上！）：
#    scp -r /sessions/6a183e8b4c0e691f722bbfa9/workspace root@你的IP:/opt/bairiying

# 3. 回到服务器，开始部署
cd /opt/bairiying

# 4. 安装 Node.js（给构建前端用）
apt install -y nodejs npm

# 5. 构建前端
cd frontend && npm install && npm run build && cd ..

# 6. 启动
docker compose -f docker-compose.prod.yml up -d --build
```

等 30 秒，然后测试：

```bash
curl http://localhost:3001/api/health
# 看到 {"status":"ok"} 就成功了
```

---

## 第三步：配置域名 + HTTPS（可选，5 分钟）

### 如果买域名 → Nginx + SSL

```bash
# 安装 Nginx
apt install -y nginx certbot python3-certbot-nginx

# 复制 Nginx 配置
cp nginx.prod.conf /etc/nginx/sites-available/bairiying
ln -s /etc/nginx/sites-available/bairiying /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# 申请 SSL 证书（替换成你的域名）
certbot --nginx -d 你的域名.com
```

### 如果直接用 IP → 跳过此步

直接用 `http://你的IP:3001` 访问就行。

---

## 第四步：配置定时备份

```bash
# 编辑 cron
crontab -e

# 添加这行（每天凌晨 3 点备份）
0 3 * * * cd /opt/bairiying && bash scripts/backup.sh >> backups/cron.log 2>&1
```

---

## 日常维护命令

```bash
# 查看服务状态
docker ps

# 查看日志
docker compose -f docker-compose.prod.yml logs --tail 50 -f

# 重启
docker compose -f docker-compose.prod.yml restart

# 更新代码后重新部署
cd /opt/bairiying
git pull                                    # 如果用了 git
cd frontend && npm run build && cd ..
docker compose -f docker-compose.prod.yml up -d --build

# 手动备份
bash scripts/backup.sh

# 恢复备份
bash scripts/restore.sh backups/bairiying_日期.sql.gz
```

---

## 防火墙设置

在云服务器控制台的防火墙规则里，确保开放这些端口：

| 端口 | 用途 |
|:----:|------|
| 80 | HTTP（如果不配 HTTPS 只开 3001 也行） |
| 443 | HTTPS |
| 3001 | 默认服务端口 |
| 22 | SSH（默认已开） |

> 如果只打算用 `http://IP:3001` 访问，只开放 3001 和 22 就够了。

---

## 首次使用

部署完成后，浏览器打开 `http://你的服务器IP:3001`，登录：

| 角色 | 账号 | 密码 |
|------|------|------|
| 管理员 | admin@bairiying.com | admin123 |
| 组长 | 13800000001 | leader123 |
| 讲师 | 13900000001 | 123456 |

> ⚠️ 上线第一件事：用管理员登录 → 修改所有默认密码！

---

## 常见问题

**Q: 60 人用，配置够吗？**  
A: 2核2G 完全够。SQLite 在这个规模下性能充足。

**Q: 数据安全吗？**  
A: 每日自动备份，建议额外把 backups 目录同步到阿里云 OSS 或腾讯云 COS。

**Q: 换服务器怎么迁移？**  
A: 把 backups/ 目录和 data/ 目录复制到新服务器，重新 `docker compose up -d` 即可。
