// @ts-nocheck
/**
 * CheckinRewards — rewards display sections
 *
 * Renders: affiliate stats dashboard, promotional posters grid,
 * submission history, streak bonuses list, and pro tips.
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import CachedImage from '@/components/ui/CachedImage';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import { BRAND } from '@/constants/brand';
import { catchAndWarn } from '@/utils/catchAndReport';
import type { AffiliateStats, PromotionalPoster, ShareSubmission, StreakBonus } from './types';

const { width } = Dimensions.get('window');

// ─── Affiliate Stats Dashboard ──────────────────────────────────────────────

interface AffiliateStatsSectionProps {
  affiliateStats: AffiliateStats;
  isNewAffiliate: boolean;
  affiliateTip: string;
  currencySymbol: string;
}

export const AffiliateStatsSection = React.memo(function AffiliateStatsSection({
  affiliateStats,
  isNewAffiliate,
  affiliateTip,
  currencySymbol,
}: AffiliateStatsSectionProps) {
  return (
    <>
      <View style={styles.affiliateGrid}>
        <LinearGradient colors={['rgba(59, 130, 246, 0.1)', 'rgba(6, 182, 212, 0.1)']} style={styles.affiliateCard}>
          <Ionicons name="share-social" size={20} color={Colors.info} />
          <Text style={styles.affiliateValue}>{affiliateStats.totalShares}</Text>
          <Text style={styles.affiliateLabel}>Total Shares</Text>
        </LinearGradient>
        <LinearGradient colors={['rgba(34, 197, 94, 0.1)', 'rgba(16, 185, 129, 0.1)']} style={styles.affiliateCard}>
          <Ionicons name="people" size={20} color={Colors.success} />
          <Text style={styles.affiliateValue}>{affiliateStats.appDownloads}</Text>
          <Text style={styles.affiliateLabel}>App Downloads</Text>
        </LinearGradient>
        <LinearGradient colors={['rgba(139, 92, 246, 0.1)', 'rgba(236, 72, 153, 0.1)']} style={styles.affiliateCard}>
          <Ionicons name="cart" size={20} color={colors.nileBlue} />
          <Text style={styles.affiliateValue}>{affiliateStats.purchases}</Text>
          <Text style={styles.affiliateLabel}>Purchases Made</Text>
        </LinearGradient>
        <LinearGradient colors={['rgba(245, 158, 11, 0.1)', 'rgba(249, 115, 22, 0.1)']} style={styles.affiliateCard}>
          <CachedImage source={BRAND.COIN_IMAGE} style={styles.coinIcon20} contentFit="contain" />
          <Text style={styles.affiliateValue}>
            {currencySymbol}
            {affiliateStats.commissionEarned}
          </Text>
          <Text style={styles.affiliateLabel}>Commission Earned</Text>
        </LinearGradient>
      </View>

      {isNewAffiliate && (
        <View style={styles.affiliateOnboarding}>
          <Ionicons name="rocket-outline" size={28} color={Colors.info} />
          <Text style={styles.affiliateOnboardingTitle}>Start Earning Today!</Text>
          <Text style={styles.affiliateOnboardingText}>
            Share your first promotional poster below to begin earning affiliate commissions. Every share counts!
          </Text>
        </View>
      )}

      <View style={styles.affiliateTip}>
        <Text style={styles.affiliateTipText}>
          <Text style={styles.affiliateTipBold}>How it works: </Text>
          {affiliateTip}
        </Text>
      </View>
    </>
  );
});

// ─── Promotional Posters Grid ────────────────────────────────────────────────

interface PostersGridProps {
  promotionalPosters: PromotionalPoster[];
  postersError: string | null;
  checkInStarted: boolean;
  currencySymbol: string;
  onSelectPoster: (poster: PromotionalPoster) => void;
  onRetry: () => void;
}

export const PostersGrid = React.memo(function PostersGrid({
  promotionalPosters,
  postersError,
  checkInStarted,
  currencySymbol,
  onSelectPoster,
  onRetry,
}: PostersGridProps) {
  if (postersError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={32} color={Colors.error} />
        <Text style={styles.errorText}>{postersError}</Text>
        <Pressable style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (promotionalPosters.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="images-outline" size={32} color={colors.text.tertiary} />
        <Text style={styles.emptyText}>No promotional posters available</Text>
        <Text style={styles.emptySubtext}>Check back later for new campaigns!</Text>
      </View>
    );
  }

  return (
    <View style={[styles.postersGrid, checkInStarted ? styles.postersGridHighlight : null]}>
      {promotionalPosters.map((poster) => (
        <Pressable key={poster.id} style={styles.posterCard} onPress={() => onSelectPoster(poster)}>
          <LinearGradient colors={poster.colors} style={styles.posterGradient}>
            <CachedImage source={poster.image} style={styles.posterImage} {...{ blurRadius: 2 } as unknown} />
            <View style={styles.posterContent}>
              <Text style={styles.posterTitle}>{poster.title}</Text>
              <Text style={styles.posterSubtitle}>{poster.subtitle}</Text>
              <View style={styles.posterFooter}>
                <View style={styles.posterBonus}>
                  <Text style={styles.posterBonusText}>
                    +{currencySymbol}
                    {poster.shareBonus} bonus
                  </Text>
                </View>
                <Ionicons name="share-social" size={16} color={colors.text.inverse} />
              </View>
            </View>
          </LinearGradient>
        </Pressable>
      ))}
    </View>
  );
});

// ─── Submission History ──────────────────────────────────────────────────────

interface SubmissionsListProps {
  submissions: ShareSubmission[];
  currencySymbol: string;
}

export const SubmissionsList = React.memo(function SubmissionsList({
  submissions,
  currencySymbol,
}: SubmissionsListProps) {
  if (submissions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="document-text-outline" size={32} color={colors.text.tertiary} />
        <Text style={styles.emptyText}>No submissions yet</Text>
        <Text style={styles.emptySubtext}>Share your first poster to start earning!</Text>
      </View>
    );
  }

  return (
    <>
      {submissions.map((submission) => (
        <View key={submission.id} style={styles.submissionCard}>
          <View style={styles.submissionHeader}>
            <View style={styles.submissionInfo}>
              <Text style={styles.submissionTitle}>{submission.posterTitle}</Text>
              <Text style={styles.submissionDate}>
                Submitted:{' '}
                {new Date(submission.submittedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
              <Pressable
                onPress={() => {
                  try {
                    Linking.openURL(submission.postUrl);
                  } catch (e) {
                    catchAndWarn(e, 'DailyCheckin/openURL');
                  }
                }}
                style={styles.submissionLink}
              >
                <Ionicons name="link" size={12} color={Colors.info} />
                <Text style={styles.submissionLinkText}>View Post</Text>
              </Pressable>
            </View>
            <View style={styles.submissionStatus}>
              {submission.status === 'pending' && (
                <View style={styles.statusBadgePending}>
                  <Ionicons name="time" size={12} color={colors.warningScale[700]} />
                  <Text style={styles.statusTextPending}>Pending</Text>
                </View>
              )}
              {(submission.status === 'approved' || (submission.status as string) === 'credited') && (
                <View style={styles.statusBadgeApproved}>
                  <Ionicons name="checkmark-circle" size={12} color={colors.nileBlue} />
                  <Text style={styles.statusTextApproved}>Approved</Text>
                </View>
              )}
              {submission.status === 'rejected' && (
                <View style={styles.statusBadgeRejected}>
                  <Ionicons name="close-circle" size={12} color={Colors.error} />
                  <Text style={styles.statusTextRejected}>Rejected</Text>
                </View>
              )}
              <Text style={styles.submissionBonus}>
                +{currencySymbol}
                {submission.shareBonus}
              </Text>
            </View>
          </View>
          {(submission.status === 'approved' || (submission.status as string) === 'credited') && (
            <View style={styles.submissionFooter}>
              <Ionicons name="trophy" size={12} color={colors.nileBlue} />
              <Text style={styles.submissionFooterText}>
                Approved
                {submission.approvedAt
                  ? ` on ${new Date(submission.approvedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}`
                  : ''}{' '}
                - {currencySymbol}
                {submission.shareBonus} credited!
              </Text>
            </View>
          )}
          {submission.status === 'pending' && (
            <View style={styles.submissionFooterPending}>
              <Text style={styles.submissionFooterPendingText}>
                Under review - You'll earn {currencySymbol}
                {submission.shareBonus} once approved!
              </Text>
            </View>
          )}
        </View>
      ))}
    </>
  );
});

// ─── Streak Bonuses List ─────────────────────────────────────────────────────

interface StreakBonusesSectionProps {
  streakBonuses: StreakBonus[];
  bonusesError: string | null;
  currencySymbol: string;
  onRetry: () => void;
}

export const StreakBonusesSection = React.memo(function StreakBonusesSection({
  streakBonuses,
  bonusesError,
  currencySymbol,
  onRetry,
}: StreakBonusesSectionProps) {
  if (bonusesError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={32} color={Colors.error} />
        <Text style={styles.errorText}>{bonusesError}</Text>
        <Pressable style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (streakBonuses.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="trophy-outline" size={32} color={colors.text.tertiary} />
        <Text style={styles.emptyText}>No streak bonuses available</Text>
      </View>
    );
  }

  const colorSets = [
    { bg: 'rgba(59, 130, 246, 0.2)', icon: Colors.info },
    { bg: 'rgba(139, 92, 246, 0.2)', icon: colors.nileBlue },
    { bg: 'rgba(236, 72, 153, 0.2)', icon: colors.brand.pink },
  ];

  return (
    <View style={styles.streakList}>
      {streakBonuses.map((bonus, index) => {
        const colorSet = colorSets[index % colorSets.length];
        return (
          <View key={bonus.days} style={[styles.streakCard, bonus.achieved ? styles.streakCardAchieved : null]}>
            <View style={[styles.streakIcon, { backgroundColor: colorSet.bg }]}>
              <Ionicons
                name={bonus.achieved ? 'checkmark-circle' : 'flame'}
                size={20}
                color={bonus.achieved ? Colors.gold : colorSet.icon}
              />
            </View>
            <View style={styles.streakInfo}>
              <Text style={styles.streakTitle}>{bonus.days}-Day Streak</Text>
              <Text style={styles.streakDescription}>
                {bonus.achieved ? 'Completed!' : `Complete ${bonus.days} days`}
              </Text>
            </View>
            <Text style={[styles.streakReward, bonus.achieved && { color: Colors.gold }]}>
              {bonus.achieved ? '✓ ' : ''}
              {currencySymbol}
              {bonus.reward}
            </Text>
          </View>
        );
      })}
    </View>
  );
});

// ─── Pro Tips ────────────────────────────────────────────────────────────────

interface ProTipsProps {
  proTips: string[];
}

export const ProTips = React.memo(function ProTips({ proTips }: ProTipsProps) {
  return (
    <View style={styles.tipsContainer}>
      <Text style={styles.tipsTitle}>Pro Tips</Text>
      <View style={styles.tipsList}>
        {proTips.map((tip, index) => (
          <View key={index} style={styles.tipItem}>
            <View style={styles.tipDot} />
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  // Affiliate grid
  affiliateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  affiliateCard: {
    width: (width - 32 - 12) / 2,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  affiliateValue: {
    ...Typography.h2,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: Spacing.sm,
  },
  affiliateLabel: {
    ...Typography.bodySmall,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  coinIcon20: { width: 20, height: 20 },
  affiliateOnboarding: {
    alignItems: 'center',
    padding: Spacing.base,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.15)',
    borderStyle: 'dashed',
  },
  affiliateOnboardingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: Spacing.sm,
  },
  affiliateOnboardingText: {
    fontSize: 13,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    lineHeight: 18,
  },
  affiliateTip: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  affiliateTipText: {
    ...Typography.bodySmall,
    color: colors.brand.amberDeep,
    lineHeight: 18,
  },
  affiliateTipBold: {
    fontWeight: '700',
  },
  // Posters grid
  postersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  postersGridHighlight: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.warning,
  },
  posterCard: {
    width: (width - 32 - 12) / 2,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  posterGradient: {
    height: 128,
    position: 'relative',
  },
  posterImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  posterContent: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  posterTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.inverse,
    marginBottom: 2,
  },
  posterSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  posterFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  posterBonus: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  posterBonusText: {
    ...Typography.caption,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  // Submissions
  submissionCard: {
    padding: Spacing.base,
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: Spacing.md,
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  submissionInfo: {
    flex: 1,
  },
  submissionTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: Spacing.xs,
  },
  submissionDate: {
    ...Typography.bodySmall,
    color: colors.text.tertiary,
    marginBottom: Spacing.sm,
  },
  submissionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  submissionLinkText: {
    ...Typography.bodySmall,
    color: Colors.info,
  },
  submissionStatus: {
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  statusBadgePending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  statusTextPending: {
    ...Typography.caption,
    fontWeight: '600',
    color: colors.warningScale[700],
  },
  statusBadgeApproved: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusTextApproved: {
    ...Typography.caption,
    fontWeight: '600',
    color: colors.nileBlue,
  },
  statusBadgeRejected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  statusTextRejected: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.error,
  },
  submissionBonus: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
  },
  submissionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  submissionFooterText: {
    ...Typography.caption,
    color: colors.nileBlue,
  },
  submissionFooterPending: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  submissionFooterPendingText: {
    ...Typography.caption,
    color: colors.warningScale[700],
  },
  // Streak bonuses
  streakList: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  streakCardAchieved: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: Colors.gold,
  },
  streakIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  streakInfo: {
    flex: 1,
  },
  streakTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  streakDescription: {
    ...Typography.bodySmall,
    color: colors.text.tertiary,
  },
  streakReward: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.warning,
  },
  // Pro tips
  tipsContainer: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xl,
  },
  tipsTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: Spacing.md,
  },
  tipsList: {
    backgroundColor: colors.background.secondary,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
    marginTop: 6,
  },
  tipText: {
    fontSize: 13,
    color: colors.text.tertiary,
    flex: 1,
    lineHeight: 20,
  },
  // Shared error/empty
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
  emptySubtext: {
    ...Typography.bodySmall,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});
