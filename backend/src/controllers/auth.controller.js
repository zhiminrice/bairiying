const db = require('../config/database');
const { sign } = require('../utils/jwt');
const { comparePassword } = require('../utils/hash');

/**
 * 用户登录
 * POST /api/auth/login
 * Body: { account, password }
 */
async function login(req, res, next) {
  try {
    const { account, password } = req.body;

    if (!account || !password) {
      return res.status(400).json({ error: '请输入账号和密码' });
    }

    const user = await db('users')
      .where({ phone: account })
      .orWhere({ email: account })
      .first();

    if (!user) {
      return res.status(401).json({ error: '账号或密码错误' });
    }

    if (user.status !== 'active') {
      return res.status(401).json({ error: '账号已被禁用，请联系管理员' });
    }

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: '账号或密码错误' });
    }

    const token = sign({ id: user.id, role: user.role });

    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      token,
      user: userWithoutPassword,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 获取当前登录用户信息
 * GET /api/auth/me
 */
async function me(req, res, next) {
  try {
    const user = await db('users')
      .select('id', 'name', 'phone', 'email', 'role', 'group_id', 'status')
      .where({ id: req.user.id })
      .first();

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({ user });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, me };
