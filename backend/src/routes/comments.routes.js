const { Router } = require('express');
const ctrl = require('../controllers/comments.controller');
const requireRole = require('../middleware/authorize');

const router = Router();

router.get('/', ctrl.list);
router.post('/', requireRole('teacher'), ctrl.create);

module.exports = router;
