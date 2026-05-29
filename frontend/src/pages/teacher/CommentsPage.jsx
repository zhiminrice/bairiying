import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  FileText,
  BookOpen,
  Edit3,
  ChevronRight,
  Clock,
  Loader2,
  X,
  User,
} from 'lucide-react';
import { commentsApi, contentApi } from '../../api/teacher';
import EmptyState from '../../components/common/EmptyState';
import ErrorMessage from '../../components/common/ErrorMessage';

/* ──────────── helpers ──────────── */
const TYPE_BADGE = {
  harvest: { label: '课程收获', bg: 'bg-brand-success/10', text: 'text-brand-success', icon: BookOpen },
  diary: { label: '内省日记', bg: 'bg-brand-accent-light', text: 'text-brand-accent', icon: Edit3 },
  action: { label: '行动分享', bg: 'bg-brand-warning/10', text: 'text-brand-warning', icon: FileText },
};

/* ──────────── component ──────────── */
export default function CommentsPage() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* ------- content detail modal ------- */
  const [selectedContent, setSelectedContent] = useState(null);
  const [contentLoading, setContentLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await commentsApi.list({});
      const data = res.data?.data || res.data || [];
      setComments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
      setError('加载点评记录失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const viewOriginalContent = async (comment) => {
    if (!comment.target_id) return;
    setContentLoading(true);
    try {
      const res = await contentApi.getById(comment.target_id);
      const data = res.data?.data || res.data || {};
      setSelectedContent({
        ...data,
        type: comment.content_type || data.type,
      });
    } catch (err) {
      console.error('Failed to fetch original content:', err);
      setSelectedContent(null);
    } finally {
      setContentLoading(false);
    }
  };

  const closeContentModal = () => {
    setSelectedContent(null);
  };

  /* ──── close modal on Escape ──── */
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') closeContentModal();
    };
    if (selectedContent) {
      document.addEventListener('keydown', handleKey);
      return () => document.removeEventListener('keydown', handleKey);
    }
  }, [selectedContent]);

  /* ──── render ──── */
  return (
    <div className="max-w-2xl mx-auto pb-6">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-brand-text">我的点评</h1>
        <p className="text-sm text-brand-muted mt-0.5">查看您对学员内容的点评记录</p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
          <span className="text-sm text-brand-muted mt-3">加载中...</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && <ErrorMessage message={error} />}

      {/* Empty */}
      {!loading && !error && comments.length === 0 && (
        <EmptyState
          icon={MessageSquare}
          title="暂无点评记录"
          description="您还没有对学员内容进行过点评，去浏览学员内容开始点评吧。"
        />
      )}

      {/* Comments list */}
      {!loading && !error && comments.length > 0 && (
        <div className="space-y-3">
          {comments.map((c) => {
            const typeInfo = TYPE_BADGE[c.content_type] || TYPE_BADGE.harvest;
            return (
              <div key={c.id} className="card !p-4">
                {/* Meta */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-brand-accent-light flex items-center justify-center flex-shrink-0">
                      <User className="w-3.5 h-3.5 text-brand-accent" />
                    </div>
                    <span className="text-sm font-medium text-brand-text truncate">
                      {c.student_name || c.target_student_name || `学员${c.target_student_id || ''}`}
                    </span>
                    {c.content_type && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${typeInfo.bg} ${typeInfo.text}`}>
                        <typeInfo.icon className="w-3 h-3" />
                        {typeInfo.label}
                      </span>
                    )}
                  </div>
                  {c.created_at && (
                    <div className="flex items-center gap-1 text-xs text-brand-muted flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      {c.created_at}
                    </div>
                  )}
                </div>

                {/* Comment text */}
                <p className="text-sm text-brand-text leading-relaxed mb-3">
                  {c.content}
                </p>

                {/* View original button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => viewOriginalContent(c)}
                    disabled={contentLoading}
                    className="flex items-center gap-1 text-xs text-brand-accent hover:underline disabled:opacity-50"
                  >
                    查看原文
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Original Content Modal ── */}
      {selectedContent && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) closeContentModal(); }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Modal */}
          <div className="relative bg-brand-card w-full max-h-[85vh] md:max-w-xl rounded-t-2xl md:rounded-2xl shadow-xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border flex-shrink-0">
              <h2 className="text-lg font-semibold text-brand-text">原文内容</h2>
              <button
                onClick={closeContentModal}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-brand-muted hover:bg-brand-border/50 hover:text-brand-text transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5">
              {/* Student info */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-semibold text-brand-text">
                  {selectedContent.student_name || `学员${selectedContent.student_id || ''}`}
                </span>
                {(() => {
                  const info = TYPE_BADGE[selectedContent.type] || TYPE_BADGE.harvest;
                  return (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${info.bg} ${info.text}`}>
                      <info.icon className="w-3 h-3" />
                      {info.label}
                    </span>
                  );
                })()}
              </div>

              {selectedContent.course_name && (
                <p className="text-sm text-brand-accent mb-3">课程：{selectedContent.course_name}</p>
              )}

              {selectedContent.date && (
                <p className="text-xs text-brand-muted mb-3">{selectedContent.date}</p>
              )}

              {/* Content */}
              <div className="bg-brand-bg rounded-xl p-4 text-sm text-brand-text leading-relaxed whitespace-pre-wrap">
                {selectedContent.content || '（无内容）'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
