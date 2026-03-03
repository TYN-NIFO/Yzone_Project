import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

type UserRole = 'tynExecutive' | 'facilitator' | 'facultyPrincipal' | 'industryMentor' | 'student';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { currentUser, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser && !allowedRoles.includes(currentUser.role as UserRole)) {
    const roleHome: Record<string, string> = {
      student: '/student',
      facilitator: '/facilitator',
      facultyPrincipal: '/faculty',
      tynExecutive: '/executive',
      industryMentor: '/mentor',
    };
    return <Navigate to={roleHome[currentUser.role] || '/login'} replace />;
  }

  return <>{children}</>;
}
