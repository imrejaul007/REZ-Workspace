import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  padding = 'medium',
}) => {
  const { colors, borderRadius, shadows, spacing } = useTheme();

  const getPadding = () => {
    switch (padding) {
      case 'none':
        return 0;
      case 'small':
        return spacing.sm;
      case 'medium':
        return spacing.md;
      case 'large':
        return spacing.lg;
      default:
        return spacing.md;
    }
  };

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          ...shadows.md,
          backgroundColor: colors.backgroundElevated,
        };
      case 'outlined':
        return {
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: colors.separator,
        };
      case 'filled':
        return {
          backgroundColor: colors.fill,
        };
      default:
        return {
          backgroundColor: colors.background,
          ...shadows.sm,
        };
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          padding: getPadding(),
          borderRadius: borderRadius.card,
        },
        getVariantStyles(),
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
});
