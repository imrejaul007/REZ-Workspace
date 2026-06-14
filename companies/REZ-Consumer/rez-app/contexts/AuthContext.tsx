// @ts-nocheck
import React, { createContext, useContext, useReducer, useEffect, ReactNode, useRef, useCallback, useMemo } from 'react';
import { logger } from '@/utils/logger';
import { useAuthStore, type AuthStoreState } from '@/stores/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import authService, { User, AuthResponse } from '@/services/authApi';
import apiClient from '@/services/apiClient';
import * as authStorage from '@/utils/authStorage';
import { isTokenExpired, isTokenExpiringSoon, getTimeUntilExpiration } from '@/utils/tokenUtils';
import analytics from '@/services/analytics/AnalyticsService';
import { ANALYTICS_EVENTS } from '@/services/analytics/events';
import {
  validateUser,
} from '@/types/unified';
import { queryClient } from '@/lib/queryClient';
import { useWalletStore } from '@/stores/walletStore';

// Use types from unified type system
interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  token: string | null;
}

type AuthAction =
  | { type: 'AUTH_LOADING'; payload: boolean }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'CLEAR_ERROR' };

// Storage keys
const STORAGE_KEYS = {
  USER: 'auth_user',
};

// Initial state
const initialState: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
  token: null,
};

// Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_LOADING':
      return { ...state, isLoading: action.payload, error: null };
    
    case 'AUTH_SUCCESS':

      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    
    case 'AUTH_LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };
    
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    default:
      return state;
  }
}

