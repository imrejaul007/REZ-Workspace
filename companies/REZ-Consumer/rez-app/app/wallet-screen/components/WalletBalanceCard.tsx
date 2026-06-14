/**
 * WalletBalanceCard Component
 * Main balance display card for wallet screen
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/constants/theme';

interface WalletBalanceCardProps {
  balance: number;
  currency: string;
  walletType: 'main' | 'mall' | 'prive';
  onRechargePress?: () => void;
}

export default function WalletBalanceCard({
  balance,
  currency,
  walletType,
  onRechargePress
}: WalletBalanceCardProps) {
  const gradients = {
    main: ['#FF6B35', '#FF9F1C'],
    mall: ['#667eea', '#764ba2'],
    prive: ['#f093fb', '#f5576c'],
  };

  const titles = {
    main: 'REZ Wallet',
    mall: 'Mall Wallet',
    prive: 'Privé Balance',
  };

  return (
    <LinearGradient
      colors={gradients[walletType]}
      style={styles.card}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{titles[walletType]}</Text>
        <Pressable style={styles.refreshBtn}>
          <Ionicons name="refresh" size={20} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.balanceRow}>
        <Text style={styles.currency}>{currency}</Text>
        <Text style={styles.balance}>{balance.toLocaleString()}</Text>
      </View>

      <Pressable style={styles.rechargeBtn} onPress={onRechargePress}>
        <Ionicons name="add" size={18} color="#FF6B35" />
        <Text style={styles.rechargeText}>Recharge</Text>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  refreshBtn: {
    padding: spacing.xs,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  currency: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginRight: spacing.xs,
  },
  balance: {
    fontSize: 40,
    fontWeight: '700',
    color: '#fff',
  },
  rechargeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  rechargeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF6B35',
  },
});
