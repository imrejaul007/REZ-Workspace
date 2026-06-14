// Biometric Guard - Protect app entry with biometrics
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useBiometricAuth } from './useBiometricAuth';
import { useUserStore } from '@/stores';

const BIOMETRIC_GUARD_KEY = 'biometric_guard_active';
const LAST_AUTH_KEY = 'last_biometric_auth';

interface BiometricGuardOptions {
  /** Timeout in ms before requiring re-auth (default: 5 minutes) */
  timeout?: number;
  /** Whether to show skip option (default: false) */
  allowSkip?: boolean;
  /** Custom prompt message */
  promptMessage?: string;
}

export function useBiometricGuard(options: BiometricGuardOptions = {}) {
  const {
    timeout = 5 * 60 * 1000, // 5 minutes default
    promptMessage = 'Authenticate to access app',
  } = options;

  const router = useRouter();
  const { isAuthenticated, token } = useUserStore();
  const { status: biometricStatus, authenticate, canUseBiometric } = useBiometricAuth();

  const [isLocked, setIsLocked] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if guard should be active
  const isGuardActive = useCallback((): boolean => {
    return biometricStatus.isEnabled && canUseBiometric();
  }, [biometricStatus.isEnabled, canUseBiometric]);

  // Check if recent auth exists
  const checkRecentAuth = useCallback(async (): Promise<boolean> => {
    if (!isGuardActive()) return true;

    try {
      const lastAuthStr = await SecureStore.getItemAsync(LAST_AUTH_KEY);
      if (!lastAuthStr) return false;

      const lastAuth = parseInt(lastAuthStr, 10);
      const now = Date.now();
      return now - lastAuth < timeout;
    } catch {
      return false;
    }
  }, [isGuardActive, timeout]);

  // Record successful auth timestamp
  const recordAuth = useCallback(async (): Promise<void> => {
    try {
      await SecureStore.setItemAsync(LAST_AUTH_KEY, Date.now().toString());
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Clear auth timestamp (on logout)
  const clearAuth = useCallback(async (): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(LAST_AUTH_KEY);
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Lock the app
  const lock = useCallback(() => {
    if (isGuardActive()) {
      setIsLocked(true);
    }
  }, [isGuardActive]);

  // Unlock with biometric
  const unlock = useCallback(async (): Promise<boolean> => {
    if (!isGuardActive()) {
      setIsLocked(false);
      return true;
    }

    setIsAuthenticating(true);
    setError(null);

    try {
      const result = await authenticate({ promptMessage });

      if (result.success) {
        await recordAuth();
        setIsLocked(false);
        return true;
      } else {
        setError(result.error ?? 'Authentication failed');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }, [isGuardActive, authenticate, promptMessage, recordAuth]);

  // Initialize guard state
  useEffect(() => {
    const init = async () => {
      if (!isGuardActive()) {
        setIsLocked(false);
        return;
      }

      const recentAuth = await checkRecentAuth();
      if (!recentAuth) {
        setIsLocked(true);
      }
    };

    if (isAuthenticated && token) {
      init();
    }
  }, [isAuthenticated, token, isGuardActive, checkRecentAuth]);

  // Lock on app background (optional enhancement)
  useEffect(() => {
    // This would be enhanced with AppState listener
    // to lock when app goes to background
    return () => {
      // Cleanup
    };
  }, []);

  return {
    // State
    isLocked,
    isAuthenticating,
    error,
    isGuardActive: isGuardActive(),

    // Actions
    lock,
    unlock,
    clearAuth,

    // Helpers
    canUnlock: canUseBiometric() && biometricStatus.isEnrolled,
  };
}
