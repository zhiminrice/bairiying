import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, LogIn } from 'lucide-react';
import useAuth from '../hooks/useAuth';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!account.trim()) {
      setError('请输入手机号或邮箱');
      return;
    }
    if (!password.trim()) {
      setError('请输入密码');
      return;
    }

    setSubmitting(true);
    try {
      const user = await login(account.trim(), password);
      if (user.role === 'leader') {
        navigate('/leader', { replace: true });
      } else if (user.role === 'teacher') {
        navigate('/teacher', { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        '登录失败，请检查账号和密码';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-accent-light mb-5">
            <GraduationCap className="w-9 h-9 text-brand-accent" />
          </div>
          <h1 className="text-xl font-bold text-brand-text mb-1.5">
            AI时代为人父母·百日实践营
          </h1>
          <p className="text-sm text-brand-muted">学员管理系统</p>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="flex-1 h-px bg-brand-border" />
          <span className="text-xs text-brand-muted">登录入口</span>
          <div className="flex-1 h-px bg-brand-border" />
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-brand-text mb-1.5">
                手机号 / 邮箱
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="请输入手机号或邮箱"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                disabled={submitting}
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-text mb-1.5">
                密码
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-text transition-colors"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-brand-danger bg-brand-danger/5 rounded-lg px-3 py-2.5">
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full flex items-center justify-center gap-2"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>登录中...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>登录</span>
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-brand-muted mt-6">
          如需账号请联系管理员
        </p>
      </div>
    </div>
  );
}
