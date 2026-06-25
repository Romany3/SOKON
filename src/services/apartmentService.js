import apiClient, { emitStoreChange, formDataToObject, getStoredUser } from './apiClient';
import { mapUser } from './userService';

const asNumber = (value, fallback = 0) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const pickArray = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === 'string' && value.trim()) {
    return [value];
  }

  return [];
};

const stripEmptyParams = (params) =>
  Object.fromEntries(
    Object.entries(params || {}).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );

const normalizeStatus = (apartment) => {
  const status = `${apartment.status || ''}`.trim().toLowerCase();
  if (status === 'approved' || status === 'active' || apartment.verified === true) {
    return 'approved';
  }
  if (status === 'rejected') {
    return 'declined';
  }
  if (status === 'cancelled' || status === 'canceled') {
    return 'cancelled';
  }
  if (status === 'pending') {
    return 'pending_approval';
  }
  if (!status && apartment.verified === false) {
    return 'pending_approval';
  }
  return status || 'pending_approval';
};

const createOwner = (apartment) => {
  if (apartment.owner) {
    return mapUser(apartment.owner);
  }

  if (apartment.ownerId || apartment.ownerName) {
    return mapUser({
      id: apartment.ownerId,
      name: apartment.ownerName,
      photoUrl: apartment.ownerPhotoUrl,
      role: 'owner',
    });
  }

  return null;
};

export const mapApartment = (apartment) => {
  if (!apartment) {
    return null;
  }

  const maxPeople = asNumber(apartment.max_people ?? apartment.maxPeople ?? apartment.capacity, 0);
  const availablePeople = asNumber(apartment.available_people ?? apartment.availablePeople, maxPeople);
  const occupiedCount = Math.max(maxPeople - availablePeople, 0);

  return {
    ...apartment,
    _id: apartment.id || apartment._id || apartment.apartmentId || '',
    id: apartment.id || apartment._id || apartment.apartmentId || '',
    name: apartment.name || apartment.title || '',
    title: apartment.title || apartment.name || '',
    description: apartment.description || apartment.description_en || '',
    description_en: apartment.description_en || apartment.description || '',
    images: pickArray(apartment.images),
    videoUrl: apartment.videoUrl || apartment.video_url || apartment.video || '',
    bedrooms: asNumber(apartment.bedrooms ?? apartment.beds, 0),
    beds: asNumber(apartment.beds ?? apartment.bedrooms, 0),
    bathrooms: asNumber(apartment.bathrooms, 0),
    living_rooms: asNumber(apartment.living_rooms ?? apartment.rooms, 0),
    rooms: asNumber(apartment.rooms ?? apartment.living_rooms, 0),
    floor: apartment.floor !== undefined && apartment.floor !== null ? asNumber(apartment.floor, 0) : '',
    max_people: maxPeople,
    maxPeople,
    capacity: maxPeople,
    available_people: availablePeople,
    availablePeople,
    occupiedCount,
    availableSpots: availablePeople,
    isFull: maxPeople > 0 ? availablePeople <= 0 : false,
    price: apartment.price !== undefined && apartment.price !== null ? Number(apartment.price) : 0,
    address: apartment.address || apartment.locationAddress || '',
    city: apartment.city || '',
    district: apartment.district || '',
    locationAddress: apartment.locationAddress || apartment.address || '',
    location: apartment.locationAddress || apartment.address || '',
    lat: apartment.lat !== undefined && apartment.lat !== null ? Number(apartment.lat) : null,
    lng: apartment.lng !== undefined && apartment.lng !== null ? Number(apartment.lng) : null,
    latitude: apartment.lat !== undefined && apartment.lat !== null ? Number(apartment.lat) : apartment.latitude ?? null,
    longitude: apartment.lng !== undefined && apartment.lng !== null ? Number(apartment.lng) : apartment.longitude ?? null,
    owner: createOwner(apartment),
    ownerId: apartment.ownerId || apartment.owner?.id || apartment.owner?._id || '',
    ownerName: apartment.ownerName || apartment.owner?.name || apartment.owner?.fullName || '',
    ownerPhotoUrl: apartment.ownerPhotoUrl || apartment.owner?.photoUrl || apartment.owner?.avatar || '',
    verified: Boolean(apartment.verified),
    status: normalizeStatus(apartment),
    rating_sum: asNumber(apartment.rating_sum ?? apartment.ratingSum, 0),
    rating_count: asNumber(apartment.rating_count ?? apartment.ratingCount, 0),
    rating_average: Number(apartment.rating_average ?? apartment.ratingAverage ?? 0),
    createdAt: apartment.createdAt || apartment.created_at || null,
  };
};

const normalizeApartmentList = (payload) => {
  const list = payload?.apartments || payload?.data?.apartments || payload?.data || payload?.items || payload;
  if (!Array.isArray(list)) {
    return [];
  }

  return list.map(mapApartment).filter(Boolean);
};

const pickUploadUrl = (responseData) => {
  if (!responseData) {
    return '';
  }

  if (typeof responseData === 'string') {
    return responseData;
  }

  return (
    responseData.secure_url ||
    responseData.url ||
    responseData.imageUrl ||
    responseData.fileUrl ||
    responseData.data?.secure_url ||
    responseData.data?.url ||
    responseData.data?.imageUrl ||
    responseData.data?.fileUrl ||
    ''
  );
};

