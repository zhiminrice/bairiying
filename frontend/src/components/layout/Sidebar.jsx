import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Database,
  GraduationCap,
  CalendarCheck,
  ClipboardList,
  FileText,
  Eye,
  MessageSquare,
  PhoneCall,
  CalendarClock,
  BarChart3,
  Award,
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';

const roleConfig = {
  leader: [
    { to: '/leader', label: '工作台', icon: LayoutDashboard },
    { to: '/leader/attendance', label: '每日打卡', icon: CalendarCheck },
    { to: '/leader/assignments', label: '作业登记', icon: ClipboardList },
    { to: '/leader/records', label: '内容录入', icon: FileText },
    { to: '/leader/consultations', label: '咨询预约', icon: PhoneCall },
    { to: '/leader/witness', label: '见证墙投稿', icon: Award },
  ],
  teacher: [
    { to: '/teacher', label: '工作台', icon: LayoutDashboard },
    { to: '/teacher/content', label: '内容浏览', icon: Eye },
    { to: '/teacher/comments', label: '我的点评', icon: MessageSquare },
    { to: '/teacher/slots', label: '咨询管理', icon: CalendarClock },
  ],
  admin: [
    { to: '/admin', label: '工作台', icon: LayoutDashboard },
    { to: '/admin/stats', label: '数据统计', icon: BarChart3 },
    { to: '/admin/witnesses', label: '见证墙管理', icon: Award },
    { to: '/admin/data', label: '基础数据', icon: Database },
  ],
};

export default function Sidebar() {
  const { user } = useAuth();

  const links = user ? (roleConfig[user.role] || []) : [];

  return (
    <aside className="hidden md:flex md:flex-col md:w-60 md:fixed md:inset-y-0 md:left-0 bg-brand-card border-r border-brand-border z-40">
      <div className="h-14 flex items-center px-5 border-b border-brand-border">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-brand-accent" />
          <span className="text-base font-semibold text-brand-text">百日营</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/admin' || link.to === '/leader' || link.to === '/teacher'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-accent-light text-brand-accent'
                  : 'text-brand-muted hover:bg-brand-border/50 hover:text-brand-text'
              }`
            }
          >
            <link.icon className="w-5 h-5 flex-shrink-0" />
            {link.label}
          </NavLink>
        ))}
      </nav>

      {user && (
        <div className="px-5 py-3 border-t border-brand-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-accent-light flex items-center justify-center text-brand-accent text-sm font-medium">
              {(user.name || user.account || '?').charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-brand-text truncate">
                {user.name || user.account}
              </p>
              <p className="text-xs text-brand-muted capitalize">
                {user.role === 'leader' ? '组长' : user.role === 'teacher' ? '老师' : user.role === 'admin' ? '管理员' : user.role}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
