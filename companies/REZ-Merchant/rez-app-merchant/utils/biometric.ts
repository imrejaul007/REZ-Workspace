import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export interface BiometricResult {
  success: boolean;
  error?: string;
}

/**
 * Check if biometric authentication is available on the device.
 */
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) return false;
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  } catch {
    return false;
  }
}

/**
 * Get the type of biometric authentication available.
 */
export async function getBiometricType(): Promise<string> {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Iris';
    }
    return 'Biometric';
  } catch {
    return 'Biometric';
  }
}

/**
 * Prompt biometric authentication before a sensitive action.
 * Returns { success: true } if authenticated, or { success: false, error } if not.
 * Falls through silently if biometrics are unavailable (device doesn't support it).
 */
export async function requireBiometric(
  reason: string = 'Confirm your identity'
): Promise<BiometricResult> {
  const available = await isBiometricAvailable();
  if (!available) {
    // Device doesn't support biometrics — fail closed, require alternative auth
    return { success: false, error: 'BIOMETRIC_UNAVAILABLE' };
  }

  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      cancelLabel: 'Cancel',
      fallbackLabel: 'Use Passcode',
      // HIGH-SEC FIX (MA-SEC-003): Disable device passcode fallback.
      // Previously disableDeviceFallback=false allowed the system to fall back to the
      // device passcode without explicit user consent to that fallback. This creates
      // a security risk: an attacker with device access could bypass biometric auth by
      // entering the device passcode. Now set to true so only biometric success grants
      // access — the user must explicitly re-authenticate or cancel.
      disableDeviceFallback: true,
    });

    if (result.success) {
      return { success: true };
    }

    return {
      success: false,
      error: result.error === 'user_cancel' ? 'Authentication cancelled' : 'Authentication failed',
    };
  } catch (error) {
    return { success: false, error: error.message || 'Biometric authentication failed' };
  }
}
