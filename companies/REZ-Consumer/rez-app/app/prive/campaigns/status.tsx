import { colors } from '@/constants/theme';
/**
 * Privé Campaign Submission Status Screen
 * View submission status and earned coins
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import priveApi from '@/services/priveApi';
import ErrorState from '@/components/common/ErrorState';
import { withErrorBoundary } from '@/utils/withErrorBoundary';

function CampaignStatusScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const campaignId = (params.campaignId as string) || '';

  const {
    data: status,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['campaign-status', campaignId],
    queryFn: () => priveApi.getCampaignSubmissionStatus(campaignId),
    enabled: !!campaignId,
    select: (res) => (res.success && res.data ? res.data : null),
  });

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Submission Status</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !status) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Submission Status</Text>
          <View style={{ width: 24 }} />
        </View>
        <ErrorState error="Failed to load status. Please try again" onRetry={refetch} />
      </SafeAreaView>
    );
  }

  const statusConfig = {
    pending: {
      icon: 'time-outline',
      color: Colors.warning,
      title: 'Under Review',
      subtitle: 'Your post is being reviewed by our team',
    },
    under_review: {
      icon: 'eye-outline',
      color: Colors.info,
      title: 'Under Review',
      subtitle: 'Our team is evaluating your submission',
    },
    approved: {
      icon: 'checkmark-circle',
      color: Colors.success,
      title: 'Approved!',
      subtitle: 'Your post was approved',
    },
    rejected: {
      icon: 'close-circle',
      color: Colors.error,
      title: 'Not Approved',
      subtitle: 'Your submission did not meet the requirements',
    },
  };

  const currentStatus = statusConfig[status.status as keyof typeof statusConfig];

  const timelineSteps = [
    { label: 'Submitted', completed: true },
    { label: 'Under Review', completed: status.status !== 'pending' },
    { label: 'Decision', completed: status.status === 'approved' || status.status === 'rejected' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Submission Status</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Indicator */}
        <View style={styles.statusIndicator}>
          <Ionicons name={currentStatus.icon as unknown} size={64} color={currentStatus.color} />
          <Text style={styles.statusTitle}>{currentStatus.title}</Text>
          <Text style={styles.statusSubtitle}>{currentStatus.subtitle}</Text>
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.timeline}>
            {timelineSteps.map((step, idx) => (
              <React.Fragment key={idx}>
                <View style={styles.timelineItem}>
                  <View style={[styles.timelineItemDot, step.completed ? styles.timelineItemDotCompleted : null]}>
                    {step.completed && <Ionicons name="checkmark" size={12} color={Colors.white} />}
                  </View>
                  <Text style={styles.timelineItemLabel}>{step.label}</Text>
                </View>
                {idx < timelineSteps.length - 1 && (
                  <View style={[styles.timelineConnector, step.completed ? styles.timelineConnectorCompleted : null]} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Rejection Reason */}
        {status.status === 'rejected' && status.rejectionReason && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Feedback</Text>
            <View style={styles.rejectionReasonBox}>
              <Ionicons name="information-circle" size={20} color={Colors.error} />
              <Text style={styles.rejectionReasonText}>{status.rejectionReason}</Text>
            </View>
          </View>
        )}

        {/* Coins Earned */}
        {status.status === 'approved' && (
          <View style={styles.section}>
            <View style={styles.coinsEarnedCard}>
              <LinearGradient
                colors={['#6C63FF', '#5A52D5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.coinsEarnedGradient}
              >
                <View style={styles.coinsEarnedContent}>
                  <View style={styles.coinsBadge}>
                    <Ionicons name="sparkles" size={24} color={Colors.white} />
                  </View>
                  <View style={styles.coinsInfo}>
                    <Text style={styles.coinsLabel}>Coins Earned</Text>
                    <Text style={styles.coinsAmount}>+{status.coinsEarned} coins</Text>
                  </View>
                </View>
                <Text style={styles.coinsExpiry}>Valid for {status.expiryDays} days</Text>
              </LinearGradient>
            </View>
          </View>
        )}

        {/* Next Steps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next Steps</Text>
          {status.status === 'pending' || status.status === 'under_review' ? (
            <View style={styles.nextStepsBox}>
              <View style={styles.nextStepItem}>
                <Ionicons name="timer" size={20} color={Colors.primary} />
                <Text style={styles.nextStepText}>Usually reviewed within 48 hours</Text>
              </View>
              <View style={styles.nextStepItem}>
                <Ionicons name="notifications" size={20} color={Colors.primary} />
                <Text style={styles.nextStepText}>We'll notify you when a decision is made</Text>
              </View>
            </View>
          ) : status.status === 'approved' ? (
            <View style={styles.nextStepsBox}>
              <View style={styles.nextStepItem}>
                <Ionicons name="checkmark" size={20} color={Colors.success} />
                <Text style={styles.nextStepText}>Coins have been added to your Privé wallet</Text>
              </View>
              <View style={styles.nextStepItem}>
                <Ionicons name="share-social" size={20} color={Colors.primary} />
                <Text style={styles.nextStepText}>Share your achievement on other campaigns</Text>
              </View>
            </View>
          ) : (
            <View style={styles.nextStepsBox}>
              <View style={styles.nextStepItem}>
                <Ionicons name="arrow-forward" size={20} color={Colors.primary} />
                <Text style={styles.nextStepText}>You can try submitting to other campaigns</Text>
              </View>
              <Pressable onPress={() => router.back()} style={styles.tryAgainButton}>
                <Text style={styles.tryAgainButtonText}>Browse More Campaigns</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      {/* CTA Button */}
      <View style={styles.footer}>
        <Pressable
          onPress={() => router.push('/prive')}
          style={({ pressed }) => [styles.ctaButton, pressed && { opacity: 0.8 }]}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaButtonGradient}
          >
            <Text style={styles.ctaButtonText}>Back to Privé</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.white} />
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default withErrorBoundary(CampaignStatusScreen, 'PriveCampaignsStatus');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  headerTitle: {
    ...Typography.heading3,
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: Spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  statusIndicator: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    gap: Spacing.md,
  },
  statusTitle: {
    ...Typography.heading2,
    color: Colors.text,
  },
  statusSubtitle: {
    ...Typography.body2,
    color: Colors.textSecondary,
  },
  section: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.heading3,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  timeline: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  timelineItemDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.border.default,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineItemDotCompleted: {
    backgroundColor: Colors.success,
  },
  timelineItemLabel: {
    ...Typography.body2,
    color: Colors.text,
  },
  timelineConnector: {
    height: 20,
    width: 2,
    backgroundColor: colors.border.default,
    marginLeft: 9,
    marginVertical: 0,
  },
  timelineConnectorCompleted: {
    backgroundColor: Colors.success,
  },
  rejectionReasonBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  rejectionReasonText: {
    ...Typography.body2,
    color: Colors.text,
    flex: 1,
  },
  coinsEarnedCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  coinsEarnedGradient: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  coinsEarnedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  coinsBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinsInfo: {
    flex: 1,
  },
  coinsLabel: {
    ...Typography.body2,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  coinsAmount: {
    ...Typography.heading2,
    color: Colors.white,
    marginTop: Spacing.xs,
  },
  coinsExpiry: {
    ...Typography.caption,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  nextStepsBox: {
    gap: Spacing.md,
  },
  nextStepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceLight,
  },
  nextStepText: {
    ...Typography.body2,
    color: Colors.text,
    flex: 1,
  },
  tryAgainButton: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
  },
  tryAgainButtonText: {
    ...Typography.body2,
    color: Colors.white,
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    backgroundColor: colors.background.primary,
  },
  ctaButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  ctaButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  ctaButtonText: {
    ...Typography.body1,
    color: Colors.white,
    fontWeight: '600',
  },
});
