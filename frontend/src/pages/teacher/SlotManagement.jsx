import { useState, useEffect, useCallback } from 'react';
import {
  PlusCircle,
  Trash2,
  Clock,
  Calendar,
  User,
  Users,
  CheckCircle,
  X,
  AlertCircle,
  Loader2,
  PhoneCall,
} from 'lucide-react';
import { slotsApi, bookingsApi } from '../../api/consultations';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';

const BOOKING_STATUS_MAP = {
  pending: { label: '待确认', class: 'bg-amber-100 text-amber-700' },
  confirmed: { label: '已确认', class: 'bg-blue-100 text-blue-700' },
  completed: { label: '已完成', class: 'bg-green-100 text-green-700' },
  cancelled: { label: '已取消', class: 'bg-gray-100 text-gray-500' },
};

function fmtDateStr(dateStr) {
  try {
    const d = new Date(dateStr);
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const w = weekdays[d.getDay()];
    return `${m}月${day}日 周${w}`;
  } catch {
    return dateStr;
  }
}

function fmtTimeRange(slot) {
  try {
    const d = new Date(slot.start_time);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const endDate = new Date(d.getTime() + 30 * 60 * 1000);
    const ehh = String(endDate.getHours()).padStart(2, '0');
    const emm = String(endDate.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}-${ehh}:${emm}`;
  } catch {
    return slot.start_time || '--';
  }
}

function getDateKey(dateStr) {
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  } catch {
    return dateStr;
  }
}

export default function SlotManagement() {
  // Slot form
  const [slotDate, setSlotDate] = useState('');
  const [slotTime, setSlotTime] = useState('');

  // Data
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Actions
  const [creating, setCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [slotRes, bookingRes] = await Promise.all([
        slotsApi.list({ teacher_id: 'me' }),
        bookingsApi.list(),
      ]);
      const slotData = slotRes.data?.data || slotRes.data || [];
      const bookingData = bookingRes.data?.data || bookingRes.data || [];
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

  // Create slot
  const handleCreateSlot = async () => {
    if (!slotDate || !slotTime) return;
    setCreating(true);
    setError(null);
    try {
      const startTime = `${slotDate}T${slotTime}:00`;
      await slotsApi.create({ start_time: startTime });
      showToast('时段添加成功');
      setSlotDate('');
      setSlotTime('');
      await loadData();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || '添加时段失败，请重试';
      setError(msg);
    } finally {
      setCreating(false);
    }
  };

  // Delete slot
  const handleDeleteSlot = async () => {
    if (!deleteTarget) return;
    setActionLoading((prev) => ({ ...prev, [`delete_${deleteTarget.id}`]: true }));
    setError(null);
    try {
      await slotsApi.delete(deleteTarget.id);
      showToast('时段已删除');
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || '删除失败，请重试';
      setError(msg);
    } finally {
      setActionLoading((prev) => ({ ...prev, [`delete_${deleteTarget.id}`]: false }));
    }
  };

  // Confirm booking (teacher action)
  const handleConfirmBooking = async (booking) => {
    setActionLoading((prev) => ({ ...prev, [`confirm_${booking.id}`]: true }));
    setError(null);
    try {
      await bookingsApi.confirm(booking.id);
      showToast('预约已确认');
      await loadData();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || '确认失败，请重试';
      setError(msg);
    } finally {
      setActionLoading((prev) => ({ ...prev, [`confirm_${booking.id}`]: false }));
    }
  };

  // Complete booking
  const handleCompleteBooking = async (booking) => {
    setActionLoading((prev) => ({ ...prev, [`complete_${booking.id}`]: true }));
    setError(null);
    try {
      await bookingsApi.complete(booking.id);
      showToast('咨询已完成');
      await loadData();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || '操作失败，请重试';
      setError(msg);
    } finally {
      setActionLoading((prev) => ({ ...prev, [`complete_${booking.id}`]: false }));
    }
  };

  // Cancel booking (teacher action)
  const handleCancelBooking = async (booking) => {
    setActionLoading((prev) => ({ ...prev, [`cancel_${booking.id}`]: true }));
    setError(null);
    try {
      await bookingsApi.cancel(booking.id);
      showToast('预约已取消');
      await loadData();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || '取消失败，请重试';
      setError(msg);
    } finally {
      setActionLoading((prev) => ({ ...prev, [`cancel_${booking.id}`]: false }));
    }
  };

  if (loading) return <Loading />;

  // Group slots by date
  const slotsByDate = slots.reduce((acc, slot) => {
    const key = getDateKey(slot.start_time);
    if (!acc[key]) acc[key] = { dateStr: key, display: fmtDateStr(slot.start_time), slots: [] };
    acc[key].slots.push(slot);
    return acc;
  }, {});
  const slotDateGroups = Object.values(slotsByDate).sort((a, b) => a.dateStr.localeCompare(b.dateStr));

  const canCreateSlot = slotDate && slotTime && !creating;

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-brand-success text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-[fadeIn_0.3s_ease]">
          {toast}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-brand-text mb-2">确认删除时段</h3>
            <p className="text-sm text-brand-muted mb-4">
              确定要删除此时段吗？此操作不可撤销。
            </p>
            <p className="text-sm text-brand-text mb-5">
              {fmtDateStr(deleteTarget.start_time)} {fmtTimeRange(deleteTarget)}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={actionLoading[`delete_${deleteTarget.id}`]}
                className="flex-1 btn-secondary py-2.5"
              >
                返回
              </button>
              <button
                onClick={handleDeleteSlot}
                disabled={actionLoading[`delete_${deleteTarget.id}`]}
                className="flex-1 btn-danger py-2.5 flex items-center justify-center gap-2"
              >
                {actionLoading[`delete_${deleteTarget.id}`] ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    删除中...
                  </>
                ) : (
                  '确认删除'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && <ErrorMessage message={error} />}

      {/* Section 1: Add Slot Form */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <PlusCircle className="w-4 h-4 text-brand-accent" />
          <h3 className="text-sm font-semibold text-brand-text">新增时段</h3>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-brand-muted mb-1">日期</label>
              <input
                type="date"
                value={slotDate}
                onChange={(e) => setSlotDate(e.target.value)}
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-brand-muted mb-1">时间</label>
              <input
                type="time"
                value={slotTime}
                onChange={(e) => setSlotTime(e.target.value)}
                step="1800"
                className="input-field text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-brand-muted">
            <Clock className="w-4 h-4" />
            <span>时长：30 分钟</span>
          </div>

          <button
            onClick={handleCreateSlot}
            disabled={!canCreateSlot}
            className="w-full btn-primary flex items-center justify-center gap-2 py-3"
          >
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                添加中...
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                添加时段
              </>
            )}
          </button>
        </div>
      </div>

      {/* Section 2: My Slots */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-brand-accent" />
          <h3 className="text-sm font-semibold text-brand-text">我的可约时段</h3>
        </div>

        {slotDateGroups.length === 0 ? (
          <p className="text-sm text-brand-muted py-4 text-center">暂未发布时段，请添加可约时间。</p>
        ) : (
          <div className="space-y-4">
            {slotDateGroups.map((group) => (
              <div key={group.dateStr}>
                <p className="text-sm font-medium text-brand-text mb-2">{group.display}</p>
                <div className="space-y-2">
                  {group.slots.map((slot) => (
                    <div
                      key={slot.id}
                      className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border ${
                        slot.status === 'booked'
                          ? 'border-amber-200 bg-amber-50'
                          : 'border-brand-accent/20 bg-brand-accent-light'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Clock className="w-4 h-4 flex-shrink-0 text-brand-accent" />
                        <span className="text-sm font-medium text-brand-text">
                          {fmtTimeRange(slot)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {slot.status === 'booked' ? (
                          <>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                              已约
                            </span>
                            {slot.student_name && (
                              <span className="text-xs text-brand-muted truncate max-w-[80px]">
                                {slot.student_name}
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-brand-success font-medium">
                              可约
                            </span>
                            <button
                              onClick={() => setDeleteTarget(slot)}
                              className="p-1.5 text-brand-muted hover:text-brand-danger transition-colors rounded-lg hover:bg-brand-danger/10"
                              aria-label="删除时段"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 3: Booking Management (F-T4) */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <PhoneCall className="w-4 h-4 text-brand-accent" />
          <h3 className="text-sm font-semibold text-brand-text">预约管理</h3>
        </div>

        {bookings.length === 0 ? (
          <p className="text-sm text-brand-muted py-4 text-center">暂无预约记录</p>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => {
              const statusInfo = BOOKING_STATUS_MAP[booking.status] || BOOKING_STATUS_MAP.pending;
              return (
                <div
                  key={booking.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 rounded-xl border border-brand-border/50 bg-brand-card"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-brand-accent flex-shrink-0" />
                      <span className="text-sm font-medium text-brand-text truncate">
                        {booking.student_name || `学员${booking.student_id}`}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.class}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-brand-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {fmtTimeRange({ start_time: booking.start_time })}
                      </span>
                      {booking.group_name && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {booking.group_name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleConfirmBooking(booking)}
                          disabled={actionLoading[`confirm_${booking.id}`]}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-brand-success text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          {actionLoading[`confirm_${booking.id}`] ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <CheckCircle className="w-3 h-3" />
                          )}
                          确认
                        </button>
                        <button
                          onClick={() => handleCancelBooking(booking)}
                          disabled={actionLoading[`cancel_${booking.id}`]}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-brand-danger/10 text-brand-danger rounded-lg hover:bg-brand-danger/20 transition-colors disabled:opacity-50"
                        >
                          {actionLoading[`cancel_${booking.id}`] ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <X className="w-3 h-3" />
                          )}
                          取消
                        </button>
                      </>
                    )}

                    {booking.status === 'confirmed' && (
                      <button
                        onClick={() => handleCompleteBooking(booking)}
                        disabled={actionLoading[`complete_${booking.id}`]}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-brand-accent text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {actionLoading[`complete_${booking.id}`] ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <CheckCircle className="w-3 h-3" />
                        )}
                        完成
                      </button>
                    )}

                    {booking.status === 'completed' && (
                      <span className="flex items-center gap-1 text-xs text-brand-success font-medium">
                        <CheckCircle className="w-3.5 h-3.5" />
                        已完成
                      </span>
                    )}

                    {booking.status === 'cancelled' && (
                      <span className="text-xs text-brand-muted">已取消</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
