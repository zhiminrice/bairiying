const db = require('../config/database');

/**
 * 获取课程列表
 * GET /api/courses
 * 所有已认证用户均可查看，按 week_no 排序
 */
async function list(req, res, next) {
  try {
    const courses = await db('courses')
      .select('*')
      .orderBy('week_no', 'asc');

    res.json({ courses });
  } catch (err) {
    next(err);
  }
}

/**
 * 创建课程（管理员）
 * POST /api/courses
 * Body: { week_no, title, course_date }
 */
async function create(req, res, next) {
  try {
    const { week_no, title, course_date } = req.body;

    if (!week_no || !title) {
      return res.status(400).json({ error: '课程周数和标题为必填项' });
    }

    if (week_no < 1 || week_no > 12) {
      return res.status(400).json({ error: '周数必须在 1 到 12 之间' });
    }

    const [course] = await db('courses')
      .insert({
        week_no,
        title,
        course_date: course_date || null,
      })
      .returning('*');

    res.status(201).json({ course });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create };
