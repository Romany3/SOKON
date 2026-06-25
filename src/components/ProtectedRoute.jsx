import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, requiredRole, allowUnauthenticated = false, allowIncomplete = false }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7fb]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#245999] border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return allowUnauthenticated ? children : <Navigate to="/login" replace />;
  }

  if (allowIncomplete) {
    return children;
  }

  // Google Sign-In redirect check: User has logged in but has an incomplete profile
  if (!user.role || !user.gender) {
    return <Navigate to="/role-selection" replace />;
  }

  // Role authorization
  if (requiredRole) {
    const userRole = user.role === 'client' ? 'student' : user.role;
    if (userRole !== requiredRole) {
      return <Navigate to="/home" replace />;
    }
  }

  return children;
};
