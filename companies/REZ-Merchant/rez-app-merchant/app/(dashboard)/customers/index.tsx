/**
 * Customers Page - REZ Merchant CRM
 *
 * Real customer data integration with:
 * - Customer list with search and filtering
 * - Customer segmentation (new, active, inactive, at_risk, churned, vip, occasional)
 * - Customer lifetime value calculation
 * - Customer order history
 * - Customer notes
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import {
  customerService,
  customerService as service,
  Customer,
  CustomerSegment,
  CustomerLifetimeValue,
  SEGMENT_CONFIG,
  LTV_TIER_CONFIG,
  CustomerListResponse,
  SegmentAnalytics,
} from '@/services/customerService';
import { Colors } from '@/constants/Colors';
import { format } from 'date-fns';

interface FilterState {
  searchQuery: string;
  selectedSegments: CustomerSegment[];
  sortBy: 'name' | 'createdAt' | 'totalSpent' | 'lastOrderDate' | 'visitCount';
  sortOrder: 'asc' | 'desc';
}

const SEGMENTS: CustomerSegment[] = ['new', 'active', 'inactive', 'at_risk', 'churned', 'vip', 'occasional'];

export default function CustomersPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { activeStore } = useStore();
  const queryClient = useQueryClient();

  const merchantId = activeStore?._id || user?.merchantId || '';

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    selectedSegments: [],
    sortBy: 'lastOrderDate',
    sortOrder: 'desc',
  });

  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch customers
  const {
    data: customersData,
    isLoading,
    error,
    refetch,
  } = useQuery<CustomerListResponse, Error>({
    queryKey: ['customers', merchantId, filters],
    queryFn: async () => {
      if (!merchantId) {
        return {
          customers: [],
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
          hasMore: false,
        };
      }
      return customerService.getCustomers({
        merchantId,
        query: filters.searchQuery || undefined,
        segment: filters.selectedSegments.length > 0 ? filters.selectedSegments : undefined,
        sortBy: filters.sortBy,
        order: filters.sortOrder,
        limit: 50,
      });
    },
    enabled: !!merchantId,
  });

  // Fetch segment analytics
  const { data: segmentAnalytics } = useQuery<SegmentAnalytics[], Error>({
    queryKey: ['customer-segments', merchantId],
    queryFn: () => customerService.getSegmentAnalytics(merchantId),
    enabled: !!merchantId,
  });

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Toggle segment filter
  const toggleSegment = useCallback((segment: CustomerSegment) => {
    setFilters((prev) => ({
      ...prev,
      selectedSegments: prev.selectedSegments.includes(segment)
        ? prev.selectedSegments.filter((s) => s !== segment)
        : [...prev.selectedSegments, segment],
    }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      searchQuery: '',
      selectedSegments: [],
      sortBy: 'lastOrderDate',
      sortOrder: 'desc',
    });
  }, []);

  // Calculate CLV for a customer
  const calculateCLV = useCallback((customer: Customer): CustomerLifetimeValue => {
    return service.calculateCLV(customer);
  }, []);

  // Format currency
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, []);

  // Get segment badge style
  const getSegmentBadgeStyle = useCallback((segment: CustomerSegment) => {
    const config = SEGMENT_CONFIG[segment];
    return {
      backgroundColor: config.bgColor,
      borderColor: config.color,
    };
  }, []);

  // Render customer item
  const renderCustomerItem = useCallback(
    ({ item }: { item: Customer }) => {
      const clv = calculateCLV(item);
      const segment = item.segment || 'new';
      const segmentConfig = SEGMENT_CONFIG[segment];
      const tierConfig = LTV_TIER_CONFIG[clv.tier];

      return (
        <TouchableOpacity
          style={styles.customerCard}
          onPress={() => router.push(`/customers/${item._id || item.id}`)}
          activeOpacity={0.7}
        >
          {/* Customer Header */}
          <View style={styles.customerHeader}>
            <View style={styles.customerAvatar}>
              <Text style={styles.avatarText}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.customerPhone}>
                {item.phone || item.phoneNumber || 'No phone'}
              </Text>
            </View>
            <View style={[styles.segmentBadge, getSegmentBadgeStyle(segment)]}>
              <Text style={[styles.segmentText, { color: segmentConfig.color }]}>
                {segmentConfig.label}
              </Text>
            </View>
          </View>

          {/* Customer Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Spent</Text>
              <Text style={styles.statValue}>
                {formatCurrency(item.totalSpent || clv.currentValue)}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Orders</Text>
              <Text style={styles.statValue}>{item.totalOrders || 0}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>LTV Tier</Text>
              <View style={[styles.tierBadge, { backgroundColor: tierConfig.bgColor }]}>
                <Text style={[styles.tierText, { color: tierConfig.color }]}>
                  {tierConfig.label}
                </Text>
              </View>
            </View>
          </View>

          {/* Last Order Date */}
          {(item.lastOrderDate || item.lastOrderAt) && (
            <View style={styles.lastOrderRow}>
              <Ionicons name="time-outline" size={14} color={Colors.gray[500]} />
              <Text style={styles.lastOrderText}>
                Last order: {format(new Date(item.lastOrderDate || item.lastOrderAt!), 'MMM d, yyyy')}
              </Text>
            </View>
          )}

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {item.tags.slice(0, 3).map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
              {item.tags.length > 3 && (
                <Text style={styles.moreTagsText}>+{item.tags.length - 3}</Text>
              )}
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [router, calculateCLV, formatCurrency, getSegmentBadgeStyle]
  );

  // Segment summary component
  const SegmentSummary = useMemo(() => {
    if (!segmentAnalytics || segmentAnalytics.length === 0) return null;

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.segmentScroll}
        contentContainerStyle={styles.segmentScrollContent}
      >
        {SEGMENTS.map((segment) => {
          const analytics = segmentAnalytics.find((a) => a.segment === segment);
          const count = analytics?.count || 0;
          const config = SEGMENT_CONFIG[segment];
          const isSelected = filters.selectedSegments.includes(segment);

          return (
            <TouchableOpacity
              key={segment}
              style={[
                styles.segmentCard,
                { borderColor: config.color },
                isSelected && { backgroundColor: config.bgColor },
              ]}
              onPress={() => toggleSegment(segment)}
              activeOpacity={0.7}
            >
              <View style={[styles.segmentIcon, { backgroundColor: config.bgColor }]}>
                <Text style={[styles.segmentCount, { color: config.color }]}>{count}</Text>
              </View>
              <Text style={styles.segmentName}>{config.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  }, [segmentAnalytics, filters.selectedSegments, toggleSegment]);

  // Empty state
  if (!merchantId) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="people-outline" size={64} color={Colors.gray[300]} />
        <Text style={styles.emptyTitle}>No Store Selected</Text>
        <Text style={styles.emptySubtitle}>
          Please select a store to view customers
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={Colors.error[500]} />
        <Text style={styles.emptyTitle}>Error Loading Customers</Text>
        <Text style={styles.emptySubtitle}>{error.message}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Customers</Text>
        <Text style={styles.subtitle}>
          {customersData?.total || 0} total customers
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.gray[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, phone, or email..."
            placeholderTextColor={Colors.gray[400]}
            value={filters.searchQuery}
            onChangeText={(text) =>
              setFilters((prev) => ({ ...prev, searchQuery: text }))
            }
            autoCapitalize="none"
            autoCorrect={false}
          />
          {filters.searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() =>
                setFilters((prev) => ({ ...prev, searchQuery: '' }))
              }
            >
              <Ionicons name="close-circle" size={20} color={Colors.gray[400]} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filters.selectedSegments.length > 0 && styles.filterButtonActive,
          ]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons
            name="filter"
            size={20}
            color={filters.selectedSegments.length > 0 ? Colors.primary[500] : Colors.gray[600]}
          />
          {filters.selectedSegments.length > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {filters.selectedSegments.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Segment Summary */}
      {SegmentSummary}

      {/* Active Filters */}
      {filters.selectedSegments.length > 0 && (
        <View style={styles.activeFiltersContainer}>
          <Text style={styles.activeFiltersLabel}>Active Filters:</Text>
          <View style={styles.activeFiltersList}>
            {filters.selectedSegments.map((segment) => (
              <TouchableOpacity
                key={segment}
                style={[
                  styles.activeFilterChip,
                  { backgroundColor: SEGMENT_CONFIG[segment].bgColor },
                ]}
                onPress={() => toggleSegment(segment)}
              >
                <Text
                  style={[
                    styles.activeFilterText,
                    { color: SEGMENT_CONFIG[segment].color },
                  ]}
                >
                  {SEGMENT_CONFIG[segment].label}
                </Text>
                <Ionicons name="close" size={14} color={SEGMENT_CONFIG[segment].color} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.clearFiltersText}>Clear all</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        {(['lastOrderDate', 'name', 'totalSpent', 'createdAt'] as const).map((sort) => (
          <TouchableOpacity
            key={sort}
            style={[
              styles.sortOption,
              filters.sortBy === sort && styles.sortOptionActive,
            ]}
            onPress={() =>
              setFilters((prev) => ({
                ...prev,
                sortBy: sort,
                sortOrder:
                  prev.sortBy === sort && prev.sortOrder === 'asc' ? 'desc' : 'asc',
              }))
            }
          >
            <Text
              style={[
                styles.sortOptionText,
                filters.sortBy === sort && styles.sortOptionTextActive,
              ]}
            >
              {sort === 'lastOrderDate'
                ? 'Last Order'
                : sort === 'totalSpent'
                ? 'Spent'
                : sort === 'createdAt'
                ? 'Added'
                : 'Name'}
            </Text>
            {filters.sortBy === sort && (
              <Ionicons
                name={filters.sortOrder === 'asc' ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={Colors.primary[500]}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Customer List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={styles.loadingText}>Loading customers...</Text>
        </View>
      ) : customersData?.customers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color={Colors.gray[300]} />
          <Text style={styles.emptyTitle}>No Customers Found</Text>
          <Text style={styles.emptySubtitle}>
            {filters.searchQuery || filters.selectedSegments.length > 0
              ? 'Try adjusting your search or filters'
              : 'Start making sales to see customers here'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={customersData?.customers || []}
          renderItem={renderCustomerItem}
          keyExtractor={(item) => item._id || item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary[500]}
            />
          }
          ListFooterComponent={
            customersData?.hasMore ? (
              <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={() => refetch()}
              >
                <Text style={styles.loadMoreText}>Load More</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}

      {/* Add Customer FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 80 }]}
        onPress={() => router.push('/customers/new')}
        activeOpacity={0.8}
      >
        <Ionicons name="person-add" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.gray[500],
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: Colors.text.primary,
  },
  filterButton: {
    width: 44,
    height: 44,
    backgroundColor: Colors.white,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  filterButtonActive: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  segmentScroll: {
    maxHeight: 80,
  },
  segmentScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  segmentCard: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 80,
  },
  segmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  segmentCount: {
    fontSize: 16,
    fontWeight: '700',
  },
  segmentName: {
    fontSize: 11,
    color: Colors.gray[600],
    fontWeight: '500',
  },
  activeFiltersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  activeFiltersLabel: {
    fontSize: 12,
    color: Colors.gray[500],
    marginBottom: 4,
  },
  activeFiltersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  activeFilterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  clearFiltersText: {
    fontSize: 12,
    color: Colors.primary[500],
    fontWeight: '600',
    marginLeft: 4,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 4,
  },
  sortLabel: {
    fontSize: 12,
    color: Colors.gray[500],
    marginRight: 4,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 2,
  },
  sortOptionActive: {
    backgroundColor: Colors.primary[50],
  },
  sortOptionText: {
    fontSize: 12,
    color: Colors.gray[600],
  },
  sortOptionTextActive: {
    color: Colors.primary[500],
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  customerCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  customerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  customerPhone: {
    fontSize: 14,
    color: Colors.gray[500],
    marginTop: 2,
  },
  segmentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border.default,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border.default,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.gray[500],
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tierText: {
    fontSize: 11,
    fontWeight: '600',
  },
  lastOrderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 4,
  },
  lastOrderText: {
    fontSize: 12,
    color: Colors.gray[500],
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 6,
  },
  tag: {
    backgroundColor: Colors.gray[100],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    color: Colors.gray[600],
  },
  moreTagsText: {
    fontSize: 11,
    color: Colors.gray[500],
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.gray[500],
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.gray[500],
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary[500],
    borderRadius: 12,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  loadMoreButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadMoreText: {
    color: Colors.primary[500],
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: Colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
