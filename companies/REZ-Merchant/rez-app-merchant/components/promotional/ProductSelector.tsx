import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/DesignTokens';
import { ProductSummary } from '@/types/promotionalVideo';
import { productsService } from '@/services/api/products';

interface ProductSelectorProps {
  storeId: string;
  selectedProducts: ProductSummary[];
  onProductsChange: (products: ProductSummary[]) => void;
  minProducts?: number;
  maxProducts?: number;
  error?: string;
}

export default function ProductSelector({
  storeId,
  selectedProducts,
  onProductsChange,
  minProducts = 1,
  maxProducts = 10,
  error,
}: ProductSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ProductSummary[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      await searchProducts(searchQuery);
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery, storeId]);

  const searchProducts = async (query: string) => {
    if (!query.trim() || !storeId) return;

    setIsSearching(true);
    try {
      const response = await productsService.getProducts({
        storeId,
        search: query,
        limit: 10,
        page: 1,
      });

      // Map response to ProductSummary format
      // Support both legacy (price) and canonical (pricing) formats
      const products: ProductSummary[] = (response.products || []).map((p) => ({
        _id: p.id || p._id,
        name: p.name,
        images: p.images?.map((img) => img.url || img) || [],
        pricing: {
          original: p.pricing?.original ?? p.pricing?.mrp ?? p.price?.regular ?? p.price ?? 0,
          selling: p.pricing?.selling ?? p.price?.sale ?? undefined,
        },
      }));

      // Filter out already selected products
      const filtered = products.filter(
        (p) => !selectedProducts.some((sp) => sp._id === p._id)
      );

      setSearchResults(filtered);
      setShowDropdown(true);
    } catch (error) {
      if (__DEV__) console.error('Product search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectProduct = useCallback(
    (product: ProductSummary) => {
      if (selectedProducts.length >= maxProducts) {
        return;
      }

      onProductsChange([...selectedProducts, product]);
      setSearchQuery('');
      setSearchResults([]);
      setShowDropdown(false);
    },
    [selectedProducts, maxProducts, onProductsChange]
  );

  const handleRemoveProduct = useCallback(
    (productId: string) => {
      onProductsChange(selectedProducts.filter((p) => p._id !== productId));
    },
    [selectedProducts, onProductsChange]
  );

  const renderSelectedProduct = ({ item }: { item: ProductSummary }) => (
    <View style={styles.selectedChip}>
      {item.images?.[0] && (
        <Image
          source={{ uri: item.images[0] }}
          style={styles.chipImage}
          resizeMode="cover"
        />
      )}
      <ThemedText style={styles.chipText} numberOfLines={1}>
        {item.name}
      </ThemedText>
      <TouchableOpacity
        onPress={() => handleRemoveProduct(item._id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close-circle" size={20} color={Colors.gray[500]} />
      </TouchableOpacity>
    </View>
  );

  const renderSearchResult = ({ item }: { item: ProductSummary }) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => handleSelectProduct(item)}
      activeOpacity={0.7}
    >
      {item.images?.[0] ? (
        <Image
          source={{ uri: item.images[0] }}
          style={styles.resultImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.resultImage, styles.placeholderImage]}>
          <Ionicons name="image-outline" size={20} color={Colors.gray[400]} />
        </View>
      )}
      <View style={styles.resultInfo}>
        <ThemedText style={styles.resultName} numberOfLines={1}>
          {item.name}
        </ThemedText>
        {(item.pricing?.selling != null || item.pricing?.original != null) && (
          <ThemedText style={styles.resultPrice}>
            {item.pricing?.selling != null && item.pricing?.original != null && item.pricing.selling < item.pricing.original ? (
              <>
                <ThemedText style={styles.salePrice}>
                  ${(item.pricing.selling ?? 0).toFixed(2)}
                </ThemedText>{' '}
                <ThemedText style={styles.originalPrice}>
                  ${(item.pricing.original ?? 0).toFixed(2)}
                </ThemedText>
              </>
            ) : (
              `$${(item.pricing?.original ?? item.pricing?.selling ?? 0).toFixed(2)}`
            )}
          </ThemedText>
        )}
      </View>
      <Ionicons name="add-circle-outline" size={24} color={Colors.primary[500]} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Label */}
      <View style={styles.labelRow}>
        <ThemedText style={styles.label}>Tag Products</ThemedText>
        <ThemedText style={styles.requirement}>
          ({minProducts} required, max {maxProducts})
        </ThemedText>
      </View>

      {/* Selected Products */}
      {selectedProducts.length > 0 && (
        <View style={styles.selectedContainer}>
          <FlatList
            data={selectedProducts}
            renderItem={renderSelectedProduct}
            keyExtractor={(item) => item._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectedList}
          />
        </View>
      )}

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, error && styles.searchInputError]}>
          <Ionicons
            name="search"
            size={20}
            color={Colors.gray[400]}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products to tag..."
            placeholderTextColor={Colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => searchQuery && setShowDropdown(true)}
            editable={selectedProducts.length < maxProducts}
          />
          {isSearching && (
            <ActivityIndicator size="small" color={Colors.primary[500]} />
          )}
        </View>

        {/* Dropdown */}
        {showDropdown && searchResults.length > 0 && (
          <View style={styles.dropdown}>
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item) => item._id}
              style={styles.dropdownList}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            />
          </View>
        )}

        {/* No results */}
        {showDropdown && searchQuery && !isSearching && searchResults.length === 0 && (
          <View style={styles.dropdown}>
            <View style={styles.noResults}>
              <Ionicons name="search-outline" size={24} color={Colors.gray[400]} />
              <ThemedText style={styles.noResultsText}>
                No products found
              </ThemedText>
            </View>
          </View>
        )}
      </View>

      {/* Error message */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color={Colors.error[500]} />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </View>
      )}

      {/* Helper text */}
      <ThemedText style={styles.helperText}>
        {selectedProducts.length === 0
          ? 'Search and select at least 1 product to tag in this video'
          : `${selectedProducts.length} product${selectedProducts.length !== 1 ? 's' : ''} selected`}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.base,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
  },
  requirement: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    marginLeft: Spacing.xs,
  },
  selectedContainer: {
    marginBottom: Spacing.md,
  },
  selectedList: {
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.xs,
    paddingLeft: Spacing.xs,
    paddingRight: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary[200],
    marginRight: Spacing.sm,
  },
  chipImage: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray[100],
  },
  chipText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary[700],
    maxWidth: 120,
  },
  searchContainer: {
    position: 'relative',
    zIndex: 100,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  searchInputError: {
    borderColor: Colors.error[500],
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    ...(Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }) as unknown),
  },
  dropdown: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    maxHeight: 250,
    ...Shadows.lg,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  dropdownList: {
    maxHeight: 250,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    gap: Spacing.md,
  },
  resultImage: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray[100],
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  resultPrice: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  salePrice: {
    color: Colors.success[600],
    fontWeight: Typography.fontWeight.semiBold,
  },
  originalPrice: {
    color: Colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  noResults: {
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  noResultsText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.tertiary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error[500],
  },
  helperText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    marginTop: Spacing.sm,
  },
});
