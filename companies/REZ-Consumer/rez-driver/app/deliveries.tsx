import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDriverStore } from '../src/stores';
import { deliveryApi } from '../src/services/api';
import { Delivery, DeliveryStatus, DeliveryRequest } from '../src/types';
import { DeliveryCard, Button, Card, StatusBadge, EmptyState } from '../src/components';
import {
  formatCurrency,
  formatDistance,
  formatDuration,
  sortDeliveriesByPriority,
  getDeliveryTypeName,
  getDeliveryTypeColor,
  formatTimeRemaining,
} from '../src/utils';

type FilterType = 'active' | 'pending';

export default function DeliveriesScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('active');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<DeliveryRequest | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [requestExpiry, setRequestExpiry] = useState(0);

  const {
    activeDeliveries,
    pendingRequests,
    setActiveDeliveries,
    setPendingRequests,
    updateDelivery,
    removeDelivery,
    addDelivery,
  } = useDriverStore();

  // Load deliveries
  const loadDeliveries = useCallback(async () => {
    try {
      // Load active deliveries
      const activeResponse = await deliveryApi.getActiveDeliveries();
      if (activeResponse.success && activeResponse.data) {
        setActiveDeliveries(activeResponse.data);
      }

      // Load pending requests
      const pendingResponse = await deliveryApi.getPendingRequests();
      if (pendingResponse.success && pendingResponse.data) {
        setPendingRequests(pendingResponse.data);
      }
    } catch (error) {
      logger.error('Error loading deliveries:', error);
    }
  }, [setActiveDeliveries, setPendingRequests]);

  // Refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDeliveries();
    setRefreshing(false);
  }, [loadDeliveries]);

  // Initial load
  useEffect(() => {
    loadDeliveries();
  }, [loadDeliveries]);

  // Handle delivery press
  const handleDeliveryPress = (delivery: Delivery) => {
    if (delivery.status === 'pending') {
      // Find the corresponding request
      const request = pendingRequests.find((r) => r.delivery.id === delivery.id);
      if (request) {
        setSelectedRequest(request);
        setRequestExpiry(request.expiresIn);
        setModalVisible(true);
      }
    } else {
      router.push(`/delivery/${delivery.id}`);
    }
  };

  // Accept delivery
  const handleAcceptDelivery = async () => {
    if (!selectedRequest) return;

    setActionLoading(true);
    try {
      const response = await deliveryApi.acceptDelivery(selectedRequest.delivery.id);
      if (response.success && response.data) {
        // Remove from pending and add to active
        const updated = { ...response.data, status: 'accepted' as DeliveryStatus };
        removeDelivery(selectedRequest.delivery.id);
        addDelivery(updated);
        setModalVisible(false);
        setSelectedRequest(null);
        // Navigate to the delivery
        router.push(`/delivery/${updated.id}`);
      } else {
        Alert.alert('Error', response.error?.message || 'Failed to accept delivery');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Decline delivery
  const handleDeclineDelivery = async () => {
    if (!selectedRequest) return;

    setActionLoading(true);
    try {
      const response = await deliveryApi.declineDelivery(selectedRequest.delivery.id);
      if (response.success) {
        removeDelivery(selectedRequest.delivery.id);
        setModalVisible(false);
        setSelectedRequest(null);
      } else {
        Alert.alert('Error', response.error?.message || 'Failed to decline delivery');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Render delivery item for active list
  const renderActiveDeliveryItem = ({ item }: { item: Delivery }) => (
    <DeliveryCard
      delivery={item}
      onPress={() => handleDeliveryPress(item)}
      variant="full"
    />
  );

  // Render delivery item for pending list
  const renderPendingDeliveryItem = ({ item }: { item: DeliveryRequest }) => (
    <DeliveryCard
      delivery={item.delivery}
      onPress={() => {
        setSelectedRequest(item);
        setRequestExpiry(item.expiresIn);
        setModalVisible(true);
      }}
      variant="full"
    />
  );

  // Current list based on filter
  const activeList = sortDeliveriesByPriority(activeDeliveries);
  const pendingList = pendingRequests.map((r) => r.delivery);

  // Stats
  const activeCount = activeDeliveries.length;
  const pendingCount = pendingRequests.length;
  const inTransitCount = activeDeliveries.filter(
    (d) => d.status === 'in_transit' || d.status === 'picked_up'
  ).length;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      {/* Header Stats */}
      <View style={styles.header}>
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={[styles.statItem, filter === 'active' && styles.statItemActive]}
            onPress={() => setFilter('active')}
          >
            <Text style={[styles.statValue, filter === 'active' && styles.statValueActive]}>
              {activeCount}
            </Text>
            <Text style={[styles.statLabel, filter === 'active' && styles.statLabelActive]}>
              Active
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statItem, filter === 'pending' && styles.statItemActive]}
            onPress={() => setFilter('pending')}
          >
            <View style={styles.statWithBadge}>
              <Text style={[styles.statValue, filter === 'pending' && styles.statValueActive]}>
                {pendingCount}
              </Text>
              {pendingCount > 0 && <View style={styles.badge} />}
            </View>
            <Text style={[styles.statLabel, filter === 'pending' && styles.statLabelActive]}>
              Pending
            </Text>
          </TouchableOpacity>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{inTransitCount}</Text>
            <Text style={styles.statLabel}>In Transit</Text>
          </View>
        </View>
      </View>

      {/* Deliveries List */}
      <FlatList
        data={filter === 'active' ? activeList : pendingList}
        renderItem={filter === 'active' ? renderActiveDeliveryItem : renderPendingDeliveryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
          />
        }
        ListEmptyComponent={
          <EmptyState
            title={filter === 'active' ? 'No Active Deliveries' : 'No Pending Requests'}
            message={
              filter === 'active'
                ? 'You don\'t have unknown active deliveries right now. New deliveries will appear here.'
                : 'Great job! You\'ve completed all your pending requests.'
            }
          />
        }
      />

      {/* Delivery Request Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Delivery Request</Text>
            <View style={styles.modalHeaderSpacer} />
          </View>

          {selectedRequest && (
            <View style={styles.modalContent}>
              {/* Delivery Type Badge */}
              <View style={[styles.typeHeader, { backgroundColor: getDeliveryTypeColor(selectedRequest.delivery.deliveryType) + '15' }]}>
                <Text style={[styles.typeText, { color: getDeliveryTypeColor(selectedRequest.delivery.deliveryType) }]}>
                  {getDeliveryTypeName(selectedRequest.delivery.deliveryType)}
                </Text>
                {selectedRequest.isPriority && (
                  <View style={styles.priorityBadge}>
                    <Text style={styles.priorityText}>Priority</Text>
                  </View>
                )}
              </View>

              {/* Route Info */}
              <Card style={styles.routeCard}>
                <View style={styles.routeRow}>
                  <View style={styles.routePoint}>
                    <View style={[styles.dot, styles.dotPickup]} />
                    <View style={styles.routeLine} />
                    <View style={[styles.dot, styles.dotDelivery]} />
                  </View>
                  <View style={styles.routeInfo}>
                    <View style={styles.routeLocation}>
                      <Text style={styles.locationLabel}>PICKUP</Text>
                      <Text style={styles.locationAddress}>{selectedRequest.delivery.pickupLocation.address}</Text>
                      <Text style={styles.merchantName}>{selectedRequest.delivery.merchant.name}</Text>
                    </View>
                    <View style={styles.routeLocation}>
                      <Text style={styles.locationLabel}>DROP OFF</Text>
                      <Text style={styles.locationAddress}>{selectedRequest.delivery.deliveryLocation.address}</Text>
                      <Text style={styles.customerName}>{selectedRequest.delivery.customer.name}</Text>
                    </View>
                  </View>
                </View>
              </Card>

              {/* Order Details */}
              <Card style={styles.detailsCard}>
                <Text style={styles.sectionTitle}>Order Details</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Order ID</Text>
                  <Text style={styles.detailValue}>{selectedRequest.delivery.orderId}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Items</Text>
                  <Text style={styles.detailValue}>
                    {selectedRequest.delivery.packages.length} item{selectedRequest.delivery.packages.length > 1 ? 's' : ''}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Weight</Text>
                  <Text style={styles.detailValue}>{selectedRequest.delivery.totalWeight.toFixed(1)} kg</Text>
                </View>
                {selectedRequest.delivery.specialInstructions && (
                  <View style={styles.instructionsContainer}>
                    <Text style={styles.instructionsLabel}>Instructions:</Text>
                    <Text style={styles.instructionsText}>
                      {selectedRequest.delivery.specialInstructions}
                    </Text>
                  </View>
                )}
              </Card>

              {/* Earnings & Stats */}
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxValue}>
                    {formatDistance(selectedRequest.distance)}
                  </Text>
                  <Text style={styles.statBoxLabel}>Distance</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxValue}>
                    {formatDuration(selectedRequest.duration)}
                  </Text>
                  <Text style={styles.statBoxLabel}>Duration</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statBoxValue, styles.earningsValue]}>
                    {formatCurrency(selectedRequest.estimatedEarnings)}
                  </Text>
                  <Text style={styles.statBoxLabel}>Earnings</Text>
                </View>
              </View>

              {/* Surge Indicator */}
              {selectedRequest.surgeActive && (
                <View style={styles.surgeContainer}>
                  <Text style={styles.surgeText}>
                    Surge Active ({selectedRequest.surgeMultiplier.toFixed(1)}x)
                  </Text>
                </View>
              )}

              {/* Expiry Timer */}
              <View style={styles.expiryContainer}>
                <Text style={styles.expiryText}>
                  Expires in: {formatTimeRemaining(requestExpiry)}
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <Button
                  title="Accept Delivery"
                  onPress={handleAcceptDelivery}
                  variant="success"
                  size="large"
                  fullWidth
                  loading={actionLoading}
                />
                <Button
                  title="Decline"
                  onPress={handleDeclineDelivery}
                  variant="outline"
                  size="large"
                  fullWidth
                  style={styles.declineButton}
                  loading={actionLoading}
                />
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  statItemActive: {
    backgroundColor: '#007AFF10',
  },
  statWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  statValueActive: {
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  statLabelActive: {
    color: '#007AFF',
  },
  badge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF9500',
    marginLeft: 6,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalClose: {
    fontSize: 16,
    color: '#007AFF',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  modalHeaderSpacer: {
    width: 60,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  routeCard: {
    marginBottom: 16,
  },
  routeRow: {
    flexDirection: 'row',
  },
  routePoint: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotPickup: {
    backgroundColor: '#007AFF',
  },
  dotDelivery: {
    backgroundColor: '#34C759',
  },
  routeLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 4,
  },
  routeInfo: {
    flex: 1,
  },
  routeLocation: {
    marginBottom: 16,
  },
  locationLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  merchantName: {
    fontSize: 14,
    color: '#007AFF',
  },
  customerName: {
    fontSize: 14,
    color: '#34C759',
  },
  detailsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  detailLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  instructionsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
  },
  instructionsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF9500',
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  statsGrid: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statBoxValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  earningsValue: {
    color: '#34C759',
  },
  statBoxLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  typeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  typeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  priorityBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  surgeContainer: {
    backgroundColor: '#FF950015',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  surgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9500',
  },
  expiryContainer: {
    backgroundColor: '#8E8E9315',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  expiryText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
  },
  actionButtons: {
    marginTop: 'auto',
    gap: 12,
  },
  declineButton: {
    marginTop: 0,
  },
});
