import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useAuth } from './context/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

// Student
import StudentDashboard from './pages/student/StudentDashboard';

// Facilitator
import FacilitatorDashboard from './pages/facilitator/FacilitatorDashboard';

// Faculty/Principal
import FacultyDashboard from './pages/faculty/FacultyDashboard';

// Executive (Tyn Executive)
import ExecutiveDashboard from './pages/executive/ExecutiveDashboard';

// Industry Mentor
import MentorDashboard from './pages/mentor/MentorDashboard';

// User Management
import UserManagement from './pages/UserManagement';

function AppRoutes() {
  const { currentUser } = useAuth();

  const getRoleRoute = (role: string) => {
    const routes: Record<string, string> = {
      student: '/student',
      facilitator: '/facilitator',
      facultyPrincipal: '/faculty',
      tynExecutive: '/executive',
      industryMentor: '/mentor',
    };
    return routes[role] || '/login';
  };

  const defaultRoute = currentUser ? getRoleRoute(currentUser.role) : '/login';

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/" element={<Navigate to={defaultRoute} replace />} />

      {/* Student Routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      {/* Facilitator Routes */}
      <Route
        path="/facilitator"
        element={
          <ProtectedRoute allowedRoles={['facilitator']}>
            <FacilitatorDashboard />
          </ProtectedRoute>
        }
      />

      {/* Faculty/Principal Routes */}
      <Route
        path="/faculty"
        element={
          <ProtectedRoute allowedRoles={['facultyPrincipal']}>
            <FacultyDashboard />
          </ProtectedRoute>
        }
      />

      {/* Tyn Executive Routes */}
      <Route
        path="/executive"
        element={
          <ProtectedRoute allowedRoles={['tynExecutive']}>
            <ExecutiveDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/executive/users"
        element={
          <ProtectedRoute allowedRoles={['tynExecutive']}>
            <UserManagement />
          </ProtectedRoute>
        }
      />

      {/* Industry Mentor Routes */}
      <Route
        path="/mentor"
        element={
          <ProtectedRoute allowedRoles={['industryMentor']}>
            <MentorDashboard />
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to={defaultRoute} replace />} />
    </Routes>
  );
}

export default AppRoutes;
