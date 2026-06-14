// @ts-nocheck
/**
 * Loyalty Stamp Card Screen
 * Visual punch card for earning stamps towards free rewards
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { platformAlertSimple } from '@/utils/platformAlert';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView as SafeAreaViewContext } from 'react-native-safe-area-context';
import userLoyaltyApi from '@/services/userLoyaltyApi';
import { useGetCurrencySymbol } from '@/stores/selectors';
import { getCategoryTheme } from '@/config/categoryThemeConfig';
import { Colors, Spacing, BorderRadius } from '@/constants/DesignSystem';
import { useIsMounted } from '@/hooks/useIsMounted';
import { logger } from '@/utils/logger';

interface StampCardData {
  storeId: string;
  storeName: string;
  earnedStamps: number;
  requiredStamps: number;
  rewardValue: number;
  rewardDescription: string;
  isRewardReady: boolean;
  stampHistory: {
    date: string;
    billNumber: string;
    billAmount: number;
  }[];
}

export default function StampCardScreen() {
  const isMounted = useIsMounted();
  const router = useRouter();
  const { slug } = useLocalSearchParams<unknown>();
  const theme = getCategoryTheme(slug || 'food') as unknown;
  const getCurrencySymbol = useGetCurrencySymbol();
  const currencySymbol = getCurrencySymbol();

  const [stampCard, setStampCard] = useState<StampCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStampCard = useCallback(async () => {
    if (!slug) return;
    try {
      setLoading(true);
      const response = await (userLoyaltyApi as unknown).getStampCard(slug);
      if (response.success && response.data?.stampCard) {
        if (!isMounted()) return;
        setStampCard(response.data.stampCard);
      }
    } catch (error) {
      if (__DEV__) logger.error('[Stamp Card] Error fetching data:', error);
    } finally {
      if (!isMounted()) return;
      setLoading(false);
    }
  }, [slug, isMounted]);

  useFocusEffect(
    useCallback(() => {
      fetchStampCard();
    }, [fetchStampCard]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStampCard();
    if (!isMounted()) return;
    setRefreshing(false);
  }, [fetchStampCard, isMounted]);

  const handleClaimReward = async () => {
    if (!stampCard?.isRewardReady) return;

    try {
      const response = await (userLoyaltyApi as unknown).claimStampReward(stampCard.storeId);
      if (response.success) {
        platformAlertSimple(
          'Reward Claimed!',
          `You've claimed your reward worth ${currencySymbol}${stampCard.rewardValue}!`,
        );
        fetchStampCard();
      } else {
        platformAlertSimple('Error', response.message || 'Failed to claim reward');
      }
    } catch (error) {
      platformAlertSimple('Error', error?.message || 'Failed to claim reward');
    }
  };

  if (loading) {
    return (
      <SafeAreaViewContext style={styles.safeArea}>
        <LinearGradient colors={[theme.primaryLight, theme.primaryLighter]} style={StyleSheet.absoluteFillObject} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaViewContext>
    );
  }

  if (!stampCard) {
    return (
      <SafeAreaViewContext style={styles.safeArea}>
        <LinearGradient colors={[theme.primaryLight, theme.primaryLighter]} style={StyleSheet.absoluteFillObject} />
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={theme.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.primary }]}>Stamp Card</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="card-outline" size={48} color={theme.text.secondary} />
          <Text style={[styles.emptyText, { color: theme.text.primary }]}>No stamp card available</Text>
        </View>
      </SafeAreaViewContext>
    );
  }

  const stampPercentage = (stampCard.earnedStamps / stampCard.requiredStamps) * 100;
  const stampsRemaining = stampCard.requiredStamps - stampCard.earnedStamps;

  // Generate stamp grid
  const stamps = Array.from({ length: stampCard.requiredStamps }, (_, i) => i < stampCard.earnedStamps);

  return (
    <SafeAreaViewContext style={styles.safeArea}>
      <LinearGradient colors={[theme.primaryLight, theme.primaryLighter]} style={StyleSheet.absoluteFillObject} />

      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.primary }]}>Stamp Card</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />}
      >
        {/* Card Header */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.cardHeader}>
          <LinearGradient
            colors={[theme.primary, theme.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardHeaderGradient}
          >
            <View style={styles.cardHeaderContent}>
              <View style={styles.cardIconSection}>
                <Ionicons name="cafe" size={40} color="white" />
              </View>
              <View style={styles.cardTitleSection}>
                <Text style={styles.cardTitle}>Coffee Loyalty Card</Text>
                <Text style={styles.cardStoreName}>{stampCard.storeName}</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Stamp Grid */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.stampSection}>
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Collected Stamps</Text>

          <View style={styles.stampGrid}>
            {stamps.map((isEarned, index) => (
              <Animated.View key={index} entering={ZoomIn.delay(300 + index * 30)} style={styles.stampContainer}>
                <LinearGradient
                  colors={
                    isEarned
                      ? [theme.primary, theme.primaryDark]
                      : [theme.text.tertiary + '20', theme.text.tertiary + '10']
                  }
                  style={styles.stamp}
                >
                  {isEarned && <Ionicons name="checkmark" size={28} color="white" />}
                </LinearGradient>
              </Animated.View>
            ))}
          </View>

          <View style={styles.stampProgressRow}>
            <Text style={[styles.stampProgress, { color: theme.text.primary }]}>
              You've earned {stampCard.earnedStamps} of {stampCard.requiredStamps} stamps
            </Text>
          </View>

          {stampsRemaining > 0 && (
            <View style={styles.stampRemainingBox}>
              <Ionicons name="star-outline" size={18} color={theme.primary} />
              <Text style={[styles.stampRemainingText, { color: theme.primary }]}>
                {stampsRemaining} more {stampsRemaining === 1 ? 'visit' : 'visits'} to earn your reward!
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Reward Preview */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.rewardSection}>
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Your Reward</Text>

          <View
            style={[
              styles.rewardCard,
              {
                backgroundColor: stampCard.isRewardReady ? theme.success + '15' : theme.border + '10',
                borderColor: stampCard.isRewardReady ? theme.success : theme.border,
              },
            ]}
          >
            <View style={styles.rewardIconSection}>
              <LinearGradient colors={[theme.primary + '30', theme.primary + '10']} style={styles.rewardIconGradient}>
                <Ionicons name="gift" size={32} color={theme.primary} />
              </LinearGradient>
            </View>

            <View style={styles.rewardInfo}>
              <Text style={[styles.rewardLabel, { color: theme.text.secondary }]}>Reward</Text>
              <Text style={[styles.rewardDescription, { color: theme.text.primary }]}>
                {stampCard.rewardDescription}
              </Text>
              <Text style={[styles.rewardValue, { color: theme.primary }]}>
                worth {currencySymbol}
                {stampCard.rewardValue}
              </Text>
            </View>
          </View>

          {stampCard.isRewardReady && (
            <Animated.View entering={ZoomIn.delay(400)}>
              <TouchableOpacity
                style={[styles.claimButton, { backgroundColor: theme.primary }]}
                onPress={handleClaimReward}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={styles.claimButtonText}>Claim Reward</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>

        {/* Stamp History */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Stamp History</Text>
            <Text style={[styles.historySubtitle, { color: theme.text.secondary }]}>
              {stampCard.stampHistory.length} stamps
            </Text>
          </View>

          <View style={styles.historyList}>
            {stampCard.stampHistory.length > 0 ? (
              stampCard.stampHistory.map((entry, index) => (
                <Animated.View key={index} entering={FadeInDown.delay(450 + index * 50)} style={styles.historyItem}>
                  <View style={styles.historyItemLeft}>
                    <View style={[styles.historyCheckmark, { backgroundColor: theme.success + '20' }]}>
                      <Ionicons name="checkmark" size={16} color={theme.success} />
                    </View>
                    <View>
                      <Text style={[styles.historyDate, { color: theme.text.primary }]}>
                        {new Date(entry.date).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                      <Text style={[styles.historyBill, { color: theme.text.secondary }]}>
                        Bill #{entry.billNumber}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.historyAmount, { color: theme.primary }]}>
                    {currencySymbol}
                    {entry.billAmount}
                  </Text>
                </Animated.View>
              ))
            ) : (
              <View style={styles.emptyHistoryContainer}>
                <Text style={[styles.emptyHistoryText, { color: theme.text.secondary }]}>No stamp history yet</Text>
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaViewContext>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    paddingBottom: 40,
  },
  cardHeader: {
    marginBottom: 28,
  },
  cardHeaderGradient: {
    borderRadius: 16,
    padding: 20,
    overflow: 'hidden',
  },
  cardHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cardIconSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleSection: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  cardStoreName: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  stampSection: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  stampGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  stampContainer: {
    width: '20%',
    aspectRatio: 1,
  },
  stamp: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampProgressRow: {
    alignItems: 'center',
    marginBottom: 12,
  },
  stampProgress: {
    fontSize: 14,
    fontWeight: '600',
  },
  stampRemainingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  stampRemainingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  rewardSection: {
    marginBottom: 28,
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  rewardIconSection: {
    padding: 2,
  },
  rewardIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardInfo: {
    flex: 1,
  },
  rewardLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rewardDescription: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  rewardValue: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  claimButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
  historySection: {
    marginBottom: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historySubtitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  historyList: {
    gap: 10,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  historyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyCheckmark: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyDate: {
    fontSize: 13,
    fontWeight: '700',
  },
  historyBill: {
    fontSize: 11,
    marginTop: 2,
  },
  historyAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyHistoryContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyHistoryText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
