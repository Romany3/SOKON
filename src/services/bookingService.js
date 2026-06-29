import apiClient, { emitStoreChange, getStoredUser } from './apiClient';
import { mapApartment, apartmentsAPI } from './apartmentService';
import { mapUser } from './userService';

const asArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  return value?.bookings || value?.data?.bookings || value?.data || value?.items || [];
};

const normalizeStatus = (status) => {
  const value = `${status || 'pending'}`.trim().toLowerCase();

  if (value === 'accepted') return 'approved';
  if (value === 'rejected') return 'declined';
  if (value === 'canceled') return 'cancelled';
  return value;
};

const normalizeDate = (value) => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string' && value.includes('T')) {
    return value.slice(0, 10);
  }

  return value;
};

const createFallbackApartment = (booking) => {
  if (booking.apartment) {
    return mapApartment(booking.apartment);
  }

  if (!booking.apartmentId && !booking.apartmentName) {
    return null;
  }

  return mapApartment({
    id: booking.apartmentId,
    name: booking.apartmentName,
    description: booking.apartmentDescription,
    price: booking.totalPrice || 0,
    images: booking.apartmentImage ? [booking.apartmentImage] : [],
    address: booking.apartmentAddress || '',
    city: booking.apartmentCity || '',
    district: booking.apartmentDistrict || '',
    ownerId: booking.ownerId,
    ownerName: booking.ownerName,
    ownerPhotoUrl: booking.ownerPhotoUrl,
    max_people: booking.max_people || booking.people_count || 0,
    available_people: booking.available_people || booking.people_count || 0,
  });
};

export const mapBooking = (booking) => {
  if (!booking) {
    return null;
  }

  const apartment = createFallbackApartment(booking);
  const student =
    booking.student ||
    booking.client ||
    (booking.clientId || booking.clientName
      ? mapUser({
          id: booking.clientId,
          name: booking.clientName,
          phoneNumber: booking.clientPhone,
          college: booking.clientCollege,
          gender: booking.clientGender,
          role: 'client',
          photoUrl: booking.clientAvatar,
        })
      : null);

  return {
    ...booking,
    _id: booking.id || booking._id || booking.bookingId || booking.booking_id || '',
    id: booking.id || booking._id || booking.bookingId || booking.booking_id || '',
    apartmentId: booking.apartmentId || booking.apartment?._id || booking.apartment?.id || '',
    ownerId: booking.ownerId || booking.apartment?.owner?._id || booking.apartment?.owner?.id || '',
    clientId: booking.clientId || student?._id || student?.id || '',
    status: normalizeStatus(booking.status),
    checkInDate: normalizeDate(booking.checkInDate || booking.startDate || booking.start_date),
    checkOutDate: normalizeDate(booking.checkOutDate || booking.endDate || booking.end_date),
    requestedOccupants: Number(booking.requestedOccupants || booking.people_count || booking.peopleCount || 1),
    rating: Number(booking.rating || 0),
    ratedAt: booking.ratedAt || booking.rated_at || '',
    message: booking.message || booking.note || booking.notes || '',
    createdAt: booking.createdAt || booking.created_at || booking.timestamp || '',
    apartment,
    student,
  };
};

const normalizeBookingList = (payload) => asArray(payload).map(mapBooking).filter(Boolean);

const normalizeCreatePayload = async (data = {}) => {
  const apartmentResponse = await apartmentsAPI.getApartment(data.apartmentId);
  const apartment = apartmentResponse.data;
  const peopleCount = Number(data.people_count || data.requestedOccupants || data.occupants || 1);
  const startDate = data.startDate || data.checkInDate || '';
  const endDate = data.endDate || data.checkOutDate || '';

  return {
    apartmentId: data.apartmentId,
    apartmentName: apartment?.name || apartment?.title || data.apartmentName || '',
    apartmentAddress: apartment?.address || apartment?.locationAddress || apartment?.location || data.apartmentAddress || '',
    apartmentImage: apartment?.images?.[0] || data.apartmentImage || null,
    ownerId: apartment?.ownerId || apartment?.owner?._id || apartment?.owner?.id || data.ownerId || '',
    ownerName: apartment?.ownerName || apartment?.owner?.name || apartment?.owner?.fullName || data.ownerName || '',
    startDate: startDate ? new Date(startDate).toISOString() : '',
    endDate: endDate ? new Date(endDate).toISOString() : '',
    totalPrice: data.totalPrice !== undefined && data.totalPrice !== null
      ? Number(data.totalPrice)
      : Number(apartment?.price || 0) * Math.max(peopleCount, 1),
    people_count: peopleCount,
    status: data.status || 'pending',
    message: data.message || '',
  };
};

export const bookingsAPI = {
  createBooking: async (data) => {
    const payload = await normalizeCreatePayload(data);
    const response = await apiClient.post('/bookings', payload);
    emitStoreChange();
    return { data: mapBooking(response.data?.booking || response.data?.data?.booking || response.data) };
  },

  getStudentBookings: async (userId = getStoredUser()?.id || getStoredUser()?._id) => {
    const response = await apiClient.get('/bookings', { params: { clientId: userId } });
    return { data: { bookings: normalizeBookingList(response.data) } };
  },

  getOwnerBookings: async (ownerId = getStoredUser()?.id || getStoredUser()?._id) => {
    const response = await apiClient.get('/bookings', { params: { ownerId } });
    return { data: { bookings: normalizeBookingList(response.data) } };
  },

  getMyBookings: async (userId = getStoredUser()?.id || getStoredUser()?._id) =>
    bookingsAPI.getStudentBookings(userId),

  checkActiveBooking: async ({ userId, apartmentId }) => {
    const response = await apiClient.get('/bookings/active/check', {
      params: { userId, apartmentId },
    });
    return response.data;
  },

  updateBookingStatus: async ({ bookingId, status }) => {
    const response = await apiClient.post(`/bookings/${bookingId}/status`, { status });
    emitStoreChange();
    return { data: mapBooking(response.data?.booking || response.data?.data?.booking || response.data) };
  },

  updateBookingStatusWithCapacity: async ({ bookingId, status }) => {
    const response = await apiClient.post('/rpc/update_booking_status_with_capacity', {
      p_booking_id: bookingId,
      p_status: status,
    });
    emitStoreChange();
    return { data: mapBooking(response.data?.booking || response.data?.data?.booking || response.data) };
  },

  rateBooking: async ({ bookingId, rating }) => {
    const response = await apiClient.post(`/bookings/${bookingId}/rating`, { rating });
    emitStoreChange();
    return { data: mapBooking(response.data?.booking || response.data?.data?.booking || response.data) };
  },

  acceptBooking: async (bookingId) => bookingsAPI.updateBookingStatus({ bookingId, status: 'accepted' }),
  rejectBooking: async (bookingId) => bookingsAPI.updateBookingStatus({ bookingId, status: 'rejected' }),
  cancelBooking: async (bookingId) => bookingsAPI.updateBookingStatusWithCapacity({ bookingId, status: 'cancelled' }),
};

export { normalizeBookingList };