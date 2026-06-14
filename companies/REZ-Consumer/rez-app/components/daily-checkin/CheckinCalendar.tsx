/**
 * CheckinCalendar — weekly check-in calendar grid
 *
 * Renders the 6-day calendar grid plus the bonus day row,
 * with claimed/today state styling.
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import { BRAND } from '@/constants/brand';
import type { CheckInReward } from './types';

const { width } = Dimensions.get('window');

interface CheckinCalendarProps {
  checkInRewards: CheckInReward[];
  calendarError: string | null;
  currencySymbol: string;
  onRetry: () => void;
}

export const CheckinCalendar = React.memo(function CheckinCalendar({
  checkInRewards,
  calendarError,
  currencySymbol,
  onRetry,
}: CheckinCalendarProps) {
  if (calendarError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={32} color={Colors.error} />
        <Text style={styles.errorText}>{calendarError}</Text>
        <Pressable style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (checkInRewards.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="calendar-outline" size={32} color={colors.text.tertiary} />
        <Text style={styles.emptyText}>No check-in data available</Text>
      </View>
    );
  }

  const regularDays = checkInRewards.filter((r) => !r.bonus);
  const bonusDays = checkInRewards.filter((r) => r.bonus);

  return (
    <>
      <View style={styles.calendarGrid}>
        {regularDays.map((reward) => (
          <View
            key={reward.day}
            style={[
              styles.calendarDay,
              reward.claimed && styles.calendarDayClaimed,
              reward.today && !reward.claimed && styles.calendarDayToday,
            ]}
          >
            <Text style={styles.calendarDayLabel}>Day {reward.day}</Text>
            <View style={styles.calendarCoinContainer}>
              <CachedImage source={BRAND.COIN_IMAGE} style={{ width: 12, height: 12 }} contentFit="contain" />
              <Text
                style={[
                  styles.calendarCoinText,
                  reward.claimed && { color: Colors.gold },
                  reward.today && !reward.claimed && { color: Colors.info },
                ]}
              >
                {currencySymbol}
                {reward.coins}
              </Text>
            </View>
            {reward.claimed && <Ionicons name="checkmark-circle" size={16} color={Colors.gold} />}
          </View>
        ))}
      </View>

      {bonusDays.map((reward) => (
        <View key={reward.day} style={[styles.bonusDay, reward.claimed ? styles.bonusDayClaimed : null]}>
          <Text style={styles.calendarDayLabel}>Day {reward.day}</Text>
          <View style={styles.calendarCoinContainer}>
            <CachedImage source={BRAND.COIN_IMAGE} style={{ width: 14, height: 14 }} contentFit="contain" />
            <Text style={styles.bonusCoinText}>
              {currencySymbol}
              {reward.coins}
            </Text>
          </View>
          <Text style={styles.bonusLabel}>BONUS!</Text>
        </View>
      ))}
    </>
  );
});

const styles = StyleSheet.create({
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  calendarDay: {
    width: (width - 32 - 48) / 6,
    aspectRatio: 1,
    borderRadius: BorderRadius.lg,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xs,
  },
  calendarDayClaimed: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: Colors.gold,
    borderWidth: 2,
  },
  calendarDayToday: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: Colors.info,
    borderWidth: 2,
  },
  calendarDayLabel: {
    fontSize: 9,
    color: colors.text.tertiary,
    marginBottom: 2,
  },
  calendarCoinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 2,
  },
  calendarCoinText: {
    ...Typography.caption,
    fontWeight: '700',
    color: colors.text.primary,
  },
  bonusDay: {
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  bonusDayClaimed: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: Colors.gold,
    borderWidth: 2,
  },
  bonusCoinText: {
    ...Typography.body,
    fontWeight: '700',
    color: colors.text.primary,
  },
  bonusLabel: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.warning,
  },
  errorContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  errorText: {
    ...Typography.body,
    color: Colors.error,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  retryButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.sm,
  },
  retryButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  emptyContainer: {
    padding: Spacing['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  emptyText: {
    ...Typography.body,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
