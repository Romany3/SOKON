import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { notificationsAPI } from '../services/api';
import { useStoreVersion } from '../hooks/useStoreVersion';
import { APARTMENT_PLACEHOLDER } from '../utils/placeholders';

const notificationMeta = {
  booking_request: { icon: 'fa-calendar-plus', label: 'Booking request', color: 'text-amber-600' },
  booking_approved: { icon: 'fa-circle-check', label: 'Approved', color: 'text-emerald-600' },
  booking_rejected: { icon: 'fa-circle-xmark', label: 'Rejected', color: 'text-rose-600' },
  booking_cancelled: { icon: 'fa-ban', label: 'Cancelled', color: 'text-slate-600' },
  booking_completed: { icon: 'fa-flag-checkered', label: 'Completed', color: 'text-blue-600' },
  system_alert: { icon: 'fa-triangle-exclamation', label: 'Alert', color: 'text-orange-600' },
  admin_announcement: { icon: 'fa-bullhorn', label: 'Announcement', color: 'text-primary' },
  update: { icon: 'fa-wrench', label: 'System Update', color: 'text-blue-500' },
  alert: { icon: 'fa-circle-exclamation', label: 'Urgent Alert', color: 'text-red-500' },
  maintenance: { icon: 'fa-clock', label: 'Maintenance', color: 'text-amber-500' },
  system: { icon: 'fa-bell', label: 'System', color: 'text-slate-600' },
};

export const Notifications = () => {
  const navigate = useNavigate();
  const storeVersion = useStoreVersion();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNotifications = async () => {
      setLoading(true);

      try {
        // Fetch personal notifications AND global broadcasts simultaneously
        const [personalRes, broadcastRes] = await Promise.all([
          notificationsAPI.getMyNotifications(),
          notificationsAPI.getNotifications('all')
        ]);

        const personalData = personalRes.data?.notifications || (Array.isArray(personalRes.data) ? personalRes.data : []);
        const broadcastData = broadcastRes.data?.notifications || (Array.isArray(broadcastRes.data) ? broadcastRes.data : []);
        
        // Combine, deduplicate, and sort by date
        const combined = [...personalData, ...broadcastData]
          .filter((v, i, a) => a.findIndex(t => t._id === v._id) === i) // Dedupe
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setNotifications(combined);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [storeVersion]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead && notification.receiverId !== 'all').length,
    [notifications],
  );

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      <Navbar />

      <div className="px-4 pt-8">
        <div className="mx-auto max-w-7xl rounded-[32px] border border-slate-200 bg-white px-6 py-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] md:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                System feed
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">
                Notifications
              </h1>
              <p className="mt-2 max-w-2xl text-slate-600">
                Global announcements, booking updates, and platform alerts appear here.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-3 border border-slate-100">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total</p>
                <p className="mt-1 text-2xl font-black text-slate-900">{notifications.length}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 border border-slate-100">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Personal</p>
                <p className="mt-1 text-2xl font-black text-[#245999]">{unreadCount} New</p>
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="rounded-full bg-slate-900 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 shadow-lg shadow-slate-200"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {loading ? (
          <div className="space-y-4">
             {[...Array(3)].map((_, i) => (
               <div key={i} className="h-32 bg-white rounded-[28px] animate-pulse border border-slate-100"></div>
             ))}
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-5">
            {notifications.map((notification) => {
              const meta = notificationMeta[notification.type] || notificationMeta.system;
              const isBroadcast = notification.receiverId === 'all';
              
              return (
                <div
                  key={notification._id}
                  className={`rounded-[28px] border bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl ${
                    notification.isRead || isBroadcast ? 'border-transparent' : 'border-[#245999]/30 bg-[#245999]/5'
                  }`}
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-start">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 shrink-0 ${meta.color} shadow-sm`}>
                      <i className={`fas ${meta.icon} text-xl`} />
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className={`text-xl font-black text-slate-900 ${isBroadcast ? 'text-primary' : ''}`}>
                          {notification.title}
                        </h3>
                        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                          isBroadcast ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {isBroadcast ? 'Broadcast' : meta.label}
                        </span>
                        {!notification.isRead && !isBroadcast && (
                          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                        )}
                      </div>

                      <p className="mt-3 max-w-3xl text-slate-600 leading-relaxed font-medium">
                        {notification.message}
                      </p>

                      <div className="mt-5 flex flex-wrap items-center justify-between border-t border-slate-50 pt-4">
                        <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-tighter">
                          <span>{new Date(notification.createdAt).toLocaleDateString()}</span>
                          <span>at {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          {!notification.isRead && !isBroadcast && (
                            <button
                              type="button"
                              onClick={() => handleMarkAsRead(notification._id)}
                              className="text-xs font-black text-[#245999] uppercase tracking-widest hover:underline"
                            >
                              Mark as read
                            </button>
                          )}
                          {notification.relatedApartment && (
                            <button
                              type="button"
                              onClick={() => navigate(`/apartment/${notification.relatedApartment._id}`)}
                              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
                            >
                              View Unit
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {notification.relatedApartment && (
                      <div className="hidden md:block w-32 h-32 rounded-2xl overflow-hidden border border-slate-100 shadow-sm shrink-0">
                        <img
                          src={notification.relatedApartment.images?.[0] || APARTMENT_PLACEHOLDER}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[40px] bg-white py-20 text-center shadow-sm border border-slate-100">
            <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
               <i className="fas fa-inbox text-4xl text-slate-200"></i>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Your inbox is empty</h3>
            <p className="text-slate-400 font-medium">Booking updates and campus announcements will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};
