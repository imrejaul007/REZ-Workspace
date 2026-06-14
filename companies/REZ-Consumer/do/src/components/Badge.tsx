import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'gold' | 'primary';
  size?: 'small' | 'medium';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'medium',
  style,
}) => {
  const { colors, borderRadius, typography } = useTheme();

  const getBackgroundColor = () => {
    switch (variant) {
      case 'success':
        return colors.systemGreen;
      case 'warning':
        return colors.systemOrange;
      case 'error':
        return colors.systemRed;
      case 'gold':
        return colors.gold;
      case 'primary':
        return colors.primary;
      default:
        return colors.fill;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'success':
      case 'warning':
      case 'error':
      case 'gold':
      case 'primary':
        return colors.white;
      default:
        return colors.labelSecondary;
    }
  };

  const getPadding = () => {
    return size === 'small' ? 4 : 6;
  };

  const getFontSize = () => {
    return size === 'small'
      ? typography.captionSmall.fontSize
      : typography.captionMedium.fontSize;
  };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: getBackgroundColor(),
          paddingHorizontal: getPadding(),
          paddingVertical: getPadding() / 2,
          borderRadius: borderRadius.sm,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: getTextColor(),
            fontSize: getFontSize(),
            fontWeight: '600',
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
  },
  text: {
    textAlign: 'center',
  },
});
