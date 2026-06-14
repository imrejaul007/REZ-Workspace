// @ts-nocheck
/**
 * StudentProfileSkeleton - Loading skeleton for StudentProfileScreen
 *
 * Features:
 * - Shimmer animation with purple theme (#6366F1)
 * - Full profile header skeleton
 * - Tab bar skeleton
 * - Content area skeleton
 * - Accessible (hidden from screen readers)
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Animated, {
  cancelAnimation,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?;
}

function SkeletonBlock({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 1500 }), -1);
    return () => cancelAnimation(shimmer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmer.value, [0, 1], [-200, 200]) }],
  }));

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#E5E7EB',
          overflow: 'hidden',
        },
        style,
      ]}
      accessibilityElementsHidden={true}
      importantForAccessibility="no"
    >
      <Animated.View style={[{ flex: 1 }, animatedStyle]}>
        <LinearGradient
          colors={['#E5E7EB', '#F3F4F6', '#E5E7EB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1, width: 200 }}
        />
      </Animated.View>
    </View>
  );
}

export function StudentProfileSkeleton() {
  return (
    <View style={styles.container} accessibilityLabel="Loading student profile" accessibilityRole="progressbar">
      {/* Profile Header */}
      <View style={styles.header}>
        <SkeletonBlock width={80} height={32} borderRadius={16} />
        <SkeletonBlock width="60%" height={20} style={styles.institutionName} />

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <SkeletonBlock width={40} height={24} />
            <SkeletonBlock width={50} height={12} style={styles.statLabel} />
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <SkeletonBlock width={40} height={24} />
            <SkeletonBlock width={60} height={12} style={styles.statLabel} />
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <SkeletonBlock width={40} height={24} />
            <SkeletonBlock width={50} height={12} style={styles.statLabel} />
          </View>
        </View>

        {/* Next Tier Card */}
        <View style={styles.nextTierCard}>
          <SkeletonBlock width={100} height={16} />
          <SkeletonBlock width="100%" height={8} borderRadius={4} style={styles.progressBar} />
          <SkeletonBlock width={120} height={12} style={styles.coinsNeeded} />
        </View>

        {/* Referral Card */}
        <View style={styles.referralCard}>
          <SkeletonBlock width={100} height={12} />
          <SkeletonBlock width={150} height={28} style={styles.referralCode} />
          <SkeletonBlock width={180} height={12} />
        </View>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <SkeletonBlock width="33%" height={48} borderRadius={0} />
        <SkeletonBlock width="33%" height={48} borderRadius={0} />
        <SkeletonBlock width="33%" height={48} borderRadius={0} />
      </View>

      {/* Tab Content - Offers */}
      <View style={styles.tabContent}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.offerCard}>
            <View style={styles.offerHeader}>
              <SkeletonBlock width={120} height={16} />
              <SkeletonBlock width={50} height={14} />
            </View>
            <SkeletonBlock width={100} height={24} borderRadius={6} style={styles.offerBadge} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    alignItems: 'center',
  },
  institutionName: {
    marginTop: 12,
    alignSelf: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 16,
    marginTop: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },
  statLabel: {
    marginTop: 8,
  },
  nextTierCard: {
    width: '100%',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    gap: 12,
  },
  progressBar: {
    marginTop: 8,
  },
  coinsNeeded: {
    marginTop: 8,
  },
  referralCard: {
    width: '100%',
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
    gap: 12,
  },
  referralCode: {
    marginVertical: 8,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabContent: {
    padding: 16,
  },
  offerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  offerBadge: {
    marginTop: 8,
  },
});

export default StudentProfileSkeleton;
