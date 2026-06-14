/**
 * HomeSavingsSummaryCard — Home page savings anchor card.
 *
 * Design: clean white card, navy text, mustard accent only.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius, colors, spacing } from '@/constants/theme';
import { useUserIdentityStore, IdentitySegment, UserIdentityState } from '@/stores/userIdentityStore';

const NAVY    = '#1a3a52';
const MUSTARD = '#FFC857';
const BORDER  = '#E2E8F0';
const BODY    = '#475569';
const MUTED   = '#94A3B8';
const LIGHT   = '#F8F9FA';

const SEGMENT_SAVINGS_LABEL: Partial<Record<IdentitySegment, string>> = {
  verified_student: 'Student savings this month',
  verified_employee: 'Work perks saved this month',
  verified_healthcare: 'Health benefits this month',
  verified_defence: 'Defence savings this month',
  verified_teacher: 'Teacher benefits this month',
  verified_senior: 'Senior savings this month',
  verified_government: 'Govt benefits this month',
  verified_differentlyAbled: 'Your savings this month',
};

const SEGMENT_EMPTY_SUBTITLE: Partial<Record<IdentitySegment, string>> = {
  verified_student: 'Earn cashback at campus stores and student-friendly shops.',
  verified_employee: 'Save on meals, wellness & commute through work perks.',
  verified_healthcare: 'Save on pharmacy, wellness & medical essentials.',
  verified_defence: 'Unlock exclusive savings for service members.',
  verified_teacher: 'Earn cashback on books, stationery & educational tools.',
  verified_senior: 'Special savings on health, grocery & daily essentials.',
};

interface HomeSavingsSummaryCardProps {
  totalSaved: number;
  thisMonthSaved: number;
  nearbyStoreCount?: number;
  unlockAmount?: number;
  currencySymbol: string;
  onPress: () => void;
}

const HomeSavingsSummaryCard: React.FC<HomeSavingsSummaryCardProps> = ({
  totalSaved,
  thisMonthSaved,
  nearbyStoreCount,
  unlockAmount,
  currencySymbol,
  onPress,
}) => {
  const segment: IdentitySegment = (useUserIdentityStore.getState() as UserIdentityState).segment;
  const savingsLabel = SEGMENT_SAVINGS_LABEL[segment] ?? 'You saved this month';
  const isEmptyState = thisMonthSaved === 0 && totalSaved === 0;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.wrapper, pressed ? styles.pressed : null]}>
      {isEmptyState ? (
        /* Empty / first-time state */
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="wallet-outline" size={28} color={MUSTARD} />
          </View>
          <Text style={styles.emptyTitle}>Start saving today!</Text>
          <Text style={styles.emptySubtitle}>
            {SEGMENT_EMPTY_SUBTITLE[segment] ?? 'Shop at nearby stores and earn cashback on every purchase.'}
          </Text>
        </View>
      ) : (
        /* Savings state */
        <View style={styles.savingsContent}>
          <View style={styles.savingsLeft}>
            <Text style={styles.label}>{savingsLabel}</Text>
            <Text style={styles.amount}>
              {currencySymbol}{(thisMonthSaved ?? 0).toLocaleString()}
            </Text>
            {unlockAmount != null && unlockAmount > 0 && (
              <View style={styles.unlockRow}>
                <Text style={styles.unlockText}>
                  Unlock {currencySymbol}{unlockAmount.toLocaleString()} more
                  {nearbyStoreCount ? ` at ${nearbyStoreCount} stores` : ''} →
                </Text>
              </View>
            )}
          </View>
          <View style={styles.arrowBox}>
            <Ionicons name="chevron-forward" size={18} color={NAVY} />
          </View>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  pressed: {
    opacity: 0.95,
  },

  // Savings state
  savingsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  savingsLeft: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: MUTED,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  amount: {
    fontSize: 32,
    fontWeight: '800',
    color: NAVY,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  unlockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: MUSTARD,
  },
  unlockText: {
    fontSize: 11,
    color: NAVY,
    fontWeight: '600',
  },
  arrowBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFBEB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: NAVY,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: BODY,
    textAlign: 'center',
    lineHeight: 19,
  },
});

export default React.memo(HomeSavingsSummaryCard);
