import { authAPI } from './authService';
import { clearStoredSession, getStoredAccessToken, getStoredUser, setStoredUser } from './apiClient';
import { normalizeRoleForApi } from './userService';
import { isSupabaseConfigured, supabase } from './supabaseClient';

const GOOGLE_ROLE_HINT_KEY = 'sokon_google_role_hint';

const toSafeString = (value, fallback = '') => (value === undefined || value === null ? fallback : `${value}`.trim());

const sha256Base64Url = async (input) => {
  const bytes = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const base64 = btoa(String.fromCharCode(...hashArray));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const deriveBackendPassword = async (session) => {
  const userId = toSafeString(session?.user?.id);
  const email = toSafeString(session?.user?.email);
  return sha256Base64Url(`sokon:${userId}:${email}:google`);
};

const getGoogleRoleHint = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.sessionStorage.getItem(GOOGLE_ROLE_HINT_KEY) || null;
};

export const setGoogleRoleHint = (role) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (role) {
    window.sessionStorage.setItem(GOOGLE_ROLE_HINT_KEY, normalizeRoleForApi(role) || 'client');
    return;
  }

  window.sessionStorage.removeItem(GOOGLE_ROLE_HINT_KEY);
};

export const clearGoogleRoleHint = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(GOOGLE_ROLE_HINT_KEY);
};

const buildRegisterPayload = async (session) => {
  const user = session?.user || {};
  const metadata = user.user_metadata || {};
  const role = normalizeRoleForApi(getGoogleRoleHint() || metadata.role || 'client');
  const password = await deriveBackendPassword(session);

  return {
    name: toSafeString(metadata.full_name || metadata.name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'Google User'),
    email: toSafeString(user.email),
    password,
    college: toSafeString(metadata.college),
    phoneNumber: toSafeString(metadata.phone || metadata.phone_number),
    gender: toSafeString(metadata.gender),
    role: role || undefined, // Send undefined if no role, so backend might handle it or we handle it on return
    photoUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
  };
};

export const syncSupabaseSessionToBackend = async (session, { force = false } = {}) => {
  if (!isSupabaseConfigured || !session?.user?.email) {
    return null;
  }

  const storedUser = getStoredUser();
  const storedToken = getStoredAccessToken();
  if (!force && storedToken && storedUser?.email && `${storedUser.email}`.toLowerCase() === `${session.user.email}`.toLowerCase()) {
    return { data: { user: storedUser } };
  }

  const payload = await buildRegisterPayload(session);

  try {
    // Try to login first
    const loginResponse = await authAPI.login({
      email: payload.email,
      password: payload.password,
    });
    setStoredUser(loginResponse.data?.user || loginResponse.data || null);
    clearGoogleRoleHint();
    return loginResponse;
  } catch (loginError) {
    try {
      // If login fails, try to register
      const registerResponse = await authAPI.register(payload);
      setStoredUser(registerResponse.data?.user || registerResponse.data || null);
      clearGoogleRoleHint();
      return registerResponse;
    } catch (registerError) {
      // If BOTH fail, the email exists in the backend with a DIFFERENT password.
      // This happens when:
      //   - User registered manually with this email, then tried Google with the same email
      //   - Supabase user was deleted/re-created, changing the derived password
      //
      // authAPI wraps errors as: new Error(message, { cause: axiosError })
      // So we check status codes from the cause, or directly from the response if present.
      const registerStatus = registerError?.cause?.response?.status || registerError?.response?.status;
      const loginStatus = loginError?.cause?.response?.status || loginError?.response?.status;
      const msg = `${registerError.message || ''} ${loginError.message || ''}`;
      const isConflict =
        registerStatus === 409 ||
        loginStatus === 409 ||
        msg.includes('Already exists') ||
        msg.includes('already registered') ||
        msg.includes('Conflict') ||
        msg.includes('409');

      if (isConflict) {
        clearGoogleRoleHint();
        clearStoredSession();
        try {
          if (supabase) await supabase.auth.signOut();
        } catch (_) {
          // Ignore sign-out errors — local cleanup already done above
        }
        // Return null instead of throwing so callers don't get an unhandled error
        return null;
      }
      throw registerError;
    }
  }
};

export const beginGoogleOAuth = async (roleHint = 'client') => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase Google sign-in is not configured.');
  }

  setGoogleRoleHint(roleHint);

  const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        prompt: 'select_account',
      },
    },
  });

  if (error) {
    throw error;
  }

  if (data?.url && typeof window !== 'undefined') {
    window.location.assign(data.url);
  }

  return data;
};
