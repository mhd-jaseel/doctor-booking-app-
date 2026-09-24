import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services';
import { appCache } from '../utils/cache';

const AuthContext = createContext();

// Manages global authentication state, token storage, and session restoration.
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Minimum splash duration so branding animation completes
  const MIN_SPLASH_MS = 1800;
  // Maximum time to wait for session restoration before proceeding
  const SESSION_TIMEOUT_MS = 8000;

  const restoreSession = useCallback(async () => {
    setLoading(true);
    const splashStart = Date.now();

    const doRestore = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('@auth_token');
        if (!storedToken) {
          setToken(null);
          setUser(null);
          return;
        }

        setToken(storedToken);

        // Validate with backend /auth/me to guarantee accurate role, status and valid JWT
        try {
          const res = await authService.getMe();
          const userData = res.data?.user || res.user || res.data;

          if (!userData || userData.isActive === false) {
            // Inactive or missing user account
            await AsyncStorage.removeItem('@auth_token');
            await AsyncStorage.removeItem('@auth_user');
            appCache.clearAll();
            setToken(null);
            setUser(null);
          } else {
            setUser(userData);
            await AsyncStorage.setItem('@auth_user', JSON.stringify(userData));
          }
        } catch (err) {
          // If 401/403 or unauthorized, token is expired/invalid -> clear session
          if (err.status === 401 || err.status === 403) {
            await AsyncStorage.removeItem('@auth_token');
            await AsyncStorage.removeItem('@auth_user');
            appCache.clearAll();
            setToken(null);
            setUser(null);
          } else {
            // If network error, fallback to cached user so offline/transient glitch does not wipe state
            const storedUser = await AsyncStorage.getItem('@auth_user');
            if (storedUser) {
              setUser(JSON.parse(storedUser));
            }
          }
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        setToken(null);
        setUser(null);
      }
    };

    // Run session restore with a timeout guard
    const restoreWithTimeout = Promise.race([
      doRestore(),
      new Promise((resolve) => setTimeout(resolve, SESSION_TIMEOUT_MS)),
    ]);

    // Run minimum splash delay in parallel with session restoration
    await Promise.all([
      restoreWithTimeout,
      new Promise((resolve) => {
        const elapsed = Date.now() - splashStart;
        const remaining = Math.max(0, MIN_SPLASH_MS - elapsed);
        setTimeout(resolve, remaining);
      }),
    ]);

    setLoading(false);
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = async (email, password) => {
    try {
      const res = await authService.login({ email, password });
      const { user: loggedInUser, token: authToken } = res.data;

      // Clear any prior user's cached protected data
      appCache.clearUserData();
      if (loggedInUser.role === 'admin') {
        appCache.clearAdminData();
      }

      setUser(loggedInUser);
      setToken(authToken);

      await AsyncStorage.setItem('@auth_token', authToken);
      await AsyncStorage.setItem('@auth_user', JSON.stringify(loggedInUser));
      return loggedInUser;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    const currentUserId = user?._id;
    const currentRole = user?.role;

    if (currentRole === 'admin') {
      appCache.clearAdminData();
    } else {
      appCache.clearUserData(currentUserId);
    }

    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem('@auth_token');
    await AsyncStorage.removeItem('@auth_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        restoreSession,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === 'admin',
        isUser: user?.role === 'user',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Provides easy access to authentication state and login/logout functions.
export const useAuth = () => useContext(AuthContext);
