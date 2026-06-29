import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../services/api';
import { AVATAR_SM_PLACEHOLDER } from '../utils/placeholders';

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Periodic check for new notifications (Badge only)
  useEffect(() => {
    let interval;
    const fetchUnreadCount = async () => {
      if (!isAuthenticated || !user?._id) return;
      try {
        const [personalRes, broadcastRes] = await Promise.all([
          notificationsAPI.getMyNotifications(),
          notificationsAPI.getNotifications('all')
        ]);
        
        const personalData = personalRes.data?.notifications || (Array.isArray(personalRes.data) ? personalRes.data : []);
        const broadcastData = broadcastRes.data?.notifications || (Array.isArray(broadcastRes.data) ? broadcastRes.data : []);
        
        const combined = [...personalData, ...broadcastData];
        // Deduplicate
        const unique = combined.filter((v, i, a) => a.findIndex(t => t._id === v._id) === i);
        const count = unique.filter(n => !n.isRead && n.receiverId !== 'all').length;
        setUnreadCount(count);
      } catch (err) {
        console.error('Error fetching notification count:', err);
      }
    };

    if (isAuthenticated) {
      fetchUnreadCount();
      interval = setInterval(fetchUnreadCount, 15000); // 15 seconds for global badge
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAuthenticated, user?._id]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';

  const navLinkClass = (path) => `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition ${
    location.pathname === path ? 'text-primary' : 'text-gray-700 hover:text-primary'
  }`;

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/home" className="flex items-center">
            <span className="text-2xl font-bold text-primary">SOKON</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            <Link to="/home" className={navLinkClass('/home')}>
              <i className="fas fa-home"></i>Home
            </Link>
            <Link to="/universities" className={navLinkClass('/universities')}>
              <i className="fas fa-university"></i>Universities
            </Link>
            <Link to="/search" className={navLinkClass('/search')}>
              <i className="fas fa-search"></i>Search
            </Link>
            <Link to="/notifications" className={`${navLinkClass('/notifications')} relative`}>
              <i className="fas fa-bell"></i>Notifications
              {unreadCount > 0 && (
                <span className="absolute top-0 right-[-8px] h-5 min-w-[20px] px-1 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[10px] text-white font-black shadow-sm">
                  {unreadCount > 99 ? '99+' : `+${unreadCount}`}
                </span>
              )}
            </Link>
            <Link to="/messages" className={navLinkClass('/messages')}>
              <i className="fas fa-comments"></i>Messages
            </Link>
            {user?.role === 'owner' && (
              <Link to="/add-apartment" className={navLinkClass('/add-apartment')}>
                <i className="fas fa-plus"></i>Add Apartment
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin/dashboard"
                className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition ml-2 flex items-center gap-2"
              >
                <i className="fas fa-shield-halved"></i>
                Admin Panel
              </Link>
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center space-x-2 text-gray-700 hover:text-primary transition"
              >
                <img
                  src={user?.avatar || AVATAR_SM_PLACEHOLDER}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover border border-slate-100 shadow-sm"
                />
                <span className="text-sm font-medium hidden sm:inline">{user?.fullName}</span>
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50 border border-slate-50">
                  {isAdmin && (
                    <Link
                      to="/admin/dashboard"
                      className="block px-4 py-2 text-primary font-bold hover:bg-light transition border-b border-slate-50"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <i className="fas fa-th-large mr-2"></i>Admin Dashboard
                    </Link>
                  )}
                  {user?.role === 'owner' && (
                    <>
                      <Link
                        to="/my-apartment"
                        className="block px-4 py-2 text-gray-700 hover:bg-light transition"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <i className="fas fa-building mr-2"></i>My Apartments
                      </Link>
                      <Link
                        to="/booking-requests"
                        className="block px-4 py-2 text-gray-700 hover:bg-light transition"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <i className="fas fa-calendar-check mr-2"></i>Booking Requests
                      </Link>
                    </>
                  )}
                  {user?.role === 'student' && (
                    <Link
                      to="/my-bookings"
                      className="block px-4 py-2 text-gray-700 hover:bg-light transition"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <i className="fas fa-calendar-check mr-2"></i>
                      My Bookings
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-gray-700 hover:bg-light transition"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    <i className="fas fa-user mr-2"></i>Profile
                  </Link>
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-light transition font-medium"
                  >
                    <i className="fas fa-sign-out-alt mr-2"></i>Logout
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-700 hover:text-primary transition"
            >
              <i className="fas fa-bars text-xl"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-light border-t border-gray-200 py-2">
          {isAdmin && (
            <Link
              to="/admin/dashboard"
              className="block px-4 py-2 text-primary font-bold hover:bg-primary hover:text-white transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              <i className="fas fa-shield-halved mr-2"></i>Admin Dashboard
            </Link>
          )}
          <Link
            to="/home"
            className="block px-4 py-2 text-gray-700 hover:text-primary transition"
            onClick={() => setMobileMenuOpen(false)}
          >
            <i className="fas fa-home mr-2"></i>Home
          </Link>
          <Link
            to="/universities"
            className="block px-4 py-2 text-gray-700 hover:text-primary transition"
            onClick={() => setMobileMenuOpen(false)}
          >
            <i className="fas fa-university mr-2"></i>Universities
          </Link>
          <Link
            to="/search"
            className="block px-4 py-2 text-gray-700 hover:text-primary transition"
            onClick={() => setMobileMenuOpen(false)}
          >
            <i className="fas fa-search mr-2"></i>Search
          </Link>
          <Link
            to="/notifications"
            className="block px-4 py-2 text-gray-700 hover:text-primary transition relative"
            onClick={() => setMobileMenuOpen(false)}
          >
            <i className="fas fa-bell mr-2"></i>Notifications
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center h-4 min-w-[16px] px-1 bg-red-500 rounded-full text-[9px] text-white font-black">
                +{unreadCount}
              </span>
            )}
          </Link>
          <Link
            to="/messages"
            className="block px-4 py-2 text-gray-700 hover:text-primary transition"
            onClick={() => setMobileMenuOpen(false)}
          >
            <i className="fas fa-comments mr-2"></i>Messages
          </Link>
          {user?.role === 'owner' && (
            <Link
              to="/add-apartment"
              className="block px-4 py-2 text-gray-700 hover:text-primary transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              <i className="fas fa-plus mr-2"></i>Add Apartment
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};
