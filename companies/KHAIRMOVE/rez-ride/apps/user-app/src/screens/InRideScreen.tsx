import { logger } from '../../shared/logger';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { useRideStore } from '../stores/ride.store';
import { Ionicons } from '@expo/vector-icons';

interface InRideScreenProps {
  navigation: any;
  route?: any;
}

const InRideScreen: React.FC<InRideScreenProps> = ({ navigation }) => {
  const {
    pickupLocation,
    dropLocation,
    driverLocation,
    rideStatus,
    currentRide,
    estimate,
  } = useRideStore();

  const handleShareTrip = () => {
    logger.info('Share trip');
  };

  const handleCallDriver = () => {
    // Implement call driver functionality
    logger.info('Call driver');
  };

  const handleSOS = () => {
    // Implement SOS functionality
    logger.info('SOS pressed');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: driverLocation?.lat || pickupLocation?.lat || 12.9716,
            longitude: driverLocation?.lng || pickupLocation?.lng || 77.5946,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
        >
          {/* Drop Marker */}
          {dropLocation && (
            <Marker
              coordinate={{
                latitude: dropLocation.lat,
                longitude: dropLocation.lng,
              }}
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
              rotation={45}
            >
              <View style={styles.carMarker}>
                <Text style={styles.carEmoji}>🚗</Text>
              </View>
            </Marker>
          )}

          {/* Route Line */}
          {driverLocation && dropLocation && (
            <Polyline
              coordinates={[
                { latitude: driverLocation.lat, longitude: driverLocation.lng },
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

      {/* Ride Info Card */}
      <View style={styles.rideCard}>
        {/* Driver Info */}
        <View style={styles.driverInfo}>
          <View style={styles.driverAvatar}>
            <Text style={styles.driverInitial}>
              {currentRide?.driver?.name?.[0] || 'D'}
            </Text>
          </View>
          <View style={styles.driverDetails}>
            <Text style={styles.driverName}>
              {currentRide?.driver?.name || 'Driver'}
            </Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#ffc107" />
              <Text style={styles.ratingText}>
                {currentRide?.driver?.rating?.toFixed(1) || '4.8'}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.callButton} onPress={handleCallDriver}>
            <Ionicons name="call" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Vehicle Info */}
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleText}>
            {currentRide?.driver?.vehicle?.make || 'Vehicle'}
            {' '}
            {currentRide?.driver?.vehicle?.color || ''}
          </Text>
          <Text style={styles.vehiclePlate}>
            {currentRide?.driver?.vehicle?.plate || 'KA XX XX XXXX'}
          </Text>
        </View>

        {/* ETA */}
        <View style={styles.etaContainer}>
          <View style={styles.etaBox}>
            <Text style={styles.etaLabel}>Drop</Text>
            <Text style={styles.etaValue}>
              {estimate?.durationMinutes || '--'} min
            </Text>
            <Text style={styles.etaAddress} numberOfLines={1}>
              {dropLocation?.address || 'Destination'}
            </Text>
          </View>
        </View>

        {/* Fare Info */}
        <View style={styles.fareContainer}>
          <Text style={styles.fareLabel}>Fare</Text>
          <Text style={styles.fareValue}>
            ₹{estimate?.total.toFixed(0) || '--'}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.shareButton} onPress={handleShareTrip}>
            <Ionicons name="share-outline" size={24} color="#007bff" />
            <Text style={styles.shareButtonText}>Share Trip</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sosButton} onPress={handleSOS}>
            <Ionicons name="warning" size={24} color="#f44336" />
            <Text style={styles.sosButtonText}>SOS</Text>
          </TouchableOpacity>
        </View>
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
  rideCard: {
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
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverInitial: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  driverDetails: {
    flex: 1,
    marginLeft: 12,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  callButton: {
    backgroundColor: '#4caf50',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleInfo: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  vehicleText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  vehiclePlate: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: 'bold',
    marginTop: 4,
  },
  etaContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
    marginBottom: 16,
  },
  etaBox: {
    alignItems: 'center',
  },
  etaLabel: {
    fontSize: 14,
    color: '#666',
  },
  etaValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  etaAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  fareContainer: {
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
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  shareButtonText: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: '600',
  },
  sosButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffebee',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  sosButtonText: {
    color: '#f44336',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default InRideScreen;
