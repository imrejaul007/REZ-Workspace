// @ts-nocheck
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { errorLogger } from '@/services/errorLogger';

type ColorScheme = 'light' | 'dark' | 'auto';
type Language = 'en' | 'hi' | 'te' | 'ta' | 'bn' | 'es' | 'fr' | 'de' | 'zh' | 'ja';

interface AppSettings {
  colorScheme: ColorScheme;
  language: Language;
  notifications: {
    push: boolean;
    email: boolean;
    sms: boolean;
    offers: boolean;
    orders: boolean;
  };
  privacy: {
    analytics: boolean;
    locationTracking: boolean;
    personalizedAds: boolean;
  };
  preferences: {
    currency: string;
    defaultLocation: string;
    autoLogin: boolean;
  };
}

interface AppState {
  settings: AppSettings;
  isFirstLaunch: boolean;
  appVersion: string;
  buildNumber: string;
  lastUpdated: string | null;
  isLoading: boolean;
  error: string | null;
}

interface AppStoreState {
  state: AppState;
  actions: {
    loadSettings: () => Promise<void>;
    updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
    setColorScheme: (scheme: ColorScheme) => Promise<void>;
    setLanguage: (language: Language) => Promise<void>;
    updateNotifications: (notifications: Partial<AppSettings['notifications']>) => Promise<void>;
    updatePrivacy: (privacy: Partial<AppSettings['privacy']>) => Promise<void>;
    updatePreferences: (preferences: Partial<AppSettings['preferences']>) => Promise<void>;
    resetSettings: () => Promise<void>;
    clearError: () => void;
    markAppAsLaunched: () => Promise<void>;
  };
  computed: {
    effectiveColorScheme: 'light' | 'dark';
    isFirstTime: boolean;
    formattedCurrency: (amount: number) => string;
  };
}

const STORAGE_KEYS = {
  APP_SETTINGS: 'app_settings',
  FIRST_LAUNCH: 'first_launch',
};

const defaultSettings: AppSettings = {
  colorScheme: 'auto',
  language: 'en',
  notifications: {
    push: true,
    email: true,
    sms: false,
    offers: true,
    orders: true,
  },
  privacy: {
    analytics: true,
    locationTracking: true,
    personalizedAds: true,
  },
  preferences: {
    currency: 'AED',
    defaultLocation: 'Dubai',
    autoLogin: true,
  },
};

const initialAppState: AppState = {
  settings: defaultSettings,
  isFirstLaunch: true,
  appVersion: '1.0.0',
  buildNumber: '1',
  lastUpdated: null,
  isLoading: true,
  error: null,
};

// Debounce timer for saving settings - stored on module for cleanup
let _saveTimeout: ReturnType<typeof setTimeout> | null = null;

export function clearAppStoreTimeout(): void {
  if (_saveTimeout) {
    clearTimeout(_saveTimeout);
    _saveTimeout = null;
  }
}

function saveSettingsDebounced(settings: AppSettings) {
  if (_saveTimeout) clearTimeout(_saveTimeout);
  _saveTimeout = setTimeout(() => {
    try {
      const serialized = JSON.stringify(settings);
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, serialized);
      }
      AsyncStorage.setItem(STORAGE_KEYS.APP_SETTINGS, serialized).catch(() => {});
    } catch (e) {
      errorLogger.logStorageError('appStore:saveSettings', e, 'async', 'app_settings');
    } finally {
      _saveTimeout = null;
    }
  }, 500);
}

const formatters: Record<string, Intl.NumberFormat> = {
  AED: new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }),
  INR: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }),
  USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
  EUR: new Intl.NumberFormat('en-EU', { style: 'currency', currency: 'EUR' }),
  CNY: new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }),
};

type StoreSet = (partial: Partial<AppStoreState> | ((s: AppStoreState) => Partial<AppStoreState>), replace?: boolean) => void;
type StoreGet = () => AppStoreState;

