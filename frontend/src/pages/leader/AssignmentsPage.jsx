import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, BookOpen, Save, ChevronDown } from 'lucide-react';
import { studentsApi, coursesApi, assignmentsApi } from '../../api/leader';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';

export default function AssignmentsPage() {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [assignmentMap, setAssignmentMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [expandedNotes, setExpandedNotes] = useState({});

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const [courseRes, studentRes] = await Promise.all([
          coursesApi.list(),
          studentsApi.list(),
        ]);
        setCourses(courseRes.data?.data || courseRes.data || []);
        setStudents(studentRes.data?.data || studentRes.data || []);
      } catch (err) {
        setError('加载基础数据失败');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!selectedCourseId) {
      const defaultMap = {};
      students.forEach((s) => {
        defaultMap[s.id] = { submitted: false, content: '' };
      });
      setAssignmentMap(defaultMap);
      return;
    }

    const loadAssignments = async () => {
      setError(null);
      try {
        const res = await assignmentsApi.list({ course_id: selectedCourseId });
        const data = res.data?.data || res.data || [];
        const map = {};
        students.forEach((s) => {
          map[s.id] = { submitted: false, content: '' };
        });
        data.forEach((r) => {
          if (map[r.student_id] !== undefined) {
            map[r.student_id] = {
              submitted: r.status === 'submitted' || r.submitted === true,
              content: r.content || '',
            };
          }
        });
        setAssignmentMap(map);
      } catch (err) {
        const msg = err.response?.data?.message || err.message || '加载作业记录失败';
        setError(msg);
      }
    };
    loadAssignments();
  }, [selectedCourseId, students]);

  const toggleSubmitted = (studentId) => {
    setAssignmentMap((prev) => {
      const cur = prev[studentId];
      if (!cur) return prev;
      return { ...prev, [studentId]: { ...cur, submitted: !cur.submitted } };
    });
  };

  const updateContent = (studentId, content) => {
    setAssignmentMap((prev) => {
      const cur = prev[studentId];
      if (!cur) return prev;
      return { ...prev, [studentId]: { ...cur, content } };
    });
  };

  const toggleExpanded = (studentId) => {
    setExpandedNotes((prev) => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  const handleSave = async () => {
    if (!selectedCourseId) {
      setError('请先选择课程');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const records = students.map((s) => ({
        student_id: s.id,
        course_id: selectedCourseId,
        submitted: assignmentMap[s.id]?.submitted || false,
        content: assignmentMap[s.id]?.content || '',
      }));
      await assignmentsApi.create({ records, course_id: selectedCourseId });
      showToast('作业登记保存成功');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || '保存失败，请重试';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  const submittedCount = Object.values(assignmentMap).filter((r) => r.submitted).length;

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-brand-success text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">
          {toast}
        </div>
      )}

      {/* Course Selector */}
      <div className="card !p-4">
        <label className="flex items-center gap-2 text-sm font-medium text-brand-text mb-2">
          <BookOpen className="w-4 h-4 text-brand-accent" />
          选择课程
        </label>
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="input-field"
        >
          <option value="">请选择课程...</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              第{c.week_no || ''}周 - {c.title || c.name || ''}
            </option>
          ))}
        </select>
        {submittedCount > 0 && selectedCourseId && (
          <p className="text-xs text-brand-muted mt-2">
            已提交: {submittedCount}/{students.length} 人
          </p>
        )}
      </div>

      {/* Error */}
      {error && <ErrorMessage message={error} />}

      {/* Student List */}
      {!selectedCourseId ? (
        <EmptyState
          icon={BookOpen}
          title="请选择课程"
          description="从上方下拉菜单选择课程后，方可查看和登记作业提交情况。"
        />
      ) : students.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="暂无学员"
          description="该小组还没有分配学员。"
        />
      ) : (
        <div className="space-y-2">
          {students.map((student) => {
            const record = assignmentMap[student.id];
            const submitted = record?.submitted || false;
            const noteExpanded = expandedNotes[student.id];

            return (
              <div
                key={student.id}
                className={`card !p-0 overflow-hidden transition-all duration-200 ${
                  submitted
                    ? 'border-brand-success/40 bg-brand-success/5'
                    : 'border-brand-border/50 bg-brand-card'
                }`}
              >
                <button
                  onClick={() => toggleSubmitted(student.id)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 min-h-[52px] text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-text truncate">
                      {student.name || student.display_name || `学员${student.id}`}
                    </p>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      submitted
                        ? 'bg-brand-success text-white'
                        : 'bg-brand-border/60 text-brand-muted'
                    }`}
                  >
                    {submitted ? (
                      <CheckCircle className="w-3.5 h-3.5" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5" />
                    )}
                    {submitted ? '已交' : '未交'}
                  </div>
                </button>

                {/* Expandable content textarea */}
                <button
                  onClick={() => toggleExpanded(student.id)}
                  className="w-full flex items-center justify-center gap-1 py-2 text-xs text-brand-muted hover:text-brand-accent transition-colors border-t border-brand-border/30"
                >
                  <span>{record?.content ? '作业内容已填写' : '添加作业内容（选填）'}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${noteExpanded ? 'rotate-180' : ''}`}
                  />
                </button>

                {noteExpanded && (
                  <div className="px-4 pb-3">
                    <textarea
                      value={record?.content || ''}
                      onChange={(e) => updateContent(student.id, e.target.value)}
                      placeholder="输入作业内容（选填）"
                      rows={2}
                      className="input-field text-sm resize-none"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Save Button */}
      {selectedCourseId && students.length > 0 && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full btn-primary flex items-center justify-center gap-2 py-3 mt-2"
        >
          <Save className="w-4 h-4" />
          {saving ? '保存中...' : '保存作业登记'}
        </button>
      )}
    </div>
  );
}
