// ==========================================
// MyTalent - Progress Bar Component
// ==========================================

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing, FontSize } from '../utils/theme';

interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  color?: string;
  backgroundColor?: string;
  showLabel?: boolean;
  label?: string;
  style?: ViewStyle;
}

export function ProgressBar({
  progress,
  height = 8,
  color = Colors.primary,
  backgroundColor = Colors.borderLight,
  showLabel = false,
  label,
  style,
}: ProgressBarProps) {
  return (
    <View style={style}>
      {(showLabel || label) && (
        <View style={styles.labelContainer}>
          {label && <Text style={styles.label}>{label}</Text>}
          {showLabel && <Text style={styles.percentage}>{Math.round(progress)}%</Text>}
        </View>
      )}
      <View style={[styles.container, { height, backgroundColor }]}>
        <View
          style={[
            styles.progress,
            {
              width: `${Math.min(100, Math.max(0, progress))}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  percentage: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});
