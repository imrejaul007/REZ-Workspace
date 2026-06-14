// @ts-nocheck
import { withErrorBoundary } from '@/utils/withErrorBoundary';
/**
 * Campaign Screen
 * Route: /campaign/[campaignId]
 *
 * Displays a specific ad campaign when scanned from a QR code.
 * Shows campaign details and allows users to claim rewards.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import apiClient from '@/services/apiClient';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import { useIsMounted } from '@/hooks/useIsMounted';
import { useIsAuthenticated } from '@/stores/selectors';

type RewardType = 'coins' | 'discount' | 'sample' | 'consultation' | 'contest';

interface CampaignInfo {
  campaignId: string;
  title: string;
  description: string;
  merchantName?: string;
  merchantId?: string;
  adId?: string;
  rewardType: RewardType;
  rewardValue?: string;
  expiresAt?: string;
  terms?: string[];
  imageUrl?: string;
  isClaimed?: boolean;
}

const REWARD_ICONS: Record<RewardType, keyof typeof Ionicons.glyphMap> = {
  coins: 'wallet-outline',
  discount: 'pricetag-outline',
  sample: 'gift-outline',
  consultation: 'call-outline',
  contest: 'trophy-outline',
};

const REWARD_COLORS: Record<RewardType, string> = {
  coins: '#FFD700',
  discount: Colors.success,
  sample: Colors.brand.purple,
  consultation: Colors.info,
  contest: Colors.warning,
};

const CampaignScreen: React.FC = () => {
  const isMounted = useIsMounted();
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const params = useLocalSearchParams<{
    campaignId: string;
    rewardType: RewardType;
    adId?: string;
    merchantId?: string;
  }>();

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campaignInfo, setCampaignInfo] = useState<CampaignInfo | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);

  const fetchCampaign = useCallback(async () => {
    if (!params.campaignId) {
      setError('Invalid campaign QR code.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.get(`/campaigns/${params.campaignId}`);

      if (response.success && response.data) {
        if (!isMounted()) return;
        setCampaignInfo({
          ...(response.data as Omit<CampaignInfo, 'rewardType'>),
          rewardType: (response.data as unknown).rewardType || params.rewardType || 'discount',
        });
        setError(null);
      } else {
        if (!isMounted()) return;
        // Use mock data for demo when API not available
        setCampaignInfo({
          campaignId: params.campaignId,
          title: 'Special Offer',
          description: `You've unlocked an exclusive ${params.rewardType || 'reward'}! Claim it now and enjoy special benefits at our partner merchants.`,
          merchantName: 'ReZ Partner Network',
          rewardType: params.rewardType || 'discount',
          rewardValue: params.rewardType === 'coins' ? '100' : params.rewardType === 'discount' ? '20%' : undefined,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          terms: [
            'Valid for new users only',
            'One claim per user',
            'Subject to merchant availability',
            'Cannot be combined with other offers',
          ],
        });
      }
    } catch (err) {
      if (!isMounted()) return;
      // Use mock data on error for demo
      setCampaignInfo({
        campaignId: params.campaignId,
        title: 'Special Offer',
        description: `You've unlocked an exclusive ${params.rewardType || 'reward'}! Claim it now and enjoy special benefits at our partner merchants.`,
        merchantName: 'ReZ Partner Network',
        rewardType: params.rewardType || 'discount',
        rewardValue: params.rewardType === 'coins' ? '100' : params.rewardType === 'discount' ? '20%' : undefined,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        terms: [
          'Valid for new users only',
          'One claim per user',
          'Subject to merchant availability',
          'Cannot be combined with other offers',
        ],
      });
    } finally {
      if (isMounted()) {
        setIsLoading(false);
      }
    }
  }, [params, isMounted]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCampaign();
    setRefreshing(false);
  }, [fetchCampaign]);

  const handleClaimReward = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        'Please sign in or create an account to claim this reward.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/account/login') },
        ]
      );
      return;
    }

    setIsClaiming(true);
    try {
      const response = await apiClient.post(`/campaigns/${params.campaignId}/claim`);

      if (response.success) {
        setCampaignInfo((prev) => (prev ? { ...prev, isClaimed: true } : null));
        Alert.alert('Success!', 'Your reward has been claimed successfully!', [
          { text: 'OK' },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to claim reward. Please try again.');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to claim reward. Please try again.');
    } finally {
      setIsClaiming(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this exclusive ${campaignInfo?.rewardType} offer from ${campaignInfo?.merchantName}! Use code: ${params.campaignId}`,
        title: campaignInfo?.title,
      });
    } catch (err) {
      // Handle share error silently
    }
  };

  const formatExpiryDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Campaign' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading campaign...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !campaignInfo) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Campaign' }} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={fetchCampaign}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: campaignInfo?.title || 'Campaign',
          headerStyle: { backgroundColor: colors.background.primary },
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Campaign Hero */}
        <LinearGradient
          colors={[REWARD_COLORS[campaignInfo?.rewardType || 'discount'], `${REWARD_COLORS[campaignInfo?.rewardType || 'discount']}80`]}
          style={styles.heroGradient}
        >
          <View style={styles.heroContent}>
            <View style={styles.rewardIconContainer}>
              <Ionicons
                name={REWARD_ICONS[campaignInfo?.rewardType || 'discount']}
                size={48}
                color={Colors.white}
              />
            </View>
            <Text style={styles.heroTitle}>{campaignInfo?.title}</Text>
            {campaignInfo?.rewardValue && (
              <Text style={styles.rewardValue}>{campaignInfo.rewardValue}</Text>
            )}
            <Text style={styles.rewardTypeLabel}>
              {campaignInfo?.rewardType?.charAt(0).toUpperCase()}
              {campaignInfo?.rewardType?.slice(1)} Reward
            </Text>
          </View>
        </LinearGradient>

        {/* Campaign Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About This Offer</Text>
          <Text style={styles.description}>{campaignInfo?.description}</Text>

          {campaignInfo?.merchantName && (
            <View style={styles.merchantInfo}>
              <Ionicons name="business-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.merchantText}>{campaignInfo.merchantName}</Text>
            </View>
          )}

          {campaignInfo?.expiresAt && (
            <View style={styles.expiryInfo}>
              <Ionicons name="time-outline" size={20} color={Colors.warning} />
              <Text style={styles.expiryText}>
                Expires {formatExpiryDate(campaignInfo.expiresAt)}
              </Text>
            </View>
          )}
        </View>

        {/* Terms and Conditions */}
        {campaignInfo?.terms && campaignInfo.terms.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Terms & Conditions</Text>
            {campaignInfo.terms.map((term, index) => (
              <View key={index} style={styles.termItem}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                <Text style={styles.termText}>{term}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Claim Button */}
        <View style={styles.claimSection}>
          {campaignInfo?.isClaimed ? (
            <View style={styles.claimedContainer}>
              <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
              <Text style={styles.claimedText}>Reward Claimed!</Text>
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.claimButton,
                pressed && styles.claimButtonPressed,
                isClaiming && styles.claimButtonDisabled,
              ]}
              onPress={handleClaimReward}
              disabled={isClaiming}
            >
              {isClaiming ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="gift" size={24} color={Colors.white} />
                  <Text style={styles.claimButtonText}>Claim Reward</Text>
                </>
              )}
            </Pressable>
          )}
        </View>

        {/* Share Section */}
        <View style={styles.shareSection}>
          <Text style={styles.shareTitle}>Share with Friends</Text>
          <Pressable style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={20} color={Colors.primary} />
            <Text style={styles.shareButtonText}>Share Campaign</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
    color: colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  errorText: {
    ...Typography.body,
    color: colors.text.secondary,
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
    ...Typography.button,
    color: Colors.white,
  },
  heroGradient: {
    paddingVertical: Spacing.xl * 2,
    paddingHorizontal: Spacing.lg,
  },
  heroContent: {
    alignItems: 'center',
  },
  rewardIconContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  heroTitle: {
    ...Typography.h2,
    color: Colors.white,
    textAlign: 'center',
  },
  rewardValue: {
    ...Typography.h1,
    color: Colors.white,
    fontWeight: '700',
    marginTop: Spacing.sm,
  },
  rewardTypeLabel: {
    ...Typography.body,
    color: Colors.white,
    opacity: 0.9,
    marginTop: Spacing.xs,
  },
  section: {
    padding: Spacing.lg,
    backgroundColor: colors.background.primary,
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.h4,
    color: colors.text.primary,
    marginBottom: Spacing.md,
  },
  description: {
    ...Typography.body,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  merchantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  merchantText: {
    ...Typography.body,
    color: colors.text.secondary,
  },
  expiryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  expiryText: {
    ...Typography.body,
    color: Colors.warning,
  },
  termItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  termText: {
    ...Typography.body,
    color: colors.text.secondary,
    flex: 1,
  },
  claimSection: {
    padding: Spacing.lg,
  },
  claimButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    ...Shadows.md,
  },
  claimButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  claimButtonDisabled: {
    opacity: 0.7,
  },
  claimButtonText: {
    ...Typography.button,
    color: Colors.white,
    fontSize: 18,
  },
  claimedContainer: {
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: colors.greenMist,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  claimedText: {
    ...Typography.h4,
    color: Colors.success,
  },
  shareSection: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  shareTitle: {
    ...Typography.body,
    color: colors.text.secondary,
    marginBottom: Spacing.md,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  shareButtonText: {
    ...Typography.button,
    color: Colors.primary,
  },
});

export default withErrorBoundary(CampaignScreen, 'CampaignScreen');
