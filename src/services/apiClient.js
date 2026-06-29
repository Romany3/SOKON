import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
  },
});

let storeVersion = 0;
const listeners = new Set();

const authPaths = [
  '/auth/login',
  '/auth/register',
  '/auth/logout',
  '/auth/password-reset',
  '/auth/password-reset/verify-otp',
  '/auth/password-reset/confirm',
];

export const getStoreVersion = () => storeVersion;

export const subscribeToStore = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const emitStoreChange = () => {
  storeVersion += 1;
  listeners.forEach((listener) => listener());
};

export const getStoredAccessToken = () => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem('accessToken');
  } catch (e) {
    return null;
  }
};

export const setStoredAccessToken = (token) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (token) {
      window.localStorage.setItem('accessToken', token);
      window.localStorage.setItem('loginTimestamp', Date.now().toString());
      return;
    }

    window.localStorage.removeItem('accessToken');
    window.localStorage.removeItem('loginTimestamp');
  } catch (e) {
    console.error('Failed to update accessToken in storage', e);
  }
};

export const getStoredUser = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawUser = window.localStorage.getItem('user');
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (user) {
      window.localStorage.setItem('user', JSON.stringify(user));
      return;
    }

    window.localStorage.removeItem('user');
  } catch (e) {
    console.error('Failed to update user in storage', e);
  }
};

export const clearStoredSession = () => {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem('accessToken');
      window.localStorage.removeItem('user');
      window.localStorage.removeItem('loginTimestamp');
    } catch (e) {
      // ignore
    }
  }

  delete apiClient.defaults.headers.common.Authorization;
  emitStoreChange();
};

/**
 * Checks if the session has expired (30 days limit)
 * @returns {boolean} True if expired
 */
export const isSessionExpired = () => {
  if (typeof window === 'undefined') return false;
  
  try {
    const loginTimestamp = window.localStorage.getItem('loginTimestamp');
    if (!loginTimestamp) return false;

    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    return now - parseInt(loginTimestamp, 10) > thirtyDaysInMs;
  } catch (e) {
    return true;
  }
};

export const getApiErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (!error) return fallback;
  
  // Handle network errors or cancelled requests
  if (!error.response) {
    return 'Network error. Please check your internet connection.';
  }

  const data = error?.response?.data;

  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return data.errors
      .map((entry) => entry?.msg || entry?.message || `${entry?.path || entry?.param || 'field'} is invalid`)
      .join(', ');
  }

  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message;
  }

  if (typeof data?.error === 'string' && data.error.trim()) {
    return data.error;
  }

  return error?.message || fallback;
};

export const extractAuthTokens = (payload) => {
  const session = payload?.session || payload?.data?.session || payload?.data || payload;

  return {
    accessToken:
      session?.access_token ||
      session?.accessToken ||
      payload?.access_token ||
      payload?.accessToken ||
      payload?.token ||
      payload?.data?.access_token ||
      payload?.data?.accessToken ||
      payload?.data?.token ||
      null,
    refreshToken:
      session?.refresh_token ||
      session?.refreshToken ||
      payload?.refresh_token ||
      payload?.refreshToken ||
      payload?.data?.refresh_token ||
      payload?.data?.refreshToken ||
      null,
  };
};

export const appendFormValue = (formData, key, value) => {
  if (value === undefined || value === null || value === '') {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => appendFormValue(formData, key, item));
    return;
  }

  if ((typeof Blob !== 'undefined' && value instanceof Blob) || (typeof File !== 'undefined' && value instanceof File)) {
    formData.append(key, value);
    return;
  }

  formData.append(key, `${value}`);
};

export const objectToFormData = (payload, keyMap = {}) => {
  const formData = new FormData();

  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    const targetKey = keyMap[key] || key;

    if (Array.isArray(value)) {
      value.forEach((item) => appendFormValue(formData, targetKey, item));
      return;
    }

    appendFormValue(formData, targetKey, value);
  });

  return formData;
};

export const formDataToObject = (formData) => {
  const result = {};

  if (!formData || typeof formData.entries !== 'function') {
    return result;
  }

  for (const [key, value] of formData.entries()) {
    if (Object.prototype.hasOwnProperty.call(result, key)) {
      const current = result[key];
      result[key] = Array.isArray(current) ? [...current, value] : [current, value];
      continue;
    }

    result[key] = value;
  }

  return result;
};

const redirectToLogin = () => {
  clearStoredSession();

  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.assign('/login');
  }
};

apiClient.interceptors.request.use((config) => {
  const token = getStoredAccessToken();

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If no response (network error), don't trigger auto-redirect
    if (!error.response) {
      return Promise.reject(error);
    }

    const status = error?.response?.status;
    const requestUrl = error?.config?.url || '';
    const isAuthRoute = authPaths.some((route) => requestUrl.includes(route));

    // Redirect to login on 401 (Unauthorized) OR 404 (Not Found) for main auth/user routes
    if ((status === 401 || status === 404) && !isAuthRoute && (requestUrl.includes('/auth/me') || requestUrl.includes('/users/me'))) {
      redirectToLogin();
    } else if (status === 401 && !isAuthRoute) {
      redirectToLogin();
    }

    return Promise.reject(error);
  },
);

export default apiClient;
