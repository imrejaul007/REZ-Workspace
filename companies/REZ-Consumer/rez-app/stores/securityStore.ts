// @ts-nocheck
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import userSettingsApi from '@/services/userSettingsApi';
import { errorLogger } from '@/services/errorLogger';
import { ErrorCategory } from '@/types/error';

// Import logger for security event logging
import { logger } from '@/utils/logger';

// Import with fallback for when expo-local-authentication is not available
let LocalAuthentication: unknown = null;
let _biometricUnavailableWarned = false;
try {
  LocalAuthentication = require('expo-local-authentication');
} catch (error) {
  if (!_biometricUnavailableWarned) {
    _biometricUnavailableWarned = true;
    errorLogger.logStorageError('securityStore:init:requireLocalAuth', error, 'optional', 'expo-local-authentication');
    logger.warn(
      '[securityStore] WARNING: expo-local-authentication not available. ' +
      'Biometric authentication features will be disabled.'
    );
  }
}

export interface SecuritySettings {
  twoFactorAuth: {
    enabled: boolean;
    method: '2FA_SMS' | '2FA_EMAIL' | '2FA_APP';
    backupCodes: string[];
    lastUpdated?: string;
  };
  biometric: {
    fingerprintEnabled: boolean;
    faceIdEnabled: boolean;
    voiceEnabled: boolean;
    availableMethods: ('FINGERPRINT' | 'FACE_ID' | 'VOICE')[];
  };
  sessionManagement: {
    autoLogoutTime: number;
    allowMultipleSessions: boolean;
    rememberMe: boolean;
  };
  loginAlerts: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
  showActivity: boolean;
  showPurchaseHistory: boolean;
  allowMessaging: boolean;
  allowFriendRequests: boolean;
  dataSharing: {
    shareWithPartners: boolean;
    shareForMarketing: boolean;
    shareForRecommendations: boolean;
    shareForAnalytics: boolean;
    sharePurchaseData: boolean;
  };
  analytics: {
    allowUsageTracking: boolean;
    allowCrashReporting: boolean;
    allowPerformanceTracking: boolean;
    allowLocationTracking: boolean;
  };
}

interface SecurityStoreState {
  securitySettings: SecuritySettings | null;
  privacySettings: PrivacySettings | null;
  isLoading: boolean;
  error: string | null;
  biometricAvailable: boolean;
  biometricEnrolled: boolean;
  updateSecuritySettings: (updates: Partial<SecuritySettings>) => Promise<boolean>;
  updatePrivacySettings: (updates: Partial<PrivacySettings>) => Promise<boolean>;
  refreshSettings: () => Promise<void>;
  authenticateWithBiometric: () => Promise<boolean>;
  enableTwoFactorAuth: (method: '2FA_SMS' | '2FA_EMAIL' | '2FA_APP') => Promise<boolean>;
  disableTwoFactorAuth: () => Promise<boolean>;
  _generateBackupCodes: () => string[];
  isProfileVisible: (visibility: 'PUBLIC' | 'FRIENDS' | 'PRIVATE') => boolean;
}

const STORAGE_KEYS = {
  SECURITY_SETTINGS: 'security_settings',
  PRIVACY_SETTINGS: 'privacy_settings',
  LAST_SYNC: 'security_last_sync',
};

const defaultSecuritySettings: SecuritySettings = {
  twoFactorAuth: {
    enabled: false,
    method: '2FA_SMS',
    backupCodes: [],
  },
  biometric: {
    fingerprintEnabled: false,
    faceIdEnabled: false,
    voiceEnabled: false,
    availableMethods: [],
  },
  sessionManagement: {
    autoLogoutTime: 30,
    allowMultipleSessions: true,
    rememberMe: true,
  },
  loginAlerts: true,
};

const defaultPrivacySettings: PrivacySettings = {
  profileVisibility: 'FRIENDS',
  showActivity: false,
  showPurchaseHistory: false,
  allowMessaging: true,
  allowFriendRequests: true,
  dataSharing: {
    shareWithPartners: false,
    shareForMarketing: false,
    shareForRecommendations: true,
    shareForAnalytics: false,
    sharePurchaseData: false,
  },
  analytics: {
    allowUsageTracking: true,
    allowCrashReporting: true,
    allowPerformanceTracking: true,
    allowLocationTracking: false,
  },
};

