import apiClient, {
  clearStoredSession,
  emitStoreChange,
  extractAuthTokens,
  getApiErrorMessage,
  setStoredAccessToken,
  setStoredUser,
} from './apiClient';
import { mapUser, normalizeRoleForApi } from './userService';

const extractAuthUser = (payload) => {
  const candidate = payload?.user || payload?.data?.user || payload?.data?.userData || payload?.data || payload;
  if (!candidate || Array.isArray(candidate)) {
    return null;
  }
  return mapUser(candidate);
};

const saveAuthSession = (payload) => {
  const { accessToken } = extractAuthTokens(payload);
  if (accessToken) {
    setStoredAccessToken(accessToken);
  }

  const user = extractAuthUser(payload);
  if (user) {
    setStoredUser(user);
  }

  emitStoreChange();
  return { data: { user, accessToken } };
};

const normalizeRegisterPayload = (payload = {}) => {
  const role = normalizeRoleForApi(payload.role);
  const body = {
    name: payload.name?.trim() || payload.fullName?.trim() || '',
    email: payload.email?.trim() || '',
    password: payload.password || '',
    college: role === 'client' ? (payload.college || '').trim() : '',
    phoneNumber: payload.phoneNumber?.trim() || payload.phone?.trim() || '',
    gender: payload.gender || '',
  };

  if (role) {
    body.role = role;
  }

  if ('photoUrl' in payload) {
    body.photoUrl = payload.photoUrl || null;
  }

  return body;
};

export const authAPI = {
  register: async (payload) => {
    try {
      const response = await apiClient.post('/auth/register', normalizeRegisterPayload(payload));
      return saveAuthSession(response.data);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Registration failed.'), { cause: error });
    }
  },

  login: async (payloadOrEmail, password) => {
    const payload =
      typeof payloadOrEmail === 'object' && payloadOrEmail !== null
        ? payloadOrEmail
        : { email: payloadOrEmail, password };

    try {
      const response = await apiClient.post('/auth/login', {
        email: payload.email?.trim() || '',
        password: payload.password || '',
      });
      return saveAuthSession(response.data);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Login failed.'), { cause: error });
    }
  },

  me: async () => {
    const response = await apiClient.get('/auth/me');
    const user = extractAuthUser(response.data);
    if (user) {
      setStoredUser(user);
      emitStoreChange();
    }
    return { data: { user } };
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Logout should still clear local state if the server rejects the request.
    } finally {
      clearStoredSession();
    }
  },

  requestPasswordReset: async (email) => {
    try {
      const response = await apiClient.post('/auth/password-reset', {
        email: typeof email === 'string' ? email : email?.email,
      });
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Password reset request failed.'), { cause: error });
    }
  },

  verifyResetOtp: async ({ email, otp }) => {
    try {
      const response = await apiClient.post('/auth/password-reset/verify-otp', {
        email,
        otp,
      });
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'OTP verification failed.'), { cause: error });
    }
  },

  verifyEmail: async (payload) => authAPI.verifyResetOtp(payload),

  forgotPassword: async (payload) => authAPI.requestPasswordReset(payload),

  confirmPasswordReset: async ({ token, password }) => {
    try {
      const response = await apiClient.post('/auth/password-reset/confirm', {
        token,
        password,
      });
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Password reset failed.'), { cause: error });
    }
  },

  resetPassword: async (payload = {}) => {
    if (payload.token) {
      return authAPI.confirmPasswordReset({
        token: payload.token,
        password: payload.password,
      });
    }

    const verifyResponse = await authAPI.verifyResetOtp({
      email: payload.email,
      otp: payload.otp,
    });
    const token = verifyResponse?.resetToken || verifyResponse?.token || verifyResponse?.data?.resetToken;
    return authAPI.confirmPasswordReset({
      token,
      password: payload.password,
    });
  },
};

export const authService = authAPI;
