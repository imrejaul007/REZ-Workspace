import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Image,
  Pressable,
  Platform,
  Switch,
  ToastAndroid,
} from 'react-native';
import {
  platformAlertSimple,
  platformAlertConfirm,
  platformAlertDestructive,
  platformAlert,
} from '@/utils/platformAlert';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { showAlert, showConfirm } from '@/utils/alert';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Colors, Spacing, Shadows, BorderRadius } from '@/constants/DesignTokens';
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
import { productsService, catalogService } from '@/services';
import { Product } from '@/shared/types';
import { processProductImages } from '@/utils/imageUtils';
import { logger } from '@/utils/logger';

type ViewMode = 'grid' | 'list';
type FilterType = 'all' | 'active' | 'inactive' | 'low_stock' | 'out_of_stock';

export default function ProductsScreen() {
  const { token } = useAuth();
  const { activeStore, stores } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedStoreId, setSelectedStoreId] = useState<string>(activeStore?._id || '');
  const [page, setPage] = useState(1);
  const pageRef = useRef(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const fetchProducts = useCallback(
    async (isRefresh = false) => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        if (isRefresh) {
          setRefreshing(true);
          pageRef.current = 1;
          setPage(1);
        } else {
          setLoading(true);
        }

        const currentPage = isRefresh ? 1 : pageRef.current;

        // Determine which status filter to use
        let statusFilter: string | undefined;
        if (activeFilter === 'active') statusFilter = 'active';
        else if (activeFilter === 'inactive') statusFilter = 'inactive';
        else if (activeFilter === 'low_stock') statusFilter = 'low_stock';
        else if (activeFilter === 'out_of_stock') statusFilter = 'out_of_stock';

        // Try catalog service first (real backend with retry), fall back to merchant API
        let data: { products: Product[]; totalCount: number; totalPages: number } | null = null;

        try {
          // Get merchantId from auth context or active store
          const merchantId = activeStore?.merchantId || '';

          if (merchantId) {
            const catalogData = await catalogService.getProducts(merchantId, {
              page: currentPage,
              limit: 20,
              search: searchQuery.trim() || undefined,
              status: statusFilter,
            });

            data = {
              products: catalogData.products as unknown as Product[],
              totalCount: catalogData.totalCount,
              totalPages: catalogData.totalPages,
            };
            if (__DEV__) logger.log('📦 Products loaded from catalog service:', data.totalCount);
          }
        } catch (catalogError) {
          // Fall back to merchant API
          if (__DEV__) logger.warn('Catalog service unavailable, using merchant API:', catalogError);

          const filters = {
            page: currentPage,
            limit: 20,
            sortBy: 'created' as const,
            sortOrder: 'desc' as const,
            query: searchQuery.trim() || undefined,
            status: statusFilter,
            storeId: selectedStoreId || undefined,
          };

          data = await productsService.getProducts(filters);
        }

        if (!data) {
          throw new Error('Failed to fetch products from both services');
        }

        const productsList = data.products || [];

        // Process images for all products
        const processedProducts = productsList.map((product) => ({
          ...product,
          images: processProductImages(product.images),
        }));

        if (isRefresh || currentPage === 1) {
          setProducts(processedProducts);
        } else {
          setProducts((prev) => [...prev, ...processedProducts]);
        }

        setTotalCount(data.totalCount || 0);
        setHasMore(currentPage < (data.totalPages || 1));

        if (productsList.length > 0) {
          pageRef.current = currentPage + 1;
          setPage(currentPage + 1);
        }
      } catch (error) {
        if (__DEV__) logger.error('Error fetching products:', error);
        showAlert('Error', 'Failed to load products. Please try again.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, searchQuery, activeFilter, selectedStoreId, activeStore]
  );

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchProducts(true);
    }, 400);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, activeFilter, selectedStoreId, fetchProducts]);

  const handleRefresh = () => {
    fetchProducts(true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchProducts();
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (__DEV__) logger.log('[DELETE LIST] handleDeleteProduct called with ID:', productId);
    if (__DEV__) logger.log('[DELETE LIST] Token exists:', !!token);
    if (__DEV__) logger.log('[DELETE LIST] Platform:', Platform.OS);

    if (!token) {
      if (__DEV__) logger.error('❌ [DELETE LIST] No token available');
      showAlert('Error', 'Authentication required. Please log in again.');
      return;
    }

    const confirmMessage =
      'Are you sure you want to delete this product? This will delete the product, all images, videos, and related data. This action cannot be undone.';

    showConfirm(
      'Delete Product',
      confirmMessage,
      () => {
        if (__DEV__) logger.log('[DELETE LIST] User confirmed deletion');
        handleDeleteConfirmed(productId);
      },
      () => {
        if (__DEV__) logger.log('[DELETE LIST] User cancelled deletion');
      }
    );
  };

  const handleDeleteConfirmed = async (productId: string) => {
    if (__DEV__) logger.log('[DELETE LIST] handleDeleteConfirmed called with ID:', productId);
    if (__DEV__) logger.log('[DELETE LIST] Starting deletion process...');

    try {
      if (__DEV__)
        logger.log('🗑️ [DELETE LIST] Calling productsService.deleteProduct with ID:', productId);

      await productsService.deleteProduct(productId);

      if (__DEV__) logger.log('[DELETE LIST] Product deleted successfully via productsService');

      // Remove from local state
      setProducts((prev) => prev.filter((p) => (p.id || p._id) !== productId));
      setTotalCount((prev) => Math.max(0, prev - 1));

      if (__DEV__) logger.log('[DELETE LIST] Product removed from local state');

      // Show success message
      showAlert('Success', 'Product and all related data deleted successfully');

      // Reset page to 1 before refetch so pagination restarts from the
      // beginning and we don't skip/duplicate products after a delete.
      pageRef.current = 1;
      setPage(1);

      // Refresh the list to ensure consistency
      if (__DEV__) logger.log('[DELETE LIST] Refreshing product list...');
      await fetchProducts(true);
      if (__DEV__) logger.log('[DELETE LIST] Product list refreshed');
    } catch (error) {
      if (__DEV__) logger.error('❌ [DELETE LIST] Error caught:', error);
      if (__DEV__) logger.error('❌ [DELETE LIST] Error message:', error?.message);
      if (__DEV__) logger.error('❌ [DELETE LIST] Error stack:', error?.stack);

      const errorMessage = error?.message || 'Failed to delete product. Please try again.';

      showAlert('Error', errorMessage);
    }
  };

  const handleToggleStatus = async (product: Product) => {
    const productId = product.id || product._id;
    const isCurrentlyActive = product.isActive ?? (product as unknown as { status?: string }).status === 'active';
    const newActive = !isCurrentlyActive;

    // Optimistic update
    setProducts((prev) =>
      prev.map((p) =>
        (p.id || p._id) === productId
          ? { ...p, isActive: newActive, status: newActive ? 'active' : 'inactive' }
          : p
      )
    );

    try {
      await productsService.updateProduct(productId!, {
        status: newActive ? 'active' : 'inactive',
      });
      const message = newActive ? 'Product activated' : 'Product deactivated';
      if (Platform.OS === 'android') {
        ToastAndroid.show(message, ToastAndroid.SHORT);
      } else {
        platformAlertSimple('Status Updated', message);
      }
    } catch (error) {
      // Revert on failure
      setProducts((prev) =>
        prev.map((p) =>
          (p.id || p._id) === productId
            ? {
                ...p,
                isActive: isCurrentlyActive,
                status: isCurrentlyActive ? 'active' : 'inactive',
              }
            : p
        )
      );
      showAlert('Error', 'Failed to update product status. Please try again.');
    }
  };

  const renderProductCard = ({ item, index }: { item: Product; index: number }) => {
    // Filter out invalid images (file:// URLs or empty URLs)
    // Handle both string URLs and object formats
    const validImages = (item.images?.filter((img) => {
      const url = typeof img === 'string' ? img : (img as { url?: string })?.url;
      return url && !url.startsWith('file://') && url.trim() !== '';
    }) || []);

    const mainImage =
      typeof validImages[0] === 'string' ? validImages[0] : (validImages[0] as { url?: string })?.url || '';
    const inventory: unknown = item.inventory || {};
    const stockQty = inventory.stock ?? inventory.quantity ?? 0;
    const isLowStock = stockQty > 0 && stockQty <= (inventory.lowStockThreshold ?? 10);
    const isOutOfStock = stockQty === 0 && !inventory.unlimited;

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 50).springify()}
        style={[styles.productCardWrapper, viewMode === 'grid' ? { flex: 0.5 } : { width: '100%' }]}
      >
        <Card
          style={[styles.productCard, viewMode === 'list' && styles.productCardList]}
          onPress={() => router.push(`/products/${item.id || item._id}`)}
          padding="sm"
        >
          <View
            style={[
              styles.productImageContainer,
              viewMode === 'list' && styles.productImageContainerList,
            ]}
          >
            {mainImage ? (
              <Image source={{ uri: mainImage }} style={styles.productImage} resizeMode="cover" />
            ) : (
              <View style={[styles.productImage, styles.placeholderImage]}>
                <Ionicons name="image-outline" size={32} color={Colors.gray[400]} />
              </View>
            )}

            {(isOutOfStock || isLowStock) && (
              <View style={[styles.stockBadge]}>
                <Badge variant={isOutOfStock ? 'error' : 'warning'} size="small">
                  {isOutOfStock ? 'Out of Stock' : 'Low Stock'}
                </Badge>
              </View>
            )}
          </View>

          <View style={[styles.productInfo, viewMode === 'list' && styles.productInfoList]}>
            <BodyText style={styles.productName} numberOfLines={2}>
              {item.name}
            </BodyText>

            <Heading3 style={styles.productPrice}>
              ₹{(Number(item.pricing?.selling) || Number(item.price) || 0).toFixed(2)}
            </Heading3>

            {item.sku && (
              <Caption style={styles.productSku} numberOfLines={1}>
                SKU: {item.sku}
              </Caption>
            )}
            {item.storeId && stores.length > 1 && (
              <Caption style={styles.productStore} numberOfLines={1}>
                {stores.find((s) => s._id === item.storeId)?.name || 'Unknown Store'}
              </Caption>
            )}

            <View style={styles.productMeta}>
              <Badge variant={item.isActive ? 'success' : 'default'} size="small">
                {item.isActive ? 'ACTIVE' : 'INACTIVE'}
              </Badge>

              <Caption style={styles.stockText}>Stock: {stockQty}</Caption>
            </View>

            <View style={styles.statusToggleRow}>
              <Caption style={styles.toggleLabel}>{item.isActive ? 'Active' : 'Inactive'}</Caption>
              <Switch
                value={!!item.isActive}
                onValueChange={() => handleToggleStatus(item)}
                trackColor={{ false: Colors.gray[300], true: Colors.success[400] }}
                thumbColor={item.isActive ? Colors.success[600] : Colors.gray[100]}
                accessibilityLabel={`Toggle ${item.name} active status`}
                accessibilityRole="switch"
              />
            </View>
          </View>

          <View style={styles.productActions}>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: Colors.primary[50] }]}
              onPress={() => router.push(`/products/edit/${item.id || item._id}`)}
              accessibilityLabel={`Edit ${item.name}`}
              accessibilityRole="button"
            >
              <Ionicons name="pencil" size={16} color={Colors.primary[600]} />
            </TouchableOpacity>

            {/* FEAT-16: 86 button - mark item unavailable */}
            <TouchableOpacity
              style={[
                styles.iconButton,
                { backgroundColor: item.is86d ? Colors.error[100] : Colors.warning[50] },
              ]}
              onPress={(e) => {
                e.stopPropagation();
                const productId = item.id || item._id;
                if (item.is86d) {
                  platformAlertConfirm(
                    'Restore Item?',
                    `Make ${item.name} available again?`,
                    async () => {
                      try {
                        await productsService.restore86Item(productId!);
                        setProducts((prev) =>
                          prev.map((p) =>
                            p.id === productId || p._id === productId ? { ...p, is86d: false } : p
                          )
                        );
                        ToastAndroid.show('Item restored', ToastAndroid.SHORT);
                      } catch (err) {
                        showAlert('Error', 'Failed to restore item');
                      }
                    },
                    'Restore'
                  );
                } else {
                  platformAlertDestructive(
                    '86 This Item?',
                    `Mark ${item.name} as unavailable until 6am tomorrow?`,
                    async () => {
                      try {
                        await productsService.mark86Item(productId!);
                        setProducts((prev) =>
                          prev.map((p) =>
                            p.id === productId || p._id === productId ? { ...p, is86d: true } : p
                          )
                        );
                        ToastAndroid.show('Item marked as unavailable', ToastAndroid.SHORT);
                      } catch (err) {
                        showAlert('Error', 'Failed to mark item as unavailable');
                      }
                    },
                    '86 It'
                  );
                }
              }}
              activeOpacity={0.7}
              accessibilityLabel={`${item.is86d ? 'Restore' : '86'} ${item.name}`}
              accessibilityRole="button"
            >
              <Ionicons
                name={item.is86d ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={Colors.warning[600]}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: Colors.error[50] }]}
              onPress={(e) => {
                if (__DEV__) logger.log('[DELETE LIST] Delete button pressed');
                e.stopPropagation();
                const productId = item.id || item._id;
                if (__DEV__) logger.log('[DELETE LIST] Product ID:', productId);
                if (__DEV__) logger.log('[DELETE LIST] Product name:', item.name);

                if (productId) {
                  handleDeleteProduct(productId);
                } else {
                  if (__DEV__) logger.error('❌ [DELETE LIST] Product ID not found');
                  const errorMsg = 'Product ID not found';
                  showAlert('Error', errorMsg);
                }
              }}
              activeOpacity={0.7}
              accessibilityLabel={`Delete ${item.name}`}
              accessibilityRole="button"
            >
              <Ionicons name="trash" size={16} color={Colors.error[600]} />
            </TouchableOpacity>
          </View>
        </Card>
      </Animated.View>
    );
  };

  const renderFilters = () => {
    const filters: { key: FilterType; label: string; icon: string }[] = [
      { key: 'all', label: 'All', icon: 'grid' },
      { key: 'active', label: 'Active', icon: 'checkmark-circle' },
      { key: 'inactive', label: 'Inactive', icon: 'pause-circle' },
      { key: 'low_stock', label: 'Low Stock', icon: 'warning' },
      { key: 'out_of_stock', label: 'Out of Stock', icon: 'close-circle' },
    ];

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[styles.filterButton, activeFilter === filter.key && styles.activeFilterButton]}
            onPress={() => setActiveFilter(filter.key)}
          >
            <Ionicons
              name={filter.icon as unknown as keyof typeof Ionicons.glyphMap}
              size={16}
              color={activeFilter === filter.key ? Colors.text.inverse : Colors.text.secondary}
            />
            <BodyText
              style={[styles.filterText, activeFilter === filter.key && styles.activeFilterText]}
            >
              {filter.label}
            </BodyText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="storefront-outline" size={64} color={Colors.gray[300]} />
      <Heading2 style={styles.emptyTitle}>
        {searchQuery || activeFilter !== 'all' ? 'No products found' : 'No products yet'}
      </Heading2>
      <BodyText style={styles.emptySubtitle}>
        {searchQuery || activeFilter !== 'all'
          ? 'Try adjusting your search or filters'
          : 'Add your first product to get started'}
      </BodyText>
      {!searchQuery && activeFilter === 'all' && (
        <Button
          title="Add Product"
          onPress={() => router.push('/products/add')}
          style={{ marginTop: Spacing.lg }}
        />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Heading2>Products</Heading2>
            <BodyText>
              {totalCount} {totalCount === 1 ? 'product' : 'products'}
            </BodyText>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.addButton} onPress={() => router.push('/products/add')}>
              <Ionicons name="add" size={24} color={Colors.text.inverse} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => {
                platformAlert('Products Menu', '', [
                  {
                    text: 'Deleted Products',
                    onPress: () => router.push('/(dashboard)/product-restore'),
                  },
                  { text: 'Cancel', style: 'cancel' },
                ]);
              }}
            >
              <Ionicons name="ellipsis-vertical" size={24} color={Colors.text.inverse} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={Colors.text.tertiary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.text.tertiary}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close" size={20} color={Colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Store Filter */}
        {stores.length > 1 && (
          <View style={styles.storeFilterContainer}>
            <Caption style={styles.storeFilterLabel}>Filter by Store:</Caption>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.storeFilterScroll}
              contentContainerStyle={styles.storeFilterContent}
            >
              <TouchableOpacity
                style={[
                  styles.storeFilterButton,
                  !selectedStoreId && styles.storeFilterButtonActive,
                ]}
                onPress={() => setSelectedStoreId('')}
              >
                <BodyText
                  style={[styles.storeFilterText, !selectedStoreId && styles.storeFilterTextActive]}
                >
                  All Stores
                </BodyText>
              </TouchableOpacity>
              {stores.map((store) => (
                <TouchableOpacity
                  key={store._id}
                  style={[
                    styles.storeFilterButton,
                    selectedStoreId === store._id && styles.storeFilterButtonActive,
                  ]}
                  onPress={() => setSelectedStoreId(store._id)}
                >
                  <BodyText
                    style={[
                      styles.storeFilterText,
                      selectedStoreId === store._id && styles.storeFilterTextActive,
                    ]}
                  >
                    {store.name}
                  </BodyText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* View Toggle and Filters */}
        <View style={styles.controlsRow}>
          {renderFilters()}

          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.viewButton, viewMode === 'grid' && styles.activeViewButton]}
              onPress={() => setViewMode('grid')}
            >
              <Ionicons
                name="grid"
                size={20}
                color={viewMode === 'grid' ? Colors.primary[500] : Colors.text.tertiary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.viewButton, viewMode === 'list' && styles.activeViewButton]}
              onPress={() => setViewMode('list')}
            >
              <Ionicons
                name="list"
                size={20}
                color={viewMode === 'list' ? Colors.primary[500] : Colors.text.tertiary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Products List */}
      {loading && products.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <BodyText style={styles.loadingText}>Loading products...</BodyText>
        </View>
      ) : products.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={products}
          renderItem={({ item, index }) => renderProductCard({ item, index })}
          keyExtractor={(item) => item.id || item._id || ''}
          numColumns={viewMode === 'grid' ? 2 : 1}
          key={viewMode}
          contentContainerStyle={styles.productsList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary[500]]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={() =>
            loading && products.length > 0 ? (
              <View style={styles.loadMoreContainer}>
                <ActivityIndicator size="small" color={Colors.primary[500]} />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  header: {
    backgroundColor: Colors.background.primary,
    padding: Spacing.base,
    paddingTop: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: Colors.primary[500],
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  moreButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary[600],
    ...Shadows.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: Spacing.md,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
  },
  clearButton: {
    padding: 4,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filtersContainer: {
    flex: 1,
    marginRight: 12,
  },
  filtersContent: {
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.background.secondary,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  activeFilterButton: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  filterText: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  activeFilterText: {
    color: Colors.text.inverse,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    padding: 4,
  },
  viewButton: {
    padding: 6,
    borderRadius: 6,
  },
  activeViewButton: {
    backgroundColor: Colors.background.primary,
    ...Shadows.sm,
  },
  productsList: {
    padding: Spacing.base,
    gap: Spacing.md,
  },
  productCardWrapper: {
    padding: 4,
  },
  productCard: {
    flex: 1,
    minHeight: 250,
  },
  productCardList: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 'auto',
  },
  productImageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
    backgroundColor: Colors.background.secondary,
  },
  productImageContainerList: {
    width: 80,
    height: 80,
    marginBottom: 0,
    marginRight: Spacing.md,
    flex: 0,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  productInfo: {
    flex: 1,
  },
  productInfoList: {
    justifyContent: 'center',
  },
  productName: {
    fontWeight: '600',
    marginBottom: 4,
    color: Colors.text.primary,
  },
  productSku: {
    color: Colors.text.tertiary,
    marginBottom: 2,
  },
  productPrice: {
    color: Colors.primary[600],
    marginBottom: 4,
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  stockText: {
    color: Colors.text.secondary,
  },
  statusToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  toggleLabel: {
    color: Colors.text.secondary,
    fontSize: 11,
  },
  productActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.md,
    justifyContent: 'flex-end',
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: Colors.text.secondary,
  },
  loadMoreContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
  },
  storeFilterContainer: {
    marginBottom: 12,
  },
  storeFilterLabel: {
    marginBottom: 8,
  },
  storeFilterScroll: {
    maxHeight: 40,
  },
  storeFilterContent: {
    gap: 8,
    paddingRight: 16,
  },
  storeFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  storeFilterButtonActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  storeFilterText: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  storeFilterTextActive: {
    color: Colors.text.inverse,
  },
  productStore: {
    fontSize: 11,
    color: Colors.primary[600],
    fontWeight: '500',
    marginBottom: 4,
  },
});
