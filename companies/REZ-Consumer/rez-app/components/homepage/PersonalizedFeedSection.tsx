// @ts-nocheck
/**
 * PersonalizedFeedSection — "For You" horizontal scroll row on the home screen.
 *
 * - Fetches from GET /api/stores/feed?userId=...&lat=...&lng=...&limit=10
 * - Falls back to GET /search/trending when the user is unauthenticated
 * - Skeleton loader while fetching (Animated opacity pulse)
 * - Pull-to-refresh is delegated to the parent ScrollView via the
 *   `onRefresh` prop; callers may also call `refresh()` imperatively.
 */

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/theme';
import FastImage from '@/components/common/FastImage';
import {
  fetchPersonalizedFeed,
  PersonalizedFeedStore,
} from '@/services/storesApi';
import { useUserId } from '@/stores/selectors';
import { useCurrentLocation } from '@/hooks/useLocation';

// ── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard({ pulse }: { pulse: Animated.Value }) {
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  return (
    <Animated.View style={[styles.skeletonCard, { opacity }]}>
      <View style={styles.skeletonLogo} />
      <View style={styles.skeletonName} />
      <View style={styles.skeletonSub} />
    </Animated.View>
  );
}

// ── Store feed card ──────────────────────────────────────────────────────────

interface FeedCardProps {
  store: PersonalizedFeedStore;
  onPress: (store: PersonalizedFeedStore) => void;
}

function FeedCard({ store, onPress }: FeedCardProps) {
  const handlePress = useCallback(() => onPress(store), [onPress, store]);

  return (
    <Pressable style={styles.card} onPress={handlePress} accessibilityRole="button">
      {/* Logo */}
      <View style={styles.logoContainer}>
        {store.logo ? (
          <FastImage
            source={{ uri: store.logo }}
            style={styles.logo}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.logo, styles.logoPlaceholder]}>
            <Ionicons name="storefront-outline" size={24} color={colors.neutral[400]} />
          </View>
        )}
        {store.offerSummary ? (
          <View style={styles.offerBadge}>
            <Text style={styles.offerBadgeText} numberOfLines={1}>
              {store.offerSummary}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Details */}
      <View style={styles.cardBody}>
        <Text style={styles.storeName} numberOfLines={1}>
          {store.name}
        </Text>
        <Text style={styles.storeCategory} numberOfLines={1}>
          {store.category}
        </Text>

        <View style={styles.metaRow}>
          {store.rating !== undefined && (
            <View style={styles.ratingPill}>
              <Ionicons name="star" size={10} color={colors.lightMustard} />
              <Text style={styles.ratingText}>{store.rating.toFixed(1)}</Text>
            </View>
          )}
          {store.distance ? (
            <Text style={styles.distanceText}>{store.distance}</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export interface PersonalizedFeedSectionHandle {
  refresh: () => void;
}

interface Props {
  /** Called after a refresh completes (useful to chain parent pull-to-refresh). */
  onRefreshComplete?: () => void;
}

const SKELETON_COUNT = 5;

const PersonalizedFeedSection = forwardRef<PersonalizedFeedSectionHandle, Props>(
  function PersonalizedFeedSection({ onRefreshComplete }, ref) {
    const router = useRouter();
    const userId = useUserId();
    const { currentLocation } = useCurrentLocation();

    const [stores, setStores] = useState<PersonalizedFeedStore[]>([]);
    const [loading, setLoading] = useState(true);

    // Animated skeleton pulse
    const pulseAnim = useRef(new Animated.Value(0)).current;
    const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

    const startPulse = useCallback(() => {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
      );
      pulseLoop.current.start();
    }, [pulseAnim]);

    const stopPulse = useCallback(() => {
      pulseLoop.current?.stop();
    }, []);

    const load = useCallback(async () => {
      setLoading(true);
      startPulse();

      const lat = currentLocation?.coordinates?.latitude;
      const lng = currentLocation?.coordinates?.longitude;

      const result = await fetchPersonalizedFeed({
        userId: userId ?? undefined,
        lat,
        lng,
        limit: 10,
      });

      stopPulse();
      setStores(result);
      setLoading(false);
      onRefreshComplete?.();
    }, [userId, currentLocation, startPulse, stopPulse, onRefreshComplete]);

    // Expose refresh handle to parent
    useImperativeHandle(ref, () => ({ refresh: load }), [load]);

    useEffect(() => {
      load();
    }, [load]);

    const handleCardPress = useCallback(
      (store: PersonalizedFeedStore) => {
        if (store.storeId) {
          router.push(`/store/${store.storeId}` as unknown);
        }
      },
      [router],
    );

    const renderItem = useCallback(
      ({ item }: { item: PersonalizedFeedStore }) => (
        <FeedCard store={item} onPress={handleCardPress} />
      ),
      [handleCardPress],
    );

    const keyExtractor = useCallback(
      (item: PersonalizedFeedStore, index: number) =>
        item.storeId || String(index),
      [],
    );

    // Nothing to show and not loading
    if (!loading && stores.length === 0) return null;

    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>For You</Text>

        {loading ? (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={Array.from({ length: SKELETON_COUNT })}
            keyExtractor={(_, i) => `skel-${i}`}
            renderItem={() => <SkeletonCard pulse={pulseAnim} />}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={stores}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    );
  },
);

export default PersonalizedFeedSection;

// ── Styles ───────────────────────────────────────────────────────────────────

const CARD_WIDTH = 140;
const LOGO_SIZE = 80;

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.nileBlue,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  // Feed card
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,205,87,0.12)',
    shadowColor: colors.nileBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  logoContainer: {
    position: 'relative',
    width: CARD_WIDTH,
    height: LOGO_SIZE,
  },
  logo: {
    width: CARD_WIDTH,
    height: LOGO_SIZE,
  },
  logoPlaceholder: {
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    backgroundColor: colors.lightMustard,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  offerBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.nileBlue,
    textAlign: 'center',
  },
  cardBody: {
    padding: 8,
  },
  storeName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.nileBlue,
    marginBottom: 2,
  },
  storeCategory: {
    fontSize: 11,
    color: colors.midGray,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(255,205,87,0.15)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.nileBlue,
  },
  distanceText: {
    fontSize: 10,
    color: colors.midGray,
  },
  // Skeleton
  skeletonCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.neutral[100],
    borderRadius: 12,
    padding: 8,
    height: 130,
  },
  skeletonLogo: {
    width: '100%',
    height: 64,
    backgroundColor: colors.neutral[200],
    borderRadius: 8,
    marginBottom: 8,
  },
  skeletonName: {
    width: '70%',
    height: 12,
    backgroundColor: colors.neutral[200],
    borderRadius: 4,
    marginBottom: 6,
  },
  skeletonSub: {
    width: '50%',
    height: 10,
    backgroundColor: colors.neutral[200],
    borderRadius: 4,
  },
});
