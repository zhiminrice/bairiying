import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Download,
  TrendingUp,
  ChevronDown,
  RefreshCw,
  CalendarCheck,
} from 'lucide-react';
import { adminStatsApi, attendanceApi } from '../../api/admin';
import Loading from '../../components/common/Loading';

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function StatsPage() {
  const [tab, setTab] = useState('course');
  const [courseRates, setCourseRates] = useState([]);
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [courseError, setCourseError] = useState(null);

  const [attendRecords, setAttendRecords] = useState([]);
  const [loadingAttend, setLoadingAttend] = useState(true);
  const [attendError, setAttendError] = useState(null);
  const [dateFilter, setDateFilter] = useState('');
  const [exporting, setExporting] = useState(false);

  const loadCourseRates = useCallback(async () => {
    try {
      setLoadingCourse(true);
      setCourseError(null);
      const res = await adminStatsApi.courseAttendanceRate();
      const data = res.data?.data || res.data || [];
      setCourseRates(Array.isArray(data) ? data : []);
    } catch (err) {
      setCourseError(err.response?.data?.message || '加载课程出勤率失败');
    } finally {
      setLoadingCourse(false);
    }
  }, []);

  const loadAttendRecords = useCallback(async () => {
    try {
      setLoadingAttend(true);
      setAttendError(null);
      const params = {};
      if (dateFilter) params.date = dateFilter;
      const res = await attendanceApi.list(params);
      const data = res.data?.data || res.data || [];
      setAttendRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      setAttendError(err.response?.data?.message || '加载打卡记录失败');
    } finally {
      setLoadingAttend(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    loadCourseRates();
  }, [loadCourseRates]);

  useEffect(() => {
    loadAttendRecords();
  }, [loadAttendRecords]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const res = await adminStatsApi.exportAttendance();
      const disposition = res.headers['content-disposition'];
      let filename = 'attendance.csv';
      if (disposition) {
        const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
          filename = match[1].replace(/['"]/g, '');
        }
      }
      downloadBlob(res.data, filename);
    } catch (err) {
      alert(err.response?.data?.message || '导出失败');
    } finally {
      setExporting(false);
    }
  };

  const maxRate = courseRates.length > 0
    ? Math.max(...courseRates.map((c) => c.rate ?? 0), 1)
    : 100;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-brand-accent-light flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-brand-accent" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-brand-text">数据统计</h2>
          <p className="text-sm text-brand-muted">出勤率统计与导出</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-brand-border/30 rounded-lg p-0.5">
        {[
          { key: 'course', label: '课程出勤率' },
          { key: 'daily', label: '每日打卡记录' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-brand-card text-brand-accent shadow-sm'
                : 'text-brand-muted hover:text-brand-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Course Attendance Rate Tab */}
      {tab === 'course' && (
        <section>
          {loadingCourse ? (
            <Loading />
          ) : courseError ? (
            <div className="card text-center py-8">
              <p className="text-brand-danger text-sm mb-3">{courseError}</p>
              <button
                onClick={loadCourseRates}
                className="inline-flex items-center gap-1.5 text-sm text-brand-accent hover:underline"
              >
                <RefreshCw className="w-4 h-4" />
                重试
              </button>
            </div>
          ) : courseRates.length === 0 ? (
            <div className="card text-center py-8">
              <TrendingUp className="w-8 h-8 text-brand-muted mx-auto mb-2" />
              <p className="text-sm text-brand-muted">暂无课程数据</p>
            </div>
          ) : (
            <div className="space-y-3">
              {courseRates.map((c, idx) => {
                const rate = c.rate ?? 0;
                const present = c.present ?? 0;
                const total = c.total ?? 0;
                const barColor =
                  rate >= 80
                    ? 'bg-brand-success'
                    : rate >= 60
                    ? 'bg-brand-warning'
                    : 'bg-brand-danger';
                return (
                  <div key={c.id || idx} className="card !p-4">
                    <div className="flex items-baseline justify-between mb-2">
                      <div>
                        <span className="text-xs text-brand-muted">
                          第{c.week_no}周
                        </span>
                        <h4 className="text-sm font-medium text-brand-text mt-0.5">
                          {c.title || `课程 #${c.week_no}`}
                        </h4>
                      </div>
                      <span className="text-lg font-bold text-brand-text">
                        {rate}%
                      </span>
                    </div>
                    <div className="bg-brand-border/30 rounded-full h-3 overflow-hidden mb-1.5">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                        style={{ width: `${Math.min((rate / maxRate) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-brand-muted">
                        到课 {present}/{total} 人
                      </span>
                      {c.date && (
                        <span className="text-xs text-brand-muted">{c.date}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Daily Attendance Tab */}
      {tab === 'daily' && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-card text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
                placeholder="选择日期筛选"
              />
            </div>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-accent text-white text-sm font-medium hover:bg-brand-accent/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              {exporting ? '导出中...' : '导出CSV'}
            </button>
          </div>

          {loadingAttend ? (
            <Loading />
          ) : attendError ? (
            <div className="card text-center py-8">
              <p className="text-brand-danger text-sm mb-3">{attendError}</p>
              <button
                onClick={loadAttendRecords}
                className="inline-flex items-center gap-1.5 text-sm text-brand-accent hover:underline"
              >
                <RefreshCw className="w-4 h-4" />
                重试
              </button>
            </div>
          ) : attendRecords.length === 0 ? (
            <div className="card text-center py-8">
              <CalendarCheck className="w-8 h-8 text-brand-muted mx-auto mb-2" />
              <p className="text-sm text-brand-muted">暂无打卡记录</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-border">
                      <th className="text-left py-3 px-4 font-medium text-brand-muted whitespace-nowrap">
                        学员
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-brand-muted whitespace-nowrap">
                        小组
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-brand-muted whitespace-nowrap">
                        日期
                      </th>
                      <th className="text-center py-3 px-4 font-medium text-brand-muted whitespace-nowrap">
                        状态
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendRecords.map((r, idx) => {
                      const present = r.status === 'present';
                      return (
                        <tr
                          key={r.id || idx}
                          className="border-b border-brand-border/50 hover:bg-brand-border/20"
                        >
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="text-brand-text font-medium">
                              {r.student_name || `学员${r.student_id}`}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="text-brand-muted">
                              {r.group_name || '-'}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="text-brand-muted">{r.date}</span>
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                present
                                  ? 'bg-brand-success/10 text-brand-success'
                                  : 'bg-brand-danger/10 text-brand-danger'
                              }`}
                            >
                              {present ? '已打卡' : '缺勤'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
