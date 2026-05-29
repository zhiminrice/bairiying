# 百日营学员管理系统 — 云平台部署指南

> 三步完成部署，永久链接，团队随时访问

---

## 总览

| 组件 | 平台 | 免费额度 | 部署后地址 |
|------|------|---------|-----------|
| 数据库 | **Supabase** | 500MB / 无限项目 | 自动分配 |
| 后端 API | **Render** | 每月 750 小时 | https://bairiying-api.onrender.com |
| 前端 | **Vercel** | 每月 100GB 流量 | https://bairiying.vercel.app |

---

## 第一步：创建 Supabase 数据库（5 分钟）

1. 打开 https://supabase.com → 用 GitHub 登录 → 「New project」
2. 填写：
   - Name: `bairiying`
   - Database Password: 设一个强密码（记下来！）
   - Region: 选离自己最近的（如 Tokyo）
3. 点击 Create project，等 1 分钟
4. 进入 Settings → Database → Connection string → 选 **Session pooler**
5. 复制连接字符串，格式类似：
   ```
   postgresql://postgres.xxx:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
   ```
6. 打开 SQL Editor → 把 `/sessions/6a183e8b4c0e691f722bbfa9/workspace/backend/supabase_schema.sql` 的内容粘贴进去 → Run

> ⚠️ 复制连接字符串后，记得把 `[PASSWORD]` 替换为你刚才设的密码

---

## 第二步：部署后端到 Render（3 分钟）

1. 打开 https://render.com → 用 GitHub 登录
2. 点击右上角「New」→「Web Service」
3. 连接你的 GitHub 仓库（先把项目推到 GitHub）
4. 配置：
   - Name: `bairiying-api`
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `node src/server.js`
5. Environment Variables 添加：
   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |
   | `DATABASE_URL` | 第一步复制的 Supabase 连接字符串 |
   | `JWT_SECRET` | 随机字符串（用 openssl rand -hex 32 生成） |
   | `CORS_ORIGIN` | `https://bairiying.vercel.app` |
6. 点击「Create Web Service」→ 等 2 分钟部署

> 部署完成后，记下 Render 给你的 URL：`https://bairiying-api.onrender.com`

---

## 第三步：部署前端到 Vercel（3 分钟）

1. 打开 https://vercel.com → 用 GitHub 登录
2. 点击「Add New」→「Project」
3. 选择你的 GitHub 仓库
4. 配置：
   - Framework Preset: **Vite**
   - Root Directory: `frontend`
5. Environment Variables 添加：
   | Key | Value |
   |-----|-------|
   | `VITE_API_BASE` | `https://bairiying-api.onrender.com/api` |
6. 点击 Deploy → 等 1 分钟

> 部署完成后 Vercel 会给你一个域名：`https://bairiying.vercel.app`

---

## 第四步：推送代码到 GitHub（如还未推送）

```bash
cd /sessions/6a183e8b4c0e691f722bbfa9/workspace

git init
git add .
git commit -m "百日营学员管理系统 v1.0"
git remote add origin https://github.com/你的用户名/bairiying.git
git push -u origin main
```

---

## 部署完成后

```
https://bairiying.vercel.app    ← 把链接发给同事
```

首次访问需要跑种子数据：

1. 打开 Render 后台 → bairiying-api → Shell（或本地连 Supabase）
2. 运行：
```bash
cd backend
npx knex migrate:latest --env production
npx knex seed:run --env production
```

---

## 常见问题

**Q: Render 免费版会休眠吗？**  
A: 15 分钟无请求会休眠，下次访问要等 30 秒冷启动。可以设定时 ping 保持活跃。

**Q: Supabase 免费版够用吗？**  
A: 500MB 够存数十万条记录，60人规模完全够。

**Q: 可以绑定自己的域名吗？**  
A: Vercel 在 Settings → Domains 里可以绑定。
