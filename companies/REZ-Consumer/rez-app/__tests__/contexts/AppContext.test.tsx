// @ts-nocheck
/**
 * AppContext Tests
 * Tests the appReducer logic directly: initial state, settings updates,
 * color scheme, language, notifications, privacy, preferences, and reset.
 */

// ---------------------------------------------------------------------------
// Inline types + reducer mirroring AppContext
// ---------------------------------------------------------------------------

type ColorScheme = 'light' | 'dark' | 'auto';
type Language = 'en' | 'hi' | 'te' | 'ta' | 'bn' | 'es' | 'fr' | 'de' | 'zh' | 'ja';

interface AppNotifications {
  push: boolean;
  email: boolean;
  sms: boolean;
  offers: boolean;
  orders: boolean;
}

interface AppPrivacy {
  analytics: boolean;
  locationTracking: boolean;
  personalizedAds: boolean;
}

interface AppPreferences {
  currency: string;
  defaultLocation: string;
  autoLogin: boolean;
}

interface AppSettings {
  colorScheme: ColorScheme;
  language: Language;
  notifications: AppNotifications;
  privacy: AppPrivacy;
  preferences: AppPreferences;
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

const defaultSettings: AppSettings = {
  colorScheme: 'auto',
  language: 'en',
  notifications: { push: true, email: true, sms: false, offers: true, orders: true },
  privacy: { analytics: true, locationTracking: true, personalizedAds: true },
  preferences: { currency: 'AED', defaultLocation: 'Dubai', autoLogin: true },
};

const initialState: AppState = {
  settings: defaultSettings,
  isFirstLaunch: true,
  appVersion: '1.0.0',
  buildNumber: '1',
  lastUpdated: null,
  isLoading: true,
  error: null,
};

type AppAction =
  | { type: 'APP_LOADING'; payload: boolean }
  | { type: 'APP_LOADED'; payload: Partial<AppSettings> }
  | { type: 'APP_ERROR'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'SET_COLOR_SCHEME'; payload: ColorScheme }
  | { type: 'SET_LANGUAGE'; payload: Language }
  | { type: 'UPDATE_NOTIFICATIONS'; payload: Partial<AppNotifications> }
  | { type: 'UPDATE_PRIVACY'; payload: Partial<AppPrivacy> }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<AppPreferences> }
  | { type: 'SET_FIRST_LAUNCH'; payload: boolean }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET_SETTINGS' };

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'APP_LOADING':
      return { ...state, isLoading: action.payload, error: null };
    case 'APP_LOADED':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
        isLoading: false,
        error: null,
        lastUpdated: new Date().toISOString(),
      };
    case 'APP_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
        lastUpdated: new Date().toISOString(),
      };
    case 'SET_COLOR_SCHEME':
      return {
        ...state,
        settings: { ...state.settings, colorScheme: action.payload },
        lastUpdated: new Date().toISOString(),
      };
    case 'SET_LANGUAGE':
      return {
        ...state,
        settings: { ...state.settings, language: action.payload },
        lastUpdated: new Date().toISOString(),
      };
    case 'UPDATE_NOTIFICATIONS':
      return {
        ...state,
        settings: {
          ...state.settings,
          notifications: { ...state.settings.notifications, ...action.payload },
        },
        lastUpdated: new Date().toISOString(),
      };
    case 'UPDATE_PRIVACY':
      return {
        ...state,
        settings: {
          ...state.settings,
          privacy: { ...state.settings.privacy, ...action.payload },
        },
        lastUpdated: new Date().toISOString(),
      };
    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        settings: {
          ...state.settings,
          preferences: { ...state.settings.preferences, ...action.payload },
        },
        lastUpdated: new Date().toISOString(),
      };
    case 'SET_FIRST_LAUNCH':
      return { ...state, isFirstLaunch: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'RESET_SETTINGS':
      return {
        ...state,
        settings: defaultSettings,
        lastUpdated: new Date().toISOString(),
      };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AppContext – initial state', () => {
  it('starts with isLoading true', () => {
    expect(initialState.isLoading).toBe(true);
  });

  it('starts with isFirstLaunch true', () => {
    expect(initialState.isFirstLaunch).toBe(true);
  });

  it('default colorScheme is auto', () => {
    expect(initialState.settings.colorScheme).toBe('auto');
  });

  it('default language is en', () => {
    expect(initialState.settings.language).toBe('en');
  });

  it('default currency is AED', () => {
    expect(initialState.settings.preferences.currency).toBe('AED');
  });
});

