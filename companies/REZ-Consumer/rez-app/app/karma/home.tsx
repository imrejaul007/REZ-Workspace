/**
 * Karma Home Screen
 * Main entry point for the Karma feature — snapshot, nearby events, quick actions.
 */

import { withErrorBoundary } from '@/utils/withErrorBoundary';
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import CachedImage from '@/components/ui/CachedImage';
import { KarmaHeader } from './_layout';
import { useIsAuthenticated } from '@/stores/selectors';
import karmaService, { KarmaProfile, KarmaEvent } from '@/services/karmaService';
import { showAlert } from '@/utils/alert';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';

const KARMA_PURPLE = '#8B5CF6';
const KARMA_GRADIENT = ['#7C3AED', '#8B5CF6', '#A78BFA'] as const;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// =============================================================================
// LEVEL CONFIG
// =============================================================================

const LEVEL_CONFIG = {
  L1: { label: 'L1', name: 'Seed', color: '#86EFAC', bg: '#DCFCE7', next: 500 },
  L2: { label: 'L2', name: 'Sprout', color: '#67E8F9', bg: '#ECFEFF', next: 2000 },
  L3: { label: 'L3', name: 'Bloom', color: '#FCA5A5', bg: '#FFF1F2', next: 5000 },
  L4: { label: 'L4', name: 'Tree', color: '#FCD34D', bg: '#FEF9C3', next: null },
};

const CONVERSION_RATES: Record<string, number> = {
  L1: 25,
  L2: 50,
  L3: 75,
  L4: 100,
};

// =============================================================================
// CATEGORY ICONS
// =============================================================================

const CATEGORY_ICONS: Record<string, { icon: string; color: string; bg: string }> = {
  environment: { icon: 'leaf', color: '#22C55E', bg: '#DCFCE7' },
  food: { icon: 'restaurant', color: '#F97316', bg: '#FFF7ED' },
  health: { icon: 'heart', color: '#EF4444', bg: '#FEF2F2' },
  education: { icon: 'school', color: '#3B82F6', bg: '#EFF6FF' },
  community: { icon: 'people', color: '#8B5CF6', bg: '#F5F3FF' },
};

// =============================================================================
// KARMASnapshotCard
// =============================================================================

interface SnapshotCardProps {
  profile: KarmaProfile;
  onPressMyKarma: () => void;
}

