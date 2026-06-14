/**
 * Merchant Live Indicators
 * Real-time occupancy, wait times, trending items, flash deals
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';

interface MerchantLiveData {
  id: string;
  name: string;
  live: {
    occupancy: number; // 0-100
    waitTime: number; // minutes
    trendingItems: string[];
    peopleBuyingNow: number;
    flashDeal?: {
      discount: number;
      endsAt: string;
    };
  };
}

interface LiveOccupancyProps {
  occupancy: number;
  showLabel?: boolean;
}

export function LiveOccupancy({ occupancy, showLabel = true }: LiveOccupancyProps) {
  const getStatusColor = () => {
    if (occupancy < 50) return colors.success;
    if (occupancy < 80) return colors.warning;
    return colors.error;
  };

  const getStatusText = () => {
    if (occupancy < 50) return 'Not busy';
    if (occupancy < 80) return 'Getting busy';
    return 'Very busy';
  };

  return (
    <View style={styles.occupancyContainer}>
      <View style={styles.occupancyBar}>
        <View
          style={[
            styles.occupancyFill,
            { width: `${occupancy}%`, backgroundColor: getStatusColor() },
          ]}
        />
      </View>
      {showLabel && (
        <View style={styles.occupancyLabel}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
      )}
    </View>
  );
}

interface LiveWaitTimeProps {
  minutes: number;
}

export function LiveWaitTime({ minutes }: LiveWaitTimeProps) {
  const getWaitColor = () => {
    if (minutes <= 5) return colors.success;
    if (minutes <= 15) return colors.warning;
    return colors.error;
  };

  return (
    <View style={styles.waitTimeContainer}>
      <Ionicons name="time-outline" size={14} color={getWaitColor()} />
      <Text style={[styles.waitTimeText, { color: getWaitColor() }]}>
        ~{minutes} min wait
      </Text>
    </View>
  );
}

interface PeopleBuyingNowProps {
  count: number;
}

export function PeopleBuyingNow({ count }: PeopleBuyingNowProps) {
  const pulseAnim = useSharedValue(1);

  useEffect(() => {
    pulseAnim.value = withRepeat(
      withTiming(1.2, { duration: 1000 }),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  return (
    <Animated.View style={[styles.buyingNowContainer, pulseStyle]}>
      <View style={styles.buyingNowDot} />
      <Text style={styles.buyingNowText}>
        {count} buying now
      </Text>
    </Animated.View>
  );
}

interface TrendingItemsProps {
  items: string[];
  maxShow?: number;
}

export function TrendingItems({ items, maxShow = 3 }: TrendingItemsProps) {
  return (
    <View style={styles.trendingContainer}>
      <View style={styles.trendingHeader}>
        <Ionicons name="flame" size={12} color={colors.brand.primary} />
        <Text style={styles.trendingLabel}>Trending:</Text>
      </View>
      <Text style={styles.trendingItems} numberOfLines={1}>
        {items.slice(0, maxShow).join(' • ')}
      </Text>
    </View>
  );
}

interface FlashDealBadgeProps {
  discount: number;
  endsIn?: string;
}

export function FlashDealBadge({ discount, endsIn }: FlashDealBadgeProps) {
  const [timeLeft, setTimeLeft] = useState(endsIn || '');

  useEffect(() => {
    if (endsIn) {
      const interval = setInterval(() => {
        const diff = new Date(endsIn).getTime() - Date.now();
        if (diff <= 0) {
          setTimeLeft('Expired');
          clearInterval(interval);
        } else {
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [endsIn]);

  return (
    <Animated.View entering={FadeIn} style={styles.flashDealBadge}>
      <LinearGradient
        colors={['#FF6B35', '#FF8F6B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.flashDealGradient}
      >
        <Ionicons name="flash" size={14} color="#FFFFFF" />
        <Text style={styles.flashDealText}>{discount}% OFF</Text>
        {timeLeft && (
          <View style={styles.flashDealTimer}>
            <Ionicons name="time" size={10} color="#FFFFFF" />
            <Text style={styles.flashDealTime}>{timeLeft}</Text>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

// Merchant Live Card - Complete component
interface MerchantLiveCardProps {
  merchant: MerchantLiveData;
  onPress?: () => void;
}

export function MerchantLiveCard({ merchant, onPress }: MerchantLiveCardProps) {
  const router = useRouter();
  const { name, live } = merchant;

  return (
    <Animated.View entering={FadeInDown.duration(300)}>
      <Pressable
        style={styles.merchantCard}
        onPress={onPress || (() => router.push(`/store?id=${merchant.id}`))}
      >
        <View style={styles.merchantHeader}>
          <Text style={styles.merchantName}>{name}</Text>
          {live.flashDeal && (
            <FlashDealBadge
              discount={live.flashDeal.discount}
              endsIn={live.flashDeal.endsAt}
            />
          )}
        </View>

        <LiveOccupancy occupancy={live.occupancy} />

        <View style={styles.merchantStats}>
          {live.waitTime > 0 && (
            <LiveWaitTime minutes={live.waitTime} />
          )}
          {live.peopleBuyingNow > 0 && (
            <PeopleBuyingNow count={live.peopleBuyingNow} />
          )}
        </View>

        {live.trendingItems.length > 0 && (
          <TrendingItems items={live.trendingItems} />
        )}
      </Pressable>
    </Animated.View>
  );
}

// Flash Deal Launch Button (For Merchants)
interface LaunchFlashDealProps {
  onLaunch?: () => void;
}

export function LaunchFlashDeal({ onLaunch }: LaunchFlashDealProps) {
  return (
    <Pressable style={styles.launchDealButton} onPress={onLaunch}>
      <LinearGradient
        colors={['#FF6B35', '#FF8F6B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.launchDealGradient}
      >
        <Ionicons name="flash" size={20} color="#FFFFFF" />
        <View style={styles.launchDealText}>
          <Text style={styles.launchDealTitle}>Launch Flash Deal</Text>
          <Text style={styles.launchDealSubtitle}>Create urgency • Boost sales</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
      </LinearGradient>
    </Pressable>
  );
}

// Live Activity Banner
interface LiveActivityBannerProps {
  activity: {
    type: 'order' | 'review' | 'checkin';
    message: string;
  };
}

export function LiveActivityBanner({ activity }: LiveActivityBannerProps) {
  const getIcon = () => {
    switch (activity.type) {
      case 'order': return '🛒';
      case 'review': return '⭐';
      case 'checkin': return '📍';
      default: return '📌';
    }
  };

  return (
    <Animated.View entering={FadeIn} style={styles.activityBanner}>
      <Text style={styles.activityIcon}>{getIcon()}</Text>
      <Text style={styles.activityMessage}>{activity.message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Occupancy
  occupancyContainer: {
    marginVertical: spacing.xs,
  },
  occupancyBar: {
    height: 4,
    backgroundColor: colors.border.light,
    borderRadius: 2,
    overflow: 'hidden',
  },
  occupancyFill: {
    height: '100%',
    borderRadius: 2,
  },
  occupancyLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  statusText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '500',
  },

  // Wait Time
  waitTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
  },
  waitTimeText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '500',
    marginLeft: spacing.xs,
  },

  // People Buying Now
  buyingNowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  buyingNowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: spacing.xs,
  },
  buyingNowText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '500',
    color: colors.success,
  },

  // Trending
  trendingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  trendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  trendingLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: '500',
    color: colors.text.tertiary,
    marginLeft: spacing.xs,
  },
  trendingItems: {
    flex: 1,
    fontSize: typography.caption.fontSize,
    color: colors.text.secondary,
  },

  // Flash Deal Badge
  flashDealBadge: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  flashDealGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  flashDealText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: spacing.xs,
  },
  flashDealTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  flashDealTime: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 2,
  },

  // Merchant Card
  merchantCard: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  merchantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  merchantName: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  merchantStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },

  // Launch Deal Button
  launchDealButton: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  launchDealGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  launchDealText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  launchDealTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  launchDealSubtitle: {
    fontSize: typography.caption.fontSize,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },

  // Activity Banner
  activityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  activityIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  activityMessage: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.secondary,
    flex: 1,
  },
});

export default {
  LiveOccupancy,
  LiveWaitTime,
  PeopleBuyingNow,
  TrendingItems,
  FlashDealBadge,
  MerchantLiveCard,
  LaunchFlashDeal,
  LiveActivityBanner,
};
