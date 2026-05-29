import { useState, useEffect, useCallback } from 'react';
import {
  Award,
  Eye,
  EyeOff,
  CheckCircle,
  Clock,
  X,
  Image,
  User,
  RefreshCw,
} from 'lucide-react';
import { witnessesApi } from '../../api/admin';
import Loading from '../../components/common/Loading';

const STATUS_BADGE = {
  pending: { label: '待审核', className: 'bg-amber-100 text-amber-700' },
  published: { label: '已发布', className: 'bg-green-100 text-green-700' },
  hidden: { label: '已隐藏', className: 'bg-gray-100 text-gray-600' },
};

const TABS = [
  { key: 'pending', label: '待审核', icon: Clock },
  { key: 'published', label: '已发布', icon: Eye },
  { key: 'hidden', label: '已隐藏', icon: EyeOff },
];

export default function WitnessManage() {
  const [tab, setTab] = useState('pending');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await witnessesApi.list({ status: tab });
      const data = res.data?.data || res.data || [];
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || '加载见证墙数据失败');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handlePublish = async (id) => {
    try {
      setActionLoading(id);
      await witnessesApi.publish(id);
      loadItems();
    } catch (err) {
      alert(err.response?.data?.message || '操作失败');
    } finally {
      setActionLoading(null);
    }
  };

  const handleHide = async (id) => {
    try {
      setActionLoading(id);
      await witnessesApi.hide(id);
      loadItems();
    } catch (err) {
      alert(err.response?.data?.message || '操作失败');
    } finally {
      setActionLoading(null);
    }
  };

  const isActionLoading = (id) => actionLoading === id;

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-brand-success/10 flex items-center justify-center">
          <Award className="w-5 h-5 text-brand-success" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-brand-text">见证墙管理</h2>
          <p className="text-sm text-brand-muted">审核与管理学员见证墙投稿</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-brand-border/30 rounded-lg p-0.5">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-md text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'bg-brand-card text-brand-accent shadow-sm'
                  : 'text-brand-muted hover:text-brand-text'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <Loading />
      ) : error ? (
        <div className="card text-center py-10">
          <p className="text-brand-danger text-sm mb-3">{error}</p>
          <button
            onClick={loadItems}
            className="inline-flex items-center gap-1.5 text-sm text-brand-accent hover:underline"
          >
            <RefreshCw className="w-4 h-4" />
            重试
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center py-10">
          <Award className="w-8 h-8 text-brand-muted mx-auto mb-2" />
          <p className="text-sm text-brand-muted">
            {tab === 'pending'
              ? '暂无待审核投稿'
              : tab === 'published'
              ? '暂无已发布见证'
              : '暂无已隐藏见证'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const statusBadge = STATUS_BADGE[item.status] || STATUS_BADGE.pending;
            const displayName = item.anonymous ? '匿名' : item.student_name || `学员${item.student_id}`;
            return (
              <div key={item.id} className="card !p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-brand-accent-light flex items-center justify-center">
                      <User className="w-4 h-4 text-brand-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-brand-text">
                        {displayName}
                      </p>
                      <p className="text-xs text-brand-muted">
                        {item.group_name || '-'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge.className}`}
                  >
                    {statusBadge.label}
                  </span>
                </div>

                <div className="bg-brand-border/10 rounded-lg p-3 mb-3">
                  <p className="text-sm text-brand-text leading-relaxed">
                    &ldquo;{item.content}&rdquo;
                  </p>
                </div>

                {item.image_url && (
                  <div className="mb-3">
                    <img
                      src={item.image_url}
                      alt="见证配图"
                      className="rounded-lg max-h-48 object-cover w-full"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-xs text-brand-muted">
                    {item.submitted_by && (
                      <span>由 {item.submitted_by} 提交</span>
                    )}
                    {item.created_at && (
                      <span> · {item.created_at}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {tab === 'pending' && (
                      <>
                        <button
                          onClick={() => handleHide(item.id)}
                          disabled={isActionLoading(item.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-brand-border text-sm text-brand-muted hover:bg-brand-border/30 transition-colors disabled:opacity-50"
                        >
                          {isActionLoading(item.id) ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <X className="w-3.5 h-3.5" />
                          )}
                          忽略
                        </button>
                        <button
                          onClick={() => handlePublish(item.id)}
                          disabled={isActionLoading(item.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-success text-white text-sm font-medium hover:bg-brand-success/90 transition-colors disabled:opacity-50"
                        >
                          {isActionLoading(item.id) ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5" />
                          )}
                          精选发布
                        </button>
                      </>
                    )}
                    {tab === 'published' && (
                      <button
                        onClick={() => handleHide(item.id)}
                        disabled={isActionLoading(item.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-brand-danger/30 text-sm text-brand-danger hover:bg-brand-danger/5 transition-colors disabled:opacity-50"
                      >
                        {isActionLoading(item.id) ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5" />
                        )}
                        撤下
                      </button>
                    )}
                    {tab === 'hidden' && (
                      <button
                        onClick={() => handlePublish(item.id)}
                        disabled={isActionLoading(item.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-brand-accent/30 text-sm text-brand-accent hover:bg-brand-accent-light transition-colors disabled:opacity-50"
                      >
                        {isActionLoading(item.id) ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                        重新审核
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
