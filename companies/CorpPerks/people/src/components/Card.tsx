// ==========================================
// MyTalent - Card Component
// ==========================================

import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { Colors, BorderRadius, Spacing, Shadow } from '../utils/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
  children,
  style,
  onPress,
  variant = 'default',
  padding = 'md',
}: CardProps) {
  const cardStyles = [
    styles.card,
    variant === 'outlined' && styles.outlined,
    variant === 'elevated' && styles.elevated,
    padding === 'none' && styles.paddingNone,
    padding === 'sm' && styles.paddingSm,
    padding === 'lg' && styles.paddingLg,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyles} onPress={onPress} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyles}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadow.md,
  },
  outlined: {
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  elevated: {
    ...Shadow.lg,
  },
  paddingNone: {
    padding: 0,
  },
  paddingSm: {
    padding: Spacing.sm,
  },
  paddingLg: {
    padding: Spacing.lg,
  },
});
