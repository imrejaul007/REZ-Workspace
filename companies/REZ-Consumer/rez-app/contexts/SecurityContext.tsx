// @ts-nocheck
// Global Security Context
// Manages security settings and applies them globally across the app

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef, ReactNode } from 'react';
import { AppState } from 'react-native';
// SECURITY FIX (2026-05-12): Use secureAsyncStorage for security-sensitive preferences
// instead of plain AsyncStorage which stores data in plaintext.
import { secureAsyncStorage, SECURE_STORAGE_KEYS } from '@/utils/secureAsyncStorage';
import { safeJsonParse } from '@/utils/safeJson';
// Import with fallback for when expo-local-authentication is not available
let LocalAuthentication: unknown = null;
import { errorLogger } from '@/services/errorLogger';

try {
  LocalAuthentication = require('expo-local-authentication');
} catch (error) {
  errorLogger.logStorageError('SecurityContext:init:requireLocalAuth', error, 'optional', 'expo-local-authentication');
}
import { platformAlertSimple } from '@/utils/platformAlert';
import { useAuthUser, useIsAuthenticated } from '@/stores/selectors';
import userSettingsApi from '@/services/userSettingsApi';
import { useAuth } from '@/contexts/AuthContext';

// Security Settings Interface
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

// Privacy Settings Interface
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

// Context Interface
interface SecurityContextType {
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

// Default Settings
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

// Create Context
const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

// Storage Keys - Using SECURE_STORAGE_KEYS from secureAsyncStorage
// SECURITY FIX: These are now encrypted via secureAsyncStorage
const STORAGE_KEYS = {
  SECURITY_SETTINGS: SECURE_STORAGE_KEYS.SECURITY_SETTINGS,
  PRIVACY_SETTINGS: SECURE_STORAGE_KEYS.PRIVACY_SETTINGS,
  LAST_SYNC: 'security_last_sync', // Last sync is not sensitive, can use plain AsyncStorage
};

// Provider Component
interface SecurityProviderProps {
  children: ReactNode;
}

// ── Module-level dedup: survives component remounts caused by DeferredProviders ──
let _securitySettingsLoaded = false;

export function SecurityProvider({ children }: SecurityProviderProps) {
  const user = useAuthUser();
  const isAuthenticated = useIsAuthenticated();
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnrolled, setBiometricEnrolled] = useState(false);

  // Refs for state used inside stable callbacks (avoids re-creating callbacks on every state change)
  const securitySettingsRef = useRef(securitySettings);
  securitySettingsRef.current = securitySettings;
  const privacySettingsRef = useRef(privacySettings);
  privacySettingsRef.current = privacySettings;
  const isAuthenticatedRef = useRef(isAuthenticated);
  isAuthenticatedRef.current = isAuthenticated;
  const userRef = useRef(user);
  userRef.current = user;
  const biometricAvailableRef = useRef(biometricAvailable);
  biometricAvailableRef.current = biometricAvailable;
  const biometricEnrolledRef = useRef(biometricEnrolled);
  biometricEnrolledRef.current = biometricEnrolled;

