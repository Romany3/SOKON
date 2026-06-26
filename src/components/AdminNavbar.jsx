import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AVATAR_SM_PLACEHOLDER } from '../utils/placeholders';

export const AdminNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: 'fas fa-chart-pie' },
    { name: 'Users', path: '/admin/users', icon: 'fas fa-users' },
    { name: 'Apartments', path: '/admin/apartments', icon: 'fas fa-building' },
    { name: 'Messages', path: '/admin/messages', icon: 'fas fa-comments' },
    { name: 'Broadcast', path: '/admin/broadcast', icon: 'fas fa-bullhorn' },
    { name: 'Audit Logs', path: '/admin/logs', icon: 'fas fa-clipboard-list' },
  ];

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link to="/admin/dashboard" className="flex items-center gap-2">
              <span className="text-2xl font-black text-primary tracking-tighter">SOKON</span>
              <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-md tracking-widest uppercase">Admin</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden xl:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    location.pathname === link.path || (link.path !== '/admin/dashboard' && location.pathname.startsWith(link.path))
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <i className={link.icon}></i>
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Right Section - Search and Notifications Removed */}
          <div className="flex items-center">
            <div className="h-8 w-[1px] bg-slate-100 mx-4"></div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-50 transition"
              >
                <div className="h-10 w-10 rounded-xl overflow-hidden shadow-sm border border-slate-100 bg-slate-100">
                  <img
                    src={user?.avatar || AVATAR_SM_PLACEHOLDER}
                    alt="Admin"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="hidden lg:block text-left pr-1">
                  <p className="text-sm font-black text-slate-900 leading-none">{user?.fullName || 'Admin'}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-wider">Super Administrator</p>
                </div>
                <i className={`fas fa-chevron-down text-[10px] text-slate-300 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`}></i>
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-[24px] shadow-2xl border border-slate-100 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-5 py-4 border-b border-slate-50 mb-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Authenticated as</p>
                    <p className="text-sm font-black text-slate-900 truncate">{user?.email}</p>
                  </div>
                  
                  <Link
                    to="/admin/dashboard"
                    className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                      <i className="fas fa-th-large text-xs"></i>
                    </div>
                    Control Panel
                  </Link>

                  <div className="h-px bg-slate-50 my-2 mx-5"></div>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition text-left"
                  >
                    <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center text-red-400">
                      <i className="fas fa-sign-out-alt text-xs"></i>
                    </div>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
