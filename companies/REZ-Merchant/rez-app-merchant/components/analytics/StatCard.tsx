/**
 * StatCard Component
 * Reusable metric card with icon, value, label, and growth indicator
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  growth?: number;
  subtitle?: string;
  onPress?: () => void;
  compact?: boolean;
  style?: ViewStyle;
}

export function StatCard({
  title,
  value,
  icon,
  color = Colors.light.primary,
  growth,
  subtitle,
  onPress,
  compact = false,
  style,
}: StatCardProps) {
  const getGrowthColor = (growthValue: number) => {
    if (growthValue > 0) return Colors.light.success;
    if (growthValue < 0) return Colors.light.error;
    return Colors.light.textSecondary;
  };

  const formatGrowth = (growthValue: number) => {
    const sign = growthValue > 0 ? '+' : '';
    return `${sign}${growthValue.toFixed(1)}%`;
  };

  const content = (
    <View style={[styles.container, compact && styles.compactContainer, style]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
          <Ionicons name={icon} size={compact ? 18 : 22} color={color} />
        </View>
        {growth !== undefined && (
          <View style={[styles.growthBadge, { backgroundColor: `${getGrowthColor(growth)}15` }]}>
            <Ionicons
              name={growth > 0 ? 'trending-up' : growth < 0 ? 'trending-down' : 'remove'}
              size={12}
              color={getGrowthColor(growth)}
            />
            <ThemedText style={[styles.growthText, { color: getGrowthColor(growth) }]}>
              {formatGrowth(growth)}
            </ThemedText>
          </View>
        )}
      </View>

      <ThemedText style={[styles.value, compact && styles.compactValue]} numberOfLines={1}>
        {value}
      </ThemedText>

      <ThemedText style={[styles.title, compact && styles.compactTitle]} numberOfLines={1}>
        {title}
      </ThemedText>

      {subtitle && (
        <ThemedText style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </ThemedText>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    minWidth: 140,
  },
  compactContainer: {
    padding: 12,
    minWidth: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  growthText: {
    fontSize: 11,
    fontWeight: '600',
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  compactValue: {
    fontSize: 20,
  },
  title: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  compactTitle: {
    fontSize: 11,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
});

export default StatCard;
