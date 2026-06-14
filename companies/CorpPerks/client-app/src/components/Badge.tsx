// ==========================================
// CorpPerks Client App - Badge Component
// ==========================================

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize, getStatusColor } from '../utils/theme';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'status';
  size?: 'sm' | 'md';
  style?: ViewStyle;
  textStyle?: ViewStyle;
}

export function Badge({
  label,
  variant = 'default',
  size = 'md',
  style,
  textStyle,
}: BadgeProps) {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'success':
        return Colors.success + '20';
      case 'warning':
        return Colors.warning + '20';
      case 'error':
        return Colors.error + '20';
      case 'info':
        return Colors.info + '20';
      case 'status':
        return getStatusColor(label) + '20';
      default:
        return Colors.primary + '20';
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'success':
        return Colors.success;
      case 'warning':
        return Colors.warning;
      case 'error':
        return Colors.error;
      case 'info':
        return Colors.info;
      case 'status':
        return getStatusColor(label);
      default:
        return Colors.primary;
    }
  };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: getBackgroundColor(),
          paddingVertical: size === 'sm' ? 2 : Spacing.xs,
          paddingHorizontal: size === 'sm' ? Spacing.sm : Spacing.md,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: getTextColor(),
            fontSize: size === 'sm' ? FontSize.xs : FontSize.sm,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
