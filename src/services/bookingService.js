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
  if (!value) return '';
  if (typeof value === 'string' && value.includes('T')) return value.slice(0, 10);
  return value;
};

const createFallbackApartment = (booking) => {
  if (booking.apartment) return mapApartment(booking.apartment);
  if (!booking.apartmentId && !booking.apartment_id && !booking.apartmentName) return null;

  return mapApartment({
    id: booking.apartmentId || booking.apartment_id,
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
  });
};

export const mapBooking = (booking) => {
  if (!booking) return null;

  const apartment = createFallbackApartment(booking);
  const student =
    booking.student ||
    booking.client ||
    (booking.clientId || booking.clientName || booking.studentId
      ? mapUser({
          id: booking.clientId || booking.studentId,
          name: booking.clientName || booking.studentName,
          photoUrl: booking.clientAvatar || booking.studentAvatar,
          role: 'client',
        })
      : null);

  // Very robust mapping for apartmentId to ensure frontend detection works
  const apartmentId = 
    booking.apartmentId || 
    booking.apartment_id || 
    booking.apartmentID ||
    (typeof booking.apartment === 'string' ? booking.apartment : (booking.apartment?._id || booking.apartment?.id)) || 
    '';

  return {
    ...booking,
    _id: booking.id || booking._id || booking.bookingId || '',
    id: booking.id || booking._id || booking.bookingId || '',
    apartmentId: String(apartmentId),
    ownerId: booking.ownerId || booking.owner_id || booking.apartment?.owner?._id || '',
    clientId: booking.clientId || booking.client_id || booking.studentId || student?._id || '',
    status: normalizeStatus(booking.status),
    checkInDate: normalizeDate(booking.checkInDate || booking.startDate || booking.start_date),
    checkOutDate: normalizeDate(booking.checkOutDate || booking.endDate || booking.end_date),
    requestedOccupants: Number(booking.requestedOccupants || booking.people_count || 1),
    message: booking.message || '',
    createdAt: booking.createdAt || booking.created_at || '',
    apartment,
    student,
  };
};

const normalizeBookingList = (payload) => asArray(payload).map(mapBooking).filter(Boolean);

export const bookingsAPI = {
  createBooking: async (data) => {
    // 1. Fetch apartment details first to ensure we have all metadata
    const apartmentRes = await apartmentsAPI.getApartment(data.apartmentId);
    const apartment = apartmentRes.data;

    if (!apartment) throw new Error("Apartment data not found");

    // 2. Build the EXACT payload structure expected by the API based on requirements
    const payload = {
      apartmentId: String(data.apartmentId),
      apartmentName: apartment.title || apartment.name || '',
      apartmentAddress: apartment.address || '',
      apartmentImage: apartment.images?.[0] || null,
      ownerId: String(apartment.ownerId || apartment.owner?._id || ''),
      ownerName: apartment.ownerName || apartment.owner?.fullName || '',
      startDate: data.checkInDate ? new Date(data.checkInDate).toISOString() : '',
      endDate: data.checkOutDate ? new Date(data.checkOutDate).toISOString() : '',
      totalPrice: Number(apartment.price || 0),
      people_count: Number(data.requestedOccupants || 1),
      status: "pending"
    };

    // Remove any fields that might be null/undefined to avoid backend confusion
    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

    const response = await apiClient.post('/bookings', payload);
    emitStoreChange();
    return { data: mapBooking(response.data?.booking || response.data) };
  },

  getStudentBookings: async (userId = getStoredUser()?.id || getStoredUser()?._id) => {
    // Try both clientId and studentId in case backend changed naming
    const response = await apiClient.get('/bookings', { params: { clientId: userId } });
    return { data: { bookings: normalizeBookingList(response.data) } };
  },

  getOwnerBookings: async (ownerId = getStoredUser()?.id || getStoredUser()?._id) => {
    const response = await apiClient.get('/bookings', { params: { ownerId } });
    return { data: { bookings: normalizeBookingList(response.data) } };
  },

  getMyBookings: async (userId = getStoredUser()?.id || getStoredUser()?._id) =>
    bookingsAPI.getStudentBookings(userId),

  updateBookingStatus: async ({ bookingId, status }) => {
    const response = await apiClient.post(`/bookings/${bookingId}/status`, { status });
    emitStoreChange();
    return { data: mapBooking(response.data?.booking || response.data) };
  },

  acceptBooking: async (bookingId) => bookingsAPI.updateBookingStatus({ bookingId, status: 'accepted' }),
  rejectBooking: async (bookingId) => bookingsAPI.updateBookingStatus({ bookingId, status: 'rejected' }),
};

export { normalizeBookingList };
