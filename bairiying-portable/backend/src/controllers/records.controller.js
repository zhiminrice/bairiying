const db = require('../config/database');

// GET /api/records - 学员内容列表 (收获/内省日记/行动分享)
// Leader sees own group; teacher/admin see all
// Query params: ?type=harvest|diary|action, ?student_id=, ?course_id=, ?record_date=
exports.list = async (req, res, next) => {
  try {
    const query = db('records')
      .join('students', 'records.student_id', 'students.id')
      .leftJoin('courses', 'records.course_id', 'courses.id')
      .select('records.*', 'students.name as student_name', 'students.group_id', 'courses.title as course_title', 'courses.week_no');

    if (req.user.role === 'leader') query.where('students.group_id', req.user.group_id);
    if (req.query.type) query.where('records.type', req.query.type);
    if (req.query.student_id) query.where('records.student_id', req.query.student_id);
    if (req.query.course_id) query.where('records.course_id', req.query.course_id);
    if (req.query.record_date) query.where('records.record_date', req.query.record_date);
    if (req.query.group_id) {
      query.where('students.group_id', req.query.group_id);
    }

    // 是否已点评筛选 (讲师常用：只看「未点评」内容)
    if (req.query.commented === 'true') {
      query.whereExists(db('comments').whereRaw('comments.target_id = records.id').where('comments.target_type', 'record'));
    } else if (req.query.commented === 'false') {
      query.whereNotExists(db('comments').whereRaw('comments.target_id = records.id').where('comments.target_type', 'record'));
    }

    const records = await query.orderBy('records.created_at', 'desc');
    res.json({ data: records });
  } catch (err) { next(err); }
};

// POST /api/records - 录入学员内容 (harvest/diary/action)
exports.create = async (req, res, next) => {
  try {
    const { student_id, type, course_id, record_date, content } = req.body;

    if (!student_id || !type || !record_date || !content) {
      return res.status(400).json({ error: '缺少必填字段' });
    }
    if (type === 'harvest' && !course_id) {
      return res.status(400).json({ error: '课程收获必须关联课程' });
    }

    // 组长只能操作本组学员
    if (req.user.role === 'leader') {
      const student = await db('students').where({ id: student_id, group_id: req.user.group_id }).first();
      if (!student) return res.status(403).json({ error: '只能操作本组学员' });
    }

    const [record] = await db('records')
      .insert({
        student_id,
        type,
        course_id: type === 'harvest' ? course_id : (course_id || null),
        record_date,
        content,
        created_by: req.user.id,
      })
      .returning('*');

    res.status(201).json({ data: record });
  } catch (err) { next(err); }
};

// GET /api/records/:id - 单条内容详情 (含点评)
exports.getById = async (req, res, next) => {
  try {
    const record = await db('records')
      .join('students', 'records.student_id', 'students.id')
      .leftJoin('courses', 'records.course_id', 'courses.id')
      .select('records.*', 'students.name as student_name', 'students.group_id', 'courses.title as course_title')
      .where('records.id', req.params.id)
      .first();

    if (!record) return res.status(404).json({ error: '内容不存在' });

    if (req.user.role === 'leader' && record.group_id !== req.user.group_id) {
      return res.status(403).json({ error: '只能查看本组内容' });
    }

    const comments = await db('comments')
      .join('users', 'comments.teacher_id', 'users.id')
      .select('comments.*', 'users.name as teacher_name')
      .where({ target_type: 'record', target_id: record.id })
      .orderBy('comments.created_at', 'asc');

    res.json({ data: { ...record, comments } });
  } catch (err) { next(err); }
};