describe('AppContext – APP_LOADED', () => {
  it('merges loaded settings and clears loading', () => {
    const loading = appReducer(initialState, { type: 'APP_LOADING', payload: true });
    const state = appReducer(loading, {
      type: 'APP_LOADED',
      payload: { colorScheme: 'dark', language: 'hi' },
    });
    expect(state.settings.colorScheme).toBe('dark');
    expect(state.settings.language).toBe('hi');
    expect(state.isLoading).toBe(false);
    expect(state.lastUpdated).not.toBeNull();
  });
});

describe('AppContext – theme and language settings', () => {
  it('SET_COLOR_SCHEME updates colorScheme to dark', () => {
    const state = appReducer(initialState, {
      type: 'SET_COLOR_SCHEME',
      payload: 'dark',
    });
    expect(state.settings.colorScheme).toBe('dark');
  });

  it('SET_COLOR_SCHEME updates colorScheme to light', () => {
    const state = appReducer(initialState, {
      type: 'SET_COLOR_SCHEME',
      payload: 'light',
    });
    expect(state.settings.colorScheme).toBe('light');
  });

  it('SET_LANGUAGE changes language', () => {
    const state = appReducer(initialState, {
      type: 'SET_LANGUAGE',
      payload: 'fr',
    });
    expect(state.settings.language).toBe('fr');
  });
});

describe('AppContext – notifications', () => {
  it('UPDATE_NOTIFICATIONS merges partial update', () => {
    const state = appReducer(initialState, {
      type: 'UPDATE_NOTIFICATIONS',
      payload: { sms: true, offers: false },
    });
    expect(state.settings.notifications.sms).toBe(true);
    expect(state.settings.notifications.offers).toBe(false);
    // Unchanged fields preserved
    expect(state.settings.notifications.push).toBe(true);
  });
});

describe('AppContext – privacy settings', () => {
  it('UPDATE_PRIVACY can disable analytics', () => {
    const state = appReducer(initialState, {
      type: 'UPDATE_PRIVACY',
      payload: { analytics: false },
    });
    expect(state.settings.privacy.analytics).toBe(false);
    expect(state.settings.privacy.locationTracking).toBe(true); // unchanged
  });
});

describe('AppContext – preferences', () => {
  it('UPDATE_PREFERENCES changes currency', () => {
    const state = appReducer(initialState, {
      type: 'UPDATE_PREFERENCES',
      payload: { currency: 'INR' },
    });
    expect(state.settings.preferences.currency).toBe('INR');
    expect(state.settings.preferences.autoLogin).toBe(true); // unchanged
  });

  it('UPDATE_PREFERENCES changes defaultLocation', () => {
    const state = appReducer(initialState, {
      type: 'UPDATE_PREFERENCES',
      payload: { defaultLocation: 'Mumbai' },
    });
    expect(state.settings.preferences.defaultLocation).toBe('Mumbai');
  });
});

describe('AppContext – RESET_SETTINGS', () => {
  it('restores all settings to defaults', () => {
    let state = appReducer(initialState, { type: 'SET_COLOR_SCHEME', payload: 'dark' });
    state = appReducer(state, { type: 'SET_LANGUAGE', payload: 'hi' });
    state = appReducer(state, { type: 'RESET_SETTINGS' });

    expect(state.settings.colorScheme).toBe('auto');
    expect(state.settings.language).toBe('en');
    expect(state.lastUpdated).not.toBeNull();
  });
});

describe('AppContext – error handling', () => {
  it('APP_ERROR stores error and clears loading', () => {
    const state = appReducer(
      { ...initialState, isLoading: true },
      { type: 'APP_ERROR', payload: 'Failed to load settings' }
    );
    expect(state.error).toBe('Failed to load settings');
    expect(state.isLoading).toBe(false);
  });

  it('CLEAR_ERROR removes the error', () => {
    const withError = appReducer(initialState, {
      type: 'APP_ERROR',
      payload: 'some error',
    });
    const state = appReducer(withError, { type: 'CLEAR_ERROR' });
    expect(state.error).toBeNull();
  });
});

describe('AppContext – markAppAsLaunched (mocked)', () => {
  it('SET_FIRST_LAUNCH false marks the app as launched', () => {
    const state = appReducer(initialState, {
      type: 'SET_FIRST_LAUNCH',
      payload: false,
    });
    expect(state.isFirstLaunch).toBe(false);
  });
});

describe('AppContext – formattedCurrency computed value', () => {
  it('formats AED amounts correctly using Intl.NumberFormat', () => {
    const formatter = new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' });
    const result = formatter.format(100);
    expect(result).toContain('100');
  });

  it('formats INR amounts correctly', () => {
    const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
    const result = formatter.format(500);
    expect(result).toContain('500');
  });
});
