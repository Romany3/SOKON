import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AVATAR_SM_PLACEHOLDER } from '../utils/placeholders';

export const AdminNavbar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: 'fas fa-chart-pie' },
    { name: 'Users', path: '/admin/users', icon: 'fas fa-users' },
    { name: 'Apartments', path: '/admin/apartments', icon: 'fas fa-building' },
    { name: 'Messages', path: '/admin/messages', icon: 'fas fa-comments' },
    { name: 'Audit Logs', path: '/admin/logs', icon: 'fas fa-clipboard-list' },
  ];

  return (
    <>
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo & Hamburger */}
            <div className="flex items-center gap-4 lg:gap-8">
              {/* Hamburger Button (Tablet/Mobile) */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="xl:hidden h-11 w-11 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition"
              >
                <i className="fas fa-bars text-lg"></i>
              </button>

              <Link to="/admin/dashboard" className="flex items-center gap-2">
                <span className="text-2xl font-black text-primary tracking-tighter">SOKON</span>
                <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-md tracking-widest uppercase hidden sm:inline-block">Admin</span>
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

            {/* Right Section */}
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-50 transition">
                <div className="h-10 w-10 rounded-xl overflow-hidden shadow-sm border border-slate-100 bg-slate-100">
                    <img
                      src={AVATAR_SM_PLACEHOLDER}
                      alt="Admin"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="text-left pr-1">
                    <p className="text-sm font-black text-slate-900 leading-none">Admin</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-wider">Administrator</p>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar/Drawer */}
      <div 
        className={`fixed inset-0 z-[60] bg-slate-950/50 backdrop-blur-sm transition-opacity duration-300 xl:hidden ${
          isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsSidebarOpen(false)}
      >
        <aside 
          className={`absolute inset-y-0 left-0 w-80 bg-white shadow-2xl transition-transform duration-300 transform flex flex-col ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <Link to="/admin/dashboard" className="flex items-center gap-2" onClick={() => setIsSidebarOpen(false)}>
              <span className="text-2xl font-black text-primary tracking-tighter">SOKON</span>
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 transition"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-bold transition-all ${
                  location.pathname === link.path || (link.path !== '/admin/dashboard' && location.pathname.startsWith(link.path))
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                  location.pathname === link.path ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  <i className={link.icon}></i>
                </div>
                {link.name}
              </Link>
            ))}
          </div>

          <div className="p-4 border-t border-slate-50">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-bold text-red-600 hover:bg-red-50 transition"
            >
              <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center text-red-400">
                <i className="fas fa-sign-out-alt"></i>
              </div>
              Sign Out Account
            </button>
          </div>
        </aside>
      </div>
    </>
  );
};
