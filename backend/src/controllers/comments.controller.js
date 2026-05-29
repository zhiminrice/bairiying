const db = require('../config/database');

// GET /api/comments - 点评列表
// Leader sees comments on own group's content; teacher sees own comments; admin sees all
// Query params: ?target_type=record|assignment, ?target_id=, ?teacher_id=
exports.list = async (req, res, next) => {
  try {
    const query = db('comments')
      .join('users', 'comments.teacher_id', 'users.id')
      .select('comments.*', 'users.name as teacher_name');

    if (req.query.target_type) query.where('comments.target_type', req.query.target_type);
    if (req.query.target_id) query.where('comments.target_id', req.query.target_id);
    if (req.query.teacher_id) query.where('comments.teacher_id', req.query.teacher_id);

    // Leader: only see comments on their group's content
    if (req.user.role === 'leader') {
      // Get all record IDs and assignment IDs belonging to leader's group
      const groupStudentIds = await db('students').where('group_id', req.user.group_id).select('id');
      const studentIdList = groupStudentIds.map(s => s.id);
      
      // Filter: comments on records belonging to leader's students
      const recordIds = await db('records').whereIn('student_id', studentIdList).select('id');
      const recordTargets = recordIds.map(r => ({ target_type: 'record', target_id: r.id }));
      
      // Filter: comments on assignments belonging to leader's students
      const assignmentIds = await db('assignments').whereIn('student_id', studentIdList).select('id');
      const assignmentTargets = assignmentIds.map(a => ({ target_type: 'assignment', target_id: a.id }));
      
      const allTargets = [...recordTargets, ...assignmentTargets];
      if (allTargets.length === 0) {
        return res.json({ data: [] });
      }
      
      query.where(function() {
        allTargets.forEach((t, i) => {
          if (i === 0) {
            this.where({ target_type: t.target_type, target_id: t.target_id });
          } else {
            this.orWhere({ target_type: t.target_type, target_id: t.target_id });
          }
        });
      });
    }

    // Teacher: only see own comments (unless admin)
    if (req.user.role === 'teacher') {
      query.where('comments.teacher_id', req.user.id);
    }

    const records = await query.orderBy('comments.created_at', 'desc');
    res.json({ data: records });
  } catch (err) { next(err); }
};

// POST /api/comments - 撰写点评 (teacher only)
exports.create = async (req, res, next) => {
  try {
    const { target_type, target_id, content } = req.body;

    if (!target_type || !target_id || !content) {
      return res.status(400).json({ error: '缺少必填字段' });
    }
    if (!['assignment', 'record'].includes(target_type)) {
      return res.status(400).json({ error: '无效的内容类型' });
    }

    // Verify target exists
    const targetTable = target_type === 'record' ? 'records' : 'assignments';
    const target = await db(targetTable).where('id', target_id).first();
    if (!target) {
      return res.status(404).json({ error: '点评目标不存在' });
    }

    const [comment] = await db('comments')
      .insert({
        target_type,
        target_id,
        teacher_id: req.user.id,
        content,
      })
      .returning('*');

    // Return with teacher name
    const result = {
      ...comment,
      teacher_name: req.user.name,
    };

    res.status(201).json({ data: result });
  } catch (err) { next(err); }
};
