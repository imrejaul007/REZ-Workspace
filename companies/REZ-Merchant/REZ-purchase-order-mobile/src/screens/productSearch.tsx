import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { productApi } from '../services/api';
import { ProductSearchResult, RootStackParamList } from '../types';
import { EmptyState, QuantitySelector } from '../components/common';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, 'ProductSearch'>;

export const ProductSearchScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();

  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    setHasSearched(true);

    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await productApi.searchProducts(query);
      if (response.success && response.data) {
        setResults(response.data.products || []);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSelectProduct = useCallback((product: ProductSearchResult) => {
    if (route.params?.onSelect) {
      route.params.onSelect(product);
    }
    navigation.goBack();
  }, [route.params, navigation]);

  const updateQuantity = useCallback((productId: string, qty: number) => {
    setQuantities((prev) => ({ ...prev, [productId]: qty }));
  }, []);

  const renderProduct = useCallback(({ item }: { item: ProductSearchResult }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => handleSelectProduct(item)}
    >
      <View style={styles.productHeader}>
        <View style={styles.productIcon}>
          <MaterialCommunityIcons name="package-variant" size={24} color="#2196F3" />
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productSku}>SKU: {item.sku}</Text>
        </View>
      </View>

      <View style={styles.productDetails}>
        <View style={styles.priceRange}>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Min</Text>
            <Text style={styles.priceValue}>{formatCurrency(item.minPrice)}</Text>
          </View>
          <View style={styles.priceDivider} />
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Avg</Text>
            <Text style={styles.priceValueAvg}>{formatCurrency(item.avgPrice)}</Text>
          </View>
          <View style={styles.priceDivider} />
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Max</Text>
            <Text style={styles.priceValue}>{formatCurrency(item.maxPrice)}</Text>
          </View>
        </View>

        <View style={styles.productMeta}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="domain" size={14} color="#666" />
            <Text style={styles.metaText}>{item.suppliers} suppliers</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="tag" size={14} color="#666" />
            <Text style={styles.metaText}>{item.category}</Text>
          </View>
        </View>

        <View style={styles.quantityRow}>
          <Text style={styles.quantityLabel}>Quick Add</Text>
          <QuantitySelector
            value={quantities[item.id] || 1}
            onChange={(qty) => updateQuantity(item.id, qty)}
            min={1}
            max={999}
          />
        </View>
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => handleSelectProduct(item)}
      >
        <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
        <Text style={styles.addButtonText}>Add to PO</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  ), [handleSelectProduct, quantities, updateQuantity]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Products</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={24} color="#999" />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Search products by name or SKU..."
          placeholderTextColor="#999"
          autoFocus
          returnKeyType="search"
          onSubmitEditing={() => handleSearch(searchQuery)}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <MaterialCommunityIcons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Results */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Searching products...</Text>
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : hasSearched ? (
        <EmptyState
          icon="package-variant-remove"
          title="No Products Found"
          message="Try a different search term or add a custom product"
        />
      ) : (
        <View style={styles.initialState}>
          <MaterialCommunityIcons name="package-variant" size={64} color="#CCC" />
          <Text style={styles.initialTitle}>Add Products</Text>
          <Text style={styles.initialMessage}>
            Search for products to add to your purchase order. Compare prices from multiple suppliers.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    padding: 16,
  },
  productCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  productIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  productSku: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  productDetails: {},
  priceRange: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  priceItem: {
    flex: 1,
    alignItems: 'center',
  },
  priceDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E0E0E0',
  },
  priceLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  priceValueAvg: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  productMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quantityLabel: {
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  initialState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  initialTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
  },
  initialMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});

export default ProductSearchScreen;
