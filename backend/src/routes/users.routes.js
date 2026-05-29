const { Router } = require('express');
const { list, create } = require('../controllers/users.controller');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/authorize');

const router = Router();

// 所有用户路由都需要认证 + 管理员权限
router.use(authenticate, requireRole('admin'));

router.get('/', list);
router.post('/', create);

module.exports = router;
