/**
 * Live Activity Strip
 * Shows real-time activity: orders, shopping, trending
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/constants/theme';

interface ActivityItem {
  id: string;
  icon: string;
  text: string;
  highlight?: string;
}

const defaultActivities: ActivityItem[] = [
  { id: '1', icon: '🛒', text: 'orders in Mumbai today', highlight: '234' },
  { id: '2', icon: '👥', text: 'shopping now', highlight: '1.2K' },
  { id: '3', icon: '🔥', text: 'deals claimed', highlight: '89' },
  { id: '4', icon: '💰', text: 'cashback earned', highlight: '₹45K' },
  { id: '5', icon: '⭐', text: 'reviews today', highlight: '567' },
];

export default function LiveActivityStrip() {
  const [activities] = useState<ActivityItem[]>(defaultActivities);
  const translateX = useSharedValue(0);

  useEffect(() => {
    // Infinite scroll animation
    translateX.value = withRepeat(
      withTiming(-400, { duration: 20000 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.container}>
      <View style={styles.liveIndicator}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>LIVE</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={[styles.activityContainer, animatedStyle]}>
          {[...activities, ...activities].map((activity, index) => (
            <View key={`${activity.id}-${index}`} style={styles.activityItem}>
              <Text style={styles.activityIcon}>{activity.icon}</Text>
              <Text style={styles.activityHighlight}>{activity.highlight}</Text>
              <Text style={styles.activityText}>{activity.text}</Text>
            </View>
          ))}
        </Animated.View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[100] + '15',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginRight: spacing.md,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginRight: spacing.xs,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollContent: {
    overflow: 'hidden',
  },
  activityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.xl,
  },
  activityIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  activityHighlight: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.brand.primary,
    marginRight: spacing.xs,
  },
  activityText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
});
