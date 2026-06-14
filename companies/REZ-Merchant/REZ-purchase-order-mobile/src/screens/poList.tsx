import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePOStore } from '../contexts/store';
import { purchaseOrderApi } from '../services/api';
import { POCard } from '../components/poCard';
import {
  SearchBar,
  FilterChip,
  FAB,
  EmptyState,
  LoadingSpinner,
  NetworkBanner,
  ConfirmModal,
} from '../components/common';
import { RootStackParamList, MainTabParamList, PurchaseOrder, POStatus, POListFilters } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<MainTabParamList, 'POList'>;

const STATUS_FILTERS: { status: POStatus; label: string; icon: string }[] = [
  { status: 'pending_approval', label: 'Pending', icon: 'clock-outline' },
  { status: 'approved', label: 'Approved', icon: 'check-circle-outline' },
  { status: 'in_transit', label: 'In Transit', icon: 'truck-delivery-outline' },
  { status: 'delivered', label: 'Delivered', icon: 'package-variant-closed-check' },
];

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date Created' },
  { value: 'updatedAt', label: 'Last Modified' },
  { value: 'grandTotal', label: 'Amount' },
  { value: 'poNumber', label: 'PO Number' },
];

export const POListScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();

  const {
    purchaseOrders,
    fetchPurchaseOrders,
    isLoading,
    isRefreshing,
    poListPage,
    poListTotalPages,
    poListFilters,
    setPOListFilters,
    updatePurchaseOrder,
    isOnline,
    pendingSyncCount,
  } = usePOStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<POStatus[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [approveModal, setApproveModal] = useState<{ visible: boolean; po: PurchaseOrder | null }>({
    visible: false,
    po: null,
  });
  const [rejectModal, setRejectModal] = useState<{ visible: boolean; po: PurchaseOrder | null }>({
    visible: false,
    po: null,
  });
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    // Apply initial filters from route params
    if (route.params?.filters) {
      setPOListFilters(route.params.filters);
      if (route.params.filters.status) {
        setSelectedStatuses(route.params.filters.status);
      }
    }
    loadPOs();
  }, []);

  useEffect(() => {
    loadPOs();
  }, [selectedStatuses, sortBy, sortOrder]);

  const loadPOs = useCallback(async () => {
    const filters: POListFilters = {
      ...poListFilters,
      status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
      search: searchQuery || undefined,
    };
    await fetchPurchaseOrders(filters, 1, false);
  }, [selectedStatuses, searchQuery, sortBy, sortOrder, fetchPurchaseOrders, poListFilters]);

  const loadMore = useCallback(() => {
    if (poListPage < poListTotalPages && !isLoading) {
      const filters: POListFilters = {
        ...poListFilters,
        status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
        search: searchQuery || undefined,
      };
      fetchPurchaseOrders(filters, poListPage + 1, true);
    }
  }, [poListPage, poListTotalPages, isLoading, selectedStatuses, searchQuery, poListFilters, fetchPurchaseOrders]);

  const handleStatusToggle = useCallback((status: POStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  }, []);

  const handlePOPress = useCallback((po: PurchaseOrder) => {
    navigation.navigate('PODetail', { poId: po.id });
  }, [navigation]);

  const handleApprove = useCallback(async (po: PurchaseOrder) => {
    setApproveModal({ visible: true, po });
  }, []);

  const confirmApprove = useCallback(async () => {
    if (!approveModal.po) return;

    const response = await purchaseOrderApi.approvePurchaseOrder({
      poId: approveModal.po.id,
      action: 'approve',
    });

    if (response.success && response.data) {
      updatePurchaseOrder(approveModal.po.id, response.data);
    }

    setApproveModal({ visible: false, po: null });
  }, [approveModal.po, updatePurchaseOrder]);

  const handleReject = useCallback((po: PurchaseOrder) => {
    setRejectModal({ visible: true, po });
    setRejectionReason('');
  }, []);

  const confirmReject = useCallback(async () => {
    if (!rejectModal.po || !rejectionReason.trim()) return;

    const response = await purchaseOrderApi.approvePurchaseOrder({
      poId: rejectModal.po.id,
      action: 'reject',
      reason: rejectionReason,
    });

    if (response.success && response.data) {
      updatePurchaseOrder(rejectModal.po.id, response.data);
    }

    setRejectModal({ visible: false, po: null });
    setRejectionReason('');
  }, [rejectModal.po, rejectionReason, updatePurchaseOrder]);

  const toggleSortOrder = useCallback(() => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedStatuses([]);
    setSearchQuery('');
    setSortBy('createdAt');
    setSortOrder('desc');
  }, []);

  const filteredPOs = useMemo(() => {
    let result = [...purchaseOrders];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (po) =>
          po.poNumber.toLowerCase().includes(query) ||
          po.supplier?.name.toLowerCase().includes(query) ||
          po.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'grandTotal':
          comparison = a.grandTotal - b.grandTotal;
          break;
        case 'poNumber':
          comparison = a.poNumber.localeCompare(b.poNumber);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [purchaseOrders, searchQuery, sortBy, sortOrder]);

  const renderPOItem = useCallback(
    ({ item }: { item: PurchaseOrder }) => (
      <POCard
        purchaseOrder={item}
        onPress={handlePOPress}
        onApprove={item.status === 'pending_approval' ? handleApprove : undefined}
        onReject={item.status === 'pending_approval' ? handleReject : undefined}
      />
    ),
    [handlePOPress, handleApprove, handleReject]
  );

  const renderHeader = useCallback(
    () => (
      <View>
        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search PO number, supplier..."
          onClear={() => setSearchQuery('')}
        />

        {/* Status Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersRow}
          contentContainerStyle={styles.filtersContent}
        >
          {STATUS_FILTERS.map(({ status, label, icon }) => (
            <FilterChip
              key={status}
              label={label}
              icon={icon}
              selected={selectedStatuses.includes(status)}
              onPress={() => handleStatusToggle(status)}
            />
          ))}
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setShowFilters(true)}
          >
            <MaterialCommunityIcons name="sort" size={16} color="#666" />
            <Text style={styles.sortButtonText}>Sort</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Results count */}
        <View style={styles.resultsRow}>
          <Text style={styles.resultsCount}>
            {filteredPOs.length} purchase order{filteredPOs.length !== 1 ? 's' : ''}
          </Text>
          {(selectedStatuses.length > 0 || searchQuery) && (
            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.clearFilters}>Clear filters</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    ),
    [searchQuery, selectedStatuses, filteredPOs.length, handleStatusToggle, clearFilters]
  );

  const renderEmpty = useCallback(
    () => (
      <EmptyState
        icon="file-document-outline"
        title="No Purchase Orders"
        message={
          searchQuery || selectedStatuses.length > 0
            ? 'Try adjusting your filters or search query'
            : 'Create your first purchase order to get started'
        }
        actionLabel={!searchQuery && selectedStatuses.length === 0 ? 'Create PO' : undefined}
        onAction={
          !searchQuery && selectedStatuses.length === 0
            ? () => navigation.navigate('CreatePO', {})
            : undefined
        }
      />
    ),
    [searchQuery, selectedStatuses.length, navigation]
  );

  const renderFooter = useCallback(() => {
    if (!isLoading || filteredPOs.length === 0) return null;
    return <LoadingSpinner size="small" />;
  }, [isLoading, filteredPOs.length]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <NetworkBanner isOnline={isOnline} pendingCount={pendingSyncCount} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Purchase Orders</Text>
        <TouchableOpacity
          style={styles.filterIconButton}
          onPress={() => setShowFilters(true)}
        >
          <MaterialCommunityIcons name="filter-variant" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* PO List */}
      <FlatList
        data={filteredPOs}
        renderItem={renderPOItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={isLoading ? <LoadingSpinner /> : renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={loadPOs}
            colors={['#2196F3']}
            tintColor="#2196F3"
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <FAB
        icon="plus"
        onPress={() => navigation.navigate('CreatePO', {})}
      />

      {/* Sort/Filter Modal */}
      <Modal visible={showFilters} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowFilters(false)}>
          <View style={styles.filterSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Sort & Filter</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.filterLabel}>Sort By</Text>
              <View style={styles.sortOptions}>
                {SORT_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.sortOption,
                      sortBy === option.value && styles.sortOptionSelected,
                    ]}
                    onPress={() => setSortBy(option.value)}
                  >
                    <Text
                      style={[
                        styles.sortOptionText,
                        sortBy === option.value && styles.sortOptionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {sortBy === option.value && (
                      <TouchableOpacity onPress={toggleSortOrder}>
                        <MaterialCommunityIcons
                          name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}
                          size={18}
                          color="#2196F3"
                        />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterLabel}>Status</Text>
              <View style={styles.statusOptions}>
                {STATUS_FILTERS.map(({ status, label, icon }) => (
                  <FilterChip
                    key={status}
                    label={label}
                    icon={icon}
                    selected={selectedStatuses.includes(status)}
                    onPress={() => handleStatusToggle(status)}
                  />
                ))}
              </View>
            </ScrollView>

            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={styles.sheetClearButton}
                onPress={clearFilters}
              >
                <Text style={styles.sheetClearText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sheetApplyButton}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.sheetApplyText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Approve Confirmation Modal */}
      <ConfirmModal
        visible={approveModal.visible}
        title="Approve Purchase Order"
        message={`Are you sure you want to approve ${approveModal.po?.poNumber}? This will notify the supplier.`}
        confirmLabel="Approve"
        cancelLabel="Cancel"
        confirmColor="#4CAF50"
        onConfirm={confirmApprove}
        onCancel={() => setApproveModal({ visible: false, po: null })}
      />

      {/* Reject Confirmation Modal */}
      <Modal visible={rejectModal.visible} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setRejectModal({ visible: false, po: null })}
        >
          <View style={styles.rejectModalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.rejectModalTitle}>Reject Purchase Order</Text>
            <Text style={styles.rejectModalMessage}>
              Please provide a reason for rejecting {rejectModal.po?.poNumber}
            </Text>
            <View style={styles.rejectionInputContainer}>
              <MaterialCommunityIcons name="comment-alert-outline" size={20} color="#666" />
              <View style={styles.rejectionInput}>
                {['Quality Issue', 'Price Discrepancy', 'Wrong Items', 'Delivery Delay', 'Other'].map(
                  (reason) => (
                    <TouchableOpacity
                      key={reason}
                      style={[
                        styles.reasonChip,
                        rejectionReason === reason && styles.reasonChipSelected,
                      ]}
                      onPress={() => setRejectionReason(reason)}
                    >
                      <Text
                        style={[
                          styles.reasonChipText,
                          rejectionReason === reason && styles.reasonChipTextSelected,
                        ]}
                      >
                        {reason}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </View>
            <View style={styles.rejectModalActions}>
              <TouchableOpacity
                style={styles.rejectCancelButton}
                onPress={() => setRejectModal({ visible: false, po: null })}
              >
                <Text style={styles.rejectCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.rejectConfirmButton,
                  !rejectionReason && styles.rejectConfirmButtonDisabled,
                ]}
                onPress={confirmReject}
                disabled={!rejectionReason}
              >
                <Text style={styles.rejectConfirmText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  filterIconButton: {
    padding: 8,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  filtersRow: {
    maxHeight: 50,
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    gap: 4,
  },
  sortButtonText: {
    fontSize: 13,
    color: '#666',
  },
  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultsCount: {
    fontSize: 13,
    color: '#666',
  },
  clearFilters: {
    fontSize: 13,
    color: '#2196F3',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  filterSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#DDD',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    marginTop: 16,
  },
  sortOptions: {
    gap: 8,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  sortOptionSelected: {
    backgroundColor: '#E3F2FD',
  },
  sortOptionText: {
    fontSize: 14,
    color: '#333',
  },
  sortOptionTextSelected: {
    color: '#2196F3',
    fontWeight: '500',
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    paddingBottom: 20,
  },
  sheetClearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  sheetClearText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  sheetApplyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#2196F3',
    alignItems: 'center',
  },
  sheetApplyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  rejectModalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 24,
    alignSelf: 'center',
    width: '90%',
    maxWidth: 400,
  },
  rejectModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  rejectModalMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  rejectionInputContainer: {
    marginBottom: 20,
  },
  rejectionInput: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  reasonChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
  },
  reasonChipSelected: {
    backgroundColor: '#FFEBEE',
  },
  reasonChipText: {
    fontSize: 13,
    color: '#666',
  },
  reasonChipTextSelected: {
    color: '#F44336',
    fontWeight: '500',
  },
  rejectModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  rejectCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  rejectConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F44336',
    alignItems: 'center',
  },
  rejectConfirmButtonDisabled: {
    backgroundColor: '#FFCDD2',
  },
  rejectConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default POListScreen;