const uploadApartmentFile = async (file, folder) => {
  if (!file) {
    return '';
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const response = await apiClient.post('/storage/apartment', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return pickUploadUrl(response.data);
};

const normalizeCreatePayload = async (input, baseApartment = null) => {
  const raw = input instanceof FormData ? formDataToObject(input) : { ...(input || {}) };
  const currentUser = getStoredUser();
  const folder = currentUser?.id || currentUser?._id || 'apartments';

  const images = [
    ...pickArray(raw.images),
    ...pickArray(raw.imageUrls),
    ...pickArray(raw.existingImages),
  ];

  const uploadedImages = [];
  for (const image of images) {
    if (image instanceof File || image instanceof Blob) {
      const url = await uploadApartmentFile(image, folder);
      if (url) {
        uploadedImages.push(url);
      }
      continue;
    }

    if (typeof image === 'string' && image.trim()) {
      uploadedImages.push(image.trim());
    }
  }

  const videoSource = raw.video || raw.videoFile || raw.video_url || raw.videoUrl || '';
  let videoUrl = typeof videoSource === 'string' ? videoSource : '';
  if (videoSource instanceof File || videoSource instanceof Blob) {
    videoUrl = await uploadApartmentFile(videoSource, folder);
  }

  const maxPeople = asNumber(raw.max_people ?? raw.maxPeople ?? raw.capacity, 0);
  const availablePeople = asNumber(raw.available_people ?? raw.availablePeople, maxPeople);
  const ownerId = raw.ownerId || currentUser?.id || currentUser?._id || '';
  const ownerName = raw.ownerName || currentUser?.name || currentUser?.fullName || '';
  const ownerPhotoUrl = raw.ownerPhotoUrl || currentUser?.photoUrl || currentUser?.avatar || '';

  return {
    name: raw.name || raw.title || '',
    description: raw.description || raw.description_en || raw.description_ar || '',
    price: raw.price !== undefined && raw.price !== null && raw.price !== '' ? Number(raw.price) : 0,
    images: uploadedImages.length ? uploadedImages : pickArray(baseApartment?.images),
    video_url: videoUrl || baseApartment?.videoUrl || baseApartment?.video_url || null,
    bedrooms: asNumber(raw.bedrooms ?? raw.beds, 0),
    bathrooms: asNumber(raw.bathrooms, 0),
    living_rooms: asNumber(raw.living_rooms ?? raw.rooms, 0),
    floor: raw.floor !== undefined && raw.floor !== null && raw.floor !== '' ? Number(raw.floor) : 1,
    max_people: maxPeople,
    available_people: availablePeople,
    address: raw.address || '',
    city: raw.city || '',
    district: raw.district || '',
    locationAddress: raw.locationAddress || raw.address || '',
    lat: raw.lat !== undefined && raw.lat !== null && raw.lat !== '' ? Number(raw.lat) : raw.latitude ? Number(raw.latitude) : null,
    lng: raw.lng !== undefined && raw.lng !== null && raw.lng !== '' ? Number(raw.lng) : raw.longitude ? Number(raw.longitude) : null,
    latitude: raw.latitude !== undefined && raw.latitude !== null && raw.latitude !== '' ? Number(raw.latitude) : raw.lat ? Number(raw.lat) : null,
    longitude: raw.longitude !== undefined && raw.longitude !== null && raw.longitude !== '' ? Number(raw.longitude) : raw.lng ? Number(raw.lng) : null,
    ownerId,
    ownerName,
    ownerPhotoUrl,
    verified: Boolean(raw.verified),
  };
};

export const apartmentsAPI = {
  getApartments: async (filters = {}) => {
    const query = filters.query || filters.q || filters.searchQuery || '';
    if (query && `${query}`.trim()) {
      return apartmentsAPI.searchApartments(query);
    }

    const params = stripEmptyParams({
      ownerId: filters.ownerId,
      city: filters.city,
      district: filters.district,
    });

    const response = await apiClient.get('/apartments', { params });
    return { data: { apartments: normalizeApartmentList(response.data) } };
  },

  getAllApartments: async () => {
    const response = await apiClient.get('/apartments');
    return { data: { apartments: normalizeApartmentList(response.data) } };
  },

  searchApartments: async (query) => {
    const response = await apiClient.get('/apartments/search', {
      params: { query: `${query || ''}`.trim() },
    });
    return { data: { apartments: normalizeApartmentList(response.data) } };
  },

  getApartment: async (id) => {
    const response = await apiClient.get(`/apartments/${id}`);
    const apartment = mapApartment(response.data?.apartment || response.data?.data?.apartment || response.data);
    return { data: apartment };
  },

  getMyApartments: async () => {
    const currentUser = getStoredUser();
    const userId = currentUser?.id || currentUser?._id;
    const response = await apiClient.get('/apartments', { params: stripEmptyParams({ ownerId: userId }) });
    return { data: { apartments: normalizeApartmentList(response.data) } };
  },

  createApartment: async (data) => {
    const payload = await normalizeCreatePayload(data);
    const response = await apiClient.post('/apartments', payload);
    emitStoreChange();
    return { data: mapApartment(response.data?.apartment || response.data?.data?.apartment || response.data) };
  },

  updateApartment: async (id, data) => {
    const existingApartment = await apartmentsAPI.getApartment(id).catch(() => ({ data: null }));
    const payload = await normalizeCreatePayload(data, existingApartment?.data || null);
    const response = await apiClient.patch(`/apartments/${id}`, payload);
    emitStoreChange();
    return { data: mapApartment(response.data?.apartment || response.data?.data?.apartment || response.data) };
  },

  deleteApartment: async (id) => {
    const response = await apiClient.delete(`/apartments/${id}`);
    emitStoreChange();
    return response;
  },

  uploadApartmentFile,
  normalizeApartmentList,
};

export { normalizeApartmentList };
