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
import { rideApi, navigationApi } from '../../src/services/api';
import { Ride, RideStatus } from '../../src/types';
import { Button, Card } from '../../src/components';
import {
  formatCurrency,
  formatDistance,
  formatDuration,
  formatTime,
  formatPhoneNumber,
  getRideStatusLabel,
} from '../../src/utils';

export default function RideDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { settings, updateRide, removeRide } = useDriverStore();

  // Load ride details
  const loadRide = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await rideApi.getRide(id);
      if (response.success && response.data) {
        setRide(response.data);
      } else {
        setError('Ride not found');
      }
    } catch (err) {
      setError('Failed to load ride details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadRide();
  }, [loadRide]);

  // Open navigation
  const openNavigation = (type: 'pickup' | 'dropoff') => {
    if (!ride) return;

    const destination =
      type === 'pickup'
        ? ride.pickupLocation
        : ride.dropoffLocation;

    const url = navigationApi.getDirectionsUrl(
      { latitude: destination.latitude, longitude: destination.longitude },
      settings.navigation.preferredApp
    );

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
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

  // Update ride status
  const updateStatus = async (newStatus: RideStatus) => {
    if (!ride) return;

    setActionLoading(true);
    try {
      const response = await rideApi.updateRideStatus(ride.id, newStatus);
      if (response.success && response.data) {
        setRide(response.data);
        updateRide(ride.id, response.data);

        if (newStatus === 'completed') {
          Alert.alert(
            'Trip Complete',
            `Great job! You earned ${formatCurrency(ride.totalEarnings)}`,
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

  // Share trip with emergency contact
  const shareTrip = async () => {
    if (!ride) return;

    try {
      const response = await rideApi.shareTrip(ride.id, settings.safety.emergencyContact || '');
      if (response.success) {
        Alert.alert('Trip Shared', 'Your trip details have been shared with your emergency contact.');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to share trip. Please try again.');
    }
  };

  // Report safety issue
  const reportSafetyIssue = () => {
    if (!ride) return;

    Alert.prompt(
      'Report Safety Issue',
      'Describe the safety issue:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          onPress: async (description) => {
            if (description) {
              try {
                await rideApi.reportSafetyIssue(ride.id, 'general', description);
                Alert.alert('Reported', 'Your report has been submitted.');
              } catch (err) {
                Alert.alert('Error', 'Failed to submit report.');
              }
            }
          },
        },
      ],
      'plain-text'
    );
  };

  // Get next action based on status
  const getNextAction = (): { label: string; onPress: () => void; variant: 'primary' | 'success' | 'danger' } | null => {
    if (!ride) return null;

    switch (ride.status) {
      case 'accepted':
        return {
          label: "I've Arrived",
          onPress: () => updateStatus('arrived'),
          variant: 'primary',
        };
      case 'arrived':
        return {
          label: 'Start Trip',
          onPress: () => updateStatus('in_progress'),
          variant: 'primary',
        };
      case 'in_progress':
        return {
          label: 'Complete Trip',
          onPress: () => updateStatus('completed'),
          variant: 'success',
        };
      default:
        return null;
    }
  };

  // Get ride type display
  const getRideTypeDisplay = () => {
    if (!ride) return '';
    return ride.rideType.charAt(0).toUpperCase() + ride.rideType.slice(1).replace('_', ' ');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFC107" />
          <Text style={styles.loadingText}>Loading ride details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !ride) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Ride not found'}</Text>
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
          <View style={styles.rideTypeBadge}>
            <Text style={styles.rideTypeText}>{getRideTypeDisplay()}</Text>
          </View>
          <Text style={styles.statusDescription}>
            {ride.status === 'accepted' && 'Head to the pickup location'}
            {ride.status === 'arrived' && 'Waiting for the customer'}
            {ride.status === 'in_progress' && 'Trip in progress'}
            {ride.status === 'completed' && 'Trip completed successfully'}
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
            <Text style={styles.locationName}>{ride.pickupLocation.address}</Text>
            <TouchableOpacity
              style={styles.callButton}
              onPress={() => callNumber(ride.customer.phone)}
            >
              <Text style={styles.callButtonText}>
                Call Customer: {formatPhoneNumber(ride.customer.phone)}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.routeDivider} />

          <View style={styles.routeSection}>
            <View style={styles.routeHeader}>
              <Text style={styles.routeTitle}>Drop Off</Text>
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => openNavigation('dropoff')}
              >
                <Text style={styles.navButtonText}>Navigate</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.locationName}>{ride.dropoffLocation.address}</Text>
          </View>
        </Card>

        {/* Trip Details */}
        <Card style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Trip Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Booking ID</Text>
            <Text style={styles.detailValue}>{ride.bookingId}</Text>
          </View>

          {ride.passengerCount && ride.passengerCount > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Passengers</Text>
              <Text style={styles.detailValue}>{ride.passengerCount}</Text>
            </View>
          )}

          {ride.flightNumber && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Flight</Text>
              <Text style={styles.detailValue}>{ride.flightNumber}</Text>
            </View>
          )}
        </Card>

        {/* Earnings Card */}
        <Card style={styles.earningsCard}>
          <Text style={styles.sectionTitle}>Earnings Breakdown</Text>

          <View style={styles.earningsRow}>
            <Text style={styles.earningsLabel}>Base Fare</Text>
            <Text style={styles.earningsValue}>{formatCurrency(ride.fare)}</Text>
          </View>

          {ride.tip && ride.tip > 0 && (
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>Tip</Text>
              <Text style={[styles.earningsValue, styles.tipValue]}>
                +{formatCurrency(ride.tip)}
              </Text>
            </View>
          )}

          {ride.surgeMultiplier && ride.surgeMultiplier > 1 && (
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>Surge</Text>
              <Text style={[styles.earningsValue, styles.surgeValue]}>
                +{formatCurrency(ride.fare * (ride.surgeMultiplier - 1))} ({ride.surgeMultiplier.toFixed(1)}x)
              </Text>
            </View>
          )}

          <View style={styles.earningsDivider} />

          <View style={styles.earningsRow}>
            <Text style={styles.totalLabel}>Total Earnings</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(ride.totalEarnings)}
            </Text>
          </View>
        </Card>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{formatDistance(ride.distance)}</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{formatDuration(ride.duration)}</Text>
            <Text style={styles.statLabel}>Est. Duration</Text>
          </Card>
        </View>

        {/* Safety Actions */}
        {(ride.status === 'in_progress' || ride.status === 'arrived') && (
          <View style={styles.safetySection}>
            <Text style={styles.sectionTitle}>Safety</Text>
            <View style={styles.safetyButtons}>
              <Button
                title="Share Trip"
                onPress={shareTrip}
                variant="secondary"
                size="medium"
                style={styles.safetyButton}
              />
              <Button
                title="Report Issue"
                onPress={reportSafetyIssue}
                variant="danger"
                size="medium"
                style={styles.safetyButton}
              />
            </View>
          </View>
        )}

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
  rideTypeBadge: {
    backgroundColor: '#FFC107',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  rideTypeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusDescription: {
    fontSize: 15,
    color: '#8E8E93',
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
    color: '#FFC107',
    textTransform: 'uppercase',
  },
  navButton: {
    backgroundColor: '#FFC10715',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  navButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFC107',
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  callButton: {
    backgroundColor: '#34C75915',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
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
  surgeValue: {
    color: '#FF9500',
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
  safetySection: {
    marginBottom: 16,
  },
  safetyButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  safetyButton: {
    flex: 1,
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
