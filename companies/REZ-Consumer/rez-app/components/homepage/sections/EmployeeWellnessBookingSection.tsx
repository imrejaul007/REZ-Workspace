// @ts-nocheck
/**
 * EmployeeWellnessBookingSection
 *
 * Grooming & wellness with fast booking emphasis for corporate users.
 * - Categories: Nearby Salons, Spa Weekday Offers, Quick Grooming,
 *               Skin/Dental Clinics, Health Check Packages
 * - Each card: "Book in 30 seconds" CTA, next available slot shown
 *
 * Section title: "Grooming & Wellness"
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

type WellnessCategory =
  | 'salon'
  | 'spa'
  | 'grooming'
  | 'skin_clinic'
  | 'health_check';

interface WellnessService {
  id: string;
  name: string;
  category: WellnessCategory;
  distance: string;
  rating: number;
  nextAvailableSlot: string;   // e.g. "Today 4:30 PM"
  discountLabel: string;
  cashbackPercent: number;
  priceFrom: number;
}

// ─── Static data ──────────────────────────────────────────────────────────────

const SERVICES: WellnessService[] = [
  {
    id: 'w1',
    name: 'StyleCraft Salon',
    category: 'salon',
    distance: '0.4 km',
    rating: 4.5,
    nextAvailableSlot: 'Today 5:00 PM',
    discountLabel: '20% weekday off',
    cashbackPercent: 10,
    priceFrom: 299,
  },
  {
    id: 'w2',
    name: 'Zen Spa & Wellness',
    category: 'spa',
    distance: '1.1 km',
    rating: 4.7,
    nextAvailableSlot: 'Today 6:30 PM',
    discountLabel: 'Flat 30% off',
    cashbackPercent: 12,
    priceFrom: 799,
  },
  {
    id: 'w3',
    name: 'The Quick Barber',
    category: 'grooming',
    distance: '0.2 km',
    rating: 4.3,
    nextAvailableSlot: 'Now — walk in',
    discountLabel: '15% off all services',
    cashbackPercent: 8,
    priceFrom: 149,
  },
  {
    id: 'w4',
    name: 'ClearSkin Clinic',
    category: 'skin_clinic',
    distance: '0.9 km',
    rating: 4.6,
    nextAvailableSlot: 'Tomorrow 10:00 AM',
    discountLabel: '10% on consultations',
    cashbackPercent: 15,
    priceFrom: 499,
  },
  {
    id: 'w5',
    name: 'HealthFirst Diagnostics',
    category: 'health_check',
    distance: '0.7 km',
    rating: 4.4,
    nextAvailableSlot: 'Today 7:00 AM',
    discountLabel: '25% on full body check',
    cashbackPercent: 18,
    priceFrom: 999,
  },
];

const CATEGORY_CONFIG: Record<
  WellnessCategory,
  { emoji: string; label: string; bg: string; accent: string }
> = {
  salon: { emoji: '💇', label: 'Salon', bg: '#F3E8FF', accent: '#1a3a52' },
  spa: { emoji: '🧖', label: 'Spa', bg: '#ECFDF5', accent: '#059669' },
  grooming: { emoji: '✂️', label: 'Grooming', bg: '#EFF6FF', accent: '#2563EB' },
  skin_clinic: { emoji: '🧴', label: 'Skin Clinic', bg: '#FCE7F3', accent: '#DB2777' },
  health_check: { emoji: '🩺', label: 'Health Check', bg: '#FFF7ED', accent: '#FFC857' },
};

// ─── Component ────────────────────────────────────────────────────────────────

const EmployeeWellnessBookingSection: React.FC = () => {
  const router = useRouter();

  const handleViewAll = useCallback(() => {
    router.push('/wellness' as unknown);
  }, [router]);

  const handleBookNow = useCallback((service: WellnessService) => {
    router.push({ pathname: '/booking/[id]', params: { id: service.id } } as unknown);
  }, [router]);

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>💆 Grooming & Wellness</Text>
          <Text style={styles.headerSubtitle}>Book in 30 seconds, relax all day</Text>
        </View>
        <Pressable onPress={handleViewAll} hitSlop={8}>
          <Text style={styles.viewAllText}>View All →</Text>
        </Pressable>
      </View>

      {/* ── Quick Book Banner ── */}
      <View style={styles.quickBookBanner}>
        <View style={styles.quickBookIconWrap}>
          <Ionicons name="flash" size={18} color={colors.lightMustard} />
        </View>
        <Text style={styles.quickBookText}>
          All services below offer instant slot confirmation — no waiting
        </Text>
      </View>

      {/* ── Category Chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
      >
        {(Object.keys(CATEGORY_CONFIG) as WellnessCategory[]).map((cat) => {
          const cfg = CATEGORY_CONFIG[cat];
          return (
            <Pressable
              key={cat}
              style={[styles.categoryChip, { backgroundColor: cfg.bg }]}
              onPress={() => router.push(`/wellness/${cat}` as unknown)}
            >
              <Text style={{ fontSize: 14 }}>{cfg.emoji}</Text>
              <Text style={[styles.categoryChipText, { color: cfg.accent }]}>
                {cfg.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ── Service Cards ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {SERVICES.map((service) => {
          const cfg = CATEGORY_CONFIG[service.category];
          const isSlotNow = service.nextAvailableSlot.toLowerCase().includes('now');
          return (
            <View key={service.id} style={styles.card}>
              {/* Header accent */}
              <View style={[styles.cardAccent, { backgroundColor: cfg.bg }]}>
                <Text style={styles.cardEmoji}>{cfg.emoji}</Text>
                <View style={styles.cardCategoryPill}>
                  <Text style={[styles.cardCategoryText, { color: cfg.accent }]}>
                    {cfg.label}
                  </Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                {/* Name */}
                <Text style={styles.cardName} numberOfLines={1}>
                  {service.name}
                </Text>

                {/* Rating + Distance */}
                <View style={styles.cardMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="star" size={11} color="#F59E0B" />
                    <Text style={styles.metaText}>{service.rating.toFixed(1)}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="location-outline" size={11} color={colors.neutral[500]} />
                    <Text style={styles.metaText}>{service.distance}</Text>
                  </View>
                </View>

                {/* Next available slot */}
                <View style={[
                  styles.slotBadge,
                  { backgroundColor: isSlotNow ? '#DCFCE7' : '#EFF6FF' },
                ]}>
                  <Ionicons
                    name="time-outline"
                    size={11}
                    color={isSlotNow ? '#16A34A' : '#2563EB'}
                  />
                  <Text style={[
                    styles.slotText,
                    { color: isSlotNow ? '#16A34A' : '#2563EB' },
                  ]}>
                    {service.nextAvailableSlot}
                  </Text>
                </View>

                {/* Price + discount */}
                <View style={styles.priceRow}>
                  <Text style={styles.priceFrom}>From ₹{service.priceFrom}</Text>
                  <View style={styles.discountPill}>
                    <Text style={styles.discountText}>{service.discountLabel}</Text>
                  </View>
                </View>

                {/* Cashback */}
                <Text style={styles.cashbackText}>
                  + {service.cashbackPercent}% cashback coins
                </Text>

                {/* Book CTA */}
                <Pressable
                  style={styles.bookBtn}
                  onPress={() => handleBookNow(service)}
                >
                  <Ionicons name="flash" size={13} color={colors.nileBlue} />
                  <Text style={styles.bookBtnText}>Book in 30 seconds</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.nileBlue,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 2,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.lightMustard,
  },

  // Quick book banner
  quickBookBanner: {
    marginHorizontal: 16,
    backgroundColor: colors.tint.amber,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 10,
  },
  quickBookIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.nileBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBookText: {
    flex: 1,
    fontSize: 12,
    color: colors.brand.amberDark,
    fontWeight: '500',
  },

  // Category chips
  chipsContainer: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    gap: 12,
  },

  // Card
  card: {
    width: 185,
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
    shadowColor: colors.nileBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardAccent: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardEmoji: {
    fontSize: 26,
  },
  cardCategoryPill: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cardCategoryText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardBody: {
    padding: 12,
    gap: 6,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.nileBlue,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    color: colors.neutral[500],
  },
  slotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  slotText: {
    fontSize: 11,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceFrom: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.nileBlue,
  },
  discountPill: {
    backgroundColor: '#FFF7ED',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFC857',
  },
  cashbackText: {
    fontSize: 11,
    color: colors.brand.teal,
    fontWeight: '500',
  },
  bookBtn: {
    backgroundColor: colors.lightMustard,
    borderRadius: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 4,
  },
  bookBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.nileBlue,
  },
});

export default React.memo(EmployeeWellnessBookingSection);
