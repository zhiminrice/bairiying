const db = require('../config/database');

/**
 * 获取学员列表
 * GET /api/students
 * - leader: 只看自己组的学员
 * - admin/teacher: 看全部学员（支持 ?group_id= 过滤）
 */
async function list(req, res, next) {
  try {
    let query = db('students')
      .select(
        'students.*',
        'groups.name as group_name'
      )
      .leftJoin('groups', 'students.group_id', 'groups.id')
      .orderBy('students.created_at', 'asc');

    if (req.user.role === 'leader') {
      query = query.where('students.group_id', req.user.group_id);
    } else if (req.query.group_id) {
      query = query.where('students.group_id', req.query.group_id);
    }

    const students = await query;

    res.json({ students });
  } catch (err) {
    next(err);
  }
}

/**
 * 创建学员
 * POST /api/students
 * Body: { name, group_id }
 * - leader: 只能在自己组下创建学员
 * - admin: 可在任意组下创建学员
 */
async function create(req, res, next) {
  try {
    const { name, group_id } = req.body;

    if (!name) {
      return res.status(400).json({ error: '学员姓名为必填项' });
    }

    if (!group_id) {
      return res.status(400).json({ error: '所属小组为必填项' });
    }

    // leader 只能在自己组下创建学员
    if (req.user.role === 'leader') {
      if (parseInt(group_id) !== req.user.group_id) {
        return res.status(403).json({ error: '组长只能在自己管辖的小组下创建学员' });
      }
    }

    // 验证小组存在
    const group = await db('groups').where({ id: group_id }).first();
    if (!group) {
      return res.status(400).json({ error: '指定的小组不存在' });
    }

    const [student] = await db('students')
      .insert({ name, group_id })
      .returning('*');

    res.status(201).json({ student });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create };
