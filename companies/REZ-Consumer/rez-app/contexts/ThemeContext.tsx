/**
 * Theme Context — backed by Zustand (themeStore).
 *
 * Sprint 12: Exposes `theme`, `toggleTheme`, `isDark`, and `colors` (sprint palette).
 * ThemeProvider is kept as a passthrough for backwards compatibility.
 */
import React from 'react';
import {
  colors as lightThemeColors,
  darkColors as darkThemeColors,
  gradients,
  darkGradients,
  shadows,
  darkShadows,
  glass,
  darkGlass,
} from '@/constants/theme';
import { useResolvedTheme } from '@/stores/themeStore';
import type { ThemeMode } from '@/stores/themeStore';

export type { ThemeMode };

// Sprint 12 color palette — used by screens that call useTheme()
export const LIGHT_COLORS = {
  bg: '#F5F7FA',
  card: '#FFFFFF',
  text: '#0A1628',
  subtext: '#6B7280',
  border: '#E5E7EB',
  accent: '#FFD700',
} as const;

export const DARK_COLORS = {
  bg: '#0A0F1A',
  card: '#1A2332',
  text: '#F9FAFB',
  subtext: '#9CA3AF',
  border: '#2D3748',
  accent: '#FFD700',
} as const;

export type SprintColors = typeof LIGHT_COLORS | typeof DARK_COLORS;

interface ThemeContextValue {
  /** 'light' | 'dark' — resolved value (system preference applied) */
  theme: 'light' | 'dark';
  themeMode: ThemeMode;
  isDark: boolean;
  /**
   * Full theme token object from constants/theme.
   * Use this for rich token access (text.primary, primary[500], etc.).
   * Alias of `themeColors` — kept here so legacy components work with
   * `const { colors } = useTheme()` patterns.
   */
  colors: typeof lightThemeColors | typeof darkThemeColors;
  /** Full theme tokens from constants/theme — same object as `colors` */
  themeColors: typeof lightThemeColors | typeof darkThemeColors;
  /** Sprint 12 flat color palette: bg, card, text, subtext, border, accent */
  sprintColors: SprintColors;
  gradients: typeof gradients | typeof darkGradients;
  shadows: typeof shadows | typeof darkShadows;
  glass: typeof glass | typeof darkGlass;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

/**
 * ThemeProvider — now a passthrough. Kept for backwards compatibility.
 * Remove once all imports are cleaned up.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/**
 * useTheme — returns theme values including Sprint 12 color palette.
 * Works with or without ThemeProvider in the tree.
 */
export function useTheme(): ThemeContextValue {
  const resolved = useResolvedTheme();
  const isDark = resolved.isDark;

  const resolvedThemeColors = isDark ? darkThemeColors : lightThemeColors;

  return {
    theme: isDark ? 'dark' : 'light',
    themeMode: resolved.themeMode,
    isDark,
    // `colors` returns the full token object so legacy components remain compatible
    colors: resolvedThemeColors,
    themeColors: resolvedThemeColors,
    // Sprint 12 flat palette — used by screens that destructure as `colors: themeColors`
    sprintColors: isDark ? DARK_COLORS : LIGHT_COLORS,
    gradients: isDark ? darkGradients : gradients,
    shadows: isDark ? darkShadows : shadows,
    glass: isDark ? darkGlass : glass,
    setThemeMode: resolved.setThemeMode,
    toggleTheme: resolved.toggleTheme,
  };
}

export default {};
