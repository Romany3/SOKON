import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AccessDenied } from '../pages/AccessDenied';

export const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, loading, fetchUser } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyAdmin = async () => {
      // Re-fetch user data to ensure role is up to date from backend
      if (isAuthenticated) {
        await fetchUser();
      }
      setIsVerifying(false);
    };
    
    verifyAdmin();
  }, [isAuthenticated, fetchUser]);

  if (loading || isVerifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7fb]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#1F3A7D] border-t-transparent"></div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Verifying Admin Access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role strictly against "admin"
  if (user?.role !== 'admin') {
    return <AccessDenied />;
  }

  return children;
};
