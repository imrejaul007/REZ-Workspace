import { withErrorBoundary } from '@/utils/withErrorBoundary';
/**
 * Store Menu Screen
 * Route: /store/[storeSlug]/menu
 *
 * Displays the menu for a restaurant/store when scanned from a QR code.
 * Supports table-specific ordering when tableNumber is provided.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import apiClient from '@/services/apiClient';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import { useIsMounted } from '@/hooks/useIsMounted';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  isAvailable: boolean;
  isPopular?: boolean;
  tags?: string[];
}

interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

interface StoreInfo {
  storeId: string;
  storeName: string;
  storeSlug: string;
  logo?: string;
  rating?: number;
  deliveryTime?: string;
  categories: MenuCategory[];
}

const MenuPageScreen: React.FC = () => {
  const isMounted = useIsMounted();
  const router = useRouter();
  const params = useLocalSearchParams<{
    storeSlug: string;
    tableNumber?: string;
  }>();

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMenu = useCallback(async () => {
    if (!params.storeSlug) {
      setError('Invalid store QR code. Missing store information.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.get(`/stores/${params.storeSlug}/menu`);

      if (response.success && response.data) {
        if (!isMounted()) return;
        setStoreInfo({
          ...(response.data as Omit<StoreInfo, 'tableNumber'>),
          storeSlug: params.storeSlug,
        });
        setError(null);
      } else {
        if (!isMounted()) return;
        // Use mock data for demo when API not available
        setStoreInfo({
          storeId: 'mock-store-id',
          storeName: 'The Gourmet Kitchen',
          storeSlug: params.storeSlug,
          rating: 4.5,
          deliveryTime: '15-25 min',
          categories: [
            {
              id: 'appetizers',
              name: 'Appetizers',
              items: [
                {
                  id: 'item-1',
                  name: 'Spring Rolls',
                  description: 'Crispy vegetable spring rolls with sweet chili sauce',
                  price: 8.99,
                  category: 'appetizers',
                  isAvailable: true,
                  isPopular: true,
                },
                {
                  id: 'item-2',
                  name: 'Soup of the Day',
                  description: 'Ask your server for todays selection',
                  price: 6.99,
                  category: 'appetizers',
                  isAvailable: true,
                },
              ],
            },
            {
              id: 'mains',
              name: 'Main Courses',
              items: [
                {
                  id: 'item-3',
                  name: 'Grilled Salmon',
                  description: 'Fresh Atlantic salmon with lemon butter sauce',
                  price: 24.99,
                  category: 'mains',
                  isAvailable: true,
                  isPopular: true,
                },
                {
                  id: 'item-4',
                  name: 'Ribeye Steak',
                  description: '12oz prime ribeye with garlic mashed potatoes',
                  price: 34.99,
                  category: 'mains',
                  isAvailable: true,
                },
                {
                  id: 'item-5',
                  name: 'Vegetarian Pasta',
                  description: 'Penne with seasonal vegetables in basil pesto',
                  price: 18.99,
                  category: 'mains',
                  isAvailable: true,
                },
              ],
            },
            {
              id: 'desserts',
              name: 'Desserts',
              items: [
                {
                  id: 'item-6',
                  name: 'Chocolate Lava Cake',
                  description: 'Warm chocolate cake with molten center',
                  price: 9.99,
                  category: 'desserts',
                  isAvailable: true,
                  isPopular: true,
                },
                {
                  id: 'item-7',
                  name: 'Cheesecake',
                  description: 'New York style with berry compote',
                  price: 8.99,
                  category: 'desserts',
                  isAvailable: true,
                },
              ],
            },
            {
              id: 'drinks',
              name: 'Beverages',
              items: [
                {
                  id: 'item-8',
                  name: 'Fresh Juice',
                  description: 'Orange, Apple, or Mixed Berry',
                  price: 5.99,
                  category: 'drinks',
                  isAvailable: true,
                },
                {
                  id: 'item-9',
                  name: 'Coffee',
                  description: 'Espresso, Latte, or Cappuccino',
                  price: 4.99,
                  category: 'drinks',
                  isAvailable: true,
                },
              ],
            },
          ],
        });
      }
    } catch (err) {
      if (!isMounted()) return;
      // Use mock data on error for demo
      setStoreInfo({
        storeId: 'mock-store-id',
        storeName: 'The Gourmet Kitchen',
        storeSlug: params.storeSlug,
        rating: 4.5,
        deliveryTime: '15-25 min',
        categories: [
          {
            id: 'appetizers',
            name: 'Appetizers',
            items: [
              {
                id: 'item-1',
                name: 'Spring Rolls',
                description: 'Crispy vegetable spring rolls with sweet chili sauce',
                price: 8.99,
                category: 'appetizers',
                isAvailable: true,
                isPopular: true,
              },
              {
                id: 'item-2',
                name: 'Soup of the Day',
                description: "Ask your server for today's selection",
                price: 6.99,
                category: 'appetizers',
                isAvailable: true,
              },
            ],
          },
          {
            id: 'mains',
            name: 'Main Courses',
            items: [
              {
                id: 'item-3',
                name: 'Grilled Salmon',
                description: 'Fresh Atlantic salmon with lemon butter sauce',
                price: 24.99,
                category: 'mains',
                isAvailable: true,
                isPopular: true,
              },
              {
                id: 'item-4',
                name: 'Ribeye Steak',
                description: '12oz prime ribeye with garlic mashed potatoes',
                price: 34.99,
                category: 'mains',
                isAvailable: true,
              },
            ],
          },
        ],
      });
    } finally {
      if (isMounted()) {
        setIsLoading(false);
      }
    }
  }, [params.storeSlug, isMounted]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMenu();
    setRefreshing(false);
  }, [fetchMenu]);

  const handleItemPress = (item: MenuItem) => {
    if (!item.isAvailable) {
      return;
    }
    router.push({
      pathname: '/store/order',
      params: {
        storeSlug: params.storeSlug,
        itemId: item.id,
        ...(params.tableNumber ? { tableNumber: params.tableNumber } : {}),
      },
    });
  };

  const filteredCategories = storeInfo?.categories
    .map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => {
        const matchesSearch =
          searchQuery === '' ||
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
      }),
    }))
    .filter((cat) => cat.items.length > 0);

  const displayedCategories = selectedCategory
    ? filteredCategories?.filter((cat) => cat.id === selectedCategory)
    : filteredCategories;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Menu' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.brand.primary} />
          <Text style={styles.loadingText}>Loading menu...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !storeInfo) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Menu' }} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={fetchMenu}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: storeInfo?.storeName || 'Menu',
          headerStyle: { backgroundColor: colors.background.primary },
        }}
      />

      {/* Table Banner */}
      {params.tableNumber && (
        <View style={styles.tableBanner}>
          <Ionicons name="table-outline" size={20} color={Colors.white} />
          <Text style={styles.tableBannerText}>Table {params.tableNumber}</Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Store Header */}
        <LinearGradient
          colors={[colors.brand.nileBlue, colors.brand.nileBlueDark]}
          style={styles.headerGradient}
        >
          <View style={styles.storeHeader}>
            <Text style={styles.storeName}>{storeInfo?.storeName}</Text>
            <View style={styles.storeMeta}>
              {storeInfo?.rating && (
                <View style={styles.metaItem}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={styles.metaText}>{storeInfo.rating}</Text>
                </View>
              )}
              {storeInfo?.deliveryTime && (
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={14} color={Colors.white} />
                  <Text style={styles.metaText}>{storeInfo.deliveryTime}</Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search menu..."
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.text.tertiary} />
            </Pressable>
          )}
        </View>

        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryScrollContent}
        >
          <Pressable
            style={[
              styles.categoryPill,
              !selectedCategory && styles.categoryPillActive,
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text
              style={[
                styles.categoryPillText,
                !selectedCategory && styles.categoryPillTextActive,
              ]}
            >
              All
            </Text>
          </Pressable>
          {storeInfo?.categories.map((cat) => (
            <Pressable
              key={cat.id}
              style={[
                styles.categoryPill,
                selectedCategory === cat.id && styles.categoryPillActive,
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text
                style={[
                  styles.categoryPillText,
                  selectedCategory === cat.id && styles.categoryPillTextActive,
                ]}
              >
                {cat.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Menu Items */}
        {displayedCategories?.map((category) => (
          <View key={category.id} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category.name}</Text>
            {category.items.map((item) => (
              <Pressable
                key={item.id}
                style={[
                  styles.menuItem,
                  !item.isAvailable && styles.menuItemUnavailable,
                ]}
                onPress={() => handleItemPress(item)}
                disabled={!item.isAvailable}
              >
                <View style={styles.menuItemContent}>
                  <View style={styles.menuItemHeader}>
                    <Text style={styles.menuItemName}>{item.name}</Text>
                    {item.isPopular && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularBadgeText}>Popular</Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.menuItemDescription,
                      !item.isAvailable && styles.menuItemTextUnavailable,
                    ]}
                    numberOfLines={2}
                  >
                    {item.description}
                  </Text>
                  <View style={styles.menuItemFooter}>
                    <Text style={styles.menuItemPrice}>${item.price.toFixed(2)}</Text>
                    {!item.isAvailable && (
                      <Text style={styles.unavailableText}>Unavailable</Text>
                    )}
                  </View>
                </View>
                <View style={styles.menuItemImage}>
                  <Ionicons name="restaurant-outline" size={24} color={colors.text.tertiary} />
                </View>
              </Pressable>
            ))}
          </View>
        ))}

        {displayedCategories?.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>No items found</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
    color: colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  errorText: {
    ...Typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  retryButtonText: {
    ...Typography.button,
    color: Colors.white,
  },
  tableBanner: {
    backgroundColor: Colors.brand.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  tableBannerText: {
    ...Typography.subtitle,
    color: Colors.white,
    fontWeight: '600',
  },
  headerGradient: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  storeHeader: {
    alignItems: 'center',
  },
  storeName: {
    ...Typography.h2,
    color: Colors.white,
    textAlign: 'center',
  },
  storeMeta: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    gap: Spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metaText: {
    ...Typography.caption,
    color: Colors.white,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    marginHorizontal: Spacing.lg,
    marginTop: -Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    ...Typography.body,
    color: colors.text.primary,
  },
  categoryScroll: {
    marginTop: Spacing.md,
  },
  categoryScrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  categoryPillActive: {
    backgroundColor: Colors.brand.primary,
    borderColor: Colors.brand.primary,
  },
  categoryPillText: {
    ...Typography.caption,
    color: colors.text.secondary,
  },
  categoryPillTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  categorySection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  categoryTitle: {
    ...Typography.h4,
    color: colors.text.primary,
    marginBottom: Spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  menuItemUnavailable: {
    opacity: 0.6,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  menuItemName: {
    ...Typography.subtitle,
    color: colors.text.primary,
  },
  popularBadge: {
    backgroundColor: Colors.warning,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  popularBadgeText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '600',
    fontSize: 10,
  },
  menuItemDescription: {
    ...Typography.caption,
    color: colors.text.secondary,
    marginTop: Spacing.xs,
  },
  menuItemTextUnavailable: {
    color: colors.text.tertiary,
  },
  menuItemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  menuItemPrice: {
    ...Typography.subtitle,
    color: Colors.brand.primary,
    fontWeight: '700',
  },
  unavailableText: {
    ...Typography.caption,
    color: Colors.error,
  },
  menuItemImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  emptyText: {
    ...Typography.body,
    color: colors.text.tertiary,
  },
});

export default withErrorBoundary(MenuPageScreen, 'MenuPageScreen');
