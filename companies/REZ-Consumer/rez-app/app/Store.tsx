// @ts-nocheck
import { withErrorBoundary } from '@/utils/withErrorBoundary';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Platform,
  Pressable,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHomepage, useHomepageNavigation } from '@/hooks/useHomepage';
import { LinearGradient } from 'expo-linear-gradient';
import { useProfile, useProfileMenu } from '@/contexts/ProfileContext';
import ProfileMenuModal from '@/components/profile/ProfileMenuModal';
import { profileMenuSections } from '@/data/profileData';
import { useRouter } from 'expo-router';
import deal from '@/assets/images/deal.png';
import CachedImage from '@/components/ui/CachedImage';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import LocationDisplay from '@/components/location/LocationDisplay';
import { storeSearchService, StoreCategory } from '@/services/storeSearchService';
import CategoryGridSkeleton from '@/components/store-search/CategoryGridSkeleton';
import { useRezBalance, useWalletLoading, useGetCurrencySymbol } from '@/stores';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import { BRAND } from '@/constants/brand';
import { colors } from '@/constants/theme';
import { useIsMounted } from '@/hooks/useIsMounted';
import { isSmallDevice, getResponsiveCardWidth, responsiveFontSize } from '@/utils/responsive';

// Store category images
const storeImages = {
  fastDelivery: require('@/assets/images/stores/fast-delivery.png'),
  budgetFriendly: require('@/assets/images/stores/one-rupee-store.png'),
  ninetyNineStore: require('@/assets/images/stores/cash-store.png'),
  premium: require('@/assets/images/stores/luxury-store.png'),
  alliance: require('@/assets/images/stores/alliance-store.png'),
  organic: require('@/assets/images/stores/organic.png'),
  lowestPrice: require('@/assets/images/stores/lowest-price.png'),
  cashStore: require('@/assets/images/stores/cash-store.png'),
  rezMall: require('@/assets/images/tabs/rez-mall.png'),
};

const { width } = Dimensions.get('window');
const CARD_GAP = isSmallDevice ? 12 : 14;
const H_PADDING = isSmallDevice ? 12 : 18;
const CARD_WIDTH = getResponsiveCardWidth(2, H_PADDING * 2, CARD_GAP);

type Store = {
  id: string;
  title: string;
  accent?: string;
  icon?: string;
  image?; // Store category image
  gradient?: readonly string[];
  badge?: string;
  description?: string;
  count?: number;
};

// Fallback categories in case API fails
const FALLBACK_STORES: Store[] = [
  {
    id: 'fastDelivery',
    title: '30 min delivery',
    accent: colors.lightMustard,
    icon: 'flash',
    image: storeImages.fastDelivery,
    gradient: [colors.lightMustard, colors.brand.goldRich] as const,
    badge: '30 min',
    description: 'Lightning fast delivery',
  },
  {
    id: 'budgetFriendly',
    title: '1 rupees store',
    accent: colors.lightMustard,
    icon: 'cash',
    image: storeImages.budgetFriendly,
    gradient: [colors.lightMustard, colors.lightPeach] as const,
    badge: '1',
    description: 'Everything at 1',
  },
  {
    id: 'ninetyNineStore',
    title: '99 Rupees store',
    accent: colors.nileBlue,
    icon: 'wallet',
    image: storeImages.ninetyNineStore,
    gradient: [colors.nileBlue, '#2A5577'] as const,
    badge: '99',
    description: 'Budget friendly shopping',
  },
  {
    id: 'premium',
    title: 'Luxury store',
    accent: colors.lightMustard,
    icon: 'diamond',
    image: storeImages.premium,
    gradient: [colors.lightMustard, colors.lightPeach] as const,
    badge: 'Premium',
    description: 'Luxury & premium brands',
  },
  {
    id: 'alliance',
    title: 'Alliance Store',
    accent: colors.lightMustard,
    icon: 'people',
    image: storeImages.alliance,
    gradient: [colors.lightMustard, colors.brand.goldRich] as const,
    badge: 'Partner',
    description: 'Partner stores network',
  },
  {
    id: 'organic',
    title: 'Organic Store',
    accent: colors.successScale[400],
    icon: 'leaf',
    image: storeImages.organic,
    gradient: [colors.successScale[400], colors.lightMustard] as const,
    badge: 'Organic',
    description: 'Natural & organic products',
  },
  {
    id: 'lowestPrice',
    title: 'Lowest Price',
    accent: '#22D3EE',
    icon: 'trending-down',
    image: storeImages.lowestPrice,
    gradient: ['#22D3EE', colors.brand.cyan] as const,
    badge: 'Best Price',
    description: 'Guaranteed lowest prices',
  },
  {
    id: 'mall',
    title: `${BRAND.APP_NAME} Mall`,
    accent: colors.nileBlue,
    icon: 'storefront',
    image: storeImages.rezMall,
    gradient: [colors.nileBlue, '#2A5577'] as const,
    badge: 'Mall',
    description: 'Complete shopping experience',
  },
  {
    id: 'cashStore',
    title: 'Cash Store',
    accent: colors.lightMustard,
    icon: 'card',
    image: storeImages.cashStore,
    gradient: [colors.lightMustard, colors.brand.goldRich] as const,
    badge: 'Cash',
    description: 'Cashback & rewards',
  },
];

