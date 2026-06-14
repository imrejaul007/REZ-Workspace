/**
 * TransactionItem Component
 * Individual transaction row for wallet screen
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/constants/theme';

interface TransactionItemProps {
  id: string;
  title: string;
  subtitle?: string;
  amount: number;
  type: 'credit' | 'debit';
  icon?: string;
  timestamp: string;
  onPress?: () => void;
}

export default function TransactionItem({
  title,
  subtitle,
  amount,
  type,
  icon = type === 'credit' ? 'arrow-down' : 'arrow-up',
  timestamp,
  onPress,
}: TransactionItemProps) {
  const formattedAmount = `${type === 'credit' ? '+' : '-'}${Math.abs(amount).toLocaleString()}`;

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={[styles.iconWrapper, type === 'credit' ? styles.creditBg : styles.debitBg]}>
        <Ionicons
          name={icon as unknown}
          size={20}
          color={type === 'credit' ? '#22C55E' : '#EF4444'}
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
        )}
      </View>

      <View style={styles.amountContainer}>
        <Text style={[styles.amount, type === 'credit' ? styles.creditAmount : styles.debitAmount]}>
          {formattedAmount}
        </Text>
        <Text style={styles.timestamp}>{timestamp}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditBg: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  debitBg: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  content: {
    flex: 1,
    marginLeft: spacing.md,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
  },
  creditAmount: {
    color: '#22C55E',
  },
  debitAmount: {
    color: '#EF4444',
  },
  timestamp: {
    fontSize: 11,
    color: colors.text.tertiary,
    marginTop: 2,
  },
});
