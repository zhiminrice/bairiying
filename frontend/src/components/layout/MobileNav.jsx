import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Database, CalendarCheck, FileText, Eye, MessageSquare, PhoneCall, CalendarClock, BarChart3, Award } from 'lucide-react';
import useAuth from '../../hooks/useAuth';

const roleConfig = {
  leader: [
    { to: '/leader', label: '工作台', icon: LayoutDashboard },
    { to: '/leader/attendance', label: '打卡', icon: CalendarCheck },
    { to: '/leader/records', label: '录入', icon: FileText },
    { to: '/leader/consultations', label: '咨询', icon: PhoneCall },
    { to: '/leader/witness', label: '见证', icon: Award },
  ],
  teacher: [
    { to: '/teacher', label: '工作台', icon: LayoutDashboard },
    { to: '/teacher/content', label: '浏览', icon: Eye },
    { to: '/teacher/comments', label: '点评', icon: MessageSquare },
    { to: '/teacher/slots', label: '咨询', icon: CalendarClock },
  ],
  admin: [
    { to: '/admin', label: '工作台', icon: LayoutDashboard },
    { to: '/admin/stats', label: '统计', icon: BarChart3 },
    { to: '/admin/witnesses', label: '见证', icon: Award },
    { to: '/admin/data', label: '数据', icon: Database },
  ],
};

export default function MobileNav() {
  const { user } = useAuth();

  const links = user ? (roleConfig[user.role] || []) : [];

  if (links.length <= 1) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-brand-card border-t border-brand-border z-40">
      <div className="flex items-center justify-around h-full max-w-lg mx-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/admin' || link.to === '/leader' || link.to === '/teacher'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg min-w-[64px] transition-colors ${
                isActive
                  ? 'text-brand-accent'
                  : 'text-brand-muted'
              }`
            }
          >
            <link.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{link.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
