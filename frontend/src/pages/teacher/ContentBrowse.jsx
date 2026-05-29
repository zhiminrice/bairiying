import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Eye,
  MessageSquare,
  Filter,
  Search,
  ChevronDown,
  X,
  Send,
  BookOpen,
  Edit3,
  FileText,
  Clock,
  Users,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { contentApi, commentsApi, groupsApi, studentsApi } from '../../api/teacher';
import client from '../../api/client';
import EmptyState from '../../components/common/EmptyState';
import ErrorMessage from '../../components/common/ErrorMessage';

/* ──────────── constants ──────────── */
const TYPE_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'harvest', label: '课程收获' },
  { value: 'diary', label: '内省日记' },
  { value: 'action', label: '行动分享' },
];

const COMMENT_STATUS_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'true', label: '已点评' },
  { value: 'false', label: '未点评' },
];

const TYPE_BADGE = {
  harvest: { label: '课程收获', bg: 'bg-brand-success/10', text: 'text-brand-success', icon: BookOpen },
  diary: { label: '内省日记', bg: 'bg-brand-accent-light', text: 'text-brand-accent', icon: Edit3 },
  action: { label: '行动分享', bg: 'bg-brand-warning/10', text: 'text-brand-warning', icon: FileText },
};

/* ──────────── helpers ──────────── */
function truncate(text, max = 100) {
  if (!text) return '';
  return text.length > max ? text.slice(0, max) + '...' : text;
}

