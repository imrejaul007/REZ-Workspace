// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows, typography } from '@/constants/theme';
import storesApi, { Store } from '@/services/storesApi';
import { useIsMounted } from '@/hooks/useIsMounted';

interface RecommendedStore extends Store {
  distance?: number;
}

export const RecommendedStoresSection: React.FC = () => {
  const isMounted = useIsMounted();
  const router = useRouter();
  const [stores, setStores] = useState<RecommendedStore[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRecommendedStores = async () => {
      setLoading(true);
      try {
        // Fetch recommended stores from API
        // First try to fetch with location, fallback if not available
        const response = await storesApi.getNearbyStores(0, 0, 10, 10).catch(() => {
          // Fallback: try fetching featured stores without location
          return storesApi.getFeaturedStores?.(10).catch(() => ({
            success: false,
            data: [],
          }));
        });

        if (isMounted()) {
          if (response.success && response.data && Array.isArray(response.data)) {
            setStores(response.data.slice(0, 10));
          }
          setLoading(false);
        }
      } catch (error) {
        if (isMounted()) {
          setLoading(false);
        }
      }
    };

    fetchRecommendedStores();
  }, [isMounted]);

  const handleStorePress = useCallback((storeId: string) => {
    router.push({
      pathname: '/store/[id]',
      params: { id: storeId },
    });
  }, [router]);

  // Fixed card height enables getItemLayout — eliminates async layout measurement
  const CARD_WIDTH = 120;
  const CARD_GAP = 12; // matches styles.listContent gap

  const getItemLayout = useCallback(
    (_, index: number) => ({
      length: CARD_WIDTH + CARD_GAP,
      offset: (CARD_WIDTH + CARD_GAP) * index,
      index,
    }),
    []
  );

  const keyExtractor = useCallback((store: RecommendedStore) => store.id, []);

  const renderStoreItem = useCallback(
    ({ item }: { item: RecommendedStore }) => (
      <Pressable
        style={styles.storeCard}
        onPress={() => handleStorePress(item.id)}
      >
        {/* Store Image/Avatar */}
        {item.logo || item.banner ? (
          <Image
            source={{ uri: (item.logo || item.banner || '') as string }}
            style={styles.storeImage}
          />
        ) : (
          <View style={[styles.storeImage, styles.storeImagePlaceholder]}>
            <Ionicons name="storefront" size={32} color={colors.primary[600]} />
          </View>
        )}

        {/* Store Info */}
        <View style={styles.storeInfo}>
          <Text style={styles.storeName} numberOfLines={2}>
            {item.name}
          </Text>

          {(() => {
            const catName = typeof item.category === 'string' ? item.category : item.category?.name;
            return catName ? (
              <Text style={styles.category} numberOfLines={1}>
                {catName}
              </Text>
            ) : null;
          })()}

          {item.distance && (
            <View style={styles.distanceContainer}>
              <Ionicons name="location" size={12} color={colors.gray[500]} />
              <Text style={styles.distance}>
                {typeof item.distance === 'number'
                  ? `${item.distance.toFixed(1)} km`
                  : item.distance}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    ),
    [handleStorePress, styles] // Include styles to avoid recreation
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Recommended for you 🎯</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary[600]} />
        </View>
      </View>
    );
  }

  // Hide section if no stores available
  if (!stores || stores.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recommended for you 🎯</Text>
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={stores}
        keyExtractor={keyExtractor}
        scrollEventThrottle={16}
        contentContainerStyle={styles.listContent}
        renderItem={renderStoreItem}
        getItemLayout={getItemLayout}
        removeClippedSubviews
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingVertical: spacing.md,
    marginVertical: spacing.sm,
  },
  header: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.secondary[600],
  },
  loadingContainer: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  storeCard: {
    width: 120,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[50],
    overflow: 'hidden',
    ...shadows.sm,
  },
  storeImage: {
    width: '100%',
    height: 80,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeImagePlaceholder: {
    backgroundColor: colors.gray[100],
  },
  storeInfo: {
    padding: spacing.sm,
    flex: 1,
  },
  storeName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondary[600],
    marginBottom: spacing.xs,
  },
  category: {
    fontSize: 10,
    color: colors.primary[600],
    marginBottom: spacing.xs,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  distance: {
    fontSize: 10,
    color: colors.gray[500],
    marginLeft: spacing.xs,
  },
});

export default RecommendedStoresSection;
