const { Router } = require('express');
const ctrl = require('../controllers/attendance.controller');
const requireRole = require('../middleware/authorize');
const router = Router();

router.get('/', ctrl.list);
router.post('/', requireRole('leader', 'admin'), ctrl.create);
router.get('/today-progress', requireRole('leader', 'admin'), ctrl.todayProgress);

module.exports = router;
