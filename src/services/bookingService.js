import apiClient, { emitStoreChange, getStoredUser } from './apiClient';
import { mapApartment, apartmentsAPI } from './apartmentService';
import { mapUser } from './userService';

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  return value?.bookings || value?.data?.bookings || value?.data || value?.items || [];
};

const normalizeStatus = (status) => {
  const value = `${status || 'pending'}`.trim().toLowerCase();
  // Standardizing statuses for UI labels: Pending, Accepted, Rejected, Cancelled
  if (value === 'accepted' || value === 'approved') return 'accepted';
  if (value === 'rejected' || value === 'declined') return 'rejected';
  if (value === 'canceled' || value === 'cancelled') return 'cancelled';
  return value;
};

const normalizeDate = (value) => {
  if (!value) return '';
  if (typeof value === 'string' && value.includes('T')) return value.slice(0, 10);
  return value;
};

export const mapBooking = (booking) => {
  if (!booking) return null;

  const apartment = booking.apartment ? mapApartment(booking.apartment) : null;
  const student = booking.student || booking.client || null;

  return {
    ...booking,
    _id: String(booking.id || booking._id || ''),
    id: String(booking.id || booking._id || ''),
    apartmentId: String(booking.apartmentId || apartment?._id || ''),
    ownerId: String(booking.ownerId || apartment?.ownerId || ''),
    clientId: String(booking.clientId || student?._id || ''),
    status: normalizeStatus(booking.status),
    startDate: normalizeDate(booking.startDate || booking.checkInDate || booking.start_date || ''),
    endDate: normalizeDate(booking.endDate || booking.checkOutDate || booking.end_date || ''),
    people_count: Number(booking.people_count || booking.requestedOccupants || 1),
    totalPrice: Number(booking.totalPrice || 0),
    message: booking.message || '',
    createdAt: booking.createdAt || '',
    apartment,
    student: student ? mapUser(student) : null,
  };
};

const normalizeBookingList = (payload) => asArray(payload).map(mapBooking).filter(Boolean);

export const bookingsAPI = {
  // Requirement: GET /bookings/active/check?userId={userId}&apartmentId={apartmentId}
  checkActiveBooking: async (userId, apartmentId) => {
    try {
      const response = await apiClient.get('/bookings/active/check', {
        params: { userId, apartmentId }
      });
      return response.data; // Expected { exists: boolean }
    } catch (error) {
      console.warn('Active check failed, falling back to manual scan');
      const res = await bookingsAPI.getStudentBookings(userId);
      const list = res.data?.bookings || [];
      const exists = list.some(b => 
        String(b.apartmentId) === String(apartmentId) && 
        ['pending', 'approved', 'accepted'].includes(b.status)
      );
      return { exists };
    }
  },

  // Requirement: POST /bookings
  createBooking: async (data) => {
    const payload = {
      apartmentId: data.apartmentId,
      apartmentName: data.apartmentName,
      apartmentAddress: data.apartmentAddress,
      apartmentImage: data.apartmentImage,
      ownerId: data.ownerId,
      ownerName: data.ownerName,
      startDate: data.startDate, // ISO String
      endDate: data.endDate,     // ISO String
      totalPrice: Number(data.totalPrice),
      people_count: Number(data.people_count),
      status: "pending"
    };

    const response = await apiClient.post('/bookings', payload);
    const bookingData = response.data?.booking || response.data;
    const bookingId = bookingData?._id || bookingData?.id;

    // Requirement: POST /functions/send-booking-notification
    if (bookingId && data.ownerId) {
      try {
        await apiClient.post('/functions/send-booking-notification', {
          ownerId: data.ownerId,
          bookingId: bookingId,
          title: "New Booking Request",
          body: "You have received a new booking request",
          type: "new_booking"
        });
      } catch (err) {
        console.error('Owner notification failed:', err);
      }
    }

    emitStoreChange();
    return { data: mapBooking(bookingData) };
  },

  // Requirement: GET /bookings?clientId={userId}
  getStudentBookings: async (userId = getStoredUser()?.id || getStoredUser()?._id) => {
    const response = await apiClient.get('/bookings', { params: { clientId: userId } });
    return { data: { bookings: normalizeBookingList(response.data) } };
  },

  // Requirement: GET /bookings?ownerId={userId}
  getOwnerBookings: async (ownerId = getStoredUser()?.id || getStoredUser()?._id) => {
    const response = await apiClient.get('/bookings', { params: { ownerId: ownerId } });
    return { data: { bookings: normalizeBookingList(response.data) } };
  },

  getMyBookings: async (userId = getStoredUser()?.id || getStoredUser()?._id) =>
    bookingsAPI.getStudentBookings(userId),

  // Requirement: POST /rpc/update_booking_status_with_capacity
  updateBookingStatusWithCapacity: async ({ bookingId, status }) => {
    const response = await apiClient.post('/rpc/update_booking_status_with_capacity', {
      p_booking_id: bookingId,
      p_status: status,
    });
    emitStoreChange();
    return { data: mapBooking(response.data?.booking || response.data) };
  },

  acceptBooking: async (id) => bookingsAPI.updateBookingStatusWithCapacity({ bookingId: id, status: 'accepted' }),
  rejectBooking: async (id) => bookingsAPI.updateBookingStatusWithCapacity({ bookingId: id, status: 'rejected' }),
  cancelBooking: async (id) => bookingsAPI.updateBookingStatusWithCapacity({ bookingId: id, status: 'cancelled' }),
};

export { normalizeBookingList };
