/**
 * ProfileDrawer - Slide-out drawer showing user progress and rewards
 *
 * Features:
 * - Animated slide-in/out from right
 * - Coin balance with buy button
 * - Explorer score and tier
 * - Weekly mission progress
 * - Badges preview
 * - Leaderboard percentile
 * - Quick navigation links
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, spacing, borderRadius, shadows, typography } from '@/constants/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_W * 0.85;
const DRAWER_HEIGHT = SCREEN_H;

// ============================================================================
// TYPES
// ============================================================================

export type Tier = 'curious' | 'explorer' | 'adventurer' | 'pioneer';

export interface CategoryBadge {
  id: string;
  category: string;
  title: string;
  level: string;
  icon: string;
}

export interface Mission {
  id: string;
  title: string;
  description?: string;
  current: number;
  total: number;
  reward: number;
  bonusReward?: number;
}

export interface ProfileDrawerProps {
  visible: boolean;
  onClose: () => void;
  coins: number;
  score: number;
  tier: Tier;
  activeMission?: Mission;
  badges: CategoryBadge[];
  leaderboardPercentile?: number;
  city?: string;
}

// ============================================================================
// TIER CONFIGURATION
// ============================================================================

const TIER_CONFIG: Record<Tier, { label: string; color: string; icon: string }> = {
  curious: { label: 'Curious', color: colors.gray[400], icon: 'leaf-outline' },
  explorer: { label: 'Explorer', color: colors.brand.tealGreen, icon: 'compass-outline' },
  adventurer: { label: 'Adventurer', color: colors.brand.purple, icon: 'shield-outline' },
  pioneer: { label: 'Pioneer', color: colors.gold, icon: 'star-outline' },
};

// ============================================================================
// ANIMATED OVERLAY
// ============================================================================

interface OverlayProps {
  visible: boolean;
  onPress: () => void;
}

function Overlay({ visible, onPress }: OverlayProps) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, { duration: 300, easing: Easing.ease });
  }, [visible, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    pointerEvents: opacity.value > 0 ? 'auto' : 'none',
  }));

  return (
    <Animated.View style={[styles.overlay, animatedStyle]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onPress} />
    </Animated.View>
  );
}

// ============================================================================
// COIN BALANCE SECTION
// ============================================================================

interface CoinBalanceProps {
  coins: number;
  onBuyPress: () => void;
}

function CoinBalance({ coins, onBuyPress }: CoinBalanceProps) {
  const formatCoins = (n: number) => n.toLocaleString('en-IN');

  return (
    <View style={styles.section}>
      <View style={styles.coinCard}>
        <View style={styles.coinInfo}>
          <View style={styles.coinIconContainer}>
            <Text style={styles.coinIcon}>🪙</Text>
          </View>
          <View>
            <Text style={styles.coinBalance}>{formatCoins(coins)}</Text>
            <Text style={styles.coinLabel}>Coins</Text>
          </View>
        </View>
        <Pressable style={styles.buyButton} onPress={onBuyPress}>
          <Ionicons name="add" size={16} color={colors.nileBlue} />
          <Text style={styles.buyButtonText}>Buy More</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ============================================================================
// EXPLORER SCORE SECTION
// ============================================================================

interface ExplorerScoreProps {
  score: number;
  tier: Tier;
  onViewDetails: () => void;
}

function ExplorerScore({ score, tier, onViewDetails }: ExplorerScoreProps) {
  const config = TIER_CONFIG[tier];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>EXPLORER SCORE</Text>
      <View style={styles.scoreCard}>
        <View style={styles.scoreRow}>
          <View style={[styles.tierBadge, { backgroundColor: config.color + '20' }]}>
            <Ionicons name={config.icon} size={20} color={config.color} />
          </View>
          <View style={styles.scoreInfo}>
            <Text style={styles.scoreValue}>{score.toLocaleString('en-IN')}</Text>
            <Text style={[styles.tierLabel, { color: config.color }]}>{config.label}</Text>
          </View>
        </View>
        <Pressable style={styles.viewDetailsButton} onPress={onViewDetails}>
          <Text style={styles.viewDetailsText}>View Details</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.brand.purple} />
        </Pressable>
      </View>
    </View>
  );
}

// ============================================================================
// WEEKLY MISSION SECTION
// ============================================================================

interface WeeklyMissionProps {
  mission?: Mission;
  onViewAll: () => void;
}

function WeeklyMission({ mission, onViewAll }: WeeklyMissionProps) {
  const progress = mission ? Math.min(100, (mission.current / mission.total) * 100) : 0;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>WEEKLY MISSION</Text>
      {mission ? (
        <View style={styles.missionCard}>
          <View style={styles.missionHeader}>
            <Text style={styles.missionTitle}>{mission.title}</Text>
            <View style={styles.missionProgress}>
              <Text style={styles.missionProgressText}>
                {mission.current}/{mission.total}
              </Text>
            </View>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
            </View>
          </View>
          <View style={styles.rewardRow}>
            <View style={styles.rewardPill}>
              <Text style={styles.rewardText}>+{mission.reward}</Text>
            </View>
            {mission.bonusReward && (
              <View style={[styles.rewardPill, styles.bonusPill]}>
                <Text style={styles.bonusText}>+{mission.bonusReward}</Text>
              </View>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.missionCard}>
          <Text style={styles.noMissionText}>No active mission</Text>
        </View>
      )}
      <Pressable style={styles.viewAllButton} onPress={onViewAll}>
        <Text style={styles.viewAllText}>View All</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.brand.purple} />
      </Pressable>
    </View>
  );
}

// ============================================================================
// BADGES PREVIEW SECTION
// ============================================================================

interface BadgesPreviewProps {
  badges: CategoryBadge[];
}

function BadgesPreview({ badges }: BadgesPreviewProps) {
  const previewBadges = badges.slice(0, 4);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>BADGES (preview)</Text>
      <View style={styles.badgesGrid}>
        {previewBadges.length > 0 ? (
          previewBadges.map((badge) => (
            <View key={badge.id} style={styles.badgeItem}>
              <Text style={styles.badgeIcon}>{badge.icon}</Text>
              <Text style={styles.badgeTitle} numberOfLines={1}>
                {badge.title}
              </Text>
              <Text style={styles.badgeLevel}>{badge.level}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noBadgesText}>No badges earned yet</Text>
        )}
      </View>
    </View>
  );
}

// ============================================================================
// LEADERBOARD SECTION
// ============================================================================

interface LeaderboardPreviewProps {
  percentile?: number;
  city?: string;
  onViewRankings: () => void;
}

function LeaderboardPreview({ percentile, city, onViewRankings }: LeaderboardPreviewProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>LEADERBOARD</Text>
      <Pressable style={styles.leaderboardCard} onPress={onViewRankings}>
        <View style={styles.leaderboardIcon}>
          <Ionicons name="trophy" size={24} color={colors.gold} />
        </View>
        <View style={styles.leaderboardInfo}>
          <Text style={styles.percentileText}>
            {percentile ? `Top ${percentile}%` : 'Not ranked'}
          </Text>
          {city && <Text style={styles.cityText}>in {city}</Text>}
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
      </Pressable>
    </View>
  );
}

// ============================================================================
// QUICK NAVIGATION
// ============================================================================

interface QuickNavProps {
  onBookings: () => void;
  onBundles: () => void;
}

function QuickNav({ onBookings, onBundles }: QuickNavProps) {
  const navItems = [
    { label: 'My Bookings', icon: 'calendar-outline', onPress: onBookings },
    { label: 'My Bundles', icon: 'ticket-outline', onPress: onBundles },
  ];

  return (
    <View style={styles.quickNavSection}>
      {navItems.map((item, index) => (
        <Pressable
          key={item.label}
          style={[
            styles.navItem,
            index === 0 && styles.navItemBorder,
          ]}
          onPress={item.onPress}
        >
          <Text style={styles.navLabel}>{item.label}</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
        </Pressable>
      ))}
    </View>
  );
}

// ============================================================================
// MAIN PROFILE DRAWER COMPONENT
// ============================================================================

export function ProfileDrawer({
  visible,
  onClose,
  coins,
  score,
  tier,
  activeMission,
  badges,
  leaderboardPercentile,
  city,
}: ProfileDrawerProps) {
  const router = useRouter();
  const translateX = useSharedValue(DRAWER_WIDTH);

  // Navigation handlers
  const handleBuyCoins = () => {
    onClose();
    router.push('/try/coins');
  };

  const handleViewScore = () => {
    onClose();
    router.push('/try/score');
  };

  const handleViewMissions = () => {
    onClose();
    router.push('/try/missions');
  };

  const handleViewRankings = () => {
    onClose();
    router.push('/try/leaderboard');
  };

  const handleViewBookings = () => {
    onClose();
    router.push('/try/history');
  };

  const handleViewBundles = () => {
    onClose();
    router.push('/try/bundles');
  };

  // Animate drawer
  useEffect(() => {
    translateX.value = withSpring(visible ? 0 : DRAWER_WIDTH, {
      damping: 20,
      stiffness: 150,
      mass: 0.8,
    });
  }, [visible, translateX]);

  const drawerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  if (!visible && translateX.value === DRAWER_WIDTH) {
    return null;
  }

  return (
    <>
      <Overlay visible={visible} onPress={onClose} />
      <Animated.View style={[styles.drawer, drawerAnimatedStyle]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="menu" size={22} color={colors.text.primary} />
            <Text style={styles.headerTitle}>My Rewards</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </Pressable>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <CoinBalance coins={coins} onBuyPress={handleBuyCoins} />

          <ExplorerScore score={score} tier={tier} onViewDetails={handleViewScore} />

          <WeeklyMission mission={activeMission} onViewAll={handleViewMissions} />

          <BadgesPreview badges={badges} />

          <LeaderboardPreview
            percentile={leaderboardPercentile}
            city={city}
            onViewRankings={handleViewRankings}
          />

          <QuickNav onBookings={handleViewBookings} onBundles={handleViewBundles} />

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </Animated.View>
    </>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // Overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay.medium,
    zIndex: 1000,
  },

  // Drawer container
  drawer: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: DRAWER_WIDTH,
    height: DRAWER_HEIGHT,
    backgroundColor: colors.background.primary,
    zIndex: 1001,
    ...Platform.select({
      ios: {
        shadowColor: colors.nileBlue,
        shadowOffset: { width: -4, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 16,
      },
    }),
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.default,
    paddingTop: spacing['2xl'],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerTitle: {
    ...typography.h4,
    color: colors.text.primary,
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: spacing.base,
  },

  // Sections
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.overline,
    color: colors.text.tertiary,
    marginBottom: spacing.sm,
    letterSpacing: 1.2,
  },

  // Coin balance
  coinCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
  },
  coinInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  coinIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand.purple + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinIcon: {
    fontSize: 24,
  },
  coinBalance: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '700',
  },
  coinLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  buyButtonText: {
    ...typography.button,
    color: colors.nileBlue,
    fontWeight: '700',
  },

  // Explorer score
  scoreCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  tierBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreInfo: {
    flex: 1,
  },
  scoreValue: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '800',
  },
  tierLabel: {
    ...typography.body,
    fontWeight: '600',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
  },
  viewDetailsText: {
    ...typography.link,
    color: colors.brand.purple,
    fontWeight: '600',
  },

  // Mission card
  missionCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
  },
  missionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  missionTitle: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  missionProgress: {
    backgroundColor: colors.brand.purple + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  missionProgressText: {
    ...typography.labelSmall,
    color: colors.brand.purple,
    fontWeight: '700',
  },
  progressBarContainer: {
    marginBottom: spacing.sm,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.border.default,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.brand.purple,
    borderRadius: 4,
  },
  rewardRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rewardPill: {
    backgroundColor: colors.gold + '30',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  bonusPill: {
    backgroundColor: colors.successScale[100],
  },
  rewardText: {
    ...typography.labelSmall,
    color: colors.gold,
    fontWeight: '700',
  },
  bonusText: {
    ...typography.labelSmall,
    color: colors.successScale[600],
    fontWeight: '700',
  },
  noMissionText: {
    ...typography.body,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
  },
  viewAllText: {
    ...typography.link,
    color: colors.brand.purple,
    fontWeight: '600',
  },

  // Badges
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badgeItem: {
    width: '48%',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  badgeIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  badgeTitle: {
    ...typography.bodySmall,
    color: colors.text.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  badgeLevel: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  noBadgesText: {
    ...typography.body,
    color: colors.text.tertiary,
    textAlign: 'center',
    paddingVertical: spacing.base,
    width: '100%',
  },

  // Leaderboard
  leaderboardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
  },
  leaderboardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gold + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  leaderboardInfo: {
    flex: 1,
  },
  percentileText: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '700',
  },
  cityText: {
    ...typography.caption,
    color: colors.text.tertiary,
  },

  // Quick nav
  quickNavSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.sm,
  },
  navItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.default,
  },
  navLabel: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '500',
  },

  // Bottom spacer
  bottomSpacer: {
    height: spacing['3xl'],
  },
});

export default ProfileDrawer;
