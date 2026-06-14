import { logger } from '../../shared/logger';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useRideStore } from '../stores/ride.store';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { rideService } from '../services/ride.service';

interface FindingDriverScreenProps {
  navigation: any;
  route?: any;
}

const FindingDriverScreen: React.FC<FindingDriverScreenProps> = ({ navigation, route }) => {
  const { ride } = route?.params || {};

  const {
    pickupLocation,
    dropLocation,
    driverLocation,
    rideStatus,
    estimate,
    cancelRide,
    setFindingDriver,
  } = useRideStore();

  const [cancelModalVisible, setCancelModalVisible] = useState(false);

  // Trigger haptic feedback periodically
  useEffect(() => {
    const interval = setInterval(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCancel = async () => {
    try {
      if (ride?.id) {
        await rideService.cancelRide(ride.id, 'User cancelled');
      }
      cancelRide('User cancelled');
      setFindingDriver(false);
      navigation.goBack();
    } catch (error) {
      logger.error('Failed to cancel ride:', error);
    }
  };

  const getStatusText = () => {
    switch (rideStatus) {
      case 'requested':
        return 'Finding your driver...';
      case 'assigned':
        return 'Driver found!';
      case 'accepted':
        return 'Driver is on the way...';
      case 'arrived':
        return 'Driver has arrived!';
      case 'in_progress':
        return 'Ride in progress...';
      default:
        return 'Finding your driver...';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: pickupLocation?.lat || 12.9716,
            longitude: pickupLocation?.lng || 77.5946,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {/* Pickup Marker */}
          {pickupLocation && (
            <Marker
              coordinate={{
                latitude: pickupLocation.lat,
                longitude: pickupLocation.lng,
              }}
              pinColor="green"
            >
              <View style={styles.pickupMarker}>
                <Text style={styles.markerText}>A</Text>
              </View>
            </Marker>
          )}

          {/* Drop Marker */}
          {dropLocation && (
            <Marker
              coordinate={{
                latitude: dropLocation.lat,
                longitude: dropLocation.lng,
              }}
              pinColor="red"
            >
              <View style={styles.dropMarker}>
                <Text style={styles.markerText}>B</Text>
              </View>
            </Marker>
          )}

          {/* Driver Marker */}
          {driverLocation && (
            <Marker
              coordinate={{
                latitude: driverLocation.lat,
                longitude: driverLocation.lng,
              }}
            >
              <View style={styles.carMarker}>
                <Text style={styles.carEmoji}>🚗</Text>
              </View>
            </Marker>
          )}

          {/* Route Line */}
          {pickupLocation && dropLocation && (
            <Polyline
              coordinates={[
                { latitude: pickupLocation.lat, longitude: pickupLocation.lng },
                { latitude: dropLocation.lat, longitude: dropLocation.lng },
              ]}
              strokeColor="#007bff"
              strokeWidth={4}
            />
          )}
        </MapView>

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>

        {/* Fare Info */}
        <View style={styles.fareInfo}>
          <Text style={styles.fareLabel}>Estimated Fare</Text>
          <Text style={styles.fareValue}>₹{estimate?.total.toFixed(0) || '--'}</Text>
        </View>

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
        >
          <Text style={styles.cancelButtonText}>Cancel Ride</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  pickupMarker: {
    backgroundColor: '#4caf50',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  dropMarker: {
    backgroundColor: '#f44336',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  carMarker: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  carEmoji: {
    fontSize: 30,
  },
  markerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
    color: '#333',
  },
  fareInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  fareLabel: {
    fontSize: 16,
    color: '#666',
  },
  fareValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  cancelButton: {
    backgroundColor: '#ffebee',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    color: '#f44336',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FindingDriverScreen;
