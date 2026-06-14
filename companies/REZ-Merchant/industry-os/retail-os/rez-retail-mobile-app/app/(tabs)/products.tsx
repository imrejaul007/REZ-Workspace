import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Search, Filter, SlidersHorizontal } from '@expo/vector-icons';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
  reviews: number;
}

export default function ProductsScreen() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['all', 'Electronics', 'Clothing', 'Home', 'Sports', 'Beauty'];

  useEffect(() => {
    setTimeout(() => {
      setProducts([
        { id: '1', name: 'Wireless Earbuds Pro', price: 2999, originalPrice: 3499, image: 'https://picsum.photos/200', category: 'Electronics', rating: 4.5, reviews: 234 },
        { id: '2', name: 'Smart Watch Series 5', price: 8999, image: 'https://picsum.photos/201', category: 'Electronics', rating: 4.8, reviews: 156 },
        { id: '3', name: 'Premium Cotton T-Shirt', price: 499, originalPrice: 799, image: 'https://picsum.photos/202', category: 'Clothing', rating: 4.2, reviews: 89 },
        { id: '4', name: 'LED Desk Lamp', price: 1999, image: 'https://picsum.photos/203', category: 'Home', rating: 4.6, reviews: 178 },
        { id: '5', name: 'Bluetooth Speaker', price: 3499, originalPrice: 4499, image: 'https://picsum.photos/204', category: 'Electronics', rating: 4.3, reviews: 312 },
        { id: '6', name: 'Yoga Mat Premium', price: 899, image: 'https://picsum.photos/205', category: 'Sports', rating: 4.7, reviews: 445 },
        { id: '7', name: 'Face Serum', price: 599, image: 'https://picsum.photos/206', category: 'Beauty', rating: 4.4, reviews: 223 },
        { id: '8', name: 'Denim Jacket', price: 1499, originalPrice: 1999, image: 'https://picsum.photos/207', category: 'Clothing', rating: 4.5, reviews: 167 },
      ]);
      setLoading(false);
    }, 800);
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity style={styles.productCard}>
      <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="cover" />
      <View style={styles.productContent}>
        <Text style={styles.productCategory}>{item.category}</Text>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.ratingRow}>
          <Text style={styles.rating}>★ {item.rating}</Text>
          <Text style={styles.reviews}>({item.reviews})</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.productPrice}>₹{item.price.toLocaleString()}</Text>
          {item.originalPrice && (
            <Text style={styles.originalPrice}>₹{item.originalPrice.toLocaleString()}</Text>
          )}
        </View>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search name="search" size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <SlidersHorizontal name="sliders" size={20} color="#2563eb" />
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === item && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === item && styles.categoryChipTextActive,
                ]}
              >
                {item === 'all' ? 'All' : item}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Products Grid */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        numColumns={2}
        columnWrapperStyle={styles.productsRow}
        contentContainerStyle={styles.productsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  categoriesContainer: {
    paddingBottom: 8,
  },
  categoriesList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#6b7280',
  },
  categoryChipTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  productsList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  productsRow: {
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#f3f4f6',
  },
  productContent: {
    padding: 12,
  },
  productCategory: {
    fontSize: 11,
    color: '#2563eb',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginTop: 4,
    lineHeight: 20,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  rating: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '600',
  },
  reviews: {
    fontSize: 12,
    color: '#9ca3af',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  originalPrice: {
    fontSize: 12,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  addButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
  },
});
