import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import {
  Users,
  CalendarCheck,
  ClipboardList,
  FileText,
  PhoneCall,
  Award,
  Clock,
  TrendingUp,
  AlertTriangle,
  BookOpen,
  Edit3,
  ChevronRight,
} from 'lucide-react';
import { statsApi, recordsApi } from '../../api/leader';
import Loading from '../../components/common/Loading';

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

export default function LeaderDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [recentRecords, setRecentRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [statsRes, recordsRes] = await Promise.all([
          statsApi.leaderDashboard(),
          recordsApi.list({ limit: 5 }),
        ]);
        const stats = statsRes.data?.data || statsRes.data || {};
        const records = recordsRes.data?.data || recordsRes.data || [];
        setDashboardData(stats);
        setRecentRecords(Array.isArray(records) ? records.slice(0, 5) : []);
      } catch {
        setApiError(true);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  if (loading) return <Loading />;

  const groupName = user?.groupName || '我的小组';
  const studentCount = dashboardData?.students_count ?? user?.studentCount ?? 0;
  const todayAttendance = dashboardData?.today_attendance || { present: 0, total: 0 };
  const weeklyRate = dashboardData?.week_attendance_rate ?? 0;
  const missedStudents = dashboardData?.broken_streak || [];

  const quickActions = [
    { icon: CalendarCheck, label: '每日打卡', path: '/leader/attendance', color: 'text-brand-accent bg-brand-accent-light' },
    { icon: ClipboardList, label: '作业登记', path: '/leader/assignments', color: 'text-brand-success bg-brand-success/10' },
    { icon: Edit3, label: '内容录入', path: '/leader/records', color: 'text-brand-warning bg-brand-warning/10' },
    { icon: Award, label: '见证墙投稿', path: '/leader/witness', color: 'text-brand-accent bg-brand-accent-light' },
    { icon: PhoneCall, label: '咨询预约', path: '/leader/consultations', color: 'text-brand-danger bg-brand-danger/10' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-6">
      {/* Greeting */}
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

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card !p-3 text-center">
          <div className="w-8 h-8 rounded-lg bg-brand-accent-light flex items-center justify-center mx-auto mb-2">
            <Users className="w-4 h-4 text-brand-accent" />
          </div>
          <p className="text-xl font-bold text-brand-text">{studentCount}</p>
          <p className="text-xs text-brand-muted">本组学员</p>
        </div>
        <div className="card !p-3 text-center">
          <div className="w-8 h-8 rounded-lg bg-brand-success/10 flex items-center justify-center mx-auto mb-2">
            <CalendarCheck className="w-4 h-4 text-brand-success" />
          </div>
          <p className="text-xl font-bold text-brand-text">
            {todayAttendance.present}/{todayAttendance.total}
          </p>
          <p className="text-xs text-brand-muted">今日打卡</p>
        </div>
        <div className="card !p-3 text-center">
          <div className="w-8 h-8 rounded-lg bg-brand-warning/10 flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="w-4 h-4 text-brand-warning" />
          </div>
          <p className="text-xl font-bold text-brand-text">{weeklyRate}%</p>
          <p className="text-xs text-brand-muted">本周打卡率</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-semibold text-brand-text mb-3">快捷操作</h3>
        <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => action.path && navigate(action.path)}
              disabled={!action.path}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all active:scale-[0.98] ${
                action.path
                  ? 'bg-brand-card border border-brand-border/50 shadow-sm hover:shadow-md hover:border-brand-accent/30'
                  : 'bg-brand-card/50 border border-brand-border/30 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${action.color}`}>
                <action.icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-brand-text">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Missed Students Alert */}
      {missedStudents.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-brand-text mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-brand-danger" />
            断卡提醒
          </h3>
          <div className="space-y-2">
            {missedStudents.map((s) => (
              <div
                key={s.id || s.student_id}
                className="card !p-3 flex items-center gap-3 border-brand-danger/30 bg-brand-danger/5"
              >
                <div className="w-2 h-2 rounded-full bg-brand-danger flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-text truncate">
                    {s.name || `学员${s.student_id}`}
                  </p>
                  <p className="text-xs text-brand-danger">
                    连续缺卡 {s.missedDays || 3}+ 天
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {recentRecords.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-brand-text flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-accent" />
              最近动态
            </h3>
            <button
              onClick={() => navigate('/leader/records')}
              className="flex items-center gap-1 text-xs text-brand-accent hover:underline"
            >
              查看全部
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {recentRecords.map((r) => {
              const typeLabels = { harvest: '课程收获', diary: '内省日记', action: '行动分享' };
              return (
                <div key={r.id} className="card !p-3 flex items-start gap-3">
                  {r.type === 'harvest' ? (
                    <BookOpen className="w-4 h-4 text-brand-accent flex-shrink-0 mt-0.5" />
                  ) : r.type === 'diary' ? (
                    <Edit3 className="w-4 h-4 text-brand-success flex-shrink-0 mt-0.5" />
                  ) : (
                    <Edit3 className="w-4 h-4 text-brand-warning flex-shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-brand-text truncate">
                        {r.student_name || `学员${r.student_id}`}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-brand-accent-light text-brand-accent">
                        {typeLabels[r.type] || r.type}
                      </span>
                    </div>
                    <p className="text-xs text-brand-muted mt-0.5 line-clamp-1">
                      {r.content}
                    </p>
                    <p className="text-xs text-brand-muted/70 mt-0.5">{r.date}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fallback: show old placeholder content if API failed */}
      {apiError && (
        <>
          <div className="card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-brand-success/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-brand-success" />
              </div>
              <p className="text-sm text-brand-muted">{groupName}</p>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-brand-text">{studentCount}</span>
              <span className="text-sm text-brand-muted">本组学员</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-brand-warning" />
              <h3 className="text-base font-semibold text-brand-text">快速导航</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: CalendarCheck, title: '每日打卡', desc: '登记每日学员出勤', path: '/leader/attendance' },
                { icon: ClipboardList, title: '作业登记', desc: '追踪学员作业完成情况', path: '/leader/assignments' },
                { icon: FileText, title: '内容录入', desc: '录入学员学习记录', path: '/leader/records' },
                { icon: PhoneCall, title: '咨询预约', desc: '管理咨询预约安排', path: '/leader/consultations' },
              ].map((item) => (
                <button
                  key={item.title}
                  onClick={() => item.path && navigate(item.path)}
                  disabled={!item.path}
                  className={`card !p-4 transition-all ${
                    item.path ? 'cursor-pointer hover:shadow-md active:scale-[0.98]' : 'opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-brand-accent-light flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-brand-accent" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-medium text-brand-text mb-0.5">{item.title}</h4>
                      <p className="text-xs text-brand-muted leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
