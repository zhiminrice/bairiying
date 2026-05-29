require('dotenv').config();

const app = require('./app');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`[百日营学员管理系统] 服务已启动`);
  console.log(`  浏览器打开: http://localhost:${PORT}`);
  console.log(`  管理员: admin@bairiying.com / admin123`);
});
