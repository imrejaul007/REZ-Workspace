/**
 * Micro-Actions Screen
 * Shows daily micro-actions with progress tracking and karma rewards.
 */

import { withErrorBoundary } from '@/utils/withErrorBoundary';
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { KarmaHeader } from './_layout';
import karmaService, { MicroAction, MicroActionsResult } from '@/services/karmaService';
import { showAlert } from '@/utils/alert';
import { useIsMounted } from '@/hooks/useIsMounted';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';

const KARMA_PURPLE = '#8B5CF6';
const KARMA_GRADIENT = ['#7C3AED', '#8B5CF6', '#A78BFA'] as const;

const ACTION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  share_impact: 'share',
  daily_checkin: 'home',
  refer_friend: 'person-add',
  complete_profile: 'person',
  join_discord: 'logo-discord',
  first_event_month: 'calendar',
  streak_7: 'flame',
  streak_30: 'trophy',
};

const ACTION_COLORS: Record<string, string> = {
  daily: '#22C55E',
  social: '#3B82F6',
  profile: '#8B5CF6',
  streak: '#EF4444',
  special: '#F59E0B',
};

// Default actions if API returns empty
const DEFAULT_ACTIONS: MicroAction[] = [
  {
    id: '1',
    key: 'daily_checkin',
    name: 'Daily Check-in',
    description: 'Open the app today',
    karmaBonus: 3,
    icon: 'home',
    category: 'daily',
    isAvailable: true,
    isLocked: false,
  },
  {
    id: '2',
    key: 'share_impact',
    name: 'Share Your Impact',
    description: 'Share your report to earn',
    karmaBonus: 5,
    icon: 'share',
    category: 'social',
    isAvailable: true,
    isLocked: false,
  },
  {
    id: '3',
    key: 'complete_profile',
    name: 'Profile Power',
    description: 'Complete all profile fields',
    karmaBonus: 10,
    icon: 'person',
    category: 'profile',
    isAvailable: true,
    isLocked: false,
  },
  {
    id: '4',
    key: 'refer_friend',
    name: 'Refer a Friend',
    description: 'Invite someone new',
    karmaBonus: 20,
    icon: 'person-add',
    category: 'social',
    isAvailable: true,
    isLocked: false,
  },
  {
    id: '5',
    key: 'join_discord',
    name: 'Join the Community',
    description: 'Connect with volunteers',
    karmaBonus: 8,
    icon: 'logo-discord',
    category: 'social',
    isAvailable: true,
    isLocked: false,
  },
  {
    id: '6',
    key: 'first_event_month',
    name: 'Monthly Mission',
    description: 'Join your first event this month',
    karmaBonus: 15,
    icon: 'calendar',
    category: 'special',
    isAvailable: true,
    isLocked: false,
  },
  {
    id: '7',
    key: 'streak_7',
    name: '7-Day Streak',
    description: 'Complete actions 7 days in a row',
    karmaBonus: 10,
    icon: 'flame',
    category: 'streak',
    isAvailable: false,
    isLocked: true,
    lockReason: 'Complete 3 daily actions first',
  },
  {
    id: '8',
    key: 'streak_30',
    name: '30-Day Streak',
    description: 'Complete actions 30 days in a row',
    karmaBonus: 50,
    icon: 'trophy',
    category: 'streak',
    isAvailable: false,
    isLocked: true,
    lockReason: 'Reach 7-day streak first',
  },
];

const TOMORROW_ACTIONS: MicroAction[] = [
  {
    id: 't1',
    key: 'review_event',
    name: 'Event Reviewer',
    description: 'Leave a review for an event',
    karmaBonus: 5,
    icon: 'star',
    category: 'social',
    isAvailable: false,
    isLocked: true,
    lockReason: 'Available tomorrow',
  },
  {
    id: 't2',
    key: 'share_badges',
    name: 'Badge Sharer',
    description: 'Share your earned badges',
    karmaBonus: 4,
    icon: 'medal',
    category: 'social',
    isAvailable: false,
    isLocked: true,
    lockReason: 'Available tomorrow',
  },
];

interface ProgressRingProps {
  completed: number;
  total: number;
  size?: number;
}

function ProgressRing({ completed, total, size = 100 }: ProgressRingProps) {
  const progress = total > 0 ? completed / total : 0;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference * (1 - progress);

  return (
    <View style={[styles.progressRingContainer, { width: size, height: size }]}>
      {/* Background circle */}
      <View
        style={[
          styles.progressRingBackground,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
          },
        ]}
      />
      {/* Progress text */}
      <View style={styles.progressTextContainer}>
        <Text style={styles.progressNumber}>{completed}</Text>
        <Text style={styles.progressOf}>of {total}</Text>
      </View>
    </View>
  );
}

interface ActionCardProps {
  action: MicroAction;
  isCompleted: boolean;
  onClaim: (actionKey: string) => void;
  isClaiming: boolean;
}