export const useAppStore = create<AppStoreState>((set: StoreSet, get: StoreGet) => ({
  state: initialAppState,

  actions: {
    loadSettings: async () => {
      try {
        set((s) => ({ state: { ...s.state, isLoading: true, error: null } }));

        let settings: unknown = {};
        let isFirstLaunch = true;

        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
          try {
            const raw = window.localStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
            settings = raw ? JSON.parse(raw) : {};
            isFirstLaunch = window.localStorage.getItem(STORAGE_KEYS.FIRST_LAUNCH) !== 'false';
          } catch {}
        } else {
          const [savedSettings, firstLaunch] = await AsyncStorage.multiGet([
            STORAGE_KEYS.APP_SETTINGS,
            STORAGE_KEYS.FIRST_LAUNCH,
          ]);
          settings = savedSettings[1] ? JSON.parse(savedSettings[1]) : {};
          isFirstLaunch = firstLaunch[1] !== 'false';
        }

        set((s) => ({
          state: {
            ...s.state,
            settings: { ...s.state.settings, ...settings },
            isFirstLaunch,
            isLoading: false,
            error: null,
            lastUpdated: new Date().toISOString(),
          },
        }));
      } catch (error) {
        set((s) => ({
          state: {
            ...s.state,
            error: error instanceof Error ? error.message : 'Failed to load settings',
            isLoading: false,
          },
        }));
      }
    },

    updateSettings: async (settings: Partial<AppSettings>) => {
      set((s) => {
        const newSettings = { ...s.state.settings, ...settings };
        saveSettingsDebounced(newSettings);
        return {
          state: {
            ...s.state,
            settings: newSettings,
            lastUpdated: new Date().toISOString(),
          },
        };
      });
    },

    setColorScheme: async (scheme: ColorScheme) => {
      set((s) => {
        const newSettings = { ...s.state.settings, colorScheme: scheme };
        saveSettingsDebounced(newSettings);
        return {
          state: {
            ...s.state,
            settings: newSettings,
            lastUpdated: new Date().toISOString(),
          },
        };
      });
    },

    setLanguage: async (language: Language) => {
      set((s) => {
        const newSettings = { ...s.state.settings, language };
        saveSettingsDebounced(newSettings);
        return {
          state: {
            ...s.state,
            settings: newSettings,
            lastUpdated: new Date().toISOString(),
          },
        };
      });
    },

    updateNotifications: async (notifications: Partial<AppSettings['notifications']>) => {
      set((s) => {
        const newSettings = {
          ...s.state.settings,
          notifications: { ...s.state.settings.notifications, ...notifications },
        };
        saveSettingsDebounced(newSettings);
        return {
          state: {
            ...s.state,
            settings: newSettings,
            lastUpdated: new Date().toISOString(),
          },
        };
      });
    },

    updatePrivacy: async (privacy: Partial<AppSettings['privacy']>) => {
      set((s) => {
        const newSettings = {
          ...s.state.settings,
          privacy: { ...s.state.settings.privacy, ...privacy },
        };
        saveSettingsDebounced(newSettings);
        return {
          state: {
            ...s.state,
            settings: newSettings,
            lastUpdated: new Date().toISOString(),
          },
        };
      });
    },

    updatePreferences: async (preferences: Partial<AppSettings['preferences']>) => {
      set((s) => {
        const newSettings = {
          ...s.state.settings,
          preferences: { ...s.state.settings.preferences, ...preferences },
        };
        saveSettingsDebounced(newSettings);
        return {
          state: {
            ...s.state,
            settings: newSettings,
            lastUpdated: new Date().toISOString(),
          },
        };
      });
    },

    resetSettings: async () => {
      try {
        await AsyncStorage.removeItem(STORAGE_KEYS.APP_SETTINGS);
        set((s) => ({
          state: {
            ...s.state,
            settings: defaultSettings,
            lastUpdated: new Date().toISOString(),
          },
        }));
      } catch (error) {
        errorLogger.logStorageError('appStore:resetSettings', error, 'async', 'app_settings');
      }
    },

    clearError: () => {
      set((s) => ({ state: { ...s.state, error: null } }));
    },

    markAppAsLaunched: async () => {
      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(STORAGE_KEYS.FIRST_LAUNCH, 'false');
        }
        await AsyncStorage.setItem(STORAGE_KEYS.FIRST_LAUNCH, 'false');
        set((s) => ({ state: { ...s.state, isFirstLaunch: false } }));
      } catch (error) {
        errorLogger.logStorageError('appStore:markAppAsLaunched', error, 'async', 'first_launch');
      }
    },
  },

  computed: {
    // F6 note: these two are stale placeholders — do NOT consume them from
    // the store directly. Use the hooks in stores/appStoreSelectors.ts:
    //   useColorScheme()   — resolves 'auto' against the native scheme
    //   useIsFirstLaunch() — reactive to state.isFirstLaunch
    // Kept here only because the legacy Context-backed useApp() fallback
    // still references them; new code must prefer the selector hooks.
    effectiveColorScheme: 'light',
    isFirstTime: true,
    formattedCurrency: (amount: number): string => {
      const currency = get().state.settings.preferences.currency;
      const formatter = formatters[currency] || formatters.AED;
      return formatter.format(amount);
    },
  },
}));

// Auto-load settings on import
useAppStore.getState().actions.loadSettings();
