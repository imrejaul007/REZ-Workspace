// Biometric Authentication Hook
import { useState, useEffect, useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

export type BiometricType = 'Face ID' | 'Touch ID' | 'Fingerprint' | null;

export interface BiometricStatus {
  hasHardware: boolean;
  biometricType: BiometricType;
  isEnrolled: boolean;
  isEnabled: boolean;
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
}

export function useBiometricAuth() {
  const [status, setStatus] = useState<BiometricStatus>({
    hasHardware: false,
    biometricType: null,
    isEnrolled: false,
    isEnabled: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Check if biometric hardware is available
  const checkHardware = useCallback(async (): Promise<boolean> => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      return hasHardware;
    } catch {
      return false;
    }
  }, []);

  // Get the type of biometric available
  const getBiometricType = useCallback(async (): Promise<BiometricType> => {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        return 'Face ID';
      }
      if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return 'Touch ID';
      }
      // Check for generic biometric
      if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        return 'Fingerprint';
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // Check if biometrics are enrolled on the device
  const checkIsEnrolled = useCallback(async (): Promise<boolean> => {
    try {
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return enrolled;
    } catch {
      return false;
    }
  }, []);

  // Check if biometric is enabled in app settings
  const checkIsEnabled = useCallback(async (): Promise<boolean> => {
    try {
      const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      return enabled === 'true';
    } catch {
      return false;
    }
  }, []);

  // Initialize biometric status
  const initialize = useCallback(async () => {
    setIsLoading(true);
    try {
      const [hasHardware, biometricType, isEnrolled, isEnabled] = await Promise.all([
        checkHardware(),
        getBiometricType(),
        checkIsEnrolled(),
        checkIsEnabled(),
      ]);

      setStatus({
        hasHardware,
        biometricType,
        isEnrolled,
        isEnabled,
      });
    } catch {
      setStatus({
        hasHardware: false,
        biometricType: null,
        isEnrolled: false,
        isEnabled: false,
      });
    } finally {
      setIsLoading(false);
    }
  }, [checkHardware, getBiometricType, checkIsEnrolled, checkIsEnabled]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Enable biometric authentication
  const enableBiometric = useCallback(async (): Promise<boolean> => {
    try {
      // First authenticate to verify user identity before enabling
      const authResult = await authenticate({
        promptMessage: 'Verify your identity to enable biometric login',
      });

      if (!authResult.success) {
        return false;
      }

      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
      setStatus((prev) => ({ ...prev, isEnabled: true }));
      return true;
    } catch {
      return false;
    }
  }, []);

  // Disable biometric authentication
  const disableBiometric = useCallback(async (): Promise<boolean> => {
    try {
      // Verify identity before disabling
      const authResult = await authenticate({
        promptMessage: 'Verify your identity to disable biometric login',
      });

      if (!authResult.success) {
        return false;
      }

      await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
      setStatus((prev) => ({ ...prev, isEnabled: false }));
      return true;
    } catch {
      return false;
    }
  }, []);

  // Authenticate user with biometrics
  const authenticate = useCallback(
    async (options?: {
      promptMessage?: string;
      fallbackLabel?: string;
      cancelLabel?: string;
    }): Promise<BiometricAuthResult> => {
      try {
        // Check if biometric is enrolled
        const isEnrolled = await checkIsEnrolled();
        if (!isEnrolled) {
          return {
            success: false,
            error: 'No biometric credentials enrolled on this device',
          };
        }

        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: options?.promptMessage ?? 'Authenticate to continue',
          fallbackLabel: options?.fallbackLabel ?? 'Use passcode',
          cancelLabel: options?.cancelLabel ?? 'Cancel',
          disableDeviceFallback: false,
          requiresPascode: true,
        });

        return {
          success: result.success,
          error: result.success ? undefined : result.error ?? 'Authentication failed',
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Authentication failed',
        };
      }
    },
    [checkIsEnrolled]
  );

  // Check if biometric is available and ready to use
  const canUseBiometric = useCallback((): boolean => {
    return status.hasHardware && status.isEnrolled;
  }, [status.hasHardware, status.isEnrolled]);

  return {
    // State
    status,
    isLoading,

    // Checks
    checkHardware,
    getBiometricType,
    checkIsEnrolled,
    checkIsEnabled,
    canUseBiometric,

    // Actions
    initialize,
    enableBiometric,
    disableBiometric,
    authenticate,
  };
}
