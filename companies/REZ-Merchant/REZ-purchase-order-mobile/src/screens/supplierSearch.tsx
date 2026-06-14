import React, { useState, useCallback, useEffect } from 'react';
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
import { supplierApi } from '../services/api';
import { Supplier, RootStackParamList } from '../types';
import { EmptyState } from '../components/common';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, 'SupplierSearch'>;

export const SupplierSearchScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();

  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    // Auto-search when coming from CreatePO
    if (route.params?.onSelect) {
      handleSearch('');
    }
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    setHasSearched(true);

    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await supplierApi.searchSuppliers(query);
      if (response.success && response.data) {
        setResults(response.data.suppliers);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSelectSupplier = useCallback((supplier: Supplier) => {
    if (route.params?.onSelect) {
      route.params.onSelect(supplier);
    }
    navigation.navigate('CreatePO', { supplierId: supplier.id });
  }, [route.params, navigation]);

  const renderSupplier = useCallback(({ item }: { item: Supplier }) => (
    <TouchableOpacity
      style={styles.supplierCard}
      onPress={() => handleSelectSupplier(item)}
    >
      <View style={styles.supplierHeader}>
        <View style={styles.supplierAvatar}>
          <Text style={styles.supplierInitial}>
            {item.name?.charAt(0)?.toUpperCase() || 'S'}
          </Text>
        </View>
        <View style={styles.supplierInfo}>
          <View style={styles.supplierNameRow}>
            <Text style={styles.supplierName}>{item.name}</Text>
            {item.isVerified && (
              <MaterialCommunityIcons name="check-decagram" size={16} color="#4CAF50" />
            )}
          </View>
          <Text style={styles.supplierLocation}>
            {item.city}, {item.state}
          </Text>
        </View>
        {item.rating && (
          <View style={styles.ratingBadge}>
            <MaterialCommunityIcons name="star" size={14} color="#FFC107" />
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
          </View>
        )}
      </View>
      <View style={styles.supplierDetails}>
        {item.categories && item.categories.length > 0 && (
          <View style={styles.categories}>
            {item.categories.slice(0, 3).map((cat, index) => (
              <View key={index} style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{cat}</Text>
              </View>
            ))}
            {item.categories.length > 3 && (
              <Text style={styles.moreCategories}>+{item.categories.length - 3}</Text>
            )}
          </View>
        )}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <MaterialCommunityIcons name="file-document-multiple" size={16} color="#666" />
            <Text style={styles.statText}>{item.totalOrders} orders</Text>
          </View>
          {item.phone && (
            <TouchableOpacity
              style={styles.callButton}
              onPress={() => {}}
            >
              <MaterialCommunityIcons name="phone" size={16} color="#4CAF50" />
              <Text style={styles.callButtonText}>Call</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  ), [handleSelectSupplier]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Suppliers</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={24} color="#999" />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Search by name, city, or category..."
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
          <Text style={styles.loadingText}>Searching suppliers...</Text>
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          renderItem={renderSupplier}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : hasSearched ? (
        <EmptyState
          icon="domain-remove"
          title="No Suppliers Found"
          message="Try a different search term or check back later"
        />
      ) : (
        <View style={styles.initialState}>
          <MaterialCommunityIcons name="domain-search" size={64} color="#CCC" />
          <Text style={styles.initialTitle}>Find Suppliers</Text>
          <Text style={styles.initialMessage}>
            Search by name, city, or category to find the best suppliers for your business
          </Text>
          <View style={styles.suggestedCategories}>
            <Text style={styles.suggestedTitle}>Popular Categories</Text>
            <View style={styles.categoryRow}>
              {['Food & Beverage', 'Electronics', 'Office Supplies', 'Packaging'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={styles.suggestedChip}
                  onPress={() => handleSearch(cat)}
                >
                  <Text style={styles.suggestedChipText}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
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
  supplierCard: {
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
  supplierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  supplierAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  supplierInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2196F3',
  },
  supplierInfo: {
    flex: 1,
  },
  supplierNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  supplierName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  supplierLocation: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F57C00',
  },
  supplierDetails: {},
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
  },
  moreCategories: {
    fontSize: 12,
    color: '#999',
    alignSelf: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: '#666',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  callButtonText: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '500',
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
  suggestedCategories: {
    marginTop: 32,
    width: '100%',
  },
  suggestedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    marginBottom: 12,
    textAlign: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  suggestedChip: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  suggestedChipText: {
    fontSize: 13,
    color: '#2196F3',
    fontWeight: '500',
  },
});

export default SupplierSearchScreen;
