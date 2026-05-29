import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Edit3,
  Share2,
  Send,
  Calendar,
  ChevronDown,
  FileText,
  Clock,
} from 'lucide-react';
import { studentsApi, coursesApi, recordsApi } from '../../api/leader';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const TABS = [
  { key: 'harvest', label: '课程收获', icon: BookOpen, placeholder: '请输入学员本次课程的收获...' },
  { key: 'diary', label: '内省日记', icon: Edit3, placeholder: '请输入学员的内省日记...' },
  { key: 'action', label: '行动分享', icon: Share2, placeholder: '请输入学员的生活行动建议分享...' },
];

export default function RecordsPage() {
  const [activeTab, setActiveTab] = useState('harvest');
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [recordDate, setRecordDate] = useState(formatDate(new Date()));
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Records list
  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [expandedRecord, setExpandedRecord] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const [studentRes, courseRes] = await Promise.all([
          studentsApi.list(),
          coursesApi.list(),
        ]);
        setStudents(studentRes.data?.data || studentRes.data || []);
        setCourses(courseRes.data?.data || courseRes.data || []);
      } catch (err) {
        setError('加载基础数据失败');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const loadRecords = useCallback(async () => {
    setRecordsLoading(true);
    try {
      const res = await recordsApi.list({ type: activeTab });
      const data = res.data?.data || res.data || [];
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      // silent fail for records list
      setRecords([]);
    } finally {
      setRecordsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedCourseId('');
    setContent('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudentId) {
      setError('请选择学员');
      return;
    }
    if (activeTab === 'harvest' && !selectedCourseId) {
      setError('请输入课程收获前先选择对应课程');
      return;
    }
    if (!content.trim()) {
      setError('请输入内容');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await recordsApi.create({
        student_id: selectedStudentId,
        type: activeTab,
        course_id: activeTab === 'harvest' ? selectedCourseId : undefined,
        date: recordDate,
        content: content.trim(),
      });
      showToast('内容录入成功');
      setContent('');
      loadRecords();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || '提交失败，请重试';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const currentTab = TABS.find((t) => t.key === activeTab) || TABS[0];

  if (loading) return <Loading />;

  const getStudentName = (id) => {
    const s = students.find((st) => st.id === id);
    return s ? s.name || s.display_name || `学员${id}` : `学员${id}`;
  };

  const getCourseTitle = (id) => {
    if (!id) return '';
    const c = courses.find((co) => co.id === id);
    return c ? `第${c.week_no || ''}周 - ${c.title || c.name || ''}` : '';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-brand-success text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">
          {toast}
        </div>
      )}

      {/* Tabs */}
      <div className="card !p-1 flex rounded-2xl bg-brand-border/30">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-brand-card text-brand-accent shadow-sm'
                : 'text-brand-muted hover:text-brand-text'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Error */}
      {error && <ErrorMessage message={error} />}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="card space-y-3">
        <h3 className="text-base font-semibold text-brand-text flex items-center gap-2">
          <currentTab.icon className="w-4 h-4 text-brand-accent" />
          录入{currentTab.label}
        </h3>

        {/* Student Selector */}
        <div>
          <label className="text-xs text-brand-muted mb-1 block">学员</label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="input-field"
          >
            <option value="">选择学员...</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name || s.display_name || `学员${s.id}`}
              </option>
            ))}
          </select>
        </div>

        {/* Course Selector (harvest only) */}
        {activeTab === 'harvest' && (
          <div>
            <label className="text-xs text-brand-muted mb-1 block">课程</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="input-field"
            >
              <option value="">选择课程...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  第{c.week_no || ''}周 - {c.title || c.name || ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Date */}
        <div>
          <label className="text-xs text-brand-muted mb-1 block flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            日期
          </label>
          <input
            type="date"
            value={recordDate}
            onChange={(e) => setRecordDate(e.target.value)}
            className="input-field"
          />
        </div>

        {/* Content */}
        <div>
          <label className="text-xs text-brand-muted mb-1 block">内容</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={currentTab.placeholder}
            rows={4}
            className="input-field resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full btn-primary flex items-center justify-center gap-2 py-3"
        >
          <Send className="w-4 h-4" />
          {submitting ? '提交中...' : '提交录入'}
        </button>
      </form>

      {/* Recent Records */}
      <div className="card">
        <h3 className="text-base font-semibold text-brand-text flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-brand-accent" />
          近期{currentTab.label}记录
        </h3>

        {recordsLoading ? (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="暂无记录"
            description={`还没有${currentTab.label}记录，请使用上方表单录入。`}
          />
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {records.map((record) => {
              const isExpanded = expandedRecord === record.id;
              return (
                <div
                  key={record.id}
                  className="border border-brand-border/50 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedRecord(isExpanded ? null : record.id)
                    }
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-brand-border/20 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-brand-text truncate">
                          {getStudentName(record.student_id)}
                        </span>
                        {record.course_id && (
                          <span className="text-xs text-brand-accent bg-brand-accent-light px-1.5 py-0.5 rounded">
                            {getCourseTitle(record.course_id)}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-brand-muted">{record.date || ''}</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-brand-muted transition-transform flex-shrink-0 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-0">
                      <p className="text-sm text-brand-text whitespace-pre-wrap leading-relaxed bg-brand-bg rounded-lg p-3">
                        {record.content}
                      </p>
                    </div>
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
