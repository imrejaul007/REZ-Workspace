/**
 * /near-u/budget
 *
 * Budget-friendly deals — stores and offers under ₹199.
 * Primarily for the student persona but open to everyone.
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { BUDGET_PRICE_TIERS, BUDGET_DEALS_MAX_DISPLAY_PRICE } from '@/constants/appConstants';

const BUDGET_FILTER_EMOJIS: Record<number, string> = { 49: '🤑', 99: '💰', 149: '🏷️', 199: '🛍️' };
const BUDGET_FILTERS = BUDGET_PRICE_TIERS.map((price) => ({
  id: `under${price}`,
  label: `Under ₹${price}`,
  emoji: BUDGET_FILTER_EMOJIS[price] ?? '🏷️',
  maxPrice: price,
}));

const BUDGET_CATEGORIES = [
  { id: 'street-food', emoji: '🌮', label: 'Street Food', color: colors.tint.orange },
  { id: 'cafe', emoji: '☕', label: 'Cafes', color: colors.tint.amber },
  { id: 'grocery', emoji: '🥬', label: 'Grocery', color: colors.tint.greenLight },
  { id: 'snacks', emoji: '🍟', label: 'Snacks', color: colors.warningScale[50] },
  { id: 'bakery', emoji: '🥐', label: 'Bakery', color: colors.pinkMist },
  { id: 'juice', emoji: '🥤', label: 'Juice Bar', color: colors.tint.greenLight },
];

export default function BudgetScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text?.primary || '#111'} />
        </Pressable>
        <Text style={styles.headerTitle}>Budget Deals</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Hero */}
        <LinearGradient
          colors={[colors.warningScale[400], colors.warningScale[200]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroInner}>
            <View>
              <Text style={styles.heroTitle}>🏷️ Great deals await</Text>
              <Text style={styles.heroSub}>
                Discover amazing offers under ₹{BUDGET_DEALS_MAX_DISPLAY_PRICE} near you
              </Text>
            </View>
            <Text style={styles.heroEmoji}>💸</Text>
          </View>
        </LinearGradient>

        {/* Price filter pills */}
        <Text style={styles.sectionTitle}>Filter by price</Text>
        <View style={styles.pillRow}>
          {BUDGET_FILTERS.map((f) => (
            <Pressable
              key={f.id}
              style={styles.pill}
              onPress={() =>
                router.push({
                  pathname: '/StoreListPage',
                  params: { maxPrice: f.maxPrice, sort: 'price_low' },
                } as unknown as string)
              }
            >
              <Text style={styles.pillEmoji}>{f.emoji}</Text>
              <Text style={styles.pillLabel}>{f.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Category grid */}
        <Text style={styles.sectionTitle}>Browse categories</Text>
        <View style={styles.grid}>
          {BUDGET_CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              style={[styles.categoryCard, { backgroundColor: cat.color }]}
              onPress={() =>
                router.push({
                  pathname: '/StoreListPage',
                  params: { category: cat.id, maxPrice: 199, sort: 'price_low' },
                } as unknown as string)
              }
            >
              <Text style={styles.catEmoji}>{cat.emoji}</Text>
              <Text style={styles.catLabel}>{cat.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* All budget deals CTA */}
        <Pressable
          style={styles.allDealsBtn}
          onPress={() =>
            router.push({
              pathname: '/StoreListPage',
              params: { maxPrice: BUDGET_DEALS_MAX_DISPLAY_PRICE, sort: 'price_low' },
            } as unknown as string)
          }
        >
          <Text style={styles.allDealsBtnText}>See all deals under ₹{BUDGET_DEALS_MAX_DISPLAY_PRICE}</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.warningScale[400]} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  backBtn: { width: 32 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.text?.primary || '#111' },
  headerRight: { width: 32 },
  content: { paddingBottom: 40 },

  hero: { margin: spacing.lg, borderRadius: borderRadius.xl, padding: 20, overflow: 'hidden' },
  heroInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroTitle: { fontSize: 18, fontWeight: '800', color: colors.brand.amberDark, marginBottom: 4 },
  heroSub: { fontSize: 12, color: colors.brand.amberDeep, maxWidth: '80%', lineHeight: 18 },
  heroEmoji: { fontSize: 44, opacity: 0.85 },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text?.primary || '#111',
    marginHorizontal: spacing.lg,
    marginTop: 20,
    marginBottom: 12,
  },
  pillRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: 8, flexWrap: 'wrap' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.tint.amber,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.warningScale[200],
  },
  pillEmoji: { fontSize: 14 },
  pillLabel: { fontSize: 13, fontWeight: '600', color: colors.brand.amberDark },

  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg, gap: 10 },
  categoryCard: {
    width: '30%',
    borderRadius: borderRadius.lg,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  catEmoji: { fontSize: 28, marginBottom: 6 },
  catLabel: { fontSize: 12, fontWeight: '700', color: colors.text.primary, textAlign: 'center' },

  allDealsBtn: {
    marginHorizontal: spacing.lg,
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: colors.warningScale[400],
  },
  allDealsBtnText: { fontSize: 15, fontWeight: '700', color: colors.warningScale[400] },
});
