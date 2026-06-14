import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../constants/config';
import { LeaveBalance } from '../types';

interface LeaveBalanceCardProps {
  balances: LeaveBalance;
}

interface BalanceItemProps {
  label: string;
  value: number;
  color: string;
  icon: string;
}

const BalanceItem: React.FC<BalanceItemProps> = ({ label, value, color, icon }) => (
  <View style={styles.balanceItem}>
    <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
      <Text style={styles.icon}>{icon}</Text>
    </View>
    <View style={styles.balanceInfo}>
      <Text style={styles.balanceValue}>{value}</Text>
      <Text style={styles.balanceLabel}>{label}</Text>
    </View>
  </View>
);

export const LeaveBalanceCard: React.FC<LeaveBalanceCardProps> = ({ balances }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Leave Balance</Text>
      <View style={styles.balancesGrid}>
        <BalanceItem label="Annual" value={balances.annual} color={COLORS.primary} icon="🌴" />
        <BalanceItem label="Sick" value={balances.sick} color={COLORS.secondary} icon="🏥" />
        <BalanceItem label="Casual" value={balances.casual} color={COLORS.accent} icon="🌤️" />
        <BalanceItem label="Unpaid" value={balances.unpaid} color={COLORS.error} icon="📝" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  balancesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.xs,
  },
  balanceItem: {
    width: '50%',
    padding: SPACING.xs,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  icon: {
    fontSize: 20,
  },
  balanceInfo: {},
  balanceValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
  },
  balanceLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});

export default LeaveBalanceCard;
