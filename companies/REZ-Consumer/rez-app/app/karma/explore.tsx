// @ts-nocheck
/**
 * Karma Explore Screen
 * Event feed with category filters, search, and event cards.
 */

import { withErrorBoundary } from '@/utils/withErrorBoundary';
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import CachedImage from '@/components/ui/CachedImage';
import { KarmaHeader } from './_layout';
import karmaService, { KarmaEvent, EventFilters } from '@/services/karmaService';
import { useIsMounted } from '@/hooks/useIsMounted';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';

const KARMA_PURPLE = '#8B5CF6';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'apps' as const, color: KARMA_PURPLE, bg: '#F5F3FF' },
  { id: 'environment', label: 'Environment', icon: 'leaf' as const, color: '#22C55E', bg: '#DCFCE7' },
  { id: 'food', label: 'Food', icon: 'restaurant' as const, color: '#F97316', bg: '#FFF7ED' },
  { id: 'health', label: 'Health', icon: 'heart' as const, color: '#EF4444', bg: '#FEF2F2' },
  { id: 'education', label: 'Education', icon: 'school' as const, color: '#3B82F6', bg: '#EFF6FF' },
  { id: 'community', label: 'Community', icon: 'people' as const, color: '#8B5CF6', bg: '#F5F3FF' },
];

const STATUS_TABS = [
  { id: 'published', label: 'Upcoming' },
  { id: 'ongoing', label: 'Ongoing' },
  { id: 'completed', label: 'Past' },
];

// =============================================================================
// EVENT CARD
// =============================================================================

interface EventCardProps {
  event: KarmaEvent;
  onPress: () => void;
}

