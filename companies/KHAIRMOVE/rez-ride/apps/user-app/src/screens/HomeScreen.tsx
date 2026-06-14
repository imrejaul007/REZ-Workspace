import { logger } from '../../shared/logger';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { useRideStore } from '../stores/ride.store';
import { useAuthStore } from '../stores/auth.store';
import { rideService } from '../services/ride.service';
import { VEHICLE_TYPES } from '../api/client';
import { Ionicons } from '@expo/vector-icons';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const {
    pickupLocation,
    dropLocation,
    selectedVehicleType,
    estimate,
    walletBalance,
    setPickupLocation,
    setDropLocation,
    setSelectedVehicleType,
    setEstimate,
    setFindingDriver,
  } = useRideStore();

  const [isGettingEstimate, setIsGettingEstimate] = useState(false);
  const [showVehicles, setShowVehicles] = useState(false);

  // Get current location on mount
  useEffect(() => {
    // In a real app, get user's current location
    setPickupLocation({
      lat: 12.9716,
      lng: 77.5946,
      address: 'MG Road, Bangalore',
    });
  }, []);

  // Fetch estimate when locations change
  useEffect(() => {
    if (pickupLocation && dropLocation) {
      getEstimate();
    }
  }, [pickupLocation, dropLocation, selectedVehicleType]);

  const getEstimate = async () => {
    if (!pickupLocation || !dropLocation) return;

    setIsGettingEstimate(true);
    try {
      const result = await rideService.getEstimate({
        pickupLat: pickupLocation.lat,
        pickupLng: pickupLocation.lng,
        dropLat: dropLocation.lat,
        dropLng: dropLocation.lng,
        vehicleType: selectedVehicleType,
      });

      setEstimate({
        total: result.estimate.total,
        distanceKm: result.route.distanceKm,
        durationMinutes: result.route.durationMinutes,
        cashback: result.estimate.cashback,
      });
    } catch (error) {
      logger.error('Failed to get estimate:', error);
    } finally {
      setIsGettingEstimate(false);
    }
  };

  const handleBookRide = async () => {
    if (!pickupLocation || !dropLocation) {
      alert('Please select pickup and drop locations');
      return;
    }

    setFindingDriver(true);

    try {
      const result = await rideService.createRide({
        pickup: pickupLocation,
        drop: dropLocation,
        vehicleType: selectedVehicleType,
        paymentMethod: 'wallet',
      });

      if (result.success) {
        navigation.navigate('FindingDriver', { ride: result.ride });
      }
    } catch (error) {
      logger.error('Failed to create ride:', error);
      alert('Failed to create ride. Please try again.');
    } finally {
      setFindingDriver(false);
    }
  };

  const selectedVehicle = VEHICLE_TYPES.find((v) => v.id === selectedVehicleType);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="menu" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ReZ Ride</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Wallet')}>
          <View style={styles.walletBadge}>
            <Text style={styles.walletText}>₹{walletBalance}</Text>
          </View>
        </TouchableOpacity>
      </View>

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
          showsUserLocation
          showsMyLocationButton
        >
          {pickupLocation && (
            <Marker
              coordinate={{
                latitude: pickupLocation.lat,
                longitude: pickupLocation.lng,
              }}
              title="Pickup"
              pinColor="green"
            />
          )}
          {dropLocation && (
            <Marker
              coordinate={{
                latitude: dropLocation.lat,
                longitude: dropLocation.lng,
              }}
              title="Drop"
              pinColor="red"
            />
          )}
        </MapView>
      </View>

      {/* Booking Card */}
      <View style={styles.bookingCard}>
        {/* Pickup Input */}
        <TouchableOpacity
          style={styles.locationInput}
          onPress={() => navigation.navigate('LocationSearch', { mode: 'pickup' })}
        >
          <View style={styles.pickupDot} />
          <Text style={styles.locationText}>
            {pickupLocation?.address || 'Enter pickup location'}
          </Text>
        </TouchableOpacity>

        {/* Drop Input */}
        <TouchableOpacity
          style={styles.locationInput}
          onPress={() => navigation.navigate('LocationSearch', { mode: 'drop' })}
        >
          <View style={styles.dropDot} />
          <Text style={styles.locationText}>
            {dropLocation?.address || 'Where to?'}
          </Text>
        </TouchableOpacity>

        {/* Add Stop Button */}
        <TouchableOpacity
          style={styles.addStopButton}
          onPress={() => navigation.navigate('AddStop')}
        >
          <Ionicons name="add-circle-outline" size={20} color="#6B4EFF" />
          <Text style={styles.addStopText}>Add stop</Text>
        </TouchableOpacity>

        {/* Vehicle Selection */}
        {pickupLocation && dropLocation && (
          <TouchableOpacity
            style={styles.vehicleSelector}
            onPress={() => setShowVehicles(!showVehicles)}
          >
            <Text style={styles.vehicleIcon}>{selectedVehicle?.icon}</Text>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleName}>{selectedVehicle?.name}</Text>
              <Text style={styles.vehicleCapacity}>
                {estimate?.durationMinutes || '--'} min • {estimate?.distanceKm?.toFixed(1) || '--'} km
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
        )}

        {/* Vehicle Options */}
        {showVehicles && (
          <View style={styles.vehicleOptions}>
            {VEHICLE_TYPES.map((vehicle) => (
              <TouchableOpacity
                key={vehicle.id}
                style={[
                  styles.vehicleOption,
                  selectedVehicleType === vehicle.id && styles.vehicleOptionSelected,
                ]}
                onPress={() => {
                  setSelectedVehicleType(vehicle.id);
                  setShowVehicles(false);
                }}
              >
                <Text style={styles.vehicleOptionIcon}>{vehicle.icon}</Text>
                <View style={styles.vehicleOptionInfo}>
                  <Text style={styles.vehicleOptionName}>{vehicle.name}</Text>
                  <Text style={styles.vehicleOptionDesc}>{vehicle.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Fare Estimate */}
        {estimate && (
          <View style={styles.fareContainer}>
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Estimated Fare</Text>
              <Text style={styles.fareValue}>₹{estimate.total.toFixed(0)}</Text>
            </View>
            <View style={styles.cashbackRow}>
              <Text style={styles.cashbackLabel}>+ ₹{estimate.cashback.toFixed(0)} cashback</Text>
              <Text style={styles.cashbackValue}>🎁 Earn 10% back!</Text>
            </View>
          </View>
        )}

        {/* Book Button */}
        <TouchableOpacity
          style={[
            styles.bookButton,
            (!pickupLocation || !dropLocation || isGettingEstimate) && styles.bookButtonDisabled,
          ]}
          onPress={handleBookRide}
          disabled={!pickupLocation || !dropLocation || isGettingEstimate}
        >
          {isGettingEstimate ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.bookButtonText}>Book {selectedVehicle?.name}</Text>
          )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  walletBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  walletText: {
    color: '#2e7d32',
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4caf50',
    marginRight: 12,
  },
  dropDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#f44336',
    marginRight: 12,
  },
  locationText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  vehicleSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
  },
  vehicleIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  vehicleCapacity: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  vehicleOptions: {
    marginTop: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    overflow: 'hidden',
  },
  vehicleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  vehicleOptionSelected: {
    backgroundColor: '#e3f2fd',
  },
  vehicleOptionIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  vehicleOptionInfo: {
    flex: 1,
  },
  vehicleOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  vehicleOptionDesc: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  fareContainer: {
    marginTop: 16,
    padding: 14,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fareLabel: {
    fontSize: 14,
    color: '#666',
  },
  fareValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  cashbackRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  cashbackLabel: {
    fontSize: 13,
    color: '#2e7d32',
  },
  cashbackValue: {
    fontSize: 13,
    color: '#2e7d32',
    fontWeight: '600',
  },
  bookButton: {
    backgroundColor: '#007bff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  bookButtonDisabled: {
    backgroundColor: '#ccc',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addStopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  addStopText: {
    color: '#6B4EFF',
    marginLeft: 8,
    fontSize: 14,
  },
});

export default HomeScreen;
