import React, { useEffect, useState } from 'react';
import { AdminNavbar } from '../components/AdminNavbar';
import { notificationsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const AdminNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationsAPI.getNotifications(user?._id);
      setNotifications(res.data?.notifications || []);
    } catch (err) {
      console.error('Error fetching admin notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) fetchNotifications();
  }, [user?._id]);

  const markAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead(user._id);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <AdminNavbar />

      <main className="max-w-[1000px] mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-900">System Notifications</h1>
            <p className="text-slate-500 mt-1">Stay updated with platform activity</p>
          </div>
          
          {notifications.some(n => !n.read) && (
            <button 
              onClick={markAllAsRead}
              className="text-primary font-bold text-sm hover:underline flex items-center gap-2"
            >
              <i className="fas fa-check-double"></i>
              Mark all as read
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-white rounded-3xl animate-pulse border border-slate-100"></div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-[32px] border border-slate-100 p-20 text-center shadow-sm">
             <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-bell-slash text-3xl text-slate-200"></i>
             </div>
             <h3 className="text-xl font-bold text-slate-900">No notifications</h3>
             <p className="text-slate-500 mt-2">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div 
                key={notification._id}
                className={`group p-6 rounded-3xl border transition-all flex items-start gap-5 ${
                  notification.read 
                    ? 'bg-white border-slate-100 opacity-70' 
                    : 'bg-white border-primary/20 shadow-lg shadow-primary/5'
                }`}
              >
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                  notification.type === 'admin_announcement' ? 'bg-primary/10 text-primary' :
                  notification.type === 'booking_request' ? 'bg-amber-50 text-amber-600' :
                  'bg-slate-100 text-slate-500'
                }`}>
                  <i className={
                    notification.type === 'admin_announcement' ? 'fas fa-bullhorn' :
                    notification.type === 'booking_request' ? 'fas fa-calendar-alt' :
                    'fas fa-bell'
                  }></i>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className={`font-bold text-slate-900 ${notification.read ? '' : 'text-lg'}`}>
                      {notification.title}
                    </h4>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-500 mt-1 text-sm leading-relaxed">
                    {notification.body}
                  </p>
                  
                  {!notification.read && (
                    <button 
                      onClick={() => markAsRead(notification._id)}
                      className="mt-4 text-xs font-black text-primary uppercase tracking-widest hover:underline"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
