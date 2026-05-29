const db = require('../config/database');

// GET /api/assignments
// Leader sees own group; teacher/admin can filter by course_id, student_id
exports.list = async (req, res, next) => {
  try {
    const query = db('assignments')
      .join('students', 'assignments.student_id', 'students.id')
      .leftJoin('courses', 'assignments.course_id', 'courses.id')
      .select('assignments.*', 'students.name as student_name', 'students.group_id', 'courses.title as course_title', 'courses.week_no');

    if (req.user.role === 'leader') query.where('students.group_id', req.user.group_id);
    if (req.query.course_id) query.where('assignments.course_id', req.query.course_id);
    if (req.query.student_id) query.where('assignments.student_id', req.query.student_id);

    const records = await query.orderBy('assignments.created_at', 'desc');
    res.json({ data: records });
  } catch (err) { next(err); }
};

// POST /api/assignments - 登记作业
exports.create = async (req, res, next) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];

    // 组长只能操作本组学员
    if (req.user.role === 'leader') {
      const studentIds = items.map(i => i.student_id);
      const students = await db('students').whereIn('id', studentIds).where('group_id', req.user.group_id);
      if (students.length !== new Set(studentIds).size) {
        return res.status(403).json({ error: '只能操作本组学员' });
      }
    }

    const results = [];
    for (const item of items) {
      const [record] = await db('assignments')
        .insert({
          student_id: item.student_id,
          course_id: item.course_id,
          submitted: item.submitted,
          content: item.content || null,
          created_by: req.user.id,
        })
        .returning('*');
      results.push(record);
    }

    res.status(201).json({ data: results });
  } catch (err) { next(err); }
};
