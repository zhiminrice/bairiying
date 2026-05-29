const { Router } = require('express');
const { list, getById, create } = require('../controllers/groups.controller');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/authorize');
const groupScope = require('../middleware/groupScope');

const router = Router();

router.use(authenticate, groupScope);

// 所有已认证用户均可查看小组列表和详情
router.get('/', list);
router.get('/:id', getById);

// 只有管理员可以创建小组
router.post('/', requireRole('admin'), create);

module.exports = router;