type StoreSet = (partial: Partial<SecurityStoreState> | ((s: SecurityStoreState) => Partial<SecurityStoreState>), replace?: boolean) => void;
type StoreGet = () => SecurityStoreState;

export const useSecurityStore = create<SecurityStoreState>((set: StoreSet, get: StoreGet) => ({
  securitySettings: null,
  privacySettings: null,
  isLoading: false,
  error: null,
  biometricAvailable: false,
  biometricEnrolled: false,

  updateSecuritySettings: async (updates: Partial<SecuritySettings>): Promise<boolean> => {
    try {
      const currentSettings = get().securitySettings;
      if (!currentSettings) return false;

      const newSettings = { ...currentSettings, ...updates };
      set({ securitySettings: newSettings });

      await AsyncStorage.setItem(STORAGE_KEYS.SECURITY_SETTINGS, JSON.stringify(newSettings));

      try {
        const response = await userSettingsApi.updateSecuritySettings(newSettings);
        if (response.success) {
          await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
          return true;
        }
        return false;
      } catch (err) {
        errorLogger.logApiError('securityStore:updateSecuritySettings:api', err, '/api/settings/security', 500);
        return false;
      }
    } catch (err) {
      errorLogger.logStorageError('securityStore:updateSecuritySettings', err, 'async', 'security_settings');
      set({ error: 'Failed to update security settings' });
      return false;
    }
  },

  updatePrivacySettings: async (updates: Partial<PrivacySettings>): Promise<boolean> => {
    try {
      const currentSettings = get().privacySettings;
      if (!currentSettings) return false;

      const newSettings = { ...currentSettings, ...updates };
      set({ privacySettings: newSettings });

      await AsyncStorage.setItem(STORAGE_KEYS.PRIVACY_SETTINGS, JSON.stringify(newSettings));

      try {
        const response = await userSettingsApi.updatePrivacySettings(newSettings);
        if (response.success) {
          await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
          return true;
        }
        return false;
      } catch (err) {
        errorLogger.logApiError('securityStore:updatePrivacySettings:api', err, '/api/settings/privacy', 500);
        return false;
      }
    } catch (err) {
      errorLogger.logStorageError('securityStore:updatePrivacySettings', err, 'async', 'privacy_settings');
      set({ error: 'Failed to update privacy settings' });
      return false;
    }
  },

  refreshSettings: async (): Promise<void> => {
    try {
      set({ isLoading: true, error: null });

      try {
        const response = await userSettingsApi.getUserSettings();
        if (response.success && response.data) {
          set({
            securitySettings: response.data.security || defaultSecuritySettings,
            privacySettings: response.data.privacy || defaultPrivacySettings,
          });

          await AsyncStorage.setItem(STORAGE_KEYS.SECURITY_SETTINGS, JSON.stringify(response.data.security || defaultSecuritySettings));
          await AsyncStorage.setItem(STORAGE_KEYS.PRIVACY_SETTINGS, JSON.stringify(response.data.privacy || defaultPrivacySettings));
          await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
        } else {
          // Fallback to local storage
          await loadFromStorage();
        }
      } catch (err) {
        errorLogger.logApiError('securityStore:refreshSettings:api', err, '/api/settings', 500);
        await loadFromStorage();
      }

      // Check biometric availability
      if (LocalAuthentication) {
        try {
          const hasHardware = await LocalAuthentication.hasHardwareAsync();
          const isEnrolled = await LocalAuthentication.isEnrolledAsync();
          set({ biometricAvailable: hasHardware, biometricEnrolled: isEnrolled });
        } catch (e) {
          errorLogger.logAuthError('securityStore:refreshSettings:biometricCheck', e, 'biometric');
        }
      }
    } catch (err) {
      errorLogger.logStorageError('securityStore:refreshSettings', err, 'async', 'settings');
      set({ error: 'Failed to load security settings' });
      await loadFromStorage();
    } finally {
      set({ isLoading: false });
    }

    async function loadFromStorage() {
      try {
        const [securityStored, privacyStored] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.SECURITY_SETTINGS),
          AsyncStorage.getItem(STORAGE_KEYS.PRIVACY_SETTINGS),
        ]);
        set({
          securitySettings: securityStored ? JSON.parse(securityStored) : defaultSecuritySettings,
          privacySettings: privacyStored ? JSON.parse(privacyStored) : defaultPrivacySettings,
        });
      } catch (e) {
        errorLogger.logStorageError('securityStore:loadFromStorage', e, 'async', 'settings');
        set({
          securitySettings: defaultSecuritySettings,
          privacySettings: defaultPrivacySettings,
        });
      }
    }
  },

  authenticateWithBiometric: async (): Promise<boolean> => {
    try {
      if (!LocalAuthentication) {
        logger.warn('[securityStore] Biometric auth attempted but LocalAuthentication not available');
        return false;
      }
      const { biometricAvailable, biometricEnrolled } = get();
      if (!biometricAvailable || !biometricEnrolled) {
        logger.warn('[securityStore] Biometric auth attempted but biometrics not available/enrolled');
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to continue',
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        logger.info('[securityStore] SECURITY: Biometric authentication successful');
      } else {
        logger.warn('[securityStore] SECURITY: Biometric authentication failed', {
          error: result.error,
          warning: result.warning,
        });
      }

      return result.success;
    } catch (error) {
      errorLogger.logAuthError('securityStore:authenticateWithBiometric', error, 'biometric');
      logger.error('[securityStore] SECURITY: Biometric authentication error', { error });
      return false;
    }
  },

  enableTwoFactorAuth: async (method: '2FA_SMS' | '2FA_EMAIL' | '2FA_APP'): Promise<boolean> => {
    try {
      const response = await userSettingsApi.enableTwoFactorAuth(method);
      if (response.success) {
        logger.info(`[securityStore] SECURITY: 2FA enabled via ${method}`);
        await get().updateSecuritySettings({
          twoFactorAuth: {
            enabled: true,
            method,
            backupCodes: response.data.backupCodes,
            lastUpdated: new Date().toISOString(),
          },
        });
        return true;
      }
      logger.warn('[securityStore] SECURITY: 2FA enable failed', { success: response.success });
      return false;
    } catch (error) {
      errorLogger.logAuthError('securityStore:enableTwoFactorAuth', error, '2fa');
      logger.error('[securityStore] SECURITY: 2FA enable error', { error });
      return false;
    }
  },

  disableTwoFactorAuth: async (): Promise<boolean> => {
    try {
      const response = await userSettingsApi.disableTwoFactorAuth();
      if (response.success) {
        logger.info('[securityStore] SECURITY: 2FA disabled');
        await get().updateSecuritySettings({
          twoFactorAuth: {
            enabled: false,
            method: '2FA_SMS',
            backupCodes: [],
          },
        });
        return true;
      }
      logger.warn('[securityStore] SECURITY: 2FA disable failed');
      return false;
    } catch (error) {
      errorLogger.logAuthError('securityStore:disableTwoFactorAuth', error, '2fa');
      logger.error('[securityStore] SECURITY: 2FA disable error', { error });
      return false;
    }
  },

  _generateBackupCodes: (): string[] => {
    // DEPRECATED: This function is no longer used.
    // Backup codes are now obtained from the backend via enableTwoFactorAuth response.
    // This function exists only to prevent TypeScript errors in existing code.
    if (__DEV__) {
      logger.warn('[SecurityStore] DEPRECATED: _generateBackupCodes called. Backup codes come from backend response.');
    }
    return [];
  },

  isProfileVisible: (visibility: 'PUBLIC' | 'FRIENDS' | 'PRIVATE'): boolean => {
    const { privacySettings } = get();
    if (!privacySettings) return false;
    return privacySettings.profileVisibility === visibility;
  },
}));
