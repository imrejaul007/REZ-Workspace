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
import { rideApi } from '../src/services/api';
import { Ride, RideStatus, RideRequest } from '../src/types';
import { RideCard, Button, Card, EmptyState } from '../src/components';
import {
  formatCurrency,
  formatDistance,
  formatDuration,
  getRideStatusLabel,
} from '../src/utils';

type FilterType = 'active' | 'pending';

export default function RidesScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('active');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RideRequest | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const {
    activeRides,
    pendingRideRequests,
    setActiveRides,
    setPendingRideRequests,
    addRide,
    removeRide,
  } = useDriverStore();

  // Load rides
  const loadRides = useCallback(async () => {
    try {
      // Load active rides
      const activeResponse = await rideApi.getActiveRides();
      if (activeResponse.success && activeResponse.data) {
        setActiveRides(activeResponse.data);
      }

      // Load pending requests
      const pendingResponse = await rideApi.getPendingRequests();
      if (pendingResponse.success && pendingResponse.data) {
        setPendingRideRequests(pendingResponse.data);
      }
    } catch (error) {
      logger.error('Error loading rides:', error);
    }
  }, [setActiveRides, setPendingRideRequests]);

  // Refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRides();
    setRefreshing(false);
  }, [loadRides]);

  // Initial load
  useEffect(() => {
    loadRides();
  }, [loadRides]);

  // Handle ride press
  const handleRidePress = (ride: Ride) => {
    if (ride.status === 'pending') {
      // Find the corresponding request
      const request = pendingRideRequests.find((r) => r.ride.id === ride.id);
      if (request) {
        setSelectedRequest(request);
        setModalVisible(true);
      }
    } else {
      router.push(`/ride/${ride.id}`);
    }
  };

  // Accept ride
  const handleAcceptRide = async () => {
    if (!selectedRequest) return;

    setActionLoading(true);
    try {
      const response = await rideApi.acceptRide(selectedRequest.ride.id);
      if (response.success && response.data) {
        const updated = { ...response.data, status: 'accepted' as RideStatus };
        removeRide(selectedRequest.ride.id);
        addRide(updated);
        setModalVisible(false);
        setSelectedRequest(null);
        router.push(`/ride/${updated.id}`);
      } else {
        Alert.alert('Error', response.error?.message || 'Failed to accept ride');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Decline ride
  const handleDeclineRide = async () => {
    if (!selectedRequest) return;

    setActionLoading(true);
    try {
      const response = await rideApi.declineRide(selectedRequest.ride.id);
      if (response.success) {
        removeRide(selectedRequest.ride.id);
        setModalVisible(false);
        setSelectedRequest(null);
      } else {
        Alert.alert('Error', response.error?.message || 'Failed to decline ride');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Render ride item for active list
  const renderActiveRideItem = ({ item }: { item: Ride }) => (
    <RideCard
      ride={item}
      onPress={() => handleRidePress(item)}
      variant="full"
    />
  );

  // Render ride item for pending list
  const renderPendingRideItem = ({ item }: { item: RideRequest }) => (
    <RideCard
      ride={item.ride}
      onPress={() => {
        setSelectedRequest(item);
        setModalVisible(true);
      }}
      variant="full"
    />
  );

  // Current list based on filter
  const activeList = activeRides;
  const pendingList = pendingRideRequests.map((r) => r.ride);

  // Stats
  const activeCount = activeRides.length;
  const pendingCount = pendingRideRequests.length;
  const inProgressCount = activeRides.filter(
    (r) => r.status === 'in_progress' || r.status === 'accepted'
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
            <Text style={styles.statValue}>{inProgressCount}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
        </View>
      </View>

      {/* Rides List */}
      <FlatList
        data={filter === 'active' ? activeList : pendingList}
        renderItem={filter === 'active' ? renderActiveRideItem : renderPendingRideItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFC107"
          />
        }
        ListEmptyComponent={
          <EmptyState
            title={filter === 'active' ? 'No Active Rides' : 'No Pending Requests'}
            message={
              filter === 'active'
                ? "You don't have unknown active rides right now. New ride requests will appear here."
                : 'Great job! All pending requests have been handled.'
            }
          />
        }
      />

      {/* Ride Request Modal */}
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
            <Text style={styles.modalTitle}>New Ride Request</Text>
            <View style={styles.modalHeaderSpacer} />
          </View>

          {selectedRequest && (
            <View style={styles.modalContent}>
              {/* Ride Info */}
              <View style={[styles.typeHeader, { backgroundColor: '#FFC10715' }]}>
                <Text style={[styles.typeText, { color: '#FFC107' }]}>
                  {selectedRequest.ride.rideType.charAt(0).toUpperCase() +
                    selectedRequest.ride.rideType.slice(1).replace('_', ' ')} Ride
                </Text>
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
                      <Text style={styles.locationAddress}>{selectedRequest.ride.pickupLocation.address}</Text>
                      <Text style={styles.distanceText}>
                        {formatDistance(selectedRequest.pickupDistance)} away
                      </Text>
                    </View>
                    <View style={styles.routeLocation}>
                      <Text style={styles.locationLabel}>DROP OFF</Text>
                      <Text style={styles.locationAddress}>{selectedRequest.ride.dropoffLocation.address}</Text>
                      <Text style={styles.customerName}>{selectedRequest.ride.customer.name}</Text>
                    </View>
                  </View>
                </View>
              </Card>

              {/* Ride Details */}
              <Card style={styles.detailsCard}>
                <Text style={styles.sectionTitle}>Ride Details</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Booking ID</Text>
                  <Text style={styles.detailValue}>{selectedRequest.ride.bookingId}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Passengers</Text>
                  <Text style={styles.detailValue}>
                    {selectedRequest.ride.passengerCount || 1} passenger(s)
                  </Text>
                </View>
              </Card>

              {/* Earnings & Stats */}
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxValue}>
                    {formatDistance(selectedRequest.ride.distance)}
                  </Text>
                  <Text style={styles.statBoxLabel}>Distance</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxValue}>
                    {formatDuration(selectedRequest.ride.duration)}
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

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <Button
                  title="Accept Ride"
                  onPress={handleAcceptRide}
                  variant="success"
                  size="large"
                  fullWidth
                  loading={actionLoading}
                />
                <Button
                  title="Decline"
                  onPress={handleDeclineRide}
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
    backgroundColor: '#FFC10710',
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
    color: '#FFC107',
  },
  statLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  statLabelActive: {
    color: '#FFC107',
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
    color: '#FFC107',
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
    backgroundColor: '#FFC107',
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
  distanceText: {
    fontSize: 14,
    color: '#FFC107',
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
  actionButtons: {
    marginTop: 'auto',
    gap: 12,
  },
  declineButton: {
    marginTop: 0,
  },
});
