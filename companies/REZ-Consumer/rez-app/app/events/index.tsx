// @ts-nocheck
import { withErrorBoundary } from '@/utils/withErrorBoundary';
/**
 * Events Page - Main events hub
 * Connected to /api/events
 * Categories and reward info loaded dynamically from backend
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Dimensions,
  RefreshControl,
  TextInput,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { CardGridSkeleton } from '@/components/skeletons';
import CachedImage from '@/components/ui/CachedImage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import eventsApiService from '@/services/eventsApi';
import { EventItem } from '@/types/homepage.types';
import { EVENT_COLORS } from '@/constants/EventColors';
import { useGetCurrencySymbol } from '@/stores/selectors';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import { useIsMounted } from '@/hooks/useIsMounted';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = EVENT_COLORS;

// Fallback categories — mirrors backend 10 categories exactly
const FALLBACK_CATEGORIES = [
  { slug: 'music', name: 'Music', icon: '🎵', color: colors.brand.purpleLight },
  { slug: 'tech', name: 'Tech', icon: '💻', color: colors.infoScale[400] },
  { slug: 'wellness', name: 'Wellness', icon: '🧘', color: colors.successScale[400] },
  { slug: 'sports', name: 'Sports', icon: '⚽', color: colors.error },
  { slug: 'education', name: 'Education', icon: '📚', color: colors.warningScale[400] },
  { slug: 'business', name: 'Business', icon: '💼', color: colors.nileBlue },
  { slug: 'arts', name: 'Arts', icon: '🎨', color: colors.brand.purpleLight },
  { slug: 'food', name: 'Food', icon: '🍽️', color: colors.warningScale[400] },
  { slug: 'entertainment', name: 'Entertainment', icon: '🎬', color: colors.error },
  { slug: 'gaming', name: 'Gaming', icon: '🎮', color: colors.infoScale[400] },
];

interface DisplayEvent {
  id: string;
  title: string;
  type: string;
  date: string;
  location?: string;
  price: string;
  image: string;
  cashback?: string;
  rating?: number;
  reviewCount?: number;
  isOnline?: boolean;
}

interface CategoryItem {
  _id?: string;
  slug: string;
  name: string;
  icon: string;
  color: string;
  eventCount?: number;
}

const EventsPage: React.FC = () => {
  const isMounted = useIsMounted();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const getCurrencySymbol = useGetCurrencySymbol();
  const currencySymbol = getCurrencySymbol();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [featuredEvents, setFeaturedEvents] = useState<DisplayEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<DisplayEvent[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [rewardConfig, setRewardConfig] = useState<{
    rewards: { action: string; coins: number; description: string }[];
    totalPotential: number;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const transformEventToDisplay = (event: EventItem): DisplayEvent => {
    if (!event)
      return {
        id: '',
        title: '',
        type: 'Event',
        date: 'TBD',
        price: 'Free',
        image: '',
        isOnline: false,
      };

    const cashbackValue = (event as unknown).cashback;
    const cashbackText = cashbackValue && cashbackValue > 0 ? `${cashbackValue}%` : undefined;

    const isOnline = (event as unknown).isOnline || (event.location as unknown)?.isOnline || false;
    const displayCurrency = isOnline ? currencySymbol : event.price?.currency || currencySymbol;

    let formattedDate = 'TBD';
    if (event.date) {
      try {
        formattedDate = new Date(event.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      } catch {
        formattedDate = event.date;
      }
    }

    return {
      id: event.id || '',
      title: event.title || 'Untitled Event',
      type: event.category || 'Event',
      date: formattedDate,
      location: typeof event.location === 'string' ? event.location : (event.location as unknown)?.name || 'Venue',
      price: event.price?.isFree ? 'Free' : `${displayCurrency}${event.price?.amount ?? 0}`,
      image: event.image || '',
      cashback: cashbackText,
      rating: (event as unknown).rating,
      reviewCount: (event as unknown).reviewCount,
      isOnline,
    };
  };

  const fetchEvents = useCallback(async () => {
    try {
      setError(null);

      // Fetch categories, reward config, featured, and upcoming in parallel
      const [categoriesResult, rewardResult, featured, upcoming] = await Promise.allSettled([
        eventsApiService.getCategories(),
        eventsApiService.getGlobalRewardConfig(),
        eventsApiService.getFeaturedEvents(6),
        eventsApiService.getEvents({ upcoming: true, todayAndFuture: true }, 10, 0),
      ]);

      if (!isMounted()) return;

      // Set categories (use backend if available, fallback otherwise)
      const categoriesData = categoriesResult.status === 'fulfilled' ? categoriesResult.value : [];
      if (categoriesData && categoriesData.length > 0) {
        setCategories(categoriesData as CategoryItem[]);
      } else {
        setCategories(FALLBACK_CATEGORIES as CategoryItem[]);
      }

      // Set reward config
      const rewardData = rewardResult.status === 'fulfilled' ? rewardResult.value : null;
      if (rewardData) {
        setRewardConfig(rewardData);
      }

      // Set featured events
      const featuredData = featured.status === 'fulfilled' ? featured.value : [];
      if (featuredData && featuredData.length > 0) {
        setFeaturedEvents(featuredData.slice(0, 5).map(transformEventToDisplay));
      } else {
        setFeaturedEvents([]);
      }

      // Set upcoming events — handle both flat array and { events: [] } shapes
      const upcomingRaw = upcoming.status === 'fulfilled' ? upcoming.value : null;
      const upcomingEvents = Array.isArray(upcomingRaw) ? upcomingRaw : upcomingRaw?.events || [];
      if (upcomingEvents.length > 0) {
        setUpcomingEvents(upcomingEvents.slice(0, 8).map(transformEventToDisplay));
      } else {
        setUpcomingEvents([]);
      }
    } catch (err) {
      if (!isMounted()) return;
      setError(err.message || 'Failed to load events. Please try again.');
      setFeaturedEvents([]);
      setUpcomingEvents([]);
      setCategories(FALLBACK_CATEGORIES);
    } finally {
      if (isMounted()) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchEvents();
  }, [fetchEvents]);

  const handleCategoryPress = (slug: string) => {
    router.push(`/events/${slug}` as unknown as string);
  };

  const handleEventPress = (eventId: string) => {
    router.push({ pathname: '/EventPage', params: { id: eventId } } as unknown as string);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/events-list?search=${encodeURIComponent(searchQuery.trim())}` as unknown);
    } else {
      router.push('/events-list' as unknown as string);
    }
  };

  // Build dynamic reward text for promo banner
  const getRewardText = () => {
    if (rewardConfig && rewardConfig.totalPotential > 0) {
      return `Earn up to ${rewardConfig.totalPotential} coins per event`;
    }
    return 'Earn coins at every event';
  };

  const getRewardActions = () => {
    if (rewardConfig && rewardConfig.rewards.length > 0) {
      return rewardConfig.rewards
        .slice(0, 4)
        .map((r) => r.description || r.action.replace(/_/g, ' '))
        .join('  \u2022  ');
    }
    return 'Book  \u2022  Check-in  \u2022  Share  \u2022  Review';
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.nileBlue, Colors.secondary[500]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Events & Experiences</Text>
              <Text style={styles.headerSubtitle}>Book tickets, earn coins</Text>
            </View>
          </View>
        </LinearGradient>
        <View style={{ flex: 1, paddingTop: 16 }}>
          <CardGridSkeleton />
        </View>
      </View>
    );
  }

  // Error state
  if (error && featuredEvents.length === 0 && upcomingEvents.length === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.nileBlue, Colors.secondary[500]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={22} color={colors.text.inverse} />
            </Pressable>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Events & Experiences</Text>
              <Text style={styles.headerSubtitle}>Book tickets, earn coins</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>
        <View style={styles.errorContainer}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
          </View>
          <Text style={styles.errorTitle}>Unable to Load Events</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => {
              setIsLoading(true);
              fetchEvents();
            }}
          >
            <Ionicons name="refresh-outline" size={20} color={colors.text.inverse} />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const displayCategories = categories.length > 0 ? categories : FALLBACK_CATEGORIES;

  return (
    <Animated.View style={styles.container} entering={FadeIn.duration(300)} pointerEvents="box-none">
      {/* Header */}
      <LinearGradient
        colors={[colors.nileBlue, Colors.secondary[500]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerTop}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text.inverse} />
          </Pressable>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Events & Experiences</Text>
            <Text style={styles.headerSubtitle}>Book tickets, earn coins</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              style={styles.myEventsBtn}
              onPress={() => router.push('/my-events' as unknown as string)}
              accessibilityLabel="My Events"
            >
              <Ionicons name="ticket-outline" size={16} color={colors.text.inverse} />
              <Text style={styles.myEventsBtnText}>My Events</Text>
            </Pressable>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <Pressable style={styles.searchBar} onPress={() => router.push('/events-list' as unknown as string)}>
            <Ionicons name="search" size={18} color={colors.text.tertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search events, concerts, movies..."
              placeholderTextColor={colors.neutral[400]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.text.tertiary} />
              </Pressable>
            )}
          </Pressable>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[colors.nileBlue]} />
        }
      >
        {/* Categories - Horizontal scroll, compact */}
        <View style={styles.categoriesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Browse Categories</Text>
            <Pressable onPress={() => router.push('/events-list' as unknown as string)}>
              <Text style={styles.viewAllText}>View All</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
            {displayCategories.map((cat) => (
              <Pressable key={cat.slug} style={styles.categoryCard} onPress={() => handleCategoryPress(cat.slug)}>
                <View style={[styles.categoryIcon, { backgroundColor: `${cat.color}15` }]}>
                  <Text style={styles.categoryEmoji}>{cat.icon}</Text>
                </View>
                <Text style={styles.categoryTitle} numberOfLines={1}>
                  {cat.name}
                </Text>
                {(cat as unknown).eventCount !== undefined && (cat as unknown).eventCount > 0 ? (
                  <Text style={styles.categoryCount}>
                    {(cat as unknown).eventCount} {(cat as unknown).eventCount === 1 ? 'event' : 'events'}
                  </Text>
                ) : (
                  <Text style={[styles.categoryCount, { color: colors.border.dark }]}>Browse</Text>
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Earn Coins Banner */}
        {rewardConfig && rewardConfig.totalPotential > 0 && (
          <View style={styles.promoBanner}>
            <LinearGradient
              colors={[colors.nileBlue, Colors.secondary[500]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.promoGradient}
            >
              <View style={styles.promoLeft}>
                <View style={styles.promoIconCircle}>
                  <Ionicons name="gift" size={20} color={Colors.gold} />
                </View>
              </View>
              <View style={styles.promoContent}>
                <Text style={styles.promoTitle}>{getRewardText()}</Text>
                <Text style={styles.promoActions}>{getRewardActions()}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
            </LinearGradient>
          </View>
        )}

        {/* Featured Events */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Events</Text>
            <Pressable onPress={() => router.push('/events-list' as unknown as string)}>
              <Text style={styles.viewAllText}>View All</Text>
            </Pressable>
          </View>
          {featuredEvents.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}
            >
              {featuredEvents.map((event) => (
                <Pressable key={event.id} style={styles.featuredCard} onPress={() => handleEventPress(event.id)}>
                  <CachedImage source={event.image} style={styles.featuredImage} />
                  {/* Price badge top-right */}
                  <View style={[styles.featuredPriceBadgeAbs, event.price === 'Free' && styles.featuredPriceFreeAbs]}>
                    <Text style={styles.featuredPriceAbsText}>{event.price}</Text>
                  </View>
                  {/* Category pill top-left */}
                  <View style={styles.featuredCategoryPill}>
                    <Text style={styles.featuredCategoryText}>{event.type}</Text>
                  </View>
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.88)']} style={styles.featuredOverlay}>
                    {event.cashback && (
                      <View style={styles.cashbackBadge}>
                        <Ionicons name="gift" size={10} color={colors.text.inverse} />
                        <Text style={styles.cashbackText}>{event.cashback} Cashback</Text>
                      </View>
                    )}
                    <Text style={styles.featuredTitle} numberOfLines={2}>
                      {event.title}
                    </Text>
                    <View style={styles.featuredMeta}>
                      <View style={styles.featuredMetaItem}>
                        <Ionicons name="calendar" size={12} color="rgba(255,255,255,0.8)" />
                        <Text style={styles.featuredMetaText}>{event.date}</Text>
                      </View>
                      <View style={styles.featuredMetaDot} />
                      <View style={styles.featuredMetaItem}>
                        <Ionicons
                          name={event.isOnline ? 'globe' : 'location'}
                          size={12}
                          color="rgba(255,255,255,0.8)"
                        />
                        <Text style={styles.featuredMetaText} numberOfLines={1}>
                          {event.isOnline ? 'Online' : event.location}
                        </Text>
                      </View>
                    </View>
                    {/* Book Now CTA */}
                    <View style={styles.featuredBookBtn}>
                      <Text style={styles.featuredBookBtnText}>Book Now</Text>
                      <Ionicons name="arrow-forward" size={13} color={colors.text.inverse} />
                    </View>
                  </LinearGradient>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptySection}>
              <Ionicons name="calendar-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No featured events at the moment</Text>
            </View>
          )}
        </View>

        {/* Upcoming Events */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            <Pressable onPress={() => router.push('/events-list' as unknown as string)}>
              <Text style={styles.viewAllText}>View All</Text>
            </Pressable>
          </View>
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event) => (
              <Pressable key={event.id} style={styles.eventCard} onPress={() => handleEventPress(event.id)}>
                <CachedImage source={event.image} style={styles.eventImage} />
                <View style={styles.eventInfo}>
                  <View style={styles.eventTopRow}>
                    <View style={styles.eventTypeBadge}>
                      <Text style={styles.eventTypeText}>{event.type}</Text>
                    </View>
                    {event.isOnline && (
                      <View style={styles.eventOnlineBadge}>
                        <Ionicons name="globe" size={10} color={colors.text.inverse} />
                        <Text style={styles.eventOnlineText}>Online</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.eventTitle} numberOfLines={2}>
                    {event.title}
                  </Text>
                  <View style={styles.eventDateRow}>
                    <Ionicons name="calendar-outline" size={12} color={colors.text.tertiary} />
                    <Text style={styles.eventDate}>{event.date}</Text>
                  </View>
                </View>
                <View style={styles.eventPriceContainer}>
                  <Text style={[styles.eventPrice, event.price === 'Free' && styles.eventPriceFree]}>
                    {event.price}
                  </Text>
                  {/* Primary CTA: Book Now */}
                  <Pressable
                    style={styles.eventBookNowBtn}
                    onPress={() => handleEventPress(event.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Book Now for ${event.title}`}
                  >
                    <Text style={styles.eventBookNowText}>Book Now</Text>
                  </Pressable>
                </View>
              </Pressable>
            ))
          ) : (
            <View style={styles.emptySection}>
              <Ionicons name="ticket-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No upcoming events scheduled</Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: 12, // base value — overridden at render time with safe area insets
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: BorderRadius['2xl'],
    borderBottomRightRadius: BorderRadius['2xl'],
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xl,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  headerTitle: {
    ...Typography.h3,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  headerSubtitle: {
    ...Typography.bodySmall,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  myEventsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  myEventsBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  searchBarContainer: {
    marginTop: Spacing.base,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? Spacing.base : Spacing.sm,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: colors.text.primary,
    padding: 0,
  },

  // Categories
  categoriesSection: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xs,
  },
  categoriesScroll: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  categoryCard: {
    width: 80,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.lg,
    ...Shadows.subtle,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryEmoji: {
    fontSize: 22,
  },
  categoryTitle: {
    ...Typography.caption,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
  categoryCount: {
    fontSize: 9,
    color: colors.text.tertiary,
    marginTop: 2,
    fontWeight: '500',
  },

  // Section
  section: {
    paddingTop: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    ...Typography.h4,
    fontWeight: '700',
    color: colors.text.primary,
  },
  viewAllText: {
    ...Typography.bodySmall,
    fontSize: 13,
    fontWeight: '600',
    color: colors.nileBlue,
  },

  // Featured Cards
  featuredCard: {
    width: SCREEN_WIDTH * 0.72,
    height: 220,
    marginRight: 12,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.border.default,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    paddingTop: 50,
  },
  // Absolute price badge — top-right
  featuredPriceBadgeAbs: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    zIndex: 2,
  },
  featuredPriceFreeAbs: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  featuredPriceAbsText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  // Category pill — top-left
  featuredCategoryPill: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: colors.nileBlue,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 2,
    maxWidth: '50%',
  },
  featuredCategoryText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.text.inverse,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  cashbackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  cashbackText: {
    ...Typography.overline,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  featuredTitle: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: colors.text.inverse,
    marginBottom: 6,
    lineHeight: 20,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featuredMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featuredMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 8,
  },
  featuredMetaText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
    maxWidth: 100,
  },
  featuredBookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.nileBlue,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignSelf: 'flex-start',
    minHeight: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  featuredBookBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.inverse,
  },

  // Upcoming Event Cards
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    padding: Spacing.md,
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.md,
    ...Shadows.subtle,
  },
  eventImage: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.md,
    backgroundColor: colors.border.default,
  },
  eventInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  eventTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  eventTypeBadge: {
    backgroundColor: colors.background.secondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
  eventTypeText: {
    ...Typography.overline,
    fontWeight: '600',
    color: colors.text.tertiary,
    textTransform: 'capitalize',
  },
  eventOnlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  eventOnlineText: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  eventTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
    lineHeight: 18,
  },
  eventDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventDate: {
    ...Typography.bodySmall,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
  eventPriceContainer: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  eventPrice: {
    ...Typography.body,
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 6,
  },
  eventPriceFree: {
    color: Colors.success,
  },
  eventArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventBookNowBtn: {
    backgroundColor: colors.nileBlue,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  eventBookNowText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.inverse,
  },

  // Promo Banner
  promoBanner: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  promoGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  promoLeft: {},
  promoIconCircle: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xl,
    backgroundColor: 'rgba(255,205,87,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoContent: {
    flex: 1,
  },
  promoTitle: {
    ...Typography.body,
    fontWeight: '700',
    color: colors.text.inverse,
    marginBottom: 2,
  },
  promoActions: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 16,
  },

  // Error state
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.errorScale[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    ...Typography.h4,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.nileBlue,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
    borderRadius: BorderRadius['2xl'],
    gap: Spacing.sm,
  },
  retryButtonText: {
    ...Typography.body,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.inverse,
  },

  // Empty
  emptySection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default withErrorBoundary(EventsPage, 'EventsIndex');
