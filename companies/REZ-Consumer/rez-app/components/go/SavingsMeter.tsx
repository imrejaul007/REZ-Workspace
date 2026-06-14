import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SavingsMeterProps {
  saved: number;
  cashback: number;
  compact?: boolean;
}

export function SavingsMeter({ saved, cashback, compact = false }: SavingsMeterProps) {
  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Text style={styles.compactIcon}>💰</Text>
        <Text style={styles.compactText}>
          Saved ₹{saved.toFixed(0)}
        </Text>
        {cashback > 0 && (
          <Text style={styles.compactCashback}>
            +₹{cashback.toFixed(0)} cashback
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>💰</Text>
        <Text style={styles.headerText}>Your Savings</Text>
      </View>

      <View style={styles.amountContainer}>
        <Text style={styles.amount}>₹{saved.toFixed(0)}</Text>
        <Text style={styles.amountLabel}>saved today</Text>
      </View>

      {cashback > 0 && (
        <View style={styles.cashbackContainer}>
          <View style={styles.cashbackBadge}>
            <Text style={styles.cashbackIcon}>⚡</Text>
            <Text style={styles.cashbackText}>
              +₹{cashback.toFixed(0)} cashback earned
            </Text>
          </View>
        </View>
      )}

      <View style={styles.breakdown}>
        <Text style={styles.breakdownText}>
          Smart Savings + Fast Checkout powered by REZ Go
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  compactIcon: {
    fontSize: 16,
  },
  compactText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  compactCashback: {
    fontSize: 12,
    color: '#B45309',
  },
  container: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FCD34D',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  amount: {
    fontSize: 48,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: -2,
  },
  amountLabel: {
    fontSize: 16,
    color: '#B45309',
  },
  cashbackContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  cashbackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDE68A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  cashbackIcon: {
    fontSize: 16,
  },
  cashbackText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  breakdown: {
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#FCD34D',
    paddingTop: 12,
  },
  breakdownText: {
    fontSize: 12,
    color: '#B45309',
  },
});
