import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import {
  Users,
  Eye,
  MessageSquare,
  CalendarClock,
  Clock,
  ChevronRight,
  FileText,
  BookOpen,
  Edit3,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { contentApi, teacherStatsApi, studentsApi } from '../../api/teacher';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';

/* ──────────── helpers ──────────── */
const GREETINGS = ['早上好', '上午好', '中午好', '下午好', '晚上好'];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return GREETINGS[4];
  if (h < 9) return GREETINGS[0];
  if (h < 12) return GREETINGS[1];
  if (h < 14) return GREETINGS[2];
  if (h < 18) return GREETINGS[3];
  return GREETINGS[4];
}

function formatDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const w = weekdays[d.getDay()];
  return `${y}年${m}月${day}日 周${w}`;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const TYPE_BADGE = {
  harvest: { label: '课程收获', bg: 'bg-brand-success/10', text: 'text-brand-success', icon: BookOpen },
  diary: { label: '内省日记', bg: 'bg-brand-accent-light', text: 'text-brand-accent', icon: Edit3 },
  action: { label: '行动分享', bg: 'bg-brand-warning/10', text: 'text-brand-warning', icon: FileText },
};

/* ──────────── component ──────────── */
export default function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    unReviewedCount: 0,
    totalStudents: 0,
    todayNewCount: 0,
  });
  const [recentRecords, setRecentRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError('');
      try {
        const today = todayStr();

        const [unReviewedRes, studentsRes, todayRes, recentRes] = await Promise.allSettled([
          contentApi.list({ commented: false, limit: 1 }),
          studentsApi.list({ limit: 1 }),
          contentApi.list({ date_from: today, date_to: today, limit: 1 }),
          contentApi.list({ commented: false, limit: 5 }),
        ]);

        // Un-reviewed count
        let unReviewedCount = 0;
        if (unReviewedRes.status === 'fulfilled') {
          const d = unReviewedRes.value.data;
          unReviewedCount = d?.total || d?.count || (Array.isArray(d?.data) ? d.data.length : Array.isArray(d) ? d.length : 0);
        }

        // Total students
        let totalStudents = 0;
        if (studentsRes.status === 'fulfilled') {
          const d = studentsRes.value.data;
          totalStudents = d?.total || d?.count || (Array.isArray(d?.data) ? d.data.length : Array.isArray(d) ? d.length : 0);
        }

        // Today new
        let todayNewCount = 0;
        if (todayRes.status === 'fulfilled') {
          const d = todayRes.value.data;
          todayNewCount = d?.total || d?.count || (Array.isArray(d?.data) ? d.data.length : Array.isArray(d) ? d.length : 0);
        }

        // Recent un-reviewed
        let recent = [];
        if (recentRes.status === 'fulfilled') {
          const d = recentRes.value.data;
          const list = d?.data || d?.records || d || [];
          recent = Array.isArray(list) ? list.slice(0, 5) : [];
        }

        setStats({ unReviewedCount, totalStudents, todayNewCount });
        setRecentRecords(recent);
      } catch (err) {
        console.error('Dashboard load error:', err);
        setError('加载工作台数据失败，请刷新重试。');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-6">
      {/* ── Greeting ── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-brand-accent-light flex items-center justify-center text-brand-accent text-lg font-semibold">
          {(user?.name || user?.account || '?').charAt(0)}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-brand-text">
            {getGreeting()}，{user?.name || user?.account}
          </h2>
          <p className="text-sm text-brand-muted">{formatDate()}</p>
        </div>
      </div>

      {/* ── Error ── */}
      {error && <ErrorMessage message={error} />}

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-3 gap-3">
        {/* Un-reviewed */}
        <button
          onClick={() => navigate('/teacher/content')}
          className="card !p-3 text-center cursor-pointer hover:shadow-md hover:border-brand-warning/30 transition-all active:scale-[0.98]"
        >
          <div className="w-8 h-8 rounded-lg bg-brand-warning/10 flex items-center justify-center mx-auto mb-2">
            <MessageSquare className="w-4 h-4 text-brand-warning" />
          </div>
          <p className={`text-xl font-bold ${stats.unReviewedCount > 0 ? 'text-brand-warning' : 'text-brand-text'}`}>
            {stats.unReviewedCount}
          </p>
          <p className="text-xs text-brand-muted">待点评内容</p>
        </button>

        {/* Total students */}
        <div className="card !p-3 text-center">
          <div className="w-8 h-8 rounded-lg bg-brand-accent-light flex items-center justify-center mx-auto mb-2">
            <Users className="w-4 h-4 text-brand-accent" />
          </div>
          <p className="text-xl font-bold text-brand-text">{stats.totalStudents}</p>
          <p className="text-xs text-brand-muted">全营学员</p>
        </div>

        {/* Today new */}
        <div className="card !p-3 text-center">
          <div className="w-8 h-8 rounded-lg bg-brand-success/10 flex items-center justify-center mx-auto mb-2">
            <Edit3 className="w-4 h-4 text-brand-success" />
          </div>
          <p className="text-xl font-bold text-brand-text">{stats.todayNewCount}</p>
          <p className="text-xs text-brand-muted">今日新增</p>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <h3 className="text-sm font-semibold text-brand-text mb-3">快捷操作</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => navigate('/teacher/content')}
            className="card !p-4 cursor-pointer hover:shadow-md hover:border-brand-accent/30 transition-all active:scale-[0.98] flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-lg bg-brand-accent-light flex items-center justify-center flex-shrink-0">
              <Eye className="w-5 h-5 text-brand-accent" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-sm font-medium text-brand-text">浏览学员内容</p>
              <p className="text-xs text-brand-muted">查看与点评学员学习记录</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/teacher/content?commented=true')}
            className="card !p-4 cursor-pointer hover:shadow-md hover:border-brand-success/30 transition-all active:scale-[0.98] flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-lg bg-brand-success/10 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-5 h-5 text-brand-success" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-sm font-medium text-brand-text">已点评内容</p>
              <p className="text-xs text-brand-muted">回顾已完成点评的记录</p>
            </div>
          </button>

          <div className="card !p-4 opacity-60 cursor-not-allowed flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-warning/10 flex items-center justify-center flex-shrink-0">
              <CalendarClock className="w-5 h-5 text-brand-warning" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-sm font-medium text-brand-text">咨询时段管理</p>
              <p className="text-xs text-brand-muted">即将上线</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent Activity ── */}
      {recentRecords.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-brand-text flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-accent" />
              待点评动态
            </h3>
            <button
              onClick={() => navigate('/teacher/content')}
              className="flex items-center gap-1 text-xs text-brand-accent hover:underline"
            >
              查看全部
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {recentRecords.map((r) => {
              const typeInfo = TYPE_BADGE[r.type] || TYPE_BADGE.harvest;
              return (
                <div
                  key={r.id}
                  onClick={() => navigate('/teacher/content')}
                  className="card !p-3 flex items-start gap-3 cursor-pointer hover:shadow-md hover:border-brand-warning/30 transition-all active:scale-[0.99]"
                >
                  <typeInfo.icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${typeInfo.text}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-brand-text truncate">
                        {r.student_name || `学员${r.student_id}`}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${typeInfo.bg} ${typeInfo.text}`}>
                        {typeInfo.label}
                      </span>
                    </div>
                    <p className="text-xs text-brand-muted mt-0.5 line-clamp-1">
                      {r.content || '（无内容）'}
                    </p>
                    {r.date && (
                      <p className="text-xs text-brand-muted/70 mt-0.5">{r.date}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Fallback when no recent records ── */}
      {!loading && !error && recentRecords.length === 0 && (
        <div className="card !p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-brand-accent-light flex items-center justify-center mx-auto mb-3">
            <Eye className="w-6 h-6 text-brand-accent" />
          </div>
          <p className="text-sm font-medium text-brand-text mb-1">暂无待点评内容</p>
          <p className="text-xs text-brand-muted mb-4">所有学员的内容都已完成点评</p>
          <button
            onClick={() => navigate('/teacher/content?commented=true')}
            className="text-xs text-brand-accent hover:underline"
          >
            查看已点评内容
          </button>
        </div>
      )}
    </div>
  );
}
