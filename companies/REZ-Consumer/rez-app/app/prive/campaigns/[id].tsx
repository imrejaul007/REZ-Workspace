// @ts-nocheck
import { colors } from '@/constants/theme';
/**
 * Privé Campaign Detail Screen
 * View campaign details and join
 */

import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
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
import { platformAlert } from '@/utils/platformAlert';
import { withErrorBoundary } from '@/utils/withErrorBoundary';

function CampaignDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const campaignId = (params.id as string) || '';

  const {
    data: campaign,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['campaign-detail', campaignId],
    queryFn: () => priveApi.getCampaignById(campaignId),
    enabled: !!campaignId,
    select: (res) => (res.success && res.data ? res.data : null),
  });

  const joinMutation = useMutation({
    mutationFn: () => priveApi.joinCampaign(campaignId),
    onSuccess: (res) => {
      platformAlert('Success', 'You joined the campaign!', [
        {
          text: 'Submit Post',
          onPress: () => {
            router.push({
              pathname: '/prive/campaigns/submit',
              params: { campaignId },
            });
          },
        },
        { text: 'Later', style: 'cancel' },
      ]);
    },
    onError: (error) => {
      const message = error?.data?.message || 'Failed to join campaign';
      platformAlert('Error', message);
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Campaign</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !campaign) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Campaign</Text>
          <View style={{ width: 24 }} />
        </View>
        <ErrorState
          error="Failed to load campaign"
          title="Failed to load campaign"
          onRetry={() => {
            refetch();
          }}
        />
      </SafeAreaView>
    );
  }

  const deadlineDate = new Date(campaign.deadline);
  const now = new Date();
  const daysLeft = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Campaign</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <LinearGradient
          colors={['#6C63FF', '#5A52D5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroSection}
        >
          <Text style={styles.heroTitle}>{campaign.brandName}</Text>
          <Text style={styles.heroSubtitle}>{campaign.hashtag}</Text>
        </LinearGradient>

        {/* Campaign Info Cards */}
        <View style={styles.infoCards}>
          <InfoCard icon="gift" label="Reward" value={`${campaign.rewardCoins} coins`} />
          <InfoCard icon="calendar" label="Deadline" value={`${daysLeft} days left`} />
          <InfoCard icon="chatbubbles" label="Submissions" value={`${campaign.submissionCount}`} />
        </View>

        {/* Rules Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Campaign Rules</Text>
          <View style={styles.rulesList}>
            {campaign.rules?.map((rule, idx) => (
              <View key={idx} style={styles.ruleItem}>
                <View style={styles.ruleBullet}>
                  <Text style={styles.ruleBulletText}>•</Text>
                </View>
                <Text style={styles.ruleText}>{rule}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Required Hashtag */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Required Hashtag</Text>
          <View style={styles.hashtagBox}>
            <Ionicons name={'hash' as unknown} size={20} color={Colors.primary} />
            <Text style={styles.hashtagText}>{campaign.requiredHashtag}</Text>
          </View>
        </View>

        {/* Minimum Caption Length */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Guidelines</Text>
          <View style={styles.guideline}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
            <Text style={styles.guidelineText}>Minimum caption length: {campaign.minCaptionLength} characters</Text>
          </View>
        </View>

        {/* Eligibility Indicator */}
        <View style={[styles.section, { marginBottom: Spacing.lg }]}>
          <View
            style={[
              styles.eligibilityBox,
              campaign.isEligible ? styles.eligibilityEligible : styles.eligibilityIneligible,
            ]}
          >
            <Ionicons
              name={campaign.isEligible ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={campaign.isEligible ? Colors.success : Colors.error}
            />
            <Text
              style={[
                styles.eligibilityText,
                campaign.isEligible ? { color: Colors.success } : { color: Colors.error },
              ]}
            >
              {campaign.isEligible ? 'You are eligible' : 'You are not eligible for this campaign'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Join Button */}
      <View style={styles.footer}>
        <Pressable
          onPress={() => joinMutation.mutate()}
          disabled={joinMutation.isPending || !campaign.isEligible}
          style={({ pressed }) => [
            styles.ctaButton,
            !campaign.isEligible && styles.ctaButtonDisabled,
            pressed && !campaign.isEligible && { opacity: 0.6 },
          ]}
        >
          <LinearGradient
            colors={
              campaign.isEligible ? [Colors.primary, Colors.primaryDark] : [Colors.textSecondary, Colors.textSecondary]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaButtonGradient}
          >
            {joinMutation.isPending ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Text style={styles.ctaButtonText}>Join Campaign</Text>
                <Ionicons name="arrow-forward" size={18} color={Colors.white} />
              </>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default withErrorBoundary(CampaignDetailScreen, 'PriveCampaignsId');

interface InfoCardProps {
  icon: string;
  label: string;
  value: string;
}

function InfoCard({ icon, label, value }: InfoCardProps) {
  return (
    <LinearGradient
      colors={['rgba(108, 99, 255, 0.1)', 'rgba(108, 99, 255, 0.05)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.infoCard}
    >
      <Ionicons name={icon as unknown} size={24} color={Colors.primary} />
      <Text style={styles.infoCardLabel}>{label}</Text>
      <Text style={styles.infoCardValue}>{value}</Text>
    </LinearGradient>
  );
}

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
  heroSection: {
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  heroTitle: {
    ...Typography.heading2,
    color: Colors.white,
  },
  heroSubtitle: {
    ...Typography.body1,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  infoCards: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  infoCard: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    gap: Spacing.xs,
    ...Shadows.sm,
  },
  infoCardLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  infoCardValue: {
    ...Typography.body2,
    color: Colors.text,
    fontWeight: '600',
    textAlign: 'center',
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
  rulesList: {
    gap: Spacing.sm,
  },
  ruleItem: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  ruleBullet: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ruleBulletText: {
    ...Typography.body1,
    color: Colors.primary,
  },
  ruleText: {
    ...Typography.body2,
    color: Colors.text,
    flex: 1,
  },
  hashtagBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceLight,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  hashtagText: {
    ...Typography.body1,
    color: Colors.text,
    fontWeight: '600',
  },
  guideline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(108, 99, 255, 0.05)',
  },
  guidelineText: {
    ...Typography.body2,
    color: Colors.text,
    flex: 1,
  },
  eligibilityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  eligibilityEligible: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  eligibilityIneligible: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  eligibilityText: {
    ...Typography.body2,
    fontWeight: '600',
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
  ctaButtonDisabled: {
    opacity: 0.6,
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
