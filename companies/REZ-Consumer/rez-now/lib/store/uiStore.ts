'use client';

import { create } from 'zustand';

interface UIState {
  loginModalOpen: boolean;
  loginModalCallback: (() => void) | null;
  toastMessage: string | null;
  toastType: 'success' | 'error' | 'info';

  openLoginModal: (callback?: () => void) => void;
  closeLoginModal: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  clearToast: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  loginModalOpen: false,
  loginModalCallback: null,
  toastMessage: null,
  toastType: 'info',

  openLoginModal: (callback) =>
    set({ loginModalOpen: true, loginModalCallback: callback || null }),

  closeLoginModal: () =>
    set({ loginModalOpen: false, loginModalCallback: null }),

  showToast: (message: string, type = 'info') =>
    set({ toastMessage: message, toastType: type }),

  clearToast: () => set({ toastMessage: null }),
}));
