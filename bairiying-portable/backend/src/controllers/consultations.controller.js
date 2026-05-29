const db = require('../config/database');

// ========== 可约时段管理 (consult_slots) ==========

// GET /api/consultations/slots - 可约时段列表
// Everyone can view; filter by teacher_id, status
exports.listSlots = async (req, res, next) => {
  try {
    const query = db('consult_slots')
      .join('users', 'consult_slots.teacher_id', 'users.id')
      .select('consult_slots.*', 'users.name as teacher_name');

    if (req.query.teacher_id) query.where('consult_slots.teacher_id', req.query.teacher_id);
    if (req.query.status) query.where('consult_slots.status', req.query.status);

    const slots = await query.orderBy('consult_slots.start_time', 'asc');
    res.json({ data: slots });
  } catch (err) { next(err); }
};

// POST /api/consultations/slots - 发布可约时段 (teacher only)
// Body: { start_time: ISO string, duration: 30 (optional, default 30) }
exports.createSlot = async (req, res, next) => {
  try {
    const { start_time, duration = 30 } = req.body;
    if (!start_time) return res.status(400).json({ error: '请选择起始时间' });

    const [slot] = await db('consult_slots')
      .insert({
        teacher_id: req.user.id,
        start_time,
        duration,
        status: 'open',
      })
      .returning('*');

    res.status(201).json({ data: slot });
  } catch (err) { next(err); }
};

// DELETE /api/consultations/slots/:id - 删除时段 (teacher can only delete own, not booked)
exports.deleteSlot = async (req, res, next) => {
  try {
    const slot = await db('consult_slots').where('id', req.params.id).first();
    if (!slot) return res.status(404).json({ error: '时段不存在' });
    if (slot.teacher_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: '只能删除自己的时段' });
    }
    if (slot.status === 'booked') {
      return res.status(400).json({ error: '已被预约的时段不可删除' });
    }

    await db('consult_slots').where('id', req.params.id).delete();
    res.json({ message: '时段已删除' });
  } catch (err) { next(err); }
};

// ========== 咨询预约管理 (consultations) ==========

// GET /api/consultations - 预约列表
// Leader: see own group's bookings; Teacher: see bookings on own slots; Admin: see all
exports.listBookings = async (req, res, next) => {
  try {
    const query = db('consultations')
      .join('consult_slots', 'consultations.slot_id', 'consult_slots.id')
      .join('students', 'consultations.student_id', 'students.id')
      .join('users as teacher', 'consultations.teacher_id', 'teacher.id')
      .join('users as booker', 'consultations.booked_by', 'booker.id')
      .select(
        'consultations.*',
        'consult_slots.start_time',
        'consult_slots.duration',
        'students.name as student_name',
        'students.group_id',
        'teacher.name as teacher_name',
        'booker.name as booked_by_name'
      );

    if (req.user.role === 'leader') {
      query.where('students.group_id', req.user.group_id);
    } else if (req.user.role === 'teacher') {
      query.where('consultations.teacher_id', req.user.id);
    }

    if (req.query.status) query.where('consultations.status', req.query.status);
    if (req.query.student_id) query.where('consultations.student_id', req.query.student_id);

    const bookings = await query.orderBy('consult_slots.start_time', 'asc');
    res.json({ data: bookings });
  } catch (err) { next(err); }
};