/* ──────────── main component ──────────── */
export default function ContentBrowse() {
  const [searchParams, setSearchParams] = useSearchParams();

  /* ------- filter state ------- */
  const [filters, setFilters] = useState({
    type: searchParams.get('type') || '',
    group_id: searchParams.get('group_id') || '',
    student_id: searchParams.get('student_id') || '',
    course_id: searchParams.get('course_id') || '',
    commented: searchParams.get('commented') || 'false',
    date_from: searchParams.get('date_from') || '',
    date_to: searchParams.get('date_to') || '',
  });

  /* ------- data state ------- */
  const [records, setRecords] = useState([]);
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* ------- expand state ------- */
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [filterOpen, setFilterOpen] = useState(false);

  /* ------- comment modal ------- */
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalComments, setModalComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const modalRef = useRef(null);

  /* ------- debounce ref ------- */
  const debounceRef = useRef(null);

  /* ──── data fetching ──── */
  const fetchRecords = useCallback(async (f) => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (f.type) params.type = f.type;
      if (f.group_id) params.group_id = f.group_id;
      if (f.student_id) params.student_id = f.student_id;
      if (f.course_id) params.course_id = f.course_id;
      if (f.commented) params.commented = f.commented;
      if (f.date_from) params.date_from = f.date_from;
      if (f.date_to) params.date_to = f.date_to;

      const res = await contentApi.list(params);
      const data = res.data?.data || res.data?.records || res.data || [];
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch records:', err);
      setError('加载学员内容失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const [groupsRes, studentsRes] = await Promise.allSettled([
        groupsApi.list(),
        studentsApi.list(),
      ]);

      if (groupsRes.status === 'fulfilled') {
        const gData = groupsRes.value.data?.data || groupsRes.value.data || [];
        setGroups(Array.isArray(gData) ? gData : []);
      }
      if (studentsRes.status === 'fulfilled') {
        const sData = studentsRes.value.data?.data || studentsRes.value.data || [];
        setStudents(Array.isArray(sData) ? sData : []);
      }
    } catch (err) {
      console.error('Failed to fetch filter options:', err);
    }

    // Try fetching courses
    try {
      const coursesRes = await client.get('/courses');
      const cData = coursesRes.data?.data || coursesRes.data || [];
      setCourses(Array.isArray(cData) ? cData : []);
    } catch (_) {
      setCourses([]);
    }
  }, []);

  /* ──── initial load ──── */
  useEffect(() => {
    fetchRecords(filters);
    fetchFilterOptions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ──── filter change handler (with debounce on records fetch) ──── */
  const handleFilterChange = (key, value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);

    // Update URL search params
    const params = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => { if (v) params.set(k, v); });
    setSearchParams(params, { replace: true });

    // Debounce records fetch
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchRecords(next);
    }, 300);
  };

  const clearFilters = () => {
    const reset = { type: '', group_id: '', student_id: '', course_id: '', commented: 'false', date_from: '', date_to: '' };
    setFilters(reset);
    setSearchParams({}, { replace: true });
    fetchRecords(reset);
  };

  /* ──── expand/collapse ──── */
  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /* ──── modal ──── */
  const openModal = async (record) => {
    setSelectedRecord(record);
    setNewComment('');
    setModalError('');
    setModalLoading(true);
    try {
      const res = await commentsApi.list({ target_type: 'record', target_id: record.id });
      const data = res.data?.data || res.data || [];
      setModalComments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
      setModalError('加载点评记录失败。');
      setModalComments([]);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedRecord(null);
    setModalComments([]);
    setNewComment('');
    setModalError('');
  };

  const submitComment = async () => {
    if (!newComment.trim() || !selectedRecord) return;
    setSubmitting(true);
    setModalError('');
    try {
      await commentsApi.create({
        target_type: 'record',
        target_id: selectedRecord.id,
        content: newComment.trim(),
      });
      setNewComment('');

      // Refresh comments from server
      const res = await commentsApi.list({ target_type: 'record', target_id: selectedRecord.id });
      const data = res.data?.data || res.data || [];
      setModalComments(Array.isArray(data) ? data : []);

      // Update the record's comment count in the list
      setRecords((prev) =>
        prev.map((r) =>
          r.id === selectedRecord.id
            ? { ...r, comment_count: (r.comment_count || 0) + 1, commented: true }
            : r
        )
      );
    } catch (err) {
      console.error('Failed to submit comment:', err);
      setModalError('提交点评失败，请稍后重试。');
    } finally {
      setSubmitting(false);
    }
  };

  /* ──── close modal on Escape ──── */
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    if (selectedRecord) {
      document.addEventListener('keydown', handleKey);
      return () => document.removeEventListener('keydown', handleKey);
    }
  }, [selectedRecord]);

  /* ──── render helpers ──── */
  const activeFilterCount = Object.entries(filters).filter(
    ([k, v]) => v && (k !== 'commented' || v !== 'false')
  ).length;

  const renderTypePills = () => (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide flex-shrink-0">
      {TYPE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => handleFilterChange('type', opt.value)}
          className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-sm font-medium transition-all active:scale-95 ${
            filters.type === opt.value
              ? 'bg-brand-accent text-white shadow-sm'
              : 'bg-white text-brand-muted border border-brand-border hover:border-brand-accent/40 hover:text-brand-text'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  const renderSelect = (label, value, options, onChange, placeholder = '全部') => (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field !py-2 !pr-8 text-sm appearance-none cursor-pointer bg-white"
      >
        <option value="">{placeholder}{label}</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.name || opt.title || opt.label || `#${opt.id}`}
          </option>
        ))}
      </select>
      <ChevronDown className="w-4 h-4 text-brand-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );

  /* ──── main render ──── */
  return (
    <div className="max-w-3xl mx-auto pb-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-brand-text">学员内容浏览</h1>
          <p className="text-sm text-brand-muted mt-0.5">查看和点评学员提交的学习内容</p>
        </div>
        <button
          onClick={() => setFilterOpen((v) => !v)}
          className={`md:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
            filterOpen ? 'bg-brand-accent-light text-brand-accent' : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span className="text-sm">筛选</span>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-brand-accent text-white text-xs flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Filter bar ── */}
      <div className={`space-y-3 mb-5 ${filterOpen ? 'block' : 'hidden md:block'}`}>
        <div className="card !p-4 space-y-3">
          {/* Type pills */}
          <div>
            <p className="text-xs text-brand-muted mb-2">内容类型</p>
            {renderTypePills()}
          </div>

          {/* Dropdown filters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <p className="text-xs text-brand-muted mb-1">小组</p>
              {renderSelect('小组', filters.group_id, groups, (v) => handleFilterChange('group_id', v))}
            </div>
            <div>
              <p className="text-xs text-brand-muted mb-1">学员</p>
              {renderSelect('学员', filters.student_id, students, (v) => handleFilterChange('student_id', v))}
            </div>
            <div>
              <p className="text-xs text-brand-muted mb-1">课程</p>
              {renderSelect('课程', filters.course_id, courses, (v) => handleFilterChange('course_id', v))}
            </div>
            <div>
              <p className="text-xs text-brand-muted mb-1">点评状态</p>
              {renderSelect('状态', filters.commented, [
                { id: 'true', name: '已点评' },
                { id: 'false', name: '未点评' },
              ], (v) => handleFilterChange('commented', v), '')}
            </div>
          </div>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              className="input-field !py-1.5 !px-3 text-sm"
              placeholder="开始日期"
            />
            <span className="text-brand-muted text-sm">至</span>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
              className="input-field !py-1.5 !px-3 text-sm"
              placeholder="结束日期"
            />
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-brand-danger hover:underline whitespace-nowrap"
              >
                <X className="w-3 h-3" />
                清除
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Content area ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
          <span className="text-sm text-brand-muted mt-3">加载中...</span>
        </div>
      ) : error ? (
        <ErrorMessage message={error} />
      ) : records.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="暂无未点评内容，太棒了！"
          description="所有学员内容都已完成点评，继续加油！"
        />
      ) : (
        <div className="space-y-3">
          {records.map((record) => {
            const typeInfo = TYPE_BADGE[record.type] || TYPE_BADGE.harvest;
            const isExpanded = expandedIds.has(record.id);
            const contentText = record.content || '';
            const hasComments = record.comment_count > 0 || record.commented;

            return (
              <div
                key={record.id}
                className="card !p-4 cursor-pointer hover:shadow-md hover:border-brand-accent/30 transition-all active:scale-[0.99]"
                onClick={() => openModal(record)}
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-semibold text-brand-text truncate">
                      {record.student_name || `学员${record.student_id}`}
                    </span>
                    {record.group_name && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-brand-accent-light text-brand-accent whitespace-nowrap">
                        {record.group_name}
                      </span>
                    )}
                  </div>

                  {/* Comment status dot */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {hasComments ? (
                      <>
                        <div className="w-2 h-2 rounded-full bg-brand-success" />
                        <span className="text-xs text-brand-success">
                          已点评 {record.comment_count || ''} 条
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 rounded-full bg-brand-warning" />
                        <span className="text-xs text-brand-warning">未点评</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Type badge + date */}
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${typeInfo.bg} ${typeInfo.text}`}>
                    <typeInfo.icon className="w-3 h-3" />
                    {typeInfo.label}
                  </span>
                  {record.date && (
                    <span className="text-xs text-brand-muted">{record.date}</span>
                  )}
                </div>

                {/* Course info for harvest type */}
                {record.type === 'harvest' && record.course_name && (
                  <div className="mt-2 text-xs text-brand-accent">
                    课程：{record.course_name}
                  </div>
                )}

                {/* Content preview */}
                <div className="mt-2.5 text-sm text-brand-text leading-relaxed">
                  {isExpanded ? contentText : truncate(contentText)}
                  {contentText.length > 100 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(record.id);
                      }}
                      className="ml-1 text-brand-accent text-xs hover:underline"
                    >
                      {isExpanded ? '收起' : '展开'}
                    </button>
                  )}
                </div>

                {/* Click hint */}
                <div className="mt-3 flex items-center justify-end gap-1 text-xs text-brand-muted group-hover:text-brand-accent">
                  <MessageSquare className="w-3 h-3" />
                  <span>点击查看详情与点评</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Comment Modal ── */}
      {selectedRecord && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Modal content */}
          <div
            ref={modalRef}
            className="relative bg-brand-card w-full max-h-[90vh] md:max-w-2xl md:rounded-2xl rounded-t-2xl md:rounded-2xl shadow-xl overflow-hidden flex flex-col"
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border flex-shrink-0">
              <h2 className="text-lg font-semibold text-brand-text">
                {selectedRecord.student_name || `学员${selectedRecord.student_id}`}的内容
              </h2>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-brand-muted hover:bg-brand-border/50 hover:text-brand-text transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body - scrollable */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Original content */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  {(() => {
                    const info = TYPE_BADGE[selectedRecord.type] || TYPE_BADGE.harvest;
                    return (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${info.bg} ${info.text}`}>
                        <info.icon className="w-3 h-3" />
                        {info.label}
                      </span>
                    );
                  })()}
                  {selectedRecord.date && (
                    <span className="text-xs text-brand-muted">{selectedRecord.date}</span>
                  )}
                </div>
                {selectedRecord.course_name && (
                  <p className="text-sm text-brand-accent mb-2">课程：{selectedRecord.course_name}</p>
                )}
                <div className="bg-brand-bg rounded-xl p-4 text-sm text-brand-text leading-relaxed whitespace-pre-wrap">
                  {selectedRecord.content || '（无内容）'}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-brand-border" />

              {/* Comments section */}
              <div>
                <h3 className="text-sm font-semibold text-brand-text mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-brand-accent" />
                  点评记录
                  {modalComments.length > 0 && (
                    <span className="text-xs text-brand-muted">({modalComments.length}条)</span>
                  )}
                </h3>

                {modalLoading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-brand-accent animate-spin" />
                    <span className="text-sm text-brand-muted mt-2">加载中...</span>
                  </div>
                ) : modalComments.length === 0 ? (
                  <p className="text-sm text-brand-muted py-4">暂无点评，写下第一条点评吧。</p>
                ) : (
                  <div className="space-y-3">
                    {modalComments.map((c, i) => (
                      <div key={c.id || i} className="bg-brand-bg rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-brand-text">
                            {c.teacher_name || c.author || '讲师'}
                          </span>
                          {c.created_at && (
                            <span className="text-xs text-brand-muted">{c.created_at}</span>
                          )}
                        </div>
                        <p className="text-sm text-brand-text leading-relaxed">{c.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {modalError && (
                  <div className="mt-3">
                    <ErrorMessage message={modalError} />
                  </div>
                )}

                {/* New comment input */}
                <div className="mt-4">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="撰写点评..."
                    rows={3}
                    className="input-field resize-none"
                    disabled={submitting}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={submitComment}
                      disabled={!newComment.trim() || submitting}
                      className="btn-primary !py-2 !px-5 text-sm flex items-center gap-1.5"
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          提交中...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          提交点评
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
