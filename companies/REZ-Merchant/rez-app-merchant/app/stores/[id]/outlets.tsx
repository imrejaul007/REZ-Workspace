import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Linking,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { outletsService, MerchantOutlet } from '@/services/api/outlets';
import { useStore } from '@/contexts/StoreContext';
import ConfirmModal from '@/components/common/ConfirmModal';
import { logger } from '@/utils/logger';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Safe back navigation - goes to store details if no history
const useSafeBack = (storeId: string) => {
  const router = useRouter();

  return () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(`/stores/${storeId}/details`);
    }
  };
};

type FilterType = 'all' | 'active' | 'inactive';

export default function StoreOutletsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const storeId = params.id as string;
  const { stores } = useStore();
  const store = stores.find((s) => s._id === storeId);
  const handleBack = useSafeBack(storeId);

  const [outlets, setOutlets] = useState<MerchantOutlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type?: 'default' | 'danger' | 'warning';
    onConfirm: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'default',
    onConfirm: () => {},
  });
  const [alertModal, setAlertModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type?: 'default' | 'danger' | 'warning';
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'default',
  });

  // Reload outlets when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadOutlets();
    }, [storeId])
  );

  const loadOutlets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await outletsService.getOutlets({
        storeId: storeId,
      });
      if (response.success && response.data) {
        setOutlets(response.data.outlets || []);
      } else {
        setError(response.message || 'Failed to load outlets');
      }
    } catch (err) {
      if (__DEV__) console.error('Error loading outlets:', err);
      setError(err.message || 'Failed to load outlets');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOutlets();
    setRefreshing(false);
  };

  const handleAddOutlet = () => {
    router.push({
      pathname: '/stores/[id]/outlets/add',
      params: { id: storeId },
    });
  };

  const handleEditOutlet = (outletId: string) => {
    router.push({
      pathname: '/stores/[id]/outlets/[outletId]',
      params: { id: storeId, outletId },
    });
  };

  const handleDeleteOutlet = async (outletId: string) => {
    setConfirmModal({
      visible: true,
      title: 'Delete Outlet',
      message: 'Are you sure you want to delete this outlet? This action cannot be undone.',
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, visible: false });
        try {
          const response = await outletsService.deleteOutlet(outletId);
          if (response.success) {
            setAlertModal({
              visible: true,
              title: 'Success',
              message: 'Outlet deleted successfully',
              type: 'default',
            });
            loadOutlets();
          } else {
            setAlertModal({
              visible: true,
              title: 'Error',
              message: response.message || 'Failed to delete outlet',
              type: 'danger',
            });
          }
        } catch (err) {
          setAlertModal({
            visible: true,
            title: 'Error',
            message: err.message || 'Failed to delete outlet',
            type: 'danger',
          });
        }
      },
    });
  };

  const handleToggleActive = async (outlet: MerchantOutlet) => {
    try {
      const response = await outletsService.toggleOutletActive(outlet._id);
      if (response.success) {
        loadOutlets();
      } else {
        setAlertModal({
          visible: true,
          title: 'Error',
          message: response.message || 'Failed to update outlet',
          type: 'danger',
        });
      }
    } catch (err) {
      setAlertModal({
        visible: true,
        title: 'Error',
        message: err.message || 'Failed to update outlet',
        type: 'danger',
      });
    }
  };

  const handleCallOutlet = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleOpenMap = (outlet: MerchantOutlet) => {
    const [lng, lat] = outlet.location.coordinates;
    const url = Platform.select({
      ios: `maps:0,0?q=${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${encodeURIComponent(outlet.name)})`,
    });
    if (url) {
      Linking.openURL(url);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${suffix}`;
  };

  // Filter outlets based on selected filter
  const filteredOutlets = outlets.filter((outlet) => {
    if (filter === 'all') return true;
    if (filter === 'active') return outlet.isActive;
    if (filter === 'inactive') return !outlet.isActive;
    return true;
  });

  const getFilterCount = (filterType: FilterType) => {
    if (filterType === 'all') return outlets.length;
    if (filterType === 'active') return outlets.filter((o) => o.isActive).length;
    if (filterType === 'inactive') return outlets.filter((o) => !o.isActive).length;
    return 0;
  };

  // Render Stats Card
  const renderStatsCard = () => {
    const totalOutlets = outlets.length;
    const activeOutlets = outlets.filter((o) => o.isActive).length;
    const inactiveOutlets = outlets.filter((o) => !o.isActive).length;

    if (totalOutlets === 0) return null;

    return (
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Outlets Overview</Text>
        <View style={styles.statsGrid}>
          {/* Total Outlets */}
          <LinearGradient
            colors={['#10B981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <View style={styles.statIconContainer}>
              <Ionicons name="location" size={20} color="rgba(255,255,255,0.9)" />
            </View>
            <Text style={styles.statValue}>{totalOutlets}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </LinearGradient>

          {/* Active Outlets */}
          <LinearGradient
            colors={['#3B82F6', '#1D4ED8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <View style={styles.statIconContainer}>
              <Ionicons name="checkmark-circle" size={20} color="rgba(255,255,255,0.9)" />
            </View>
            <Text style={styles.statValue}>{activeOutlets}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </LinearGradient>

          {/* Inactive Outlets */}
          <LinearGradient
            colors={['#6B7280', '#4B5563']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <View style={styles.statIconContainer}>
              <Ionicons name="pause-circle" size={20} color="rgba(255,255,255,0.9)" />
            </View>
            <Text style={styles.statValue}>{inactiveOutlets}</Text>
            <Text style={styles.statLabel}>Inactive</Text>
          </LinearGradient>
        </View>
      </View>
    );
  };

  // Render Filter Tabs
  const renderFilterTabs = () => (
    <View style={styles.filterSection}>
      {(['all', 'active', 'inactive'] as FilterType[]).map((filterOption) => {
        const isActive = filter === filterOption;
        const count = getFilterCount(filterOption);
        return (
          <TouchableOpacity
            key={filterOption}
            style={[styles.filterTab, isActive && styles.filterTabActive]}
            onPress={() => setFilter(filterOption)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </Text>
            <View style={[styles.filterCount, isActive && styles.filterCountActive]}>
              <Text style={[styles.filterCountText, isActive && styles.filterCountTextActive]}>
                {count}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // Render Outlet Card
  const renderOutletCard = (outlet: MerchantOutlet) => {
    const statusColor = outlet.isActive ? '#10B981' : '#6B7280';
    const statusBg = outlet.isActive ? '#ECFDF5' : '#F3F4F6';
    const statusText = outlet.isActive ? 'Active' : 'Inactive';
    const openingHours = outlet.openingHoursSimple || { open: '09:00', close: '21:00' };

    return (
      <View key={outlet._id} style={styles.outletCard}>
        {/* Card Header */}
        <LinearGradient
          colors={['#10B981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.outletHeader}
        >
          <View style={styles.outletHeaderLeft}>
            <View style={styles.outletIconBg}>
              <Ionicons name="storefront" size={22} color="#10B981" />
            </View>
          </View>
          <View style={styles.outletHeaderCenter}>
            <Text style={styles.outletName} numberOfLines={1}>
              {outlet.name}
            </Text>
            <View style={styles.hoursContainer}>
              <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.9)" />
              <Text style={styles.hoursText}>
                {formatTime(openingHours.open)} - {formatTime(openingHours.close)}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => handleToggleActive(outlet)}
            style={[
              styles.statusToggle,
              { backgroundColor: outlet.isActive ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' },
            ]}
          >
            <View
              style={[
                styles.statusToggleDot,
                { backgroundColor: outlet.isActive ? '#FFFFFF' : '#9CA3AF' },
              ]}
            />
          </TouchableOpacity>
        </LinearGradient>

        {/* Card Body */}
        <View style={styles.outletBody}>
          {/* Address */}
          <View style={styles.addressRow}>
            <View style={styles.addressIconBg}>
              <Ionicons name="location-outline" size={16} color="#10B981" />
            </View>
            <Text style={styles.addressText} numberOfLines={2}>
              {outlet.address}
            </Text>
          </View>

          {/* Contact Info */}
          <View style={styles.contactRow}>
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => handleCallOutlet(outlet.phone)}
            >
              <View style={styles.contactIconBg}>
                <Ionicons name="call-outline" size={14} color="#3B82F6" />
              </View>
              <Text style={styles.contactText}>{outlet.phone}</Text>
            </TouchableOpacity>
            {outlet.email && (
              <View style={styles.contactItem}>
                <View style={styles.contactIconBg}>
                  <Ionicons name="mail-outline" size={14} color="#8B5CF6" />
                </View>
                <Text style={styles.contactText} numberOfLines={1}>
                  {outlet.email}
                </Text>
              </View>
            )}
          </View>

          {/* Actions Footer */}
          <View style={styles.outletFooter}>
            <TouchableOpacity style={styles.mapButton} onPress={() => handleOpenMap(outlet)}>
              <Ionicons name="map-outline" size={16} color="#10B981" />
              <Text style={styles.mapButtonText}>View on Map</Text>
            </TouchableOpacity>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                onPress={() => handleEditOutlet(outlet._id)}
                style={styles.actionBtn}
              >
                <Ionicons name="create-outline" size={18} color="#10B981" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteOutlet(outlet._id)}
                style={[styles.actionBtn, styles.deleteBtn]}
              >
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Status Badge */}
          <View style={styles.statusBadgeContainer}>
            <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#10B981', '#059669']} style={styles.headerGradient}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.headerBtn}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Store Outlets</Text>
            <View style={styles.headerBtn} />
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingSpinner}>
            <ActivityIndicator size="large" color="#10B981" />
          </View>
          <Text style={styles.loadingText}>Loading outlets...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with Gradient */}
      <LinearGradient colors={['#10B981', '#059669']} style={styles.headerGradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Store Outlets</Text>
            {store && <Text style={styles.headerSubtitle}>{store.name}</Text>}
          </View>
          <TouchableOpacity onPress={handleAddOutlet} style={styles.headerBtn}>
            <Ionicons name="add-circle" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#10B981']}
            tintColor="#10B981"
          />
        }
      >
        {/* Stats Section */}
        {renderStatsCard()}

        {/* Filter Tabs */}
        {outlets.length > 0 && renderFilterTabs()}

        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <View style={styles.errorIconBg}>
              <Ionicons name="alert-circle" size={32} color="#EF4444" />
            </View>
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadOutlets} style={styles.retryButton}>
              <Ionicons name="refresh" size={18} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State */}
        {!error && filteredOutlets.length === 0 && (
          <View style={styles.emptyContainer}>
            <LinearGradient colors={['#D1FAE5', '#A7F3D0']} style={styles.emptyIconBg}>
              <Ionicons name="location-outline" size={48} color="#10B981" />
            </LinearGradient>
            <Text style={styles.emptyTitle}>
              {filter === 'all' ? 'No Outlets Yet' : `No ${filter} Outlets`}
            </Text>
            <Text style={styles.emptyText}>
              {filter === 'all'
                ? 'Add your first outlet location to help customers find your store!'
                : `No ${filter} outlets found for this store.`}
            </Text>
            {filter === 'all' && (
              <TouchableOpacity style={styles.createButton} onPress={handleAddOutlet}>
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.createButtonGradient}
                >
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                  <Text style={styles.createButtonText}>Add Outlet</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Outlet Cards */}
        {!error && filteredOutlets.map(renderOutletCard)}

        {/* Bottom Spacing */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB */}
      {filteredOutlets.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={handleAddOutlet} activeOpacity={0.9}>
          <LinearGradient colors={['#10B981', '#059669']} style={styles.fabGradient}>
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        visible={confirmModal.visible}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, visible: false })}
      />

      {/* Alert Modal */}
      <ConfirmModal
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        confirmText="OK"
        onConfirm={() => setAlertModal({ ...alertModal, visible: false })}
        onCancel={() => setAlertModal({ ...alertModal, visible: false })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerGradient: {
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingSpinner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Stats Section
  statsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    minHeight: 95,
    justifyContent: 'center',
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Filter Section
  filterSection: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: '#10B981',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  filterCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  filterCountActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  filterCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  filterCountTextActive: {
    color: '#FFFFFF',
  },

  // Error State
  errorContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginTop: 20,
  },
  errorIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  createButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Outlet Card
  outletCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  outletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  outletHeaderLeft: {
    marginRight: 12,
  },
  outletIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outletHeaderCenter: {
    flex: 1,
  },
  outletName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  hoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hoursText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  statusToggle: {
    width: 36,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  statusToggleDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignSelf: 'flex-end',
  },
  outletBody: {
    padding: 16,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  addressIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactIconBg: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  outletFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  mapButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    backgroundColor: '#FEF2F2',
  },
  statusBadgeContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    borderRadius: 30,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
