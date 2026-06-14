/**
 * REZ Merchant App Design System - Single Source of Truth
 *
 * Design tokens for the merchant app. Uses REZ brand colors.
 * For consumer app tokens, see: rez-app-consumer/constants/theme.ts
 *
 * Brand Palette:
 * - Primary: #6366F1 (Indigo)
 * - Success: #10B981 (Green)
 * - Error: #EF4444 (Red)
 * - Warning: #F59E0B (Amber)
 * - Background: #F9FAFB (Light gray)
 * - Surface: #FFFFFF (White)
 * - Text Primary: #1F2937 (Dark gray)
 * - Text Secondary: #6B7280 (Medium gray)
 */

// ============================================================================
// COLORS
// ============================================================================

export const colors = {
  // Primary brand colors
  primary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1',
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },

  // Success / Green
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },

  // Error / Red
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },

  // Warning / Amber
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  // Neutral / Gray scale
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Semantic colors (flat strings for style props)
  // These map to specific shades for consistency
  primaryMain: '#6366F1',
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',

  successMain: '#10B981',
  successLight: '#34D399',
  successDark: '#059669',

  errorMain: '#EF4444',
  errorLight: '#F87171',
  errorDark: '#DC2626',

  warningMain: '#F59E0B',
  warningLight: '#FBBF24',
  warningDark: '#D97706',

  // Background colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    tertiary: '#F3F4F6',
  },

  // Surface (cards, modals)
  surface: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    elevated: '#FFFFFF',
  },

  // Text colors
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    inverse: '#FFFFFF',
    disabled: '#D1D5DB',
    placeholder: '#9CA3AF',
  },

  // Border colors
  border: {
    light: '#F3F4F6',
    default: '#E5E7EB',
    medium: '#D1D5DB',
    dark: '#9CA3AF',
    focus: '#6366F1',
  },

  // Overlay
  overlay: {
    light: 'rgba(0, 0, 0, 0.05)',
    medium: 'rgba(0, 0, 0, 0.1)',
    dark: 'rgba(0, 0, 0, 0.5)',
    backdrop: 'rgba(0, 0, 0, 0.6)',
  },
} as const;

// ============================================================================
// SPACING (8px grid)
// ============================================================================

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
  '6xl': 80,
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const borderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

// ============================================================================
// SHADOWS
// ============================================================================

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const typography = {
  // Font sizes
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  // Font weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// ============================================================================
// Z-INDEX
// ============================================================================

export const zIndex = {
  hidden: -1,
  base: 0,
  raised: 1,
  dropdown: 100,
  sticky: 200,
  modal: 300,
  popover: 400,
  toast: 500,
  tooltip: 600,
} as const;

// ============================================================================
// ANIMATION TIMING
// ============================================================================

export const timing = {
  duration: {
    fast: 150,
    normal: 250,
    slow: 400,
  },
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
} as const;

// ============================================================================
// TOUCH TARGET SIZE (WCAG 2.1 Level AA)
// ============================================================================

export const touchTarget = {
  minimum: 44,
  recommended: 48,
} as const;

// ============================================================================
// EXPORTS
// ============================================================================

export const theme = {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
  zIndex,
  timing,
  touchTarget,
} as const;

export default theme;