// POST /api/consultations - 提交预约 (leader only, with TRANSACTION + LOCK + 1-time check)
// Body: { slot_id, student_id }
exports.createBooking = async (req, res, next) => {
  const { slot_id, student_id } = req.body;
  if (!slot_id || !student_id) {
    return res.status(400).json({ error: '请选择时段和学员' });
  }

  // Use transaction for concurrency safety
  const trx = await db.transaction();

  try {
    // 1. Check student belongs to leader's group
    if (req.user.role === 'leader') {
      const student = await trx('students').where({ id: student_id, group_id: req.user.group_id }).first();
      if (!student) {
        await trx.rollback();
        return res.status(403).json({ error: '只能为本组学员预约' });
      }
    }

    // 2. Check one-time rule: student must have 0 valid bookings
    const existingBooking = await trx('consultations')
      .where('student_id', student_id)
      .whereIn('status', ['pending', 'confirmed', 'completed'])
      .first();

    if (existingBooking) {
      await trx.rollback();
      return res.status(400).json({ error: '该学员已预约过咨询，每人限预约 1 次' });
    }

    // 3. SQLite doesn't support FOR UPDATE, use immediate transaction mode instead
    const slot = await trx('consult_slots')
      .where('id', slot_id)
      .first();

    if (!slot) {
      await trx.rollback();
      return res.status(404).json({ error: '时段不存在' });
    }
    if (slot.status !== 'open') {
      await trx.rollback();
      return res.status(400).json({ error: '该时段已被预约' });
    }

    // 4. Create booking
    const [booking] = await trx('consultations')
      .insert({
        slot_id,
        student_id,
        teacher_id: slot.teacher_id,
        booked_by: req.user.id,
        status: 'pending',
      })
      .returning('*');

    // 5. Mark slot as booked
    await trx('consult_slots').where('id', slot_id).update({ status: 'booked' });

    await trx.commit();

    res.status(201).json({ data: booking });
  } catch (err) {
    await trx.rollback();
    next(err);
  }
};

// PATCH /api/consultations/:id/confirm - 确认预约 (teacher only, own bookings)
exports.confirmBooking = async (req, res, next) => {
  try {
    const booking = await db('consultations').where('id', req.params.id).first();
    if (!booking) return res.status(404).json({ error: '预约不存在' });
    if (booking.teacher_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: '只能确认自己的预约' });
    }
    if (booking.status !== 'pending') {
      return res.status(400).json({ error: `无法确认状态为「${booking.status}」的预约` });
    }

    const [updated] = await db('consultations')
      .where('id', req.params.id)
      .update({ status: 'confirmed' })
      .returning('*');

    res.json({ data: updated });
  } catch (err) { next(err); }
};

// PATCH /api/consultations/:id/complete - 标记完成 (teacher only, own bookings)
exports.completeBooking = async (req, res, next) => {
  try {
    const booking = await db('consultations').where('id', req.params.id).first();
    if (!booking) return res.status(404).json({ error: '预约不存在' });
    if (booking.teacher_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: '只能操作自己的预约' });
    }
    if (booking.status !== 'confirmed') {
      return res.status(400).json({ error: '只能标记已确认的预约为完成' });
    }

    const [updated] = await db('consultations')
      .where('id', req.params.id)
      .update({ status: 'completed' })
      .returning('*');

    res.json({ data: updated });
  } catch (err) { next(err); }
};

// PATCH /api/consultations/:id/cancel - 取消预约 (leader: cancel own group's; teacher: cancel own bookings)
exports.cancelBooking = async (req, res, next) => {
  const trx = await db.transaction();

  try {
    const booking = await trx('consultations').where('id', req.params.id).first();
    if (!booking) {
      await trx.rollback();
      return res.status(404).json({ error: '预约不存在' });
    }

    // Leader: can only cancel own group's pending bookings
    if (req.user.role === 'leader') {
      const student = await trx('students').where('id', booking.student_id).first();
      if (!student || student.group_id !== req.user.group_id) {
        await trx.rollback();
        return res.status(403).json({ error: '只能取消本组学员的预约' });
      }
    }

    // Teacher: can cancel own bookings that are pending
    if (req.user.role === 'teacher' && booking.teacher_id !== req.user.id) {
      await trx.rollback();
      return res.status(403).json({ error: '只能取消自己的预约' });
    }

    // Only pending bookings can be cancelled (per PRD: confirmed/completed don't restore quota)
    if (booking.status !== 'pending') {
      await trx.rollback();
      return res.status(400).json({ error: '只能取消尚未确认的预约' });
    }

    // Cancel booking
    await trx('consultations')
      .where('id', req.params.id)
      .update({ status: 'cancelled' });

    // Release the slot
    await trx('consult_slots')
      .where('id', booking.slot_id)
      .update({ status: 'open' });

    await trx.commit();

    res.json({ message: '预约已取消，时段已释放' });
  } catch (err) {
    await trx.rollback();
    next(err);
  }
};