// Helper function to validate image URLs
const isValidImageUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Helper function to map backend categories to UI properties
const mapCategoryToStore = (category: StoreCategory): Store => {
  // Get the display info from the service
  const displayInfo = storeSearchService.getCategoryDisplayInfo(category.id);

  // Map icon string to Ionicons name
  const iconMap: { [key: string]: string } = {
    '🚀': 'flash',
    '💰': 'cash',
    '💳': 'wallet',
    '👑': 'diamond',
    '🤝': 'people',
    '🌱': 'leaf',
    '💸': 'trending-down',
    '🏬': 'storefront',
    '💵': 'card',
  };

  // Map category ID to image
  const imageMap: { [key: string]: unknown } = {
    fastDelivery: storeImages.fastDelivery,
    budgetFriendly: storeImages.budgetFriendly,
    ninetyNineStore: storeImages.ninetyNineStore,
    premium: storeImages.premium,
    alliance: storeImages.alliance,
    organic: storeImages.organic,
    lowestPrice: storeImages.lowestPrice,
    cashStore: storeImages.cashStore,
    mall: storeImages.rezMall,
  };

  // Get gradient colors based on the category color
  const baseColor = displayInfo.color;
  const gradient: readonly string[] = [baseColor, baseColor] as const;

  // Extract badge from category name
  // Note: Currency-specific badges (1, 99) will be prefixed with currency symbol in the component
  const badgeMap: { [key: string]: string } = {
    fastDelivery: '30 min',
    budgetFriendly: '1',
    ninetyNineStore: '99',
    premium: 'Premium',
    alliance: 'Partner',
    organic: 'Organic',
    lowestPrice: 'Best Price',
    mall: 'Mall',
    cashStore: 'Cash',
  };

  return {
    id: category.id,
    title: displayInfo.name,
    accent: displayInfo.color,
    icon: iconMap[displayInfo.icon] || 'storefront',
    image: isValidImageUrl(category.imageUrl) ? { uri: category.imageUrl } : imageMap[category.id],
    gradient,
    badge: category.badgeText || badgeMap[category.id] || '',
    description: category.description,
    count: category.count,
  };
};

