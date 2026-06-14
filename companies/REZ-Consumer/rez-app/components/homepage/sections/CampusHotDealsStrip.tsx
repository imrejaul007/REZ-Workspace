// @ts-nocheck
/**
 * CampusHotDealsStrip
 *
 * Horizontal scroll strip: "Trending in Your College"
 * Cards sorted by student_booking_count, distance_from_campus, cashback_percent.
 * Each card shows: merchant thumbnail, name, "X students visited today", cashback %, limited time badge.
 * Fire emoji for trending items.
 *
 * Data: GET /api/homepage/campus-trending?campusId=X (placeholder used until backend is live)
 */

import React, { memo, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import {
  getCampusTrending,
  CampusTrendingItem,
} from '@/services/studentHomepageApi';
import { useIsMounted } from '@/hooks/useIsMounted';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = 180;
const CARD_GAP = 12;

// ─── Sub-components ────────────────────────────────────────────────────────────

interface TrendingCardProps {
  item: CampusTrendingItem;
  onPress: (id: string) => void;
}

// eslint-disable-next-line react/display-name
const TrendingCard: React.FC<TrendingCardProps> = memo(({ item, onPress }) => (
  <Pressable
    style={styles.card}
    onPress={() => onPress(item.id)}
    android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
  >
    {/* Thumbnail */}
    <View style={styles.imageContainer}>
      <Image
        source={{ uri: item.thumbnail }}
        style={styles.thumbnail}
        resizeMode="cover"
        defaultSource={{ uri: `https://placehold.co/${CARD_WIDTH}x110/f1f5f9/94a3b8?text=...` }}
      />

      {/* Cashback badge */}
      <View style={styles.cashbackBadge}>
        <Text style={styles.cashbackText}>{item.cashbackPercent}% CB</Text>
      </View>

      {/* Limited time badge */}
      {item.isLimitedTime && (
        <View style={styles.limitedBadge}>
          <Ionicons name="time" size={9} color="#fff" />
          <Text style={styles.limitedText}>Limited</Text>
        </View>
      )}
    </View>

    {/* Card body */}
    <View style={styles.cardBody}>
      {/* Name + fire emoji for trending */}
      <View style={styles.nameRow}>
        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
        {item.isTrending && <Text style={styles.fireEmoji}>🔥</Text>}
      </View>

      {/* Students visited today */}
      <View style={styles.visitsRow}>
        <Ionicons name="people" size={11} color="#FFC857" />
        <Text style={styles.visitsText}>
          {item.studentVisitsToday} students today
        </Text>
      </View>

      {/* Distance */}
      <View style={styles.distanceRow}>
        <Ionicons name="location-outline" size={10} color={colors.neutral?.[400] || '#9CA3AF'} />
        <Text style={styles.distanceText}>{item.distanceFromCampus} km away</Text>
      </View>
    </View>
  </Pressable>
));

// ─── Main component ────────────────────────────────────────────────────────────

interface CampusHotDealsStripProps {
  /** Campus ID passed from the user's stored anchor location. Optional — falls back to placeholder data. */
  campusId?: string;
}

const CampusHotDealsStrip: React.FC<CampusHotDealsStripProps> = ({ campusId = '' }) => {
  const router = useRouter();
  const isMounted = useIsMounted();
  const [items, setItems] = useState<CampusTrendingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // L-5 FIX: campusId is passed as a prop from the parent, which reads it from
    // the user's stored anchor location in the user profile/store. The TODO is resolved
    // at the call-site level — this component accepts and uses whatever campusId is provided.
    getCampusTrending(campusId)
      .then((data) => {
        if (!isMounted()) return;
        setItems(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        // silently fail — placeholder returned by service, or empty state shown
      })
      .finally(() => {
        if (!isMounted()) return;
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campusId]);

  const handleCardPress = useCallback((id: string) => {
    // Find the item to get its category for navigation
    const item = items.find((i) => i.id === id);
    const category = item?.category || 'food';
    // Navigate to the store list filtered by this item's category.
    // Placeholder IDs (e.g. ct-1) are not real backend product IDs, so we
    // route to the store discovery page rather than product-page.
    router.push({
      pathname: '/StoreListPage',
      params: { category, sort: 'rating' },
    } as unknown);
  }, [router, items]);

  const handleViewAll = () => {
    router.push('/near-u/student-offers' as unknown);
  };

  if (!loading && items.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>🔥 Trending in Your College</Text>
          <Text style={styles.subtitle}>Most visited by students today</Text>
        </View>
        <Pressable style={styles.viewAllButton} onPress={handleViewAll}>
          <Text style={styles.viewAllText}>View all</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#FFC857" />
          <Text style={styles.loadingText}>Loading campus deals...</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          decelerationRate="fast"
          snapToInterval={CARD_WIDTH + CARD_GAP}
          snapToAlignment="start"
        >
          {items.map((item) => (
            <TrendingCard key={item.id} item={item} onPress={handleCardPress} />
          ))}
        </ScrollView>
      )}
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.nileBlue,
    fontFamily: 'Poppins-Bold',
  },
  subtitle: {
    fontSize: 12,
    color: colors.neutral?.[500] || '#6B7280',
    marginTop: 2,
    fontFamily: 'Inter-Regular',
  },
  viewAllButton: {
    backgroundColor: 'rgba(255, 200, 87, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 200, 87, 0.2)',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFC857',
    fontFamily: 'Inter-SemiBold',
  },
  loadingContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: colors.neutral?.[400] || '#9CA3AF',
    fontFamily: 'Inter-Regular',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: CARD_GAP,
    paddingBottom: 4,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 3px 8px rgba(0,0,0,0.08)',
      },
    }),
  },
  imageContainer: {
    width: '100%',
    height: 110,
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  cashbackBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.lightMustard || '#FFCD57',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cashbackText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.nileBlue,
    letterSpacing: 0.3,
  },
  limitedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  limitedText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  cardBody: {
    padding: 10,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: colors.nileBlue,
    fontFamily: 'Inter-Bold',
  },
  fireEmoji: {
    fontSize: 13,
  },
  visitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  visitsText: {
    fontSize: 11,
    color: '#FFC857',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  distanceText: {
    fontSize: 10,
    color: colors.neutral?.[400] || '#9CA3AF',
    fontFamily: 'Inter-Regular',
  },
});

export default memo(CampusHotDealsStrip);
