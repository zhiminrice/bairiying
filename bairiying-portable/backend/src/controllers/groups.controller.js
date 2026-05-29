const db = require('../config/database');

/**
 * 获取小组列表
 * GET /api/groups
 * - leader: 只看自己的小组
 * - admin/teacher: 看所有小组
 */
async function list(req, res, next) {
  try {
    let query = db('groups').select('*').orderBy('created_at', 'asc');

    if (req.user.role === 'leader') {
      query = query.where({ id: req.user.group_id });
    }

    const groups = await query;

    res.json({ groups });
  } catch (err) {
    next(err);
  }
}

/**
 * 获取单个小组详情
 * GET /api/groups/:id
 */
async function getById(req, res, next) {
  try {
    const { id } = req.params;

    let query = db('groups').where({ id }).first();

    const group = await query;

    if (!group) {
      return res.status(404).json({ error: '小组不存在' });
    }

    // leader 只能看自己的小组
    if (req.user.role === 'leader' && group.id !== req.user.group_id) {
      return res.status(403).json({ error: '无权查看该小组信息' });
    }

    res.json({ group });
  } catch (err) {
    next(err);
  }
}

/**
 * 创建小组（管理员）
 * POST /api/groups
 * Body: { name, leader_id }
 */
async function create(req, res, next) {
  try {
    const { name, leader_id } = req.body;

    if (!name) {
      return res.status(400).json({ error: '小组名称为必填项' });
    }

    const [group] = await db('groups')
      .insert({
        name,
        leader_id: leader_id || null,
      })
      .returning('*');

    // 如果指定了 leader_id，更新该用户的 group_id
    if (leader_id) {
      await db('users').where({ id: leader_id }).update({ group_id: group.id });
    }

    res.status(201).json({ group });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create };
