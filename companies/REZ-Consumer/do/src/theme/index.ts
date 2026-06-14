// Do App Theme System
// Premium Apple-style design

export const lightColors = {
  // Backgrounds
  background: '#FFFFFF',
  backgroundSecondary: '#F2F2F7',
  backgroundTertiary: '#FFFFFF',
  backgroundGrouped: '#F2F2F7',
  backgroundGroupedSecondary: '#FFFFFF',
  backgroundElevated: '#FFFFFF',

  // Fill
  fill: 'rgba(120, 120, 128, 0.2)',
  fillSecondary: 'rgba(120, 120, 128, 0.16)',
  fillTertiary: 'rgba(120, 120, 128, 0.12)',
  fillQuaternary: 'rgba(120, 120, 128, 0.08)',

  // Label
  label: '#000000',
  labelSecondary: 'rgba(60, 60, 67, 0.6)',
  labelTertiary: 'rgba(60, 60, 67, 0.3)',
  labelQuaternary: 'rgba(60, 60, 67, 0.18)',

  // Separator
  separator: 'rgba(60, 60, 67, 0.29)',
  separatorOpaque: '#C6C6C8',

  // System
  systemBlue: '#007AFF',
  systemGreen: '#34C759',
  systemIndigo: '#5856D6',
  systemOrange: '#FF9500',
  systemPink: '#FF2D55',
  systemPurple: '#AF52DE',
  systemRed: '#FF3B30',
  systemTeal: '#5AC8FA',
  systemYellow: '#FFCC00',
  systemMint: '#00C7BE',

  // Gray
  gray: '#8E8E93',
  gray2: '#AEAEB2',
  gray3: '#C7C7CC',
  gray4: '#D1D1D6',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',

  // Do Brand
  primary: '#7C3AED',
  primaryLight: '#A78BFA',
  primaryDark: '#5B21B6',
  primaryContrast: '#FFFFFF',

  accent: '#F97316',
  accentLight: '#FB923C',
  accentContrast: '#FFFFFF',

  gold: '#FBBF24',
  goldLight: '#FCD34D',
  goldDark: '#D97706',

  // Karma Tiers
  karmaBronze: '#CD7F32',
  karmaSilver: '#C0C0C0',
  karmaGold: '#FBBF24',
  karmaPlatinum: '#E5E4E2',

  // Utility
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const darkColors: typeof lightColors = {
  // Backgrounds
  background: '#000000',
  backgroundSecondary: '#1C1C1E',
  backgroundTertiary: '#2C2C2E',
  backgroundGrouped: '#000000',
  backgroundGroupedSecondary: '#1C1C1E',
  backgroundElevated: '#1C1C1E',

  // Fill
  fill: 'rgba(120, 120, 128, 0.36)',
  fillSecondary: 'rgba(120, 120, 128, 0.32)',
  fillTertiary: 'rgba(120, 120, 128, 0.24)',
  fillQuaternary: 'rgba(120, 120, 128, 0.18)',

  // Label
  label: '#FFFFFF',
  labelSecondary: 'rgba(235, 235, 245, 0.6)',
  labelTertiary: 'rgba(235, 235, 245, 0.3)',
  labelQuaternary: 'rgba(235, 235, 245, 0.18)',

  // Separator
  separator: 'rgba(84, 84, 88, 0.65)',
  separatorOpaque: '#38383A',

  // System
  systemBlue: '#0A84FF',
  systemGreen: '#30D158',
  systemIndigo: '#5E5CE6',
  systemOrange: '#FF9F0A',
  systemPink: '#FF375F',
  systemPurple: '#BF5AF2',
  systemRed: '#FF453A',
  systemTeal: '#64D2FF',
  systemYellow: '#FFD60A',
  systemMint: '#63E6E2',

  // Gray
  gray: '#8E8E93',
  gray2: '#636366',
  gray3: '#48484A',
  gray4: '#3A3A3C',
  gray5: '#2C2C2E',
  gray6: '#1C1C1E',

  // Do Brand (same in dark)
  primary: '#A78BFA',
  primaryLight: '#C4B5FD',
  primaryDark: '#7C3AED',
  primaryContrast: '#000000',

  accent: '#FB923C',
  accentLight: '#FDBA74',
  accentContrast: '#000000',

  gold: '#FCD34D',
  goldLight: '#FDE68A',
  goldDark: '#FBBF24',

  // Karma Tiers (same)
  karmaBronze: '#CD7F32',
  karmaSilver: '#C0C0C0',
  karmaGold: '#FBBF24',
  karmaPlatinum: '#E5E4E2',

  // Utility
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export type Colors = typeof lightColors;

export const typography = {
  displayLarge: {
    fontSize: 34,
    fontWeight: '700' as const,
    lineHeight: 41,
    letterSpacing: 0.37,
  },
  displayMedium: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
    letterSpacing: 0.36,
  },
  displaySmall: {
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28,
    letterSpacing: 0.35,
  },
  titleLarge: {
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28,
    letterSpacing: 0.35,
  },
  titleMedium: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 25,
    letterSpacing: 0.38,
  },
  titleSmall: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 22,
    letterSpacing: 0.38,
  },
  bodyLarge: {
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 22,
    letterSpacing: -0.41,
  },
  bodyMedium: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: -0.24,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
    letterSpacing: -0.08,
  },
  captionLarge: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0,
  },
  captionMedium: {
    fontSize: 11,
    fontWeight: '500' as const,
    lineHeight: 13,
    letterSpacing: 0.07,
  },
  captionSmall: {
    fontSize: 10,
    fontWeight: '500' as const,
    lineHeight: 13,
    letterSpacing: 0.1,
  },
  buttonLarge: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 22,
    letterSpacing: -0.41,
  },
  buttonMedium: {
    fontSize: 15,
    fontWeight: '600' as const,
    lineHeight: 20,
    letterSpacing: -0.24,
  },
  buttonSmall: {
    fontSize: 13,
    fontWeight: '600' as const,
    lineHeight: 18,
    letterSpacing: -0.08,
  },
};

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  screenPadding: 16,
  cardPadding: 16,
  sectionSpacing: 24,
  listItemHeight: 44,
  buttonHeight: 50,
  tabBarHeight: 83,
  headerHeight: 44,
};

export const borderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  full: 9999,
  button: 12,
  card: 16,
  modal: 20,
  sheet: 28,
  input: 10,
};

export const shadows = {
  none: {},
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
};

export const timing = {
  instant: 0,
  fast: 100,
  normal: 200,
  slow: 300,
  enter: 350,
  exit: 250,
  pulse: 1000,
  bounce: 600,
  confetti: 2000,
};

export const springs = {
  default: { damping: 20, stiffness: 300, mass: 1 },
  bouncy: { damping: 12, stiffness: 200, mass: 0.8 },
  gentle: { damping: 30, stiffness: 400, mass: 1 },
  snappy: { damping: 25, stiffness: 500, mass: 0.6 },
};
