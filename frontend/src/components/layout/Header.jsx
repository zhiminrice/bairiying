import { LogOut, Menu } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function Header({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-brand-card border-b border-brand-border h-14 flex items-center justify-between px-4 sticky top-0 z-30 md:ml-60">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 -ml-2 rounded-lg hover:bg-brand-border/50 text-brand-text"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold text-brand-text">百日营管理系统</h1>
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <span className="text-sm text-brand-muted hidden sm:block">
            {user.name || user.account}
          </span>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-danger transition-colors px-2 py-1 rounded-lg hover:bg-brand-danger/5"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">退出</span>
        </button>
      </div>
    </header>
  );
}
