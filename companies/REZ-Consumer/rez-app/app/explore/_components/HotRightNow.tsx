import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, ActivityIndicator } from 'react-native';
import { CardGridSkeleton } from '@/components/skeletons';
import CachedImage from '@/components/ui/CachedImage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import exploreApi, { HotProduct } from '../../../services/exploreApi';

import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import { useIsMounted } from '@/hooks/useIsMounted';
import FeatureErrorBoundary from '@/components/common/FeatureErrorBoundary';
const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const HotRightNow = () => {
  const isMounted = useIsMounted();
  const router = useRouter();
  const [hotDeals, setHotDeals] = useState<HotProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHotDeals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchHotDeals = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await exploreApi.getHotDeals({ limit: 6 });

      const products = response.data?.products || response.data || [];

      if (response.success && Array.isArray(products) && products.length > 0) {
        if (!isMounted()) return;
        setHotDeals(products);
      }
    } catch (err) {
      if (!isMounted()) return;
      setError('Failed to load hot deals');
    } finally {
      if (!isMounted()) return;
      setIsLoading(false);
    }
  };

  const navigateTo = (path: string) => {
    router.push(path as unknown as string);
  };

  const getOfferBadgeColor = (offer: string) => {
    if (offer?.toLowerCase().includes('cashback')) return Colors.gold;
    if (offer?.toLowerCase().includes('off')) return colors.nileBlue;
    if (offer?.toLowerCase().includes('buy')) return colors.nileBlue;
    return Colors.gold;
  };

  // Don't render if no data
  if (isLoading) {
    return <CardGridSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>What's Hot Near You</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={32} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={fetchHotDeals}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Don't render section if no products
  if (hotDeals.length === 0) {
    return null;
  }

  return (
    <FeatureErrorBoundary featureName="Hot Right Now" compact={true}>
      <View style={styles.container}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>What's Hot Near You</Text>
          <Pressable onPress={() => navigateTo('/explore/hot')}>
            <Text style={styles.viewAllText}>View all →</Text>
          </Pressable>
        </View>

        <View style={styles.gridContainer}>
          {hotDeals.slice(0, 4).map((product, index) => (
            <Pressable
              key={product.id || index}
              style={styles.productCard}
              onPress={() => navigateTo(`/product-page?cardId=${product.id}&cardType=product`)}
            >
              <View style={styles.imageContainer}>
                {product.image && <CachedImage source={product.image} style={styles.productImage} />}
                {product.offer && (
                  <View style={[styles.offerBadge, { backgroundColor: getOfferBadgeColor(product.offer) }]}>
                    <Text style={styles.offerBadgeText}>{product.offer}</Text>
                  </View>
                )}
              </View>

              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>
                  {product.name}
                </Text>
                {product.store && (
                  <Text style={styles.storeName} numberOfLines={1}>
                    {product.store}
                  </Text>
                )}
                <View style={styles.priceRow}>
                  {product.price > 0 && (
                    <Text style={styles.price}>
                      {'\u20B9'}
                      {product.price.toLocaleString('en-IN')}
                    </Text>
                  )}
                  {product.distance && (
                    <View style={styles.distanceContainer}>
                      <Ionicons name="location" size={12} color={colors.text.tertiary} />
                      <Text style={styles.distanceText}>{product.distance}</Text>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </FeatureErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.base,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  errorContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  errorText: {
    fontSize: Typography.body.fontSize,
    color: colors.text.tertiary,
  },
  retryButton: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.successScale[50],
    borderRadius: BorderRadius.lg,
  },
  retryText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: Colors.gold,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  sectionTitle: {
    fontSize: Typography.h4.fontSize,
    fontWeight: '700',
    color: colors.nileBlue,
  },
  viewAllText: {
    fontSize: Typography.body.fontSize,
    color: Colors.gold,
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: CARD_WIDTH,
    marginBottom: Spacing.base,
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    width: '100%',
    height: CARD_WIDTH * 0.8,
    position: 'relative',
    backgroundColor: colors.background.secondary,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  offerBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  offerBadgeText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  productInfo: {
    padding: Spacing.md,
  },
  productName: {
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    color: colors.nileBlue,
    marginBottom: 2,
  },
  storeName: {
    fontSize: Typography.bodySmall.fontSize,
    color: colors.text.tertiary,
    marginBottom: Spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.nileBlue,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  distanceText: {
    fontSize: Typography.bodySmall.fontSize,
    color: colors.text.tertiary,
  },
});

export default React.memo(HotRightNow);
