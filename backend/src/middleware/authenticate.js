const { verify } = require('../utils/jwt');
const db = require('../config/database');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ error: '认证格式错误，应为 Bearer <token>' });
    }

    const token = parts[1];
    const decoded = verify(token);

    const user = await db('users')
      .select('id', 'name', 'role', 'group_id')
      .where({ id: decoded.id, status: 'active' })
      .first();

    if (!user) {
      return res.status(401).json({ error: '用户不存在或已被禁用' });
    }

    req.user = {
      id: user.id,
      role: user.role,
      group_id: user.group_id,
      name: user.name,
    };

    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '认证令牌无效或已过期' });
    }
    next(err);
  }
}

module.exports = authenticate;
