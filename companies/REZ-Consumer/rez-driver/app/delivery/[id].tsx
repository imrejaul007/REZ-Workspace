import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDriverStore } from '../../src/stores';
import { deliveryApi, navigationApi } from '../../src/services/api';
import { Delivery, DeliveryStatus } from '../../src/types';
import { Button, Card, StatusBadge } from '../../src/components';
import {
  formatCurrency,
  formatDistance,
  formatDuration,
  formatTime,
  formatPhoneNumber,
  getStatusLabel,
} from '../../src/utils';

export default function DeliveryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { settings, updateDelivery, removeDelivery } = useDriverStore();

  // Load delivery details
  const loadDelivery = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await deliveryApi.getDelivery(id);
      if (response.success && response.data) {
        setDelivery(response.data);
      } else {
        setError('Delivery not found');
      }
    } catch (err) {
      setError('Failed to load delivery details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDelivery();
  }, [loadDelivery]);

  // Open navigation
  const openNavigation = (type: 'pickup' | 'delivery') => {
    if (!delivery) return;

    const destination =
      type === 'pickup'
        ? delivery.pickupLocation
        : delivery.deliveryLocation;

    const url = navigationApi.getDirectionsUrl(
      { latitude: destination.latitude, longitude: destination.longitude },
      settings.navigation.preferredApp
    );

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback to Google Maps web
        Linking.openURL(
          `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}`
        );
      }
    });
  };

  // Call phone number
  const callNumber = (phone: string) => {
    const url = `tel:${phone}`;
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to make phone call');
      }
    });
  };

  // Update delivery status
  const updateStatus = async (newStatus: DeliveryStatus) => {
    if (!delivery) return;

    setActionLoading(true);
    try {
      const response = await deliveryApi.updateDeliveryStatus(delivery.id, newStatus);
      if (response.success && response.data) {
        setDelivery(response.data);
        updateDelivery(delivery.id, response.data);

        if (newStatus === 'delivered') {
          Alert.alert(
            'Delivery Complete',
            `Great job! You earned ${formatCurrency(delivery.totalEarnings)}`,
            [{ text: 'OK', onPress: () => router.back() }]
          );
        }
      } else {
        Alert.alert('Error', response.error?.message || 'Failed to update status');
      }
    } catch (err) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Get next action based on status
  const getNextAction = (): { label: string; onPress: () => void; variant: 'primary' | 'success' | 'danger' } | null => {
    if (!delivery) return null;

    switch (delivery.status) {
      case 'accepted':
        return {
          label: 'Arrived at Pickup',
          onPress: () => updateStatus('picked_up'),
          variant: 'primary',
        };
      case 'picked_up':
        return {
          label: 'Start Delivery',
          onPress: () => updateStatus('in_transit'),
          variant: 'primary',
        };
      case 'in_transit':
        return {
          label: 'Complete Delivery',
          onPress: () => updateStatus('delivered'),
          variant: 'success',
        };
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading delivery details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !delivery) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Delivery not found'}</Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            variant="outline"
            style={styles.errorButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  const nextAction = getNextAction();

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Header */}
        <View style={styles.statusHeader}>
          <StatusBadge status={delivery.status} size="large" />
          <Text style={styles.statusDescription}>
            {delivery.status === 'accepted' && 'Head to the pickup location'}
            {delivery.status === 'picked_up' && 'Package collected - head to delivery'}
            {delivery.status === 'in_transit' && 'On your way to the customer'}
            {delivery.status === 'delivered' && 'Delivery completed successfully'}
          </Text>
        </View>

        {/* Route Card */}
        <Card style={styles.routeCard}>
          <View style={styles.routeSection}>
            <View style={styles.routeHeader}>
              <Text style={styles.routeTitle}>Pickup</Text>
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => openNavigation('pickup')}
              >
                <Text style={styles.navButtonText}>Navigate</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.locationName}>{delivery.pickupLocation.address}</Text>
            <Text style={styles.locationDetail}>{delivery.merchant.name}</Text>
            <TouchableOpacity
              style={styles.callButton}
              onPress={() => callNumber(delivery.merchant.phone)}
            >
              <Text style={styles.callButtonText}>
                Call Merchant: {formatPhoneNumber(delivery.merchant.phone)}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.routeDivider} />

          <View style={styles.routeSection}>
            <View style={styles.routeHeader}>
              <Text style={styles.routeTitle}>Drop Off</Text>
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => openNavigation('delivery')}
              >
                <Text style={styles.navButtonText}>Navigate</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.locationName}>{delivery.deliveryLocation.address}</Text>
            <Text style={styles.locationDetail}>{delivery.customer.name}</Text>
            {delivery.deliveryLocation.instructions && (
              <Text style={styles.instructions}>
                Note: {delivery.deliveryLocation.instructions}
              </Text>
            )}
            <TouchableOpacity
              style={styles.callButton}
              onPress={() => callNumber(delivery.customer.phone)}
            >
              <Text style={styles.callButtonText}>
                Call Customer: {formatPhoneNumber(delivery.customer.phone)}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Order Details */}
        <Card style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Order Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order ID</Text>
            <Text style={styles.detailValue}>{delivery.orderId}</Text>
          </View>

          <View style={styles.packagesSection}>
            <Text style={styles.packagesTitle}>
              {delivery.packages.length} Package{delivery.packages.length > 1 ? 's' : ''}
            </Text>
            {delivery.packages.map((pkg, index) => (
              <View key={pkg.id} style={styles.packageItem}>
                <View style={styles.packageNumber}>
                  <Text style={styles.packageNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.packageInfo}>
                  <Text style={styles.packageDescription}>{pkg.description}</Text>
                  <Text style={styles.packageMeta}>
                    Qty: {pkg.quantity}
                    {pkg.weight && ` | ${pkg.weight}kg`}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {delivery.specialInstructions && (
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsLabel}>Special Instructions:</Text>
              <Text style={styles.instructionsText}>
                {delivery.specialInstructions}
              </Text>
            </View>
          )}
        </Card>

        {/* Earnings Card */}
        <Card style={styles.earningsCard}>
          <Text style={styles.sectionTitle}>Earnings Breakdown</Text>

          <View style={styles.earningsRow}>
            <Text style={styles.earningsLabel}>Delivery Fee</Text>
            <Text style={styles.earningsValue}>{formatCurrency(delivery.fee)}</Text>
          </View>

          {delivery.tip && delivery.tip > 0 && (
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>Tip</Text>
              <Text style={[styles.earningsValue, styles.tipValue]}>
                +{formatCurrency(delivery.tip)}
              </Text>
            </View>
          )}

          <View style={styles.earningsDivider} />

          <View style={styles.earningsRow}>
            <Text style={styles.totalLabel}>Total Earnings</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(delivery.totalEarnings)}
            </Text>
          </View>
        </Card>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{formatDistance(delivery.distance)}</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{formatDuration(delivery.duration)}</Text>
            <Text style={styles.statLabel}>Est. Duration</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>
              {delivery.estimatedPickupTime
                ? formatTime(delivery.estimatedPickupTime)
                : '--:--'}
            </Text>
            <Text style={styles.statLabel}>Pickup By</Text>
          </Card>
        </View>

        {/* Spacer for button */}
        <View style={styles.buttonSpacer} />
      </ScrollView>

      {/* Action Button */}
      {nextAction && (
        <View style={styles.actionContainer}>
          <Button
            title={nextAction.label}
            onPress={nextAction.onPress}
            variant={nextAction.variant}
            size="large"
            fullWidth
            loading={actionLoading}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorButton: {
    minWidth: 120,
  },
  statusHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusDescription: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 12,
    textAlign: 'center',
  },
  routeCard: {
    marginBottom: 16,
  },
  routeSection: {
    paddingVertical: 8,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#007AFF',
    textTransform: 'uppercase',
  },
  navButton: {
    backgroundColor: '#007AFF15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  navButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  locationDetail: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 8,
  },
  instructions: {
    fontSize: 13,
    color: '#FF9500',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  callButton: {
    backgroundColor: '#34C75915',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  callButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
    textAlign: 'center',
  },
  routeDivider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 12,
  },
  detailsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
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
  packagesSection: {
    marginTop: 12,
  },
  packagesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  packageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  packageNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  packageNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  packageInfo: {
    flex: 1,
  },
  packageDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  packageMeta: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
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
  earningsCard: {
    marginBottom: 16,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  earningsLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  earningsValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  tipValue: {
    color: '#34C759',
  },
  earningsDivider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#34C759',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  buttonSpacer: {
    height: 80,
  },
  actionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
});
