import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import {
  Users,
  UserCog,
  GraduationCap,
  BookOpen,
  BarChart3,
  CalendarCheck,
  Award,
  Clock,
  ArrowRight,
} from 'lucide-react';

const quickAccess = [
  { icon: UserCog, title: '用户管理', to: '/admin/users', description: '管理系统用户与权限' },
  { icon: Users, title: '小组管理', to: '/admin/users', description: '管理实践小组信息' },
  { icon: GraduationCap, title: '学员管理', to: '/admin/users', description: '管理百日在修学员' },
  { icon: BookOpen, title: '课程管理', to: '/admin/data', description: '管理课程与基础数据' },
];

const comingFeatures = [
  { icon: BarChart3, title: '数据总览', description: '全景数据看板与统计分析' },
  { icon: CalendarCheck, title: '出勤统计', description: '学员出勤与打卡统计分析' },
  { icon: Award, title: '见证墙管理', description: '审核管理学员见证墙投稿' },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const totalGroups = user?.totalGroups || 0;
  const totalStudents = user?.totalStudents || 0;
  const totalUsers = user?.totalUsers || 0;

  const stats = [
    { label: '小组数', value: totalGroups, colorClass: 'bg-brand-accent-light text-brand-accent' },
    { label: '学员数', value: totalStudents, colorClass: 'bg-brand-success/10 text-brand-success' },
    { label: '用户数', value: totalUsers, colorClass: 'bg-brand-warning/10 text-brand-warning' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-brand-accent-light flex items-center justify-center text-brand-accent text-lg font-semibold">
          {(user?.name || user?.account || '?').charAt(0)}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-brand-text">
            你好，{user?.name || user?.account}
          </h2>
          <p className="text-sm text-brand-muted">管理员工作台</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="card !p-4 text-center">
            <div
              className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${stat.colorClass} mb-2`}
            >
              <span className="text-lg font-bold">{stat.value}</span>
            </div>
            <p className="text-xs text-brand-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-base font-semibold text-brand-text mb-3">快速访问</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickAccess.map((item) => (
            <button
              key={item.title}
              onClick={() => navigate(item.to)}
              className="card !p-4 text-left hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-brand-accent-light flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-brand-accent" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-medium text-brand-text">{item.title}</h4>
                    <p className="text-xs text-brand-muted mt-0.5">{item.description}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-brand-muted group-hover:text-brand-accent group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" />
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-brand-warning" />
          <h3 className="text-base font-semibold text-brand-text">即将上线</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {comingFeatures.map((feature) => (
            <div
              key={feature.title}
              className="card !p-4 opacity-80 hover:opacity-100 transition-opacity cursor-default"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-brand-accent-light flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-brand-accent" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-medium text-brand-text mb-0.5">
                    {feature.title}
                  </h4>
                  <p className="text-xs text-brand-muted leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
