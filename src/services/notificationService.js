import apiClient, { emitStoreChange, getStoredUser } from './apiClient';
import { mapApartment } from './apartmentService';

const asArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  return value?.notifications || value?.data?.notifications || value?.data || value?.items || [];
};

export const mapNotification = (notification) => {
  if (!notification) {
    return null;
  }

  const apartment = notification.relatedApartment || notification.apartment || notification.apartmentData || null;

  return {
    ...notification,
    _id: notification.id || notification._id || notification.notificationId || '',
    id: notification.id || notification._id || notification.notificationId || '',
    title: notification.title || notification.subject || '',
    message: notification.body || notification.message || notification.text || '',
    type: notification.type || 'system',
    isRead: Boolean(notification.isRead),
    createdAt: notification.createdAt || notification.created_at || notification.timestamp || '',
    receiverId: notification.receiverId || notification.receiver_id || '',
    relatedApartment: apartment ? mapApartment(apartment) : null,
  };
};

const normalizeNotificationList = (payload) => asArray(payload).map(mapNotification).filter(Boolean);

export const notificationsAPI = {
  getNotifications: async (userId = getStoredUser()?.id || getStoredUser()?._id) => {
    const response = await apiClient.get('/notifications', {
      params: { receiverId: userId },
    });
    return { data: { notifications: normalizeNotificationList(response.data) } };
  },

  getMyNotifications: async (userId = getStoredUser()?.id || getStoredUser()?._id) =>
    notificationsAPI.getNotifications(userId),

  createNotification: async (data) => {
    const response = await apiClient.post('/notifications', data);
    emitStoreChange();
    return response;
  },

  markOneNotificationRead: async (id) => {
    const response = await apiClient.patch(`/notifications/${id}/read`);
    emitStoreChange();
    return response;
  },

  markAllNotificationsRead: async (userId = getStoredUser()?.id || getStoredUser()?._id) => {
    const response = await apiClient.patch(`/notifications/read-all/${userId}`);
    emitStoreChange();
    return response;
  },

  markAsRead: async (id) => notificationsAPI.markOneNotificationRead(id),
  markAllAsRead: async (userId) => notificationsAPI.markAllNotificationsRead(userId),
};
