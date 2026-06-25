import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        // Google users with incomplete profile (no role or no gender) -> send to role selection
        if (!user?.role || !user?.gender) {
          navigate('/role-selection', { replace: true });
        } else {
          navigate('/home', { replace: true });
        }
      } else {
        // If not authenticated after callback, go to login
        navigate('/login', { replace: true });
      }
    }
  }, [isAuthenticated, user, loading, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f7fb] px-4">
      <div className="rounded-[28px] border border-slate-200 bg-white px-8 py-10 text-center shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#245999] border-t-transparent" />
        <h1 className="text-2xl font-black text-slate-900">Completing sign in</h1>
        <p className="mt-2 text-sm text-slate-500">Please wait while we restore your session.</p>
      </div>
    </div>
  );
};

