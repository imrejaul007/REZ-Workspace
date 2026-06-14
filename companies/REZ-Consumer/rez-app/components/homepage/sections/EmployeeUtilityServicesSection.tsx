// @ts-nocheck
/**
 * EmployeeUtilityServicesSection
 *
 * Life utility services prominently featured for employees.
 * Tagline: "Save time, not just money"
 * Categories: Home Cleaning, Appliance Repair, Car Servicing, Laundry Pickup, Medicine Delivery
 *
 * Section title: "Life Made Easy"
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UtilityService {
  id: string;
  name: string;
  icon: string;   // emoji
  tagline: string;
  nextSlot: string;
  cashbackPercent: number;
  route: string;
  accentColor: string;
  bgColor: string;
}

// ─── Service definitions ──────────────────────────────────────────────────────

const UTILITY_SERVICES: UtilityService[] = [
  {
    id: 'uc1',
    name: 'Home Cleaning',
    icon: '🧹',
    tagline: 'Deep clean while you work',
    nextSlot: 'Today at 10 AM',
    cashbackPercent: 10,
    route: '/services/home-cleaning',
    accentColor: '#2563EB',
    bgColor: '#EFF6FF',
  },
  {
    id: 'uc2',
    name: 'Appliance Repair',
    icon: '🔧',
    tagline: 'AC, fridge, washing machine',
    nextSlot: 'Same day service',
    cashbackPercent: 8,
    route: '/services/appliance-repair',
    accentColor: '#FFC857',
    bgColor: '#FFF7ED',
  },
  {
    id: 'uc3',
    name: 'Car Servicing',
    icon: '🚗',
    tagline: 'Doorstep pickup & drop',
    nextSlot: 'Tomorrow 8 AM',
    cashbackPercent: 12,
    route: '/services/car-service',
    accentColor: '#1a3a52',
    bgColor: '#F3E8FF',
  },
  {
    id: 'uc4',
    name: 'Laundry Pickup',
    icon: '👕',
    tagline: '24 hr turnaround',
    nextSlot: 'Pickup in 2 hrs',
    cashbackPercent: 15,
    route: '/services/laundry',
    accentColor: '#059669',
    bgColor: '#ECFDF5',
  },
  {
    id: 'uc5',
    name: 'Medicine Delivery',
    icon: '💊',
    tagline: 'Prescription & OTC, fast',
    nextSlot: 'Delivered in 45 min',
    cashbackPercent: 5,
    route: '/services/medicine',
    accentColor: '#DB2777',
    bgColor: '#FCE7F3',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

const EmployeeUtilityServicesSection: React.FC = () => {
  const router = useRouter();

  const handleViewAll = useCallback(() => {
    router.push('/services' as unknown);
  }, [router]);

  const handleServicePress = useCallback((service: UtilityService) => {
    router.push(service.route as unknown);
  }, [router]);

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>⚡ Life Made Easy</Text>
          <Text style={styles.tagline}>Save time, not just money</Text>
        </View>
        <Pressable onPress={handleViewAll} hitSlop={8}>
          <Text style={styles.viewAllText}>View All →</Text>
        </Pressable>
      </View>

      {/* ── Hero CTA Banner ── */}
      <LinearGradient
        colors={['#1a3a52', '#2A5577']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.heroBanner}
      >
        <View style={styles.heroBannerContent}>
          <Text style={styles.heroBannerTitle}>
            Let us handle life's chores
          </Text>
          <Text style={styles.heroBannerSubtitle}>
            Book once — we schedule, remind & follow up
          </Text>
        </View>
        <View style={styles.heroBannerEmoji}>
          <Text style={{ fontSize: 32 }}>🏠</Text>
        </View>
      </LinearGradient>

      {/* ── Service Cards ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {UTILITY_SERVICES.map((service) => (
          <Pressable
            key={service.id}
            style={styles.card}
            onPress={() => handleServicePress(service)}
          >
            {/* Icon area */}
            <View style={[styles.cardIconBox, { backgroundColor: service.bgColor }]}>
              <Text style={styles.cardIcon}>{service.icon}</Text>
            </View>

            {/* Content */}
            <View style={styles.cardContent}>
              <Text style={styles.cardName}>{service.name}</Text>
              <Text style={styles.cardTagline} numberOfLines={1}>
                {service.tagline}
              </Text>

              {/* Next slot */}
              <View style={styles.slotRow}>
                <Ionicons name="time-outline" size={11} color={service.accentColor} />
                <Text style={[styles.slotText, { color: service.accentColor }]}>
                  {service.nextSlot}
                </Text>
              </View>

              {/* Cashback */}
              <View style={styles.cashbackRow}>
                <View
                  style={[
                    styles.cashbackPill,
                    { backgroundColor: service.bgColor },
                  ]}
                >
                  <Text
                    style={[styles.cashbackText, { color: service.accentColor }]}
                  >
                    {service.cashbackPercent}% cashback
                  </Text>
                </View>
              </View>

              {/* Book Now CTA */}
              <Pressable
                style={[
                  styles.bookBtn,
                  { backgroundColor: service.accentColor },
                ]}
                onPress={() => handleServicePress(service)}
              >
                <Text style={styles.bookBtnText}>Book Now</Text>
                <Ionicons name="arrow-forward" size={12} color="#fff" />
              </Pressable>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {/* ── Bottom all-services row ── */}
      <View style={styles.allServicesRow}>
        {UTILITY_SERVICES.map((service) => (
          <Pressable
            key={`quick-${service.id}`}
            style={styles.quickChip}
            onPress={() => handleServicePress(service)}
          >
            <View style={[styles.quickChipIcon, { backgroundColor: service.bgColor }]}>
              <Text style={{ fontSize: 18 }}>{service.icon}</Text>
            </View>
            <Text style={styles.quickChipText} numberOfLines={1}>
              {service.name.split(' ')[0]}
            </Text>
          </Pressable>
        ))}
      </View>
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
  tagline: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 2,
    fontStyle: 'italic',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.lightMustard,
  },

  // Hero banner
  heroBanner: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  heroBannerContent: {
    flex: 1,
    marginRight: 12,
  },
  heroBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  heroBannerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  heroBannerEmoji: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    gap: 12,
  },

  // Card
  card: {
    width: 168,
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: 14,
    gap: 10,
    shadowColor: colors.nileBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: {
    fontSize: 26,
  },
  cardContent: {
    gap: 6,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.nileBlue,
  },
  cardTagline: {
    fontSize: 11,
    color: colors.neutral[500],
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  slotText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cashbackRow: {
    flexDirection: 'row',
  },
  cashbackPill: {
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  cashbackText: {
    fontSize: 11,
    fontWeight: '700',
  },
  bookBtn: {
    borderRadius: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 2,
  },
  bookBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },

  // All services row (quick access)
  allServicesRow: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  quickChip: {
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  quickChipIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.nileBlue,
  },
});

export default React.memo(EmployeeUtilityServicesSection);
