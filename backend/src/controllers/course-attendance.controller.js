const db = require('../config/database');

// GET /api/course-attendance - 课程出勤列表
// Leader sees own group; admin sees all
exports.list = async (req, res, next) => {
  try {
    const query = db('course_attendance')
      .join('students', 'course_attendance.student_id', 'students.id')
      .join('courses', 'course_attendance.course_id', 'courses.id')
      .select(
        'course_attendance.*',
        'students.name as student_name',
        'students.group_id',
        'courses.title as course_title',
        'courses.week_no',
        'courses.course_date'
      );

    if (req.user.role === 'leader') {
      query.where('students.group_id', req.user.group_id);
    }
    if (req.query.course_id) query.where('course_attendance.course_id', req.query.course_id);
    if (req.query.student_id) query.where('course_attendance.student_id', req.query.student_id);

    const records = await query.orderBy('courses.week_no', 'asc').orderBy('students.name');
    res.json({ data: records });
  } catch (err) { next(err); }
};

// POST /api/course-attendance - 批量登记课程出勤 (leader/admin)
// Body: [{ course_id, student_id, present: bool }, ...]
exports.create = async (req, res, next) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];

    if (req.user.role === 'leader') {
      const studentIds = items.map(i => i.student_id);
      const students = await db('students').whereIn('id', studentIds).where('group_id', req.user.group_id);
      if (students.length !== new Set(studentIds).size) {
        return res.status(403).json({ error: '只能操作本组学员' });
      }
    }

    const results = [];
    for (const item of items) {
      const [record] = await db('course_attendance')
        .insert({
          course_id: item.course_id,
          student_id: item.student_id,
          present: item.present,
        })
        .onConflict(['course_id', 'student_id'])
        .merge({ present: item.present })
        .returning('*');
      results.push(record);
    }

    res.status(201).json({ data: results });
  } catch (err) { next(err); }
};
