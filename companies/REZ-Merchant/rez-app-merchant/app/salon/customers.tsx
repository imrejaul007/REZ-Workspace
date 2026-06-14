/**
 * Salon Customers - Customer list and history
 *
 * Features:
 * - Customer list with search
 * - Customer profile with visit history
 * - Add customer notes
 * - View service history
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Modal,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { CustomerProfile } from './components/CustomerProfile';
import { salonService, SalonCustomer } from '@/services/api/salon';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: { padding: 4 },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  headerSpacer: {
    width: 32,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: Colors.light.background,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.light.text,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primaryLight2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  customerPhone: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  customerMeta: {
    alignItems: 'flex-end',
  },
  visitCount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  lastVisit: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingTop: 8, paddingBottom: 120 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.light.text, marginTop: 16 },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  filterRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  filterTextActive: { color: '#fff' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  closeBtn: {
    padding: 4,
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
});

type SortFilter = 'recent' | 'name' | 'visits';

export default function SalonCustomersScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [customers, setCustomers] = useState<SalonCustomer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortFilter, setSortFilter] = useState<SortFilter>('recent');
  const [selectedCustomer, setSelectedCustomer] = useState<SalonCustomer | null>(null);
  const [showCustomerProfile, setShowCustomerProfile] = useState(false);

  const storeId = (user as unknown as { storeId?: string; stores?: Array<{ _id?: string }> })?.storeId ||
    (user as unknown as { stores?: Array<{ _id?: string }> })?.stores?.[0]?._id || '';

  const fetchCustomers = useCallback(async () => {
    if (!storeId) return;

    try {
      const customersData = await salonService.getCustomers(storeId, {
        search: searchQuery || undefined,
        sortBy: sortFilter,
      });

      setCustomers(customersData);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [storeId, searchQuery, sortFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, fetchCustomers]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCustomers();
  }, [fetchCustomers]);

  const handleCustomerPress = useCallback((customer: SalonCustomer) => {
    setSelectedCustomer(customer);
    setShowCustomerProfile(true);
  }, []);

  const handleCustomerUpdated = useCallback(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const FILTERS: { key: SortFilter; label: string }[] = [
    { key: 'recent', label: 'Recent' },
    { key: 'name', label: 'Name' },
    { key: 'visits', label: 'Most Visits' },
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatLastVisit = (date: string | undefined) => {
    if (!date) return 'No visits';
    const visitDate = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - visitDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const renderCustomer = useCallback(
    ({ item }: { item: SalonCustomer }) => (
      <TouchableOpacity
        style={styles.customerCard}
        onPress={() => handleCustomerPress(item)}
      >
        <View style={styles.avatar}>
          <ThemedText style={styles.avatarText}>{getInitials(item.name)}</ThemedText>
        </View>
        <View style={styles.customerInfo}>
          <ThemedText style={styles.customerName}>{item.name}</ThemedText>
          <ThemedText style={styles.customerPhone}>{item.phone}</ThemedText>
        </View>
        <View style={styles.customerMeta}>
          <ThemedText style={styles.visitCount}>{item.visitCount || 0} visits</ThemedText>
          <ThemedText style={styles.lastVisit}>
            {formatLastVisit(item.lastVisitDate)}
          </ThemedText>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={Colors.light.textSecondary}
          style={{ marginLeft: 8 }}
        />
      </TouchableOpacity>
    ),
    [handleCustomerPress]
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Customers</ThemedText>
        <TouchableOpacity
          onPress={() => router.push('/salon/add-customer')}
          style={styles.backButton}
        >
          <Ionicons name="person-add-outline" size={24} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={20}
            color={Colors.light.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or phone..."
            placeholderTextColor={Colors.light.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.light.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Sort Filters */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                sortFilter === filter.key && styles.filterChipActive,
              ]}
              onPress={() => setSortFilter(filter.key)}
            >
              <ThemedText
                style={[
                  styles.filterText,
                  sortFilter === filter.key && styles.filterTextActive,
                ]}
              >
                {filter.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Customer List */}
      <FlatList
        data={customers}
        keyExtractor={(item) => item._id}
        renderItem={renderCustomer}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={Colors.light.textSecondary} />
            <ThemedText style={styles.emptyTitle}>No Customers</ThemedText>
            <ThemedText style={styles.emptyText}>
              {searchQuery
                ? 'No customers match your search.'
                : 'Customers who book appointments will appear here.'}
            </ThemedText>
          </View>
        }
      />

      {/* Customer Profile Modal */}
      <Modal
        visible={showCustomerProfile}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCustomerProfile(false)}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setShowCustomerProfile(false)}
              >
                <Ionicons name="close" size={24} color={Colors.light.text} />
              </TouchableOpacity>
              <ThemedText style={styles.modalTitle}>Customer Profile</ThemedText>
            </View>

            {selectedCustomer && (
              <CustomerProfile
                customer={selectedCustomer}
                onUpdate={handleCustomerUpdated}
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
