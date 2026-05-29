const { Router } = require('express');
const { list, create } = require('../controllers/courses.controller');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/authorize');

const router = Router();

router.use(authenticate);

// 所有已认证用户均可查看课程列表
router.get('/', list);

// 只有管理员可以创建课程
router.post('/', requireRole('admin'), create);

module.exports = router;
