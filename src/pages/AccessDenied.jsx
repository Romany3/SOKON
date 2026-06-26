import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const AccessDenied = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/home');
    }, 4000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-[40px] shadow-[0_24px_80px_rgba(15,23,42,0.1)] p-10 text-center border border-slate-100">
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8">
          <i className="fas fa-shield-exclamation text-4xl text-red-500"></i>
        </div>
        
        <h1 className="text-3xl font-black text-slate-900 mb-4">Access Denied</h1>
        <p className="text-slate-500 leading-relaxed mb-8">
          You do not have the required permissions to access the Administration Panel.
        </p>

        <div className="bg-slate-50 rounded-2xl p-4 mb-8">
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
             Redirecting to safety in 4 seconds...
           </p>
        </div>

        <button 
          onClick={() => navigate('/home')}
          className="w-full py-4 rounded-2xl bg-slate-900 text-white font-bold hover:opacity-90 transition shadow-lg shadow-slate-200"
        >
          Go to Homepage Now
        </button>
      </div>
    </div>
  );
};
