import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import {
  Users,
  UserCog,
  BarChart3,
  Award,
  Database,
  TrendingUp,
  CalendarCheck,
  GraduationCap,
} from 'lucide-react';
import { adminStatsApi } from '../../api/admin';
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

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await adminStatsApi.overview();
        const data = res.data?.data || res.data || {};
        setOverview(data);
      } catch (err) {
        setError(err.response?.data?.message || '加载数据失败');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="card text-center py-12">
          <p className="text-brand-danger text-sm mb-3">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-brand-accent hover:underline"
          >
            点击重试
          </button>
        </div>
      </div>
    );
  }

  const groupCount = overview?.groups_count ?? 0;
  const studentCount = overview?.students_count ?? 0;
  const weeklyRate = overview?.week_attendance_rate ?? 0;
  const assignmentRate = overview?.assignment_rate ?? 0;
  const groups = Array.isArray(overview?.group_stats) ? overview.group_stats : [];

  const statCards = [
    {
      label: '小组数',
      value: groupCount,
      icon: Users,
      colorClass: 'bg-brand-accent-light text-brand-accent',
    },
    {
      label: '学员数',
      value: studentCount,
      icon: GraduationCap,
      colorClass: 'bg-brand-success/10 text-brand-success',
    },
    {
      label: '全营打卡率(本周)',
      value: `${weeklyRate}%`,
      icon: TrendingUp,
      colorClass: 'bg-brand-warning/10 text-brand-warning',
    },
    {
      label: '作业提交率',
      value: `${assignmentRate}%`,
      icon: CalendarCheck,
      colorClass: 'bg-brand-danger/10 text-brand-danger',
    },
  ];

  const quickActions = [
    { icon: BarChart3, label: '出勤统计', path: '/admin/stats', color: 'text-brand-accent bg-brand-accent-light' },
    { icon: Award, label: '见证墙管理', path: '/admin/witnesses', color: 'text-brand-success bg-brand-success/10' },
    { icon: UserCog, label: '用户管理', path: '/admin/users', color: 'text-brand-warning bg-brand-warning/10' },
    { icon: Database, label: '基础数据', path: '/admin/data', color: 'text-brand-danger bg-brand-danger/10' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-6">
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

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map((stat) => (
          <div key={stat.label} className="card !p-4 text-center">
            <div
              className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${stat.colorClass} mb-2`}
            >
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-xl font-bold text-brand-text">{stat.value}</p>
            <p className="text-xs text-brand-muted mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Group Comparison */}
      {groups.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-brand-text mb-3">小组对比</h3>
          <div className="space-y-3">
            {groups.map((g) => {
              const pct = g.today_attendance_rate ?? 0;
              return (
                <div key={g.id || g.name} className="card !p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-brand-text">
                      {g.name}
                    </span>
                    <span className="text-xs text-brand-muted">
                      {g.student_count ?? 0} 学员
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-brand-border/50 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-accent transition-all duration-500"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-brand-text w-10 text-right">
                      {pct}%
                    </span>
                  </div>
                  <p className="text-xs text-brand-muted mt-1">今日出勤率</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-semibold text-brand-text mb-3">快捷操作</h3>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="card !p-4 text-left hover:shadow-md transition-shadow group active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${action.color}`}
                >
                  <action.icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-brand-text group-hover:text-brand-accent transition-colors">
                  {action.label}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
