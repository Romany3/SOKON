import apiClient, { emitStoreChange, formDataToObject, getStoredUser } from './apiClient';
import { mapUser } from './userService';

const asNumber = (value, fallback = 0) => {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const pickArray = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value && typeof value === 'string' && value.trim()) {
    if (value.trim().startsWith('[') && value.trim().endsWith(']')) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
      } catch (e) {}
    }
    return [value];
  }
  if (value instanceof File || value instanceof Blob) return [value];
  return [];
};

const stripEmptyParams = (params) =>
  Object.fromEntries(
    Object.entries(params || {}).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );

const normalizeStatus = (apartment) => {
  const status = `${apartment.status || ''}`.trim().toLowerCase();
  if (status === 'approved' || status === 'active' || apartment.verified === true) return 'approved';
  if (status === 'rejected') return 'declined';
  if (status === 'cancelled' || status === 'canceled') return 'cancelled';
  return 'pending';
};

const createOwner = (apartment) => {
  if (apartment.owner) return mapUser(apartment.owner);
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
  if (!apartment) return null;
  const maxPeople = asNumber(apartment.max_people ?? apartment.maxPeople ?? apartment.capacity, 0);
  const availablePeople = asNumber(apartment.available_people ?? apartment.availablePeople, maxPeople);

  return {
    ...apartment,
    _id: apartment.id || apartment._id || '',
    title: apartment.title || apartment.name || '',
    description: apartment.description || apartment.description_en || '',
    images: pickArray(apartment.images),
    videoUrl: apartment.videoUrl || apartment.video_url || '',
    bedrooms: asNumber(apartment.bedrooms ?? apartment.beds, 0),
    bathrooms: asNumber(apartment.bathrooms, 0),
    rooms: asNumber(apartment.rooms ?? apartment.living_rooms, 0),
    floor: apartment.floor !== undefined ? asNumber(apartment.floor, 0) : '',
    max_people: maxPeople,
    available_people: availablePeople,
    occupiedCount: Math.max(maxPeople - availablePeople, 0),
    price: apartment.price ? Number(apartment.price) : 0,
    address: apartment.address || '',
    city: apartment.city || '',
    district: apartment.district || '',
    latitude: apartment.latitude ? Number(apartment.latitude) : apartment.lat ? Number(apartment.lat) : null,
    longitude: apartment.longitude ? Number(apartment.longitude) : apartment.lng ? Number(apartment.lng) : null,
    owner: createOwner(apartment),
    verified: Boolean(apartment.verified),
    status: normalizeStatus(apartment),
    createdAt: apartment.createdAt || apartment.created_at || null,
  };
};

const uploadFile = async (file, folder) => {
  if (!file) return '';
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);
  const response = await apiClient.post('/storage/apartment', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data?.secure_url || response.data?.url || '';
};

const normalizePayload = async (input, base = null) => {
  const raw = input instanceof FormData ? formDataToObject(input) : { ...(input || {}) };
  const currentUser = getStoredUser();
  const folder = currentUser?.id || 'apartments';

  const imagesSource = [
    ...pickArray(raw.images),
    ...pickArray(raw.imageUrls),
    ...pickArray(raw.existingImages),
  ];

  const uploadedImages = [];
  for (const img of imagesSource) {
    if (img instanceof File || img instanceof Blob) {
      const url = await uploadFile(img, folder);
      if (url) uploadedImages.push(url);
    } else if (typeof img === 'string' && img.trim()) {
      uploadedImages.push(img.trim());
    }
  }

  const videoSource = raw.video || raw.videoFile || '';
  let videoUrl = typeof videoSource === 'string' ? videoSource : '';
  if (videoSource instanceof File || videoSource instanceof Blob) {
    videoUrl = await uploadFile(videoSource, folder);
  }

  return {
    name: raw.title || raw.name || '',
    description: raw.description_en || raw.description || '',
    price: raw.price ? Number(raw.price) : 0,
    images: uploadedImages.length ? uploadedImages : (base?.images || []),
    video_url: videoUrl || base?.videoUrl || null,
    bedrooms: asNumber(raw.beds || raw.bedrooms, 0),
    bathrooms: asNumber(raw.bathrooms, 0),
    living_rooms: asNumber(raw.rooms || raw.living_rooms, 0),
    floor: asNumber(raw.floor, 1),
    max_people: asNumber(raw.max_people || raw.maxPeople, 0),
    available_people: asNumber(raw.available_people, asNumber(raw.max_people || raw.maxPeople, 0)),
    address: raw.address || '',
    city: raw.city || '',
    district: raw.district || '',
    latitude: raw.latitude ? Number(raw.latitude) : null,
    longitude: raw.longitude ? Number(raw.longitude) : null,
    ownerId: raw.ownerId || currentUser?.id || '',
  };
};

export const apartmentsAPI = {
  getApartments: async (filters = {}) => {
    const q = filters.q || filters.query || '';
    const params = stripEmptyParams({ q, ownerId: filters.ownerId, city: filters.city, district: filters.district });
    const endpoint = q ? '/apartments/search' : '/apartments';
    const response = await apiClient.get(endpoint, { params });
    const list = response.data?.apartments || response.data || [];
    return { data: { apartments: Array.isArray(list) ? list.map(mapApartment) : [] } };
  },

  getAllApartments: async () => {
    const response = await apiClient.get('/apartments');
    const list = response.data?.apartments || response.data || [];
    return { data: { apartments: Array.isArray(list) ? list.map(mapApartment) : [] } };
  },

  getApartment: async (id) => {
    const response = await apiClient.get(`/apartments/${id}`);
    return { data: mapApartment(response.data?.apartment || response.data) };
  },

  getMyApartments: async () => {
    const userId = getStoredUser()?.id;
    const response = await apiClient.get('/apartments', { params: { ownerId: userId } });
    const list = response.data?.apartments || response.data || [];
    return { data: { apartments: Array.isArray(list) ? list.map(mapApartment) : [] } };
  },

  createApartment: async (data) => {
    const payload = await normalizePayload(data);
    const response = await apiClient.post('/apartments', payload);
    emitStoreChange();
    return { data: mapApartment(response.data) };
  },

  updateApartment: async (id, data) => {
    const existing = await apartmentsAPI.getApartment(id).catch(() => ({ data: null }));
    const payload = await normalizePayload(data, existing?.data);
    const response = await apiClient.patch(`/apartments/${id}`, payload);
    emitStoreChange();
    return { data: mapApartment(response.data) };
  },

  deleteApartment: async (id) => {
    const response = await apiClient.delete(`/apartments/${id}`);
    emitStoreChange();
    return response;
  }
};
