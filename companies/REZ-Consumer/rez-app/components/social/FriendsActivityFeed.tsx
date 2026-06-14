/**
 * Social Proof Components
 * Shows friends activity, community recommendations, trending in area
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';

interface FriendActivity {
  id: string;
  user: {
    name: string;
    avatar?: string;
    badge?: string;
  };
  action: 'bought' | 'reviewed' | 'saved' | 'visited' | 'shared';
  item: {
    name: string;
    image?: string;
    price?: number;
  };
  store?: {
    name: string;
  };
  timeAgo: string;
  cashback?: number;
}

interface FriendsActivityFeedProps {
  activities: FriendActivity[];
  title?: string;
}

export function FriendsActivityFeed({
  activities,
  title = 'Friends Activity'
}: FriendsActivityFeedProps) {
  const router = useRouter();

  const getActionIcon = (action: FriendActivity['action']) => {
    const icons: Record<string, string> = {
      bought: '🛒',
      reviewed: '⭐',
      saved: '❤️',
      visited: '📍',
      shared: '📤',
    };
    return icons[action] || '📌';
  };

  const getActionText = (action: FriendActivity['action'], itemName: string) => {
    const texts: Record<string, string> = {
      bought: `bought ${itemName}`,
      reviewed: `reviewed ${itemName}`,
      saved: `saved ${itemName}`,
      visited: `visited ${itemName}`,
      shared: `shared ${itemName}`,
    };
    return texts[action] || `interacted with ${itemName}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Pressable onPress={() => router.push('/friends')}>
          <Text style={styles.seeAll}>See all</Text>
        </Pressable>
      </View>
      {activities.map((activity, index) => (
        <Animated.View
          key={activity.id}
          entering={FadeInRight.delay(index * 100).duration(300)}
          style={styles.activityItem}
        >
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {activity.user.avatar ? (
              <Image source={{ uri: activity.user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {activity.user.name.charAt(0)}
                </Text>
              </View>
            )}
            {activity.user.badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activity.user.badge}</Text>
              </View>
            )}
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.userName}>{activity.user.name}</Text>
            <Text style={styles.actionText}>
              {getActionIcon(activity.action)} {getActionText(activity.action, activity.item.name)}
            </Text>
            {activity.store && (
              <Text style={styles.storeName}>at {activity.store.name}</Text>
            )}
            <Text style={styles.timeAgo}>{activity.timeAgo}</Text>
          </View>

          {/* Item Preview */}
          {activity.item.image && (
            <Pressable
              style={styles.itemPreview}
              onPress={() => router.push(`/product-page?id=${activity.id}`)}
            >
              <Image source={{ uri: activity.item.image }} style={styles.itemImage} />
              {activity.cashback && (
                <View style={styles.cashbackBadge}>
                  <Text style={styles.cashbackText}>{activity.cashback}% CB</Text>
                </View>
              )}
            </Pressable>
          )}
        </Animated.View>
      ))}
    </View>
  );
}

// Friend Recommendation Card
interface FriendRecommendationProps {
  friend: {
    id: string;
    name: string;
    avatar?: string;
    title: string;
    mutualFriends: number;
  };
  onFollow?: () => void;
}