  // Check biometric availability
  const checkBiometricAvailability = useCallback(async () => {
    try {
      if (!LocalAuthentication) {
        setBiometricAvailable(false);
        setBiometricEnrolled(false);
        return;
      }

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      setBiometricAvailable(hasHardware);
      setBiometricEnrolled(isEnrolled);

      // Update available methods
      const availableMethods: ('FINGERPRINT' | 'FACE_ID' | 'VOICE')[] = [];
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        availableMethods.push('FINGERPRINT');
      }
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        availableMethods.push('FACE_ID');
      }
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.VOICE)) {
        availableMethods.push('VOICE');
      }

      // Update settings with available methods
      const currentSettings = securitySettingsRef.current;
      if (currentSettings) {
        setSecuritySettings({
          ...currentSettings,
          biometric: {
            ...currentSettings.biometric,
            availableMethods,
          },
        });
      }
    } catch (error) {
      setBiometricAvailable(false);
      setBiometricEnrolled(false);
    }
  }, []);

  // Load from local storage (SECURITY FIX: using secureAsyncStorage)
  const loadFromStorage = useCallback(async () => {
    try {
      const [securityStored, privacyStored] = await Promise.all([
        secureAsyncStorage.get<SecuritySettings>(STORAGE_KEYS.SECURITY_SETTINGS),
        secureAsyncStorage.get<PrivacySettings>(STORAGE_KEYS.PRIVACY_SETTINGS),
      ]);

      if (securityStored) {
        setSecuritySettings(securityStored);
      } else {
        setSecuritySettings(defaultSecuritySettings);
      }

      if (privacyStored) {
        setPrivacySettings(privacyStored);
      } else {
        setPrivacySettings(defaultPrivacySettings);
      }
    } catch (err) {
      errorLogger.logStorageError('SecurityContext:loadFromStorage', err, 'async', 'security_settings');
      // Fallback to defaults on error
      setSecuritySettings(defaultSecuritySettings);
      setPrivacySettings(defaultPrivacySettings);
    }
  }, []);

  // Load settings from storage or backend (SECURITY FIX: using secureAsyncStorage)
  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (isAuthenticatedRef.current && userRef.current) {
        // Load from backend
        const response = await userSettingsApi.getUserSettings();
        if (response.success && response.data) {
          setSecuritySettings(response.data.security || defaultSecuritySettings);
          setPrivacySettings(response.data.privacy || defaultPrivacySettings);

          // SECURITY FIX: Save to encrypted local storage
          await Promise.all([
            secureAsyncStorage.set(STORAGE_KEYS.SECURITY_SETTINGS, response.data.security || defaultSecuritySettings),
            secureAsyncStorage.set(STORAGE_KEYS.PRIVACY_SETTINGS, response.data.privacy || defaultPrivacySettings),
          ]);
        } else {
          // Fallback to local storage
          await loadFromStorage();
        }
      } else {
        // Load from local storage
        await loadFromStorage();
      }

      // Check biometric availability
      await checkBiometricAvailability();
    } catch (err) {
      errorLogger.logApiError('SecurityContext:loadSettings', err, '/api/settings', 500);
      setError('Failed to load security settings');
      await loadFromStorage();
    } finally {
      setIsLoading(false);
    }
  }, [loadFromStorage, checkBiometricAvailability]);

  // Update security settings (SECURITY FIX: using secureAsyncStorage)
  const updateSecuritySettings = useCallback(async (updates: Partial<SecuritySettings>): Promise<boolean> => {
    try {
      const currentSettings = securitySettingsRef.current;
      if (!currentSettings) return false;

      const newSettings = { ...currentSettings, ...updates };
      setSecuritySettings(newSettings);

      // SECURITY FIX: Save to encrypted local storage
      await secureAsyncStorage.set(STORAGE_KEYS.SECURITY_SETTINGS, newSettings);

      // Sync with backend if authenticated
      if (isAuthenticatedRef.current && userRef.current) {
        try {
          const response = await userSettingsApi.updateSecuritySettings(newSettings);
          if (response.success) {
            return true;
          } else {
            return false;
          }
        } catch (err) {
          errorLogger.logApiError('SecurityContext:updateSecuritySettings:sync', err, '/api/settings/security', 500);
          return false;
        }
      }

      return true;
    } catch (err) {
      errorLogger.logStorageError('SecurityContext:updateSecuritySettings', err, 'async', 'security_settings');
      setError('Failed to update security settings');
      return false;
    }
  }, []);

  // Update privacy settings (SECURITY FIX: using secureAsyncStorage)
  const updatePrivacySettings = useCallback(async (updates: Partial<PrivacySettings>): Promise<boolean> => {
    try {
      const currentSettings = privacySettingsRef.current;
      if (!currentSettings) return false;

      const newSettings = { ...currentSettings, ...updates };
      setPrivacySettings(newSettings);

      // SECURITY FIX: Save to encrypted local storage
      await secureAsyncStorage.set(STORAGE_KEYS.PRIVACY_SETTINGS, newSettings);

      // Sync with backend if authenticated
      if (isAuthenticatedRef.current && userRef.current) {
        try {
          const response = await userSettingsApi.updatePrivacySettings(newSettings);
          if (response.success) {
            return true;
          } else {
            return false;
          }
        } catch (err) {
          errorLogger.logApiError('SecurityContext:updatePrivacySettings:sync', err, '/api/settings/privacy', 500);
          return false;
        }
      }

      return true;
    } catch (err) {
      errorLogger.logStorageError('SecurityContext:updatePrivacySettings', err, 'async', 'privacy_settings');
      setError('Failed to update privacy settings');
      return false;
    }
  }, []);

  // Refresh settings from backend
  const refreshSettings = useCallback(async () => {
    await loadSettings();
  }, [loadSettings]);

  // Authenticate with biometric
  const authenticateWithBiometric = useCallback(async (): Promise<boolean> => {
    try {
      if (!LocalAuthentication) {
        platformAlertSimple('Biometric Authentication', 'Biometric authentication is not available on this device.');
        return false;
      }

      if (!biometricAvailableRef.current || !biometricEnrolledRef.current) {
        platformAlertSimple('Biometric Authentication', 'Biometric authentication is not available or not enrolled.');
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to continue',
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel',
      });

      return result.success;
    } catch (error) {
      errorLogger.logAuthError('SecurityContext:authenticateWithBiometric', error, 'biometric');
      platformAlertSimple('Authentication Failed', 'Biometric authentication failed. Please try again.');
      return false;
    }
  }, []);

  // Enable two-factor authentication
  const enableTwoFactorAuth = useCallback(async (method: '2FA_SMS' | '2FA_EMAIL' | '2FA_APP'): Promise<boolean> => {
    try {
      const response = await userSettingsApi.enableTwoFactorAuth(method);

      if (response.success) {
        // FIX: Guard against malformed API responses — backupCodes may be undefined
        const backupCodes = response.data?.backupCodes || [];
        // Update local state
        await updateSecuritySettings({
          twoFactorAuth: {
            enabled: true,
            method,
            backupCodes,
            lastUpdated: new Date().toISOString(),
          },
        });

        platformAlertSimple(
          'Two-Factor Authentication Enabled',
          `Two-factor authentication has been enabled using ${method}. Please save your backup codes: ${backupCodes.join(', ')}`
        );
        return true;
      } else {
        platformAlertSimple('Error', 'Failed to enable two-factor authentication.');
        return false;
      }
    } catch (error) {
      platformAlertSimple('Error', 'Failed to enable two-factor authentication.');
      return false;
    }
  }, [updateSecuritySettings]);

  // Disable two-factor authentication
  const disableTwoFactorAuth = useCallback(async (): Promise<boolean> => {
    try {
      const response = await userSettingsApi.disableTwoFactorAuth();

      if (response.success) {
        // Update local state
        await updateSecuritySettings({
          twoFactorAuth: {
            enabled: false,
            method: '2FA_SMS',
            backupCodes: [],
          },
        });

        platformAlertSimple('Two-Factor Authentication Disabled', 'Two-factor authentication has been disabled.');
        return true;
      } else {
        platformAlertSimple('Error', 'Failed to disable two-factor authentication.');
        return false;
      }
    } catch (error) {
      platformAlertSimple('Error', 'Failed to disable two-factor authentication.');
      return false;
    }
  }, [updateSecuritySettings]);

  // CA-AUT-020 FIX: Backup codes must be generated server-side, not client-side
  // DEPRECATED: This function is deprecated and no longer used by the UI.
  // Backup codes are now obtained from the backend via enableTwoFactorAuth response.
  // Keeping this function with a guard to prevent accidental client-side code generation.
  const _generateBackupCodes = useCallback((): string[] => {
    // GUARD: Backup codes MUST be generated server-side during 2FA setup.
    // The backend returns them in the enableTwoFactorAuth response.
    // Client-side generation using Math.random() is cryptographically insecure.
    // Do NOT generate codes on the client using Math.random(), crypto.getRandomValues(), or any other method.
    if (__DEV__) {
      logger.warn('[SecurityContext] DEPRECATED: generateBackupCodes called. Backup codes come from backend response.');
    }
    return []; // Return empty — caller MUST use codes from backend response
  }, []);

  // Check if profile is visible based on privacy settings
  const isProfileVisible = useCallback((visibility: 'PUBLIC' | 'FRIENDS' | 'PRIVATE'): boolean => {
    const currentPrivacy = privacySettingsRef.current;
    if (!currentPrivacy) return false;
    return currentPrivacy.profileVisibility === visibility;
  }, []);

  // Load settings on mount and when auth state changes
  // Skip during onboarding to prevent thundering herd of API calls on Android
  useEffect(() => {
    if (!isAuthenticated || !user?.isOnboarded) return;
    if (_securitySettingsLoaded) return; // Module-level dedup
    _securitySettingsLoaded = true;
    loadSettings();
  }, [isAuthenticated, user]);

  // Reset module-level flag on logout
  useEffect(() => {
    if (!isAuthenticated) _securitySettingsLoaded = false;
  }, [isAuthenticated]);

  // Auto-sync with backend every 5 minutes
  useEffect(() => {
    if (!isAuthenticated || !user?.isOnboarded) return;

    const interval = setInterval(async () => {
      try {
        // Use secureAsyncStorage for consistent encrypted storage
        const lastSync = await secureAsyncStorage.get<string>(STORAGE_KEYS.LAST_SYNC);
        if (lastSync) {
          const lastSyncTime = new Date(lastSync).getTime();
          const now = new Date().getTime();
          const fiveMinutes = 5 * 60 * 1000;

          if (now - lastSyncTime > fiveMinutes) {
            await refreshSettings();
          }
        }
      } catch (err) {
        // silently handle
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  const value = useMemo<SecurityContextType>(() => ({
    securitySettings,
    privacySettings,
    isLoading,
    error,
    biometricAvailable,
    biometricEnrolled,
    updateSecuritySettings,
    updatePrivacySettings,
    refreshSettings,
    authenticateWithBiometric,
    enableTwoFactorAuth,
    disableTwoFactorAuth,
    _generateBackupCodes,
    isProfileVisible,
  }), [
    securitySettings, privacySettings, isLoading, error, biometricAvailable, biometricEnrolled,
    updateSecuritySettings, updatePrivacySettings, refreshSettings, authenticateWithBiometric,
    enableTwoFactorAuth, disableTwoFactorAuth, _generateBackupCodes, isProfileVisible,
  ]);

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
}

// Hook to use security context
// Safe defaults when provider hasn't loaded yet (deferred loading)
const SECURITY_DEFAULTS: SecurityContextType = {
  securitySettings: null,
  privacySettings: null,
  isLoading: false,
  error: null,
  biometricAvailable: false,
  biometricEnrolled: false,
  updateSecuritySettings: async () => false,
  updatePrivacySettings: async () => false,
  refreshSettings: async () => {},
  authenticateWithBiometric: async () => false,
  enableTwoFactorAuth: async () => false,
  disableTwoFactorAuth: async () => false,
  _generateBackupCodes: () => [],
  isProfileVisible: () => false,
};

// Lazy import to avoid circular deps
let __useSecurityStore: () => unknown;
try {
  const { useSecurityStore } = require('@/stores/securityStore');
  __useSecurityStore = useSecurityStore;
} catch {
  __useSecurityStore = () => SECURITY_DEFAULTS;
}

// Now backed by Zustand store -- works with or without SecurityProvider in tree.
export function useSecurity(): SecurityContextType {
  const context = useContext(SecurityContext);
  const store = __useSecurityStore();
  if (context) return context;
  return store as unknown as SecurityContextType;
}
