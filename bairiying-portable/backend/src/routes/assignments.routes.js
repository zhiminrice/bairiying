const { Router } = require('express');
const ctrl = require('../controllers/assignments.controller');
const requireRole = require('../middleware/authorize');
const router = Router();

router.get('/', ctrl.list);
router.post('/', requireRole('leader', 'admin'), ctrl.create);

module.exports = router;