function ModernCardIllustration({
  icon,
  image,
  gradient = [colors.lightMustard, colors.nileBlue] as const,
  badge,
  count,
}: {
  icon?: string;
  image?;
  gradient?: readonly string[];
  badge?: string;
  count?: number;
}) {
  return (
    <View style={styles.illustrationContainer}>
      {/* Gradient Background */}
      <LinearGradient
        colors={[...(gradient as unknown), (gradient as unknown)[1] || (gradient as unknown)[0]] as unknown}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        {/* Decorative Elements */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <View style={styles.decorativeCircle3} />

        {/* Badge */}
        {badge && (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}

        {/* Store count */}
        {count != null && count > 0 && (
          <View style={styles.countContainer}>
            <Text style={styles.countText}>{count} stores</Text>
          </View>
        )}

        {/* Show Image if available, otherwise show Icon */}
        {image ? (
          <CachedImage source={image} style={styles.categoryImage} contentFit="contain" cachePolicy="memory-disk" />
        ) : icon ? (
          <View style={styles.iconContainer}>
            <Ionicons name={icon as unknown} size={32} color="white" />
          </View>
        ) : null}
      </LinearGradient>
    </View>
  );
}

function StoreCard({ item, index }: { item: Store; index: number }) {
  const router = useRouter();
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(20);
  const cardAnimStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  useEffect(() => {
    // CA-DSC-021, CA-DSC-054: Use stable item ID instead of index and properly cleanup animations
    const timer = setTimeout(() => {
      fadeAnim.value = withTiming(1, { duration: 400 });
      slideAnim.value = withTiming(0, { duration: 400 });
    }, index * 80);
    return () => clearTimeout(timer);
  }, [item.id, index, fadeAnim, slideAnim]);

  const handleStorePress = async () => {
    const category = item.id;
    router.push({
      pathname: '/StoreListPage' as unknown,
      params: {
        category,
        title: item.title,
      },
    });
  };

  return (
    <Animated.View style={cardAnimStyle}>
      <Pressable
        style={styles.card}
        onPress={handleStorePress}
        accessibilityLabel={`${item.title} store category`}
        accessibilityRole="button"
        accessibilityHint={`Double tap to browse ${item.title} stores. ${item.description || ''}`}
      >
        <View style={styles.cardIllustration}>
          <ModernCardIllustration
            icon={item.icon}
            image={item.image}
            gradient={item.gradient}
            badge={item.badge}
            count={item.count}
          />
        </View>

        <View style={styles.cardContent}>
          <Text numberOfLines={1} allowFontScaling={false} style={styles.cardTitle}>
            {item.title}
          </Text>
          {item.description && (
            <Text numberOfLines={2} allowFontScaling={false} ellipsizeMode="tail" style={styles.cardDescription}>
              {item.description}
            </Text>
          )}
          {/* Arrow indicator */}
          <View style={styles.cardArrow}>
            <Ionicons name="arrow-forward" size={14} color={colors.neutral[400]} />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function App() {
  const isMounted = useIsMounted();
  const router = useRouter();
  const { user: profileUser, isModalVisible, showModal, hideModal } = useProfile();

  // Screen fade-in animation
  const fadeAnim = useSharedValue(0);
  useEffect(() => {
    fadeAnim.value = withTiming(1, { duration: 250, easing: Easing.ease });
  }, [fadeAnim]);
  const { handleMenuItemPress } = useProfileMenu();
  const userPoints = useRezBalance();
  const isLoadingPoints = useWalletLoading();
  const getCurrencySymbol = useGetCurrencySymbol();
  const currencySymbol = getCurrencySymbol();
  const navTimerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [showLocationDropdown, setShowLocationDropdown] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [categories, setCategories] = useState<Store[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  // Cleanup nav timer on unmount
  useEffect(() => {
    return () => {
      if (navTimerRef.current) {
        clearTimeout(navTimerRef.current);
      }
    };
  }, []);

  // CA-DSC-036 FIX: Memoize formatted badges to prevent unnecessary updates when currency changes
  const formatBadgeWithCurrency = React.useCallback(
    (badge: string | undefined): string => {
      if (!badge) return '';
      // If badge is a pure number, prefix with currency symbol
      if (/^\d+$/.test(badge)) {
        return `${currencySymbol}${badge}`;
      }
      return badge;
    },
    [currencySymbol],
  );

  // Fetch categories from backend
  const fetchCategories = React.useCallback(async () => {
    try {
      setIsLoadingCategories(true);
      setCategoriesError(null);
      const response = await storeSearchService.getStoreCategories();

      if (response.success && response.data?.categories) {
        // Map backend categories to UI store format and add currency to badges
        const mappedCategories = response.data.categories.map(mapCategoryToStore).map((store) => ({
          ...store,
          badge: formatBadgeWithCurrency(store.badge),
          description: store.id === 'budgetFriendly' ? `Everything at ${currencySymbol}1` : store.description,
        }));
        if (!isMounted()) return;
        setCategories(mappedCategories);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      if (!isMounted()) return;
      setCategoriesError('Failed to load categories');
      // Use fallback categories if API fails - add currency to badges
      const fallbackWithCurrency = FALLBACK_STORES.map((store) => ({
        ...store,
        badge: formatBadgeWithCurrency(store.badge),
        description: store.id === 'budgetFriendly' ? `Everything at ${currencySymbol}1` : store.description,
      }));
      if (!isMounted()) return;
      setCategories(fallbackWithCurrency);
    } finally {
      if (!isMounted()) return;
      setIsLoadingCategories(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currencySymbol]);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Cleanup nav timer on unmount
  useEffect(() => {
    return () => clearTimeout(navTimerRef.current);
  }, []);

  const handleLocationDropdownToggle = () => {
    setShowLocationDropdown(!showLocationDropdown);
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      router.push({
        pathname: '/StoreListPage' as unknown,
        params: {
          search: searchQuery.trim(),
        },
      });
    }
  };

  const renderStoreCategoryItem = useCallback(
    ({ item, index }: { item: Store; index: number }) => <StoreCard item={item} index={index} />,
    [],
  );

  const fadeAnimStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <Animated.View style={fadeAnimStyle}>
        {/* Header with gradient - Fixed at top */}
        <LinearGradient
          colors={[colors.lightMustard, '#E6A817', colors.nileBlue] as const}
          locations={[0, 0.5, 1]}
          style={styles.header}
        >
          {/* Top section */}
          <View style={styles.headerTop}>
            <Pressable
              style={styles.locationContainer}
              onPress={handleLocationDropdownToggle}
              accessibilityLabel="Current location"
              accessibilityRole="button"
              accessibilityHint={
                showLocationDropdown
                  ? 'Double tap to collapse location details'
                  : 'Double tap to expand location details'
              }
              accessibilityState={{ expanded: showLocationDropdown }}
            >
              <LocationDisplay
                compact={!showLocationDropdown}
                showCoordinates={false}
                showLastUpdated={false}
                showRefreshButton={false}
                style={styles.locationDisplay}
                textStyle={styles.locationText}
              />
              <Ionicons name={showLocationDropdown ? 'chevron-up' : 'chevron-down'} size={16} color="white" />
            </Pressable>

            <View style={styles.headerRight}>
              <Pressable
                style={styles.coinsContainer}
                onPress={() => {
                  if (Platform.OS === 'ios') {
                    clearTimeout(navTimerRef.current);
                    navTimerRef.current = setTimeout(() => router.push('/coins'), 50);
                  } else {
                    router.push('/coins');
                  }
                }}
                accessibilityLabel={`Loyalty points: ${isLoadingPoints ? 'Loading' : typeof userPoints === 'number' ? userPoints.toLocaleString() : '0'}`}
                accessibilityRole="button"
                accessibilityHint="Double tap to view your loyalty points and rewards"
              >
                <Ionicons name="star" size={16} color={colors.brand.goldBright} />
                <ThemedText allowFontScaling={false} style={styles.coinsText}>
                  {/* ✅ FIX: Add type check for userPoints before formatting */}
                  {isLoadingPoints ? '...' : typeof userPoints === 'number' ? userPoints.toLocaleString() : '0'}
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={() => {
                  if (Platform.OS === 'ios') {
                    clearTimeout(navTimerRef.current);
                    navTimerRef.current = setTimeout(() => router.push('/cart'), 50);
                  } else {
                    router.push('/cart');
                  }
                }}
                accessibilityLabel="Shopping cart"
                accessibilityRole="button"
                accessibilityHint="Double tap to view your shopping cart"
              >
                <Ionicons name="cart-outline" size={24} color="white" />
              </Pressable>

              <Pressable
                style={styles.profileAvatar}
                onPress={() => {
                  if (Platform.OS === 'ios') {
                    clearTimeout(navTimerRef.current);
                    navTimerRef.current = setTimeout(() => showModal(), 50);
                  } else {
                    showModal();
                  }
                }}
                accessibilityLabel="User profile menu"
                accessibilityRole="button"
                accessibilityHint="Double tap to open profile menu and account settings"
              >
                <ThemedText style={styles.profileText}>{profileUser?.initials || 'R'}</ThemedText>
              </Pressable>
            </View>
          </View>

          {/* Search Row */}
          <View style={styles.searchRow}>
            <Pressable
              style={styles.backBtn}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
              accessibilityLabel="Go back"
              accessibilityRole="button"
              accessibilityHint="Double tap to go back to the previous screen"
            >
              <Ionicons name="chevron-back" size={18} color={colors.lightMustard} />
            </Pressable>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={18} color="#8B8B97" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for the service"
                placeholderTextColor={colors.neutral[400]}
                returnKeyType="search"
                allowFontScaling={false}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearchSubmit}
              />
              <Ionicons name="mic-outline" size={18} color="#8B8B97" />
            </View>
          </View>
        </LinearGradient>

        {/* Scrollable Grid */}
        <FlashList
          data={categories.filter((c) => c.id)}
          keyExtractor={(it, idx) => it.id || `fallback-${idx}`}
          numColumns={2}
          renderItem={renderStoreCategoryItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.flatListContent}
          estimatedItemSize={220}
          ListHeaderComponent={
            <>
              {isLoadingCategories ? (
                <CategoryGridSkeleton itemCount={6} />
              ) : categoriesError ? (
                <View style={styles.errorContainer}>
                  <Ionicons
                    name="warning-outline"
                    size={20}
                    color={colors.brand.amberDark}
                    style={{ marginBottom: 4 }}
                  />
                  <Text style={styles.errorText}>{categoriesError}</Text>
                  <Pressable style={styles.retryButton} onPress={fetchCategories}>
                    <Ionicons name="refresh" size={16} color={colors.background.primary} />
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </Pressable>
                  <Text style={styles.errorSubtext}>Showing default categories</Text>
                </View>
              ) : (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Browse Categories</Text>
                  <Text style={styles.sectionSubtitle}>{categories.length} categories available</Text>
                </View>
              )}
            </>
          }
        />

        {/* Profile Menu Modal */}
        {profileUser && (
          <ProfileMenuModal
            visible={isModalVisible}
            onClose={hideModal}
            user={profileUser}
            menuSections={profileMenuSections}
            onMenuItemPress={handleMenuItemPress}
          />
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F3EE' },

  header: {
    paddingTop: 50,
    paddingHorizontal: 18,
    paddingBottom: Spacing.xl,
  },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },

  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: Spacing.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },

  locationDisplay: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
    padding: 0,
    margin: 0,
    flex: 1,
  },

  locationText: {
    color: colors.text.inverse,
    fontWeight: '600',
    fontSize: 12.5,
    lineHeight: 16,
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },

  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },

  coinsText: {
    color: colors.text.inverse,
    ...Typography.body,
    fontWeight: '700',
  },

  profileAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.brand.goldBright,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },

  profileText: {
    color: colors.nileBlue,
    ...Typography.body,
    fontWeight: '700',
    fontSize: 15,
  },

  // Search row
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },

  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },

  searchContainer: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 26,
    paddingHorizontal: Spacing.sm,
    height: 40,
    ...Shadows.subtle,
  },

  searchIcon: { marginRight: Spacing.sm },

  searchInput: {
    flex: 1,
    minWidth: 0,
    color: colors.text.primary,
    ...Typography.body,
    paddingVertical: 0,
  },

  // Section header
  sectionHeader: {
    marginBottom: Spacing.xs,
  },

  sectionTitle: {
    ...Typography.h3,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -0.5,
  },

  sectionSubtitle: {
    ...Typography.bodySmall,
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.tertiary,
    marginTop: 2,
  },

  // Grid & cards
  flatListContent: {
    paddingHorizontal: H_PADDING,
    paddingTop: Spacing.base,
    paddingBottom: 100,
    gap: CARD_GAP,
  },

  gridWrap: {
    paddingHorizontal: H_PADDING,
    paddingTop: Spacing.base,
  },

  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.background.primary,
    borderRadius: 22,
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    shadowColor: colors.nileBlue,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },

  cardIllustration: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },

  cardContent: {
    alignItems: 'flex-start',
    paddingHorizontal: 2,
  },

  cardTitle: {
    color: colors.text.primary,
    ...Typography.body,
    fontWeight: '700',
    fontSize: isSmallDevice ? 13 : 14,
    letterSpacing: -0.2,
    marginBottom: Spacing.xs,
  },

  cardDescription: {
    color: colors.text.tertiary,
    ...Typography.caption,
    fontWeight: '500',
    fontSize: isSmallDevice ? 11 : 12,
    lineHeight: 15,
  },

  cardArrow: {
    position: 'absolute',
    right: 0,
    top: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modern Illustration Styles
  illustrationContainer: {
    width: CARD_WIDTH - 28,
    height: 100,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },

  gradientBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },

  badgeContainer: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 10,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  badgeText: {
    color: colors.text.inverse,
    ...Typography.overline,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  countContainer: {
    position: 'absolute',
    bottom: Spacing.xs,
    left: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 10,
  },

  countText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 9,
    fontWeight: '600',
  },

  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },

  categoryImage: {
    width: 72,
    height: 72,
  },

  decorativeCircle1: {
    position: 'absolute',
    top: -12,
    right: -12,
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xl,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },

  decorativeCircle2: {
    position: 'absolute',
    bottom: -8,
    left: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  decorativeCircle3: {
    position: 'absolute',
    top: '40%',
    left: -6,
    width: 16,
    height: 16,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  // Loading and error states
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    ...Typography.body,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
  errorContainer: {
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.base,
    backgroundColor: Colors.warningScale[50],
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.base,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.warningScale[200],
  },
  errorText: {
    ...Typography.body,
    color: colors.brand.amberDark,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xl,
    gap: Spacing.xs,
    marginVertical: Spacing.sm,
  },
  retryButtonText: {
    ...Typography.bodySmall,
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  errorSubtext: {
    ...Typography.bodySmall,
    color: '#78350F',
    fontWeight: '400',
  },
});

export default withErrorBoundary(App, 'Store');
