import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../services/auth.service.js';

const STORAGE_KEY = 'cf_auth';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const res = await authService.login(email, password);
          const { user, accessToken, refreshToken } = res.data;
          set({ user, accessToken, refreshToken, isLoading: false });
          return { user, accessToken };
        } catch (err) {
          const msg = err.response?.data?.message || 'Login failed. Please try again.';
          set({ isLoading: false, error: msg });
          throw new Error(msg);
        }
      },

      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null, error: null });
      },

      fetchMe: async () => {
        try {
          const res = await authService.getMe();
          set({ user: res.data });
        } catch {
          get().logout();
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: STORAGE_KEY,
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
      }),
    }
  )
);

export default useAuthStore;
