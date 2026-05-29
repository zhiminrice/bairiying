const express = require('express');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const cors = require('cors');
const authenticate = require('./middleware/authenticate');
const errorHandler = require('./middleware/errorHandler');

// 路由导入
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const groupsRoutes = require('./routes/groups.routes');
const studentsRoutes = require('./routes/students.routes');
const coursesRoutes = require('./routes/courses.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const assignmentsRoutes = require('./routes/assignments.routes');
const recordsRoutes = require('./routes/records.routes');
const commentsRoutes = require('./routes/comments.routes');
const consultationsRoutes = require('./routes/consultations.routes');
const statsRoutes = require('./routes/stats.routes');
const courseAttendanceRoutes = require('./routes/course-attendance.routes');
const witnessesRoutes = require('./routes/witnesses.routes');

const app = express();

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 见证墙公开展示（无需登录）
app.get('/api/witnesses/published', require('./controllers/witnesses.controller').publishedList);

// 认证路由（公开）
app.use('/api/auth', authRoutes);

// 以下所有路由需要认证
app.use('/api/users', authenticate, usersRoutes);
app.use('/api/groups', authenticate, groupsRoutes);
app.use('/api/students', authenticate, studentsRoutes);
app.use('/api/courses', authenticate, coursesRoutes);
app.use('/api/attendance', authenticate, attendanceRoutes);
app.use('/api/assignments', authenticate, assignmentsRoutes);
app.use('/api/records', authenticate, recordsRoutes);
app.use('/api/comments', authenticate, commentsRoutes);
app.use('/api/consultations', authenticate, consultationsRoutes);
app.use('/api/stats', authenticate, statsRoutes);
app.use('/api/course-attendance', authenticate, courseAttendanceRoutes);
app.use('/api/witnesses', authenticate, witnessesRoutes);

// === 托管前端静态文件（生产模式） ===
// 容器内路径: ./public，本地开发: ../../frontend/dist
const frontendDist = (() => {
  const containerPath = path.join(__dirname, '..', 'public');
  if (fs.existsSync(containerPath)) return containerPath;
  return path.join(__dirname, '..', '..', 'frontend', 'dist');
})();
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  // SPA fallback: 所有非 API 路由返回 index.html
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ error: '接口不存在' });
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// 全局错误处理
app.use(errorHandler);

module.exports = app;
