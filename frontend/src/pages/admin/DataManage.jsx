import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserCog,
  BookOpen,
  GraduationCap,
  Plus,
  Edit2,
  Save,
  X,
  RefreshCw,
} from 'lucide-react';
import { studentsApi, groupsApi, usersApi, coursesApi } from '../../api/admin';
import Loading from '../../components/common/Loading';

const TABS = [
  { key: 'students', label: '学员管理', icon: GraduationCap },
  { key: 'groups', label: '小组管理', icon: Users },
  { key: 'users', label: '用户管理', icon: UserCog },
  { key: 'courses', label: '课程管理', icon: BookOpen },
];

function AddForm({ fields, onSubmit, onCancel }) {
  const [values, setValues] = useState({});

  const handleChange = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-brand-border/10 rounded-lg p-3 space-y-3">
      {fields.map((field) => (
        <div key={field.key}>
          <label className="block text-xs font-medium text-brand-text mb-1">
            {field.label}
          </label>
          {field.type === 'select' ? (
            <select
              value={values[field.key] || ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-card text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
            >
              <option value="">-- 请选择 --</option>
              {(field.options || []).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : field.type === 'date' ? (
            <input
              type="date"
              value={values[field.key] || ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-card text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
            />
          ) : (
            <input
              type={field.type || 'text'}
              value={values[field.key] || ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-card text-sm text-brand-text placeholder:text-brand-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
            />
          )}
        </div>
      ))}
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-brand-accent text-white text-sm font-medium hover:bg-brand-accent/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          添加
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-brand-border text-sm text-brand-muted hover:bg-brand-border/30 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}

export default function DataManage() {
  const [tab, setTab] = useState('students');

  // Data states
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});

  // Load data based on tab
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      switch (tab) {
        case 'students': {
          const res = await studentsApi.list();
          const data = res.data?.data || res.data || [];
          setStudents(Array.isArray(data) ? data : []);
          break;
        }
        case 'groups': {
          const res = await groupsApi.list();
          const data = res.data?.data || res.data || [];
          setGroups(Array.isArray(data) ? data : []);
          break;
        }
        case 'users': {
          const res = await usersApi.list();
          const data = res.data?.data || res.data || [];
          setUsers(Array.isArray(data) ? data : []);
          break;
        }
        case 'courses': {
          const res = await coursesApi.list();
          const data = res.data?.data || res.data || [];
          setCourses(Array.isArray(data) ? data : []);
          break;
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || '加载数据失败');
    } finally {
      setLoading(false);
      setShowAdd(false);
      setEditingId(null);
    }
  }, [tab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Add handlers
  const handleAdd = async (values) => {
    try {
      switch (tab) {
        case 'students':
          await studentsApi.create(values);
          break;
        case 'groups':
          await groupsApi.create(values);
          break;
        case 'users':
          await usersApi.create(values);
          break;
        case 'courses':
          await coursesApi.create(values);
          break;
      }
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || '添加失败');
    }
  };

  // Edit handlers
  const startEdit = (item) => {
    setEditingId(item.id);
    setEditValues({ ...item });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const handleEdit = async (id) => {
    try {
      switch (tab) {
        case 'students':
          await studentsApi.update(id, editValues);
          break;
        case 'groups':
          await groupsApi.update(id, editValues);
          break;
        case 'users':
          await usersApi.update(id, editValues);
          break;
        case 'courses':
          await coursesApi.update(id, editValues);
          break;
      }
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || '保存失败');
    }
  };

  const handleEditChange = (key, value) => {
    setEditValues((prev) => ({ ...prev, [key]: value }));
  };

  // Prepare group/user options for select fields
  const groupOptions = groups.map((g) => ({ value: g.id, label: g.name }));
  const userOptions = users.map((u) => ({ value: u.id, label: `${u.name} (${u.role})` }));

  // Compute current items & fields
  let currentItems = [];
  let columns = [];
  let addFields = [];
  let inlineEditFields = [];

  switch (tab) {
    case 'students':
      currentItems = students;
      columns = ['name', 'group', 'status'];
      addFields = [
        { key: 'name', label: '姓名', placeholder: '学员姓名' },
        { key: 'group_id', label: '所属小组', type: 'select', options: groupOptions },
      ];
      inlineEditFields = ['name'];
      break;
    case 'groups':
      currentItems = groups;
      columns = ['name', 'leader', 'students'];
      addFields = [
        { key: 'name', label: '小组名称', placeholder: '小组名称' },
        { key: 'leader_id', label: '组长', type: 'select', options: userOptions },
      ];
      inlineEditFields = ['name'];
      break;
    case 'users':
      currentItems = users;
      columns = ['name', 'role', 'phone', 'email', 'status'];
      addFields = [
        { key: 'name', label: '姓名', placeholder: '用户姓名' },
        { key: 'phone', label: '手机号', placeholder: '手机号' },
        { key: 'email', label: '邮箱', type: 'email', placeholder: '邮箱地址' },
        { key: 'password', label: '密码', type: 'password', placeholder: '登录密码' },
        { key: 'role', label: '角色', type: 'select', options: [
          { value: 'admin', label: '管理员' },
          { value: 'teacher', label: '老师' },
          { value: 'leader', label: '组长' },
        ]},
        { key: 'group_id', label: '所属小组(组长时)', type: 'select', options: groupOptions },
      ];
      inlineEditFields = ['name', 'phone', 'email'];
      break;
    case 'courses':
      currentItems = courses;
      columns = ['week_no', 'title', 'date'];
      addFields = [
        { key: 'week_no', label: '周次', type: 'number', placeholder: '第几周' },
        { key: 'title', label: '课程名称', placeholder: '课程标题' },
        { key: 'course_date', label: '日期', type: 'date' },
      ];
      inlineEditFields = ['week_no', 'title'];
      break;
  }

  const columnLabels = {
    name: '姓名',
    group: '小组',
    status: '状态',
    leader: '组长',
    students: '学员数',
    role: '角色',
    phone: '手机号',
    email: '邮箱',
    week_no: '周次',
    title: '标题',
    date: '日期',
    studentCount: '学员数',
  };

  const renderCell = (item, col) => {
    const val = item[col];
    switch (col) {
      case 'status':
        if (val === 'active' || val === true) {
          return <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">活跃</span>;
        }
        return <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">禁用</span>;
      case 'role':
        const roleMap = { admin: '管理员', teacher: '老师', leader: '组长' };
        return <span className="text-sm text-brand-muted">{roleMap[val] || val}</span>;
      case 'group':
        return <span className="text-sm text-brand-muted">{item.group_name || val || '-'}</span>;
      case 'leader':
        return <span className="text-sm text-brand-muted">{item.leader_name || val || '-'}</span>;
      case 'students':
        return <span className="text-sm text-brand-muted">{item.studentCount ?? val ?? '-'}</span>;
      case 'date':
        return <span className="text-sm text-brand-muted">{item.course_date || val || '-'}</span>;
      default:
        return <span className="text-sm text-brand-text">{val}</span>;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-brand-accent-light flex items-center justify-center">
          <Users className="w-5 h-5 text-brand-accent" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-brand-text">基础数据</h2>
          <p className="text-sm text-brand-muted">管理系统基础数据</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-brand-border/30 rounded-lg p-0.5 overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setShowAdd(false); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
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
            onClick={loadData}
            className="inline-flex items-center gap-1.5 text-sm text-brand-accent hover:underline"
          >
            <RefreshCw className="w-4 h-4" />
            重试
          </button>
        </div>
      ) : (
        <>
          {/* Add button & form */}
          <div className="flex justify-end">
            {!showAdd && (
              <button
                onClick={() => setShowAdd(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-accent text-white text-sm font-medium hover:bg-brand-accent/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                添加
              </button>
            )}
          </div>

          {showAdd && (
            <AddForm
              fields={addFields}
              onSubmit={handleAdd}
              onCancel={() => setShowAdd(false)}
            />
          )}

          {/* Empty state */}
          {currentItems.length === 0 && !showAdd && (
            <div className="card text-center py-8">
              <GraduationCap className="w-8 h-8 text-brand-muted mx-auto mb-2" />
              <p className="text-sm text-brand-muted">暂无数据</p>
            </div>
          )}

          {/* Table */}
          {currentItems.length > 0 && (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-border">
                      {columns.map((col) => (
                        <th
                          key={col}
                          className="text-left py-3 px-4 font-medium text-brand-muted whitespace-nowrap"
                        >
                          {columnLabels[col] || col}
                        </th>
                      ))}
                      <th className="text-right py-3 px-4 font-medium text-brand-muted whitespace-nowrap">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((item) => {
                      const isEditing = editingId === item.id;
                      return (
                        <tr
                          key={item.id}
                          className="border-b border-brand-border/50 hover:bg-brand-border/20"
                        >
                          {columns.map((col) => (
                            <td key={col} className="py-3 px-4 whitespace-nowrap">
                              {isEditing && inlineEditFields.includes(col) ? (
                                <input
                                  type="text"
                                  value={editValues[col] || ''}
                                  onChange={(e) => handleEditChange(col, e.target.value)}
                                  className="w-24 sm:w-32 px-2 py-1 rounded border border-brand-accent/50 bg-brand-card text-sm text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-accent"
                                />
                              ) : (
                                renderCell(item, col)
                              )}
                            </td>
                          ))}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {isEditing ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleEdit(item.id)}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-brand-success hover:bg-brand-success/10 transition-colors"
                                >
                                  <Save className="w-3 h-3" />
                                  保存
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-brand-muted hover:bg-brand-border/30 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                  取消
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => startEdit(item)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-brand-accent hover:bg-brand-accent-light transition-colors"
                              >
                                <Edit2 className="w-3 h-3" />
                                编辑
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
