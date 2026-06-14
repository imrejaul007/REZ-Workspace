// ==========================================
// CorpPerks Client App - StatCard Component
// ==========================================

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize, Shadow } from '../utils/theme';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  color?: string;
  trend?: {
    value: number;
    label?: string;
  };
  style?: ViewStyle;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  color = Colors.primary,
  trend,
  style,
}: StatCardProps) {
  const getTrendColor = () => {
    if (!trend) return undefined;
    if (trend.value > 0) return Colors.success;
    if (trend.value < 0) return Colors.error;
    return Colors.textMuted;
  };

  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Text style={[styles.icon, { color }]}>{icon || 'info'}</Text>
        </View>
        {trend && (
          <View style={[styles.trendBadge, { backgroundColor: getTrendColor() + '20' }]}>
            <Text style={[styles.trendText, { color: getTrendColor() }]}>
              {trend.value > 0 ? '+' : ''}
              {trend.value}%
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 18,
  },
  trendBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  trendText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  value: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  title: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  subtitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
