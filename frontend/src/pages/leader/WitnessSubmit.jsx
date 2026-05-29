import { useState, useEffect, useCallback } from 'react';
import {
  Award,
  Send,
  Clock,
  CheckCircle,
  EyeOff,
  User,
  RefreshCw,
} from 'lucide-react';
import { witnessesApi, studentsApi } from '../../api/admin';
import Loading from '../../components/common/Loading';

const STATUS_BADGE = {
  pending: { label: '待审核', className: 'bg-amber-100 text-amber-700' },
  published: { label: '已发布', className: 'bg-green-100 text-green-700' },
  hidden: { label: '已隐藏', className: 'bg-gray-100 text-gray-600' },
};

export default function WitnessSubmit() {
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [myWitnesses, setMyWitnesses] = useState([]);
  const [loadingMy, setLoadingMy] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    student_id: '',
    content: '',
    image_url: '',
    anonymous: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState(null);

  const loadStudents = useCallback(async () => {
    try {
      setLoadingStudents(true);
      const res = await studentsApi.list();
      const data = res.data?.data || res.data || [];
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || '加载学员列表失败');
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  const loadMyWitnesses = useCallback(async () => {
    try {
      setLoadingMy(true);
      const res = await witnessesApi.list();
      const data = res.data?.data || res.data || [];
      setMyWitnesses(Array.isArray(data) ? data : []);
    } catch (err) {
      // silently fail for my submissions
    } finally {
      setLoadingMy(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
    loadMyWitnesses();
  }, [loadStudents, loadMyWitnesses]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.student_id || !form.content.trim()) {
      setSubmitMsg({ type: 'error', text: '请选择学员并填写见证内容' });
      return;
    }

    try {
      setSubmitting(true);
      setSubmitMsg(null);
      await witnessesApi.create({
        student_id: form.student_id,
        content: form.content.trim(),
        image_url: form.image_url.trim() || undefined,
        anonymous: form.anonymous,
      });
      setForm({ student_id: '', content: '', image_url: '', anonymous: false });
      setSubmitMsg({ type: 'success', text: '投稿成功！等待审核中' });
      loadMyWitnesses();
    } catch (err) {
      setSubmitMsg({ type: 'error', text: err.response?.data?.message || '投稿失败' });
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = loadingStudents || loadingMy;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-brand-success/10 flex items-center justify-center">
          <Award className="w-5 h-5 text-brand-success" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-brand-text">见证墙投稿</h2>
          <p className="text-sm text-brand-muted">记录学员闪光时刻，让每一份努力都被看见</p>
        </div>
      </div>

      {/* Submit Form */}
      <div className="card !p-4">
        <h3 className="text-sm font-semibold text-brand-text mb-4">新建投稿</h3>

        {submitMsg && (
          <div
            className={`mb-4 px-3 py-2.5 rounded-lg text-sm ${
              submitMsg.type === 'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {submitMsg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Student select */}
          <div>
            <label className="block text-sm font-medium text-brand-text mb-1.5">
              选择学员
            </label>
            {loadingStudents ? (
              <div className="h-10 bg-brand-border/30 rounded-lg animate-pulse" />
            ) : (
              <select
                value={form.student_id}
                onChange={(e) => handleChange('student_id', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-brand-border bg-brand-card text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30 appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '16px',
                }}
              >
                <option value="">-- 请选择学员 --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.group_name || '-'})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Content textarea */}
          <div>
            <label className="block text-sm font-medium text-brand-text mb-1.5">
              一句话看见
            </label>
            <textarea
              value={form.content}
              onChange={(e) => handleChange('content', e.target.value)}
              rows={4}
              placeholder="记录下你看见的这个学员的闪光时刻..."
              className="w-full px-3 py-2.5 rounded-lg border border-brand-border bg-brand-card text-sm text-brand-text placeholder:text-brand-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 resize-none"
              maxLength={500}
            />
            <p className="text-xs text-brand-muted mt-1 text-right">
              {form.content.length}/500
            </p>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-brand-text mb-1.5">
              配图链接
              <span className="text-brand-muted font-normal ml-1">(选填)</span>
            </label>
            <input
              type="url"
              value={form.image_url}
              onChange={(e) => handleChange('image_url', e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2.5 rounded-lg border border-brand-border bg-brand-card text-sm text-brand-text placeholder:text-brand-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
            />
          </div>

          {/* Display mode */}
          <div>
            <label className="block text-sm font-medium text-brand-text mb-2">
              展示方式
            </label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="displayMode"
                  checked={!form.anonymous}
                  onChange={() => handleChange('anonymous', false)}
                  className="w-4 h-4 text-brand-accent focus:ring-brand-accent/30"
                />
                <span className="text-sm text-brand-text">署名</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="displayMode"
                  checked={form.anonymous}
                  onChange={() => handleChange('anonymous', true)}
                  className="w-4 h-4 text-brand-accent focus:ring-brand-accent/30"
                />
                <span className="text-sm text-brand-text">匿名</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !form.student_id || !form.content.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand-accent text-white text-sm font-medium hover:bg-brand-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                提交中...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                提交投稿
              </>
            )}
          </button>
        </form>
      </div>

      {/* My Submissions */}
      <div>
        <h3 className="text-sm font-semibold text-brand-text mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-accent" />
          我的投稿
        </h3>

        {loadingMy ? (
          <Loading />
        ) : myWitnesses.length === 0 ? (
          <div className="card text-center py-8">
            <Award className="w-6 h-6 text-brand-muted mx-auto mb-2" />
            <p className="text-sm text-brand-muted">暂无投稿记录</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myWitnesses.map((w) => {
              const badge = STATUS_BADGE[w.status] || STATUS_BADGE.pending;
              return (
                <div key={w.id} className="card !p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-brand-accent-light flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-brand-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-brand-text">
                          {w.anonymous ? '匿名' : w.student_name || `学员${w.student_id}`}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-sm text-brand-text/80 leading-relaxed line-clamp-2">
                    &ldquo;{w.content}&rdquo;
                  </p>
                  {w.created_at && (
                    <p className="text-xs text-brand-muted mt-2">{w.created_at}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
