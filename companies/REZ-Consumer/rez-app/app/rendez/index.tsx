/**
 * rendez - Social Offers for Consumer
 *
 * Couple and group deals for social dining experiences
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius } from '@/constants/DesignSystem';

interface RendezOffer {
  id: string;
  title: string;
  description: string;
  type: 'couple' | 'group';
  merchantName: string;
  merchantImage?: string;
  location: string;
  originalPrice: number;
  discountedPrice: number;
  discount: number;
  minPeople: number;
  maxPeople: number;
  date?: string;
  timeSlots?: string[];
  rating: number;
  reviews: number;
  image?: string;
}

const mockOffers: RendezOffer[] = [
  {
    id: '1',
    title: 'Romantic Candlelight Dinner',
    description: 'Special couples dinner with complimentary wine',
    type: 'couple',
    merchantName: 'The Sky Lounge',
    location: 'Andheri, Mumbai',
    originalPrice: 3000,
    discountedPrice: 1999,
    discount: 33,
    minPeople: 2,
    maxPeople: 2,
    rating: 4.8,
    reviews: 234,
  },
  {
    id: '2',
    title: 'Friends Weekend Brunch',
    description: 'Unlimited brunch for 4+ friends',
    type: 'group',
    merchantName: 'Café Social',
    location: 'Koramangala, Bangalore',
    originalPrice: 5000,
    discountedPrice: 3499,
    discount: 30,
    minPeople: 4,
    maxPeople: 10,
    rating: 4.5,
    reviews: 156,
  },
];

export default function rendezIndex() {
  const router = useRouter();
  const [offers, setOffers] = useState<RendezOffer[]>(mockOffers);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'couple' | 'group'>('all');

  const filteredOffers = offers.filter(o => {
    if (filter === 'all') return true;
    return o.type === filter;
  });

  const onRefresh = async () => {
    setRefreshing(true);
    // Fetch from marketing service
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="hero" style={styles.title}>rendez</ThemedText>
          <ThemedText type="caption" style={styles.subtitle}>
            Couple & group dining experiences
          </ThemedText>
        </View>

        {/* Type Filter */}
        <View style={styles.typeFilter}>
          {(['all', 'couple', 'group'] as const).map((type) => (
            <Pressable
              key={type}
              style={[styles.typeChip, filter === type && styles.typeChipActive]}
              onPress={() => setFilter(type)}
            >
              <Ionicons
                name={type === 'couple' ? 'heart' : type === 'group' ? 'people' : 'grid'}
                size={16}
                color={filter === type ? '#FFF' : Colors.text}
              />
              <ThemedText
                type="caption"
                style={[styles.typeText, filter === type && styles.typeTextActive]}
              >
                {type === 'all' ? 'All' : type === 'couple' ? 'Couples' : 'Groups'}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        {/* Special Banner */}
        <Pressable style={styles.banner}>
          <View style={styles.bannerContent}>
            <View>
              <ThemedText type="title" style={styles.bannerTitle}>
                Weekend Special
              </ThemedText>
              <ThemedText type="caption" style={styles.bannerSubtitle}>
                50% off on couple dining
              </ThemedText>
            </View>
            <Ionicons name="arrow-forward" size={24} color={Colors.text} />
          </View>
        </Pressable>

        {/* Offers List */}
        <View style={styles.offersList}>
          {filteredOffers.map((offer) => (
            <Pressable
              key={offer.id}
              style={styles.offerCard}
              onPress={() => router.push(`/rendez/${offer.id}`)}
            >
              {/* Image placeholder */}
              <View style={styles.offerImage}>
                <Ionicons
                  name={offer.type === 'couple' ? 'heart' : 'people'}
                  size={32}
                  color={Colors.primary}
                />
              </View>

              <View style={styles.offerContent}>
                <View style={styles.offerHeader}>
                  <View style={styles.typeBadge}>
                    <Ionicons
                      name={offer.type === 'couple' ? 'heart' : 'people'}
                      size={12}
                      color={Colors.primary}
                    />
                    <ThemedText type="caption" style={styles.typeBadgeText}>
                      {offer.type === 'couple' ? 'Couple' : `Group (${offer.minPeople}+)`}
                    </ThemedText>
                  </View>
                  <View style={styles.rating}>
                    <Ionicons name="star" size={12} color="#FFD700" />
                    <ThemedText type="caption" style={styles.ratingText}>
                      {offer.rating} ({offer.reviews})
                    </ThemedText>
                  </View>
                </View>

                <ThemedText type="title" numberOfLines={2} style={styles.offerTitle}>
                  {offer.title}
                </ThemedText>

                <ThemedText type="caption" style={styles.merchantName}>
                  {offer.merchantName}
                </ThemedText>

                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={12} color={Colors.textSecondary} />
                  <ThemedText type="caption" style={styles.location}>
                    {offer.location}
                  </ThemedText>
                </View>

                <View style={styles.priceRow}>
                  <View>
                    <ThemedText type="title" style={styles.discountedPrice}>
                      ₹{offer.discountedPrice}
                    </ThemedText>
                    <ThemedText type="caption" style={styles.originalPrice}>
                      ₹{offer.originalPrice}
                    </ThemedText>
                  </View>
                  <View style={styles.discountBadge}>
                    <ThemedText type="caption" style={styles.discountText}>
                      {offer.discount}% OFF
                    </ThemedText>
                  </View>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    padding: Spacing.lg,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    textTransform: 'lowercase',
  },
  subtitle: {
    color: Colors.textSecondary,
    marginTop: 4,
  },
  typeFilter: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: 8,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    gap: 6,
  },
  typeChipActive: {
    backgroundColor: Colors.primary,
  },
  typeText: {
    color: Colors.text,
  },
  typeTextActive: {
    color: '#FFF',
  },
  banner: {
    margin: Spacing.lg,
    backgroundColor: '#FEF3C7',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  bannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerTitle: {
    color: '#92400E',
    marginBottom: 4,
  },
  bannerSubtitle: {
    color: '#B45309',
  },
  offersList: {
    paddingHorizontal: Spacing.lg,
  },
  offerCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  offerImage: {
    width: 100,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offerContent: {
    flex: 1,
    padding: Spacing.md,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  typeBadgeText: {
    color: Colors.primary,
    fontSize: 10,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    color: Colors.textSecondary,
  },
  offerTitle: {
    marginBottom: 2,
  },
  merchantName: {
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  location: {
    color: Colors.textSecondary,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  discountedPrice: {
    color: Colors.text,
    fontWeight: 'bold',
  },
  originalPrice: {
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
    fontSize: 12,
  },
  discountBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: '#16A34A',
    fontWeight: '600',
    fontSize: 12,
  },
});