function ActionCard({ action, isCompleted, onClaim, isClaiming }: ActionCardProps) {
  const iconName = ACTION_ICONS[action.key] ?? 'flash';
  const accentColor = ACTION_COLORS[action.category] ?? KARMA_PURPLE;
  const canClaim = action.isAvailable && !isCompleted && !action.isLocked;

  return (
    <View style={[styles.actionCard, isCompleted && styles.actionCardCompleted]}>
      {/* Icon */}
      <View style={[styles.actionIconWrap, { backgroundColor: accentColor + '20' }]}>
        <Ionicons name={iconName} size={24} color={accentColor} />
      </View>

      {/* Content */}
      <View style={styles.actionContent}>
        <Text style={styles.actionName}>{action.name}</Text>
        <Text style={styles.actionDesc}>{action.description}</Text>

        {/* Status pills */}
        <View style={styles.actionPills}>
          {/* Karma pill */}
          <View style={[styles.karmaPill, { backgroundColor: '#FFFBEB' }]}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={styles.karmaPillText}>+{action.karmaBonus}</Text>
          </View>

          {/* Status pill */}
          {isCompleted && (
            <View style={[styles.statusPill, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="checkmark-circle" size={12} color="#22C55E" />
              <Text style={[styles.statusPillText, { color: '#22C55E' }]}>Done</Text>
            </View>
          )}
          {action.isLocked && (
            <View style={[styles.statusPill, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="lock-closed" size={12} color="#D97706" />
              <Text style={[styles.statusPillText, { color: '#D97706' }]}>{action.lockReason ?? 'Locked'}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Claim button */}
      {canClaim && (
        <Pressable
          style={[styles.claimBtn, { backgroundColor: accentColor }]}
          onPress={() => onClaim(action.key)}
          disabled={isClaiming}
        >
          {isClaiming ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.claimBtnText}>Claim</Text>
          )}
        </Pressable>
      )}
      {isCompleted && (
        <View style={styles.completedCheck}>
          <Ionicons name="checkmark-circle" size={28} color="#22C55E" />
        </View>
      )}
    </View>
  );
}

function TodayHeader({
  earnedToday,
  completedCount,
  totalCount,
}: {
  earnedToday: number;
  completedCount: number;
  totalCount: number;
}) {
  return (
    <LinearGradient colors={KARMA_GRADIENT} style={styles.todayHeader}>
      <View style={styles.todayHeaderContent}>
        <View style={styles.todayLeft}>
          <Text style={styles.todayTitle}>Daily Actions</Text>
          <Text style={styles.todaySubtitle}>Complete actions to earn karma</Text>
        </View>
        <View style={styles.todayRight}>
          <View style={styles.earnedBadge}>
            <Ionicons name="star" size={16} color="#FCD34D" />
            <Text style={styles.earnedBadgeText}>{earnedToday} earned today</Text>
          </View>
        </View>
      </View>
      <View style={styles.progressRow}>
        <ProgressRing completed={completedCount} total={totalCount} size={80} />
        <View style={styles.progressInfo}>
          <Text style={styles.progressTitle}>Today's Progress</Text>
          <Text style={styles.progressDesc}>
            {completedCount === totalCount ? 'All done for today!' : `${totalCount - completedCount} actions remaining`}
          </Text>
          {completedCount === totalCount && totalCount > 0 && (
            <View style={styles.allDoneRow}>
              <Ionicons name="checkmark-done-circle" size={20} color="#22C55E" />
              <Text style={styles.allDoneText}>Great job!</Text>
            </View>
          )}
        </View>
      </View>
    </LinearGradient>
  );
}

function MicroActionsScreen() {
  const isMounted = useIsMounted();
  const [data, setData] = useState<MicroActionsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claimingKey, setClaimingKey] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const fetchMicroActions = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) setLoading(true);
      setError(false);
      try {
        const res = await karmaService.getMicroActions();
        if (isMounted()) {
          if (res.success && res.data) {
            setData(res.data);
          } else {
            // Use default data if API fails
            setData({
              available: DEFAULT_ACTIONS,
              completed: [],
              earnedToday: 0,
              totalAvailable: DEFAULT_ACTIONS.length,
              totalCompleted: 0,
            });
          }
        }
      } catch {
        if (isMounted()) {
          setError(true);
          // Still show default actions on error
          setData({
            available: DEFAULT_ACTIONS,
            completed: [],
            earnedToday: 0,
            totalAvailable: DEFAULT_ACTIONS.length,
            totalCompleted: 0,
          });
        }
      } finally {
        if (isMounted()) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [isMounted],
  );

  useFocusEffect(
    useCallback(() => {
      fetchMicroActions();
    }, [fetchMicroActions]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMicroActions(true);
  };

  const handleClaim = async (actionKey: string) => {
    setClaimingKey(actionKey);
    try {
      const res = await karmaService.claimMicroAction(actionKey);
      if (res.success && res.data) {
        showAlert('Karma Earned!', `+${res.data.karmaEarned} karma added to your account.`, [{ text: 'OK' }]);
        // Refresh data
        fetchMicroActions(true);
      } else {
        showAlert('Oops', res.error ?? 'Failed to claim action', [{ text: 'OK' }]);
      }
    } catch {
      showAlert('Error', 'Failed to claim action. Please try again.', [{ text: 'OK' }]);
    } finally {
      setClaimingKey(null);
    }
  };

  // Get completed action keys
  const completedKeys = new Set(data?.completed.map((c) => c.actionKey) ?? []);

  // Separate available and locked actions
  const availableActions = data?.available.filter((a) => a.isAvailable && !a.isLocked) ?? [];
  const lockedActions = data?.available.filter((a) => a.isLocked) ?? [];

  const completedCount = data?.completed.length ?? completedKeys.size;
  const totalCount = data?.available.length ?? DEFAULT_ACTIONS.length;
  const earnedToday = data?.earnedToday ?? 0;

  if (loading) {
    return (
      <View style={styles.container}>
        <KarmaHeader title="Daily Actions" subtitle="Earn karma daily" showBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={KARMA_PURPLE} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KarmaHeader title="Daily Actions" subtitle="Earn karma daily" showBack />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[KARMA_PURPLE]}
            tintColor={KARMA_PURPLE}
          />
        }
      >
        {/* Today's Progress Header */}
        <TodayHeader earnedToday={earnedToday} completedCount={completedCount} totalCount={totalCount} />

        {/* Available Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Actions</Text>
          <View style={styles.actionList}>
            {availableActions.map((action) => (
              <ActionCard
                key={action.id}
                action={action}
                isCompleted={completedKeys.has(action.key)}
                onClaim={handleClaim}
                isClaiming={claimingKey === action.key}
              />
            ))}
          </View>
        </View>

        {/* Locked Actions */}
        {lockedActions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming</Text>
            <View style={styles.actionList}>
              {lockedActions.map((action) => (
                <ActionCard
                  key={action.id}
                  action={action}
                  isCompleted={completedKeys.has(action.key)}
                  onClaim={handleClaim}
                  isClaiming={claimingKey === action.key}
                />
              ))}
            </View>
          </View>
        )}

        {/* Tomorrow's Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tomorrow's Actions</Text>
          <View style={styles.tomorrowBanner}>
            <Ionicons name="time-outline" size={24} color="#9CA3AF" />
            <Text style={styles.tomorrowText}>
              New actions unlock daily. Check back tomorrow for fresh opportunities!
            </Text>
          </View>
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.secondary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },

  // Today Header
  todayHeader: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  todayHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  todayLeft: {},
  todayTitle: {
    fontSize: Typography.h3.fontSize,
    fontWeight: '800',
    color: colors.text.inverse,
  },
  todaySubtitle: {
    fontSize: Typography.caption.fontSize,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  todayRight: {},
  earnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  earnedBadgeText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    gap: Spacing.lg,
  },
  progressRingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRingBackground: {
    position: 'absolute',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  progressTextContainer: {
    alignItems: 'center',
  },
  progressNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text.inverse,
  },
  progressOf: {
    fontSize: Typography.caption.fontSize,
    color: 'rgba(255,255,255,0.7)',
  },
  progressInfo: {
    flex: 1,
  },
  progressTitle: {
    fontSize: Typography.body.fontSize,
    fontWeight: '700',
    color: colors.text.inverse,
    marginBottom: 4,
  },
  progressDesc: {
    fontSize: Typography.caption.fontSize,
    color: 'rgba(255,255,255,0.8)',
  },
  allDoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  allDoneText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '700',
    color: '#22C55E',
  },

  // Section
  section: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.base,
  },
  sectionTitle: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.deepNavy,
    marginBottom: Spacing.md,
  },

  // Action List
  actionList: {
    gap: Spacing.md,
  },

  // Action Card
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.text.inverse,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  actionCardCompleted: {
    backgroundColor: '#FAFAFA',
    opacity: 0.8,
  },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  actionContent: {
    flex: 1,
  },
  actionName: {
    fontSize: Typography.body.fontSize,
    fontWeight: '700',
    color: colors.deepNavy,
  },
  actionDesc: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  actionPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  karmaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  karmaPillText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '700',
    color: '#D97706',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  statusPillText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '600',
  },
  claimBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    minWidth: 70,
    alignItems: 'center',
  },
  claimBtnText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  completedCheck: {
    marginLeft: Spacing.sm,
  },

  // Tomorrow Banner
  tomorrowBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.text.inverse,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: colors.border.default,
    gap: Spacing.md,
  },
  tomorrowText: {
    flex: 1,
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
  },
});

export default withErrorBoundary(MicroActionsScreen, 'MicroActions');
