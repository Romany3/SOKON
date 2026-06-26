import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://grad-project-master.onrender.com/api/v1';

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

export const getStoredAccessToken = () =>
  typeof window === 'undefined' ? null : window.localStorage.getItem('accessToken');

export const setStoredAccessToken = (token) => {
  if (typeof window === 'undefined') return;

  if (token) {
    window.localStorage.setItem('accessToken', token);
    window.localStorage.setItem('loginTimestamp', Date.now().toString());
    return;
  }

  window.localStorage.removeItem('accessToken');
  window.localStorage.removeItem('loginTimestamp');
};

export const getStoredUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const rawUser = window.localStorage.getItem('user');
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user) => {
  if (typeof window === 'undefined') return;
  if (user) {
    window.localStorage.setItem('user', JSON.stringify(user));
    return;
  }
  window.localStorage.removeItem('user');
};

export const clearStoredSession = () => {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('accessToken');
    window.localStorage.removeItem('user');
    window.localStorage.removeItem('loginTimestamp');
  }
  delete apiClient.defaults.headers.common.Authorization;
  emitStoreChange();
};

export const isSessionExpired = () => {
  if (typeof window === 'undefined') return false;
  const loginTimestamp = window.localStorage.getItem('loginTimestamp');
  if (!loginTimestamp) return false;
  const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
  return Date.now() - parseInt(loginTimestamp, 10) > thirtyDaysInMs;
};

export const getApiErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  const data = error?.response?.data;

  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    // Deduplicate error messages
    const uniqueErrors = [...new Set(data.errors.map((entry) => 
      entry?.msg || entry?.message || `${entry?.path || entry?.param || 'field'} is invalid`
    ))];
    return uniqueErrors.join(', ');
  }

  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message;
  }

  return error?.message || fallback;
};

export const extractAuthTokens = (payload) => {
  const session = payload?.session || payload?.data?.session || payload?.data || payload;
  return {
    accessToken: session?.access_token || session?.accessToken || payload?.access_token || payload?.accessToken || payload?.token || null,
    refreshToken: session?.refresh_token || session?.refreshToken || payload?.refresh_token || payload?.refreshToken || null,
  };
};

apiClient.interceptors.request.use((config) => {
  const token = getStoredAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = error?.config?.url || '';
    const isAuthRoute = authPaths.some((route) => requestUrl.includes(route));

    if (status === 401 && !isAuthRoute) {
      clearStoredSession();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
