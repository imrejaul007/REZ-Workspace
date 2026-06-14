// Canonical color source: @/constants/theme — import from there
/**
 * Design System - LEGACY SHIM
 *
 * Re-exports from theme.ts for backward compatibility.
 * New code should import from '@/constants/theme' directly.
 */

import {
  colors as themeColors,
  gradients as Gradients,
  spacing as Spacing,
  borderRadius as BorderRadius,
  shadows as Shadows,
  typography as baseTypography,
  timing as Timing,
  iconSize as IconSize,
  opacity as Opacity,
  zIndex as ZIndex,
  glass as Glass,
  buttonHeight as ButtonHeight,
  hitSlop as HitSlop,
  getSpacing,
  getDisabledOpacity,
  getShadow,
  getPurpleShadow,
  getTextColor,
  getGradient,
  theme,
} from './theme';

// Old DesignSystem had flat string semantic colors (e.g. Colors.success = '#2ECC71')
// which are used with string concat for alpha: Colors.success + '30' -> '#2ECC7130'
// theme.ts has these as objects with scales. Reconstruct the old shape here.
export const Colors = {
  ...themeColors,
  // Override semantic colors with flat strings (matching old DesignSystem)
  success: '#2ECC71',
  error: '#E74C3C',
  warning: '#FF9F1C',
  info: '#1a3a52',
  gold: '#ffcd57',
  // Flat string aliases for commonly used nested color values
  text: '#1a3a52',
  textSecondary: '#2A5577',
  textPrimary: '#1a3a52', // Alias for text
  white: '#FFFFFF',
  primary: '#ffcd57',
  primaryDark: '#E6B84E',
  primaryLight: '#FFF9E6', // Lightest shade of primary
  surfaceLight: '#faf1e0',
  // Missing color aliases used throughout codebase
  surface: '#FFFFFF', // Default surface/card background
  background: '#faf1e0', // Default background (linen)
  coin: '#ffcd57', // Coin/gold color alias
  subtitle: '#2A5577', // Subtitle text color
  // Border color aliases for backward compatibility
  border: '#E8DCC4', // Default border color
  borderLight: '#faf1e0',
  borderMedium: '#E8DCC4',
  borderDark: '#D4C9B0',
  // Error color scale aliases for backward compatibility
  errorLight: '#FEE2E2',
  errorMain: '#EF4444',
  // Warning color scale aliases
  warningLight: '#FFF3CC',
  warningMain: '#FF9F1C',
  // Success color scale aliases
  successLight: '#DCFCE7',
  successMain: '#2ECC71',
} as const;

// Typography with legacy naming aliases used in campaign and game screens.
// theme.ts uses h1/h2/h3/bodyLarge/body/bodySmall; older code uses heading2/heading3/body1/body2.
export const Typography = {
  ...baseTypography,
  // Legacy aliases
  heading1: baseTypography.h1,
  heading2: baseTypography.h2,
  heading3: baseTypography.h3,
  heading4: baseTypography.h4,
  body1: baseTypography.bodyLarge,
  body2: baseTypography.body,
} as const;

export {
  Gradients,
  Spacing,
  BorderRadius,
  Shadows,
  Timing,
  IconSize,
  Opacity,
  ZIndex,
  Glass,
  ButtonHeight,
  HitSlop,
  getSpacing,
  getDisabledOpacity,
  getShadow,
  getPurpleShadow,
  getTextColor,
  getGradient,
};

export default theme;
