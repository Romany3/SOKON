import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI, mapUser, getStoredAccessToken, getStoredUser, setStoredUser, clearStoredSession } from '../services/api';
import { isSessionExpired } from '../services/apiClient';
import { beginGoogleOAuth, clearGoogleRoleHint, syncSupabaseSessionToBackend } from '../services/supabaseAuthService';
import { isSupabaseConfigured, supabase } from '../services/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const applyUser = (nextUser) => {
    const mapped = nextUser ? mapUser(nextUser) : null;
    setUserState(mapped);
    setIsAuthenticated(Boolean(mapped));
    setStoredUser(mapped);
    return mapped;
  };

  const logout = async () => {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
      await authAPI.logout();
    } catch (e) {
      console.error('Logout error on server:', e);
    } finally {
      clearGoogleRoleHint();
      applyUser(null);
      clearStoredSession();
    }
  };

  async function fetchUser() {
    try {
      const accessToken = getStoredAccessToken();
      if (!accessToken) {
        applyUser(null);
        setLoading(false);
        return null;
      }

      // Check if session is older than 30 days
      if (isSessionExpired()) {
        console.warn('Session expired after 30 days. Logging out.');
        await logout();
        return null;
      }

      const response = await authAPI.me();
      const loadedUser = response.data?.user || null;
      if (loadedUser) {
        const mapped = applyUser(loadedUser);
        return mapped;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      applyUser(null);
      return null;
    } finally {
      setLoading(false);
    }
    return null;
  }

  useEffect(() => {
    let subscription;
    let cancelled = false;
    let keepAliveId;
    let sessionCheckId;

    const refreshBackendSession = async () => {
      if (!isSupabaseConfigured || !supabase || cancelled) {
        return;
      }

      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session || null;
        if (session) {
          await syncSupabaseSessionToBackend(session, { force: true });
          await fetchUser();
        }
      } catch (error) {
        console.error('Error refreshing backend session:', error);
      }
    };

    const restoreUser = async () => {
      // Check for 30-day expiration immediately on boot
      if (isSessionExpired()) {
        await logout();
        setLoading(false);
        return;
      }

      const storedUser = getStoredUser();
      if (storedUser && getStoredAccessToken()) {
        setUserState(mapUser(storedUser));
      }

      if (isSupabaseConfigured && supabase) {
        try {
          const { data } = await supabase.auth.getSession();
          const session = data?.session || null;
          if (session) {
            try {
              await syncSupabaseSessionToBackend(session, { force: true });
            } catch (syncErr) {
              console.error('Initial sync failed:', syncErr);
            }
          }

          keepAliveId = window.setInterval(() => {
            refreshBackendSession();
          }, 15 * 60 * 1000);

          const { data: stateData } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
            if (cancelled) {
              return;
            }

            if (event === 'SIGNED_OUT') {
              clearGoogleRoleHint();
              applyUser(null);
              return;
            }

            if (nextSession && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
              try {
                await syncSupabaseSessionToBackend(nextSession, { force: true });
                await fetchUser();
              } catch (syncError) {
                console.error('Error syncing Supabase session:', syncError);
              }
            }
          });

          subscription = stateData.subscription;
        } catch (error) {
          console.error('Error restoring Supabase session:', error);
        }
      }

      await fetchUser();
    };

    restoreUser();

    // Periodically check if session expires while the tab is open
    sessionCheckId = window.setInterval(() => {
      if (isSessionExpired()) {
        logout();
      }
    }, 60 * 60 * 1000); // Check every hour

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
      if (keepAliveId) {
        window.clearInterval(keepAliveId);
      }
      if (sessionCheckId) {
        window.clearInterval(sessionCheckId);
      }
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await authAPI.login({ email, password });
      const loggedInUser = response.data?.user || (await fetchUser());
      if (loggedInUser) {
        applyUser(loggedInUser);
      }
      return response.data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data, role) => {
    setLoading(true);
    try {
      const response = await authAPI.register({
        ...data,
        role: role || data.role,
      });
      const registeredUser = response.data?.user || null;
      if (registeredUser) {
        applyUser(registeredUser);
      }
      return response.data;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    setUser: applyUser,
    loading,
    isAuthenticated,
    login,
    register,
    loginWithGoogle: () => beginGoogleOAuth(null),
    registerWithGoogle: (role) => beginGoogleOAuth(role || 'client'),
    logout,
    fetchUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