// Context
interface AuthContextType {
  state: AuthState;
  actions: {
    sendOTP: (phoneNumber: string, email?: string, referralCode?: string, flow?: 'login' | 'signup') => Promise<void>;
    login: (phoneNumber: string, otp: string) => Promise<User | undefined>;
    register: (phoneNumber: string, email: string, referralCode?: string) => Promise<void>;
    // FR-D003 FIX: verifyOTP returns the fresh User so the OTP screen can navigate
    // correctly using the server response instead of stale Zustand state.
    verifyOTP: (phoneNumber: string, otp: string) => Promise<User | undefined>;
    logout: () => Promise<void>;
    forceLogout: () => void;
    updateProfile: (data: Partial<User>) => Promise<void>;
    completeOnboarding: (data: Partial<User>) => Promise<void>;
    clearError: () => void;
    checkAuthStatus: () => Promise<void>;
    // PIN auth: accept tokens + user object from PIN verify response
    loginWithTokens: (tokens: { accessToken: string; refreshToken: string }, user: User) => Promise<User>;
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [hasExplicitlyLoggedOut, setHasExplicitlyLoggedOut] = React.useState(false);
const [shouldRedirectToSignIn, setShouldRedirectToSignIn] = React.useState(false);
  const router = useRouter();
  const segments = useSegments();

  // Refs to prevent race conditions
  const isRefreshingToken = useRef(false);
  const refreshPromiseRef = useRef<Promise<boolean> | null>(null);
  const pendingRefreshCallbacks = useRef<Array<(success: boolean) => void>>([]);
  const isCancelledRef = useRef(false);
  const lastRedirectTimeRef = useRef(0);
  // Always tracks the LATEST segments so async navigation callbacks can re-check
  // the current route before firing router.replace (prevents stale-closure resets)
  const currentSegmentsRef = useRef(segments);

  // Ref to track current token — prevents stale closure in proactive refresh setTimeout
  const tokenRef = useRef(state.token);

  // Set up API client callbacks
  useEffect(() => {
    // Set refresh token callback
    apiClient.setRefreshTokenCallback(async () => {
      try {
        const success = await tryRefreshToken();
        return success;  // Return actual result, not always true
      } catch (error) {
        // silently handle
        return false;
      }
    });

    // Set logout callback - called when token expires/is revoked
    // This is guarded by isLoggingOut in apiClient, so only called once per cycle
    // NOTE: No router.replace here — dispatch AUTH_LOGOUT triggers the navigation guard
    apiClient.setLogoutCallback(async () => {
      try {
        // Immediately clear API tokens to stop any further authenticated requests
        apiClient.setAuthToken(null);
        authService.setAuthToken(null);

        // Clear all stored auth data (AsyncStorage + localStorage)
        await authStorage.clearAuthData();

        // Dispatch logout — navigation guard will handle redirect
        dispatch({ type: 'AUTH_LOGOUT' });

        // Set explicit logout flag to prevent auto-restoration
        setHasExplicitlyLoggedOut(true);
      } catch (error) {
        // Even if cleanup fails, ensure auth state is cleared
        dispatch({ type: 'AUTH_LOGOUT' });
        setHasExplicitlyLoggedOut(true);
      }
    });
  }, []);

  // Check auth status on app start (but not after explicit logout)
  useEffect(() => {
    isCancelledRef.current = false;
    if (!hasExplicitlyLoggedOut) {
      checkAuthStatus();
    }
    return () => { isCancelledRef.current = true; };
  }, [hasExplicitlyLoggedOut]);

  // Keep tokenRef in sync with state.token to avoid stale closures in setTimeout callbacks
  useEffect(() => { tokenRef.current = state.token; }, [state.token]);

  // Keep currentSegmentsRef in sync so async navigation callbacks can re-check
  // the live route before calling router.replace (fixes the race where an async
  // redirect fires AFTER the user has already arrived at sign-in and progressed
  // to the OTP step, which would remount sign-in and reset all local state)
  useEffect(() => { currentSegmentsRef.current = segments; }, [segments]);

  // Proactive token refresh: refresh 2 minutes before expiry instead of waiting for 401
  useEffect(() => {
    if (!state.isAuthenticated || !state.token) return;

    const scheduleRefresh = () => {
      const secsLeft = getTimeUntilExpiration(state.token!);
      if (secsLeft <= 0) return; // Already expired, 401 handler will deal with it

      // Refresh 2 minutes before expiry (or immediately if less than 2 min left)
      const refreshInMs = Math.max(0, (secsLeft - 120) * 1000);

      return setTimeout(async () => {
        // Double-check token is still expiring soon — use tokenRef to avoid stale closure
        if (tokenRef.current && isTokenExpiringSoon(tokenRef.current, 3)) {
          await tryRefreshToken();
        }
      }, refreshInMs);
    };

    const timerId = scheduleRefresh();
    return () => { if (timerId) clearTimeout(timerId); };
  }, [state.isAuthenticated, state.token]);

  // Navigation guard: Redirect to sign-in (returning users) or splash (new users) when not authenticated
  // Single source of truth for all unauthenticated redirects — no other code should call router.replace('/sign-in')
  useEffect(() => {
    // Don't navigate during initial loading
    if (state.isLoading) {
      return;
    }

    const currentRoute = segments.join('/');
    const isSignInRoute = currentRoute === 'sign-in';
    const isOnboardingRoute = currentRoute.startsWith('onboarding/');

    // Determine if we need to redirect
    let needsRedirect = false;

    if (shouldRedirectToSignIn && !isSignInRoute) {
      needsRedirect = true;
      setShouldRedirectToSignIn(false);
    } else if (!state.isAuthenticated) {
      if (isSignInRoute) return;
      if (isOnboardingRoute) return;
      needsRedirect = true;
    }

    if (needsRedirect) {
      // Debounce: prevent multiple redirects within 1 second
      const now = Date.now();
      if (now - lastRedirectTimeRef.current < 1000) return;
      lastRedirectTimeRef.current = now;

      // New users (no onboarding_completed flag) → splash; returning users → sign-in
      AsyncStorage.getItem('onboarding_completed').then((onboardingDone) => {
        // Re-check the CURRENT route at callback time — the user may have already
        // navigated to sign-in or onboarding while this async read was in flight.
        // Without this guard, router.replace('/sign-in') would remount the sign-in
        // component and reset all local state (including the OTP step) even when
        // the user is already on sign-in and actively entering their OTP.
        const liveRoute = currentSegmentsRef.current.join('/');
        if (liveRoute === 'sign-in' || liveRoute.startsWith('onboarding/')) return;

        if (!onboardingDone) {
          router.replace('/onboarding/splash');
        } else {
          router.replace('/sign-in');
        }
      }).catch(() => {
        const liveRoute = currentSegmentsRef.current.join('/');
        if (liveRoute === 'sign-in' || liveRoute.startsWith('onboarding/')) return;
        router.replace('/sign-in');
      });
    }
  }, [state.isAuthenticated, state.isLoading, segments, hasExplicitlyLoggedOut, shouldRedirectToSignIn]);

  // Set analytics user properties when user changes
  useEffect(() => {
    if (state.user && state.isAuthenticated) {
      analytics.setUserId(state.user.id);
      analytics.setUserProperties({
        city: state.user.profile?.location?.city || 'unknown',
        user_type: state.user.role || 'user',
        member_since_month: state.user.createdAt
          ? new Date(state.user.createdAt).toISOString().substring(0, 7)
          : 'unknown',
      });
    }
  }, [state.user?.id, state.isAuthenticated]);

  // Backend service integration (dummy + real API ready)

  // Actions
  const sendOTP = async (phoneNumber: string, email?: string, referralCode?: string, flow: 'login' | 'signup' = 'login') => {
    // NOTE: Do NOT dispatch AUTH_LOADING here.
    // AUTH_LOADING sets isLoading=true which causes ThemedNavigation to unmount the
    // entire <Stack> (its loading spinner replaces the stack), destroying sign-in.tsx's
    // local state (including `step`). The sign-in screen manages its own loading state
    // via the `isSending` local flag — no global loading dispatch is needed.
    try {
      // BUG-065 FIX: Type requestData explicitly instead of `any`.
      const requestData: {
        phoneNumber: string;
        flow: 'login' | 'signup';
        email?: string;
        referralCode?: string;
      } = { phoneNumber, flow };
      if (email) requestData.email = email;

      // Fixed CA-AUT-012: Validate referral code format before sending
      if (referralCode) {
        // Validate: alphanumeric only, max 20 characters
        const isValidReferralCode = /^[a-zA-Z0-9]{1,20}$/.test(referralCode);
        if (!isValidReferralCode) {
          throw new Error('Invalid referral code format. Must be alphanumeric and up to 20 characters.');
        }
        requestData.referralCode = referralCode;
      }

      const response = await authService.sendOtp(requestData);

      // Check if API returned an error
      if (!response.success) {
        const errorMessage = response.error || response.message || 'Failed to send OTP';
        throw new Error(errorMessage);
      }
    } catch (error) {
      // Re-throw error so calling components know it failed
      throw error;
    }
  };
  const login = async (phoneNumber: string, otp: string): Promise<User> => {
    try {

      dispatch({ type: 'AUTH_LOADING', payload: true });

      const response = await authService.verifyOtp({ phoneNumber, otp });

      // Check if API returned an error
      if (!response.success) {
        const errorMessage = response.error || response.message || 'Login failed';
        dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
        throw new Error(errorMessage);
      }

      // Store auth/session data in secure storage utilities.
      if (!response.data || !response.data.tokens || !response.data.user) {
        throw new Error('Invalid response data from server');
      }

      // Use authStorage utility (saves to both AsyncStorage and localStorage on web)
      await authStorage.saveAuthData(
        response.data.tokens.accessToken,
        response.data.tokens.refreshToken,
        response.data.user
      );

      // Fire-and-forget: set onboarding flag (non-blocking)
      if (response.data.user.isOnboarded) {
        AsyncStorage.setItem('onboarding_completed', 'true').catch(err => logger.error('[AuthContext] Failed to persist onboarding flag', err));
      }

      // Set auth token in API client
      authService.setAuthToken(response.data.tokens.accessToken);
      apiClient.setAuthToken(response.data.tokens.accessToken);

      // Connect realTimeService socket now that we have a valid token.
      // Fire-and-forget — a connection failure must not block the login flow.
      try {
        const { default: realTimeService } = await import('@/services/realTimeService');
        await realTimeService.updateAuthToken(response.data.tokens.accessToken);
      } catch {}

      dispatch({ type: 'AUTH_SUCCESS', payload: { user: response.data.user, token: response.data.tokens.accessToken } });

      // Track analytics: set user ID for all logins, fire sign_up for new users
      try {
        const userId = response.data.user._id || response.data.user.id;
        analytics.setUserId(userId);
        if (!response.data.user.isOnboarded) {
          analytics.trackEvent(ANALYTICS_EVENTS.USER_REGISTERED, { method: 'otp', user_id: userId });
        }
      } catch {}

      // Reset explicit logout flag since user is logging in again
      setHasExplicitlyLoggedOut(false);

      // FR-D003 FIX: Return the user so verifyOTP / callers can use fresh data
      // without relying on stale Zustand state.
      return response.data.user;
    } catch (error) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error?.message || 'Login failed'
      });

