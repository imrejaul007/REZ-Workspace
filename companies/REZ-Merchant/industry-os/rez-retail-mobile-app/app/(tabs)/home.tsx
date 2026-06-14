import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Bell, ChevronRight, Sparkles } from '@expo/vector-icons';

interface FeaturedProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  discount?: number;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    // Simulated data loading
    setTimeout(() => {
      setFeaturedProducts([
        { id: '1', name: 'Wireless Earbuds Pro', price: 2999, image: 'https://picsum.photos/200', discount: 15 },
        { id: '2', name: 'Smart Watch Series 5', price: 8999, image: 'https://picsum.photos/201', discount: 10 },
        { id: '3', name: 'Portable Speaker', price: 3499, image: 'https://picsum.photos/202', discount: 20 },
        { id: '4', name: 'LED Desk Lamp', price: 1999, image: 'https://picsum.photos/203' },
      ]);
      setCategories([
        { id: '1', name: 'Electronics', icon: '📱' },
        { id: '2', name: 'Clothing', icon: '👕' },
        { id: '3', name: 'Home', icon: '🏠' },
        { id: '4', name: 'Sports', icon: '⚽' },
        { id: '5', name: 'Books', icon: '📚' },
        { id: '6', name: 'Beauty', icon: '💄' },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={['#2563eb', '#1d4ed8']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Welcome back!</Text>
            <Text style={styles.headerTitle}>REZ Retail</Text>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <Bell name="bell" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <TouchableOpacity style={styles.searchBar}>
          <Search name="search" size={20} color="#9ca3af" />
          <Text style={styles.searchPlaceholder}>Search products...</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Banner */}
      <View style={styles.banner}>
        <LinearGradient
          colors={['#fbbf24', '#f59e0b']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bannerGradient}
        >
          <View style={styles.bannerContent}>
            <Sparkles name="star" size={24} color="#ffffff" />
            <Text style={styles.bannerTitle}>Summer Sale!</Text>
            <Text style={styles.bannerSubtitle}>Up to 50% off on selected items</Text>
            <TouchableOpacity style={styles.bannerBtn}>
              <Text style={styles.bannerBtnText}>Shop Now</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All <ChevronRight name="chevron-right" size={14} /></Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((category) => (
            <TouchableOpacity key={category.id} style={styles.categoryItem}>
              <View style={styles.categoryIcon}>
                <Text style={styles.categoryEmoji}>{category.icon}</Text>
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Featured Products */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Products</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All <ChevronRight name="chevron-right" size={14} /></Text>
          </TouchableOpacity>
        </View>
        <View style={styles.productsGrid}>
          {featuredProducts.map((product) => (
            <TouchableOpacity key={product.id} style={styles.productCard}>
              <View style={styles.productImageContainer}>
                <Image
                  source={{ uri: product.image }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
                {product.discount && (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>{product.discount}% OFF</Text>
                  </View>
                )}
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                <View style={styles.priceContainer}>
                  <Text style={styles.productPrice}>₹{product.price.toLocaleString()}</Text>
                  {product.discount && (
                    <Text style={styles.originalPrice}>
                      ₹{(product.price / (1 - product.discount / 100)).toFixed(0)}
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Loyalty Banner */}
      <View style={styles.loyaltyBanner}>
        <LinearGradient
          colors={['#8b5cf6', '#7c3aed']}
          style={styles.loyaltyGradient}
        >
          <View style={styles.loyaltyContent}>
            <Text style={styles.loyaltyTitle}>You have 250 points!</Text>
            <Text style={styles.loyaltySubtitle}>Join REZ Rewards to earn more</Text>
            <TouchableOpacity style={styles.loyaltyBtn}>
              <Text style={styles.loyaltyBtnText}>Learn More</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
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
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    color: '#bfdbfe',
    fontSize: 14,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchPlaceholder: {
    color: '#9ca3af',
    fontSize: 16,
  },
  banner: {
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  bannerGradient: {
    padding: 20,
  },
  bannerContent: {
    alignItems: 'center',
  },
  bannerTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  bannerSubtitle: {
    color: '#fef3c7',
    fontSize: 14,
    marginTop: 4,
  },
  bannerBtn: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
  },
  bannerBtnText: {
    color: '#f59e0b',
    fontWeight: '600',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    color: '#2563eb',
    fontSize: 14,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 16,
  },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryEmoji: {
    fontSize: 28,
  },
  categoryName: {
    fontSize: 12,
    color: '#6b7280',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  productCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  productImageContainer: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#f3f4f6',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  originalPrice: {
    fontSize: 12,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  loyaltyBanner: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  loyaltyGradient: {
    padding: 20,
  },
  loyaltyContent: {
    alignItems: 'center',
  },
  loyaltyTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loyaltySubtitle: {
    color: '#ddd6fe',
    fontSize: 14,
    marginTop: 4,
  },
  loyaltyBtn: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
    marginTop: 12,
  },
  loyaltyBtnText: {
    color: '#7c3aed',
    fontWeight: '600',
  },
  bottomPadding: {
    height: 20,
  },
});
