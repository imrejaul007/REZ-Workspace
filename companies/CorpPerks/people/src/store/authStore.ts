// ==========================================
// MyTalent - Auth Store (Zustand)
// Complete authentication state management
// ==========================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Employee } from '../types';
import { authenticate, verifyToken, requestOTP, verifyOTP, refreshToken, logout as authLogout } from '../services/authService';

// ==========================================
// Types
// ==========================================

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  companyId: string;
  companyName: string;
  corpId?: string;
  ciScore?: number;
  avatar?: string;
  joinDate: string;
  status: 'active' | 'inactive' | 'on-leave';
}

export interface AuthState {
  // State
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithOTP: (phone: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  clearError: () => void;
  initialize: () => Promise<void>;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  companyId?: string;
  department?: string;
  designation?: string;
  acceptTerms: boolean;
}

// ==========================================
// Initial State
// ==========================================

const initialState = {
  user: null as User | null,
  token: null as string | null,
  refreshToken: null as string | null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null as string | null,
};

// ==========================================
// Store
// ==========================================

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * Initialize auth state from stored tokens
       */
      initialize: async () => {
        const { token } = get();

        if (!token) {
          set({ isInitialized: true, isLoading: false });
          return;
        }

        set({ isLoading: true });

        try {
          const response = await verifyToken(token);

          if (response.valid && response.employee) {
            set({
              user: response.employee as User,
              isAuthenticated: true,
              isLoading: false,
              isInitialized: true,
            });
          } else {
            // Token invalid, try refresh
            const { refreshToken: rt } = get();
            if (rt) {
              const refreshResponse = await refreshToken(rt);
              if (refreshResponse.success && refreshResponse.token) {
                set({
                  token: refreshResponse.token,
                  isLoading: false,
                  isInitialized: true,
                });
                // Re-verify with new token
                await get().initialize();
              } else {
                // Refresh failed, clear auth
                set({
                  user: null,
                  token: null,
                  refreshToken: null,
                  isAuthenticated: false,
                  isLoading: false,
                  isInitialized: true,
                });
              }
            } else {
              set({
                user: null,
                token: null,
                refreshToken: null,
                isAuthenticated: false,
                isLoading: false,
                isInitialized: true,
              });
            }
          }
        } catch (error) {
          logger.error('Auth initialization error:', error);
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
          });
        }
      },

      /**
       * Login with email/phone and password
       */
      login: async (identifier: string, password: string) => {
        set({ isLoading: true, error: null });

        // Validate inputs
        if (!identifier || identifier.trim() === '') {
          set({ isLoading: false, error: 'Email or phone is required' });
          return { success: false, error: 'Email or phone is required' };
        }

        if (!password || password.length < 6) {
          set({ isLoading: false, error: 'Password must be at least 6 characters' });
          return { success: false, error: 'Password must be at least 6 characters' };
        }

        try {
          const response = await authenticate(identifier, password);

          if (response.success && response.token && response.employee) {
            // Generate mock refresh token for demo
            const mockRefreshToken = `refresh_${Date.now()}_${Math.random().toString(36).substring(7)}`;

            set({
              user: response.employee as User,
              token: response.token,
              refreshToken: mockRefreshToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            return { success: true };
          } else {
            const errorMessage = response.error || 'Authentication failed';
            set({ isLoading: false, error: errorMessage });
            return { success: false, error: errorMessage };
          }
        } catch (error: any) {
          const errorMessage = error?.message || 'An unexpected error occurred';
          set({ isLoading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      /**
       * Login with OTP
       */
      loginWithOTP: async (phone: string, otp: string) => {
        set({ isLoading: true, error: null });

        // Validate inputs
        if (!phone || phone.trim() === '') {
          set({ isLoading: false, error: 'Phone number is required' });
          return { success: false, error: 'Phone number is required' };
        }

        if (!otp || otp.length !== 6) {
          set({ isLoading: false, error: 'Please enter a valid 6-digit OTP' });
          return { success: false, error: 'Please enter a valid 6-digit OTP' };
        }

        try {
          const response = await verifyOTP(phone, otp);

          if (response.success && response.token && response.employee) {
            const mockRefreshToken = `refresh_${Date.now()}_${Math.random().toString(36).substring(7)}`;

            set({
              user: response.employee as User,
              token: response.token,
              refreshToken: mockRefreshToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            return { success: true };
          } else {
            const errorMessage = response.error || 'Invalid OTP';
            set({ isLoading: false, error: errorMessage });
            return { success: false, error: errorMessage };
          }
        } catch (error: any) {
          const errorMessage = error?.message || 'An unexpected error occurred';
          set({ isLoading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      /**
       * Register new user
       */
      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });

        // Validate inputs
        if (!data.name || data.name.trim() === '') {
          set({ isLoading: false, error: 'Name is required' });
          return { success: false, error: 'Name is required' };
        }

        if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
          set({ isLoading: false, error: 'Valid email is required' });
          return { success: false, error: 'Valid email is required' };
        }

        if (!data.phone || data.phone.length < 10) {
          set({ isLoading: false, error: 'Valid phone number is required' });
          return { success: false, error: 'Valid phone number is required' };
        }

        if (!data.password || data.password.length < 8) {
          set({ isLoading: false, error: 'Password must be at least 8 characters' });
          return { success: false, error: 'Password must be at least 8 characters' };
        }

        if (data.password !== data.confirmPassword) {
          set({ isLoading: false, error: 'Passwords do not match' });
          return { success: false, error: 'Passwords do not match' };
        }

        if (!data.acceptTerms) {
          set({ isLoading: false, error: 'You must accept the terms and conditions' });
          return { success: false, error: 'You must accept the terms and conditions' };
        }

        try {
          // For demo, simulate registration success
          // In production, call the register API endpoint
          const mockNewUser: User = {
            id: `user_${Date.now()}`,
            name: data.name,
            email: data.email,
            phone: data.phone,
            department: data.department || 'General',
            designation: data.designation || 'Employee',
            companyId: data.companyId || 'corp_001',
            companyName: 'CorpPerks',
            joinDate: new Date().toISOString(),
            status: 'active',
          };

          const mockToken = `jwt_${Date.now()}_${Math.random().toString(36).substring(7)}`;
          const mockRefreshToken = `refresh_${Date.now()}_${Math.random().toString(36).substring(7)}`;

          set({
            user: mockNewUser,
            token: mockToken,
            refreshToken: mockRefreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return { success: true };
        } catch (error: any) {
          const errorMessage = error?.message || 'Registration failed';
          set({ isLoading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      /**
       * Logout
       */
      logout: async () => {
        const { token } = get();

        set({ isLoading: true });

        try {
          if (token) {
            await authLogout(token);
          }
        } catch (error) {
          logger.error('Logout error:', error);
        } finally {
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      /**
       * Refresh session
       */
      refreshSession: async () => {
        const { refreshToken: rt } = get();

        if (!rt) {
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
          });
          return;
        }

        try {
          const response = await refreshToken(rt);

          if (response.success && response.token) {
            set({ token: response.token });
          } else {
            // Refresh failed, logout
            await get().logout();
          }
        } catch (error) {
          logger.error('Session refresh error:', error);
          await get().logout();
        }
      },

      /**
       * Update user profile
       */
      updateUser: (data: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...data } });
        }
      },

      /**
       * Clear error
       */
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'mytalent-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Initialize auth after rehydration
        if (state) {
          state.initialize();
        }
      },
    }
  )
);

// ==========================================
// Selector Hooks
// ==========================================

export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
export const useAuthInitialized = () => useAuthStore((state) => state.isInitialized);

// ==========================================
// Export Types
// ==========================================

export type { AuthState };
