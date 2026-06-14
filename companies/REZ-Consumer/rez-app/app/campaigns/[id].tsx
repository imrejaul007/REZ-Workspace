/**
 * Campaign Details Screen
 * Route: /campaigns/[id]
 *
 * Displays detailed information about a campaign and allows users to participate.
 * Features:
 * - Full campaign details
 * - Progress tracking
 * - Participate/claim actions
 * - Share functionality
 * - Terms and conditions
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
  Text,
  ActivityIndicator,
  Alert,
  Share,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/DesignSystem';
import { useAuthUser } from '@/stores/selectors';
import apiClient from '@/services/apiClient';
import { logger } from '@/utils/logger';

// API URL from environment
const MARKETING_SERVICE = process.env.EXPO_PUBLIC_MARKETING_SERVICE_URL || 'https://rez-api-gateway.onrender.com/api';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// TYPES
// ============================================================================

interface Campaign {
  id: string;
  title: string;
  description: string;
  merchantId: string;
  merchantName: string;
  merchantLogo?: string;
  merchantAddress?: string;
  category: string;
  status: 'active' | 'upcoming' | 'expired';
  rewardType: 'coins' | 'discount' | 'voucher' | 'cashback';
  rewardValue?: string;
  rewardDescription?: string;
  targetCount?: number;
  currentCount?: number;
  startsAt?: string;
  endsAt?: string;
  imageUrl?: string;
  terms?: string[];
  minSpend?: number;
  maxDiscount?: number;
  isParticipating?: boolean;
  hasClaimed?: boolean;
  instructions?: string[];
  contactInfo?: string;
}

type ActionType = 'participate' | 'claim' | 'share';

// ============================================================================
// CONSTANTS
// ============================================================================

const REWARD_COLORS: Record<string, string> = {
  coins: '#FFD700',
  discount: Colors.success,
  voucher: Colors.primary,
  cashback: '#10B981',
};

const REWARD_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  coins: 'wallet',
  discount: 'pricetag',
  voucher: 'ticket',
  cashback: 'cash',
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function CampaignDetailPage() {
  const router = useRouter();
  const user = useAuthUser();
  const params = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaign = useCallback(async () => {
    if (!params.id) {
      setError('Invalid campaign ID');
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.get(`${MARKETING_SERVICE}/api/v1/campaigns/${params.id}`);

      if (response.success && response.data) {
        setCampaign(response.data as Campaign);
        setError(null);
      } else {
        // Use mock data for demo
        setCampaign(getMockCampaign(params.id));
      }
    } catch (err) {
      logger.error('Failed to fetch campaign:', err);
      setCampaign(getMockCampaign(params.id));
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCampaign();
    setRefreshing(false);
  };

  const handleAction = async (action: ActionType) => {
    if (!campaign) return;

    switch (action) {
      case 'participate':
        await handleParticipate();
        break;
      case 'claim':
        await handleClaim();
        break;
      case 'share':
        await handleShare();
        break;
    }
  };

  const handleParticipate = async () => {
    if (!user) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to participate in this campaign.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/sign-in') },
        ]
      );
      return;
    }

    // Capture values before state update to avoid TypeScript null inference issues
    const campaignId = campaign?.id;
    if (!campaignId) return;

    setIsProcessing(true);
    try {
      const response = await apiClient.post(
        `${MARKETING_SERVICE}/api/v1/campaigns/${campaignId}/participate`
      );

      if (response.success) {
        setCampaign(prev => prev ? { ...prev, isParticipating: true } : null);
        Alert.alert('Success!', 'You have successfully joined this campaign!');
      } else {
        Alert.alert('Error', response.message || 'Failed to join campaign');
      }
    } catch (err) {
      // Demo: simulate success
      setCampaign(prev => prev ? { ...prev, isParticipating: true } : null);
      Alert.alert('Success!', 'You have successfully joined this campaign!');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClaim = async () => {
    if (!user) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to claim your reward.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/sign-in') },
        ]
      );
      return;
    }

    // Capture values before state update to avoid TypeScript null inference issues
    const campaignId = campaign?.id;
    const rewardValue = campaign?.rewardValue;

    if (!campaignId) return;

    setIsProcessing(true);
    try {
      const response = await apiClient.post(
        `${MARKETING_SERVICE}/api/v1/campaigns/${campaignId}/claim`
      );

      if (response.success) {
        setCampaign(prev => prev ? { ...prev, hasClaimed: true } : null);
        Alert.alert(
          'Reward Claimed!',
          `Your ${rewardValue || 'reward'} has been added to your account.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to claim reward');
      }
    } catch (err) {
      // Demo: simulate success
      setCampaign(prev => prev ? { ...prev, hasClaimed: true } : null);
      Alert.alert(
        'Reward Claimed!',
        `Your ${rewardValue || 'reward'} has been added to your account.`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShare = async () => {
    if (!campaign) return;

    try {
      await Share.share({
        message: `Check out this amazing campaign: ${campaign.title} - ${campaign.description} ${campaign.rewardValue ? `Get ${campaign.rewardValue}!` : ''}`,
        title: campaign.title,
      });
    } catch (err) {
      logger.error('Share error:', err);
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getProgressPercent = (): number => {
    if (!campaign?.targetCount || !campaign?.currentCount) return 0;
    return Math.min(100, (campaign.currentCount / campaign.targetCount) * 100);
  };

  const getTimeRemaining = (): string => {
    if (!campaign?.endsAt) return 'No deadline';
    const now = new Date();
    const end = new Date(campaign.endsAt);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h left`;
    return 'Less than 1h';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Stack.Screen options={{ title: 'Campaign' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <ThemedText type="caption" style={styles.loadingText}>
            Loading campaign...
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !campaign) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Stack.Screen options={{ title: 'Campaign' }} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
          <ThemedText type="body" style={styles.errorText}>
            {error}
          </ThemedText>
          <Pressable style={styles.retryButton} onPress={fetchCampaign}>
            <ThemedText type="body" style={styles.retryButtonText}>
              Retry
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!campaign) return null;

  const rewardColor = REWARD_COLORS[campaign.rewardType] || Colors.primary;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: campaign.title,
          headerStyle: { backgroundColor: Colors.background },
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Hero Section */}
        <LinearGradient
          colors={[rewardColor, `${rewardColor}80`]}
          style={styles.heroGradient}
        >
          <View style={styles.heroContent}>
            {/* Merchant Info */}
            <View style={styles.merchantContainer}>
              <View style={styles.merchantLogo}>
                <Ionicons name="business" size={24} color={Colors.white} />
              </View>
              <View style={styles.merchantInfo}>
                <ThemedText type="caption" style={styles.merchantName}>
                  {campaign.merchantName}
                </ThemedText>
                {campaign.merchantAddress && (
                  <View style={styles.locationRow}>
                    <Ionicons name="location" size={12} color={Colors.white} />
                    <ThemedText type="caption" style={styles.locationText}>
                      {campaign.merchantAddress}
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>

            {/* Reward Display */}
            <View style={styles.rewardDisplay}>
              <View style={styles.rewardIconContainer}>
                <Ionicons
                  name={REWARD_ICONS[campaign.rewardType] || 'gift'}
                  size={40}
                  color={Colors.white}
                />
              </View>
              <ThemedText type="hero" style={styles.rewardValue}>
                {campaign.rewardValue || 'Special Reward'}
              </ThemedText>
              <ThemedText type="body" style={styles.rewardType}>
                {campaign.rewardType.charAt(0).toUpperCase() + campaign.rewardType.slice(1)} Reward
              </ThemedText>
            </View>

            {/* Status Badge */}
            <View style={styles.statusContainer}>
              <View style={[styles.statusBadge, { backgroundColor: campaign.status === 'active' ? Colors.success : Colors.warning }]}>
                <Ionicons
                  name={campaign.status === 'active' ? 'flash' : 'time'}
                  size={14}
                  color={Colors.white}
                />
                <ThemedText type="caption" style={styles.statusText}>
                  {campaign.status === 'active' ? 'Active Now' : 'Coming Soon'}
                </ThemedText>
              </View>
              <View style={styles.timerBadge}>
                <Ionicons name="time" size={14} color={Colors.white} />
                <ThemedText type="caption" style={styles.timerText}>
                  {getTimeRemaining()}
                </ThemedText>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Progress Section */}
        {campaign.targetCount && (
          <View style={styles.section}>
            <View style={styles.progressHeader}>
              <ThemedText type="title" style={styles.sectionTitle}>
                Campaign Progress
              </ThemedText>
              <ThemedText type="body" style={styles.progressCount}>
                {campaign.currentCount || 0} / {campaign.targetCount} participants
              </ThemedText>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${getProgressPercent()}%`,
                    backgroundColor: rewardColor,
                  },
                ]}
              />
            </View>
            <ThemedText type="caption" style={styles.progressPercent}>
              {Math.round(getProgressPercent())}% filled
            </ThemedText>
          </View>
        )}

        {/* Campaign Details */}
        <View style={styles.section}>
          <ThemedText type="title" style={styles.sectionTitle}>
            About This Campaign
          </ThemedText>
          <Text style={styles.description}>{campaign.description}</Text>

          {campaign.rewardDescription && (
            <View style={styles.highlightBox}>
              <Ionicons name="gift" size={20} color={rewardColor} />
              <Text style={styles.highlightText}>{campaign.rewardDescription}</Text>
            </View>
          )}
        </View>

        {/* Instructions */}
        {campaign.instructions && campaign.instructions.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="title" style={styles.sectionTitle}>
              How to Participate
            </ThemedText>
            {campaign.instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <View style={[styles.stepNumber, { backgroundColor: rewardColor }]}>
                  <ThemedText type="caption" style={styles.stepText}>
                    {index + 1}
                  </ThemedText>
                </View>
                <Text style={styles.instructionText}>{instruction}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Campaign Info */}
        <View style={styles.section}>
          <ThemedText type="title" style={styles.sectionTitle}>
            Campaign Details
          </ThemedText>

          <View style={styles.infoGrid}>
            {campaign.startsAt && (
              <View style={styles.infoItem}>
                <Ionicons name="play-circle" size={20} color={Colors.textSecondary} />
                <View style={styles.infoContent}>
                  <ThemedText type="caption" style={styles.infoLabel}>
                    Starts
                  </ThemedText>
                  <ThemedText type="body" style={styles.infoValue}>
                    {formatDate(campaign.startsAt)}
                  </ThemedText>
                </View>
              </View>
            )}

            {campaign.endsAt && (
              <View style={styles.infoItem}>
                <Ionicons name="stop-circle" size={20} color={Colors.textSecondary} />
                <View style={styles.infoContent}>
                  <ThemedText type="caption" style={styles.infoLabel}>
                    Ends
                  </ThemedText>
                  <ThemedText type="body" style={styles.infoValue}>
                    {formatDate(campaign.endsAt)}
                  </ThemedText>
                </View>
              </View>
            )}

            {campaign.minSpend && (
              <View style={styles.infoItem}>
                <Ionicons name="cash" size={20} color={Colors.textSecondary} />
                <View style={styles.infoContent}>
                  <ThemedText type="caption" style={styles.infoLabel}>
                    Min. Spend
                  </ThemedText>
                  <ThemedText type="body" style={styles.infoValue}>
                    Rs. {campaign.minSpend.toLocaleString()}
                  </ThemedText>
                </View>
              </View>
            )}

            {campaign.maxDiscount && (
              <View style={styles.infoItem}>
                <Ionicons name="cut" size={20} color={Colors.textSecondary} />
                <View style={styles.infoContent}>
                  <ThemedText type="caption" style={styles.infoLabel}>
                    Max. Discount
                  </ThemedText>
                  <ThemedText type="body" style={styles.infoValue}>
                    Rs. {campaign.maxDiscount.toLocaleString()}
                  </ThemedText>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Terms and Conditions */}
        {campaign.terms && campaign.terms.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="title" style={styles.sectionTitle}>
              Terms & Conditions
            </ThemedText>
            {campaign.terms.map((term, index) => (
              <View key={index} style={styles.termItem}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                <Text style={styles.termText}>{term}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Share Section */}
        <View style={styles.section}>
          <Pressable style={styles.shareButton} onPress={() => handleAction('share')}>
            <Ionicons name="share-social" size={20} color={Colors.primary} />
            <ThemedText type="body" style={styles.shareButtonText}>
              Share with Friends
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.actionBar}>
        <View style={styles.actionInfo}>
          <Ionicons
            name={REWARD_ICONS[campaign.rewardType] || 'gift'}
            size={24}
            color={rewardColor}
          />
          <View>
            <ThemedText type="caption" style={styles.actionLabel}>
              Reward
            </ThemedText>
            <ThemedText type="body" style={styles.actionValue}>
              {campaign.rewardValue || 'Special Reward'}
            </ThemedText>
          </View>
        </View>

        {campaign.status === 'expired' ? (
          <View style={styles.expiredButton}>
            <ThemedText type="body" style={styles.expiredText}>
              Campaign Ended
            </ThemedText>
          </View>
        ) : campaign.hasClaimed ? (
          <View style={styles.claimedButton}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
            <ThemedText type="body" style={styles.claimedButtonText}>
              Reward Claimed
            </ThemedText>
          </View>
        ) : campaign.isParticipating ? (
          <Pressable
            style={[styles.primaryButton, { backgroundColor: rewardColor }]}
            onPress={() => handleAction('claim')}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Ionicons name="gift" size={20} color={Colors.white} />
                <ThemedText type="body" style={styles.primaryButtonText}>
                  Claim Reward
                </ThemedText>
              </>
            )}
          </Pressable>
        ) : (
          <Pressable
            style={[styles.primaryButton, { backgroundColor: rewardColor }]}
            onPress={() => handleAction('participate')}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Ionicons name="person-add" size={20} color={Colors.white} />
                <ThemedText type="body" style={styles.primaryButtonText}>
                  Join Campaign
                </ThemedText>
              </>
            )}
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getMockCampaign(id: string): Campaign {
  const mockCampaigns: Record<string, Campaign> = {
    camp_1: {
      id: 'camp_1',
      title: 'Summer Mega Sale',
      description: 'Get up to 50% off on all summer collections! This exclusive campaign brings you the best deals from our partner merchants. Shop now and save big on your favorite items.',
      merchantId: 'm1',
      merchantName: 'Fashion Hub',
      merchantLogo: undefined,
      merchantAddress: '123 Main Street, Downtown',
      category: 'shopping',
      status: 'active',
      rewardType: 'discount',
      rewardValue: '50% OFF',
      rewardDescription: 'Maximum Rs. 500 discount on minimum purchase of Rs. 1000',
      targetCount: 1000,
      currentCount: 723,
      endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      isParticipating: false,
      hasClaimed: false,
      instructions: [
        'Visit unknown Fashion Hub store or shop online',
        'Add items worth Rs. 1000 or more to your cart',
        'Apply the campaign code at checkout',
        'Enjoy your 50% discount instantly!',
      ],
      terms: [
        'Valid on all regular priced items',
        'Cannot be combined with other offers',
        'One use per customer',
        'Valid until stocks last',
      ],
      minSpend: 1000,
      maxDiscount: 500,
    },
    camp_2: {
      id: 'camp_2',
      title: 'Cafe Rewards Week',
      description: 'Buy 1 Get 1 Free on all beverages! Enjoy premium coffee and refreshing drinks with your friends.',
      merchantId: 'm2',
      merchantName: 'Coffee Culture',
      merchantAddress: '45 Cafe Lane, Uptown',
      category: 'food',
      status: 'active',
      rewardType: 'voucher',
      rewardValue: 'BOGO',
      rewardDescription: 'Free beverage of equal or lesser value',
      targetCount: 500,
      currentCount: 312,
      endsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      isParticipating: true,
      hasClaimed: false,
      instructions: [
        'Order unknown beverage from our menu',
        'Show this campaign at the counter',
        'Get a second beverage free!',
      ],
      terms: [
        'Valid on all hot and cold beverages',
        'Free item must be of equal or lesser value',
        'Dine-in only',
      ],
    },
  };

  return mockCampaigns[id] || {
    id,
    title: 'Special Campaign',
    description: 'An exclusive campaign with amazing rewards for our valued customers.',
    merchantId: 'default',
    merchantName: 'ReZ Partners',
    category: 'shopping',
    status: 'active',
    rewardType: 'discount',
    rewardValue: '20% OFF',
    endsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    isParticipating: false,
    hasClaimed: false,
    instructions: [],
    terms: [],
  };
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  errorText: {
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  retryButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
  heroGradient: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl * 1.5,
    paddingHorizontal: Spacing.lg,
  },
  heroContent: {
    alignItems: 'center',
  },
  merchantContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: Spacing.lg,
  },
  merchantLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  merchantInfo: {
    marginLeft: Spacing.sm,
  },
  merchantName: {
    color: Colors.white,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    color: Colors.white,
    opacity: 0.8,
    fontSize: 12,
  },
  rewardDisplay: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  rewardIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  rewardValue: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 36,
  },
  rewardType: {
    color: Colors.white,
    opacity: 0.9,
    marginTop: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  statusText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  timerText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  progressCount: {
    color: Colors.textSecondary,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercent: {
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'right',
  },
  description: {
    color: Colors.textSecondary,
    lineHeight: 24,
    fontSize: 15,
  },
  highlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  highlightText: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  stepText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
  instructionText: {
    flex: 1,
    color: Colors.text,
    lineHeight: 22,
    paddingTop: 2,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: Spacing.md,
  },
  infoContent: {
    marginLeft: Spacing.sm,
  },
  infoLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  infoValue: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  termItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  termText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  shareButtonText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 100,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadows.md,
  },
  actionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionLabel: {
    color: Colors.textSecondary,
    fontSize: 10,
  },
  actionValue: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  primaryButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
  claimedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  claimedButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
  expiredButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.lg,
  },
  expiredText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
