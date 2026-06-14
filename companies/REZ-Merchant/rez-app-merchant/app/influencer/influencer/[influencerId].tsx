/**
 * Influencer Profile - View influencer details
 * Display influencer profile, stats, and previous collaborations
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/DesignTokens';
import { influencerService, helpers as influencerHelpers } from '@/services/api/influencer';
import type { Influencer } from '@/types/influencer';

export default function InfluencerProfile() {
  const { influencerId } = useLocalSearchParams<{ influencerId: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const scheme = colorScheme ?? 'light';

  // Fetch influencer details
  const { data: influencer, isLoading, error, refetch } = useQuery({
    queryKey: ['influencer', influencerId],
    queryFn: async () => {
      if (!influencerId) throw new Error('Influencer ID is required');
      return influencerService.getInfluencer(influencerId);
    },
    enabled: !!influencerId,
  });

  // Handle contact
  const handleContact = () => {
    if (influencer?.email) {
      Linking.openURL(`mailto:${influencer.email}`);
    }
  };

  // Handle message
  const handleMessage = () => {
    if (influencer?.phone) {
      Linking.openURL(`sms:${influencer.phone}`);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: Colors.gray[50] }]}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  // Error state
  if (error || !influencer) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: Colors.gray[50] }]}>
        <Ionicons name="person-outline" size={64} color={Colors.error[500]} />
        <Text style={styles.errorTitle}>Unable to load profile</Text>
        <TouchableOpacity onPress={() => refetch()}>
          <Text style={styles.retryText}>Tap to retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: scheme === 'dark' ? Colors.gray[900] : Colors.gray[50] },
      ]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <View
        style={[
          styles.headerCard,
          { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card },
        ]}
      >
        <View style={styles.headerTop}>
          <Image
            source={{ uri: influencer.avatar || 'https://i.pravatar.cc/300' }}
            style={styles.avatar}
          />
          {influencer.verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.primary[500]} />
            </View>
          )}
        </View>

        <Text
          style={[styles.name, { color: scheme === 'dark' ? Colors.gray[100] : Colors.text.primary }]}
        >
          {influencer.name}
        </Text>
        <Text style={[styles.username, { color: Colors.text.secondary }]}>
          @{influencer.username}
        </Text>

        {influencer.bio && (
          <Text style={[styles.bio, { color: Colors.text.secondary }]}>{influencer.bio}</Text>
        )}

        {/* Rating */}
        <View style={styles.ratingContainer}>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={star <= Math.floor(influencer.rating) ? 'star' : 'star-outline'}
                size={18}
                color={Colors.warning[500]}
              />
            ))}
          </View>
          <Text style={[styles.ratingText, { color: Colors.text.primary }]}>
            {influencer.rating.toFixed(1)}
          </Text>
          <Text style={[styles.ratingLabel, { color: Colors.text.secondary }]}>
            ({influencer.totalCampaigns} campaigns)
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: Colors.primary[500] }]}
            onPress={() => router.push(`/influencer/create?influencerId=${influencer.id}`)}
          >
            <Ionicons name="add" size={20} color={Colors.text.inverse} />
            <Text style={styles.actionButtonText}>Create Campaign</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, { borderColor: Colors.border.default }]}
            onPress={handleMessage}
          >
            <Ionicons name="chatbubble-outline" size={20} color={Colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, { borderColor: Colors.border.default }]}
            onPress={handleContact}
          >
            <Ionicons name="mail-outline" size={20} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View
          style={[
            styles.statCard,
            { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card },
          ]}
        >
          <Text style={[styles.statValue, { color: Colors.text.primary }]}>
            {influencerHelpers.formatFollowerCount(influencer.followerCount)}
          </Text>
          <Text style={[styles.statLabel, { color: Colors.text.secondary }]}>Followers</Text>
        </View>
        <View
          style={[
            styles.statCard,
            { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card },
          ]}
        >
          <Text style={[styles.statValue, { color: Colors.text.primary }]}>
            {influencerHelpers.formatEngagementRate(influencer.engagementRate)}
          </Text>
          <Text style={[styles.statLabel, { color: Colors.text.secondary }]}>Engagement</Text>
        </View>
        <View
          style={[
            styles.statCard,
            { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card },
          ]}
        >
          <Text style={[styles.statValue, { color: Colors.text.primary }]}>
            {influencer.averageViews
              ? influencerHelpers.formatFollowerCount(influencer.averageViews)
              : '-'}
          </Text>
          <Text style={[styles.statLabel, { color: Colors.text.secondary }]}>Avg Views</Text>
        </View>
      </View>

      {/* Platforms */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: Colors.text.primary }]}>Platforms</Text>
        <View style={styles.platformsRow}>
          {influencer.platforms.map((platform) => (
            <View
              key={platform}
              style={[
                styles.platformBadge,
                { backgroundColor: scheme === 'dark' ? Colors.gray[700] : Colors.gray[100] },
              ]}
            >
              <Ionicons
                name={influencerHelpers.getPlatformIcon(platform) as unknown}
                size={24}
                color={Colors.primary[500]}
              />
              <Text style={[styles.platformText, { color: Colors.text.secondary }]}>
                {influencerHelpers.getPlatformDisplayName(platform)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Niche */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: Colors.text.primary }]}>Niche</Text>
        <View style={styles.nicheRow}>
          {influencer.niche.map((niche) => (
            <View
              key={niche}
              style={[styles.nicheBadge, { backgroundColor: Colors.primary[50] }]}
            >
              <Text style={[styles.nicheText, { color: Colors.primary[600] }]}>
                {influencerHelpers.getNicheDisplayName(niche)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Pricing */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: Colors.text.primary }]}>Pricing</Text>
        <View
          style={[
            styles.pricingCard,
            { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card },
          ]}
        >
          <View style={styles.pricingRow}>
            <Text style={[styles.pricingLabel, { color: Colors.text.secondary }]}>
              Per Post (Starting)
            </Text>
            <Text style={[styles.pricingValue, { color: Colors.primary[500] }]}>
              {influencerHelpers.formatPrice(influencer.minPricePerPost)}
            </Text>
          </View>
          <View style={styles.pricingRow}>
            <Text style={[styles.pricingLabel, { color: Colors.text.secondary }]}>
              Per Post (Max)
            </Text>
            <Text style={[styles.pricingValue, { color: Colors.primary[500] }]}>
              {influencerHelpers.formatPrice(influencer.maxPricePerPost)}
            </Text>
          </View>
        </View>
      </View>

      {/* Stats Details */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: Colors.text.primary }]}>Performance</Text>
        <View
          style={[
            styles.performanceCard,
            { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card },
          ]}
        >
          <View style={styles.performanceRow}>
            <View style={styles.performanceItem}>
              <Ionicons name="heart" size={20} color={Colors.error[500]} />
              <Text style={[styles.performanceValue, { color: Colors.text.primary }]}>
                {influencer.averageLikes
                  ? influencerHelpers.formatFollowerCount(influencer.averageLikes)
                  : '-'}
              </Text>
              <Text style={[styles.performanceLabel, { color: Colors.text.secondary }]}>
                Avg Likes
              </Text>
            </View>
            <View style={styles.performanceItem}>
              <Ionicons name="chatbubble" size={20} color={Colors.primary[500]} />
              <Text style={[styles.performanceValue, { color: Colors.text.primary }]}>
                {influencer.averageComments
                  ? influencerHelpers.formatFollowerCount(influencer.averageComments)
                  : '-'}
              </Text>
              <Text style={[styles.performanceLabel, { color: Colors.text.secondary }]}>
                Avg Comments
              </Text>
            </View>
            <View style={styles.performanceItem}>
              <Ionicons name="eye" size={20} color={Colors.success[500]} />
              <Text style={[styles.performanceValue, { color: Colors.text.primary }]}>
                {influencer.totalPosts || '-'}
              </Text>
              <Text style={[styles.performanceLabel, { color: Colors.text.secondary }]}>
                Total Posts
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Location */}
      {influencer.location && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.text.primary }]}>Location</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={20} color={Colors.text.secondary} />
            <Text style={[styles.locationText, { color: Colors.text.secondary }]}>
              {influencer.location}
            </Text>
          </View>
        </View>
      )}

      {/* Languages */}
      {influencer.language && influencer.language.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.text.primary }]}>Languages</Text>
          <View style={styles.languageRow}>
            {influencer.language.map((lang) => (
              <View
                key={lang}
                style={[styles.languageBadge, { backgroundColor: Colors.gray[100] }]}
              >
                <Text style={[styles.languageText, { color: Colors.text.secondary }]}>{lang}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Availability */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: Colors.text.primary }]}>Availability</Text>
        <View
          style={[
            styles.availabilityCard,
            {
              backgroundColor: influencer.isAvailable
                ? Colors.success[50]
                : Colors.gray[100],
            },
          ]}
        >
          <View
            style={[
              styles.availabilityIndicator,
              {
                backgroundColor: influencer.isAvailable
                  ? Colors.success[500]
                  : Colors.gray[400],
              },
            ]}
          />
          <Text
            style={[
              styles.availabilityText,
              {
                color: influencer.isAvailable
                  ? Colors.success[700]
                  : Colors.text.secondary,
              },
            ]}
          >
            {influencer.isAvailable ? 'Available for campaigns' : 'Not available'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.base,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.base,
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorTitle: {
    marginTop: Spacing.base,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
  },
  retryText: {
    marginTop: Spacing.sm,
    fontSize: Typography.fontSize.base,
    color: Colors.primary[500],
  },
  headerCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.base,
    ...Shadows.md,
  },
  headerTop: {
    position: 'relative',
    marginBottom: Spacing.base,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.gray[200],
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.card,
    borderRadius: 12,
  },
  name: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },
  username: {
    fontSize: Typography.fontSize.base,
    marginTop: 2,
  },
  bio: {
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 20,
    paddingHorizontal: Spacing.base,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.base,
    gap: Spacing.xs,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
  },
  ratingLabel: {
    fontSize: Typography.fontSize.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  actionButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadows.sm,
  },
  statValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    marginBottom: Spacing.base,
  },
  platformsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  platformText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  nicheRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  nicheBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  nicheText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  pricingCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    ...Shadows.sm,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  pricingLabel: {
    fontSize: Typography.fontSize.sm,
  },
  pricingValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
  },
  performanceCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    ...Shadows.sm,
  },
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  performanceItem: {
    alignItems: 'center',
    gap: 4,
  },
  performanceValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    marginTop: Spacing.xs,
  },
  performanceLabel: {
    fontSize: Typography.fontSize.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  locationText: {
    fontSize: Typography.fontSize.sm,
  },
  languageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  languageBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  languageText: {
    fontSize: Typography.fontSize.sm,
  },
  availabilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  availabilityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  availabilityText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
});
