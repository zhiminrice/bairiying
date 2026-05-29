const { Router } = require('express');
const { list, create } = require('../controllers/students.controller');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/authorize');
const groupScope = require('../middleware/groupScope');

const router = Router();

router.use(authenticate, groupScope);

// 所有已认证用户均可查看学员列表
router.get('/', list);

// leader 和 admin 可以创建学员
router.post('/', requireRole('leader', 'admin'), create);

module.exports = router;
