const db = require('../config/database');

// GET /api/stats/leader-dashboard - 组长本组看板数据
exports.leaderDashboard = async (req, res, next) => {
  try {
    if (req.user.role !== 'leader' || !req.user.group_id) {
      return res.status(403).json({ error: '仅组长可访问' });
    }

    const groupId = req.user.group_id;

    // 本组学员总数
    const studentsTotal = await db('students').where({ group_id: groupId, status: 'active' }).count('id as count').first();

    // 今日打卡进度
    const today = new Date().toISOString().split('T')[0];
    const todayPresent = await db('attendance')
      .join('students', 'attendance.student_id', 'students.id')
      .where({ 'students.group_id': groupId, 'attendance.date': today, 'attendance.status': 'present' })
      .count('attendance.id as count').first();

    // 本周打卡率 (最近7天)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const weekRecords = await db('attendance')
      .join('students', 'attendance.student_id', 'students.id')
      .where('students.group_id', groupId)
      .where('attendance.date', '>=', weekAgo);

    const totalWeekSlots = parseInt(studentsTotal.count) * 7;
    const presentWeekCount = weekRecords.filter(r => r.status === 'present').length;
    const weekRate = totalWeekSlots > 0 ? Math.round((presentWeekCount / totalWeekSlots) * 100) : 0;

    // 断卡提醒: 连续3天未打卡的学员
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const recentAttendance = await db('attendance')
      .join('students', 'attendance.student_id', 'students.id')
      .where('students.group_id', groupId)
      .where('attendance.date', '>=', threeDaysAgo)
      .select('attendance.student_id', 'attendance.date', 'attendance.status', 'students.name');

    // 找出连续3天未打卡的学员
    const allStudents = await db('students').where({ group_id: groupId, status: 'active' }).select('id', 'name');
    const brokenStudents = allStudents.filter(s => {
      const days = recentAttendance.filter(r => r.student_id === s.id);
      return days.every(d => d.status === 'absent') || days.length === 0;
    });

    // 最近作业提交情况
    const recentAssignments = await db('assignments')
      .join('students', 'assignments.student_id', 'students.id')
      .where('students.group_id', groupId)
      .orderBy('assignments.created_at', 'desc')
      .limit(20);

    // 最近录入的学员内容
    const recentRecords = await db('records')
      .join('students', 'records.student_id', 'students.id')
      .where('students.group_id', groupId)
      .orderBy('records.created_at', 'desc')
      .limit(10)
      .select('records.*', 'students.name as student_name');

    res.json({
      group_id: groupId,
      students_count: parseInt(studentsTotal.count),
      today_attendance: {
        present: parseInt(todayPresent.count),
        total: parseInt(studentsTotal.count),
      },
      week_attendance_rate: weekRate,
      broken_streak: brokenStudents.map(s => ({ id: s.id, name: s.name })),
      recent_records_count: recentRecords.length,
    });
  } catch (err) { next(err); }
};

// GET /api/stats/admin-overview - 全营数据总览 (admin only)
exports.adminOverview = async (req, res, next) => {
  try {
    // Total counts
    const [groupsCount, studentsCount, usersCount, coursesCount] = await Promise.all([
      db('groups').count('id as count').first(),
      db('students').where('status', 'active').count('id as count').first(),
      db('users').where('status', 'active').count('id as count').first(),
      db('courses').count('id as count').first(),
    ]);

    // Overall attendance rate (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const weekAttendance = await db('attendance')
      .join('students', 'attendance.student_id', 'students.id')
      .where('attendance.date', '>=', weekAgo)
      .where('students.status', 'active')
      .select('attendance.status');

    const totalWeekRecords = weekAttendance.length;
    const presentWeekRecords = weekAttendance.filter(r => r.status === 'present').length;
    const attendanceRate = totalWeekRecords > 0 ? Math.round((presentWeekRecords / totalWeekRecords) * 100) : 0;

    // Assignment submission rate
    const allAssignments = await db('assignments')
      .join('students', 'assignments.student_id', 'students.id')
      .where('students.status', 'active')
      .select('assignments.submitted');
    const totalAssignments = allAssignments.length;
    const submittedAssignments = allAssignments.filter(a => a.submitted).length;
    const assignmentRate = totalAssignments > 0 ? Math.round((submittedAssignments / totalAssignments) * 100) : 0;

    // Per-group breakdown
    const groups = await db('groups').select('id', 'name');
    const groupStats = [];
    for (const g of groups) {
      const gStudents = await db('students').where({ group_id: g.id, status: 'active' }).count('id as count').first();
      const gAttendance = await db('attendance')
        .join('students', 'attendance.student_id', 'students.id')
        .where({ 'students.group_id': g.id, 'attendance.date': weekAgo, 'attendance.status': 'present' })
        .count('attendance.id as count').first();

      const gTotal = parseInt(gStudents.count);
      const gPresent = parseInt(gAttendance.count);

      groupStats.push({
        id: g.id,
        name: g.name,
        student_count: gTotal,
        today_present: gPresent,
        today_attendance_rate: gTotal > 0 ? Math.round((gPresent / gTotal) * 100) : 0,
      });
    }

    res.json({
      data: {
        groups_count: parseInt(groupsCount.count),
        students_count: parseInt(studentsCount.count),
        users_count: parseInt(usersCount.count),
        courses_count: parseInt(coursesCount.count),
        week_attendance_rate: attendanceRate,
        assignment_rate: assignmentRate,
        group_stats: groupStats,
      },
    });
  } catch (err) { next(err); }
};

// GET /api/stats/course-attendance-rate - 按课程出勤率 (admin only)
exports.courseAttendanceRate = async (req, res, next) => {
  try {
    const courses = await db('courses').orderBy('week_no', 'asc');
    const activeStudentCount = await db('students').where('status', 'active').count('id as count').first();
    const totalStudents = parseInt(activeStudentCount.count);

    const courseStats = [];
    for (const course of courses) {
      const present = await db('course_attendance')
        .where({ course_id: course.id, present: true })
        .count('id as count').first();

      const total = await db('course_attendance')
        .where('course_id', course.id)
        .count('id as count').first();

      courseStats.push({
        course_id: course.id,
        week_no: course.week_no,
        title: course.title,
        course_date: course.course_date,
        present_count: parseInt(present.count),
        total_count: parseInt(total.count),
        expected_count: totalStudents,
        attendance_rate: totalStudents > 0 ? Math.round((parseInt(present.count) / totalStudents) * 100) : 0,
      });
    }

    res.json({ data: courseStats });
  } catch (err) { next(err); }
};

// GET /api/stats/export/attendance - 导出出勤CSV (admin only)
exports.exportAttendance = async (req, res, next) => {
  try {
    const records = await db('attendance')
      .join('students', 'attendance.student_id', 'students.id')
      .join('groups', 'students.group_id', 'groups.id')
      .select(
        'attendance.date',
        'students.name as student_name',
        'groups.name as group_name',
        'attendance.status',
        'attendance.note'
      )
      .orderBy('attendance.date', 'desc')
      .orderBy('groups.name')
      .orderBy('students.name');

    // Build CSV
    const header = '日期,学员姓名,小组,状态,备注';
    const rows = records.map(r =>
      `${r.date},"${r.student_name}","${r.group_name}",${r.status === 'present' ? '已到' : '未到'},"${(r.note || '').replace(/"/g, '""')}"`
    );
    const csv = [header, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="attendance_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send('\uFEFF' + csv); // BOM for Excel Chinese compatibility
  } catch (err) { next(err); }
};
