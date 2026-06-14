import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Image,
  Pressable,
  Platform,
  ToastAndroid,
} from 'react-native';
import { platformAlertConfirm } from '@/utils/platformAlert';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/DesignTokens';
import {
  Card,
  Heading2,
  Heading3,
  BodyText,
  Caption,
  Badge,
  Button,
} from '@/components/ui/DesignSystemComponents';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import { apiClient } from '@/services/api/client';
import { showAlert } from '@/utils/alert';
import { formatRelativeTime } from '@/utils/dateUtils';
import { logger } from '@/utils/logger';

interface DeletedProduct {
  _id: string;
  name: string;
  price: number;
  category?: string;
  image?: string;
  images?: unknown[];
  deletedAt: string;
  sku?: string;
  canRestore: boolean;
  daysUntilPermanent: number;
}

interface PaginationInfo {
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export default function ProductRestoreScreen() {
  const { token } = useAuth();
  const { activeStore } = useStore();
  const [deletedProducts, setDeletedProducts] = useState<DeletedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);

  const fetchDeletedProducts = useCallback(
    async (isRefresh = false) => {
      if (!token || !activeStore?._id) return;

      try {
        if (isRefresh) {
          setRefreshing(true);
          setPage(1);
        } else {
          setLoading(true);
        }

        const pageToFetch = isRefresh ? 1 : page;
        const response = await apiClient.get('/merchant/products/deleted', {
          params: {
            page: pageToFetch,
            limit: 20,
          },
        });

        if (response.data?.success && response.data?.data) {
          const { products, pagination: paginationData } = response.data.data;
          setPagination(paginationData);

          if (isRefresh || pageToFetch === 1) {
            setDeletedProducts(products);
          } else {
            setDeletedProducts((prev) => [...prev, ...products]);
          }

          if (!isRefresh && products.length > 0) {
            setPage((prev) => prev + 1);
          }
        }
      } catch (error) {
        if (__DEV__) console.error('Error fetching deleted products:', error);
        showAlert('Error', 'Failed to load deleted products. Please try again.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, activeStore?._id, page]
  );

  useEffect(() => {
    fetchDeletedProducts(true);
  }, [token, activeStore?._id]);

  const handleRefresh = () => {
    setSelectedIds(new Set());
    setIsSelectMode(false);
    fetchDeletedProducts(true);
  };

  const handleLoadMore = () => {
    if (!loading && pagination?.hasNext) {
      fetchDeletedProducts();
    }
  };

  const handleRestoreSingle = async (product: DeletedProduct) => {
    platformAlertConfirm(
      'Restore Product',
      `Restore "${product.name}"? It will be visible to customers again.`,
      () => performRestore([product._id]),
      'Restore'
    );
  };

  const performRestore = async (productIds: string[]) => {
    if (restoring) return;

    setRestoring(true);
    try {
      // Use bulk restore endpoint if multiple products, individual endpoint otherwise
      if (productIds.length === 1) {
        const response = await apiClient.post(`/merchant/products/${productIds[0]}/restore`);
        if (response.data?.success) {
          setDeletedProducts((prev) => prev.filter((p) => !productIds.includes(p._id)));
          setPagination((prev) =>
            prev
              ? {
                  ...prev,
                  totalCount: Math.max(0, prev.totalCount - 1),
                }
              : null
          );
          setSelectedIds(new Set());
          setIsSelectMode(false);

          if (Platform.OS === 'android') {
            ToastAndroid.show('Product restored successfully', ToastAndroid.SHORT);
          } else {
            showAlert('Success', 'Product restored successfully');
          }
        }
      } else {
        // Use bulk restore endpoint
        const response = await apiClient.post('/merchant/products/bulk-restore', {
          productIds,
        });

        if (response.data?.success && response.data?.data) {
          const { restored, failed } = response.data.data;
          const restoreCount = restored.length;

          setDeletedProducts((prev) => prev.filter((p) => !productIds.includes(p._id)));
          setPagination((prev) =>
            prev
              ? {
                  ...prev,
                  totalCount: Math.max(0, prev.totalCount - restoreCount),
                }
              : null
          );
          setSelectedIds(new Set());
          setIsSelectMode(false);

          if (restoreCount > 0) {
            const message =
              restoreCount === 1
                ? 'Product restored successfully'
                : `${restoreCount} products restored successfully`;

            if (Platform.OS === 'android') {
              ToastAndroid.show(message, ToastAndroid.SHORT);
            } else {
              showAlert('Success', message);
            }
          }

          if (failed.length > 0) {
            const failedNames = failed.map((f) => f.name).join(', ');
            showAlert(
              'Partial Restore',
              `Failed to restore: ${failedNames}. ${failed[0]?.error || 'Unknown reason'}`
            );
          }
        }
      }
    } catch (error) {
      if (__DEV__) console.error('Restore error:', error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to restore product. Please try again.';
      showAlert('Error', errorMsg);
    } finally {
      setRestoring(false);
    }
  };

  const handleBulkRestore = () => {
    if (selectedIds.size === 0) return;

    platformAlertConfirm(
      'Restore Selected',
      `Restore ${selectedIds.size} product${selectedIds.size !== 1 ? 's' : ''}? They will be visible to customers again.`,
      () => performRestore(Array.from(selectedIds)),
      'Restore All'
    );
  };

  const toggleSelection = (productId: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(productId)) {
      newSet.delete(productId);
    } else {
      newSet.add(productId);
    }
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === deletedProducts.length && deletedProducts.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(deletedProducts.map((p) => p._id)));
    }
  };

  const filteredProducts = deletedProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="trash" size={64} color={Colors.gray[300]} />
      <Heading3 style={styles.emptyTitle}>No Deleted Products</Heading3>
      <BodyText style={styles.emptySubtitle}>
        Products you delete will appear here for 30 days
      </BodyText>
    </View>
  );

