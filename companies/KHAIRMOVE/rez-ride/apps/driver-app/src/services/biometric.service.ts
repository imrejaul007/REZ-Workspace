import { logger } from '../../shared/logger';
/**
 * Biometric Authentication Service
 * Provides secure biometric authentication for returning users
 */

import * as LocalAuthentication from 'expo-local-authentication';

export type BiometricType = 'fingerprint' | 'facial' | 'iris' | 'none';

interface AuthResult {
  success: boolean;
  error?: string;
}

class BiometricService {
  private isSupported: boolean = false;
  private biometricType: BiometricType = 'none';

  /**
   * Initialize biometric service
   */
  async initialize(): Promise<void> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      this.isSupported = compatible && enrolled;

      if (this.isSupported) {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          this.biometricType = 'facial';
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          this.biometricType = 'fingerprint';
        } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
          this.biometricType = 'iris';
        }
      }

      logger.info(`Biometric service initialized: ${this.isSupported ? 'supported' : 'not supported'} (${this.biometricType})`);
    } catch (error) {
      logger.error('Biometric initialization failed:', error);
      this.isSupported = false;
    }
  }

  /**
   * Check if biometric authentication is available
   */
  isAvailable(): boolean {
    return this.isSupported;
  }

  /**
   * Get the type of biometric available
   */
  getBiometricType(): BiometricType {
    return this.biometricType;
  }

  /**
   * Get display name for biometric type
   */
  getBiometricName(): string {
    switch (this.biometricType) {
      case 'facial':
        return 'Face ID';
      case 'fingerprint':
        return 'Fingerprint';
      case 'iris':
        return 'Iris Scan';
      default:
        return 'Biometric';
    }
  }

  /**
   * Authenticate user with biometrics
   */
  async authenticate(options: {
    promptMessage?: string;
    fallbackLabel?: string;
    cancelLabel?: string;
  } = {}): Promise<AuthResult> {
    if (!this.isSupported) {
      return { success: false, error: 'Biometric authentication not available' };
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: options.promptMessage || 'Authenticate to continue',
        fallbackLabel: options.fallbackLabel || 'Use PIN',
        cancelLabel: options.cancelLabel || 'Cancel',
        disableDeviceFallback: false,
        requireConfirmation: true,
      });

      if (result.success) {
        return { success: true };
      }

      // Handle different failure reasons
      let error = 'Authentication failed';
      switch (result.error) {
        case 'user_cancel':
          error = 'Authentication cancelled';
          break;
        case 'user_fallback':
          error = 'User chose fallback';
          break;
        case 'system_cancel':
          error = 'System cancelled';
          break;
        case 'lockout':
          error = 'Too many attempts. Try again later';
          break;
        case 'lockout_permanent':
          error = 'Biometric locked. Use device passcode';
          break;
        case 'not_enrolled':
          error = 'Biometric not set up';
          break;
      }

      return { success: false, error };
    } catch (error: any) {
      logger.error('Biometric authentication error:', error);
      return { success: false, error: error.message || 'Authentication failed' };
    }
  }

  /**
   * Quick check if biometrics available (cached)
   */
  async quickCheck(): Promise<boolean> {
    if (!this.isSupported) {
      return false;
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Quick check',
        cancelLabel: 'Cancel',
        disableDeviceFallback: true,
        requireConfirmation: false,
      });
      return result.success;
    } catch {
      return false;
    }
  }
}

export const biometricService = new BiometricService();
export default biometricService;
