/**
 * Merchant App Color System - ALIGNED WITH SHARED BRAND TOKENS
 *
 * CRITICAL DESIGN DISCIPLINE:
 * - All three REZ apps (Consumer, Merchant, Admin) must share core brand colors
 * - Consumer app uses Mustard (#ffcd57) and Navy (#1a3a52)
 * - Merchant app uses Purple (#7C3AED) for UI, but MUST reference shared brand tokens
 * - Admin app uses Red (#DC2626) for UI, but MUST reference shared brand tokens
 *
 * Semantic colors (success/warning/error) must be consistent across all apps.
 * Do NOT hardcode hex values. Always import and reference design token constants.
 *
 * Last updated: 2026-03-23
 */

// ============================================================================
// REZ SHARED BRAND TOKENS (imported conceptually - ensure alignment)
// ============================================================================
// Primary: #ffcd57 (Mustard)
// Primary Dark: #1a3a52 (Navy)
// Success: #2ECC71
// Warning: #FF9F1C
// Error: #EF4444

const tintColorLight = '#7C3AED'; // Purple primary (merchant-specific UI)
const tintColorDark = '#8B5CF6'; // Lighter purple for dark mode (merchant-specific UI)

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    border: '#E5E7EB',
    card: '#FFFFFF',
    notification: '#FF3B30',

    // Merchant app specific colors
    primary: '#7C3AED', // Purple
    primaryLight: '#A855F7', // Light purple
    secondary: '#10B981', // Green for success
    tertiary: '#6366F1', // Indigo for tertiary actions
    warning: '#F59E0B', // Amber for warnings
    danger: '#EF4444', // Red for errors
    destructive: '#EF4444', // Red for destructive actions
    info: '#3B82F6', // Blue for info

    // Background variants
    backgroundSecondary: '#F9FAFB',
    backgroundTertiary: '#F3F4F6',

    // Text variants
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',

    // Status colors
    success: '#10B981',
    error: '#EF4444',
    pending: '#F59E0B',
    approved: '#10B981',
    rejected: '#EF4444',

    // Brand / Accent
    navy: '#0B2240',
    indigo: '#6366F1',
    purpleDark: '#7C3AED',
    accent: '#8B5CF6', // Light purple accent

    // Text heading variants
    textHeading: '#111827', // Near-black for headings
    textDark: '#1F2937', // Dark gray for subheadings
    textTertiary: '#374151', // Medium-dark gray for tertiary text

    // Background variants (extended)
    warningLight: '#FEF3C7', // Light amber for warning backgrounds
    successLight: '#D1FAE5', // Light green for success backgrounds
    errorLight: '#FEE2E2', // Light red for error backgrounds
    infoLight: '#DBEAFE', // Light blue for info backgrounds
    primaryLight2: '#EDE9FE', // Light purple for primary backgrounds
    surfaceHover: '#F3F4F6', // Hover/pressed state background

    // Border variants
    borderLight: '#F3F4F6',
    borderMedium: '#E5E7EB',
    borderDark: '#D1D5DB',

    // Gray scale shortcut (for code using Colors.light.gray[N])
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
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    border: '#374151',
    card: '#1F2937',
    notification: '#FF453A',

    // Merchant app specific colors
    primary: '#8B5CF6', // Lighter purple for dark mode
    primaryLight: '#A78BFA', // Even lighter purple
    secondary: '#34D399', // Lighter green
    tertiary: '#818CF8', // Lighter indigo for dark mode
    warning: '#FBBF24', // Lighter amber
    danger: '#F87171', // Lighter red
    destructive: '#F87171', // Lighter red for destructive actions
    info: '#60A5FA', // Lighter blue

    // Background variants
    backgroundSecondary: '#1F2937',
    backgroundTertiary: '#374151',

    // Text variants
    textSecondary: '#D1D5DB',
    textMuted: '#9CA3AF',

    // Status colors
    success: '#34D399',
    error: '#F87171',
    pending: '#FBBF24',
    approved: '#34D399',
    rejected: '#F87171',

    // Brand / Accent
    navy: '#1a3a52',
    indigo: '#818CF8',
    purpleDark: '#8B5CF6',
    accent: '#A78BFA', // Light purple accent (dark mode)

    // Text heading variants
    textHeading: '#F9FAFB', // Near-white for headings (dark mode)
    textDark: '#E5E7EB', // Light gray for subheadings (dark mode)
    textTertiary: '#D1D5DB', // Medium-light gray for tertiary text (dark mode)

    // Background variants (extended)
    warningLight: '#78350F', // Dark amber for warning backgrounds
    successLight: '#064E3B', // Dark green for success backgrounds
    errorLight: '#7F1D1D', // Dark red for error backgrounds
    infoLight: '#1E3A5F', // Dark blue for info backgrounds
    primaryLight2: '#2E1065', // Dark purple for primary backgrounds
    surfaceHover: '#374151', // Hover/pressed state background (dark mode)

    // Border variants
    borderLight: '#374151',
    borderMedium: '#4B5563',
    borderDark: '#6B7280',
  },
};

export type ColorName = keyof typeof Colors.light;