  const renderProductCard = ({ item, index }: { item: DeletedProduct; index: number }) => {
    const isSelected = selectedIds.has(item._id);
    const mainImage =
      typeof item.images?.[0] === 'string' ? item.images[0] : item.images?.[0]?.url || item.image;

    const validImageUrl =
      mainImage && !mainImage.startsWith('file://') && mainImage.trim() !== '' ? mainImage : null;

    return (
      <Animated.View entering={FadeInDown.delay(index * 30).springify()} style={styles.cardWrapper}>
        <Pressable
          onPress={() => {
            if (isSelectMode) {
              toggleSelection(item._id);
            }
          }}
          onLongPress={() => {
            setIsSelectMode(true);
            toggleSelection(item._id);
          }}
          style={[styles.card, isSelected && styles.cardSelected]}
        >
          {isSelectMode && (
            <TouchableOpacity style={styles.checkbox} onPress={() => toggleSelection(item._id)}>
              <View style={[styles.checkboxInner, isSelected && styles.checkboxInnerSelected]}>
                {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
              </View>
            </TouchableOpacity>
          )}

          <View style={styles.imageContainer}>
            {validImageUrl ? (
              <Image source={{ uri: validImageUrl }} style={styles.productImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="image-outline" size={32} color={Colors.gray[300]} />
              </View>
            )}
          </View>

          <View style={styles.contentContainer}>
            <View style={styles.headerRow}>
              <Heading3 style={styles.productName} numberOfLines={2}>
                {item.name}
              </Heading3>
              {item.category && (
                <Badge variant="primary" size="small" style={styles.categoryBadge}>
                  {item.category}
                </Badge>
              )}
            </View>

            <View style={styles.priceRow}>
              <BodyText style={styles.price}>₹{item.price.toFixed(2)}</BodyText>
              {item.sku && <Caption style={styles.sku}>SKU: {item.sku}</Caption>}
            </View>

            <View style={styles.deletedInfoContainer}>
              <View style={styles.deletedBadgeContainer}>
                <Ionicons name="trash-outline" size={14} color={Colors.error[500]} />
                <Caption style={styles.deletedText}>
                  Deleted {formatRelativeTime(item.deletedAt)}
                </Caption>
              </View>
              {item.daysUntilPermanent > 0 && (
                <Caption style={styles.daysWarning}>
                  {item.daysUntilPermanent} day{item.daysUntilPermanent !== 1 ? 's' : ''} left
                </Caption>
              )}
            </View>

            {!isSelectMode && (
              <Pressable
                style={styles.restoreButton}
                onPress={() => handleRestoreSingle(item)}
                disabled={restoring}
              >
                <Ionicons name="refresh" size={18} color="white" />
                <BodyText style={styles.restoreButtonText}>Restore</BodyText>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#7C3AED', '#6366F1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Heading2 style={styles.headerTitle}>Deleted Products</Heading2>
            <Caption style={styles.headerSubtitle}>
              {pagination?.totalCount || 0} product{pagination?.totalCount !== 1 ? 's' : ''} in
              trash
            </Caption>
          </View>
          {isSelectMode && selectedIds.size > 0 && (
            <TouchableOpacity
              style={styles.cancelSelectButton}
              onPress={() => {
                setIsSelectMode(false);
                setSelectedIds(new Set());
              }}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.gray[400]} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or SKU..."
          placeholderTextColor={Colors.gray[400]}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity style={styles.clearButton} onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={Colors.gray[400]} />
          </TouchableOpacity>
        ) : null}
      </View>

      {isSelectMode && selectedIds.size > 0 && (
        <View style={styles.bulkActionBar}>
          <TouchableOpacity style={styles.selectAllButton} onPress={toggleSelectAll}>
            <Ionicons
              name={selectedIds.size === deletedProducts.length ? 'checkbox' : 'square-outline'}
              size={20}
              color={Colors.primary[500]}
            />
            <Caption style={styles.selectAllText}>
              {selectedIds.size === deletedProducts.length ? 'Deselect All' : 'Select All'}
            </Caption>
          </TouchableOpacity>

          <View style={styles.selectionCount}>
            <Caption style={styles.selectionCountText}>{selectedIds.size} selected</Caption>
          </View>

          <Button
            title={`Restore (${selectedIds.size})`}
            onPress={handleBulkRestore}
            disabled={restoring}
            style={styles.bulkRestoreButton}
          />
        </View>
      )}

      {loading && !refreshing ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <BodyText style={styles.loadingText}>Loading deleted products...</BodyText>
        </View>
      ) : filteredProducts.length === 0 ? (
        <FlatList
          data={[]}
          renderItem={() => null}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.emptyListContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary[500]]}
            />
          }
        />
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProductCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary[500]]}
            />
          }
          ListFooterComponent={
            pagination?.hasNext ? (
              <View style={styles.loadingFooter}>
                <ActivityIndicator size="small" color={Colors.primary[500]} />
              </View>
            ) : null
          }
        />
      )}

      {restoring && (
        <View style={styles.restoringOverlay}>
          <View style={styles.restoringContent}>
            <ActivityIndicator size="large" color={Colors.primary[500]} />
            <BodyText style={styles.restoringText}>Restoring...</BodyText>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  headerGradient: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  titleContainer: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    fontSize: 12,
  },
  cancelSelectButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: Colors.text.primary,
  },
  clearButton: {
    padding: 8,
    marginRight: -8,
  },
  bulkActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
    gap: 12,
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  selectAllText: {
    color: Colors.primary[500],
    fontWeight: '600',
  },
  selectionCount: {
    flex: 1,
    justifyContent: 'center',
  },
  selectionCountText: {
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  bulkRestoreButton: {
    flex: 0,
    minWidth: 120,
  },
  centerLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: Colors.text.secondary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    color: Colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtitle: {
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  cardWrapper: {
    marginBottom: 4,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.xl,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border.default,
    ...Shadows.sm,
  },
  cardSelected: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[500],
    borderWidth: 2,
  },
  checkbox: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    paddingVertical: 4,
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInnerSelected: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: Colors.gray[100],
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray[100],
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  productName: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  categoryBadge: {
    marginTop: 2,
  },
  priceRow: {
    marginBottom: 8,
    gap: 4,
  },
  price: {
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  sku: {
    color: Colors.text.tertiary,
    fontSize: 12,
  },
  deletedInfoContainer: {
    marginBottom: 8,
    gap: 4,
  },
  deletedBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deletedText: {
    color: Colors.error[500],
    fontSize: 12,
    fontWeight: '500',
  },
  daysWarning: {
    color: Colors.warning[600],
    fontSize: 11,
    fontStyle: 'italic',
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  restoreButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  loadingFooter: {
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  restoringOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  restoringContent: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.xl,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  restoringText: {
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
