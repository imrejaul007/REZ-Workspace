/**
 * CheckinStreak — streak indicator, check-in button, freeze controls
 *
 * Renders the check-in action button, countdown timer, streak reset
 * notification, and freeze streak button.
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import { BRAND } from '@/constants/brand';
import type { CheckInReward } from './types';

interface CheckinStreakProps {
  hasCheckedInToday: boolean;
  checkInStarted: boolean;
  checkInLoading: boolean;
  currentStreak: number;
  isStreakFrozen: boolean;
  freezeLoading: boolean;
  streakWasReset: boolean;
  countdown: string;
  todayReward: CheckInReward | undefined;
  pendingCheckInRewardCoins: number | undefined;
  currencySymbol: string;
  onCheckIn: () => void;
  onFreezeStreak: () => void;
}

export const CheckinStreak = React.memo(function CheckinStreak({
  hasCheckedInToday,
  checkInStarted,
  checkInLoading,
  currentStreak,
  isStreakFrozen,
  freezeLoading,
  streakWasReset,
  countdown,
  todayReward,
  pendingCheckInRewardCoins,
  currencySymbol,
  onCheckIn,
  onFreezeStreak,
}: CheckinStreakProps) {
  const isChecked = hasCheckedInToday || todayReward?.claimed;

  return (
    <View style={styles.container}>
      <Pressable
        onPress={onCheckIn}
        disabled={isChecked || checkInStarted}
        style={[
          styles.checkInButton,
          isChecked && styles.checkInButtonChecked,
          checkInStarted && styles.checkInButtonPending,
        ]}
      >
        <LinearGradient
          colors={
            isChecked
              ? [Colors.gold, colors.nileBlue]
              : checkInStarted
                ? [Colors.warning, colors.warningScale[700]]
                : [Colors.success, colors.brand.greenDark]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.checkInButtonGradient}
        >
          {checkInLoading ? (
            <ActivityIndicator color={colors.text.inverse} />
          ) : isChecked ? (
            <View style={styles.checkInButtonContent}>
              <Ionicons name="checkmark-circle" size={20} color={colors.text.inverse} />
              <Text style={styles.checkInButtonText}>Checked In Today</Text>
            </View>
          ) : checkInStarted ? (
            <View style={styles.checkInButtonContent}>
              <Ionicons name="time" size={20} color={colors.text.inverse} />
              <Text style={styles.checkInButtonText}>Share & Submit Post to Complete</Text>
            </View>
          ) : (
            <View style={styles.checkInButtonContent}>
              <Ionicons name="calendar" size={20} color={colors.text.inverse} />
              <Text style={styles.checkInButtonText}>
                Check In Now (+{currencySymbol}
                {todayReward?.coins})
              </Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>

      {/* Countdown to next check-in */}
      {hasCheckedInToday && countdown ? (
        <View style={styles.countdownContainer}>
          <Text style={styles.countdownText}>
            Next check-in in <Text style={{ fontWeight: '700', color: colors.brand.orange }}>{countdown}</Text>
          </Text>
        </View>
      ) : null}

      {/* Streak reset notification */}
      {streakWasReset && currentStreak === 1 ? (
        <View style={styles.streakResetBanner}>
          <Ionicons name="alert-circle" size={16} color={Colors.error} />
          <Text style={styles.streakResetText}>
            Your streak was reset because you missed a day. Start building it back!
          </Text>
        </View>
      ) : null}

      {/* Freeze Streak Button */}
      {currentStreak >= 2 && !isStreakFrozen && (
        <Pressable style={styles.freezeStreakButton} onPress={onFreezeStreak} disabled={freezeLoading}>
          {freezeLoading ? (
            <ActivityIndicator size="small" color={Colors.info} />
          ) : (
            <>
              <Ionicons name="snow" size={16} color={Colors.info} />
              <Text style={styles.freezeStreakText}>{`Freeze for 50 ${BRAND.CURRENCY_CODE}`}</Text>
            </>
          )}
        </Pressable>
      )}

      {isStreakFrozen && (
        <View style={styles.freezeStreakActive}>
          <Ionicons name="shield-checkmark" size={16} color={Colors.success} />
          <Text style={styles.freezeStreakActiveText}>Streak protected for today</Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.lg,
  },
  checkInButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  checkInButtonChecked: {
    opacity: 0.8,
  },
  checkInButtonPending: {
    opacity: 0.9,
  },
  checkInButtonGradient: {
    paddingVertical: Spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkInButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  checkInButtonText: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  countdownContainer: {
    marginTop: Spacing.sm,
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
  streakResetBanner: {
    marginTop: 10,
    backgroundColor: colors.errorScale[50],
    borderRadius: BorderRadius.sm,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakResetText: {
    flex: 1,
    marginLeft: Spacing.sm,
    ...Typography.bodySmall,
    color: '#991B1B',
  },
  freezeStreakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: 10,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  freezeStreakText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.info,
  },
  freezeStreakActive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: 10,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  freezeStreakActiveText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.success,
  },
});
