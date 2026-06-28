import apiClient, {
  clearStoredSession,
  emitStoreChange,
  formDataToObject,
  getApiErrorMessage,
  getStoredUser,
  objectToFormData,
  setStoredUser,
} from './apiClient';

export const normalizeRoleForUi = (role) => {
  if (!role) {
    return '';
  }

  const normalized = `${role}`.trim().toLowerCase();
  if (normalized === 'client') {
    return 'student';
  }

  return normalized;
};

export const normalizeRoleForApi = (role) => {
  const normalized = `${role || ''}`.trim().toLowerCase();
  if (normalized === 'student') {
    return 'client';
  }
  return normalized;
};

const normalizeAvatar = (user) => user?.photoUrl || user?.avatar || user?.imageUrl || user?.profileImage || '';

export const mapUser = (user) => {
  if (!user) {
    return null;
  }

  const id = user.id || user._id || user.userId || '';
  const name = user.name || user.fullName || user.username || '';
  const role = normalizeRoleForUi(user.role || user.userRole || '');

  return {
    ...user,
    _id: id,
    id,
    name,
    fullName: name,
    email: user.email || '',
    college: user.college || user.faculty || '',
    faculty: user.faculty || user.college || '',
    university: user.university || '',
    phoneNumber: user.phoneNumber || user.phone || '',
    phone: user.phoneNumber || user.phone || '',
    gender: user.gender || '',
    role,
    avatar: normalizeAvatar(user),
    photoUrl: normalizeAvatar(user),
    fcmToken: user.fcmToken || null,
    createdAt: user.createdAt || null,
  };
};

const extractUser = (payload) => {
  const candidate = payload?.user || payload?.data?.user || payload?.data || payload;
  if (!candidate || Array.isArray(candidate)) {
    return null;
  }
  return mapUser(candidate);
};

const saveUser = (user) => {
  const mapped = mapUser(user);
  if (mapped) {
    setStoredUser(mapped);
    emitStoreChange();
  }
  return mapped;
};

const normalizeUsersResponse = (payload) => {
  const list = payload?.users || payload?.data?.users || payload?.data || payload?.items || payload;
  if (!Array.isArray(list)) {
    return [];
  }
  return list.map(mapUser).filter(Boolean);
};

const uploadImage = async (file, folder) => {
  if (!file) {
    return '';
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const response = await apiClient.post('/storage/profiles', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const data = response.data || {};
  return data.secure_url || data.url || data.imageUrl || data.fileUrl || '';
};

const normalizeUpdatePayload = async (userId, data = {}) => {
  const currentUser = getStoredUser() || {};
  let photoUrl = data.photoUrl || data.avatar || currentUser.photoUrl || currentUser.avatar || '';

  if (data.avatar instanceof File || data.avatar instanceof Blob) {
    photoUrl = await uploadImage(data.avatar, userId || currentUser.id || 'profile');
  }

  const payload = {};

  if (data.name !== undefined || data.fullName !== undefined) {
    payload.name = (data.name || data.fullName || '').trim();
  }

  if (data.college !== undefined || data.faculty !== undefined) {
    payload.college = (data.college || data.faculty || '').trim();
  }

  if (data.phoneNumber !== undefined || data.phone !== undefined) {
    payload.phoneNumber = (data.phoneNumber || data.phone || '').trim();
  }

  if (data.gender !== undefined) {
    payload.gender = data.gender;
  }

  if (data.role !== undefined) {
    payload.role = normalizeRoleForApi(data.role);
  }

  if (data.fcmToken !== undefined) {
    payload.fcmToken = data.fcmToken || null;
  }

  if (photoUrl) {
    payload.photoUrl = photoUrl;
  }

  if (data.email !== undefined) {
    payload.email = data.email;
  }

  if (data.university !== undefined) {
    payload.university = data.university;
  }

  return payload;
};

export const getCurrentUser = async () => {
  const response = await apiClient.get('/auth/me');
  const user = saveUser(extractUser(response.data));
  return { data: { user } };
};

export const getUsers = async () => {
  const response = await apiClient.get('/users');
  return { data: { users: normalizeUsersResponse(response.data) } };
};

export const getUserById = async (userId) => {
  const response = await apiClient.get(`/users/${userId}`);
  return { data: mapUser(extractUser(response.data) || response.data) };
};

export const updateCurrentUser = async (userId, data = {}) => {
  const resolvedUserId = userId || getStoredUser()?.id || getStoredUser()?._id;
  if (!resolvedUserId) {
    throw new Error('User id is required.');
  }

  const payload = await normalizeUpdatePayload(resolvedUserId, data);
  const response = await apiClient.patch(`/users/${resolvedUserId}`, payload);
  const user = saveUser(extractUser(response.data) || response.data);
  return { data: user };
};

export const deleteCurrentUser = async (password) => {
  const config = password ? { data: { password } } : {};
  const response = await apiClient.delete('/auth/account', config);
  clearStoredSession();
  return response.data;
};

export const deleteUserById = async (userId) => {
  const response = await apiClient.delete(`/users/${userId}`);
  emitStoreChange();
  return response.data;
};

export const usersAPI = {
  getMe: getCurrentUser,
  getUsers,
  getUserById,
  updateUser: updateCurrentUser,
  deleteUser: deleteCurrentUser,
  deleteUserById,
  updateProfile: async (data = {}) => {
    const currentUser = getStoredUser();
    return updateCurrentUser(currentUser?.id || currentUser?._id, data);
  },
  deleteProfile: async (password) => deleteCurrentUser(password),
  uploadProfileImage: async (file, userId) => uploadImage(file, userId || getStoredUser()?.id || 'profile'),
  clearStoredSession,
  setStoredUser,
};

export { clearStoredSession, setStoredUser, formDataToObject, objectToFormData };