export function FriendRecommendation({ friend, onFollow }: FriendRecommendationProps) {
  return (
    <View style={styles.recommendationCard}>
      <View style={styles.recommendationAvatar}>
        {friend.avatar ? (
          <Image source={{ uri: friend.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>{friend.name.charAt(0)}</Text>
          </View>
        )}
      </View>
      <Text style={styles.recommendationName}>{friend.name}</Text>
      <Text style={styles.recommendationTitle}>{friend.title}</Text>
      {friend.mutualFriends > 0 && (
        <Text style={styles.mutualFriends}>{friend.mutualFriends} mutual friends</Text>
      )}
      <Pressable style={styles.followButton} onPress={onFollow}>
        <Text style={styles.followButtonText}>Follow</Text>
      </Pressable>
    </View>
  );
}

// Trending in Area Card
interface TrendingInAreaProps {
  title: string;
  items: {
    id: string;
    name: string;
    orderCount: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  onItemPress?: (id: string) => void;
}

export function TrendingInArea({ title, items, onItemPress }: TrendingInAreaProps) {
  return (
    <View style={styles.trendingContainer}>
      <View style={styles.header}>
        <Ionicons name="trending-up" size={20} color={colors.brand.primary} />
        <Text style={styles.trendingTitle}>{title}</Text>
      </View>
      {items.slice(0, 5).map((item, index) => (
        <Pressable
          key={item.id}
          style={styles.trendingItem}
          onPress={() => onItemPress?.(item.id)}
        >
          <Text style={styles.trendingRank}>#{index + 1}</Text>
          <Text style={styles.trendingName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.trendingStats}>
            <Text style={styles.trendingCount}>{item.orderCount} orders</Text>
            <Ionicons
              name={item.trend === 'up' ? 'arrow-up' : item.trend === 'down' ? 'arrow-down' : 'remove'}
              size={12}
              color={item.trend === 'up' ? colors.success : item.trend === 'down' ? colors.error : colors.text.tertiary}
            />
          </View>
        </Pressable>
      ))}
    </View>
  );
}

// Top Buyers Nearby
interface TopBuyersNearbyProps {
  buyers: {
    id: string;
    name: string;
    avatar?: string;
    orderCount: number;
    tier: string;
  }[];
}

export function TopBuyersNearby({ buyers }: TopBuyersNearbyProps) {
  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      bronze: '#CD7F32',
      silver: '#C0C0C0',
      gold: '#FFD700',
      platinum: '#E5E4E2',
    };
    return colors[tier.toLowerCase()] || colors.bronze;
  };

  return (
    <View style={styles.topBuyersContainer}>
      <View style={styles.header}>
        <Ionicons name="trophy" size={20} color={colors.gold} />
        <Text style={styles.topBuyersTitle}>Top Buyers Nearby</Text>
      </View>
      {buyers.slice(0, 3).map((buyer, index) => (
        <View key={buyer.id} style={styles.buyerItem}>
          <View style={styles.buyerRank}>
            {index === 0 && <Text style={styles.buyerMedal}>🥇</Text>}
            {index === 1 && <Text style={styles.buyerMedal}>🥈</Text>}
            {index === 2 && <Text style={styles.buyerMedal}>🥉</Text>}
            {index > 2 && <Text style={styles.buyerRankText}>#{index + 1}</Text>}
          </View>
          {buyer.avatar ? (
            <Image source={{ uri: buyer.avatar }} style={styles.buyerAvatar} />
          ) : (
            <View style={[styles.buyerAvatarPlaceholder, { borderColor: getTierColor(buyer.tier) }]}>
              <Text style={styles.buyerInitial}>{buyer.name.charAt(0)}</Text>
            </View>
          )}
          <View style={styles.buyerInfo}>
            <Text style={styles.buyerName}>{buyer.name}</Text>
            <Text style={styles.buyerStats}>{buyer.orderCount} orders this month</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.text.primary,
  },
  seeAll: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.brand.primary,
    fontWeight: '500',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  badge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.brand.purple,
    borderRadius: borderRadius.full,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 8,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  content: {
    flex: 1,
    marginLeft: spacing.md,
  },
  userName: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
    color: colors.text.primary,
  },
  actionText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.secondary,
  },
  storeName: {
    fontSize: typography.caption.fontSize,
    color: colors.text.tertiary,
  },
  timeAgo: {
    fontSize: typography.caption.fontSize,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  itemPreview: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  cashbackBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: colors.success,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  cashbackText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Recommendation Card
  recommendationCard: {
    width: 120,
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    marginRight: spacing.md,
  },
  recommendationAvatar: {
    marginBottom: spacing.sm,
  },
  recommendationName: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
  recommendationTitle: {
    fontSize: typography.caption.fontSize,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: 2,
  },
  mutualFriends: {
    fontSize: typography.caption.fontSize,
    color: colors.brand.primary,
    marginTop: spacing.xs,
  },
  followButton: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.brand.primary,
    borderRadius: borderRadius.full,
  },
  followButtonText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Trending
  trendingContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  trendingTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },
  trendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  trendingRank: {
    width: 24,
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '700',
    color: colors.brand.primary,
  },
  trendingName: {
    flex: 1,
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.primary,
  },
  trendingStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendingCount: {
    fontSize: typography.caption.fontSize,
    color: colors.text.tertiary,
    marginRight: spacing.xs,
  },
  // Top Buyers
  topBuyersContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  topBuyersTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },
  buyerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  buyerRank: {
    width: 28,
    alignItems: 'center',
  },
  buyerMedal: {
    fontSize: 20,
  },
  buyerRankText: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '700',
    color: colors.text.tertiary,
  },
  buyerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginHorizontal: spacing.sm,
  },
  buyerAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: spacing.sm,
    backgroundColor: colors.background.primary,
  },
  buyerInitial: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '700',
    color: colors.text.primary,
  },
  buyerInfo: {
    flex: 1,
  },
  buyerName: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '500',
    color: colors.text.primary,
  },
  buyerStats: {
    fontSize: typography.caption.fontSize,
    color: colors.text.tertiary,
  },
});

export default {
  FriendsActivityFeed,
  FriendRecommendation,
  TrendingInArea,
  TopBuyersNearby,
};
