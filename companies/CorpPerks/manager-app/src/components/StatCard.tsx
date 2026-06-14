// ==========================================
// CorpPerks Manager App - StatCard Component
// ==========================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '../utils/theme';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  trend?: number;
  color?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = Colors.primary,
  onPress,
  style,
}) => {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <View style={styles.footer}>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {trend !== undefined && (
          <View
            style={[
              styles.trendBadge,
              { backgroundColor: trend >= 0 ? `${Colors.success}20` : `${Colors.error}20` },
            ]}
          >
            <Text
              style={[
                styles.trendText,
                { color: trend >= 0 ? Colors.success : Colors.error },
              ]}
            >
              {trend >= 0 ? '+' : ''}{trend}%
            </Text>
          </View>
        )}
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
    minWidth: 140,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  icon: {
    fontSize: 18,
    marginRight: Spacing.xs,
  },
  title: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  value: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    flex: 1,
  },
  trendBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  trendText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
});

export default StatCard;
