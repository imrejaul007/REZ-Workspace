/**
 * EventCategoryTabs Component
 * Horizontal scrollable category tabs — fetches live categories from backend,
 * falls back to hardcoded list. Icons + emojis from backend data.
 */

import React, { memo, useCallback, useRef, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  Text,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { colors } from '@/constants/theme';
import eventsApiService from '@/services/eventsApi';

const { width: screenWidth } = Dimensions.get('window');

// Fallback categories aligned with backend slugs
export const FALLBACK_CATEGORIES = [
  { id: 'all', label: 'All', icon: 'apps-outline' as const, emoji: '🎫' },
  { id: 'music', label: 'Music', icon: 'musical-notes-outline' as const, emoji: '🎵' },
  { id: 'tech', label: 'Tech', icon: 'laptop-outline' as const, emoji: '💻' },
  { id: 'wellness', label: 'Wellness', icon: 'leaf-outline' as const, emoji: '🧘' },
  { id: 'sports', label: 'Sports', icon: 'football-outline' as const, emoji: '⚽' },
  { id: 'education', label: 'Education', icon: 'school-outline' as const, emoji: '📚' },
  { id: 'business', label: 'Business', icon: 'briefcase-outline' as const, emoji: '💼' },
  { id: 'arts', label: 'Arts', icon: 'color-palette-outline' as const, emoji: '🎨' },
  { id: 'food', label: 'Food', icon: 'restaurant-outline' as const, emoji: '🍽️' },
  { id: 'entertainment', label: 'Entertainment', icon: 'film-outline' as const, emoji: '🎬' },
  { id: 'gaming', label: 'Gaming', icon: 'game-controller-outline' as const, emoji: '🎮' },
];

// Map known slugs to Ionicons icon names
const SLUG_ICON_MAP: Record<string, string> = {
  all: 'apps-outline',
  music: 'musical-notes-outline',
  tech: 'laptop-outline',
  technology: 'laptop-outline',
  wellness: 'leaf-outline',
  fitness: 'barbell-outline',
  sports: 'football-outline',
  education: 'school-outline',
  business: 'briefcase-outline',
  arts: 'color-palette-outline',
  food: 'restaurant-outline',
  entertainment: 'film-outline',
  gaming: 'game-controller-outline',
};

interface BackendCategory {
  _id?: string;
  slug: string;
  name: string;
  icon?: string;   // emoji or icon string from backend
  color: string;
  eventCount?: number;
}

interface DisplayCategory {
  id: string;
  label: string;
  ionicon: string;
  emoji: string;
  color: string;
}

interface EventCategoryTabsProps {
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

const EventCategoryTabs: React.FC<EventCategoryTabsProps> = ({
  activeCategory,
  onCategoryChange,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [categories, setCategories] = useState<DisplayCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Build display categories from backend data
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const backendCats = await eventsApiService.getCategories();
        if (cancelled) return;
        if (backendCats && backendCats.length > 0) {
          const all: DisplayCategory = {
            id: 'all',
            label: 'All',
            ionicon: 'apps-outline',
            emoji: '🎫',
            color: colors.nileBlue,
          };
          const mapped = (backendCats as BackendCategory[]).map((c: BackendCategory): DisplayCategory => ({
            id: c.slug,
            label: c.name,
            ionicon: SLUG_ICON_MAP[c.slug] || SLUG_ICON_MAP[c.slug?.toLowerCase()] || 'pricetag-outline',
            // Backend 'icon' field is an emoji string
            emoji: c.icon || '🎫',
            color: c.color || colors.nileBlue,
          }));
          setCategories([all, ...mapped]);
        } else {
          setCategories(
            FALLBACK_CATEGORIES.map(fc => ({
              id: fc.id,
              label: fc.label,
              ionicon: fc.icon,
              emoji: fc.emoji,
              color: colors.nileBlue,
            }))
          );
        }
      } catch {
        if (!cancelled) {
          setCategories(
            FALLBACK_CATEGORIES.map(fc => ({
              id: fc.id,
              label: fc.label,
              ionicon: fc.icon,
              emoji: fc.emoji,
              color: colors.nileBlue,
            }))
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // Scroll to active category
  useEffect(() => {
    const index = categories.findIndex(cat => cat.id === activeCategory);
    if (index > 0 && scrollViewRef.current) {
      const scrollPosition = Math.max(0, index * 90 - screenWidth / 2 + 45);
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ x: scrollPosition, animated: false });
      }, 100);
    }
  }, [activeCategory, categories]);

  const handleCategoryPress = useCallback((categoryId: string) => {
    onCategoryChange(categoryId);
  }, [onCategoryChange]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.nileBlue} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
      >
        {categories.map((category) => {
          const isActive = activeCategory === category.id;
          return (
            <Pressable
              key={category.id}
              style={[
                styles.categoryTab,
                isActive && styles.categoryTabActive,
              ]}
              onPress={() => handleCategoryPress(category.id)}
              accessibilityLabel={`${category.label} category`}
              accessibilityState={{ selected: isActive }}
            >
              <View
                style={[
                  styles.iconContainer,
                  isActive && [styles.iconContainerActive, { backgroundColor: category.color }],
                ]}
              >
                {/* Prefer emoji from backend, fall back to Ionicons */}
                {category.emoji && category.emoji !== '' ? (
                  <Text style={styles.emojiIcon}>{category.emoji}</Text>
                ) : (
                  <Ionicons
                    name={category.ionicon as unknown}
                    size={18}
                    color={isActive ? colors.background.primary : colors.neutral[500]}
                  />
                )}
              </View>
              <ThemedText
                style={[
                  styles.categoryLabel,
                  isActive && [styles.categoryLabelActive, { color: category.color }],
                ]}
              >
                {category.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  loadingContainer: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  categoryTab: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 70,
  },
  categoryTabActive: {
    backgroundColor: 'rgba(26, 58, 82, 0.07)',
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  iconContainerActive: {
    backgroundColor: colors.nileBlue,
  },
  emojiIcon: {
    fontSize: 18,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.neutral[500],
    textAlign: 'center',
  },
  categoryLabelActive: {
    color: colors.nileBlue,
    fontWeight: '700',
  },
});

export default memo(EventCategoryTabs);

// Re-export static list for cases where other code imports EVENT_CATEGORIES
export const EVENT_CATEGORIES = FALLBACK_CATEGORIES;
