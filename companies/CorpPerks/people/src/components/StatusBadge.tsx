// ==========================================
// MyTalent - Status Badge Component
// ==========================================

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing, FontSize } from '../utils/theme';
import { getStatusColor } from '../utils/theme';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function StatusBadge({ status, size = 'md', style }: StatusBadgeProps) {
  const color = getStatusColor(status);
  const displayStatus = status
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: `${color}20` },
        size === 'sm' && styles.containerSm,
        style,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }, size === 'sm' && styles.textSm]}>
        {displayStatus}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  containerSm: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: Spacing.xs,
  },
  text: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  textSm: {
    fontSize: 10,
  },
});
