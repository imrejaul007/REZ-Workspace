// @ts-nocheck
/**
 * Influencer Campaigns Screen
 * Route: /influencer
 *
 * Lists available influencer campaigns that users can participate in.
 * Features:
 * - Available campaigns
 * - Campaign progress tracking
 * - Earnings dashboard
 * - Participation history
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/DesignSystem';
import { useAuthUser } from '@/stores/selectors';
import apiClient from '@/services/apiClient';

// API URL from environment
const MARKETING_SERVICE = process.env.EXPO_PUBLIC_MARKETING_SERVICE_URL || 'https://rez-api-gateway.onrender.com/api';

// ============================================================================
// TYPES
// ============================================================================

interface InfluencerCampaign {
  id: string;
  title: string;
  description: string;
  merchantId: string;
  merchantName: string;
  merchantLogo?: string;
  brandName?: string;
  category: string;
  type: 'social_share' | 'review' | 'referral' | 'content';
  rewardType: 'coins' | 'cash' | 'voucher' | 'mixed';
  rewardValue?: string;
  coinReward?: number;
  cashReward?: number;
  targetCount?: number;
  currentCount?: number;
  maxParticipants?: number;
  startsAt: string;
  endsAt: string;
  imageUrl?: string;
  isParticipating?: boolean;
  submissionUrl?: string;
  commission?: number;
  requirements?: string[];
  instructions?: string[];
  terms?: string[];
}

interface Earnings {
  totalEarnings: number;
  pendingEarnings: number;
  completedEarnings: number;
  totalReferrals: number;
}

type FilterType = 'all' | 'available' | 'my_campaigns' | 'completed';

// ============================================================================
// CONSTANTS
// ============================================================================

const CAMPAIGN_TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  social_share: 'share-social',
  review: 'star',
  referral: 'people',
  content: 'create',
};

const CAMPAIGN_TYPE_LABELS: Record<string, string> = {
  social_share: 'Social Share',
  review: 'Write Review',
  referral: 'Refer Friends',
  content: 'Create Content',
};

const REWARD_TYPE_COLORS: Record<string, string> = {
  coins: Colors.warning,
  cash: Colors.success,
  voucher: Colors.primary,
  mixed: '#9B59B6',
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function InfluencerPage() {
  const router = useRouter();
  const user = useAuthUser();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [campaigns, setCampaigns] = useState<InfluencerCampaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<InfluencerCampaign[]>([]);
  const [earnings, setEarnings] = useState<Earnings>({
    totalEarnings: 0,
    pendingEarnings: 0,
    completedEarnings: 0,
    totalReferrals: 0,
  });
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCampaigns = useCallback(async () => {
    try {
      const response = await apiClient.get(`${MARKETING_SERVICE}/api/v1/influencer/campaigns`);

      if (response.success && response.data) {
        setCampaigns(response.data.campaigns || response.data);
        if (response.data.earnings) {
          setEarnings(response.data.earnings);
        }
      } else {
        const mockData = getMockCampaigns();
        setCampaigns(mockData);
      }
    } catch (error) {
      logger.error('Failed to fetch campaigns:', error);
      const mockData = getMockCampaigns();
      setCampaigns(mockData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  useEffect(() => {
    filterCampaigns();
  }, [campaigns, activeFilter, searchQuery]);

  const filterCampaigns = () => {
    let filtered = [...campaigns];

    if (activeFilter === 'available') {
      filtered = filtered.filter(c => !c.isParticipating);
    } else if (activeFilter === 'my_campaigns') {
      filtered = filtered.filter(c => c.isParticipating);
    } else if (activeFilter === 'completed') {
      filtered = filtered.filter(c => c.currentCount !== undefined && c.targetCount !== undefined && c.currentCount >= c.targetCount);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        c =>
          c.title.toLowerCase().includes(query) ||
          c.merchantName.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query)
      );
    }

    setFilteredCampaigns(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCampaigns();
    setRefreshing(false);
  };

  const handleJoinCampaign = (campaign: InfluencerCampaign) => {
    if (!user) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to join this campaign.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/sign-in') },
        ]
      );
      return;
    }

    setCampaigns(prev =>
      prev.map(c =>
        c.id === campaign.id ? { ...c, isParticipating: true } : c
      )
    );

    Alert.alert(
      'Campaign Joined!',
      `You have successfully joined "${campaign.title}". Start completing the requirements to earn your reward!`,
      [{ text: 'OK' }]
    );
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysRemaining = (endsAt: string): number => {
    const now = new Date();
    const end = new Date(endsAt);
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const renderHeader = () => (
    <View>
      {/* Earnings Summary */}
      <View style={styles.earningsSection}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={styles.earningsGradient}
        >
          <View style={styles.earningsHeader}>
            <View>
              <ThemedText type="caption" style={styles.earningsLabel}>
                Total Earnings
              </ThemedText>
              <ThemedText type="hero" style={styles.earningsValue}>
                Rs. {earnings.totalEarnings.toLocaleString()}
              </ThemedText>
            </View>
            <View style={styles.earningsBadge}>
              <Ionicons name="trending-up" size={20} color={Colors.primary} />
            </View>
          </View>

          <View style={styles.earningsStats}>
            <View style={styles.earningsStat}>
              <View style={[styles.statIcon, { backgroundColor: Colors.warning }]}>
                <Ionicons name="time" size={14} color={Colors.white} />
              </View>
              <View>
                <Text style={styles.statValue}>
                  Rs. {earnings.pendingEarnings.toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
            </View>

            <View style={styles.earningsStat}>
              <View style={[styles.statIcon, { backgroundColor: Colors.success }]}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.white} />
              </View>
              <View>
                <Text style={styles.statValue}>
                  Rs. {earnings.completedEarnings.toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
            </View>

            <View style={styles.earningsStat}>
              <View style={[styles.statIcon, { backgroundColor: Colors.primary }]}>
                <Ionicons name="people" size={14} color={Colors.white} />
              </View>
              <View>
                <Text style={styles.statValue}>{earnings.totalReferrals}</Text>
                <Text style={styles.statLabel}>Referrals</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search campaigns..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {[
          { key: 'all', label: 'All', icon: 'apps' },
          { key: 'available', label: 'Available', icon: 'flash' },
          { key: 'my_campaigns', label: 'My Campaigns', icon: 'heart' },
          { key: 'completed', label: 'Completed', icon: 'checkmark-circle' },
        ].map(filter => (
          <Pressable
            key={filter.key}
            style={[
              styles.filterTab,
              activeFilter === filter.key && styles.filterTabActive,
            ]}
            onPress={() => setActiveFilter(filter.key as FilterType)}
          >
            <Ionicons
              name={filter.icon as unknown}
              size={16}
              color={activeFilter === filter.key ? Colors.primary : Colors.textSecondary}
            />
            <ThemedText
              type="caption"
              style={[
                styles.filterTabText,
                activeFilter === filter.key && styles.filterTabTextActive,
              ]}
            >
              {filter.label}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  const renderCampaignCard = ({ item }: { item: InfluencerCampaign }) => {
    const daysRemaining = getDaysRemaining(item.endsAt);
    const progress = item.targetCount && item.currentCount !== undefined
      ? (item.currentCount / item.targetCount) * 100
      : 0;
    const rewardColor = REWARD_TYPE_COLORS[item.rewardType] || Colors.primary;

    return (
      <View style={styles.campaignCard}>
        {/* Header */}
        <View style={styles.campaignHeader}>
          <View style={styles.typeBadge}>
            <Ionicons
              name={CAMPAIGN_TYPE_ICONS[item.type] || 'pricetag'}
              size={14}
              color={Colors.primary}
            />
            <Text style={styles.typeText}>
              {CAMPAIGN_TYPE_LABELS[item.type] || item.type}
            </Text>
          </View>
          <View style={[styles.rewardBadge, { backgroundColor: `${rewardColor}20` }]}>
            <Ionicons
              name={item.rewardType === 'cash' ? 'cash' : item.rewardType === 'coins' ? 'wallet' : 'gift'}
              size={14}
              color={rewardColor}
            />
            <Text style={[styles.rewardText, { color: rewardColor }]}>
              {item.rewardValue || `${item.coinReward || 0} Coins`}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.campaignContent}>
          <Text style={styles.campaignTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.merchantName} numberOfLines={1}>
            {item.merchantName}
          </Text>
          <Text style={styles.campaignDescription} numberOfLines={2}>
            {item.description}
          </Text>
        </View>

        {/* Requirements */}
        {item.requirements && item.requirements.length > 0 && (
          <View style={styles.requirementsSection}>
            <Text style={styles.requirementsTitle}>Requirements:</Text>
            {item.requirements.slice(0, 2).map((req, index) => (
              <View key={index} style={styles.requirementItem}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                <Text style={styles.requirementText} numberOfLines={1}>
                  {req}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Progress */}
        {item.targetCount && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Goal Progress</Text>
              <Text style={styles.progressCount}>
                {item.currentCount || 0}/{item.targetCount}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(100, progress)}%`,
                    backgroundColor: progress >= 100 ? Colors.success : rewardColor,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.campaignFooter}>
          <View style={styles.expiryInfo}>
            <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.expiryText}>
              {daysRemaining > 0 ? `${daysRemaining} days left` : 'Ending today'}
            </Text>
          </View>

          {item.isParticipating ? (
            <View style={styles.joinedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={styles.joinedText}>Joined</Text>
            </View>
          ) : (
            <Pressable
              style={[styles.joinButton, { backgroundColor: rewardColor }]}
              onPress={() => handleJoinCampaign(item)}
            >
              <Text style={styles.joinButtonText}>Join Now</Text>
            </Pressable>
          )}
        </View>

        {/* Commission Info */}
        {item.commission && (
          <View style={styles.commissionBanner}>
            <Ionicons name="trending-up" size={14} color={Colors.success} />
            <Text style={styles.commissionText}>
              Earn {item.commission}% commission on referrals
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="campaign" size={64} color={Colors.border} />
      <ThemedText type="title" style={styles.emptyTitle}>
        No campaigns found
      </ThemedText>
      <ThemedText type="caption" style={styles.emptySubtitle}>
        {activeFilter === 'all'
          ? 'Check back later for new influencer campaigns'
          : `No ${activeFilter.replace('_', ' ')} campaigns available`}
      </ThemedText>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ title: 'Influencer' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <ThemedText type="caption" style={styles.loadingText}>
            Loading campaigns...
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ title: 'Influencer' }} />

      <FlatList
        data={filteredCampaigns}
        renderItem={renderCampaignCard}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getMockCampaigns(): InfluencerCampaign[] {
  return [
    {
      id: 'inf_1',
      title: 'Share Summer Collection on Instagram',
      description: 'Share our summer collection on your Instagram story or post and get rewarded!',
      merchantId: 'm1',
      merchantName: 'Trendy Fashions',
      category: 'fashion',
      type: 'social_share',
      rewardType: 'coins',
      rewardValue: '200 Coins',
      coinReward: 200,
      targetCount: 100,
      currentCount: 45,
      startsAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      endsAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      isParticipating: false,
      requirements: [
        'Must have minimum 500 followers',
        'Share on Instagram story or post',
        'Tag the brand account',
        'Use hashtag #TrendySummer',
      ],
      instructions: [
        'Take a photo or video of our summer collection',
        'Share it on your Instagram',
        'Tag @TrendyFashions and use the hashtag',
        'Submit your post link in the app',
      ],
    },
    {
      id: 'inf_2',
      title: 'Refer Friends to Food Paradise',
      description: 'Refer your friends to Food Paradise and earn cash rewards for each successful referral!',
      merchantId: 'm2',
      merchantName: 'Food Paradise',
      category: 'food',
      type: 'referral',
      rewardType: 'cash',
      rewardValue: 'Rs. 50',
      cashReward: 50,
      targetCount: 50,
      currentCount: 12,
      commission: 10,
      startsAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      endsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      isParticipating: true,
      requirements: [
        'Share your unique referral link',
        'Friend must make a purchase',
        'Minimum order value Rs. 200',
      ],
    },
    {
      id: 'inf_3',
      title: 'Write a Review for Coffee Culture',
      description: 'Visit Coffee Culture and share your experience through a detailed review.',
      merchantId: 'm3',
      merchantName: 'Coffee Culture',
      category: 'food',
      type: 'review',
      rewardType: 'mixed',
      rewardValue: '100 Coins + Rs. 25',
      coinReward: 100,
      cashReward: 25,
      targetCount: 30,
      currentCount: 28,
      startsAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      endsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      isParticipating: true,
      requirements: [
        'Must visit and make a purchase',
        'Write minimum 100 words review',
        'Upload a photo of your order',
      ],
    },
    {
      id: 'inf_4',
      title: 'Create Reel for Tech World Launch',
      description: 'Create an engaging reel showcasing Tech World\'s new product launch!',
      merchantId: 'm4',
      merchantName: 'Tech World',
      category: 'electronics',
      type: 'content',
      rewardType: 'voucher',
      rewardValue: 'Rs. 500 Voucher',
      maxParticipants: 20,
      startsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      endsAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      isParticipating: false,
      requirements: [
        'Create original content',
        'Minimum 15 seconds video',
        'Must feature product prominently',
        'Get minimum 1000 views',
      ],
      commission: 5,
    },
    {
      id: 'inf_5',
      title: 'Share Spa Day Special on WhatsApp',
      description: 'Share the Serenity Spa promotion with your WhatsApp contacts.',
      merchantId: 'm5',
      merchantName: 'Serenity Spa',
      category: 'beauty',
      type: 'social_share',
      rewardType: 'coins',
      rewardValue: '50 Coins',
      coinReward: 50,
      targetCount: 200,
      currentCount: 156,
      startsAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      isParticipating: false,
      requirements: [
        'Share via WhatsApp status or chat',
        'Must be shared from the app',
        'Keep the share for 24 hours',
      ],
    },
  ];
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    color: Colors.textSecondary,
  },
  earningsSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  earningsGradient: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  earningsLabel: {
    color: Colors.white,
    opacity: 0.8,
  },
  earningsValue: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 32,
  },
  earningsBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  earningsStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  earningsStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  statLabel: {
    color: Colors.white,
    opacity: 0.8,
    fontSize: 11,
  },
  searchSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 16,
    color: Colors.text,
  },
  filterContainer: {
    marginTop: Spacing.sm,
  },
  filterContent: {
    paddingHorizontal: Spacing.lg,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    gap: 6,
    marginRight: Spacing.sm,
  },
  filterTabActive: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  filterTabText: {
    color: Colors.textSecondary,
  },
  filterTabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 100,
  },
  campaignCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadows.md,
  },
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typeText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  rewardText: {
    fontSize: 12,
    fontWeight: '600',
  },
  campaignContent: {
    padding: Spacing.md,
  },
  campaignTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  merchantName: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  campaignDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  requirementsSection: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  requirementsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  requirementText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  progressSection: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  progressCount: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  campaignFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surfaceLight,
  },
  expiryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expiryText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  joinButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  joinButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 13,
  },
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  joinedText: {
    color: Colors.success,
    fontWeight: '600',
    fontSize: 13,
  },
  commissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.successLight,
    gap: 6,
  },
  commissionText: {
    color: Colors.success,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyTitle: {
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
});
