// @ts-nocheck
/**
 * /near-u/food
 *
 * Food & dining discovery — used by the corporate persona "Lunch Nearby" tile.
 * Redirects to the store list filtered by food category.
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '@/constants/theme';

const FOOD_CATEGORIES = [
  { id: 'quick-lunch', emoji: '🍱', label: 'Quick Lunch', sublabel: 'Ready in 15 min', color: '#FFF7ED' },
  { id: 'healthy', emoji: '🥗', label: 'Healthy', sublabel: 'Salads & bowls', color: '#F0FDF4' },
  { id: 'cafe', emoji: '☕', label: 'Café & Coffee', sublabel: 'Work-friendly', color: '#FFFBEB' },
  { id: 'indian', emoji: '🍛', label: 'Indian', sublabel: 'Daal, sabzi & more', color: '#FFF7ED' },
  { id: 'street-food', emoji: '🌮', label: 'Street Food', sublabel: 'Local favourites', color: '#FEF9C3' },
  { id: 'dessert', emoji: '🍰', label: 'Desserts', sublabel: 'Post-meal treats', color: '#FFF1F2' },
];

export default function FoodScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe as unknown} edges={['top']}>
      <View style={styles.header as unknown}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn as unknown}>
          <Ionicons name="chevron-back" size={24} color={colors.text?.primary || '#111'} />
        </Pressable>
        <Text style={styles.headerTitle as unknown}>Food Near You 🍱</Text>
        <View style={styles.headerRight as unknown} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content as unknown}>
        <LinearGradient
          colors={['#1a3a52', '#FFC857']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero as unknown}
        >
          <View style={styles.heroInner as unknown}>
            <View>
              <Text style={styles.heroTitle as unknown}>🍴 Lunch sorted</Text>
              <Text style={styles.heroSub as unknown}>
                Great food from nearby restaurants, delivered fast or ready to pick up
              </Text>
            </View>
            <Text style={styles.heroEmoji as unknown}>🍱</Text>
          </View>
        </LinearGradient>

        <Text style={styles.sectionTitle as unknown}>What are you in the mood for?</Text>
        <View style={styles.grid as unknown}>
          {FOOD_CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              style={[styles.categoryCard as unknown, { backgroundColor: cat.color }]}
              onPress={() =>
                router.push({
                  pathname: '/StoreListPage',
                  params: { category: cat.id, sort: 'rating' },
                } as unknown as string)
              }
            >
              <Text style={styles.catEmoji as unknown}>{cat.emoji}</Text>
              <Text style={styles.catLabel as unknown}>{cat.label}</Text>
              <Text style={styles.catSublabel as unknown}>{cat.sublabel}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={styles.allBtn as unknown}
          onPress={() =>
            router.push({
              pathname: '/StoreListPage',
              params: { category: 'food', sort: 'rating' },
            } as unknown as string)
          }
        >
          <Text style={styles.allBtnText as unknown}>Browse all food spots</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFC857" />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background.primary || '#fff' },
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
  heroTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 4 },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', maxWidth: '80%', lineHeight: 18 },
  heroEmoji: { fontSize: 44, opacity: 0.9 },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text?.primary || '#111',
    marginHorizontal: spacing.lg,
    marginTop: 20,
    marginBottom: 12,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg, gap: 10 },
  categoryCard: {
    width: '47%',
    borderRadius: borderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  catEmoji: { fontSize: 28, marginBottom: 6 },
  catLabel: { fontSize: 14, fontWeight: '700', color: '#111', marginBottom: 2 },
  catSublabel: { fontSize: 11, color: '#6B7280' },

  allBtn: {
    marginHorizontal: spacing.lg,
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: '#FFC857',
  },
  allBtnText: { fontSize: 15, fontWeight: '700', color: '#FFC857' },
});
