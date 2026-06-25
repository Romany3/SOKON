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
        const response = await notificationsAPI.getMyNotifications();
        const data = response.data;
        setNotifications(Array.isArray(data) ? data : (data?.notifications || []));
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [storeVersion]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  );

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
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
                Booking updates, approvals, rejections, and system alerts appear here.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total</p>
                <p className="mt-1 text-2xl font-black text-slate-900">{notifications.length}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Unread</p>
                <p className="mt-1 text-2xl font-black text-slate-900">{unreadCount}</p>
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="rounded-full bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {loading ? (
          <div className="rounded-[28px] bg-white py-20 text-center text-slate-500 shadow-sm">
            Loading notifications...
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-5">
            {notifications.map((notification) => {
              const meta = notificationMeta[notification.type] || notificationMeta.system;
              return (
                <div
                  key={notification._id}
                  className={`rounded-[28px] border bg-white p-6 shadow-sm transition hover:shadow-lg ${
                    notification.isRead ? 'border-transparent' : 'border-blue-200'
                  }`}
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-start">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 ${meta.color}`}>
                      <i className={`fas ${meta.icon} text-xl`} />
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-black text-slate-900">{notification.title}</h3>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                          {meta.label}
                        </span>
                        {!notification.isRead && (
                          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                            New
                          </span>
                        )}
                      </div>

                      <p className="mt-3 max-w-3xl text-slate-600">{notification.message}</p>

                      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-400">
                        <span>{new Date(notification.createdAt).toLocaleString()}</span>
                        <button
                          type="button"
                          onClick={() => handleMarkAsRead(notification._id)}
                          className="font-semibold text-[#245999] transition hover:text-[#1f4f86]"
                        >
                          Mark as read
                        </button>
                        {notification.relatedApartment && (
                          <button
                            type="button"
                            onClick={() => navigate(`/apartment/${notification.relatedApartment._id}`)}
                            className="font-semibold text-slate-700 transition hover:text-slate-900"
                          >
                            View apartment
                          </button>
                        )}
                      </div>
                    </div>

                    {notification.relatedApartment && (
                      <img
                        src={notification.relatedApartment.images?.[0] || APARTMENT_PLACEHOLDER}
                        alt={notification.relatedApartment.title || notification.relatedApartment.name}
                        className="hidden h-24 w-24 rounded-2xl object-cover md:block"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[28px] bg-white py-20 text-center shadow-sm">
            <i className="fas fa-inbox text-6xl text-slate-300 mb-5"></i>
            <h3 className="text-2xl font-bold mb-2 text-slate-900">No notifications yet</h3>
            <p className="text-slate-500">Booking updates and system alerts will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};
