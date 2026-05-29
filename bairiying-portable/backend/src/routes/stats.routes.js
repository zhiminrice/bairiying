const { Router } = require('express');
const ctrl = require('../controllers/stats.controller');
const requireRole = require('../middleware/authorize');
const router = Router();

router.get('/leader-dashboard', requireRole('leader'), ctrl.leaderDashboard);
router.get('/admin-overview', requireRole('admin'), ctrl.adminOverview);
router.get('/course-attendance-rate', requireRole('admin'), ctrl.courseAttendanceRate);
router.get('/export/attendance', requireRole('admin'), ctrl.exportAttendance);

module.exports = router;
