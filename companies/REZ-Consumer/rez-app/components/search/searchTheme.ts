import { colors } from '@/constants/theme';

// ============================================
// REZ DESIGN SYSTEM - Premium Color Palette
// ============================================
export const REZ_THEME = {
  // Primary Colors
  nileBlue: colors.nileBlue,
  lightMustard: colors.gold,
  linen: colors.linen,
  lightPeach: colors.lightPeach,
  lavenderMist: colors.lavenderMist,

  // Derived Shades
  nileBlueLight: '#243f55',
  nileBlueDark: '#0f2637',
  mustardDark: '#e5b84d',
  mustardLight: '#ffe082',
  peachDark: colors.brand.sand,
  peachLight: '#ffe4d1',
  lavenderDark: '#c5d9ed',

  // Semantic Colors
  text: {
    primary: colors.nileBlue,
    secondary: '#4a6580',
    muted: '#8aa3b8',
    inverse: colors.background.primary,
  },

  // Glass Effects
  glass: {
    white: 'rgba(255, 255, 255, 0.85)',
    whiteBorder: 'rgba(255, 255, 255, 0.5)',
    mustard: 'rgba(255, 205, 87, 0.12)',
    mustardBorder: 'rgba(255, 205, 87, 0.3)',
    peach: 'rgba(255, 215, 181, 0.15)',
    peachBorder: 'rgba(255, 215, 181, 0.4)',
  },
};

// Legacy COLORS for compatibility
export const COLORS = {
  primary: REZ_THEME.lightMustard,
  primaryDark: REZ_THEME.nileBlue,
  gold: REZ_THEME.lightMustard,
  navy: REZ_THEME.nileBlue,
  slate: REZ_THEME.nileBlue,
  muted: REZ_THEME.text.muted,
  surface: REZ_THEME.linen,
  error: REZ_THEME.nileBlue,
  warning: REZ_THEME.lightMustard,
  glassWhite: REZ_THEME.glass.white,
  glassBorder: REZ_THEME.glass.whiteBorder,
  glassHighlight: 'rgba(255, 255, 255, 0.6)',
};
