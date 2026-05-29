const db = require('../config/database');

// GET /api/witnesses - 投稿列表
// Leader: see own group's submissions; Admin: see all
exports.list = async (req, res, next) => {
  try {
    const query = db('witnesses')
      .join('students', 'witnesses.student_id', 'students.id')
      .join('users', 'witnesses.submitted_by', 'users.id')
      .select(
        'witnesses.*',
        'students.name as student_name',
        'students.group_id',
        'users.name as submitted_by_name'
      );

    if (req.user.role === 'leader') {
      query.where('students.group_id', req.user.group_id);
    }
    if (req.query.status) query.where('witnesses.status', req.query.status);
    if (req.query.student_id) query.where('witnesses.student_id', req.query.student_id);

    const records = await query.orderBy('witnesses.created_at', 'desc');
    res.json({ data: records });
  } catch (err) { next(err); }
};

// POST /api/witnesses - 组长提交投稿
exports.create = async (req, res, next) => {
  try {
    const { student_id, text, image_url, display_mode } = req.body;
    if (!student_id || !text || !display_mode) {
      return res.status(400).json({ error: '缺少必填字段（学员、内容、署名方式）' });
    }

    // Leader scope check
    if (req.user.role === 'leader') {
      const student = await db('students').where({ id: student_id, group_id: req.user.group_id }).first();
      if (!student) return res.status(403).json({ error: '只能为本组学员投稿' });
    }

    const [witness] = await db('witnesses')
      .insert({
        student_id,
        text,
        image_url: image_url || null,
        display_mode,
        status: 'pending',
        submitted_by: req.user.id,
      })
      .returning('*');

    res.status(201).json({ data: witness });
  } catch (err) { next(err); }
};

// PATCH /api/witnesses/:id/publish - 精选发布 (admin only)
exports.publish = async (req, res, next) => {
  try {
    const witness = await db('witnesses').where('id', req.params.id).first();
    if (!witness) return res.status(404).json({ error: '投稿不存在' });

    const [updated] = await db('witnesses')
      .where('id', req.params.id)
      .update({ status: 'published', published_at: new Date() })
      .returning('*');

    res.json({ data: updated });
  } catch (err) { next(err); }
};

// PATCH /api/witnesses/:id/hide - 撤下 (admin only)
exports.hide = async (req, res, next) => {
  try {
    const witness = await db('witnesses').where('id', req.params.id).first();
    if (!witness) return res.status(404).json({ error: '投稿不存在' });

    const [updated] = await db('witnesses')
      .where('id', req.params.id)
      .update({ status: 'hidden' })
      .returning('*');

    res.json({ data: updated });
  } catch (err) { next(err); }
};

// GET /api/witnesses/published - 公开见证墙 (NO AUTH REQUIRED)
// Handle in route file: this should be public
exports.publishedList = async (req, res, next) => {
  try {
    const records = await db('witnesses')
      .join('students', 'witnesses.student_id', 'students.id')
      .select(
        'witnesses.id',
        'witnesses.text',
        'witnesses.image_url',
        'witnesses.display_mode',
        'witnesses.published_at',
        'students.name as student_name'
      )
      .where('witnesses.status', 'published')
      .orderBy('witnesses.published_at', 'desc');

    // Apply anonymity: if display_mode is 'anonymous', hide student_name
    const result = records.map(r => ({
      ...r,
      student_name: r.display_mode === 'anonymous' ? null : r.student_name,
    }));

    res.json({ data: result });
  } catch (err) { next(err); }
};
