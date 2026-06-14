// @ts-nocheck
/**
 * StudentBudgetFoodGrid
 *
 * 2-column grid of student food subcategories with icons.
 * Only rendered when persona = student (verified_student or statedIdentity === 'student').
 *
 * Section title: "Budget Eats Near You"
 */

import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/theme';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface FoodSubcategory {
  id: string;
  slug: string;
  icon: string;
  name: string;
  offersCount: number;
  bgColor: string;
}

// ─── Static data ───────────────────────────────────────────────────────────────

const FOOD_SUBCATEGORIES: FoodSubcategory[] = [
  { id: 'cafes', slug: 'cafes', icon: '☕', name: 'Cafes', offersCount: 24, bgColor: '#FFFBEB' },
  { id: 'street-food', slug: 'street-food', icon: '🌮', name: 'Street Food', offersCount: 38, bgColor: '#FFF7ED' },
  { id: 'desserts', slug: 'desserts', icon: '🍰', name: 'Desserts', offersCount: 17, bgColor: '#FDF4FF' },
  { id: 'juice-shakes', slug: 'juice-shakes', icon: '🥤', name: 'Juice & Shakes', offersCount: 21, bgColor: '#F0FDF4' },
  { id: 'cloud-kitchens', slug: 'cloud-kitchens', icon: '☁️', name: 'Cloud Kitchens', offersCount: 15, bgColor: '#EFF6FF' },
  { id: 'qsr', slug: 'qsr', icon: '🍔', name: 'QSR', offersCount: 29, bgColor: '#FEF9C3' },
  { id: 'late-night', slug: 'late-night', icon: '🌙', name: 'Late Night Food', offersCount: 12, bgColor: '#F5F3FF' },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

interface TileProps {
  item: FoodSubcategory;
  onPress: (slug: string) => void;
}

// eslint-disable-next-line react/display-name
const FoodTile: React.FC<TileProps> = memo(({ item, onPress }) => (
  <Pressable
    style={[styles.tile, { backgroundColor: item.bgColor }]}
    onPress={() => onPress(item.slug)}
    android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
  >
    <Text style={styles.tileIcon}>{item.icon}</Text>
    <Text style={styles.tileName} numberOfLines={2}>{item.name}</Text>
    <View style={styles.offersBadge}>
      <Text style={styles.offersText}>{item.offersCount} offers</Text>
    </View>
  </Pressable>
));

// ─── Main component ────────────────────────────────────────────────────────────

const StudentBudgetFoodGrid: React.FC = () => {
  const router = useRouter();

  const handleTilePress = (slug: string) => {
    // Navigate directly to the store list filtered by the chosen food subcategory.
    // /near-u/food does not consume the subcategory param, so we go straight to
    // StoreListPage which does accept a category filter.
    router.push({
      pathname: '/StoreListPage',
      params: { category: slug, sort: 'rating' },
    } as unknown);
  };

  const handleViewAll = () => {
    // Open the generic food discovery page for browsing all food options.
    router.push('/near-u/food' as unknown);
  };

  const renderItem = ({ item }: { item: FoodSubcategory }) => (
    <FoodTile item={item} onPress={handleTilePress} />
  );

  const keyExtractor = (item: FoodSubcategory) => item.id;

  const ListHeaderComponent = (
    <View style={styles.header}>
      <View>
        <Text style={styles.title}>Budget Eats Near You</Text>
        <Text style={styles.subtitle}>Deals under ₹149 for students</Text>
      </View>
      <Pressable style={styles.viewAllButton} onPress={handleViewAll}>
        <Text style={styles.viewAllText}>View all</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      {ListHeaderComponent}
      <FlatList
        data={FOOD_SUBCATEGORIES}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={2}
        scrollEnabled={false}
        columnWrapperStyle={styles.columnWrapper}
        ItemSeparatorComponent={() => <View style={styles.rowSeparator} />}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const CARD_GAP = 10;

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  listContent: {
    // No additional padding — parent container already has paddingHorizontal: 16
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  rowSeparator: {
    height: CARD_GAP,
  },
  tile: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: CARD_GAP / 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
      },
    }),
  },
  tileIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  tileName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.nileBlue,
    marginBottom: 8,
    lineHeight: 18,
    fontFamily: 'Inter-Bold',
  },
  offersBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 200, 87, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  offersText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFC857',
    fontFamily: 'Inter-SemiBold',
  },
});

export default memo(StudentBudgetFoodGrid);
