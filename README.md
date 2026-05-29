# 百日营学员管理系统

> AI时代为人父母·百日实践营 — 日常运营管理平台

## 功能概览

| 角色 | 核心功能 |
|------|---------|
| **组长** (7位) | 每日打卡 · 作业登记 · 内容录入(收获/日记/行动分享) · 咨询预约 · 见证墙投稿 · 本组看板 |
| **讲师** (4位) | 学员内容浏览(多维度筛选) · 未点评优先 · 撰写点评 · 可约时段管理 · 预约确认 |
| **管理员** (1位) | 全营数据总览 · 出勤率统计与导出 · 见证墙审核发布 · 基础数据维护 |

> 完整功能清单见 [PRD 文档](./百日营学员管理系统_PRD.md)

## 技术栈

- **前端**: React 18 + Vite + Tailwind CSS + React Router 6
- **后端**: Node.js + Express + Knex.js
- **数据库**: PostgreSQL 16
- **认证**: JWT + bcrypt 角色鉴权
- **部署**: Docker Compose (一键部署)

## 快速开始

### 前置要求

- [Node.js](https://nodejs.org/) >= 18
- [PostgreSQL](https://www.postgresql.org/) >= 14 (本地开发)
- 或 [Docker](https://www.docker.com/) + Docker Compose (推荐)

### 方式一：Docker Compose 部署（推荐）

```bash
# 1. 克隆项目
git clone <your-repo-url> bairiying
cd bairiying

# 2. 配置环境变量（可选，默认值即可运行）
cp .env.production .env
# 编辑 .env，修改 JWT_SECRET 为随机字符串

# 3. 一键启动
docker compose up -d

# 4. 访问系统
# 前端: http://localhost:3000
# 后端 API: http://localhost:3001

# 5. 查看日志
docker compose logs -f
```

首次启动会自动：
- 创建 PostgreSQL 数据库
- 运行数据库迁移（建表）
- 填充种子数据（管理员 + 7组 + 62学员 + 4讲师）

### 方式二：本地开发

```bash
# 1. 确保 PostgreSQL 运行中，创建数据库
createdb bairiying

# 2. 安装依赖
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 3. 后端：迁移 + 种子 + 启动
cd backend
cp .env.example .env
# 编辑 .env 中的 DATABASE_URL
npx knex migrate:latest
npx knex seed:run
npm run dev
# → http://localhost:3001

# 4. 前端：启动（新终端）
cd frontend
npm run dev
# → http://localhost:5173
```

### 默认账号

| 角色 | 账号 | 密码 |
|------|------|------|
| 管理员 | admin@bairiying.com | admin123 |
| 张组长 (第一组) | 13800000001 | leader123 |
| 组长 (第二~七组) | 13800000102 ~ 13800000107 | 123456 |
| 讲师 (4位) | 13900000001 ~ 13900000004 | 123456 |

> **警告**：生产环境请立即修改所有默认密码！

## 项目结构

```
bairiying/
├── backend/                # Express 后端
│   ├── src/
│   │   ├── controllers/   # 业务逻辑 (12个模块)
│   │   ├── middleware/     # JWT认证 · 角色鉴权 · 数据隔离
│   │   ├── routes/        # RESTful API 路由
│   │   └── utils/         # 工具函数
│   ├── migrations/        # 数据库迁移 (12张表)
│   └── seeds/             # 种子数据
├── frontend/              # React 前端
│   ├── src/
│   │   ├── pages/         # 页面组件 (按角色分: leader/teacher/admin)
│   │   ├── components/    # 通用组件 + 布局
│   │   ├── context/       # AuthContext 认证状态
│   │   ├── api/           # API 客户端
│   │   └── router/        # 路由配置
├── scripts/               # 运维脚本
│   ├── backup.sh          # 数据库备份
│   └── restore.sh         # 数据库恢复
├── docker-compose.yml     # Docker 编排
├── .env.production        # 生产环境配置模板
└── README.md
```

## 数据库备份与恢复

### 自动备份

建议配置 cron 每日备份：

```bash
# 手动备份
npm run backup

# 或直接执行脚本
bash scripts/backup.sh
```

备份文件保存在 `backups/` 目录，自动保留最近 30 天。

### 数据恢复

```bash
bash scripts/restore.sh backups/bairiying_20260101_020000.sql.gz
```

## 生产环境注意事项

1. **修改 JWT_SECRET**: 编辑 `.env` 文件，使用 `openssl rand -hex 32` 生成随机密钥
2. **修改默认密码**: 登录后立即通过管理后台修改所有账号密码
3. **配置 HTTPS**: 生产环境建议使用 Nginx 反向代理 + Let's Encrypt
4. **配置备份**: 设置 cron 定时任务执行 `scripts/backup.sh`
5. **防火墙**: 仅对外开放 443/80 端口，数据库端口不对外

## API 文档

完整 API 端点清单见 PRD 文档和路由文件 `backend/src/routes/`。核心端点：

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 登录 (公开) |
| GET | `/api/witnesses/published` | 见证墙展示 (公开) |
| GET | `/api/stats/admin-overview` | 全营总览 (管理员) |
| GET | `/api/stats/export/attendance` | 导出出勤 CSV (管理员) |

> 其他端点均需 JWT 认证，权限按角色+数据范围双重校验。

## License

内部项目，仅供百日实践营运营使用。
