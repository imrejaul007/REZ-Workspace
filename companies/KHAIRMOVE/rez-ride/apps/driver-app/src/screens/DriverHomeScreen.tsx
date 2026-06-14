import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Linking,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { useDriverStore } from '../stores/driver.store';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const DriverHomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const {
    name,
    status,
    currentLocation,
    vehicle,
    todayEarnings,
    todayRides,
    rating,
    setStatus,
    setLocation,
  } = useDriverStore();

  const [isGoingOnline, setIsGoingOnline] = useState(false);

  // Get location on mount
  useEffect(() => {
    // In production, use expo-location
    setLocation({
      lat: 12.9716,
      lng: 77.5946,
    });
  }, []);

  const handleToggleStatus = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setIsGoingOnline(true);

    try {
      const newStatus = status === 'offline' ? 'online' : 'offline';

      // In production, call API
      // await driverService.updateStatus(newStatus);

      setStatus(newStatus);

      Alert.alert(
        newStatus === 'online' ? 'You\'re Online!' : 'You\'re Offline',
        newStatus === 'online'
          ? 'You will now receive ride requests.'
          : 'You will not receive any ride requests.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update status. Please try again.');
    } finally {
      setIsGoingOnline(false);
    }
  };

  const isOnline = status === 'online';
  const isRiding = status === 'riding';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{name?.[0] || 'D'}</Text>
          </View>
          <View>
            <Text style={styles.name}>{name || 'Driver'}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#ffc107" />
              <Text style={styles.ratingText}>{rating?.toFixed(1) || '5.0'}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: currentLocation?.lat || 12.9716,
            longitude: currentLocation?.lng || 77.5946,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation={isOnline}
          showsMyLocationButton
        >
          {vehicle && (
            <Marker
              coordinate={{
                latitude: currentLocation?.lat || 12.9716,
                longitude: currentLocation?.lng || 77.5946,
              }}
              rotation={45}
            >
              <View style={styles.carMarker}>
                <Text style={styles.carEmoji}>🚗</Text>
              </View>
            </Marker>
          )}
        </MapView>
      </View>

      {/* Status Card */}
      <View style={styles.statusCard}>
        {/* Status Indicator */}
        <View style={[styles.statusIndicator, isOnline && styles.statusOnline]}>
          <View style={[styles.statusDot, isOnline && styles.statusDotOnline]} />
          <Text style={styles.statusText}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>₹{todayEarnings?.toFixed(0) || 0}</Text>
            <Text style={styles.statLabel}>Today's Earnings</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{todayRides || 0}</Text>
            <Text style={styles.statLabel}>Today's Rides</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{rating?.toFixed(1) || '5.0'}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        {/* Vehicle Info */}
        {vehicle && (
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleText}>
              {vehicle.make} {vehicle.model}
            </Text>
            <Text style={styles.vehiclePlate}>{vehicle.plate}</Text>
          </View>
        )}

        {/* Go Online/Offline Button */}
        <TouchableOpacity
          style={[
            styles.statusButton,
            isOnline ? styles.statusButtonOffline : styles.statusButtonOnline,
          ]}
          onPress={handleToggleStatus}
          disabled={isGoingOnline || isRiding}
        >
          <Text style={styles.statusButtonText}>
            {isRiding ? 'Ride in Progress' : isOnline ? 'Go Offline' : 'Go Online'}
          </Text>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('Earnings')}
          >
            <Ionicons name="wallet-outline" size={24} color="#666" />
            <Text style={styles.quickActionText}>Earnings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('RideHistory')}
          >
            <Ionicons name="time-outline" size={24} color="#666" />
            <Text style={styles.quickActionText}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => Linking.openSettings()}
          >
            <Ionicons name="help-circle-outline" size={24} color="#666" />
            <Text style={styles.quickActionText}>Help</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  carMarker: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  carEmoji: {
    fontSize: 30,
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
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  statusOnline: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#999',
    marginRight: 8,
  },
  statusDotOnline: {
    backgroundColor: '#4caf50',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#eee',
  },
  vehicleInfo: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  vehicleText: {
    fontSize: 14,
    color: '#333',
  },
  vehiclePlate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
    marginTop: 4,
  },
  statusButton: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusButtonOnline: {
    backgroundColor: '#ffebee',
  },
  statusButtonOffline: {
    backgroundColor: '#4caf50',
  },
  statusButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});

export default DriverHomeScreen;
