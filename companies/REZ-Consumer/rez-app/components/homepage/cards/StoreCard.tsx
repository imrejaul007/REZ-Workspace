// @ts-nocheck
import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
} from 'react-native';
import TypedFlashList from '@/components/ui/TypedFlashList';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { StoreCardProps } from '@/types/homepage.types';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTheme } from '@/contexts/ThemeContext';
import { colors as themeColors } from '@/constants/theme';
import QuickActions from '@/components/store/QuickActions';
import FastImage from '@/components/common/FastImage';
import { useGetCurrencySymbol } from '@/stores/selectors';

// Custom comparison function for React.memo
const arePropsEqual = (prevProps, nextProps) => {
  return (
    prevProps.store.id === nextProps.store.id &&
    prevProps.width === nextProps.width &&
    prevProps.variant === nextProps.variant &&
    prevProps.showQuickActions === nextProps.showQuickActions &&
    prevProps.store.rating?.value === nextProps.store.rating?.value &&
    prevProps.store.rating?.count === nextProps.store.rating?.count &&
    prevProps.store.isNew === nextProps.store.isNew &&
    prevProps.store.isTrending === nextProps.store.isTrending
  );
};

function StoreCard({
  store,
  onPress,
  width = 280,
  variant = 'default',
  showQuickActions = false, // New prop to enable Quick Actions
  storeType, // Optional store type for Quick Actions
  contact, // Optional contact info for Quick Actions
}: StoreCardProps & {
  showQuickActions?: boolean;
  storeType?: 'PRODUCT' | 'SERVICE' | 'HYBRID' | 'RESTAURANT';
  contact?: {
    phone?: string;
    email?: string;
  };
}) {
  const { colors: themeColors, isDark } = useTheme();
  const getCurrencySymbol = useGetCurrencySymbol();
  const currencySymbol = getCurrencySymbol();
  const cardBackground = useThemeColor({ light: themeColors.background.primary, dark: themeColors.neutral[800] }, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({ light: themeColors.neutral[500], dark: themeColors.neutral[400] }, 'text');
  const borderColor = useThemeColor({ light: themeColors.neutral[200], dark: themeColors.neutral[700] }, 'border');
  const primaryColor = useThemeColor({}, 'tint');
  
  // State for banner slider
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const autoScrollPausedRef = useRef(false);
  
  // Helper function to get banners (array or single)
  // Check both image and banner fields, prioritize banner if available
  const getBanners = useCallback((): string[] => {
    const storeAny = store as unknown;
    
    // Check banner first (most common field name for multiple images)
    let bannerData = storeAny.banner;
    
    // If banner is not available or is empty, check image
    if (!bannerData || (Array.isArray(bannerData) && bannerData.length === 0)) {
      bannerData = storeAny.image || store.image;
    }
    
    if (!bannerData) {
      return [];
    }
    
    // Handle array case
    if (Array.isArray(bannerData)) {
      const validUrls = bannerData.filter((url) => {
        if (typeof url === 'string' && url.trim().length > 0) {
          return true;
        }
        // Handle object with url property
        if (url && typeof url === 'object' && url.url) {
          return true;
        }
        return false;
      }).map((url) => {
        // Extract URL from object if needed
        if (url && typeof url === 'object' && url.url) {
          return url.url;
        }
        return url;
      });
      
      return validUrls;
    }
    
    // Handle string case
    if (typeof bannerData === 'string' && bannerData.trim().length > 0) {
      return [bannerData];
    }
    
    return [];
  }, [store]);
  
  const banners = getBanners();
  const flatListRef = useRef<FlashList<string> | null>(null);
  
  // Reset banner index when store changes
  useEffect(() => {
    setCurrentBannerIndex(0);
    if (flatListRef.current && banners.length > 1) {
      // Use scrollToOffset for more reliable scrolling
      flatListRef.current.scrollToOffset({ offset: 0, animated: false });
    }
  }, [store.id, banners]);
  
  // Auto-scroll banner slider every 5 seconds
  useEffect(() => {
    if (banners.length <= 1) return;
    if (!width || width <= 0) return; // Ensure width is valid
    
    let intervalId: ReturnType<typeof setTimeout> | null = null;
    
    // Small delay to ensure FlatList is mounted and rendered
    const startTimeout = setTimeout(() => {
      // Verify FlatList is ready
      if (!flatListRef.current) {
        return; // FlatList not ready, skip setting up interval
      }
      
      intervalId = setInterval(() => {
        // Skip auto-scroll if paused (user is interacting)
        if (autoScrollPausedRef.current) {
          return;
        }
        
        // Ensure ref is still available
        if (!flatListRef.current) {
          return;
        }
        
        setCurrentBannerIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % banners.length;
          if (flatListRef.current) {
            // Mark as auto-scrolling to prevent pause
            isAutoScrollingRef.current = true;
            
            // Try scrollToIndex first (works better with pagingEnabled)
            try {
              flatListRef.current.scrollToIndex({ 
                index: nextIndex, 
                animated: true 
              });
            } catch (error) {
              // Fallback: use scrollToOffset if scrollToIndex fails
              try {
                const offset = nextIndex * width;
                flatListRef.current.scrollToOffset({ 
                  offset, 
                  animated: true 
                });
              } catch (offsetError) {
                // If both fail, reset flag
                isAutoScrollingRef.current = false;
              }
            }
          }
          return nextIndex;
        });
      }, 5000); // 5 seconds
    }, 1000); // Wait 1 second for FlatList to be fully ready
    
    return () => {
      clearTimeout(startTimeout);
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [banners.length, width]);
  
  // Track if scroll is from user interaction
  const isUserScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAutoScrollingRef = useRef(false);
  
  // Handle banner scroll
  const handleBannerScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setCurrentBannerIndex(index);
    
    // Only pause if this is user-initiated scroll (not programmatic auto-scroll)
    if (isUserScrollingRef.current && !isAutoScrollingRef.current) {
      // Pause auto-scroll when user manually scrolls
      autoScrollPausedRef.current = true;
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Resume after 10 seconds of no interaction
      scrollTimeoutRef.current = setTimeout(() => {
        autoScrollPausedRef.current = false;
        isUserScrollingRef.current = false;
      }, 10000);
    }
    
    // Reset auto-scroll flag after a short delay
    if (isAutoScrollingRef.current) {
      setTimeout(() => {
        isAutoScrollingRef.current = false;
      }, 1000);
    }
  }, [width]);
  
  // Handle scroll begin (user starts scrolling)
  const handleScrollBeginDrag = useCallback(() => {
    isUserScrollingRef.current = true;
    autoScrollPausedRef.current = true;
  }, []);
  
  // Handle scroll end (user stops scrolling)
  const handleScrollEndDrag = useCallback(() => {
    // Keep paused for a bit, then resume
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      autoScrollPausedRef.current = false;
      isUserScrollingRef.current = false;
    }, 10000);
  }, []);
  
  // Render banner item
  const renderBannerItem = useCallback(({ item: bannerUrl }: { item: string }) => {
    return (
      <View style={{ width, height: 140 }}>
        <FastImage
          source={{ uri: bannerUrl }}
          style={[styles.image, { width, height: 140 }]}
          resizeMode="cover"
          showLoader={true}
        />
      </View>
    );
  }, [width]);

  // Memoize the formatted rating value
  const formattedRating = useMemo(() => {
    return typeof store.rating.value === 'number'
      ? store.rating.value.toFixed(1)
      : store.rating.value;
  }, [store.rating.value]);

  // Memoize the derived store type
  const derivedStoreType = useMemo(() => {
    return storeType || (store.category === 'Restaurant' ? 'RESTAURANT' : 'PRODUCT');
  }, [storeType, store.category]);

  const renderRating = useMemo(() => {
    return (
      <View style={styles.ratingContainer}>
        <Ionicons name="star" size={16} color={themeColors.lightMustard} />
        <ThemedText style={[styles.ratingText, { color: themeColors.nileBlue }]}>
          {formattedRating}
        </ThemedText>
        <ThemedText style={[styles.ratingCount, { color: themeColors.midGray }]}>
          ({store.rating.count})
        </ThemedText>
      </View>
    );
  }, [formattedRating, store.rating.count]);

  const renderBadges = useMemo(() => {
    const badges = [];

    if (store.isNew) {
      badges.push(
        <View key="new" style={[styles.badge, styles.newBadge]}>
          <ThemedText style={styles.newBadgeText}>New</ThemedText>
        </View>
      );
    }

    if (store.isTrending) {
      badges.push(
        <LinearGradient
          key="trending"
          colors={[themeColors.lightMustard, themeColors.nileBlue]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.badge, styles.trendingBadge]}
        >
          <ThemedText style={styles.trendingBadgeText}>🔥 Trending</ThemedText>
        </LinearGradient>
      );
    }

    return badges.length > 0 ? (
      <View style={styles.badgesContainer}>
        {badges}
      </View>
    ) : null;
  }, [store.isNew, store.isTrending]);

  // Memoize the onPress callback
  const handlePress = useCallback(() => {
    try {
      onPress(store);
    } catch (error) {
      // silently handle
    }
  }, [onPress, store]);

  // Memoize location data
  const locationProps = useMemo(() => {
    return store.location ? {
      address: store.location.address,
      city: store.location.city,
    } : undefined;
  }, [store.location]);

  // Build a rich accessibility label for screen readers
  const storeA11yLabel = useMemo(() => {
    const parts = [store.name];
    if (typeof store.rating?.value === 'number') {
      parts.push(`Rated ${store.rating.value.toFixed(1)} out of 5`);
      if (store.rating.count) parts.push(`${store.rating.count} reviews`);
    }
    if (store.location?.city) parts.push(store.location.city);
    if (store.deliveryTime) parts.push(store.deliveryTime);
    if (store.isNew) parts.push('New');
    if (store.isTrending) parts.push('Trending');
    return parts.join(', ');
  }, [store.name, store.rating, store.location, store.deliveryTime, store.isNew, store.isTrending]);

  return (
    <Pressable
      style={[styles.container, { width }]}
      onPress={handlePress}
      accessibilityLabel={storeA11yLabel}
      accessibilityRole="button"
      accessibilityHint="Double tap to view store details and products"
      
      
    >
      <ThemedView style={styles.card}>
        {/* Store Image/Banner Slider */}
        <View style={styles.imageContainer}>
          {banners.length > 0 ? (
            <>
              {banners.length > 1 ? (
                <>
                  <TypedFlashList
                    ref={flatListRef as unknown}
                    data={banners}
                    renderItem={renderBannerItem}
                    keyExtractor={(item: string, index: number) => `banner-${store.id || store.name}-${index}`}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleBannerScroll}
                    onScrollBeginDrag={handleScrollBeginDrag}
                    onScrollEndDrag={handleScrollEndDrag}
                    onMomentumScrollEnd={(event) => {
                      // Update index when scroll ends
                      const scrollPosition = event.nativeEvent.contentOffset.x;
                      const index = Math.round(scrollPosition / width);
                      setCurrentBannerIndex(index);
                    }}
                    scrollEventThrottle={16}
                    snapToInterval={width}
                    decelerationRate="fast"
                    estimatedItemSize={200}
                    onScrollToIndexFailed={(info) => {
                      // Handle scroll to index failure - scroll to offset instead
                      const wait = new Promise(resolve => setTimeout(resolve, 500));
                      wait.then(() => {
                        if (flatListRef.current) {
                          const offset = info.index * width;
                          flatListRef.current.scrollToOffset({
                            offset,
                            animated: true
                          });
                        }
                      });
                    }}
                    style={{ width: '100%', height: 140 }}
                    contentContainerStyle={{ height: 140 } as unknown}
                  />
                  {/* Pagination Dots */}
                  <View style={styles.paginationContainer}>
                    {banners.map((_, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.paginationDot,
                          idx === currentBannerIndex && styles.paginationDotActive,
                        ]}
                      />
                    ))}
                  </View>
                </>
              ) : (
                <FastImage
                  source={{ uri: banners[0] }}
                  style={styles.image}
                  resizeMode="cover"
                  showLoader={true}
                />
              )}
            </>
          ) : (
            <View style={[styles.image, styles.placeholderImage]}>
              <Ionicons name="storefront-outline" size={48} color={themeColors.neutral[400]} />
            </View>
          )}
          {renderBadges}
        </View>

        {/* Store Details */}
        <View style={styles.content}>
          <View style={styles.header}>
            <ThemedText style={styles.name} numberOfLines={1}>
              {store.name}
            </ThemedText>
            {renderRating}
          </View>

          <ThemedText style={styles.description} numberOfLines={2}>
            {store.description}
          </ThemedText>

          {/* Location and Delivery Info */}
          <View style={styles.locationInfo}>
            {store.location && (
              <View style={styles.locationContainer}>
                <Ionicons name="location-outline" size={14} color={themeColors.midGray} />
                <ThemedText style={styles.locationText}>
                  {store.location.distance || store.location.city}
                </ThemedText>
              </View>
            )}

            {store.deliveryTime && (
              <View style={styles.deliveryContainer}>
                <Ionicons name="time-outline" size={14} color={themeColors.midGray} />
                <ThemedText style={styles.deliveryText}>
                  {store.deliveryTime}
                </ThemedText>
              </View>
            )}
          </View>

          {/* Cashback Information */}
          <View style={styles.footer}>
            <View style={styles.cashbackContainer}>
              <ThemedText style={styles.cashbackText}>
                {(() => {
                  const pct = store.cashback?.percentage || 10;
                  const est = Math.round((pct / 100) * 1000);
                  return `Save ~${currencySymbol}${est.toLocaleString()} on ${currencySymbol}1,000`;
                })()}
              </ThemedText>
            </View>

            {store.minimumOrder && (
              <ThemedText style={styles.minOrderText}>
                Min {currencySymbol}{store.minimumOrder}
              </ThemedText>
            )}
          </View>

          {/* Quick Actions (optional, compact variant) */}
          {showQuickActions && (
            <View style={styles.quickActionsContainer}>
              {React.createElement(QuickActions as unknown, {
                storeId: store.id,
                storeName: store.name,
                storeType: derivedStoreType,
                contact,
                location: locationProps,
                hasMenu: storeType === 'RESTAURANT' || store.category === 'Restaurant',
                allowBooking: storeType === 'SERVICE' || storeType === 'HYBRID',
                variant: 'compact',
                maxActions: 4,
                hideTitle: false,
              })}
            </View>
          )}
        </View>
      </ThemedView>
    </Pressable>
  );
}

