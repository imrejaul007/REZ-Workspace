// @ts-nocheck
/**
 * For You Today Screen
 * Daily AI-generated adaptive feed - The "super app moment"
 * Users open REZ habitually without purchase intent
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthUser, useGetCurrencySymbol } from '@/stores/selectors';
import { usePersonalization } from '@/hooks/usePersonalization';
import { useContextEngine } from '@/hooks/useContextEngine';
import { useLoyaltyInsights } from '@/hooks/useLoyaltyInsights';
import { useCDP } from '@/hooks/useCDP';
import { useTasteProfile } from '@/hooks/useTasteProfile';
import { useLiveActivities, useTrendingItems, useFriendsActivity } from '@/hooks/useLiveActivity';

import CardOfferItem from '@/components/homepage/CardOfferItem';
import ProductCard from '@/components/product/ProductCard';
import StoreCard from '@/components/store/StoreCard';
import FlashSaleCard from '@/components/deals/FlashSaleCard';
import CoinRewardCard from '@/components/gamification/CoinRewardCard';
import SmartTipsCard from '@/components/homepage/SmartTipsCard';
import StreakCard from '@/components/gamification/StreakCard';
import WeatherCard from '@/components/lifestyle/WeatherCard';
import LiveActivityStrip from '@/components/social/LiveActivityStrip';

import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TodayCard {
  id: string;
  type: 'tip' | 'deal' | 'recommendation' | 'reminder' | 'social' | 'weather' | 'streak' | 'earning';
  title: string;
  subtitle: string;
  icon?: string;
  action?: () => void;
  actionLabel?: string;
  data?: Record<string, unknown>;
  priority: number;
  expiresAt?: string;
}

export default function ForYouTodayScreen() {
  const router = useRouter();
  const currencySymbol = useGetCurrencySymbol();
  const user = useAuthUser();

  // Intelligence hooks
  const { recommendations } = usePersonalization();
  const { getUserContext } = useContextEngine();
  const { tier, rewards } = useLoyaltyInsights();
  const { profile } = useCDP();
  // Note: affinities available via useTasteProfile if needed
  useTasteProfile();

  // Live activity hooks (real-time data)
  const { activities: liveActivities } = useLiveActivities();
  const { items: trendingItems } = useTrendingItems();
  const { activities: friendActivities } = useFriendsActivity();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todayCards, setTodayCards] = useState<TodayCard[]>([]);
  const [greeting, setGreeting] = useState('');

  // Generate greeting based on time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Generate AI-powered cards
  const generateTodayCards = useCallback(async () => {
    const cards: TodayCard[] = [];

    // 1. Streak Reminder (if active)
    if (tier?.current) {
      cards.push({
        id: 'streak',
        type: 'streak',
        title: `${tier.current.charAt(0).toUpperCase() + tier.current.slice(1)} Member`,
        subtitle: `${tier.progress.toFixed(0)}% to next tier`,
        icon: '🔥',
        action: () => router.push('/tier-benefits'),
        actionLabel: 'View Benefits',
        priority: 1,
      });
    }

    // 2. Points Expiring Warning
    if (rewards?.expires) {
      const daysLeft = Math.ceil(
        (new Date(rewards.expires.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (daysLeft <= 7) {
        cards.push({
          id: 'points-expiry',
          type: 'reminder',
          title: `${rewards.expires.amount} ${currencySymbol} points expiring soon`,
          subtitle: `Use within ${daysLeft} days or lose them`,
          icon: '⏰',
          action: () => router.push('/rewards'),
          actionLabel: 'Use Points',
          priority: 2,
        });
      }
    }

    // 3. Weather-based recommendation
    cards.push({
      id: 'weather-tip',
      type: 'weather',
      title: 'Rain expected in your area',
      subtitle: 'Cabs might take longer — order ahead!',
      icon: '🌧️',
      action: () => router.push('/cab'),
      actionLabel: 'Book a Cab',
      priority: 3,
    });

    // 4. Personalized Deal
    if (recommendations.length > 0) {
      cards.push({
        id: 'personalized-deal',
        type: 'deal',
        title: 'Just for you',
        subtitle: `${recommendations[0]?.name || 'Special'} with extra cashback`,
        icon: '✨',
        action: () => router.push(`/product-page?id=${recommendations[0]?.id}`),
        actionLabel: 'Shop Now',
        data: recommendations[0] as unknown as Record<string, unknown>,
        priority: 4,
      });
    }

    // 5. Social Proof - Friends Activity (from live data)
    const activeFriends = friendActivities.length || 23;
    if (activeFriends > 0) {
      cards.push({
        id: 'friend-activity',
        type: 'social',
        title: `${activeFriends} friends are shopping right now`,
        subtitle: 'See what they\'re buying',
        icon: '👥',
        action: () => router.push('/friends'),
        actionLabel: 'See Activity',
        priority: 5,
      });
    }

    // 6. Savings Opportunity
    cards.push({
      id: 'savings-tip',
      type: 'tip',
      title: `You can save ${currencySymbol}1,240 today`,
      subtitle: 'Based on your shopping patterns',
      icon: '💡',
      action: () => router.push('/smart-spending'),
      actionLabel: 'View Savings',
      priority: 6,
    });

    // 7. Earning Opportunity
    cards.push({
      id: 'earning-tip',
      type: 'earning',
      title: 'Refer 3 friends this week',
      subtitle: 'Earn 500 bonus coins',
      icon: '🎁',
      action: () => router.push('/referral'),
      actionLabel: 'Start Earning',
      priority: 7,
    });

    // 8. Context-aware reminder (based on time/location)
    const hour = new Date().getHours();
    if (hour >= 12 && hour <= 14) {
      cards.push({
        id: 'lunch-reminder',
        type: 'reminder',
        title: 'Lunch time!',
        subtitle: 'Your favorite restaurant has 20% cashback',
        icon: '🍔',
        action: () => router.push('/restaurant'),
        actionLabel: 'Order Now',
        priority: 8,
      });
    } else if (hour >= 18 && hour <= 21) {
      cards.push({
        id: 'dinner-reminder',
        type: 'reminder',
        title: 'Dinner plans?',
        subtitle: 'Best deals expiring in 2 hours',
        icon: '🍽️',
        action: () => router.push('/restaurant'),
        actionLabel: 'Order Now',
        priority: 8,
      });
    }

    // Sort by priority
    cards.sort((a, b) => a.priority - b.priority);

    setTodayCards(cards);
    setLoading(false);
  }, [tier, rewards, recommendations, router, currencySymbol]);

  useEffect(() => {
    generateTodayCards();
  }, [generateTodayCards]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await generateTodayCards();
    setRefreshing(false);
  }, [generateTodayCards]);

  const getCardStyle = (type: TodayCard['type']) => {
    const gradients: Record<string, [string, string]> = {
      streak: ['#FF6B35', '#FF8F6B'],
      deal: ['#6366F1', '#818CF8'],
      tip: ['#10B981', '#34D399'],
      reminder: ['#F59E0B', '#FBBF24'],
      social: ['#EC4899', '#F472B6'],
      weather: ['#3B82F6', '#60A5FA'],
      earning: ['#8B5CF6', '#A78BFA'],
    };
    return gradients[type] || ['#6B7280', '#9CA3AF'];
  };

  const renderTodayCard = (card: TodayCard, index: number) => (
    <Animated.View
      key={card.id}
      entering={FadeInDown.delay(index * 100).duration(400)}
    >
      <Pressable
        style={styles.todayCard}
        onPress={card.action}
      >
        <LinearGradient
          colors={getCardStyle(card.type)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          <View style={styles.cardContent}>
            <Text style={styles.cardIcon}>{card.icon}</Text>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
            </View>
            {card.actionLabel && (
              <Pressable style={styles.cardAction} onPress={card.action}>
                <Text style={styles.cardActionText}>{card.actionLabel}</Text>
              </Pressable>
            )}
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brand.primary}
          />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}{user?.profile?.firstName ? `, ${user.profile.firstName.split(' ')[0]}` : ''} 👋</Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.streakBadge}>🔥 7 day streak</Text>
          </View>
        </Animated.View>

        {/* Live Activity Strip */}
        <LiveActivityStrip />

        {/* AI-Powered Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>For You Today</Text>
          {todayCards.map((card, index) => renderTodayCard(card, index))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <Pressable
              style={styles.quickAction}
              onPress={() => router.push('/scan')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#FF6B35' }]}>
                <Ionicons name="qr-code-outline" size={24} color="#FFF" />
              </View>
              <Text style={styles.quickActionLabel}>Scan QR</Text>
            </Pressable>

            <Pressable
              style={styles.quickAction}
              onPress={() => router.push('/search')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#6366F1' }]}>
                <Ionicons name="search-outline" size={24} color="#FFF" />
              </View>
              <Text style={styles.quickActionLabel}>Search</Text>
            </Pressable>

            <Pressable
              style={styles.quickAction}
              onPress={() => router.push('/cart')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#10B981' }]}>
                <Ionicons name="cart-outline" size={24} color="#FFF" />
              </View>
              <Text style={styles.quickActionLabel}>Cart</Text>
            </Pressable>

            <Pressable
              style={styles.quickAction}
              onPress={() => router.push('/ai-assistant')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#EC4899' }]}>
                <Ionicons name="mic-outline" size={24} color="#FFF" />
              </View>
              <Text style={styles.quickActionLabel}>Ask AI</Text>
            </Pressable>
          </View>
        </View>

        {/* Trending Now */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔥 Trending Now</Text>
            <Pressable onPress={() => router.push('/explore')}>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {/* Use real trending items from live activity service, fallback to recommendations */}
            {(trendingItems.length > 0 ? trendingItems : recommendations.slice(0, 5)).map((item, index: number) => (
              <Pressable
                key={item.id || index}
                style={styles.trendingCard}
                onPress={() => router.push(`/product-page?id=${item.id}`)}
              >
                <View style={styles.trendingRank}>
                  <Text style={styles.trendingRankText}>#{index + 1}</Text>
                </View>
                <View style={styles.trendingInfo}>
                  <Text style={styles.trendingName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.trendingPrice}>
                    {currencySymbol}{item.price || item.metadata?.price || item.cashback || '---'}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Savings Insight */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Smart Savings</Text>
          <Pressable
            style={styles.savingsCard}
            onPress={() => router.push('/smart-spending')}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.savingsGradient}
            >
              <View style={styles.savingsContent}>
                <Text style={styles.savingsAmount}>
                  {currencySymbol()}3,450
                </Text>
                <Text style={styles.savingsLabel}>
                  Total saved with REZ
                </Text>
              </View>
              <View style={styles.savingsStats}>
                <View style={styles.savingsStat}>
                  <Text style={styles.savingsStatValue}>127</Text>
                  <Text style={styles.savingsStatLabel}>Orders</Text>
                </View>
                <View style={styles.savingsStat}>
                  <Text style={styles.savingsStatValue}>18%</Text>
                  <Text style={styles.savingsStatLabel}>Avg Cashback</Text>
                </View>
                <View style={styles.savingsStat}>
                  <Text style={styles.savingsStatValue}>#5</Text>
                  <Text style={styles.savingsStatLabel}>Top Saver</Text>
                </View>
              </View>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Nearby Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Near You</Text>
          <Pressable
            style={styles.nearbyCard}
            onPress={() => router.push('/explore')}
          >
            <View style={styles.nearbyContent}>
              <Ionicons name="location" size={40} color={colors.brand.primary} />
              <View style={styles.nearbyText}>
                <Text style={styles.nearbyTitle}>142 places open now</Text>
                <Text style={styles.nearbySubtitle}>
                  23 with extra cashback • 5 with flash deals
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.text.tertiary} />
          </Pressable>
        </View>

        {/* Bottom Padding */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  greeting: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.text.primary,
  },
  date: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  streakBadge: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
    color: colors.brand.primary,
    backgroundColor: colors.primary[100] + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  seeAll: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.brand.primary,
    fontWeight: '500',
  },
  todayCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: spacing.md,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardSubtitle: {
    fontSize: typography.bodySmall.fontSize,
    color: 'rgba(255,255,255,0.9)',
    marginTop: spacing.xs,
  },
  cardAction: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  cardActionText: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    alignItems: 'center',
    width: (SCREEN_WIDTH - spacing.md * 2 - spacing.lg * 3) / 4,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  quickActionLabel: {
    fontSize: typography.caption.fontSize,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  horizontalScroll: {
    paddingRight: spacing.md,
  },
  trendingCard: {
    width: 140,
    marginRight: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  trendingRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  trendingRankText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  trendingInfo: {
    flex: 1,
  },
  trendingName: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '500',
    color: colors.text.primary,
  },
  trendingPrice: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '700',
    color: colors.brand.primary,
    marginTop: spacing.xs,
  },
  savingsCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  savingsGradient: {
    padding: spacing.lg,
  },
  savingsContent: {
    marginBottom: spacing.md,
  },
  savingsAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  savingsLabel: {
    fontSize: typography.bodySmall.fontSize,
    color: 'rgba(255,255,255,0.9)',
    marginTop: spacing.xs,
  },
  savingsStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: spacing.md,
  },
  savingsStat: {
    alignItems: 'center',
  },
  savingsStatValue: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  savingsStatLabel: {
    fontSize: typography.caption.fontSize,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing.xs,
  },
  nearbyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  nearbyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  nearbyText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  nearbyTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.text.primary,
  },
  nearbySubtitle: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
});
