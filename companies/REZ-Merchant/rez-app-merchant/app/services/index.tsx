import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { showAlert, showConfirm } from '@/utils/alert';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  serviceManagementService,
  MerchantService,
  ServiceCategory,
  Pagination,
} from '@/services/api/services';
import { Colors } from '@/constants/Colors';
import { BottomNav, BOTTOM_NAV_HEIGHT_CONSTANT } from '@/components/navigation/BottomNav';
import { logger } from '@/utils/logger';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Status filter options
const STATUS_FILTERS: { label: string; value: 'all' | 'active' | 'inactive' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

// Category icon mapping
const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  flights: 'airplane-outline',
  hotels: 'bed-outline',
  trains: 'train-outline',
  bus: 'bus-outline',
  cab: 'car-outline',
  packages: 'gift-outline',
};

export default function ServicesListScreen() {
  const router = useRouter();
  const [services, setServices] = useState<MerchantService[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const cats = await serviceManagementService.getCategories();
      setCategories(cats);
    } catch (error) {
      logger.error('Error fetching categories:', error.message);
    }
  }, []);

  const fetchServices = useCallback(
    async (page = 1) => {
      try {
        const params: unknown = { page, limit: 20 };
        if (statusFilter !== 'all') params.status = statusFilter;
        if (categoryFilter !== 'all') params.category = categoryFilter;

        const response = await serviceManagementService.getServices(params);
        if (page === 1) {
          setServices(response.services);
        } else {
          setServices((prev) => [...prev, ...response.services]);
        }
        setPagination(response.pagination);
      } catch (error) {
        showAlert('Error', error.message || 'Failed to fetch services');
      } finally {
        setIsLoading(false);
      }
    },
    [statusFilter, categoryFilter]
  );

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    setIsLoading(true);
    fetchServices(1);
  }, [fetchServices]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchServices(1);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (pagination.page < pagination.pages && !isLoading) {
      fetchServices(pagination.page + 1);
    }
  };

  const handleToggleActive = async (service: MerchantService) => {
    setTogglingId(service._id);
    try {
      await serviceManagementService.updateService(service._id, {
        isActive: !service.isActive,
      });
      setServices((prev) =>
        prev.map((s) => (s._id === service._id ? { ...s, isActive: !s.isActive } : s))
      );
    } catch (error) {
      showAlert('Error', error.message || 'Failed to update service');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = (service: MerchantService) => {
    showConfirm(
      'Delete Service',
      `Are you sure you want to delete "${service.name}"? This action cannot be undone.`,
      async () => {
        try {
          await serviceManagementService.deleteService(service._id);
          setServices((prev) => prev.filter((s) => s._id !== service._id));
          showAlert('Success', 'Service deleted successfully');
        } catch (error) {
          showAlert('Error', error.message || 'Failed to delete service');
        }
      }
    );
  };

  const getCategoryName = (service: MerchantService): string => {
    if (typeof service.serviceCategory === 'object' && service.serviceCategory?.name) {
      return service.serviceCategory.name;
    }
    return 'Uncategorized';
  };

  const getCategorySlug = (service: MerchantService): string => {
    if (typeof service.serviceCategory === 'object' && service.serviceCategory?.slug) {
      return service.serviceCategory.slug;
    }
    return '';
  };

  const getStoreName = (service: MerchantService): string => {
    if (typeof service.store === 'object' && service.store?.name) {
      return service.store.name;
    }
    return 'Unknown Store';
  };

  const renderHeader = () => (
    <View>
      {/* Gradient Header */}
      <LinearGradient
        colors={['#0EA5E9', '#0284C7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>My Services</Text>
              <Text style={styles.headerSubtitle}>
                {pagination.total} service{pagination.total !== 1 ? 's' : ''}
              </Text>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={() => router.push('/services/add')}>
              <Ionicons name="add" size={24} color="#0EA5E9" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        <TouchableOpacity
          style={[styles.filterChip, categoryFilter === 'all' && styles.filterChipActive]}
          onPress={() => setCategoryFilter('all')}
        >
          <Text
            style={[styles.filterChipText, categoryFilter === 'all' && styles.filterChipTextActive]}
          >
            All Categories
          </Text>
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat._id}
            style={[styles.filterChip, categoryFilter === cat.slug && styles.filterChipActive]}
            onPress={() => setCategoryFilter(cat.slug)}
          >
            <Ionicons
              name={CATEGORY_ICONS[cat.slug] || 'grid-outline'}
              size={14}
              color={categoryFilter === cat.slug ? '#fff' : '#6B7280'}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.filterChipText,
                categoryFilter === cat.slug && styles.filterChipTextActive,
              ]}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Status Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statusFilterRow}
      >
        {STATUS_FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.value}
            style={[styles.statusChip, statusFilter === filter.value && styles.statusChipActive]}
            onPress={() => setStatusFilter(filter.value)}
          >
            <Text
              style={[
                styles.statusChipText,
                statusFilter === filter.value && styles.statusChipTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderServiceCard = ({ item, index }: { item: MerchantService; index: number }) => {
    const catSlug = getCategorySlug(item);
    const catIcon = CATEGORY_ICONS[catSlug] || 'grid-outline';
    const hasDiscount = item.pricing?.discount > 0;

    return (
      <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
        <TouchableOpacity
          style={styles.serviceCard}
          onPress={() => router.push(`/services/add?id=${item._id}`)}
          activeOpacity={0.7}
        >
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.categoryIcon, { backgroundColor: '#0EA5E915' }]}>
                <Ionicons name={catIcon} size={18} color="#0EA5E9" />
              </View>
              <View style={styles.cardTitleWrap}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.cardCategory} numberOfLines={1}>
                  {getCategoryName(item)} · {getStoreName(item)}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: item.isActive
                    ? Colors.light.successLight
                    : Colors.light.backgroundTertiary,
                },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: item.isActive ? Colors.light.success : Colors.light.textSecondary },
                ]}
              >
                {item.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>

          {/* Pricing Row */}
          <View style={styles.pricingRow}>
            <View style={styles.priceWrap}>
              <Text style={styles.sellingPrice}>
                {item.pricing?.currency === 'INR' ? '₹' : '$'}
                {item.pricing?.selling?.toLocaleString() || '0'}
              </Text>
              {hasDiscount && (
                <Text style={styles.originalPrice}>
                  {item.pricing?.currency === 'INR' ? '₹' : '$'}
                  {item.pricing?.original?.toLocaleString()}
                </Text>
              )}
              {hasDiscount && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>-{item.pricing?.discount}%</Text>
                </View>
              )}
            </View>
            {item.cashback?.percentage > 0 && (
              <View style={styles.cashbackBadge}>
                <Ionicons name="cash-outline" size={12} color="#F59E0B" />
                <Text style={styles.cashbackText}>{item.cashback.percentage}% cashback</Text>
              </View>
            )}
          </View>

          {/* Info Row */}
          <View style={styles.infoRow}>
            {item.serviceDetails?.duration && (
              <View style={styles.infoItem}>
                <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                <Text style={styles.infoText}>{item.serviceDetails.duration} min</Text>
              </View>
            )}
            <View style={styles.infoItem}>
              <Ionicons name="location-outline" size={14} color="#9CA3AF" />
              <Text style={styles.infoText}>
                {item.serviceDetails?.serviceType === 'home'
                  ? 'Home Visit'
                  : item.serviceDetails?.serviceType === 'online'
                    ? 'Online'
                    : 'In-Store'}
              </Text>
            </View>
            {item.isFeatured && (
              <View style={styles.infoItem}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={[styles.infoText, { color: '#F59E0B' }]}>Featured</Text>
              </View>
            )}
          </View>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push(`/services/add?id=${item._id}`)}
            >
              <Ionicons name="create-outline" size={16} color="#3B82F6" />
              <Text style={[styles.actionText, { color: '#3B82F6' }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleToggleActive(item)}
              disabled={togglingId === item._id}
            >
              {togglingId === item._id ? (
                <ActivityIndicator size="small" color="#6B7280" />
              ) : (
                <>
                  <Ionicons
                    name={item.isActive ? 'pause-circle-outline' : 'play-circle-outline'}
                    size={16}
                    color={item.isActive ? '#F59E0B' : '#10B981'}
                  />
                  <Text
                    style={[styles.actionText, { color: item.isActive ? '#F59E0B' : '#10B981' }]}
                  >
                    {item.isActive ? 'Deactivate' : 'Activate'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(item)}>
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
              <Text style={[styles.actionText, { color: '#EF4444' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#0EA5E9" />
          <Text style={styles.emptyStateText}>Loading services...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyStateIcon}>
          <Ionicons name="airplane-outline" size={48} color="#CBD5E1" />
        </View>
        <Text style={styles.emptyStateTitle}>No Services Yet</Text>
        <Text style={styles.emptyStateText}>
          Create your first travel or service listing to start receiving bookings.
        </Text>
        <TouchableOpacity style={styles.emptyStateCTA} onPress={() => router.push('/services/add')}>
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.emptyStateCTAText}>Create Your First Service</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={services}
        keyExtractor={(item) => item._id}
        renderItem={renderServiceCard}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.listContent,
          services.length === 0 && styles.listContentEmpty,
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
      />

      {/* Bookings FAB */}
      <TouchableOpacity
        style={styles.bookingsFab}
        onPress={() => router.push('/services/bookings')}
      >
        <Ionicons name="calendar-outline" size={20} color="#fff" />
        <Text style={styles.bookingsFabText}>Bookings</Text>
      </TouchableOpacity>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  listContent: {
    paddingBottom: BOTTOM_NAV_HEIGHT_CONSTANT + 80,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  // Header
  header: {
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Filters
  filterRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  filterChipActive: {
    backgroundColor: '#0EA5E9',
    borderColor: '#0EA5E9',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  statusFilterRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  statusChipActive: {
    backgroundColor: '#1E293B',
    borderColor: '#1E293B',
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  statusChipTextActive: {
    color: '#fff',
  },
  // Service Card
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitleWrap: {
    flex: 1,
    marginLeft: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  cardCategory: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  // Pricing
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  priceWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sellingPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  originalPrice: {
    fontSize: 13,
    color: Colors.light.textMuted,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: Colors.light.errorLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.error,
  },
  cashbackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  cashbackText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.warning,
  },
  // Info
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.light.backgroundSecondary,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  // Actions
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyStateCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0EA5E9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyStateCTAText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  // Bookings FAB
  bookingsFab: {
    position: 'absolute',
    right: 16,
    bottom: BOTTOM_NAV_HEIGHT_CONSTANT + 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  bookingsFabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