export default React.memo(StoreCard, arePropsEqual);

const styles = StyleSheet.create({
  container: {
    // Container styles handled by parent
    flex: 0,
    flexShrink: 0,
  },
  card: {
    backgroundColor: themeColors.background.primary,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 205, 87, 0.08)',
    minHeight: 320, // Fixed minimum height to ensure consistency
    ...Platform.select({
      ios: {
        shadowColor: themeColors.nileBlue,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0px 8px 24px rgba(11, 34, 64, 0.08)',
      },
    }),
  },
  imageContainer: {
    position: 'relative',
    height: 140,
    width: '100%',
    backgroundColor: themeColors.neutral[100],
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: themeColors.neutral[100],
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  paginationDotActive: {
    width: 16,
    backgroundColor: themeColors.background.primary,
  },
  badgesContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  newBadge: {
    backgroundColor: themeColors.lightMustard,
  },
  newBadgeText: {
    color: themeColors.background.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  trendingBadge: {
    // Gradient background applied via LinearGradient
  },
  trendingBadgeText: {
    color: themeColors.background.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: themeColors.nileBlue,
    flex: 1,
    marginRight: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: themeColors.nileBlue,
  },
  ratingCount: {
    fontSize: 12,
    color: themeColors.midGray,
  },
  description: {
    fontSize: 14,
    color: themeColors.neutral[500],
    marginBottom: 12,
    lineHeight: 18,
    minHeight: 36, // Fixed height for 2 lines (18 * 2)
    maxHeight: 36,
  },
  locationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  locationText: {
    fontSize: 13,
    color: themeColors.midGray,
  },
  deliveryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deliveryText: {
    fontSize: 13,
    color: themeColors.midGray,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cashbackContainer: {
    backgroundColor: themeColors.lightMustard,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cashbackText: {
    fontSize: 12,
    color: themeColors.nileBlue,
    fontWeight: '600',
  },
  minOrderText: {
    fontSize: 12,
    color: themeColors.neutral[400],
  },
  quickActionsContainer: {
    marginTop: 16,
    marginHorizontal: -16, // Compensate for card padding
    borderTopWidth: 1,
    borderTopColor: themeColors.neutral[200],
    paddingTop: 12,
  },
});