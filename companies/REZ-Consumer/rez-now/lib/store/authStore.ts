'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser } from '@/lib/types';
import { setTokens, clearTokens } from '@/lib/api/client';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoggedIn: boolean;
  setSession: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoggedIn: false,

      setSession: (accessToken, refreshToken, user) => {
        void setTokens(accessToken, refreshToken);
        set({ accessToken, refreshToken, user, isLoggedIn: true });
      },

      clearSession: () => {
        clearTokens();
        set({ accessToken: null, refreshToken: null, user: null, isLoggedIn: false });
      },
    }),
    {
      name: 'rez-auth',
      // NW-MED-012: Derive isLoggedIn from token presence at read time.
      // Persisting isLoggedIn independently causes desync after hard refresh when
      // tokens were cleared but zustand rehydrates from old persisted state.
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
);
