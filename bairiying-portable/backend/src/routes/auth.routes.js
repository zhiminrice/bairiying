const { Router } = require('express');
const { login, me } = require('../controllers/auth.controller');
const authenticate = require('../middleware/authenticate');

const router = Router();

// 公开路由
router.post('/login', login);

// 需认证路由
router.get('/me', authenticate, me);

module.exports = router;
