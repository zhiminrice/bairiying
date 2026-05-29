const db = require('../config/database');

// GET /api/attendance - 打卡记录列表
// Leader sees own group only; teacher/admin see all
// Query params: ?date=YYYY-MM-DD, ?student_id=
exports.list = async (req, res, next) => {
  try {
    const query = db('attendance')
      .join('students', 'attendance.student_id', 'students.id')
      .select('attendance.*', 'students.name as student_name', 'students.group_id');

    if (req.user.role === 'leader') {
      query.where('students.group_id', req.user.group_id);
    }
    if (req.query.date) query.where('attendance.date', req.query.date);
    if (req.query.student_id) query.where('attendance.student_id', req.query.student_id);

    const records = await query.orderBy('attendance.date', 'desc').orderBy('students.name');
    res.json({ data: records });
  } catch (err) { next(err); }
};

// POST /api/attendance - 登记打卡 (支持批量: body 可以是对象或数组)
// Leader can only record for own group's students
exports.create = async (req, res, next) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];

    // 验证组长只能操作本组学员
    if (req.user.role === 'leader') {
      const studentIds = items.map(i => i.student_id);
      const students = await db('students').whereIn('id', studentIds).where('group_id', req.user.group_id);
      if (students.length !== new Set(studentIds).size) {
        return res.status(403).json({ error: '只能操作本组学员' });
      }
    }

    // upsert: 如果 (student_id, date) 已存在则更新，否则插入
    const results = [];
    for (const item of items) {
      const [record] = await db('attendance')
        .insert({
          student_id: item.student_id,
          date: item.date,
          status: item.status,    // 'present' | 'absent'
          note: item.note || null,
          created_by: req.user.id,
        })
        .onConflict(['student_id', 'date'])
        .merge({ status: item.status, note: item.note || null, created_by: req.user.id })
        .returning('*');
      results.push(record);
    }

    res.status(201).json({ data: results });
  } catch (err) { next(err); }
};

// GET /api/attendance/today-progress?date=YYYY-MM-DD
// Leader: 查看本组今日打卡进度
exports.todayProgress = async (req, res, next) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const groupId = req.user.role === 'leader' ? req.user.group_id : req.query.group_id;
    if (!groupId) return res.status(400).json({ error: '缺少组ID' });

    const total = await db('students').where({ group_id: groupId, status: 'active' }).count('id as count').first();
    const present = await db('attendance')
      .join('students', 'attendance.student_id', 'students.id')
      .where({ 'students.group_id': groupId, 'attendance.date': date, 'attendance.status': 'present' })
      .count('attendance.id as count').first();

    res.json({
      date,
      group_id: parseInt(groupId),
      total: parseInt(total.count),
      present: parseInt(present.count),
      absent: parseInt(total.count) - parseInt(present.count),
    });
  } catch (err) { next(err); }
};
