import { useState, useEffect, useCallback } from 'react';
import {
  PhoneCall,
  Clock,
  User,
  Users,
  X,
  AlertCircle,
  CheckCircle,
  Calendar,
  Loader2,
} from 'lucide-react';
import { studentsApi } from '../../api/leader';
import { slotsApi, bookingsApi } from '../../api/consultations';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';

const STATUS_MAP = {
  pending: { label: '待确认', class: 'bg-amber-100 text-amber-700' },
  confirmed: { label: '已确认', class: 'bg-blue-100 text-blue-700' },
  completed: { label: '已完成', class: 'bg-green-100 text-green-700' },
  cancelled: { label: '已取消', class: 'bg-gray-100 text-gray-500' },
};

function formatSlotTime(slot) {
  try {
    const d = new Date(slot.start_time);
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const endDate = new Date(d.getTime() + 30 * 60 * 1000);
    const ehh = String(endDate.getHours()).padStart(2, '0');
    const emm = String(endDate.getMinutes()).padStart(2, '0');
    return `${m}月${day}日 ${hh}:${mm}-${ehh}:${emm}`;
  } catch {
    return slot.start_time || '--';
  }
}

function formatBookingTime(booking) {
  return formatSlotTime({ start_time: booking.start_time });
}

export default function ConsultationPage() {
  const [activeTab, setActiveTab] = useState('book'); // 'book' | 'my'

  // Shared state
  const [students, setStudents] = useState([]);
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Booking state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Cancel dialog state
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  // Load all data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [studentRes, slotRes, bookingRes] = await Promise.all([
        studentsApi.list(),
        slotsApi.list({ status: 'open' }),
        bookingsApi.list(),
      ]);
      const studentData = studentRes.data?.data || studentRes.data || [];
      const slotData = slotRes.data?.data || slotRes.data || [];
      const bookingData = bookingRes.data?.data || bookingRes.data || [];
      setStudents(Array.isArray(studentData) ? studentData : []);
      setSlots(Array.isArray(slotData) ? slotData : []);
      setBookings(Array.isArray(bookingData) ? bookingData : []);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || '加载数据失败，请重试';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reload bookings when switching to "my bookings" tab
  useEffect(() => {
    if (activeTab === 'my') {
      loadData();
    }
  }, [activeTab, loadData]);

  // Group slots by teacher
  const slotsByTeacher = slots.reduce((acc, slot) => {
    const teacherId = slot.teacher_id || 'unknown';
    const teacherName = slot.teacher_name || '未分配老师';
    if (!acc[teacherId]) {
      acc[teacherId] = { name: teacherName, id: teacherId, slots: [] };
    }
    acc[teacherId].slots.push(slot);
    return acc;
  }, {});

  const teacherGroups = Object.values(slotsByTeacher);

  // Check if selected student already has a booking
  const selectedStudentHasBooking = selectedStudent
    ? bookings.some((b) => b.student_id === selectedStudent.id && b.status !== 'cancelled')
    : false;

  // Submit booking
  const handleBook = async () => {
    if (!selectedStudent || !selectedSlot) return;
    setSubmitting(true);
    setError(null);
    try {
      await bookingsApi.create({
        student_id: selectedStudent.id,
        slot_id: selectedSlot.id,
      });
      showToast('预约成功！');
      setSelectedStudent(null);
      setSelectedSlot(null);
      await loadData();
      setActiveTab('my');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || '预约失败，请重试';
      if (msg.includes('每人限') || msg.includes('already') || msg.includes('已预约') || msg.includes('只能预约')) {
        setError('该学员已经预约过咨询，每人仅限预约 1 次。');
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel booking
  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    setError(null);
    try {
      await bookingsApi.cancel(cancelTarget.id);
      showToast('预约已取消，时段已释放');
      setCancelTarget(null);
      await loadData();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || '取消失败，请重试';
      setError(msg);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <Loading />;

  const canSubmit = selectedStudent && selectedSlot && !submitting && !selectedStudentHasBooking;

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-brand-success text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-[fadeIn_0.3s_ease]">
          {toast}
        </div>
      )}

      {/* Cancel Confirm Dialog */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-brand-text mb-2">确认取消预约</h3>
            <p className="text-sm text-brand-muted mb-4">
              确定要取消此预约吗？对应时段将被释放。
            </p>
            {cancelTarget.student_name && (
              <p className="text-sm font-medium text-brand-text mb-1">
                学员：{cancelTarget.student_name}
              </p>
            )}
            <p className="text-sm text-brand-muted mb-5">
              时间：{formatBookingTime(cancelTarget)}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelTarget(null)}
                disabled={cancelling}
                className="flex-1 btn-secondary py-2.5"
              >
                返回
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 btn-danger py-2.5 flex items-center justify-center gap-2"
              >
                {cancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    取消中...
                  </>
                ) : (
                  '确认取消'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="card !p-1 flex">
        <button
          onClick={() => { setActiveTab('book'); setError(null); }}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'book'
              ? 'bg-brand-accent text-white shadow-sm'
              : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          预约咨询
        </button>
        <button
          onClick={() => { setActiveTab('my'); setError(null); }}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'my'
              ? 'bg-brand-accent text-white shadow-sm'
              : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          我的预约
        </button>
      </div>

      {/* Error */}
      {error && <ErrorMessage message={error} />}

      {/* ---- Tab 1: 预约咨询 ---- */}
      {activeTab === 'book' && (
        <div className="space-y-4">
          {/* Step 1: Select Student */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-brand-accent" />
              <h3 className="text-sm font-semibold text-brand-text">选择学员</h3>
            </div>

            {students.length === 0 ? (
              <p className="text-sm text-brand-muted py-4 text-center">暂无可选学员</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {students.map((student) => {
                  const sId = student.id || student.student_id;
                  const hasBooked = bookings.some(
                    (b) => (b.student_id === sId || b.student_id === student.id) && b.status !== 'cancelled'
                  );
                  const isSelected = selectedStudent && (selectedStudent.id === sId || selectedStudent.id === student.id);

                  return (
                    <button
                      key={sId}
                      onClick={() => {
                        setSelectedSlot(null);
                        setSelectedStudent({ ...student, id: sId });
                        setError(null);
                      }}
                      className={`relative flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        isSelected
                          ? 'border-brand-accent bg-brand-accent-light text-brand-accent shadow-sm'
                          : hasBooked
                          ? 'border-brand-border/50 bg-brand-card/60 text-brand-muted cursor-not-allowed opacity-70'
                          : 'border-brand-border/50 bg-brand-card text-brand-text hover:border-brand-accent/40 hover:shadow-sm'
                      }`}
                      disabled={hasBooked}
                    >
                      <User className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{student.name || student.display_name || `学员${sId}`}</span>
                      {hasBooked && (
                        <span className="absolute -top-1.5 -right-1.5 bg-brand-danger text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none">
                          已约
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {selectedStudent && selectedStudentHasBooking && (
              <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-brand-danger/10 border border-brand-danger/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-brand-danger flex-shrink-0" />
                <span className="text-sm text-brand-danger">该学员已预约过咨询，无法再次预约。</span>
              </div>
            )}
          </div>

          {/* Step 2: Select Slot */}
          {selectedStudent && !selectedStudentHasBooking && (
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-brand-accent" />
                <h3 className="text-sm font-semibold text-brand-text">选择时段</h3>
              </div>

              {teacherGroups.length === 0 ? (
                <p className="text-sm text-brand-muted py-4 text-center">暂无可约时段，请稍后再试。</p>
              ) : (
                <div className="space-y-4">
                  {teacherGroups.map((group) => (
                    <div key={group.id}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-brand-accent-light flex items-center justify-center text-brand-accent text-xs font-semibold">
                          {group.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-brand-text">{group.name}</span>
                      </div>

                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {group.slots.map((slot) => {
                          const isBooked = slot.status === 'booked';
                          const isSelected = selectedSlot && selectedSlot.id === slot.id;

                          return (
                            <button
                              key={slot.id}
                              onClick={() => {
                                if (!isBooked) {
                                  setSelectedSlot(slot);
                                  setError(null);
                                }
                              }}
                              disabled={isBooked}
                              className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm border transition-all ${
                                isSelected
                                  ? 'border-brand-accent bg-brand-accent-light text-brand-accent shadow-sm ring-1 ring-brand-accent/30'
                                  : isBooked
                                  ? 'border-brand-border/40 bg-brand-bg/60 text-brand-muted cursor-not-allowed'
                                  : 'border-brand-border/50 bg-white text-brand-text hover:border-brand-accent/40 hover:shadow-sm'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 whitespace-nowrap">
                                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>{formatSlotTime(slot)}</span>
                              </div>
                              {isBooked && (
                                <span className="block text-[10px] text-brand-muted mt-1">已约</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Confirm Button */}
          {selectedStudent && selectedSlot && (
            <div className="card !p-4 flex flex-col gap-3">
              <div className="text-sm text-brand-text space-y-1">
                <p>
                  <span className="text-brand-muted">学员：</span>
                  <span className="font-medium">{selectedStudent.name || selectedStudent.display_name}</span>
                </p>
                <p>
                  <span className="text-brand-muted">时段：</span>
                  <span className="font-medium">{formatSlotTime(selectedSlot)}</span>
                </p>
                {selectedSlot.teacher_name && (
                  <p>
                    <span className="text-brand-muted">老师：</span>
                    <span className="font-medium">{selectedSlot.teacher_name}</span>
                  </p>
                )}
              </div>
              <button
                onClick={handleBook}
                disabled={!canSubmit}
                className="w-full btn-primary flex items-center justify-center gap-2 py-3"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    预约中...
                  </>
                ) : (
                  <>
                    <PhoneCall className="w-4 h-4" />
                    确认预约
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ---- Tab 2: 我的预约 ---- */}
      {activeTab === 'my' && (
        <div>
          {bookings.length === 0 ? (
            <EmptyState
              icon={PhoneCall}
              title="暂无预约记录"
              description="选择学员和时段，为小组成员预约咨询。"
            />
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => {
                const statusInfo = STATUS_MAP[booking.status] || STATUS_MAP.pending;
                return (
                  <div key={booking.id} className="card !p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <User className="w-4 h-4 text-brand-accent flex-shrink-0" />
                          <span className="text-sm font-medium text-brand-text truncate">
                            {booking.student_name || `学员${booking.student_id}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-3.5 h-3.5 text-brand-muted flex-shrink-0" />
                          <span className="text-sm text-brand-muted">
                            {formatBookingTime(booking)}
                          </span>
                        </div>
                        {booking.teacher_name && (
                          <p className="text-xs text-brand-muted">
                            老师：{booking.teacher_name}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusInfo.class}`}>
                          {statusInfo.label}
                        </span>
                        {booking.status === 'pending' && (
                          <button
                            onClick={() => {
                              setCancelTarget(booking);
                              setError(null);
                            }}
                            className="text-xs text-brand-danger hover:underline flex items-center gap-1"
                          >
                            <X className="w-3 h-3" />
                            取消预约
                          </button>
                        )}
                        {booking.status === 'confirmed' && (
                          <CheckCircle className="w-5 h-5 text-brand-success" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
