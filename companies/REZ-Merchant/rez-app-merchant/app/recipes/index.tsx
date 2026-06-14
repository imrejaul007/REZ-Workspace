import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';
import { showAlert } from '@/utils/alert';
import { logger } from '@/utils/logger';

interface ProductWithRecipe {
  id: string;
  name: string;
  image?: string;
  foodCostPercentage?: number;
  margin?: number;
  sellingPrice: number;
  hasRecipe: boolean;
}

type FilterType = 'all' | 'high-cost' | 'low-margin';

export default function RecipeCostingScreen() {
  const [products, setProducts] = useState<ProductWithRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');

  const fetchProducts = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setIsLoading(true);

      const response = await apiClient.get<unknown>('/merchant/analytics/food-cost/by-product');
      if (response.success && response.data) {
        const productsData = Array.isArray(response.data)
          ? response.data
          : response.data.products || [];
        setProducts(productsData);
      } else {
        showAlert('Error', response.message || 'Failed to load products');
      }
    } catch (error) {
      logger.error('Error fetching products:', error);
      showAlert('Error', error?.message || 'Failed to load products');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleRefresh = () => {
    fetchProducts(true);
  };

  const getFilteredProducts = () => {
    let filtered = products.filter((p) => p.name.toLowerCase().includes(searchText.toLowerCase()));

    if (filterType === 'high-cost') {
      filtered = filtered.filter((p) => p.foodCostPercentage && p.foodCostPercentage > 40);
    } else if (filterType === 'low-margin') {
      filtered = filtered.filter((p) => p.margin && p.margin < 30);
    }

    return filtered;
  };

  const getFoodCostColor = (percentage?: number): string => {
    if (!percentage) return Colors.light.icon;
    if (percentage <= 30) return Colors.light.success;
    if (percentage <= 40) return Colors.light.warning;
    return Colors.light.error;
  };

  const renderProductCard = ({ item }: { item: ProductWithRecipe }) => (
    <TouchableOpacity style={styles.productCard} onPress={() => router.push(`/recipes/${item.id}`)}>
      <View style={styles.productHeader}>
        {item.image && (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image" size={24} color={Colors.light.icon} />
          </View>
        )}
        <View style={styles.productInfo}>
          <ThemedText style={styles.productName}>{item.name}</ThemedText>
          {item.hasRecipe && item.foodCostPercentage ? (
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.foodCostBadge,
                  { backgroundColor: `${getFoodCostColor(item.foodCostPercentage)}20` },
                ]}
              >
                <ThemedText
                  style={[
                    styles.foodCostBadgeText,
                    { color: getFoodCostColor(item.foodCostPercentage) },
                  ]}
                >
                  {item.foodCostPercentage.toFixed(1)}%
                </ThemedText>
              </View>
              {item.margin && (
                <ThemedText style={styles.marginText}>
                  Margin: {item.margin.toFixed(1)}% · ₹{item.sellingPrice}
                </ThemedText>
              )}
            </View>
          ) : (
            <ThemedText style={styles.noRecipeText}>No recipe costed yet</ThemedText>
          )}
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push(`/recipes/${item.id}`)}
        >
          <ThemedText style={styles.actionButtonText}>
            {item.hasRecipe ? 'Edit Recipe →' : '+ Add Recipe'}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <ThemedText style={styles.loadingText}>Loading products...</ThemedText>
      </ThemedView>
    );
  }

  const filteredProducts = getFilteredProducts();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Recipe Costing</ThemedText>
      </View>

      <ScrollView
        style={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchInput}>
            <Ionicons name="search" size={20} color={Colors.light.icon} />
            <TextInput
              style={styles.searchField}
              placeholder="Search products..."
              placeholderTextColor={Colors.light.icon}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filterSection}>
          <TouchableOpacity
            style={[styles.filterButton, filterType === 'all' && styles.filterButtonActive]}
            onPress={() => setFilterType('all')}
          >
            <ThemedText
              style={[
                styles.filterButtonText,
                filterType === 'all' && styles.filterButtonTextActive,
              ]}
            >
              All
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filterType === 'high-cost' && styles.filterButtonActive]}
            onPress={() => setFilterType('high-cost')}
          >
            <ThemedText
              style={[
                styles.filterButtonText,
                filterType === 'high-cost' && styles.filterButtonTextActive,
              ]}
            >
              {'High Cost >40%'}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filterType === 'low-margin' && styles.filterButtonActive]}
            onPress={() => setFilterType('low-margin')}
          >
            <ThemedText
              style={[
                styles.filterButtonText,
                filterType === 'low-margin' && styles.filterButtonTextActive,
              ]}
            >
              Low Margin
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Products List */}
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="restaurant" size={64} color={Colors.light.icon} />
            <ThemedText style={styles.emptyStateTitle}>No products found</ThemedText>
            <ThemedText style={styles.emptyStateText}>
              {searchText ? 'Try a different search' : 'Add products to get started'}
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            renderItem={renderProductCard}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.productsList}
          />
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/recipes/new')}>
        <Ionicons name="add" size={32} color={Colors.light.card} />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.light.tint,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.light.card,
  },
  scrollContent: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  searchField: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 16,
    color: Colors.light.text,
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  filterButtonActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.text,
  },
  filterButtonTextActive: {
    color: Colors.light.card,
  },
  productsList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 100,
  },
  productCard: {
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  productHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  imagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 6,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  foodCostBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  foodCostBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  marginText: {
    fontSize: 12,
    color: Colors.light.icon,
  },
  noRecipeText: {
    fontSize: 12,
    color: Colors.light.icon,
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.light.background,
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.tint,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.light.icon,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