function KarmaSnapshotCard({ profile, onPressMyKarma }: SnapshotCardProps) {
  const levelCfg = LEVEL_CONFIG[profile.level];
  const conversionPct = CONVERSION_RATES[profile.level] ?? 25;
  const progressPercent =
    profile.level !== 'L4' ? Math.min((profile.activeKarma / (levelCfg.next ?? 1)) * 100, 100) : 100;

  return (
    <Pressable onPress={onPressMyKarma} style={{ marginHorizontal: Spacing.base, marginBottom: Spacing.base }}>
      <LinearGradient colors={KARMA_GRADIENT} style={styles.snapshotCard}>
        {/* Top row: level badge + active karma */}
        <View style={styles.snapshotTopRow}>
          <View style={styles.levelBadge}>
            <View style={[styles.levelCircle, { backgroundColor: levelCfg.bg }]}>
              <Text style={[styles.levelLabel, { color: levelCfg.color }]}>{levelCfg.label}</Text>
            </View>
            <View style={{ marginLeft: Spacing.sm }}>
              <Text style={styles.levelName}>{levelCfg.name}</Text>
              <Text style={styles.levelSub}>Level {profile.level}</Text>
            </View>
          </View>
          <Pressable style={styles.seeMoreBtn} onPress={onPressMyKarma}>
            <Text style={styles.seeMoreText}>My Karma</Text>
            <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.9)" />
          </Pressable>
        </View>

        {/* Active Karma */}
        <View style={styles.karmaStatsRow}>
          <View>
            <Text style={styles.karmaNumber}>{profile.activeKarma.toLocaleString()}</Text>
            <Text style={styles.karmaLabel}>Active Karma</Text>
          </View>
          <View style={styles.karmaDivider} />
          <View>
            <Text style={styles.karmaNumber}>{profile.lifetimeKarma.toLocaleString()}</Text>
            <Text style={styles.karmaLabel}>Lifetime</Text>
          </View>
          <View style={styles.karmaDivider} />
          <View>
            <Text style={[styles.karmaNumber, { color: levelCfg.color }]}>{conversionPct}%</Text>
            <Text style={styles.karmaLabel}>Conversion</Text>
          </View>
        </View>

        {/* Progress bar */}
        {profile.level !== 'L4' && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {profile.activeKarma.toLocaleString()} / {levelCfg.next?.toLocaleString()} to next level
            </Text>
          </View>
        )}

        {/* Trust score + events */}
        <View style={styles.bottomStatsRow}>
          <View style={styles.trustBadge}>
            <Ionicons name="shield-checkmark" size={14} color="rgba(255,255,255,0.9)" />
            <Text style={styles.trustText}>Trust {profile.trustScore}%</Text>
          </View>
          <View style={styles.trustBadge}>
            <Ionicons name="checkmark-circle" size={14} color="rgba(255,255,255,0.9)" />
            <Text style={styles.trustText}>{profile.eventsCompleted} Events</Text>
          </View>
          <View style={styles.trustBadge}>
            <Ionicons name="time" size={14} color="rgba(255,255,255,0.9)" />
            <Text style={styles.trustText}>{profile.totalHours}h Given</Text>
          </View>
        </View>

        {/* Decay warning */}
        {profile.decayWarning && (
          <View style={styles.decayWarning}>
            <Ionicons name="warning" size={14} color="#FCD34D" />
            <Text style={styles.decayText}>{profile.decayWarning}</Text>
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
}

// =============================================================================
// EVENT CARD (Horizontal scroll item)
// =============================================================================

interface EventCardProps {
  event: KarmaEvent;
  onPress: () => void;
}

function EventCard({ event, onPress }: EventCardProps) {
  const catCfg = CATEGORY_ICONS[event.category] ?? CATEGORY_ICONS.community;
  const progressPercent = event.capacity?.goal
    ? Math.min((event.capacity.enrolled / event.capacity.goal) * 100, 100)
    : 0;

  return (
    <Pressable onPress={onPress} style={styles.eventCard}>
      {/* Hero image */}
      <View style={styles.eventImageWrap}>
        {event.image ? (
          <CachedImage source={event.image} style={styles.eventImage} contentFit="cover" />
        ) : (
          <View style={[styles.eventImagePlaceholder, { backgroundColor: catCfg.bg }]}>
            <Ionicons name={catCfg.icon as unknown as keyof typeof Ionicons.glyphMap} size={32} color={catCfg.color} />
          </View>
        )}
        {/* Category badge */}
        <View style={[styles.categoryBadge, { backgroundColor: catCfg.bg }]}>
          <Ionicons name={catCfg.icon as unknown as keyof typeof Ionicons.glyphMap} size={12} color={catCfg.color} />
          <Text style={[styles.categoryText, { color: catCfg.color }]}>
            {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
          </Text>
        </View>
        {/* Karma reward badge */}
        <View style={styles.rewardBadge}>
          <Ionicons name="star" size={10} color="#FCD34D" />
          <Text style={styles.rewardBadgeText}>+{event.maxKarmaPerEvent}</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.eventCardContent}>
        <Text style={styles.eventTitle} numberOfLines={2}>
          {event.name}
        </Text>
        <Text style={styles.eventOrg} numberOfLines={1}>
          {event.organizer.name}
        </Text>
        <View style={styles.eventMeta}>
          <Ionicons name="location-outline" size={12} color={Colors.textSecondary} />
          <Text style={styles.eventMetaText} numberOfLines={1}>
            {event.location.city ?? event.location.address}
          </Text>
        </View>
        <View style={styles.eventMeta}>
          <Ionicons name="calendar-outline" size={12} color={Colors.textSecondary} />
          <Text style={styles.eventMetaText}>
            {event.date ? new Date(event.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'TBD'}
            {event.time ? ` \u2022 ${event.time.start}` : ''}
          </Text>
        </View>

        {/* Capacity progress */}
        {event.capacity && (
          <View style={styles.capacityRow}>
            <View style={styles.capacityBar}>
              <View style={[styles.capacityFill, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.capacityText}>
              {event.capacity.enrolled}/{event.capacity.goal}
            </Text>
          </View>
        )}

        {/* Karma reward preview */}
        <View style={styles.karmaRewardRow}>
          <View style={styles.karmaRewardPill}>
            <Ionicons name="leaf" size={12} color={KARMA_PURPLE} />
            <Text style={styles.karmaRewardText}>~{event.maxKarmaPerEvent} Karma</Text>
          </View>
          <View style={styles.karmaRewardPill}>
            <Ionicons name="time-outline" size={12} color={Colors.textSecondary} />
            <Text style={styles.karmaRewardText}>{event.expectedDurationHours}h</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// =============================================================================
// MAIN SCREEN
// =============================================================================

function KarmaHomeScreen() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const [profile, setProfile] = useState<KarmaProfile | null>(null);
  const [nearbyEvents, setNearbyEvents] = useState<KarmaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileError, setProfileError] = useState(false);

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) setLoading(true);
      setProfileError(false);

      try {
        const profileRes = isAuthenticated ? await karmaService.getKarmaProfile('me') : { success: false as const };
        const eventsRes = await karmaService.getNearbyEvents({ status: 'published' });

        if (profileRes.success && 'data' in profileRes && (profileRes as unknown as Record<string, unknown>).data) {
          setProfile((profileRes as unknown as { data: KarmaProfile | null }).data);
        } else if (isAuthenticated) {
          setProfileError(true);
        }

        if (eventsRes.success && eventsRes.data) {
          setNearbyEvents(eventsRes.data.events.slice(0, 10));
        }
      } catch {
        setProfileError(true);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isAuthenticated],
  );

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  // Quick action items
  const quickActions = [
    {
      id: 'scan',
      label: 'Scan QR',
      icon: 'qr-code' as const,
      color: '#8B5CF6',
      bg: '#F5F3FF',
      onPress: () => router.push('/karma/scan'),
    },
    {
      id: 'explore',
      label: 'Explore',
      icon: 'compass' as const,
      color: '#3B82F6',
      bg: '#EFF6FF',
      onPress: () => router.push('/karma/explore'),
    },
    {
      id: 'my-karma',
      label: 'My Karma',
      icon: 'leaf' as const,
      color: '#22C55E',
      bg: '#DCFCE7',
      onPress: () => router.push('/karma/my-karma'),
    },
    {
      id: 'wallet',
      label: 'Wallet',
      icon: 'wallet' as const,
      color: '#F59E0B',
      bg: '#FFFBEB',
      onPress: () => router.push('/karma/wallet'),
    },
    {
      id: 'missions',
      label: 'Missions',
      icon: 'flag' as const,
      color: '#EF4444',
      bg: '#FEF2F2',
      onPress: () => router.push('/karma/missions'),
    },
    {
      id: 'micro',
      label: 'Actions',
      icon: 'flash' as const,
      color: '#F59E0B',
      bg: '#FFFBEB',
      onPress: () => router.push('/karma/micro-actions'),
    },
    {
      id: 'leaderboard',
      label: 'Rankings',
      icon: 'trophy' as const,
      color: '#8B5CF6',
      bg: '#F5F3FF',
      onPress: () => router.push('/karma/leaderboard'),
    },
    {
      id: 'communities',
      label: 'Communities',
      icon: 'people' as const,
      color: '#7C3AED',
      bg: '#F5F3FF',
      onPress: () => router.push('/karma/communities'),
    },
  ];

  if (loading) {
    return (
      <View style={styles.container}>
        <KarmaHeader title="Karma" subtitle="Do Good. Earn More." />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={KARMA_PURPLE} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KarmaHeader
        title="Karma"
        subtitle="Do Good. Earn More."
        rightAction={
          <Pressable style={styles.walletBtn} onPress={() => router.push('/karma/wallet')} hitSlop={8}>
            <Ionicons name="wallet" size={20} color={colors.text.inverse} />
          </Pressable>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[KARMA_PURPLE]}
            tintColor={KARMA_PURPLE}
          />
        }
      >
        {/* Karma Snapshot Card */}
        {profile && <KarmaSnapshotCard profile={profile} onPressMyKarma={() => router.push('/karma/my-karma')} />}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <Pressable key={action.id} style={styles.quickAction} onPress={action.onPress}>
                <View style={[styles.quickActionIcon, { backgroundColor: action.bg }]}>
                  <Ionicons name={action.icon} size={22} color={action.color} />
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Nearby Events */}
        {nearbyEvents.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Nearby Events</Text>
              <Pressable onPress={() => router.push('/karma/explore')}>
                <Text style={styles.seeAllText}>See All</Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: Spacing.base, gap: Spacing.md }}
            >
              {nearbyEvents.map((event) => (
                <EventCard key={event._id} event={event} onPress={() => router.push(`/karma/event/${event._id}`)} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* How it works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How Karma Works</Text>
          <View style={styles.howItWorksCard}>
            {[
              {
                step: '1',
                title: 'Find an Event',
                desc: 'Browse karma-enabled events near you',
                icon: 'compass-outline' as const,
                color: '#3B82F6',
              },
              {
                step: '2',
                title: 'Join & Check In',
                desc: 'Scan the QR code or use GPS at the venue',
                icon: 'qr-code-outline' as const,
                color: '#8B5CF6',
              },
              {
                step: '3',
                title: 'Earn Karma Points',
                desc: 'Get verified and earn karma automatically',
                icon: 'star-outline' as const,
                color: '#F59E0B',
              },
              {
                step: '4',
                title: 'Convert to Coins',
                desc: 'Convert karma to ReZ Coins every week',
                icon: 'wallet-outline' as const,
                color: '#22C55E',
              },
            ].map((item) => (
              <View key={item.step} style={styles.howStep}>
                <View style={[styles.howStepNum, { backgroundColor: item.color + '20' }]}>
                  <Text style={[styles.howStepNumText, { color: item.color }]}>{item.step}</Text>
                </View>
                <View style={styles.howStepContent}>
                  <Text style={styles.howStepTitle}>{item.title}</Text>
                  <Text style={styles.howStepDesc}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Level Guide */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Karma Levels</Text>
          <View style={styles.levelsCard}>
            {Object.entries(LEVEL_CONFIG).map(([level, cfg]) => {
              const rate = CONVERSION_RATES[level];
              return (
                <View key={level} style={styles.levelRow}>
                  <View style={[styles.levelDot, { backgroundColor: cfg.bg }]}>
                    <Text style={[styles.levelDotText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                  <View style={styles.levelInfo}>
                    <Text style={styles.levelRowName}>{cfg.name}</Text>
                    <Text style={styles.levelRowDesc}>
                      {level === 'L4' ? '5000+ karma' : `${cfg.next ? cfg.next.toLocaleString() : '∞'} karma`}
                    </Text>
                  </View>
                  <View style={[styles.rateBadge, { backgroundColor: cfg.bg }]}>
                    <Text style={[styles.rateBadgeText, { color: cfg.color }]}>{rate}% rate</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const CARD_WIDTH = SCREEN_WIDTH * 0.72;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.secondary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  walletBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Snapshot Card
  snapshotCard: {
    padding: Spacing.lg,
    marginTop: Spacing.base,
  },
  snapshotTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  levelBadge: { flexDirection: 'row', alignItems: 'center' },
  levelCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelLabel: { fontSize: 16, fontWeight: '800' },
  levelName: { fontSize: Typography.body.fontSize, fontWeight: '700', color: colors.text.inverse },
  levelSub: { fontSize: Typography.caption.fontSize, color: 'rgba(255,255,255,0.7)' },
  seeMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  seeMoreText: { fontSize: Typography.caption.fontSize, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  karmaStatsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    marginBottom: Spacing.base,
  },
  karmaNumber: { fontSize: 26, fontWeight: '800', color: colors.text.inverse, textAlign: 'center' },
  karmaLabel: {
    fontSize: Typography.caption.fontSize,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
    textAlign: 'center',
  },
  karmaDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', height: 40 },
  progressContainer: { marginBottom: Spacing.base },
  progressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#FCD34D', borderRadius: 3 },
  progressText: { fontSize: Typography.caption.fontSize, color: 'rgba(255,255,255,0.7)', marginTop: 6 },
  bottomStatsRow: { flexDirection: 'row', justifyContent: 'flex-start', gap: Spacing.md },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  trustText: { fontSize: Typography.caption.fontSize, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  decayWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: Spacing.sm,
    gap: 6,
  },
  decayText: { fontSize: Typography.caption.fontSize, color: '#FCD34D', flex: 1 },

  // Quick Actions
  section: { marginBottom: Spacing.xl },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.base,
  },
  sectionTitle: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.deepNavy,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.base,
  },
  seeAllText: { fontSize: Typography.bodySmall.fontSize, fontWeight: '600', color: KARMA_PURPLE },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.base,
    gap: Spacing.md,
  },
  quickAction: {
    width: (SCREEN_WIDTH - Spacing.base * 2 - Spacing.md * 3) / 4,
    alignItems: 'center',
    backgroundColor: colors.text.inverse,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  quickActionLabel: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },

  // Event Card
  eventCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.text.inverse,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  eventImageWrap: { position: 'relative', height: 130 },
  eventImage: { width: '100%', height: '100%' },
  eventImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  categoryText: { fontSize: 10, fontWeight: '700' },
  rewardBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 3,
  },
  rewardBadgeText: { fontSize: 10, fontWeight: '700', color: '#FCD34D' },
  eventCardContent: { padding: Spacing.md },
  eventTitle: { fontSize: Typography.body.fontSize, fontWeight: '700', color: colors.deepNavy, marginBottom: 4 },
  eventOrg: { fontSize: Typography.caption.fontSize, color: Colors.textSecondary, marginBottom: 6 },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
  eventMetaText: { fontSize: Typography.caption.fontSize, color: Colors.textSecondary, flex: 1 },
  capacityRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, marginBottom: 6 },
  capacityBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.background.secondary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  capacityFill: { height: '100%', backgroundColor: KARMA_PURPLE, borderRadius: 2 },
  capacityText: { fontSize: Typography.overline.fontSize, color: Colors.textSecondary },
  karmaRewardRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  karmaRewardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  karmaRewardText: { fontSize: Typography.caption.fontSize, fontWeight: '600', color: KARMA_PURPLE },

  // How It Works
  howItWorksCard: {
    marginHorizontal: Spacing.base,
    backgroundColor: colors.text.inverse,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  howStep: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.lg },
  howStepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  howStepNumText: { fontSize: 13, fontWeight: '800' },
  howStepContent: { flex: 1 },
  howStepTitle: { fontSize: Typography.body.fontSize, fontWeight: '700', color: colors.deepNavy, marginBottom: 2 },
  howStepDesc: { fontSize: Typography.caption.fontSize, color: Colors.textSecondary },

  // Levels
  levelsCard: {
    marginHorizontal: Spacing.base,
    backgroundColor: colors.text.inverse,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  levelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  levelDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  levelDotText: { fontSize: 14, fontWeight: '800' },
  levelInfo: { flex: 1 },
  levelRowName: { fontSize: Typography.body.fontSize, fontWeight: '700', color: colors.deepNavy },
  levelRowDesc: { fontSize: Typography.caption.fontSize, color: Colors.textSecondary },
  rateBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  rateBadgeText: { fontSize: Typography.caption.fontSize, fontWeight: '700' },
});

export default withErrorBoundary(KarmaHomeScreen, 'KarmaHome');