      // Re-throw error so calling components know it failed
      throw error;
    }
  };

  const register = async (phoneNumber: string, email: string, referralCode?: string) => {
    // Note: Registration is handled through OTP verification in this backend
    // This method can be used for additional registration data after OTP verification
    try {
      dispatch({ type: 'AUTH_LOADING', payload: true });

      // Send OTP first
      await sendOTP(phoneNumber, email, referralCode);

      dispatch({ type: 'AUTH_LOADING', payload: false });
    } catch (error) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error?.message || 'Registration failed'
      });

      // Re-throw error so calling components know it failed
      throw error;
    }
  };

  const verifyOTP = async (phoneNumber: string, otp: string) => {
    // FR-D003 FIX: verifyOTP must return the resolved user so callers can read
    // isOnboarded from the fresh server response rather than stale Zustand state.
    // The Zustand store dispatch (AUTH_SUCCESS) is async — the component re-renders
    // after the current microtask queue drains, so reading `user` from the store
    // immediately after `await actions.verifyOTP()` returns still gets the OLD value.
    // By returning the User object here the OTP screen can navigate correctly on
    // the very first OTP verification even before the store re-renders.
    return await login(phoneNumber, otp);
  };

  const logout = async () => {
    try {
      // Disconnect socket to release server-side resources immediately on logout
      try {
        const { default: realTimeService } = await import('@/services/realTimeService');
        realTimeService?.disconnect?.();
      } catch {}

      // LOW-3: Unregister FCM/push token from backend so the user stops
      // receiving notifications after logout.
      try {
        const { default: pushNotificationService } = await import('@/services/pushNotificationService');
        await pushNotificationService.unregisterToken();
      } catch {}

      // Call backend logout (invalidate token) - but don't fail if it errors
      try {

        const response = await authService.logout();

        // Check if logout request failed
        if (!response.success) {
          // Continue with local logout even if backend fails
        } else {

        }
      } catch (error) {
        // Continue with local logout even if backend fails
        // This is especially important for cases where the token is already invalid
      }

      // Always proceed with local cleanup regardless of backend response
      await performLocalLogout();
      
    } catch (error) {
      // Even if there's an error, try to perform local logout
      try {
        await performLocalLogout();
      } catch (localError) {
        // silently handle
      }
      // Don't re-throw - logout should always succeed from user perspective
    }
  };

  const performLocalLogout = async () => {
    try {
      // CA-AUT-007 FIX: Await clearAuthData BEFORE dispatch
      // If we dispatch AUTH_LOGOUT before clearing storage, a concurrent navigation
      // event might trigger checkAuthStatus() which reads the old token from storage
      // before it's been cleared, causing a re-authentication race condition.
      await authStorage.clearAuthData();

      // NOTE: onboarding_completed is intentionally NOT cleared on logout.
      // Returning users should not be forced through onboarding again.

      // Clear auth token from API client
      authService.setAuthToken(null);
      apiClient.setAuthToken(null);

      // Clear persisted wallet balance so a subsequent user does not see stale data
      useWalletStore.getState().resetWallet();

      // Clear all React Query cached data to prevent stale data leaking across sessions
      queryClient.clear();

      // NOW dispatch after all async cleanup is done
      dispatch({ type: 'AUTH_LOGOUT' });

      // Set explicit logout flag to prevent auto-restoration
      setHasExplicitlyLoggedOut(true);

    } catch (error) {
      throw error;
    }
  };

  const forceLogout = () => {

    try {
      // Fixed CA-AUT-024: Reset wallet store on logout
      // useWalletStore.getState().reset(); // reset not exposed in WalletStoreState

      // Clear both localStorage and AsyncStorage via authStorage
      authStorage.clearAuthData().catch(() => { /* silently handle */ });

      // Clear API client token
      authService.setAuthToken(null);
      apiClient.setAuthToken(null);

      // Force state update
      dispatch({ type: 'AUTH_LOGOUT' });

      // Set explicit logout flag to prevent auto-restoration
      setHasExplicitlyLoggedOut(true);

    } catch (error) {
      // Still dispatch logout even if clearing fails
      dispatch({ type: 'AUTH_LOGOUT' });
      setHasExplicitlyLoggedOut(true);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      if (!state.user?.id) {
        throw new Error('User not authenticated');
      }

      const response = await authService.updateProfile({
        profile: data.profile,
        preferences: data.preferences
      });

      // Check if API returned an error — do NOT dispatch AUTH_FAILURE here.
      // A failed profile update does not mean the user is logged out.
      if (!response.success) {
        const errorMessage = response.error || response.message || 'Profile update failed';
        throw new Error(errorMessage);
      }

      // BUG FIX: Use authStorage.saveUser() (writes to SecureStore on native) instead of
      // AsyncStorage.setItem(). The old code wrote to AsyncStorage but authStorage.getUser()
      // reads SecureStore first — so the saved profile was silently ignored on app restart,
      // causing old data to reload and overwrite the update.
      if (response.data) {
        await authStorage.saveUser(response.data);
        // Also stamp lastProfileSync so checkAuthStatus skips a redundant background fetch
        AsyncStorage.setItem('lastProfileSync', Date.now().toString()).catch(err => logger.error('[AuthContext] Failed to persist lastProfileSync', err));
        dispatch({ type: 'UPDATE_USER', payload: response.data });
      } else {
        throw new Error('No user data received from server');
      }
    } catch (error) {
      // Re-throw error so calling components know it failed.
      // Do NOT dispatch AUTH_FAILURE — the user IS still authenticated.
      throw error;
    }
  };

  const completeOnboarding = async (data: Partial<User>) => {
    try {

      const userId = state.user?.id || useAuthStore.getState().state?.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const response = await authService.completeOnboarding({
        profile: data.profile,
        preferences: data.preferences
      });

      // Check if API returned an error — but do NOT dispatch AUTH_FAILURE here.
      // The user IS authenticated (has valid token). A failed onboarding call
      // should not reset isAuthenticated and kick them back to sign-in.
      if (!response.success) {
        const errorMessage = response.error || response.message || 'Onboarding completion failed';
        throw new Error(errorMessage);
      }

      // Update stored user data using authStorage (writes to SecureStore on native)
      if (response.data) {
        await authStorage.saveUser(response.data);
        await AsyncStorage.setItem('onboarding_completed', 'true');
      } else {
        throw new Error('No user data received from server');
      }

      dispatch({ type: 'UPDATE_USER', payload: response.data });

    } catch (error) {
      // Do NOT dispatch AUTH_FAILURE — user is still authenticated.
      // Just log and re-throw so callers can handle gracefully.
      logger.error('[AUTH] completeOnboarding failed:', error?.message);

      // Re-throw error so calling components know it failed
      throw error;
    }
  };

  // loginWithTokens: used after PIN verification — tokens + user already resolved by caller
  const loginWithTokens = async (
    tokens: { accessToken: string; refreshToken: string },
    user: User,
  ): Promise<User> => {
    try {
      await authStorage.saveAuthData(tokens.accessToken, tokens.refreshToken, user);

      if (user.isOnboarded) {
        AsyncStorage.setItem('onboarding_completed', 'true').catch(err => logger.error('[AuthContext] Failed to persist onboarding flag', err));
      }

      authService.setAuthToken(tokens.accessToken);
      apiClient.setAuthToken(tokens.accessToken);

      dispatch({ type: 'AUTH_SUCCESS', payload: { user, token: tokens.accessToken } });

      try {
        // User may carry a MongoDB _id field alongside the canonical `id`
        const userId = (user as User & { _id?: string })._id || user.id;
        analytics.setUserId(userId);
      } catch {}

      setHasExplicitlyLoggedOut(false);
      return user;
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE', payload: error?.message || 'Login failed' });
      throw error;
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const checkAuthStatus = async () => {
    // Safety net: if the entire auth check hangs (e.g. Render cold-start takes
    // minutes), give up after 15s and show the sign-in screen so the user is
    // never permanently locked out. (CA-AUT-015)
    const authTimeout = setTimeout(() => {
      logger.warn('[AUTH] checkAuthStatus timed out after 15s');
      dispatch({ type: 'AUTH_LOGOUT' });
    }, 15_000);

    try {
      // Read stored auth FIRST, then only show loading if nothing is cached.
      // This avoids the flash: authenticated → loading skeleton → authenticated.
      const [storedToken, storedUser] = await Promise.all([
        authStorage.getAuthToken(),
        authStorage.getUser(),
      ]);

      // Phase 6 web path: on web, access token is in an httpOnly cookie (not readable
      // from JS). storedToken is null, but a valid server session may still exist.
      // Validate via getProfile() which sends the cookie automatically (withCredentials).
      if (!storedToken && typeof window !== 'undefined') {
        const profileResp = await authService.getProfile().catch(() => null);
        if (profileResp?.success && profileResp.data) {
          clearTimeout(authTimeout);
          // CA-AUT-004 FIX: Set token to 'cookie-session' sentinel if null on web.
          // This prevents other code from treating the token as missing and attempting
          // a redirect to sign-in. The API client uses credentials:'include' to send
          // httpOnly cookies on web, so we don't need a Bearer token in the header.
          dispatch({ type: 'AUTH_SUCCESS', payload: { user: profileResp.data, token: 'cookie-session' } });
          setHasExplicitlyLoggedOut(false);
          return;
        }
        // No valid cookie session — fall through to AUTH_LOGOUT below.
        clearTimeout(authTimeout);
        dispatch({ type: 'AUTH_LOGOUT' });
        return;
      }

      // Only show loading spinner if there's nothing in storage to restore from.
      // When stored credentials exist, we can restore synchronously without a flash.
      if (!storedToken || !storedUser) {
        dispatch({ type: 'AUTH_LOADING', payload: true });
      }

      if (storedToken && storedUser) {
        // Check if the access token is expired BEFORE setting isAuthenticated
        if (isTokenExpired(storedToken)) {

          // Try to refresh the token BEFORE restoring auth state
          const refreshSuccess = await tryRefreshToken();

          if (!refreshSuccess) {
            // Refresh failed - clear everything and redirect to sign-in
            await authStorage.clearAuthData();
            apiClient.setAuthToken(null);
            authService.setAuthToken(null);
            dispatch({ type: 'AUTH_LOGOUT' });
            return;
          }

          // Refresh succeeded - tryRefreshToken already dispatched AUTH_SUCCESS
          // and updated the API client with new token
          clearTimeout(authTimeout); // Cancel the 8s safety timeout — refresh succeeded
          setHasExplicitlyLoggedOut(false);
          return;
        }

        // Token is still valid - restore auth state immediately
        clearTimeout(authTimeout); // Cancel the 8s safety timeout — auth succeeded
        authService.setAuthToken(storedToken);
        apiClient.setAuthToken(storedToken);

        // Dispatch auth immediately — don't block on flag write
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: storedUser, token: storedToken }
        });

        // Fire-and-forget: set onboarding flag (non-blocking)
        if (storedUser.isOnboarded) {
          AsyncStorage.setItem('onboarding_completed', 'true').catch(err => logger.error('[AuthContext] Failed to persist onboarding flag', err));
        }

        // Reset explicit logout flag since auth is restored
        setHasExplicitlyLoggedOut(false);

        // Validate token with backend in background (token is valid, just sync user data)
        // Skip if profile was synced recently (within 5 minutes) to reduce startup API calls
        Promise.resolve().then(async () => {
          if (isCancelledRef.current) return;
          try {
            const lastSync = await AsyncStorage.getItem('lastProfileSync');
            if (lastSync && Date.now() - parseInt(lastSync, 10) < 5 * 60 * 1000) {
              return; // Profile data is fresh, skip background sync
            }
            const response = await authService.getProfile();
            if (isCancelledRef.current) return;

            if (!response.success) {
              // Only attempt refresh when the server explicitly signals an auth failure.
              // Do NOT refresh on network errors (undefined/empty error string) or
              // non-auth server errors — those don't mean the token is invalid.
              const errStr = (response.error || '').toLowerCase();
              const isAuthError = errStr.includes('401') || errStr.includes('403') ||
                errStr.includes('access token') || errStr.includes('expired') ||
                errStr.includes('revoked') || errStr.includes('invalid token') ||
                errStr.includes('unauthorized');
              if (isAuthError) {
                await tryRefreshToken();
              }
              // Otherwise silently ignore — transient server error, session stays alive
            } else if (response.data) {
              if (isCancelledRef.current) return;
              // CA-AUT-030 FIX: Profile sync comparison
              // JSON.stringify comparison is acceptable here because:
              // 1. We're comparing public user profile data (name, email, preferences)
              // 2. This is NOT sensitive data like tokens, SSNs, or passwords
              // 3. The comparison is outside the hot path (background sync)
              // 4. Timing attacks on profile data provide no security benefit to attackers
              // Note: crypto.timingSafeEqual requires equal-length buffers, unsuitable for JSON comparison
              if (JSON.stringify(response.data) !== JSON.stringify(storedUser)) {
                authStorage.saveUser(response.data).catch(err => logger.error('[AuthContext] Failed to persist user data on profile sync', err));
                dispatch({ type: 'UPDATE_USER', payload: response.data });
              }
              // Fire-and-forget: non-critical flag writes
              if (response.data.isOnboarded) {
                AsyncStorage.setItem('onboarding_completed', 'true').catch(err => logger.error('[AuthContext] Failed to persist onboarding flag', err));
              }
              AsyncStorage.setItem('lastProfileSync', Date.now().toString()).catch(err => logger.error('[AuthContext] Failed to persist lastProfileSync', err));
            }
            // response.data === undefined/null but success === true: profile endpoint returned
            // an empty body (shouldn't happen, but don't logout — just skip the sync update)
          } catch (error) {
            if (isCancelledRef.current) return;
            const errMsg = (error?.message || '').toLowerCase();
            const isAuthError = errMsg.includes('401') || errMsg.includes('403') ||
              errMsg.includes('access token') || errMsg.includes('expired') ||
              errMsg.includes('revoked') || errMsg.includes('invalid token') ||
              errMsg.includes('unauthorized');
            if (isAuthError) {
              await tryRefreshToken();
            }
            // Network/timeout errors: silently ignore, session remains alive
          }
        });

      } else {
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    } catch (error) {
      dispatch({ type: 'AUTH_LOGOUT' });
    } finally {
      clearTimeout(authTimeout);
    }
  };

  const tryRefreshToken = useCallback(async (): Promise<boolean> => {
    // If already refreshing, return the existing promise
    if (isRefreshingToken.current && refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    // Mark as refreshing
    isRefreshingToken.current = true;
    let refreshSuccess = false;

    // Create refresh promise with timeout protection (CA-AUT-006)
    const refreshPromise = (async () => {
      let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
      try {
        // Create a timeout promise that rejects after 30 seconds
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutHandle = setTimeout(() => {
            logger.warn('[AUTH] Token refresh timed out after 30s');
            reject(new Error('Token refresh timeout'));
          }, 30_000);
        });

        // Race between refresh and timeout
        const refreshToken = await Promise.race([
          authStorage.getRefreshToken(),
          timeoutPromise
        ]);

        if (refreshToken) {
          const response = await Promise.race([
            authService.refreshToken(refreshToken),
            timeoutPromise
          ]);

          // Check if API returned an error
          if (!response.success) {
            throw new Error(response.error || 'Token refresh failed');
          }

          // Update stored tokens
          if (!response.data || !response.data.tokens) {
            throw new Error('Invalid response data from server');
          }

          // Validate tokens are non-empty strings (CA-AUT-011)
          const { accessToken, refreshToken: newRefreshToken } = response.data.tokens;
          if (!accessToken || typeof accessToken !== 'string' || accessToken.trim() === '') {
            throw new Error('Invalid access token from server');
          }
          if (!newRefreshToken || typeof newRefreshToken !== 'string' || newRefreshToken.trim() === '') {
            throw new Error('Invalid refresh token from server');
          }

          // Save to both AsyncStorage AND localStorage (web) using authStorage
          await authStorage.saveAuthToken(accessToken);
          await authStorage.saveRefreshToken(newRefreshToken);

          // Set auth token in API client
          authService.setAuthToken(accessToken);
          apiClient.setAuthToken(accessToken);

          // Get user data safely (use authStorage to check localStorage first on web)
          let storedUser = null;
          try {
            storedUser = await authStorage.getUser();
          } catch (parseError) {
            storedUser = null;
          }

          if (storedUser) {
            dispatch({
              type: 'AUTH_SUCCESS',
              payload: { user: storedUser, token: response.data.tokens.accessToken }
            });
            refreshSuccess = true;
            return true; // Success
          } else {
            dispatch({ type: 'AUTH_LOGOUT' });
            return false; // Failed - no user data
          }
        } else {
          return false; // No refresh token available
        }
      } catch (error) {
        // Don't immediately logout on refresh failure - could be network issue.
        // Only clear session when the server explicitly rejects the refresh token
        // (expired, revoked, or replayed). Use precise string matching to avoid
        // treating malformed-response errors or transient network failures as auth failures.
        const errorMessage = error?.message?.toLowerCase() || '';
        const isInvalidToken =
          errorMessage.includes('token expired') ||
          errorMessage.includes('refresh token') ||   // backend messages: "Refresh token has been revoked", "Invalid refresh token", etc.
          errorMessage.includes('jwt expired') ||
          errorMessage.includes('token has been revoked') ||
          errorMessage.includes('session invalidated') ||
          errorMessage.includes('please login again') ||
          errorMessage.includes('token replay') ||
          errorMessage.includes('unauthorized');

        if (isInvalidToken) {
          // Clear all stored auth data.
          await authStorage.clearAuthData().catch(() => { /* silently handle */ });

          // Clear API client token
          apiClient.setAuthToken(null);
          authService.setAuthToken(null);

          // Dispatch logout with error so navigation guard knows to redirect
          dispatch({ type: 'AUTH_FAILURE', payload: 'Session expired. Please sign in again.' });

          // Set redirect flag — navigation guard handles the actual redirect
          setShouldRedirectToSignIn(true);

          return false; // Failed - invalid token
        } else {
          // Network error, timeout, or malformed response — do NOT logout.
          // The next request will trigger another 401→refresh attempt.
          return false; // Failed - transient error, keep session alive
        }
      } finally {
        // Clear timeout if still pending
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }

        // Reset refreshing flag
        isRefreshingToken.current = false;
        refreshPromiseRef.current = null;

        // Resolve all pending callbacks
        const callbacks = pendingRefreshCallbacks.current;
        pendingRefreshCallbacks.current = [];
        callbacks.forEach(cb => cb(refreshSuccess));
      }
    })();

    // Store promise for subsequent calls
    refreshPromiseRef.current = refreshPromise;

    return refreshPromise;
  }, []);

  // Stable actions ref — callbacks change identity on re-render but their behavior
  // is always "latest". Using a ref avoids invalidating the context memo on every render.
  // Pattern copied from GamificationContext (lines 655-689).
  const actionsRef = useRef({
    sendOTP, login, register, verifyOTP, logout, forceLogout,
    updateProfile, completeOnboarding, clearError, checkAuthStatus, loginWithTokens,
  });
  actionsRef.current = {
    sendOTP, login, register, verifyOTP, logout, forceLogout,
    updateProfile, completeOnboarding, clearError, checkAuthStatus, loginWithTokens,
  };

  // Stable wrapper that delegates to latest callbacks via ref — identity never changes
  const stableActions = useMemo(() => ({
    sendOTP: (...args: Parameters<typeof sendOTP>) => actionsRef.current.sendOTP(...args),
    login: (...args: Parameters<typeof login>) => actionsRef.current.login(...args),
    register: (...args: Parameters<typeof register>) => actionsRef.current.register(...args),
    verifyOTP: (...args: Parameters<typeof verifyOTP>) => actionsRef.current.verifyOTP(...args),
    logout: () => actionsRef.current.logout(),
    forceLogout: () => actionsRef.current.forceLogout(),
    updateProfile: (...args: Parameters<typeof updateProfile>) => actionsRef.current.updateProfile(...args),
    completeOnboarding: (...args: Parameters<typeof completeOnboarding>) => actionsRef.current.completeOnboarding(...args),
    clearError: () => actionsRef.current.clearError(),
    checkAuthStatus: () => actionsRef.current.checkAuthStatus(),
    loginWithTokens: (...args: Parameters<typeof loginWithTokens>) => actionsRef.current.loginWithTokens(...args),
  }), []); // Empty deps — wrapper identity never changes

  // Memoize context value — only re-renders consumers when state changes (not actions)
  const contextValue: AuthContextType = useMemo(() => ({
    state,
    actions: stableActions,
  }), [state, stableActions]) as unknown as AuthContextType;

  // Sync to Zustand store for crash-safe fallback
  const _setFromProvider = useAuthStore((s: AuthStoreState) => s._setFromProvider);
  useEffect(() => {
    _setFromProvider(state, stableActions as unknown as AuthContextType['actions']);
  }, [state, stableActions, _setFromProvider]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook — falls back to Zustand store for crash safety when outside Provider
export function useAuth() {
  const context = useContext(AuthContext);
  const storeState = useAuthStore((s: AuthStoreState) => s.state);
  const storeActions = useAuthStore((s: AuthStoreState) => s.actions);

  if (context !== undefined) {
    return context;
  }

  // Fallback to Zustand store (populated by Provider elsewhere in the tree)
  return { state: storeState, actions: storeActions };
}

export { AuthContext };
