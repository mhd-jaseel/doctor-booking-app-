import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, healthcareService, doctorService, appointmentService } from '../services';
import { appCache } from '../utils/cache';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { buildHomeServices } from '../constants/healthcareServices';

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
        const storedUser = await AsyncStorage.getItem('@auth_user');

        if (!storedToken) {
          setToken(null);
          setUser(null);
        } else {
          // Restore immediately from cache so the user isn't waiting
          setToken(storedToken);
          let currentUserId = null;
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            currentUserId = parsedUser._id;
          }

          // Validate with backend /auth/me in the background
          authService.getMe().then(async (res) => {
            const userData = res.data?.user || res.user || res.data;
            if (!userData || userData.isActive === false) {
              await AsyncStorage.removeItem('@auth_token');
              await AsyncStorage.removeItem('@auth_user');
              appCache.clearAll();
              setToken(null);
              setUser(null);
            } else {
              setUser(userData);
              await AsyncStorage.setItem('@auth_user', JSON.stringify(userData));
            }
          }).catch(async (err) => {
            // If 401/403 or unauthorized, token is expired/invalid -> clear session
            if (err.status === 401 || err.status === 403 || err.response?.status === 401) {
              await AsyncStorage.removeItem('@auth_token');
              await AsyncStorage.removeItem('@auth_user');
              appCache.clearAll();
              setToken(null);
              setUser(null);
            }
          });
        }

        // --- PRELOAD ESSENTIAL HOME DATA & ASSETS ---
        try {
          const promises = [
            // 1. Preload Ionicons to prevent missing icons
            Font.loadAsync(Ionicons.font),
            // 2. Preload Healthcare Services
            healthcareService.getActiveServices().catch(() => ({ data: { services: [] } })),
            // 3. Preload Best Doctors
            doctorService.getDoctors({ limit: 6 }).catch(() => ({ data: { doctors: [] } })),
          ];

          // 4. Preload Active Appointment if authenticated
          if (storedToken && storedUser) {
            promises.push(
              appointmentService.getMyAppointments({ status: 'confirmed' })
                .catch(() => ({ data: { appointments: [] } }))
            );
          }

          // Wait max 10s for initial data to not block splash forever
          const results = await Promise.race([
            Promise.all(promises),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Init timeout')), 10000))
          ]);

          // Cache Healthcare Services
          const hcRes = results[1];
          if (hcRes && hcRes.data) {
             const list = hcRes.data.services || [];
             const { homeCards, othersServices } = buildHomeServices(list);
             appCache.set('healthcare:home_cards', homeCards, 10 * 60 * 1000);
             appCache.set('healthcare:others_services', othersServices, 10 * 60 * 1000);
          }

          // Cache Top Doctors
          const docsRes = results[2];
          if (docsRes && docsRes.data) {
             const fetchedDocs = docsRes.data.doctors || [];
             if (fetchedDocs.length > 0) {
               appCache.set('home:top_doctors', fetchedDocs);
             }
          }

          // Cache Active Appointment
          const apptsRes = results[3];
          if (storedToken && storedUser && apptsRes && apptsRes.data) {
             const activeApps = apptsRes.data.appointments || [];
             const latestActive = activeApps.length > 0 ? activeApps[0] : null;
             const currentUserId = JSON.parse(storedUser)._id;
             appCache.set(`appointments:active:${currentUserId}`, latestActive);
          }
        } catch (initErr) {
          console.log('[Startup] Non-critical initialization error/timeout:', initErr.message);
        }

      } catch (error) {
        console.error('Failed to restore session:', error);
        setToken(null);
        setUser(null);
      }
    };

    // Run cache restore
    await doRestore();

    // Run minimum splash delay
    const elapsed = Date.now() - splashStart;
    const remaining = Math.max(0, MIN_SPLASH_MS - elapsed);
    setTimeout(() => {
      setLoading(false);
    }, remaining);
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
