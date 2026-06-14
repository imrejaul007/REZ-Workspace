import { withErrorBoundary } from '@/utils/withErrorBoundary';
// BillSimulator.tsx - Interactive "What will I actually pay?" card
import { colors } from '@/constants/theme';
import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius } from '@/constants/DesignSystem';

export interface BillSimulatorProps {
  cashbackPercent: number;
  coinsPercentEquiv?: number;
  activeOfferDiscount?: number;
  currencySymbol?: string;
}

const MIN_BILL = 100;
const MAX_BILL = 5000;
const STEP = 50;

function BillSimulator({
  cashbackPercent,
  coinsPercentEquiv = 2,
  activeOfferDiscount = 0,
  currencySymbol = '₹',
}: BillSimulatorProps) {
  const [billAmount, setBillAmount] = useState(500);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fadeAnim.setValue(0.4);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billAmount]);

  const clamp = (val: number) => Math.min(MAX_BILL, Math.max(MIN_BILL, val));

  const increment = () => setBillAmount((prev) => clamp(prev + STEP));
  const decrement = () => setBillAmount((prev) => clamp(prev - STEP));

  // Derived calculations
  const offerDiscountRupees =
    activeOfferDiscount > 0
      ? Math.round(activeOfferDiscount / 100) // paise to rupees
      : 0;
  const cashbackRupees = Math.round((cashbackPercent * billAmount) / 100);
  const coinsRupees = Math.round((coinsPercentEquiv * billAmount) / 100);
  const totalSaving = offerDiscountRupees + cashbackRupees + coinsRupees;
  const netCost = Math.max(0, billAmount - totalSaving);

  const fmt = (val: number) => `${currencySymbol}${val.toLocaleString('en-IN')}`;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Title row */}
        <View style={styles.titleRow}>
          <Ionicons name="calculator-outline" size={18} color="#16A34A" />
          <ThemedText style={styles.title}>Bill Simulator</ThemedText>
        </View>

        <ThemedText style={styles.subtitle}>What will I actually pay?</ThemedText>

        {/* Amount control */}
        <View style={styles.amountRow}>
          <TouchableOpacity
            style={styles.stepBtn}
            onPress={decrement}
            disabled={billAmount <= MIN_BILL}
            activeOpacity={0.7}
          >
            <Ionicons name="remove" size={18} color={billAmount <= MIN_BILL ? colors.midGray : colors.nileBlue} />
          </TouchableOpacity>

          <View style={styles.amountDisplay}>
            <ThemedText style={styles.amountText}>{fmt(billAmount)}</ThemedText>
          </View>

          <TouchableOpacity
            style={styles.stepBtn}
            onPress={increment}
            disabled={billAmount >= MAX_BILL}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={18} color={billAmount >= MAX_BILL ? colors.midGray : colors.nileBlue} />
          </TouchableOpacity>
        </View>

        <ThemedText style={styles.rangeHint}>
          {currencySymbol}
          {MIN_BILL} – {currencySymbol}
          {MAX_BILL.toLocaleString('en-IN')} · step {currencySymbol}
          {STEP}
        </ThemedText>

        {/* Breakdown */}
        <Animated.View style={[styles.breakdown, { opacity: fadeAnim }]}>
          {/* Bill amount row */}
          <View style={styles.row}>
            <ThemedText style={styles.rowLabel}>Bill Amount</ThemedText>
            <ThemedText style={styles.rowValue}>{fmt(billAmount)}</ThemedText>
          </View>

          {/* Offer discount — only if active */}
          {offerDiscountRupees > 0 && (
            <View style={styles.row}>
              <ThemedText style={styles.rowLabel}>Offer Discount</ThemedText>
              <ThemedText style={styles.rowDiscount}>-{fmt(offerDiscountRupees)}</ThemedText>
            </View>
          )}

          {/* Cashback */}
          <View style={styles.row}>
            <ThemedText style={styles.rowLabel}>Cashback ({cashbackPercent}%)</ThemedText>
            <ThemedText style={styles.rowDiscount}>-{fmt(cashbackRupees)}</ThemedText>
          </View>

          {/* Coins earned */}
          <View style={styles.row}>
            <ThemedText style={styles.rowLabel}>Coins Earned ({coinsPercentEquiv}%)</ThemedText>
            <ThemedText style={styles.rowDiscount}>-{fmt(coinsRupees)}</ThemedText>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Net cost */}
          <View style={styles.row}>
            <ThemedText style={styles.netLabel}>Net Cost</ThemedText>
            <ThemedText style={styles.netValue}>{fmt(netCost)}</ThemedText>
          </View>

          {/* You Save badge */}
          <View style={styles.savingRow}>
            <ThemedText style={styles.savingPrefix}>You Save</ThemedText>
            <View style={styles.savingBadge}>
              <ThemedText style={styles.savingBadgeText}>{fmt(totalSaving)}</ThemedText>
            </View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  card: {
    backgroundColor: 'rgba(74, 222, 128, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.2)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16A34A',
  },
  subtitle: {
    fontSize: 12,
    color: colors.midGray,
    marginBottom: Spacing.md,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  amountDisplay: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: BorderRadius.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.3)',
  },
  amountText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.nileBlue,
  },
  rangeHint: {
    fontSize: 11,
    color: colors.midGray,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  breakdown: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  rowLabel: {
    fontSize: 13,
    color: colors.darkGray,
  },
  rowValue: {
    fontSize: 13,
    color: colors.darkGray,
    fontWeight: '500',
  },
  rowDiscount: {
    fontSize: 13,
    color: '#16A34A',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(74, 222, 128, 0.25)',
    marginVertical: 4,
  },
  netLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.nileBlue,
  },
  netValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16A34A',
  },
  savingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  savingPrefix: {
    fontSize: 13,
    color: colors.darkGray,
    fontWeight: '500',
  },
  savingBadge: {
    backgroundColor: colors.lightMustard,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  savingBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.nileBlue,
  },
});

export default withErrorBoundary(BillSimulator, 'MainStoreSectionBillSimulator');
