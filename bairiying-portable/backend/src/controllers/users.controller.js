const db = require('../config/database');
const { hashPassword } = require('../utils/hash');

/**
 * 获取用户列表（管理员）
 * GET /api/users
 */
async function list(req, res, next) {
  try {
    const users = await db('users')
      .select('id', 'name', 'phone', 'email', 'role', 'group_id', 'status', 'created_at', 'updated_at')
      .orderBy('created_at', 'asc');

    res.json({ users });
  } catch (err) {
    next(err);
  }
}

/**
 * 创建用户（管理员）
 * POST /api/users
 * Body: { name, phone, email, password, role, group_id }
 */
async function create(req, res, next) {
  try {
    const { name, phone, email, password, role, group_id } = req.body;

    if (!name || !password || !role) {
      return res.status(400).json({ error: '姓名、密码和角色为必填项' });
    }

    if (!['leader', 'teacher', 'admin'].includes(role)) {
      return res.status(400).json({ error: '角色必须为 leader、teacher 或 admin' });
    }

    // leader 角色必须有 group_id
    if (role === 'leader' && !group_id) {
      return res.status(400).json({ error: '组长必须指定所属小组' });
    }

    const password_hash = await hashPassword(password);

    const [user] = await db('users')
      .insert({
        name,
        phone: phone || null,
        email: email || null,
        password_hash,
        role,
        group_id: role === 'leader' ? group_id : null,
      })
      .returning(['id', 'name', 'phone', 'email', 'role', 'group_id', 'status', 'created_at', 'updated_at']);

    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create };
