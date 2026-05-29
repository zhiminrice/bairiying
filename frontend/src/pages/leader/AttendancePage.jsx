import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Users, Save, Calendar, ChevronDown } from 'lucide-react';
import { studentsApi, attendanceApi } from '../../api/leader';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getDateFromStr(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function fmtDateDisplay(str) {
  const d = getDateFromStr(str);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const w = weekdays[d.getDay()];
  return `${m}月${day}日 周${w}`;
}

export default function AttendancePage() {
  const today = formatDate(new Date());

  const [date, setDate] = useState(today);
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [progress, setProgress] = useState({ present: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [expandedNotes, setExpandedNotes] = useState({});

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const loadData = useCallback(async (targetDate) => {
    setLoading(true);
    setError(null);
    try {
      const [studentRes, attendanceRes, progressRes] = await Promise.all([
        studentsApi.list(),
        attendanceApi.list({ date: targetDate }),
        attendanceApi.todayProgress({ date: targetDate }),
      ]);

      const studentData = studentRes.data?.data || studentRes.data || [];
      const attendanceData = attendanceRes.data?.data || attendanceRes.data || [];
      const progressData = progressRes.data?.data || progressRes.data || {};

      setStudents(studentData);

      const map = {};
      studentData.forEach((s) => {
        map[s.id] = { status: 'absent', note: '' };
      });
      attendanceData.forEach((r) => {
        if (map[r.student_id] !== undefined) {
          map[r.student_id] = {
            status: r.status || 'absent',
            note: r.note || '',
          };
        }
      });
      setAttendanceMap(map);
      setProgress({
        present: progressData.present || 0,
        total: progressData.total || studentData.length,
      });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || '加载数据失败';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(date);
  }, [date, loadData]);

  const toggleStatus = (studentId) => {
    setAttendanceMap((prev) => {
      const cur = prev[studentId];
      if (!cur) return prev;
      const newStatus = cur.status === 'present' ? 'absent' : 'present';
      const updated = { ...prev, [studentId]: { ...cur, status: newStatus } };
      const presentCount = Object.values(updated).filter((r) => r.status === 'present').length;
      setProgress({ present: presentCount, total: students.length });
      return updated;
    });
  };

  const updateNote = (studentId, note) => {
    setAttendanceMap((prev) => {
      const cur = prev[studentId];
      if (!cur) return prev;
      return { ...prev, [studentId]: { ...cur, note } };
    });
  };

  const toggleNoteExpanded = (studentId) => {
    setExpandedNotes((prev) => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  const markAllPresent = () => {
    setAttendanceMap((prev) => {
      const updated = {};
      Object.keys(prev).forEach((id) => {
        updated[id] = { ...prev[id], status: 'present' };
      });
      return updated;
    });
    setProgress({ present: students.length, total: students.length });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const records = students.map((s) => ({
        student_id: s.id,
        date,
        status: attendanceMap[s.id]?.status || 'absent',
        note: attendanceMap[s.id]?.note || '',
      }));
      await attendanceApi.create({ records, date });
      showToast('打卡记录保存成功');
      loadData(date);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || '保存失败，请重试';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const changeDate = (delta) => {
    const current = getDateFromStr(date);
    current.setDate(current.getDate() + delta);
    setDate(formatDate(current));
  };

  const presentCount = Object.values(attendanceMap).filter((r) => r.status === 'present').length;
  const pct = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

  if (loading) return <Loading />;

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-brand-success text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-[fadeIn_0.3s_ease]">
          {toast}
        </div>
      )}

      {/* Date Header */}
      <div className="card !p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => changeDate(-1)}
            className="p-2 rounded-lg hover:bg-brand-border/50 text-brand-muted hover:text-brand-text transition-colors"
            aria-label="前一天"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-brand-text">
            <Calendar className="w-4 h-4 text-brand-accent" />
            <span className="text-base font-semibold">{fmtDateDisplay(date)}</span>
          </div>
          <button
            onClick={() => changeDate(1)}
            className="p-2 rounded-lg hover:bg-brand-border/50 text-brand-muted hover:text-brand-text transition-colors"
            aria-label="后一天"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && <ErrorMessage message={error} />}

      {/* Progress */}
      <div className="card !p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-brand-accent" />
          <span className="text-sm text-brand-muted">今日打卡</span>
          <span className="text-lg font-bold text-brand-text ml-auto">
            {presentCount}/{students.length} 人
          </span>
        </div>
        <div className="w-full h-2.5 bg-brand-border/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-accent rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-brand-muted mt-2 text-right">{pct}% 完成</p>
      </div>

      {/* Student List */}
      {students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="暂无学员"
          description="该小组还没有分配学员，请联系管理员添加学员。"
        />
      ) : (
        <div className="space-y-2">
          {students.map((student) => {
            const record = attendanceMap[student.id];
            const status = record?.status || 'absent';
            const isPresent = status === 'present';
            const noteExpanded = expandedNotes[student.id];

            return (
              <div
                key={student.id}
                className={`card !p-0 overflow-hidden transition-all duration-200 ${
                  isPresent
                    ? 'border-brand-success/40 bg-brand-success/5'
                    : 'border-brand-border/50 bg-brand-card'
                }`}
              >
                <button
                  onClick={() => toggleStatus(student.id)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 min-h-[52px] text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-text truncate">
                      {student.name || student.display_name || `学员${student.id}`}
                    </p>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      isPresent
                        ? 'bg-brand-success text-white'
                        : 'bg-brand-border/60 text-brand-muted'
                    }`}
                  >
                    {isPresent ? (
                      <CheckCircle className="w-3.5 h-3.5" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5" />
                    )}
                    {isPresent ? '已到' : '未到'}
                  </div>
                </button>

                {/* Expandable note */}
                <button
                  onClick={() => toggleNoteExpanded(student.id)}
                  className="w-full flex items-center justify-center gap-1 py-2 text-xs text-brand-muted hover:text-brand-accent transition-colors border-t border-brand-border/30"
                >
                  <span>{record?.note ? `备注: ${record.note}` : '添加备注'}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${noteExpanded ? 'rotate-180' : ''}`}
                  />
                </button>

                {noteExpanded && (
                  <div className="px-4 pb-3">
                    <textarea
                      value={record?.note || ''}
                      onChange={(e) => updateNote(student.id, e.target.value)}
                      placeholder="输入备注信息（选填）"
                      rows={2}
                      className="input-field text-sm resize-none"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Action Buttons */}
      {students.length > 0 && (
        <div className="space-y-3 pt-2">
          <button
            onClick={markAllPresent}
            className="w-full btn-secondary flex items-center justify-center gap-2 py-3"
          >
            <CheckCircle className="w-4 h-4" />
            一键全部到
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full btn-primary flex items-center justify-center gap-2 py-3"
          >
            <Save className="w-4 h-4" />
            {saving ? '保存中...' : '保存打卡记录'}
          </button>
        </div>
      )}
    </div>
  );
}
