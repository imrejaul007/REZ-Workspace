import { create } from 'zustand';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  colors,
  darkColors,
  gradients,
  darkGradients,
  shadows,
  darkShadows,
  glass,
  darkGlass,
} from '@/constants/theme';

export type ThemeMode = 'system' | 'light' | 'dark';

const THEME_STORAGE_KEY = '@rez_theme_mode';

// Sprint 12: AsyncStorage key used by ThemeContext for persistence
export const REZ_THEME_KEY = 'rez_theme';

interface ThemeStoreState {
  themeMode: ThemeMode;
  _loaded: boolean;

  // Actions
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  _initialize: () => void;
}
type StoreSet = (partial: Partial<ThemeStoreState> | ((s: ThemeStoreState) => Partial<ThemeStoreState>), replace?: boolean) => void;
type StoreGet = () => ThemeStoreState;


export const useThemeStore = create<ThemeStoreState>((set: StoreSet, get: StoreGet) => ({
  themeMode: 'system',
  _loaded: false,

  _initialize: () => {
    if (get()._loaded) return;
    // Load persisted theme from both storage keys (prefer rez_theme, fall back to legacy)
    Promise.all([
      AsyncStorage.getItem(REZ_THEME_KEY),
      AsyncStorage.getItem(THEME_STORAGE_KEY),
    ])
      .then(([rezTheme, legacyTheme]) => {
        const stored = rezTheme || legacyTheme;
        if (stored === 'dark' || stored === 'light') {
          set({ themeMode: stored as ThemeMode, _loaded: true });
        } else {
          set({ themeMode: 'system', _loaded: true });
        }
      })
      .catch(() => {
        set({ themeMode: 'system', _loaded: true });
      });
  },

  setThemeMode: (mode: ThemeMode) => {
    set({ themeMode: mode });
    // Persist to both keys for compatibility
    const value = mode === 'system' ? 'system' : mode;
    AsyncStorage.setItem(THEME_STORAGE_KEY, value).catch(() => {});
    AsyncStorage.setItem(REZ_THEME_KEY, value).catch(() => {});
  },

  toggleTheme: () => {
    const { themeMode, setThemeMode } = get();
    setThemeMode(themeMode === 'dark' ? 'light' : 'dark');
  },
}));

// Initialize on import (load stored theme preference)
useThemeStore.getState()._initialize();

/**
 * Resolves whether dark mode is active, combining store themeMode + system color scheme.
 * Must be called inside a React component (uses useColorScheme hook).
 */
export function useResolvedTheme() {
  const { themeMode, _loaded, setThemeMode, toggleTheme } = useThemeStore();
  const systemScheme = useColorScheme();

  const isDark =
    themeMode === 'dark' || (themeMode === 'system' && systemScheme === 'dark');

  const resolvedColors = isDark ? darkColors : colors;
  const resolvedGradients = isDark ? darkGradients : gradients;
  const resolvedShadows = isDark ? darkShadows : shadows;
  const resolvedGlass = isDark ? darkGlass : glass;

  return {
    themeMode,
    isDark,
    colors: resolvedColors,
    gradients: resolvedGradients,
    shadows: resolvedShadows,
    glass: resolvedGlass,
    setThemeMode,
    toggleTheme,
    _loaded,
  };
}
