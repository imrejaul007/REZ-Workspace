// @ts-nocheck
/**
 * Restaurant Detail Screen
 * Detailed view of a restaurant with menu
 */

import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Linking,
  Share,
  Dimensions,
  SectionList,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useRestaurant, useRestaurantMenu, type MenuItem, type MenuCategory } from '@/hooks/useREZMerchant';
import { colors, spacing, borderRadius, shadows } from '@/constants/theme';

const { width } = Dimensions.get('window');

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: restaurant, isLoading: isLoadingRestaurant, error: restaurantError, refetch: refetchRestaurant } = useRestaurant(id);
  const { data: menu, isLoading: isLoadingMenu, error: menuError } = useRestaurantMenu(id);

  const [activeTab, setActiveTab] = useState<'menu' | 'info' | 'reviews'>('menu');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const handleCall = useCallback(() => {
    if (restaurant?.phone) {
      Linking.openURL(`tel:${restaurant.phone}`);
    }
  }, [restaurant?.phone]);

  const handleShare = useCallback(async () => {
    if (restaurant) {
      try {
        await Share.share({
          message: `Check out ${restaurant.name} on REZ!\nOrder food online`,
          title: restaurant.name,
        });
      } catch (error) {
        // Handle error silently
      }
    }
  }, [restaurant]);

  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  }, []);

  const menuSections = useMemo(() => {
    if (!menu?.categories) return [];
    return menu.categories.map((category) => ({
      id: category.id,
      title: category.name,
      data: category.items,
    }));
  }, [menu]);

  const renderMenuItem = useCallback(({ item }: { item: MenuItem }) => (
    <TouchableOpacity style={styles.menuItem} activeOpacity={0.8}>
      <View style={styles.menuItemContent}>
<View style={styles.menuItemInfo}>
          {/* Veg/Non-Veg Badge */}
          <View style={[
            styles.foodBadge,
            item.isVeg ? styles.vegBadge : item.isNonVeg ? styles.nonVegBadge : styles.eggBadge
          ]}>
            <View style={[
              styles.foodBadgeInner,
              item.isVeg ? styles.vegInner : item.isNonVeg ? styles.nonVegInner : styles.eggInner
            ]} />
          </View>
          <Text style={styles.menuItemName}>{item.name}</Text>
          {item.description && (
            <Text style={styles.menuItemDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <View style={styles.menuItemMeta}>
            <Text style={styles.menuItemPrice}>₹{item.price}</Text>
            {item.preparationTime && (
              <Text style={styles.prepTime}>🕒 {item.preparationTime} min</Text>
            )}
          </View>
          {item.spices !== undefined && item.spices > 0 && (
            <View style={styles.spiceLevel}>
              {Array(item.spices).fill(0).map((_, i) => (
                <Text key={i} style={styles.spiceIcon}>🌶️</Text>
              ))}
            </View>
          )}
        </View>
        {item.thumbnail && (
          <Image
            source={{ uri: item.thumbnail }}
            style={styles.menuItemImage}
            resizeMode="cover"
          />
        )}
      </View>
      {!item.available && (
        <View style={styles.unavailableOverlay}>
          <Text style={styles.unavailableText}>Unavailable</Text>
        </View>
      )}
    </TouchableOpacity>
  ), []);

  const renderSectionHeader = useCallback(({ section }: { section: { id: string; title: string; data: MenuItem[] } }) => {
    const isExpanded = expandedCategories.has(section.id) || expandedCategories.size === 0;
    return (
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => toggleCategory(section.id)}
        activeOpacity={0.7}
      >
        <View style={styles.sectionHeaderContent}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionCount}>{section.data.length} items</Text>
        </View>
        <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>
    );
  }, [expandedCategories, toggleCategory]);

  if (isLoadingRestaurant) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Loading restaurant...</Text>
      </View>
    );
  }

  if (restaurantError || !restaurant) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorTitle}>Failed to load restaurant</Text>
        <Text style={styles.errorSubtitle}>{restaurantError?.message || 'Restaurant not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetchRestaurant()}>
          <Text style={styles.retryText}>Tap to retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: restaurant.name,
          headerShown: true,
          headerTransparent: true,
          headerTitle: '',
          headerBackTitle: 'Back',
        }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          {restaurant.coverImage || restaurant.logo ? (
            <Image
              source={{ uri: restaurant.coverImage || restaurant.logo }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Text style={styles.placeholderEmoji}>🍽️</Text>
            </View>
          )}
          <View style={styles.heroOverlay} />

          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          {/* Share Button */}
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Text style={styles.shareButtonText}>↗</Text>
          </TouchableOpacity>

          {/* Status Badge */}
          {restaurant.isOpen !== undefined && (
            <View style={[styles.statusBadge, restaurant.isOpen ? styles.openBadge : styles.closedBadge]}>
              <Text style={[styles.statusText, restaurant.isOpen ? styles.openText : styles.closedText]}>
                {restaurant.isOpen ? 'Open' : 'Closed'}
              </Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.restaurantName}>{restaurant.name}</Text>

            {/* Rating */}
            {restaurant.rating && (
              <View style={styles.ratingRow}>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingStar}>⭐</Text>
                  <Text style={styles.ratingValue}>{restaurant.rating.toFixed(1)}</Text>
                </View>
                {restaurant.reviewCount && (
                  <Text style={styles.reviewCount}>{restaurant.reviewCount} reviews</Text>
                )}
              </View>
            )}

            {/* Cuisine Tags */}
            {restaurant.cuisine && restaurant.cuisine.length > 0 && (
              <View style={styles.cuisineRow}>
                {restaurant.cuisine.map((c, index) => (
                  <Text key={index} style={styles.cuisineTag}>{c}</Text>
                ))}
              </View>
            )}

            {/* Info Row */}
            <View style={styles.infoRow}>
              {restaurant.deliveryTime && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoIcon}>🕒</Text>
                  <Text style={styles.infoText}>{restaurant.deliveryTime} min</Text>
                </View>
              )}
              {restaurant.deliveryFee !== undefined && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoIcon}>🚴</Text>
                  <Text style={styles.infoText}>
                    {restaurant.deliveryFee === 0 ? 'Free Delivery' : `₹${restaurant.deliveryFee} delivery`}
                  </Text>
                </View>
              )}
              {restaurant.minOrder && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoIcon}>📦</Text>
                  <Text style={styles.infoText}>Min ₹{restaurant.minOrder}</Text>
                </View>
              )}
            </View>

            {restaurant.priceRange && (
              <Text style={styles.priceRange}>{restaurant.priceRange}</Text>
            )}
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'menu' && styles.activeTab]}
              onPress={() => setActiveTab('menu')}
            >
              <Text style={[styles.tabText, activeTab === 'menu' && styles.activeTabText]}>
                Menu
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'info' && styles.activeTab]}
              onPress={() => setActiveTab('info')}
            >
              <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>
                Info
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
              onPress={() => setActiveTab('reviews')}
            >
              <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>
                Reviews
              </Text>
            </TouchableOpacity>
          </View>

          {/* Menu Content */}
          {activeTab === 'menu' && (
            <View style={styles.menuContainer}>
              {isLoadingMenu ? (
                <View style={styles.menuLoading}>
                  <ActivityIndicator size="small" color={colors.primary[500]} />
                  <Text style={styles.menuLoadingText}>Loading menu...</Text>
                </View>
              ) : menuError || !menu ? (
                <View style={styles.menuError}>
                  <Text style={styles.menuErrorText}>Menu not available</Text>
                </View>
              ) : menuSections.length === 0 ? (
                <View style={styles.menuEmpty}>
                  <Text style={styles.menuEmptyText}>No menu items available</Text>
                </View>
              ) : (
                menuSections.map((section) => (
                  <View key={section.id} style={styles.menuSection}>
                    {renderSectionHeader({ section })}
                    {(expandedCategories.has(section.id) || expandedCategories.size === 0) &&
                      section.data.map((item) => (
                        <View key={item.id}>
                          {renderMenuItem({ item })}
                        </View>
                      ))
                    }
                  </View>
                ))
              )}
            </View>
          )}

          {/* Info Content */}
          {activeTab === 'info' && (
            <View style={styles.infoContainer}>
              {/* Address */}
              {restaurant.address && (
                <View style={styles.infoSection}>
                  <Text style={styles.infoSectionTitle}>Address</Text>
                  <Text style={styles.infoSectionText}>{restaurant.address}</Text>
                  {restaurant.city && (
                    <Text style={styles.infoSectionSubtext}>{restaurant.city}</Text>
                  )}
                </View>
              )}

              {/* Contact */}
              {restaurant.phone && (
                <View style={styles.infoSection}>
                  <Text style={styles.infoSectionTitle}>Contact</Text>
                  <TouchableOpacity style={styles.contactButton} onPress={handleCall}>
                    <Text style={styles.contactIcon}>📞</Text>
                    <Text style={styles.contactText}>{restaurant.phone}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Opening Hours */}
              {restaurant.openingHours && (
                <View style={styles.infoSection}>
                  <Text style={styles.infoSectionTitle}>Opening Hours</Text>
                  <View style={styles.hoursContainer}>
                    {Object.entries(restaurant.openingHours).map(([day, hours]) => (
                      <View key={day} style={styles.hoursRow}>
                        <Text style={styles.hoursDay}>
                          {day.charAt(0).toUpperCase() + day.slice(1)}
                        </Text>
                        <Text style={styles.hoursTime}>
                          {hours.closed ? 'Closed' : `${hours.open} - ${hours.close}`}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Reviews Content */}
          {activeTab === 'reviews' && (
            <View style={styles.reviewsContainer}>
              <View style={styles.reviewsEmpty}>
                <Text style={styles.reviewsEmptyEmoji}>⭐</Text>
                <Text style={styles.reviewsEmptyText}>No reviews yet</Text>
                <Text style={styles.reviewsEmptySubtext}>Be the first to review!</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.orderButton}>
          <Text style={styles.orderButtonText}>View Full Menu</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: spacing.xl,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  errorSubtitle: {
    fontSize: 14,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginBottom: spacing.base,
  },
  retryButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  heroContainer: {
    width: width,
    height: 250,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.tint.slate,
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.tint.lavender,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 80,
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: spacing.base,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: colors.text.primary,
  },
  shareButton: {
    position: 'absolute',
    top: 50,
    right: spacing.base,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 18,
    color: colors.text.primary,
  },
  statusBadge: {
    position: 'absolute',
    bottom: spacing.base,
    right: spacing.base,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  openBadge: {
    backgroundColor: colors.successScale[100],
  },
  closedBadge: {
    backgroundColor: colors.errorScale[100],
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  openText: {
    color: colors.success,
  },
  closedText: {
    color: colors.error,
  },
  content: {
    marginTop: -spacing.xl,
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.base,
    paddingBottom: 100,
  },
  header: {
    marginBottom: spacing.base,
  },
  restaurantName: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tint.gold,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  ratingStar: {
    fontSize: 14,
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  reviewCount: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
  cuisineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  cuisineTag: {
    fontSize: 13,
    color: colors.text.secondary,
    backgroundColor: colors.tint.slate,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.base,
    marginBottom: spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  infoIcon: {
    fontSize: 14,
  },
  infoText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  priceRange: {
    fontSize: 16,
    color: colors.primary[600],
    fontWeight: '500',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    marginBottom: spacing.base,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary[500],
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.tertiary,
  },
  activeTabText: {
    color: colors.primary[500],
    fontWeight: '600',
  },
  menuContainer: {
    marginBottom: spacing.base,
  },
  menuLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  menuLoadingText: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
  menuError: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  menuErrorText: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
  menuEmpty: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  menuEmptyText: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
  menuSection: {
    marginBottom: spacing.base,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.tint.slate,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  sectionHeaderContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  sectionCount: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  expandIcon: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  menuItem: {
    backgroundColor: colors.background.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    ...shadows.subtle,
  },
  menuItemContent: {
    flexDirection: 'row',
  },
  menuItemInfo: {
    flex: 1,
  },
  foodBadge: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  vegBadge: {
    borderColor: colors.success,
  },
  nonVegBadge: {
    borderColor: colors.error,
  },
  eggBadge: {
    borderColor: colors.warning,
  },
  foodBadgeInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  vegInner: {
    backgroundColor: colors.success,
  },
  nonVegInner: {
    backgroundColor: colors.error,
  },
  eggInner: {
    backgroundColor: colors.warning,
  },
  menuItemName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 2,
  },
  menuItemDescription: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  menuItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  menuItemPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  prepTime: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  spiceLevel: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  spiceIcon: {
    fontSize: 12,
    marginRight: 2,
  },
  menuItemImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    marginLeft: spacing.md,
  },
  unavailableOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unavailableText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.error,
 },
  infoContainer: {
    marginBottom: spacing.base,
  },
  infoSection: {
    marginBottom: spacing.xl,
  },
  infoSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  infoSectionText: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  infoSectionSubtext: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tint.slate,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  contactIcon: {
    fontSize: 20,
  },
  contactText: {
    fontSize: 15,
    color: colors.text.primary,
    fontWeight: '500',
  },
  hoursContainer: {
    backgroundColor: colors.tint.slate,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  hoursDay: {
    fontSize: 14,
    color: colors.text.primary,
  },
  hoursTime: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  reviewsContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  reviewsEmpty: {
    alignItems: 'center',
  },
  reviewsEmptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  reviewsEmptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  reviewsEmptySubtext: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background.primary,
    padding: spacing.base,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    ...shadows.medium,
  },
  orderButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  orderButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
});
