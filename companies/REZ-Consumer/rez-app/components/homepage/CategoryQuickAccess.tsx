// @ts-nocheck
/**
 * CategoryQuickAccess — Horizontal scrollable category chip strip.
 *
 * Design: white cards, subtle shadow, Nile Blue text + emoji icons.
 * Placed above the main feed as the first section for instant navigation.
 */

import React, { memo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';

// ── Brand tokens (CRED Light palette) ────────────────────────────────────────
const NILE_BLUE     = '#1a3a52';
const MUSTARD       = '#FFC857';
const CARD_BG       = '#FFFFFF';
const CARD_BORDER   = 'rgba(0,0,0,0.06)';
const EMOJI_BOX_BG  = '#F3F4F6';
const PRIMARY_TEXT  = '#1a1a1a';
const SECONDARY_TEXT = '#6B7280';

// ── Category data ─────────────────────────────────────────────────────────────
interface Category {
  id: string;
  emoji: string;
  label: string;
  route: string;
}

const CATEGORIES: Category[] = [
  { id: 'my-savings',  emoji: '💰',  label: 'My Savings',         route: '/savings' },
  { id: 'food',        emoji: '🍕',  label: 'Food & Dining',      route: '/MainCategory/food-dining' },
  { id: 'cafes',       emoji: '☕',  label: 'Cafes',              route: '/MainCategory/food-dining' },
  { id: 'shopping',    emoji: '🛍️',  label: 'Shopping',           route: '/(tabs)/categories' },
  { id: 'health',      emoji: '💊',  label: 'Health',             route: '/MainCategory/healthcare' },
  { id: 'entertain',   emoji: '🎬',  label: 'Entertainment',      route: '/MainCategory/entertainment' },
  { id: 'beauty',      emoji: '💇',  label: 'Beauty & Salon',     route: '/MainCategory/beauty-wellness' },
  { id: 'fitness',     emoji: '🏋️',  label: 'Fitness',            route: '/MainCategory/fitness-sports' },
  { id: 'education',   emoji: '📚',  label: 'Education',          route: '/MainCategory/education-learning' },
];

// ── Single chip ───────────────────────────────────────────────────────────────
interface ChipProps {
  category: Category;
  onPress: (id: string, route: string) => void;
}

// eslint-disable-next-line react/display-name
const CategoryChip: React.FC<ChipProps> = memo(({ category, onPress }) => {
  const handlePress = useCallback(() => {
    onPress(category.id, category.route);
  }, [category.id, category.route, onPress]);

  return (
    <Pressable
      style={({ pressed }) => [styles.chip, pressed ? styles.chipPressed : null]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Browse ${category.label}`}
      accessibilityHint={`Tap to explore ${category.label} deals`}
    >
      <View style={styles.emojiBox}>
        <Text style={styles.emoji}>{category.emoji}</Text>
      </View>
      <Text style={styles.label} numberOfLines={1}>{category.label}</Text>
    </Pressable>
  );
});

// ── Main Component ────────────────────────────────────────────────────────────
const CategoryQuickAccess: React.FC = () => {
  const router = useRouter();

  const handleCategoryPress = useCallback((id: string, route: string) => {
    try {
      router.push(route as unknown);
    } catch {
      // Route may not exist yet — fail silently
      router.push('/(tabs)/categories' as unknown);
    }
  }, [router]);

  return (
    <View style={styles.container}>
      {/* Section header */}
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Browse Categories</Text>
        <Pressable
          onPress={() => router.push('/(tabs)/categories' as unknown)}
          accessibilityRole="button"
          accessibilityLabel="See all categories"
          hitSlop={8}
        >
          <Text style={styles.seeAll}>See all →</Text>
        </Pressable>
      </View>

      {/* Horizontal scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled={false}
        bounces={true}
        decelerationRate="fast"
      >
        {CATEGORIES.map((cat) => (
          <CategoryChip
            key={cat.id}
            category={cat}
            onPress={handleCategoryPress}
          />
        ))}
      </ScrollView>
    </View>
  );
};

// ── Styles (CRED Light) ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PRIMARY_TEXT,
    letterSpacing: -0.2,
  },
  seeAll: {
    fontSize: 12,
    fontWeight: '600',
    color: NILE_BLUE,
  },

  scrollContent: {
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 4,
  },

  chip: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    minWidth: 72,
    maxWidth: 88,
  },
  chipPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
  },

  emojiBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: EMOJI_BOX_BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emoji: {
    fontSize: 20,
    lineHeight: 24,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: SECONDARY_TEXT,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
});

export default memo(CategoryQuickAccess);
