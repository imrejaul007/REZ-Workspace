/**
 * Authentication Store
 * Manages user authentication state using Zustand
 *
 * Features:
 * - Phone/OTP login flow
 * - Token management
 * - Persistent auth state
 */

import { create } from 'zustand';
import { api } from '../services/api';

/** User profile interface */
interface User {
  _id: string;
  displayName: string;
  avatar?: string;
  phone: string;
  email?: string;
  trustScore: number;
  bikes?: Array<{
    _id: string;
    name: string;
    modelName: string;
  }>;
  totalRides?: number;
  totalDistance?: number;
  karma?: number;
}

/** Authentication state interface */
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  login: (phone: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

/**
 * Authentication store for managing user login state
 * Connects to RiderCircle API at http://localhost:4200
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  /**
   * Set user directly (used after successful auth)
   * @param user - User object or null
   */
  setUser: (user) => set({ user, isAuthenticated: !!user }),

  /**
   * Login with phone and OTP
   * Flow: Send OTP → Verify OTP → Get JWT token → Fetch user profile
   *
   * @param phone - User's phone number
   * @param otp - One-time password
   */
  login: async (phone, otp) => {
    set({ isLoading: true, error: null });

    try {
      // Step 1: Send OTP to phone number
      await api.post('/api/auth/send-otp', { phone });

      // Step 2: Verify OTP and get token
      const { token } = await api.post('/api/auth/verify-otp', { phone, otp });

      // Step 3: Store token
      await api.setToken(token);

      // Step 4: Fetch user profile
      const profile = await api.get('/api/riders/profile');

      set({ user: profile, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Login failed';
      set({
        error: errorMessage,
        isLoading: false,
        isAuthenticated: false,
      });
      throw error;
    }
  },

  /**
   * Logout user and clear all auth state
   */
  logout: async () => {
    set({ isLoading: true });

    try {
      // Call logout endpoint (optional, for server-side cleanup)
      try {
        await api.post('/api/auth/logout');
      } catch {
        // Ignore logout errors
      }

      // Clear local token
      await api.clearToken();

      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      // Even on error, clear local state
      await api.clearToken();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  /**
   * Check authentication status on app start
   * Attempts to restore session from stored token
   */
  checkAuth: async () => {
    set({ isLoading: true });

    try {
      // Get stored token
      const token = await api.getToken();
      if (!token) {
        set({ isAuthenticated: false, isLoading: false });
        return;
      }

      // Validate token and get profile
      const profile = await api.get('/api/riders/profile');
      set({ user: profile, isAuthenticated: true, isLoading: false });
    } catch {
      // Token invalid or expired
      await api.clearToken();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  /**
   * Clear any error messages
   */
  clearError: () => set({ error: null }),
}));
