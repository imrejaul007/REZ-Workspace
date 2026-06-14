import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, Colors, typography, spacing, borderRadius, shadows, timing, springs } from './index';

interface Theme {
  colors: Colors;
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
  timing: typeof timing;
  springs: typeof springs;
  isDark: boolean;
}

const ThemeContext = createContext<Theme | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const theme = useMemo<Theme>(() => ({
    colors: isDark ? darkColors : lightColors,
    typography,
    spacing,
    borderRadius,
    shadows,
    timing,
    springs,
    isDark,
  }), [isDark]);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): Theme => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Convenience hooks
export const useColors = () => useTheme().colors;
export const useTypography = () => useTheme().typography;
export const useSpacing = () => useTheme().spacing;
