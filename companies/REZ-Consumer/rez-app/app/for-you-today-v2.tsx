// @ts-nocheck
/**
 * For You Today 2.0 - "3 Intelligent Daily Actions"
 *
 * Philosophy: Quality over quantity. One useful decision at a time.
 *
 * Instead of infinite scrolling chaos, users see exactly 3 smart cards:
 * 1. Save Money - A contextual saving opportunity
 * 2. Behavioral Insight - Understanding their patterns
 * 3. Lifestyle Action - A relevant nearby opportunity
 *
 * This is NOT a feed. It's REZ's daily intelligence briefing.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, SlideInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { useMemoryContinuity, MemoryEntry } from '@/hooks/useMemoryContinuity';
import { useTrendingItems, useFriendsActivity, useLiveActivities } from '@/hooks/useLiveActivity';
import { TrendingItem, FriendActivity, LiveActivity } from '@/services/liveActivityService';

// ============================================================================
// TYPES
// ============================================================================

interface SmartCard {
  id: string;
  type: 'savings' | 'insight' | 'action';
  priority: 'high' | 'medium' | 'low';
  title: string;
  subtitle: string;
  value: string;
  action: string;
  actionRoute: string;
  icon: string;
  backgroundColor: string;
  timestamp?: string;
}

interface DailyContext {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: string;
  location?: string;
}

// ============================================================================
// MOCK DATA GENERATOR
// ============================================================================

const generateDailyCards = (context: DailyContext): SmartCard[] => {
  const cards: SmartCard[] = [];

  // Time-aware greeting
  const timeGreeting = {
    morning: 'Good morning',
    afternoon: 'Good afternoon',
    evening: 'Good evening',
    night: 'Tonight',
  }[context.timeOfDay];

  // CARD 1: SAVINGS OPPORTUNITY (Always high priority)
  // Context-aware based on time
  if (context.timeOfDay === 'afternoon') {
    cards.push({
      id: 'lunch-savings',
      type: 'savings',
      priority: 'high',
      title: 'Lunchtime saving',
      subtitle: `You usually order around now. This nearby spot gives 20% cashback today.`,
      value: 'Save ₹80 on your usual order',
      action: 'Order Now',
      actionRoute: '/restaurant',
      icon: '🍽️',
      backgroundColor: '#E8F5E9',
      timestamp: '2 min ago',
    });
  } else if (context.timeOfDay === 'evening') {
    cards.push({
      id: 'dinner-savings',
      type: 'savings',
      priority: 'high',
      title: 'Dinner plans?',
      subtitle: `3 partner restaurants within 1km with 15%+ cashback.`,
      value: 'Average ₹120 savings',
      action: 'Browse Nearby',
      actionRoute: '/restaurant',
      icon: '🍜',
      backgroundColor: '#E8F5E9',
      timestamp: '5 min ago',
    });
  } else if (context.timeOfDay === 'morning') {
    cards.push({
      id: 'coffee-savings',
      type: 'savings',
      priority: 'high',
      title: 'Morning coffee run',
      subtitle: `Your usual café is 200m away and gives 10% cashback.`,
      value: 'Earn ₹25 in rewards',
      action: 'Get Directions',
      actionRoute: '/map',
      icon: '☕',
      backgroundColor: '#FFF3E0',
      timestamp: 'Just now',
    });
  } else {
    cards.push({
      id: 'weekend-planning',
      type: 'savings',
      priority: 'high',
      title: 'Weekend plans?',
      subtitle: `14 nearby experiences with cashback. Planning ahead saves more.`,
      value: 'Save up to ₹500 this weekend',
      action: 'Explore Deals',
      actionRoute: '/offers',
      icon: '🎯',
      backgroundColor: '#E8F5E9',
      timestamp: '1 hour ago',
    });
  }

  // CARD 2: BEHAVIORAL INSIGHT
  cards.push({
    id: 'behavioral-pattern',
    type: 'insight',
    priority: 'medium',
    title: 'Your spending pattern',
    subtitle: `You spent 18% more on dining this week compared to your usual.`,
    value: '₹840 above your average',
    action: 'View Details',
    actionRoute: '/transaction-history',
    icon: '📊',
    backgroundColor: '#E3F2FD',
    timestamp: 'This week',
  });

  // CARD 3: LIFESTYLE ACTION
  // Could be wellness, social, or discovery
  const dayOfWeek = new Date().getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  if (isWeekend) {
    cards.push({
      id: 'weekend-activity',
      type: 'action',
      priority: 'medium',
      title: 'Weekend activity',
      subtitle: `4 wellness partners near your area. 2 have first-visit bonuses.`,
      value: 'Try something new nearby',
      action: 'Explore',
      actionRoute: '/near-u',
      icon: '🌟',
      backgroundColor: '#FCE4EC',
      timestamp: 'Weekend special',
    });
  } else {
    cards.push({
      id: 'commute-savings',
      type: 'action',
      priority: 'medium',
      title: 'Commute smarter',
      subtitle: '2 rideshare options nearby. Cashback available on your usual route.',
      value: "Save ₹40 on today's commute",
      action: 'Book Ride',
      actionRoute: '/cab',
      icon: '🚗',
      backgroundColor: '#FCE4EC',
      timestamp: 'Today only',
    });
  }

  return cards;
};

// ============================================================================
// LIVE ACTIVITY STRIP
// ============================================================================

interface LiveActivityStripProps {
  activities: LiveActivity[];
}

function LiveActivityStrip({ activities }: LiveActivityStripProps) {
  if (!activities || activities.length === 0) return null;

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.liveStrip}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.liveStripContent}
      >
        {activities.slice(0, 5).map((activity, index) => (
          <View key={activity.id} style={styles.liveItem}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>
              {activity.count} people {activity.type === 'order' ? 'ordered' : activity.type === 'purchase' ? 'bought' : 'checked in'} in {activity.city}
            </Text>
          </View>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

// ============================================================================
// TRENDING ITEMS SECTION
// ============================================================================

interface TrendingSectionProps {
  items: TrendingItem[];
  loading: boolean;
}

function TrendingSection({ items, loading }: TrendingSectionProps) {
  if (loading || !items || items.length === 0) return null;

  const topItems = items.slice(0, 3);

  return (
    <Animated.View entering={FadeInDown.delay(400)} style={styles.trendingSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🔥 Trending Now</Text>
        <Pressable onPress={() => {}}>
          <Text style={styles.seeAllText}>See all</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.trendingScroll}
      >
        {topItems.map((item, index) => (
          <Pressable
            key={item.id}
            style={styles.trendingCard}
            onPress={() => {}}
          >
            <View style={styles.trendingRank}>
              <Text style={styles.trendingRankText}>#{index + 1}</Text>
            </View>
            <Text style={styles.trendingName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.trendingCategory}>{item.category}</Text>
            <View style={styles.trendingFooter}>
              <Text style={styles.trendingPrice}>₹{item.price}</Text>
              <View style={styles.cashbackBadge}>
                <Text style={styles.cashbackText}>{item.cashback}%</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

// ============================================================================
// FRIENDS ACTIVITY SECTION
// ============================================================================

interface FriendsActivitySectionProps {
  activities: FriendActivity[];
  loading: boolean;
}

function FriendsActivitySection({ activities, loading }: FriendsActivitySectionProps) {
  const router = useRouter();

  if (loading || !activities || activities.length === 0) return null;

  const recentActivities = activities.slice(0, 4);

  return (
    <Animated.View entering={FadeInDown.delay(500)} style={styles.friendsSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>👥 Friends Activity</Text>
        <Pressable onPress={() => router.push('/friends')}>
          <Text style={styles.seeAllText}>View all</Text>
        </Pressable>
      </View>
      <View style={styles.friendsList}>
        {recentActivities.map((activity) => (
          <View key={activity.id} style={styles.friendItem}>
            <View style={styles.friendAvatar}>
              <Text style={styles.friendInitial}>
                {activity.userName.charAt(0)}
              </Text>
            </View>
            <View style={styles.friendContent}>
              <Text style={styles.friendName}>{activity.userName}</Text>
              <Text style={styles.friendAction}>
                {activity.action === 'bought' ? 'bought' :
                 activity.action === 'reviewed' ? 'reviewed' :
                 activity.action === 'saved' ? 'saved' :
                 activity.action === 'visited' ? 'visited' : 'shared'}{' '}
                <Text style={styles.friendItemName}>{activity.itemName}</Text>
              </Text>
            </View>
            <Text style={styles.friendTime}>{activity.timestamp}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

// ============================================================================
// COMPONENTS
// ============================================================================

interface SmartActionCardProps {
  card: SmartCard;
  index: number;
  onPress: (route: string) => void;
}

function SmartActionCard({ card, index, onPress }: SmartActionCardProps) {
  const getTypeLabel = () => {
    switch (card.type) {
      case 'savings':
        return '💰 Save';
      case 'insight':
        return '📊 Insight';
      case 'action':
        return '✨ Action';
    }
  };

  const getPriorityColor = () => {
    switch (card.priority) {
      case 'high':
        return colors.success;
      case 'medium':
        return colors.brand.primary;
      case 'low':
        return colors.text.tertiary;
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 150).duration(400)}
      style={styles.cardContainer}
    >
      <View style={[styles.card, { backgroundColor: card.backgroundColor }]}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardMeta}>
            <Text style={styles.cardIcon}>{card.icon}</Text>
            <View>
              <Text style={styles.cardType}>{getTypeLabel()}</Text>
              {card.timestamp && (
                <Text style={styles.cardTimestamp}>{card.timestamp}</Text>
              )}
            </View>
          </View>
          <View
            style={[
              styles.priorityBadge,
              { backgroundColor: getPriorityColor() + '20' },
            ]}
          >
            <View
              style={[
                styles.priorityDot,
                { backgroundColor: getPriorityColor() },
              ]}
            />
          </View>
        </View>

        {/* Card Content */}
        <Text style={styles.cardTitle}>{card.title}</Text>
        <Text style={styles.cardSubtitle}>{card.subtitle}</Text>

        {/* Value Proposition */}
        <View style={styles.valueContainer}>
          <Text style={styles.valueText}>{card.value}</Text>
        </View>

        {/* Action Button */}
        <Pressable
          style={styles.actionButton}
          onPress={() => onPress(card.actionRoute)}
        >
          <Text style={styles.actionButtonText}>{card.action}</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.brand.primary} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

