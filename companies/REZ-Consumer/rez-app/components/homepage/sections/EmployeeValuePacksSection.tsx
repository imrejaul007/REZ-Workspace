// @ts-nocheck
/**
 * EmployeeValuePacksSection
 *
 * Premium prepaid value packs curated for corporate employees.
 * 3 packs:
 *   1. Rs.999 Salon Pack (worth Rs.1400)
 *   2. Rs.1500 Dining Credit
 *   3. Rs.1999 Wellness Membership
 *
 * Professional dark/navy design matching the employee persona palette.
 *
 * Section title: "Smart Value Packs"
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/theme';
import { useIsMounted } from '@/hooks/useIsMounted';
import employeeHomepageApi, { ValuePack } from '@/services/employeeHomepageApi';

// ─── Static fallback packs ────────────────────────────────────────────────────

const STATIC_PACKS: ValuePack[] = [
  {
    id: 'vp1',
    title: 'Salon Smart Pack',
    category: 'salon',
    price: 999,
    value: 1400,
    savings: 401,
    savingsPercent: 29,
    validityDays: 90,
    highlights: ['Haircut + styling', 'Facial & cleanup', 'Manicure / pedicure'],
    ctaLabel: 'Buy Pack',
    badgeColor: '#1a3a52',
  },
  {
    id: 'vp2',
    title: 'Dining Credit',
    category: 'dining',
    price: 1500,
    value: 1500,
    savings: 0,           // full value credit — earnings via cashback
    savingsPercent: 0,
    validityDays: 60,
    highlights: ['₹1500 dining wallet', '12% extra cashback', '200+ partner restaurants'],
    ctaLabel: 'Load Credits',
    badgeColor: '#FFC857',
  },
  {
    id: 'vp3',
    title: 'Wellness Membership',
    category: 'wellness',
    price: 1999,
    value: 3200,
    savings: 1201,
    savingsPercent: 38,
    validityDays: 180,
    highlights: ['6-month access', 'Spa, gym & clinics', 'Unlimited bookings'],
    ctaLabel: 'Join Now',
    badgeColor: '#059669',
  },
];

// ─── Category gradient config ─────────────────────────────────────────────────

const PACK_GRADIENTS: Record<
  ValuePack['category'],
  readonly [string, string]
> = {
  salon: ['#1a3a52', '#2d5f87'],
  dining: ['#1a3a52', '#FFC857'],
  wellness: ['#064E3B', '#059669'],
};

const PACK_ICONS: Record<ValuePack['category'], string> = {
  salon: '✂️',
  dining: '🍽️',
  wellness: '🌿',
};

// ─── Component ────────────────────────────────────────────────────────────────

const EmployeeValuePacksSection: React.FC = () => {
  const router = useRouter();
  const isMounted = useIsMounted();

  const [packs, setPacks] = useState<ValuePack[]>(STATIC_PACKS);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchPacks = async () => {
      try {
        setIsLoading(true);
        const res = await employeeHomepageApi.getValuePacks();
        if (cancelled || !isMounted()) return;
        if (res.success && res.data?.packs?.length) {
          setPacks(res.data.packs);
        }
      } catch {
        // Use static fallback
      } finally {
        if (!cancelled && isMounted()) setIsLoading(false);
      }
    };
    fetchPacks();
    return () => { cancelled = true; };
  }, [isMounted]);

  const handlePackPress = useCallback((pack: ValuePack) => {
    router.push({
      pathname: '/value-packs/[id]',
      params: { id: pack.id },
    } as unknown);
  }, [router]);

  const handleViewAll = useCallback(() => {
    router.push('/value-packs' as unknown);
  }, [router]);

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>💼 Smart Value Packs</Text>
          <Text style={styles.headerSubtitle}>
            Prepaid plans that save you more, every time
          </Text>
        </View>
        <Pressable onPress={handleViewAll} hitSlop={8}>
          <Text style={styles.viewAllText}>View All →</Text>
        </Pressable>
      </View>

      {/* ── Trust strip ── */}
      <View style={styles.trustStrip}>
        <View style={styles.trustItem}>
          <Ionicons name="shield-checkmark-outline" size={14} color={colors.nileBlue} />
          <Text style={styles.trustText}>No expiry hassle</Text>
        </View>
        <View style={styles.trustDivider} />
        <View style={styles.trustItem}>
          <Ionicons name="flash-outline" size={14} color={colors.nileBlue} />
          <Text style={styles.trustText}>Instant activation</Text>
        </View>
        <View style={styles.trustDivider} />
        <View style={styles.trustItem}>
          <Ionicons name="card-outline" size={14} color={colors.nileBlue} />
          <Text style={styles.trustText}>Expense-friendly</Text>
        </View>
      </View>

      {/* ── Packs ── */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.nileBlue} />
        </View>
      ) : (
        <View style={styles.packsGrid}>
          {packs.map((pack) => {
            const gradient = PACK_GRADIENTS[pack.category];
            const icon = PACK_ICONS[pack.category];
            const hasSavings = pack.savingsPercent > 0;
            return (
              <Pressable
                key={pack.id}
                style={styles.packCard}
                onPress={() => handlePackPress(pack)}
              >
                <LinearGradient
                  colors={gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.packGradient}
                >
                  {/* Top row: icon + savings badge */}
                  <View style={styles.packTopRow}>
                    <View style={styles.packIconWrap}>
                      <Text style={{ fontSize: 22 }}>{icon}</Text>
                    </View>
                    {hasSavings ? (
                      <View style={styles.savingsBadge}>
                        <Text style={styles.savingsBadgeText}>
                          SAVE {pack.savingsPercent}%
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.savingsBadge}>
                        <Text style={styles.savingsBadgeText}>BEST VALUE</Text>
                      </View>
                    )}
                  </View>

                  {/* Title */}
                  <Text style={styles.packTitle}>{pack.title}</Text>

                  {/* Price + value */}
                  <View style={styles.packPriceRow}>
                    <Text style={styles.packPrice}>₹{pack.price}</Text>
                    {pack.value > pack.price && (
                      <Text style={styles.packValue}>worth ₹{pack.value}</Text>
                    )}
                  </View>

                  {/* Validity */}
                  <Text style={styles.packValidity}>
                    Valid for {pack.validityDays} days
                  </Text>

                  {/* Highlights */}
                  <View style={styles.packHighlights}>
                    {pack.highlights.map((h, i) => (
                      <View key={i} style={styles.highlightRow}>
                        <Ionicons
                          name="checkmark-circle"
                          size={13}
                          color={colors.lightMustard}
                        />
                        <Text style={styles.highlightText}>{h}</Text>
                      </View>
                    ))}
                  </View>

                  {/* CTA */}
                  <Pressable
                    style={styles.packCta}
                    onPress={() => handlePackPress(pack)}
                  >
                    <Text style={styles.packCtaText}>{pack.ctaLabel}</Text>
                    <Ionicons name="chevron-forward" size={14} color={gradient[1]} />
                  </Pressable>
                </LinearGradient>
              </Pressable>
            );
          })}
        </View>
      )}
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

  // Trust strip
  trustStrip: {
    marginHorizontal: 16,
    backgroundColor: colors.tint.slate,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 10,
    marginBottom: 14,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  trustText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.nileBlue,
  },
  trustDivider: {
    width: 1,
    height: 16,
    backgroundColor: colors.border.default,
  },

  // Loading
  loadingContainer: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Packs grid
  packsGrid: {
    paddingHorizontal: 16,
    gap: 14,
  },

  // Pack card
  packCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  packGradient: {
    padding: 20,
    gap: 10,
  },
  packTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  packIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savingsBadge: {
    backgroundColor: colors.lightMustard,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  savingsBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.nileBlue,
    letterSpacing: 0.5,
  },
  packTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  packPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  packPrice: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  packValue: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    textDecorationLine: 'line-through',
  },
  packValidity: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: -4,
  },
  packHighlights: {
    gap: 5,
    marginVertical: 4,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  highlightText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
  packCta: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 6,
  },
  packCtaText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.nileBlue,
  },
});

export default React.memo(EmployeeValuePacksSection);
