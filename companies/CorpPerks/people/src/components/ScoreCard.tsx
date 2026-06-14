// ==========================================
// MyTalent - Score Card Component
// ==========================================

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing, FontSize, FontWeight } from '../utils/theme';
import { ProgressRing } from './ProgressRing';

interface ScoreCardProps {
  score: number;
  title: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  style?: ViewStyle;
}

export function ScoreCard({
  score,
  title,
  subtitle,
  size = 'md',
  color = Colors.primary,
  style,
}: ScoreCardProps) {
  const sizeConfig = {
    sm: { ringSize: 50, strokeWidth: 5, fontSize: FontSize.md },
    md: { ringSize: 70, strokeWidth: 6, fontSize: FontSize.lg },
    lg: { ringSize: 90, strokeWidth: 8, fontSize: FontSize.xl },
  };

  const config = sizeConfig[size];
  const scoreColor = score >= 80 ? Colors.success : score >= 60 ? Colors.warning : Colors.error;

  return (
    <View style={[styles.container, style]}>
      <ProgressRing
        progress={score}
        size={config.ringSize}
        strokeWidth={config.strokeWidth}
        color={color || scoreColor}
        showLabel={false}
      />
      <Text style={[styles.score, { fontSize: config.fontSize, color: scoreColor }]}>
        {score}
      </Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: Spacing.md,
  },
  score: {
    position: 'absolute',
    top: Spacing.md + 10,
    fontWeight: FontWeight.bold,
  },
  title: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});