function ExploreEventCard({ event, onPress }: EventCardProps) {
  const cat = CATEGORIES.find((c) => c.id === event.category) ?? CATEGORIES[0];
  const progressPercent = event.capacity?.goal
    ? Math.min((event.capacity.enrolled / event.capacity.goal) * 100, 100)
    : 0;
  const spotsLeft = event.capacity ? event.capacity.goal - event.capacity.enrolled : null;

  return (
    <Pressable onPress={onPress} style={styles.eventCard}>
      {/* Image */}
      <View style={styles.eventImageWrap}>
        {event.image ? (
          <CachedImage source={event.image} style={styles.eventImage} contentFit="cover" />
        ) : (
          <View style={[styles.eventImagePlaceholder, { backgroundColor: cat.bg }]}>
            <Ionicons name={cat.icon as unknown as keyof typeof Ionicons.glyphMap} size={40} color={cat.color} />
          </View>
        )}
        {/* Status badge */}
        <View style={[styles.statusBadge, event.status === 'ongoing' && styles.statusBadgeLive]}>
          <Text style={[styles.statusBadgeText, event.status === 'ongoing' && styles.statusBadgeTextLive]}>
            {event.status === 'ongoing' ? 'LIVE' : event.status.charAt(0).toUpperCase() + event.status.slice(1)}
          </Text>
        </View>
        {/* Karma reward */}
        <View style={styles.karmaRewardChip}>
          <Ionicons name="star" size={12} color="#FCD34D" />
          <Text style={styles.karmaRewardChipText}>+{event.maxKarmaPerEvent}</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.eventContent}>
        {/* Category + Difficulty */}
        <View style={styles.eventTopRow}>
          <View style={[styles.catChip, { backgroundColor: cat.bg }]}>
            <Ionicons name={cat.icon as unknown as keyof typeof Ionicons.glyphMap} size={11} color={cat.color} />
            <Text style={[styles.catChipText, { color: cat.color }]}>{cat.label}</Text>
          </View>
          <View
            style={[
              styles.diffChip,
              {
                backgroundColor:
                  event.difficulty === 'easy' ? '#DCFCE7' : event.difficulty === 'hard' ? '#FFF1F2' : '#EFF6FF',
              },
            ]}
          >
            <Text
              style={[
                styles.diffChipText,
                {
                  color: event.difficulty === 'easy' ? '#22C55E' : event.difficulty === 'hard' ? '#EF4444' : '#3B82F6',
                },
              ]}
            >
              {event.difficulty.charAt(0).toUpperCase() + event.difficulty.slice(1)}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.eventTitle} numberOfLines={2}>
          {event.name}
        </Text>

        {/* Organizer */}
        <View style={styles.organizerRow}>
          {event.organizer.logo ? (
            <CachedImage source={event.organizer.logo} style={styles.orgLogo} />
          ) : (
            <View style={styles.orgEmojiWrap}>
              <Text style={styles.orgEmoji}>🏢</Text>
            </View>
          )}
          <Text style={styles.orgName} numberOfLines={1}>
            {event.organizer.name}
          </Text>
        </View>

        {/* Date / Time */}
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={13} color={Colors.textSecondary} />
          <Text style={styles.metaText}>
            {event.date
              ? new Date(event.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
              : 'TBD'}
            {event.time ? `, ${event.time.start}` : ''}
          </Text>
        </View>

        {/* Location */}
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={13} color={Colors.textSecondary} />
          <Text style={styles.metaText} numberOfLines={1}>
            {event.location.city ?? event.location.address}
          </Text>
        </View>

        {/* Impact */}
        {event.impactUnit && (
          <View style={styles.impactRow}>
            <Ionicons name="trending-up" size={13} color={Colors.success} />
            <Text style={styles.impactText}>
              ~{Math.round(event.maxKarmaPerEvent / event.expectedDurationHours)} karma/hr{' '}
              {event.impactUnit && `\u2022 ${event.impactUnit}`}
            </Text>
          </View>
        )}

        {/* Capacity */}
        {event.capacity && (
          <View style={styles.capacityRow}>
            <View style={styles.capacityBar}>
              <View style={[styles.capacityFill, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.capacityText}>
              {spotsLeft != null && spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'}
            </Text>
          </View>
        )}

        {/* Footer: karma + hours + volunteers */}
        <View style={styles.eventFooter}>
          <View style={styles.footerStat}>
            <Ionicons name="leaf" size={14} color={KARMA_PURPLE} />
            <Text style={styles.footerStatText}>{event.maxKarmaPerEvent} karma</Text>
          </View>
          <View style={styles.footerStat}>
            <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.footerStatText}>{event.expectedDurationHours}h</Text>
          </View>
          <View style={styles.footerStat}>
            <Ionicons name="people-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.footerStatText}>
              {event.confirmedVolunteers}/{event.maxVolunteers}
            </Text>
          </View>
          <View style={[styles.footerStat, styles.footerCta]}>
            <Text style={styles.footerCtaText}>View</Text>
            <Ionicons name="chevron-forward" size={14} color={KARMA_PURPLE} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// =============================================================================
// MAIN SCREEN
// =============================================================================

function KarmaExploreScreen() {
  const router = useRouter();
  const isMounted = useIsMounted();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('published');
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState<KarmaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchEvents = useCallback(
    async (opts: { reset?: boolean } = {}) => {
      const { reset = false } = opts;
      if (!reset) setLoading(true);

      const filters: EventFilters = {
        status: selectedStatus,
      };
      if (selectedCategory !== 'all') {
        filters.category = selectedCategory;
      }

      try {
        const res = await karmaService.getNearbyEvents(filters as unknown);
        if (!isMounted()) return;

        let data = (res.data?.events ?? []) as KarmaEvent[];
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          data = data.filter(
            (e) =>
              e.name.toLowerCase().includes(q) ||
              e.organizer.name.toLowerCase().includes(q) ||
              e.location.city?.toLowerCase().includes(q),
          );
        }
        if (reset) {
          setEvents(data);
        } else {
          setEvents((prev) => [...prev, ...data]);
        }
        setHasMore(data.length >= 10);
      } catch {
        // non-fatal
      } finally {
        if (!isMounted()) return;
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [selectedCategory, selectedStatus, searchQuery, isMounted, page],
  );

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [fetchEvents]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchEvents({ reset: true });
  };

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setPage((prev) => prev + 1);
  };

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    setLoading(true);
    setPage(1);
    setEvents([]);
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    setLoading(true);
    setEvents([]);
  };

  const filteredEvents = events;

  return (
    <View style={styles.container}>
      <KarmaHeader title="Explore Events" subtitle="Find your next impact" showBack />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events, NGOs..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Category Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <Pressable
              key={cat.id}
              style={[styles.categoryChip, isActive && { backgroundColor: cat.bg, borderColor: cat.color }]}
              onPress={() => handleCategoryChange(cat.id)}
            >
              <Ionicons name={cat.icon} size={14} color={isActive ? cat.color : Colors.textSecondary} />
              <Text style={[styles.categoryChipText, isActive && { color: cat.color, fontWeight: '600' }]}>
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Status Tabs */}
      <View style={styles.statusTabsContainer}>
        {STATUS_TABS.map((tab) => (
          <Pressable
            key={tab.id}
            style={[styles.statusTab, selectedStatus === tab.id && styles.statusTabActive]}
            onPress={() => handleStatusChange(tab.id)}
          >
            <Text style={[styles.statusTabText, selectedStatus === tab.id && styles.statusTabTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Events List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={KARMA_PURPLE} />
        </View>
      ) : filteredEvents.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={64} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>No events found</Text>
          <Text style={styles.emptySubtitle}>
            {selectedCategory !== 'all'
              ? `No ${selectedCategory} events right now`
              : `No ${selectedStatus} events right now`}
          </Text>
          <Pressable style={styles.emptyExploreBtn} onPress={() => router.push('/karma/home')}>
            <Text style={styles.emptyExploreBtnText}>Go to Home</Text>
          </Pressable>
        </View>
      ) : (
        <FlashList
          data={filteredEvents}
          renderItem={({ item }) => (
            <ExploreEventCard event={item} onPress={() => router.push(`/karma/event/${item._id}`)} />
          )}
          keyExtractor={(item) => item._id}
          estimatedItemSize={380}
          contentContainerStyle={{ padding: Spacing.base, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[KARMA_PURPLE]}
              tintColor={KARMA_PURPLE}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ alignItems: 'center', paddingVertical: Spacing.lg }}>
                <ActivityIndicator size="small" color={KARMA_PURPLE} />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.secondary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing['2xl'] },
  emptyTitle: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.deepNavy,
    marginTop: Spacing.base,
  },
  emptySubtitle: {
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  emptyExploreBtn: {
    backgroundColor: KARMA_PURPLE,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
  },
  emptyExploreBtnText: { fontSize: Typography.body.fontSize, fontWeight: '600', color: colors.text.inverse },

  // Search
  searchContainer: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: colors.text.inverse,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    gap: Spacing.sm,
  },
  searchInput: { flex: 1, fontSize: Typography.body.fontSize, color: colors.deepNavy, padding: 0 },

  // Category chips
  categoryScroll: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: colors.text.inverse,
    gap: Spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
    gap: 5,
    marginRight: Spacing.sm,
  },
  categoryChipText: { fontSize: Typography.bodySmall.fontSize, fontWeight: '500', color: Colors.textSecondary },

  // Status tabs
  statusTabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.text.inverse,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  statusTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
  },
  statusTabActive: { backgroundColor: KARMA_PURPLE },
  statusTabText: { fontSize: Typography.bodySmall.fontSize, fontWeight: '600', color: Colors.textSecondary },
  statusTabTextActive: { color: colors.text.inverse },

  // Event Card
  eventCard: {
    backgroundColor: colors.text.inverse,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  eventImageWrap: { position: 'relative', height: 160 },
  eventImage: { width: '100%', height: '100%' },
  eventImagePlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  statusBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeLive: { backgroundColor: '#EF4444' },
  statusBadgeText: { fontSize: 10, fontWeight: '700', color: colors.text.inverse },
  statusBadgeTextLive: { color: colors.text.inverse },
  karmaRewardChip: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 3,
  },
  karmaRewardChipText: { fontSize: 11, fontWeight: '700', color: '#FCD34D' },
  eventContent: { padding: Spacing.md },
  eventTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  catChipText: { fontSize: 10, fontWeight: '700' },
  diffChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  diffChipText: { fontSize: 10, fontWeight: '700' },
  eventTitle: { fontSize: Typography.body.fontSize, fontWeight: '700', color: colors.deepNavy, marginBottom: 6 },
  organizerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm },
  orgLogo: { width: 20, height: 20, borderRadius: 4 },
  orgEmojiWrap: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orgEmoji: { fontSize: 12 },
  orgName: { fontSize: Typography.caption.fontSize, color: Colors.textSecondary, flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  metaText: { fontSize: Typography.caption.fontSize, color: Colors.textSecondary, flex: 1 },
  impactRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  impactText: { fontSize: Typography.caption.fontSize, color: Colors.success, fontWeight: '500' },
  capacityRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.sm },
  capacityBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.background.secondary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  capacityFill: { height: '100%', backgroundColor: KARMA_PURPLE, borderRadius: 2 },
  capacityText: { fontSize: Typography.caption.fontSize, color: Colors.textSecondary },
  eventFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  footerStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerStatText: { fontSize: Typography.caption.fontSize, fontWeight: '600', color: Colors.textSecondary },
  footerCta: { marginLeft: 'auto' },
  footerCtaText: { fontSize: Typography.bodySmall.fontSize, fontWeight: '700', color: KARMA_PURPLE },
});

export default withErrorBoundary(KarmaExploreScreen, 'KarmaExplore');
