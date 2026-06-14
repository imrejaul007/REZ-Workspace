/**
 * REZ Color System - SINGLE SOURCE OF TRUTH
 *
 * Color palette based on REZ brand identity:
 * - Nile Blue: #1a3a52 (Primary dark)
 * - Light Mustard: #ffcd57 (Primary accent)
 * - Linen: #faf1e0 (Light background)
 * - Light Peach: #ffd7b5 (Secondary accent)
 * - Lavender Mist: #dfebf7 (Tertiary accent)
 *
 * CRITICAL: All three REZ apps (Consumer, Merchant, Admin) must use these exact hex values.
 * Do NOT hardcode hex values anywhere in components. Always reference these constants.
 * Last updated: 2026-03-23
 */

// ============================================================================
// CORE BRAND COLORS - IMMUTABLE ACROSS ALL REZ APPS
// ============================================================================

export const RezColors = {
  nileBlue: '#1a3a52',
  lightMustard: '#ffcd57',
  linen: '#faf1e0',
  lightPeach: '#ffd7b5',
  lavenderMist: '#dfebf7',
} as const;

// ============================================================================
// REZ SHARED BRAND TOKENS - ALL APPS MUST USE THESE
// ============================================================================

export const SharedBrandColors = {
  // Primary Accent (Mustard/Gold)
  primary: {
    50: '#FFF9E6',
    100: '#FFF3CC',
    200: '#FFE799',
    300: '#FFDB66',
    400: '#FFD433',
    500: '#ffcd57', // PRIMARY BRAND COLOR
    600: '#E6B84E',
    700: '#CCA345',
    800: '#B38F3C',
    900: '#9A7A32',
  },

  // Primary Dark (Navy/Nile Blue)
  secondary: {
    50: '#E8EEF3',
    100: '#D1DDE7',
    200: '#A3BBCF',
    300: '#7599B7',
    400: '#47779F',
    500: '#2A5577',
    600: '#1a3a52', // PRIMARY DARK BRAND COLOR
    700: '#163148',
    800: '#12283D',
    900: '#0E1F33',
  },

  // Extended Brand Palette
  linen: '#faf1e0',
  peach: '#ffd7b5',
  lavender: '#dfebf7',
} as const;

const tintColorLight = '#ffcd57'; // REZ Mustard
const tintColorDark = '#ffcd57';

export const Colors = {
  light: {
    text: '#1a3a52', // Nile Blue
    background: '#FFFFFF',
    tint: '#ffcd57', // REZ Mustard
    icon: '#9AA7B2', // Cool Gray
    tabIconDefault: '#9AA7B2',
    tabIconSelected: '#ffcd57', // REZ Mustard
    surface: '#FFFFFF',
    surfaceSecondary: '#faf1e0', // Linen
    border: '#E8DCC4',
    primary: '#ffcd57', // REZ Mustard
    secondary: '#1a3a52', // Nile Blue
    accent: '#1a3a52', // Nile Blue
    success: '#2ECC71',
    warning: '#FF9F1C',
    error: '#E74C3C',
    textSecondary: '#2A5577', // Lighter Nile Blue
    textMuted: '#9AA7B2',
    gold: '#ffcd57', // REZ Mustard
    // REZ specific
    nileBlue: '#1a3a52',
    mustard: '#ffcd57',
    linen: '#faf1e0',
    peach: '#ffd7b5',
    lavender: '#dfebf7',
  },
  dark: {
    text: '#E1E3E6',
    background: '#121212',
    tint: '#ffcd57',
    icon: '#6B7280',
    tabIconDefault: '#6B7280',
    tabIconSelected: '#ffcd57',
    surface: '#1E1E1E',
    surfaceSecondary: '#2C2C2C',
    border: '#3A3A3A',
    primary: '#ffcd57',
    secondary: '#7599B7',
    accent: '#7599B7',
    success: '#2ECC71',
    warning: '#FF9F1C',
    error: '#EF4444',
    textSecondary: '#A0AEC0',
    textMuted: '#6B7280',
    gold: '#ffcd57',
    // REZ specific
    nileBlue: '#7599B7',
    mustard: '#ffcd57',
    linen: '#1E1E1E',
    peach: '#ffd7b5',
    lavender: '#1A2633',
  },
};
