const { Router } = require('express');
const ctrl = require('../controllers/witnesses.controller');
const requireRole = require('../middleware/authorize');

const router = Router();

// Authenticated routes
router.get('/', ctrl.list);
router.post('/', requireRole('leader', 'admin'), ctrl.create);
router.patch('/:id/publish', requireRole('admin'), ctrl.publish);
router.patch('/:id/hide', requireRole('admin'), ctrl.hide);

module.exports = router;
