/**
 * WalletQuickActions Component
 * Quick action buttons for wallet screen
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/constants/theme';

interface QuickAction {
  id: string;
  icon: string;
  label: string;
  onPress: () => void;
}

interface WalletQuickActionsProps {
  actions: QuickAction[];
}

export default function WalletQuickActions({ actions }: WalletQuickActionsProps) {
  return (
    <View style={styles.container}>
      {actions.map((action) => (
        <Pressable
          key={action.id}
          style={styles.actionBtn}
          onPress={action.onPress}
        >
          <View style={styles.iconWrapper}>
            <Ionicons
              name={action.icon as unknown}
              size={24}
              color={colors.primary[500] ?? '#FF6B35'}
            />
          </View>
          <Text style={styles.label}>{action.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.primary,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionBtn: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background.secondary ?? '#FFF5F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
