// ==========================================
// MyTalent - Balance Card Component
// ==========================================

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing, FontSize, FontWeight } from '../utils/theme';

interface BalanceCardProps {
  balance: number;
  label: string;
  icon?: string;
  color?: string;
  style?: ViewStyle;
}

export function BalanceCard({
  balance,
  label,
  icon,
  color = Colors.primary,
  style,
}: BalanceCardProps) {
  return (
    <View style={[styles.container, style]}>
      {icon && (
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
      )}
      <Text style={[styles.balance, { color }]}>{balance}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    minWidth: 80,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  icon: {
    fontSize: 16,
  },
  balance: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
  },
  label: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});
