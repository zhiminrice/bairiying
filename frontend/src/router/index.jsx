import { createBrowserRouter, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import AppLayout from '../components/layout/AppLayout';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import Login from '../pages/Login';
import LeaderDashboard from '../pages/leader/Dashboard';
import AttendancePage from '../pages/leader/AttendancePage';
import AssignmentsPage from '../pages/leader/AssignmentsPage';
import RecordsPage from '../pages/leader/RecordsPage';
import TeacherDashboard from '../pages/teacher/Dashboard';
import ContentBrowse from '../pages/teacher/ContentBrowse';
import CommentsPage from '../pages/teacher/CommentsPage';
import AdminDashboard from '../pages/admin/AdminDashboard';
import ConsultationPage from '../pages/leader/ConsultationPage';
import SlotManagement from '../pages/teacher/SlotManagement';
import AdminStats from '../pages/admin/StatsPage';
import WitnessManage from '../pages/admin/WitnessManage';
import WitnessWall from '../pages/admin/WitnessWall';
import WitnessSubmit from '../pages/leader/WitnessSubmit';
import DataManage from '../pages/admin/DataManage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <RoleRedirect />,
      },
      {
        path: 'leader',
        element: (
          <ProtectedRoute role="leader">
            <LeaderDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'leader/attendance',
        element: (
          <ProtectedRoute role="leader">
            <AttendancePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'leader/assignments',
        element: (
          <ProtectedRoute role="leader">
            <AssignmentsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'leader/records',
        element: (
          <ProtectedRoute role="leader">
            <RecordsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'leader/consultations',
        element: (
          <ProtectedRoute role="leader">
            <ConsultationPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'leader/witness',
        element: (
          <ProtectedRoute role="leader">
            <WitnessSubmit />
          </ProtectedRoute>
        ),
      },
      {
        path: 'teacher',
        element: (
          <ProtectedRoute role="teacher">
            <TeacherDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'teacher/content',
        element: (
          <ProtectedRoute role="teacher">
            <ContentBrowse />
          </ProtectedRoute>
        ),
      },
      {
        path: 'teacher/comments',
        element: (
          <ProtectedRoute role="teacher">
            <CommentsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'teacher/slots',
        element: (
          <ProtectedRoute role="teacher">
            <SlotManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin',
        element: (
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/stats',
        element: (
          <ProtectedRoute role="admin">
            <AdminStats />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/witnesses',
        element: (
          <ProtectedRoute role="admin">
            <WitnessManage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/data',
        element: (
          <ProtectedRoute role="admin">
            <DataManage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: 'witness-wall',
    element: <WitnessWall />,
  },
]);

function RoleRedirect() {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'leader') return <Navigate to="/leader" replace />;
  if (user.role === 'teacher') return <Navigate to="/teacher" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;

  return <Navigate to="/login" replace />;
}

function PlaceholderPage({ title }) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="card">
        <h2 className="text-lg font-semibold text-brand-text mb-2">{title}</h2>
        <p className="text-sm text-brand-muted">该功能正在开发中，敬请期待。</p>
      </div>
    </div>
  );
}
