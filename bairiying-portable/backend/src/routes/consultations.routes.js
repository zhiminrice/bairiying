const { Router } = require('express');
const ctrl = require('../controllers/consultations.controller');
const requireRole = require('../middleware/authorize');

const router = Router();

// 可约时段
router.get('/slots', ctrl.listSlots);
router.post('/slots', requireRole('teacher', 'admin'), ctrl.createSlot);
router.delete('/slots/:id', requireRole('teacher', 'admin'), ctrl.deleteSlot);

// 咨询预约
router.get('/', ctrl.listBookings);
router.post('/', requireRole('leader', 'admin'), ctrl.createBooking);
router.patch('/:id/confirm', requireRole('teacher', 'admin'), ctrl.confirmBooking);
router.patch('/:id/complete', requireRole('teacher', 'admin'), ctrl.completeBooking);
router.patch('/:id/cancel', requireRole('leader', 'teacher', 'admin'), ctrl.cancelBooking);

module.exports = router;
