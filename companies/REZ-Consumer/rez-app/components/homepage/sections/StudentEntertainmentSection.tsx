// @ts-nocheck
/**
 * StudentEntertainmentSection
 *
 * Horizontal scroll carousel of entertainment venues near campus.
 * Categories: Gaming Zones, Movies, Bowling & Pool, Events, VR Cafes, Amusement.
 * Includes group booking CTA: "Invite 2 friends → unlock extra cashback".
 *
 * Section title: "Fun & Entertainment"
 */

import React, { memo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = 200;
const CARD_GAP = 12;

// ─── Types ─────────────────────────────────────────────────────────────────────

interface EntertainmentVenue {
  id: string;
  name: string;
  category: string;
  categorySlug: string;
  icon: string;
  gradientColors: [string, string];
  distance: string;
  cashbackPercent: number;
  hasGroupDeal?: boolean;
}

// ─── Static data ───────────────────────────────────────────────────────────────

const ENTERTAINMENT_VENUES: EntertainmentVenue[] = [
  {
    id: 'gaming-zones',
    name: 'Gaming Zones',
    category: 'Gaming',
    categorySlug: 'gaming-zones',
    icon: '🎮',
    gradientColors: ['#1a3a52', '#A78BFA'],
    distance: '0.5 km',
    cashbackPercent: 15,
    hasGroupDeal: true,
  },
  {
    id: 'movies',
    name: 'Movies',
    category: 'Cinema',
    categorySlug: 'movies',
    icon: '🎬',
    gradientColors: [colors.nileBlue, '#2A5577'],
    distance: '1.2 km',
    cashbackPercent: 20,
    hasGroupDeal: true,
  },
  {
    id: 'bowling-pool',
    name: 'Bowling & Pool',
    category: 'Sports',
    categorySlug: 'bowling-pool',
    icon: '🎳',
    gradientColors: ['#0369A1', '#0EA5E9'],
    distance: '0.8 km',
    cashbackPercent: 12,
    hasGroupDeal: true,
  },
  {
    id: 'events',
    name: 'Local Events',
    category: 'Events',
    categorySlug: 'events',
    icon: '🎪',
    gradientColors: ['#D97706', '#FBBF24'],
    distance: '0.3 km',
    cashbackPercent: 10,
  },
  {
    id: 'vr-cafes',
    name: 'VR Cafes',
    category: 'Tech',
    categorySlug: 'vr-cafes',
    icon: '🥽',
    gradientColors: ['#059669', '#34D399'],
    distance: '1.5 km',
    cashbackPercent: 18,
    hasGroupDeal: true,
  },
  {
    id: 'amusement',
    name: 'Amusement',
    category: 'Fun',
    categorySlug: 'amusement',
    icon: '🎢',
    gradientColors: ['#BE185D', '#F472B6'],
    distance: '2.0 km',
    cashbackPercent: 8,
  },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

interface VenueCardProps {
  venue: EntertainmentVenue;
  onPress: (slug: string) => void;
}

// eslint-disable-next-line react/display-name
const VenueCard: React.FC<VenueCardProps> = memo(({ venue, onPress }) => (
  <Pressable
    style={styles.card}
    onPress={() => onPress(venue.categorySlug)}
    android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
  >
    <LinearGradient
      colors={venue.gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.cardGradient}
    >
      {/* Top row: icon + cashback badge */}
      <View style={styles.cardTop}>
        <Text style={styles.cardIcon}>{venue.icon}</Text>
        <View style={styles.cashbackBadge}>
          <Text style={styles.cashbackText}>{venue.cashbackPercent}% CB</Text>
        </View>
      </View>

      {/* Group deal badge */}
      {venue.hasGroupDeal && (
        <View style={styles.groupBadge}>
          <Ionicons name="people" size={10} color="#fff" />
          <Text style={styles.groupBadgeText}>Group deal</Text>
        </View>
      )}

      {/* Bottom: name + distance */}
      <View style={styles.cardBottom}>
        <Text style={styles.cardName} numberOfLines={1}>{venue.name}</Text>
        <View style={styles.distanceRow}>
          <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.8)" />
          <Text style={styles.distanceText}>{venue.distance} away</Text>
        </View>
      </View>
    </LinearGradient>
  </Pressable>
));

// ─── Main component ────────────────────────────────────────────────────────────

const StudentEntertainmentSection: React.FC = () => {
  const router = useRouter();

  const handleVenuePress = useCallback((slug: string) => {
    router.push(`/events/${slug}` as unknown);
  }, [router]);

  const handleViewAll = () => {
    router.push('/events' as unknown);
  };

  const handleGroupInvite = () => {
    // L-11 FIX: Route to group booking flow with the student zone context
    router.push('/booking/group?zone=student' as unknown);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Fun & Entertainment</Text>
          <Text style={styles.subtitle}>Near your campus</Text>
        </View>
        <Pressable style={styles.viewAllButton} onPress={handleViewAll}>
          <Text style={styles.viewAllText}>View all</Text>
        </Pressable>
      </View>

      {/* Horizontal scroll carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + CARD_GAP}
        snapToAlignment="start"
      >
        {ENTERTAINMENT_VENUES.map((venue) => (
          <VenueCard key={venue.id} venue={venue} onPress={handleVenuePress} />
        ))}
      </ScrollView>

      {/* Group booking CTA */}
      <Pressable style={styles.groupCTA} onPress={handleGroupInvite}>
        <LinearGradient
          colors={['rgba(255,200,87,0.1)', 'rgba(255,200,87,0.1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.groupCTAGradient}
        >
          <Text style={styles.groupCTAIcon}>👥</Text>
          <View style={styles.groupCTAText}>
            <Text style={styles.groupCTATitle}>Invite 2 friends → unlock extra cashback</Text>
            <Text style={styles.groupCTASub}>Group of 3 saves more on movies, bowling & more</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#FFC857" />
        </LinearGradient>
      </Pressable>
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    gap: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    height: 160,
    borderRadius: 18,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
      },
    }),
  },
  cardGradient: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardIcon: {
    fontSize: 32,
  },
  cashbackBadge: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cashbackText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
  groupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  groupBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  cardBottom: {},
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  distanceText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Inter-Regular',
  },
  groupCTA: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 200, 87, 0.2)',
  },
  groupCTAGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  groupCTAIcon: {
    fontSize: 24,
  },
  groupCTAText: {
    flex: 1,
  },
  groupCTATitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFC857',
    marginBottom: 2,
    fontFamily: 'Inter-Bold',
  },
  groupCTASub: {
    fontSize: 11,
    color: colors.neutral?.[500] || '#6B7280',
    fontFamily: 'Inter-Regular',
  },
});

export default memo(StudentEntertainmentSection);
