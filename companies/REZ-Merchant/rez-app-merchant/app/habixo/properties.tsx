// Habixo Properties Management Screen
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { getHostProperties, HabixoProperty } from './api';

// Mock data for development/fallback
const MOCK_PROPERTIES: HabixoProperty[] = [
  {
    id: 'p1',
    title: 'Modern Apartment in Koramangala',
    type: 'habixo_stay',
    status: 'active',
    location: 'Koramangala, Bangalore',
    image: 'https://picsum.photos/400/300?random=1',
    price: 2500,
    rating: 4.8,
    bookings: 45,
    earnings: 156000,
    occupancy: 78,
    views: 1234,
    hostId: 'host_123',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-05-01T00:00:00Z',
  },
  {
    id: 'p2',
    title: 'Cozy Room in Indiranagar',
    type: 'habixo_stay',
    status: 'active',
    location: 'Indiranagar, Bangalore',
    image: 'https://picsum.photos/400/300?random=2',
    price: 1200,
    rating: 4.9,
    bookings: 38,
    earnings: 78400,
    occupancy: 82,
    views: 987,
    hostId: 'host_123',
    createdAt: '2024-02-20T00:00:00Z',
    updatedAt: '2024-05-01T00:00:00Z',
  },
  {
    id: 'p3',
    title: 'Beach Villa in Goa',
    type: 'habixo_stay',
    status: 'active',
    location: 'Anjuna, Goa',
    image: 'https://picsum.photos/400/300?random=3',
    price: 5500,
    rating: 4.7,
    bookings: 22,
    earnings: 165000,
    occupancy: 65,
    views: 654,
    hostId: 'host_123',
    createdAt: '2024-03-10T00:00:00Z',
    updatedAt: '2024-05-01T00:00:00Z',
  },
];

const FILTER_TABS = ['All', 'Active', 'Draft', 'Inactive'];

// TODO: Get hostId from auth context/storage
const HOST_ID = 'host_123';

export default function HabixoProperties() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<HabixoProperty[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');

  const fetchProperties = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const data = await getHostProperties(HOST_ID);
      setProperties(data.length > 0 ? data : MOCK_PROPERTIES);
    } catch (err) {
      console.error('Failed to fetch properties:', err);
      setError('Failed to load properties. Showing cached data.');
      setProperties(MOCK_PROPERTIES);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const onRefresh = useCallback(() => {
    fetchProperties(true);
  }, [fetchProperties]);

  // Filter properties based on active tab
  const filteredProperties = activeFilter === 'All'
    ? properties
    : properties.filter(p => p.status.toLowerCase() === activeFilter.toLowerCase());

  // Calculate stats
  const totalBookings = properties.reduce((sum, p) => sum + p.bookings, 0);
  const totalEarnings = properties.reduce((sum, p) => sum + p.earnings, 0);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading properties...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Stats Header */}
      <View style={styles.statsHeader}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{properties.length}</Text>
          <Text style={styles.statLabel}>Properties</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalBookings}</Text>
          <Text style={styles.statLabel}>Total Bookings</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>₹{(totalEarnings / 100000).toFixed(1)}L</Text>
          <Text style={styles.statLabel}>Total Earnings</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabs}>
        {FILTER_TABS.map((tab, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.filterTab, activeFilter === tab && styles.filterTabActive]}
            onPress={() => setActiveFilter(tab)}
          >
            <Text style={[styles.filterTabText, activeFilter === tab && styles.filterTabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Properties List */}
      <ScrollView style={styles.propertyList} refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#6366f1']} />
      }>
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}
        {filteredProperties.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏠</Text>
            <Text style={styles.emptyText}>No properties found</Text>
            <TouchableOpacity
              style={styles.addPropertyButton}
              onPress={() => router.push('/habixo/property/add')}
            >
              <Text style={styles.addPropertyButtonText}>Add Property</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredProperties.map((property) => (
          <TouchableOpacity
            key={property.id}
            style={styles.propertyCard}
            onPress={() => router.push(`/habixo/property/${property.id}`)}
          >
            <Image source={{ uri: property.image }} style={styles.propertyImage} />
            <View style={styles.propertyStatus}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: property.status === 'active' ? '#10b981' : '#f59e0b' },
                ]}
              />
              <Text style={styles.statusText}>
                {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
              </Text>
            </View>
            <View style={styles.propertyContent}>
              <Text style={styles.propertyTitle} numberOfLines={1}>
                {property.title}
              </Text>
              <Text style={styles.propertyLocation}>📍 {property.location}</Text>

              {/* Quick Stats */}
              <View style={styles.quickStats}>
                <View style={styles.quickStat}>
                  <Text style={styles.quickStatIcon}>⭐</Text>
                  <Text style={styles.quickStatValue}>{property.rating}</Text>
                </View>
                <View style={styles.quickStat}>
                  <Text style={styles.quickStatIcon}>📅</Text>
                  <Text style={styles.quickStatValue}>{property.bookings}</Text>
                </View>
                <View style={styles.quickStat}>
                  <Text style={styles.quickStatIcon}>👁️</Text>
                  <Text style={styles.quickStatValue}>{property.views}</Text>
                </View>
                <View style={styles.quickStat}>
                  <Text style={styles.quickStatIcon}>📊</Text>
                  <Text style={styles.quickStatValue}>{property.occupancy}%</Text>
                </View>
              </View>

              {/* Price and Earnings */}
              <View style={styles.priceRow}>
                <View>
                  <Text style={styles.price}>₹{property.price}/night</Text>
                  <Text style={styles.earnings}>
                    ₹{(property.earnings / 1000).toFixed(1)}K earned
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => router.push(`/habixo/property/${property.id}/edit`)}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Add Property FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/habixo/property/add')}
      >
        <Text style={styles.fabIcon}>➕</Text>
        <Text style={styles.fabText}>Add Property</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  statsHeader: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  filterTabs: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f3f4f6',
  },
  filterTabActive: {
    backgroundColor: '#6366f1',
  },
  filterTabText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  propertyList: {
    flex: 1,
    padding: 16,
  },
  propertyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  propertyImage: {
    width: '100%',
    height: 150,
  },
  propertyStatus: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  propertyContent: {
    padding: 16,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  propertyLocation: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  quickStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickStatIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  quickStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  earnings: {
    fontSize: 12,
    color: '#10b981',
    marginTop: 2,
  },
  editButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 28,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  fabIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  fabText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorBanner: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorBannerText: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 16,
  },
  addPropertyButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addPropertyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
