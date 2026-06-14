/**
 * Hyperlocal Network - Discover Partners Screen
 *
 * Discover nearby merchants that could be potential partnership candidates.
 * Filter by category, distance, and partnership type.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/DesignTokens';
import { logger } from '@/utils/logger';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DiscoverableMerchant {
  id: string;
  name: string;
  category: string;
  distance: number; // in km
  address: string;
  rating: number;
  reviewCount: number;
  partnershipTypes: ('referral' | 'campaign' | 'cross_promotion')[];
  monthlyCustomers: number;
  hasLoyalty: boolean;
  joinedAt: string;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'apps' },
  { id: 'cafe', label: 'Cafe', icon: 'cafe' },
  { id: 'restaurant', label: 'Restaurant', icon: 'restaurant' },
  { id: 'fitness', label: 'Fitness', icon: 'fitness' },
  { id: 'beauty', label: 'Beauty', icon: 'cut' },
  { id: 'retail', label: 'Retail', icon: 'storefront' },
  { id: 'health', label: 'Health', icon: 'medkit' },
];

const MOCK_MERCHANTS: DiscoverableMerchant[] = [
  {
    id: 'm1',
    name: 'The Coffee Lab',
    category: 'cafe',
    distance: 0.3,
    address: 'MG Road, Bangalore',
    rating: 4.5,
    reviewCount: 234,
    partnershipTypes: ['referral', 'cross_promotion'],
    monthlyCustomers: 1200,
    hasLoyalty: true,
    joinedAt: '2023-06-15',
  },
  {
    id: 'm2',
    name: 'FitZone Gym',
    category: 'fitness',
    distance: 0.5,
    address: 'Indiranagar, Bangalore',
    rating: 4.2,
    reviewCount: 156,
    partnershipTypes: ['campaign', 'cross_promotion'],
    monthlyCustomers: 450,
    hasLoyalty: false,
    joinedAt: '2023-08-20',
  },
  {
    id: 'm3',
    name: 'Glow Spa',
    category: 'beauty',
    distance: 0.8,
    address: 'Koramangala, Bangalore',
    rating: 4.8,
    reviewCount: 312,
    partnershipTypes: ['referral'],
    monthlyCustomers: 380,
    hasLoyalty: true,
    joinedAt: '2023-04-10',
  },
  {
    id: 'm4',
    name: 'Fresh Mart',
    category: 'retail',
    distance: 1.2,
    address: 'HSR Layout, Bangalore',
    rating: 4.0,
    reviewCount: 89,
    partnershipTypes: ['referral', 'campaign'],
    monthlyCustomers: 2500,
    hasLoyalty: false,
    joinedAt: '2023-11-01',
  },
  {
    id: 'm5',
    name: 'HealthFirst Clinic',
    category: 'health',
    distance: 1.5,
    address: 'Whitefield, Bangalore',
    rating: 4.6,
    reviewCount: 178,
    partnershipTypes: ['cross_promotion'],
    monthlyCustomers: 620,
    hasLoyalty: true,
    joinedAt: '2023-07-25',
  },
  {
    id: 'm6',
    name: 'Burger Joint',
    category: 'restaurant',
    distance: 0.2,
    address: 'Brigade Road, Bangalore',
    rating: 4.3,
    reviewCount: 445,
    partnershipTypes: ['referral', 'campaign', 'cross_promotion'],
    monthlyCustomers: 3200,
    hasLoyalty: true,
    joinedAt: '2023-02-14',
  },
];

// ---------------------------------------------------------------------------
// Merchant Card
// ---------------------------------------------------------------------------

interface MerchantCardProps {
  merchant: DiscoverableMerchant;
  onConnect: (merchant: DiscoverableMerchant) => void;
}

const MerchantCard = ({ merchant, onConnect }: MerchantCardProps) => {
  const getCategoryIcon = (category: string) => {
    const cat = CATEGORIES.find((c) => c.id === category);
    return cat?.icon || 'storefront';
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    const stars = [];
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Ionicons key={i} name="star" size={12} color={Colors.warning[500]} />);
      } else if (i === fullStars && hasHalf) {
        stars.push(<Ionicons key={i} name="star-half" size={12} color={Colors.warning[500]} />);
      } else {
        stars.push(<Ionicons key={i} name="star-outline" size={12} color={Colors.gray[300]} />);
      }
    }
    return stars;
  };

  return (
    <View style={cardStyles.container}>
      <View style={cardStyles.header}>
        <View style={cardStyles.iconWrap}>
          <Ionicons name={getCategoryIcon(merchant.category) as unknown} size={24} color={Colors.primary[500]} />
        </View>
        <View style={cardStyles.info}>
          <Text style={cardStyles.name} numberOfLines={1}>
            {merchant.name}
          </Text>
          <Text style={cardStyles.category}>
            {merchant.category.charAt(0).toUpperCase() + merchant.category.slice(1)} - {merchant.distance}km away
          </Text>
          <View style={cardStyles.ratingRow}>
            <View style={cardStyles.stars}>{renderStars(merchant.rating)}</View>
            <Text style={cardStyles.ratingText}>
              {merchant.rating} ({merchant.reviewCount})
            </Text>
          </View>
        </View>
      </View>

      <Text style={cardStyles.address} numberOfLines={1}>
        <Ionicons name="location-outline" size={12} color={Colors.gray[400]} /> {merchant.address}
      </Text>

      <View style={cardStyles.divider} />

      <View style={cardStyles.metricsRow}>
        <View style={cardStyles.metric}>
          <Ionicons name="people-outline" size={14} color={Colors.gray[500]} />
          <Text style={cardStyles.metricText}>{merchant.monthlyCustomers.toLocaleString('en-IN')} customers/mo</Text>
        </View>
        <View style={cardStyles.loyaltyBadge}>
          <Ionicons
            name={merchant.hasLoyalty ? 'checkmark-circle' : 'help-circle-outline'}
            size={14}
            color={merchant.hasLoyalty ? Colors.success[500] : Colors.gray[400]}
          />
          <Text
            style={[
              cardStyles.loyaltyText,
              { color: merchant.hasLoyalty ? Colors.success[600] : Colors.gray[400] },
            ]}
          >
            {merchant.hasLoyalty ? 'Has Loyalty' : 'No Loyalty'}
          </Text>
        </View>
      </View>

      <View style={cardStyles.typeRow}>
        {merchant.partnershipTypes.map((type) => (
          <View key={type} style={cardStyles.typeChip}>
            <Text style={cardStyles.typeChipText}>
              {type === 'referral' ? 'Referral' : type === 'campaign' ? 'Campaign' : 'Cross-Promo'}
            </Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={cardStyles.connectButton} onPress={() => onConnect(merchant)}>
        <Ionicons name="hand-right-outline" size={18} color="#fff" />
        <Text style={cardStyles.connectButtonText}>Send Partnership Request</Text>
      </TouchableOpacity>
    </View>
  );
};

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.gray[900],
    marginBottom: 2,
  },
  category: {
    fontSize: 13,
    color: Colors.gray[500],
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
    color: Colors.gray[500],
    marginLeft: 4,
  },
  address: {
    fontSize: 13,
    color: Colors.gray[400],
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.gray[100],
    marginBottom: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricText: {
    fontSize: 13,
    color: Colors.gray[600],
  },
  loyaltyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  loyaltyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  typeChip: {
    backgroundColor: Colors.primary[50],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary[600],
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary[500],
    borderRadius: 12,
    paddingVertical: 12,
  },
  connectButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function DiscoverScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [merchants] = useState<DiscoverableMerchant[]>(MOCK_MERCHANTS);

  const filteredMerchants = useMemo(() => {
    return merchants.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.address.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [merchants, searchQuery, selectedCategory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    logger.info('[Hyperlocal] Discovering nearby merchants');
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setRefreshing(false);
  }, []);

  const handleConnect = (merchant: DiscoverableMerchant) => {
    logger.info('[Hyperlocal] Sending partnership request to:', merchant.name);
    router.push({
      pathname: '/hyperlocal/create',
      params: { partnerId: merchant.id, partnerName: merchant.name },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.gray[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or location..."
            placeholderTextColor={Colors.gray[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={Colors.gray[400]} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
        style={styles.categoriesScroll}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryChip,
              selectedCategory === cat.id && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Ionicons
              name={cat.icon as unknown}
              size={16}
              color={selectedCategory === cat.id ? '#fff' : Colors.gray[600]}
            />
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === cat.id && styles.categoryChipTextActive,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredMerchants.length} merchants found near you
        </Text>
        <TouchableOpacity style={styles.sortButton}>
          <Ionicons name="swap-vertical" size={16} color={Colors.gray[600]} />
          <Text style={styles.sortText}>Distance</Text>
        </TouchableOpacity>
      </View>

      {/* Merchant List */}
      <ScrollView
        style={styles.merchantList}
        contentContainerStyle={styles.merchantListContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary[500]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredMerchants.length > 0 ? (
          filteredMerchants.map((merchant) => (
            <MerchantCard key={merchant.id} merchant={merchant} onConnect={handleConnect} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={48} color={Colors.gray[300]} />
            <Text style={styles.emptyTitle}>No merchants found</Text>
            <Text style={styles.emptyDesc}>Try adjusting your search or filters</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Info */}
      <View style={styles.bottomInfo}>
        <Ionicons name="information-circle-outline" size={16} color={Colors.gray[500]} />
        <Text style={styles.bottomInfoText}>
          Merchants on ReZ Platform are verified and have agreed to partnership inquiries
        </Text>
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.gray[50],
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.gray[900],
    padding: 0,
  },
  categoriesScroll: {
    maxHeight: 50,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  categoryChipActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.gray[600],
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultsCount: {
    fontSize: 14,
    color: Colors.gray[600],
    fontWeight: '500',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortText: {
    fontSize: 13,
    color: Colors.gray[600],
    fontWeight: '500',
  },
  merchantList: {
    flex: 1,
  },
  merchantListContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[700],
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 14,
    color: Colors.gray[400],
    marginTop: 4,
  },
  bottomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.gray[100],
  },
  bottomInfoText: {
    flex: 1,
    fontSize: 12,
    color: Colors.gray[500],
    lineHeight: 18,
  },
});
