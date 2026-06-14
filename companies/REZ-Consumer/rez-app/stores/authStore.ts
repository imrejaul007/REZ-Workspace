import { create } from 'zustand';
import { User } from '@/services/authApi';

// ---------------------------------------------------------------------------
// State types (mirrors AuthContext)
// ---------------------------------------------------------------------------
interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  token: string | null;
}

interface AuthActions {
  sendOTP: (phoneNumber: string, email?: string, referralCode?: string, flow?: 'login' | 'signup') => Promise<void>;
  login: (phoneNumber: string, otp: string) => Promise<User | undefined>;
  register: (phoneNumber: string, email: string, referralCode?: string) => Promise<void>;
  // FR-D003 FIX: verifyOTP returns the fresh User so callers can read isOnboarded
  // from the server response rather than stale Zustand state.
  verifyOTP: (phoneNumber: string, otp: string) => Promise<User | undefined>;
  logout: () => Promise<void>;
  forceLogout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  completeOnboarding: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
  checkAuthStatus: () => Promise<void>;
  // PIN auth: accept pre-resolved tokens + user
  loginWithTokens: (tokens: { accessToken: string; refreshToken: string }, user: User) => Promise<User>;
}

export interface AuthStoreState {
  state: AuthState;
  actions: AuthActions;
  _setFromProvider: (state: AuthState, actions: AuthActions) => void;
}

// ---------------------------------------------------------------------------
// Initial/default state
// ---------------------------------------------------------------------------
const initialState: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
  token: null,
};

const noopAsync = async () => {};
const noop = () => {};

const defaultActions: AuthActions = {
  sendOTP: noopAsync,
  login: async (_phoneNumber: string, _otp: string) => undefined,
  register: noopAsync,
  // Typed noops: signatures must match AuthActions interface even for defaults.
  // These are immediately replaced by AuthProvider on mount via _setFromProvider.
  verifyOTP: async (_phoneNumber: string, _otp: string) => undefined,
  logout: noopAsync,
  forceLogout: noop,
  updateProfile: noopAsync,
  completeOnboarding: noopAsync,
  clearError: noop,
  checkAuthStatus: noopAsync,
  loginWithTokens: async (_tokens: { accessToken: string; refreshToken: string }, _user) => _user,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
type StoreSet = (partial: Partial<AuthStoreState> | ((s: AuthStoreState) => Partial<AuthStoreState>), replace?: boolean) => void;
type StoreGet = () => AuthStoreState;

export const useAuthStore = create<AuthStoreState>((set: StoreSet) => ({
  state: initialState,
  actions: defaultActions,

  // Called by AuthProvider on every render to keep store in sync
  _setFromProvider: (state: AuthState, actions: AuthActions) => {
    set({ state, actions });
  },
}));