interface StreakReminderProps {
  streak: number;
  onDismiss: () => void;
}

function StreakReminder({ streak, onDismiss }: StreakReminderProps) {
  return (
    <Animated.View
      entering={SlideInRight.duration(400)}
      style={styles.streakContainer}
    >
      <View style={styles.streakContent}>
        <Text style={styles.streakIcon}>🔥</Text>
        <View style={styles.streakText}>
          <Text style={styles.streakTitle}>{streak} day streak!</Text>
          <Text style={styles.streakSubtitle}>
            Check in today to keep it going
          </Text>
        </View>
      </View>
      <Pressable style={styles.streakAction} onPress={onDismiss}>
        <Ionicons name="checkmark-circle" size={24} color={colors.success} />
      </Pressable>
    </Animated.View>
  );
}

interface RewardsSummaryProps {
  available: number;
  expiring: number;
  expiringDays: number;
}

function RewardsSummary({ available, expiring, expiringDays }: RewardsSummaryProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={styles.rewardsContainer}
    >
      <View style={styles.rewardsCard}>
        <View style={styles.rewardsMain}>
          <Text style={styles.rewardsIcon}>💎</Text>
          <View>
            <Text style={styles.rewardsLabel}>Available Rewards</Text>
            <Text style={styles.rewardsValue}>₹{available}</Text>
          </View>
        </View>
        {expiring > 0 && (
          <Pressable style={styles.expiringBadge}>
            <Text style={styles.expiringText}>
              ₹{expiring} expiring in {expiringDays} days
            </Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ForYouTodayV2() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [cards, setCards] = useState<SmartCard[]>([]);
  const [streak] = useState(7);
  const [showStreak, setShowStreak] = useState(true);
  const [rewards] = useState({ available: 840, expiring: 120, expiringDays: 5 });

  // Memory Continuity - REZ remembers so users don't have to
  const { memories, getMemoriesForContext, generateMemorySummary } = useMemoryContinuity();

  // Live Data - Real-time intelligence
  const { items: trendingItems, loading: trendingLoading } = useTrendingItems();
  const { activities: friendsActivity, loading: friendsLoading } = useFriendsActivity();
  const { activities: liveActivities, loading: liveLoading } = useLiveActivities();

  const getDailyContext = useCallback((): DailyContext => {
    const hour = new Date().getHours();
    let timeOfDay: DailyContext['timeOfDay'];

    if (hour >= 5 && hour < 12) {
      timeOfDay = 'morning';
    } else if (hour >= 12 && hour < 17) {
      timeOfDay = 'afternoon';
    } else if (hour >= 17 && hour < 21) {
      timeOfDay = 'evening';
    } else {
      timeOfDay = 'night';
    }

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return {
      timeOfDay,
      dayOfWeek: days[new Date().getDay()],
    };
  }, []);

  const loadCards = useCallback(() => {
    const context = getDailyContext();
    const newCards = generateDailyCards(context);
    setCards(newCards);
  }, [getDailyContext]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate refresh
    await new Promise((resolve) => setTimeout(resolve, 1000));
    loadCards();
    setRefreshing(false);
  }, [loadCards]);

  const handleCardPress = useCallback(
    (route: string) => {
      router.push(route as unknown);
    },
    [router]
  );

  const handleDismissStreak = useCallback(() => {
    setShowStreak(false);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 21) return 'Good evening';
    return 'Tonight';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'short',
            })}
          </Text>
        </View>
        <Pressable style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color={colors.text.primary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Live Activity Strip */}
        <LiveActivityStrip activities={liveActivities} />

        {/* Rewards Summary */}
        <RewardsSummary
          available={rewards.available}
          expiring={rewards.expiring}
          expiringDays={rewards.expiringDays}
        />

        {/* Streak Reminder */}
        {showStreak && streak > 0 && (
          <StreakReminder streak={streak} onDismiss={handleDismissStreak} />
        )}

        {/* Memory Continuity Section - REZ remembers */}
        {memories.length > 0 && (
          <Animated.View entering={FadeIn.delay(150)} style={styles.memorySection}>
            {/* Memory Recall - Natural memory references */}
            <View style={styles.memoryRecall}>
              <Text style={styles.memoryRecallIcon}>🧠</Text>
              <Text style={styles.memoryRecallText}>
                {generateMemorySummary() || "Based on your habits, here's what REZ noticed:"}
              </Text>
            </View>

            {/* Recent Memory Insights */}
            <View style={styles.memoryInsights}>
              {memories
                .filter((m) => m.type === 'savings' || m.type === 'behavior')
                .slice(0, 2)
                .map((memory) => (
                  <Pressable
                    key={memory.id}
                    style={styles.memoryInsightChip}
                    onPress={() => {
                      // Navigate based on memory category
                      const routes: Record<string, string> = {
                        dining: '/restaurant',
                        shopping: '/search',
                        travel: '/travel',
                        wellness: '/fitness',
                        finance: '/wallet',
                      };
                      router.push(routes[memory.category] || '/');
                    }}
                  >
                    <Text style={styles.memoryInsightIcon}>
                      {memory.category === 'dining' ? '🍽️' :
                       memory.category === 'shopping' ? '🛍️' :
                       memory.category === 'finance' ? '💰' : '✨'}
                    </Text>
                    <Text style={styles.memoryInsightText} numberOfLines={1}>
                      {memory.statement}
                    </Text>
                  </Pressable>
                ))}
            </View>
          </Animated.View>
        )}

        {/* Section Title */}
        <Animated.View entering={FadeIn.delay(200)} style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your smart actions today</Text>
          <Text style={styles.sectionSubtitle}>
            REZ found {cards.length} things just for you
          </Text>
        </Animated.View>

        {/* Smart Cards - Maximum 3 */}
        {cards.slice(0, 3).map((card, index) => (
          <SmartActionCard
            key={card.id}
            card={card}
            index={index}
            onPress={handleCardPress}
          />
        ))}

        {/* Trending Section */}
        <TrendingSection items={trendingItems} loading={trendingLoading} />

        {/* Friends Activity Section */}
        <FriendsActivitySection activities={friendsActivity as FriendActivity[]} loading={friendsLoading} />

        {/* Quick Actions */}
        <Animated.View entering={FadeIn.delay(600)} style={styles.quickActions}>
          <Text style={styles.quickTitle}>Quick actions</Text>
          <View style={styles.quickGrid}>
            <Pressable
              style={styles.quickButton}
              onPress={() => router.push('/scan')}
            >
              <Ionicons name="qr-code-outline" size={24} color={colors.brand.primary} />
              <Text style={styles.quickText}>Scan QR</Text>
            </Pressable>
            <Pressable
              style={styles.quickButton}
              onPress={() => router.push('/search')}
            >
              <Ionicons name="search-outline" size={24} color={colors.brand.primary} />
              <Text style={styles.quickText}>Search</Text>
            </Pressable>
            <Pressable
              style={styles.quickButton}
              onPress={() => router.push('/cart')}
            >
              <Ionicons name="cart-outline" size={24} color={colors.brand.primary} />
              <Text style={styles.quickText}>Cart</Text>
            </Pressable>
            <Pressable
              style={styles.quickButton}
              onPress={() => router.push('/ai-assistant')}
            >
              <Ionicons name="chatbubble-outline" size={24} color={colors.brand.primary} />
              <Text style={styles.quickText}>Ask AI</Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  greeting: {
    fontSize: typography.h3.fontSize,
    fontWeight: '700',
    color: colors.text.primary,
  },
  dateText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },

  // Rewards Summary
  rewardsContainer: {
    marginBottom: spacing.lg,
  },
  rewardsCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rewardsMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardsIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  rewardsLabel: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.tertiary,
  },
  rewardsValue: {
    fontSize: typography.h3.fontSize,
    fontWeight: '700',
    color: colors.text.primary,
  },
  expiringBadge: {
    backgroundColor: colors.warning + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  expiringText: {
    fontSize: typography.caption.fontSize,
    color: colors.warning,
    fontWeight: '600',
  },

  // Streak Reminder
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF3E0',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  streakText: {},
  streakTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
    color: colors.text.primary,
  },
  streakSubtitle: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.secondary,
  },
  streakAction: {
    padding: spacing.xs,
  },

  // Section Header
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.text.primary,
  },
  seeAllText: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
    color: colors.brand.purple,
  },
  sectionSubtitle: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },

  // Smart Cards
  cardContainer: {
    marginBottom: spacing.md,
  },
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 28,
    marginRight: spacing.sm,
  },
  cardType: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardTimestamp: {
    fontSize: typography.caption.fontSize,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  priorityBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    fontSize: typography.body.fontSize,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  valueContainer: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  valueText: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
  },
  actionButtonText: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
    color: colors.brand.primary,
    marginRight: spacing.xs,
  },

  // Quick Actions
  quickActions: {
    marginTop: spacing.lg,
  },
  quickTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  quickGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickButton: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  quickText: {
    fontSize: typography.caption.fontSize,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },

  // Memory Continuity Section
  memorySection: {
    marginBottom: spacing.lg,
    backgroundColor: colors.primary[100] + '10',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.brand.primary,
  },
  memoryRecall: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  memoryRecallIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  memoryRecallText: {
    flex: 1,
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.primary,
    lineHeight: 20,
  },
  memoryInsights: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  memoryInsightChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: borderRadius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    maxWidth: '100%',
  },
  memoryInsightIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  memoryInsightText: {
    fontSize: typography.caption.fontSize,
    color: colors.text.secondary,
    flex: 1,
  },

  // Live Activity Strip
  liveStrip: {
    backgroundColor: colors.brand.primary,
    marginHorizontal: -spacing.lg,
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
  },
  liveStripContent: {
    paddingHorizontal: spacing.lg,
  },
  liveItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: spacing.xs,
  },
  liveText: {
    fontSize: typography.caption.fontSize,
    color: '#FFF',
    fontWeight: '500',
  },

  // Trending Section
  trendingSection: {
    marginBottom: spacing.lg,
  },
  trendingScroll: {
    paddingVertical: spacing.sm,
  },
  trendingCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginRight: spacing.sm,
    width: 140,
  },
  trendingRank: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.brand.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  trendingRankText: {
    fontSize: typography.caption.fontSize,
    color: '#FFF',
    fontWeight: '700',
  },
  trendingName: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: 2,
  },
  trendingCategory: {
    fontSize: typography.caption.fontSize,
    color: colors.text.tertiary,
    marginBottom: spacing.sm,
  },
  trendingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trendingPrice: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '700',
    color: colors.text.primary,
  },
  cashbackBadge: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  cashbackText: {
    fontSize: typography.caption.fontSize,
    color: colors.success,
    fontWeight: '600',
  },

  // Friends Activity Section
  friendsSection: {
    marginBottom: spacing.lg,
  },
  friendsList: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  friendAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  friendInitial: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '700',
    color: colors.brand.primary,
  },
  friendContent: {
    flex: 1,
  },
  friendName: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
    color: colors.text.primary,
  },
  friendAction: {
    fontSize: typography.caption.fontSize,
    color: colors.text.tertiary,
  },
  friendItemName: {
    color: colors.text.secondary,
    fontWeight: '500',
  },
  friendTime: {
    fontSize: typography.caption.fontSize,
    color: colors.text.tertiary,
  },
});
