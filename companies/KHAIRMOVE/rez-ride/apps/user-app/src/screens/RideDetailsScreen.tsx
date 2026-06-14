import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useRideStore } from '../stores/ride.store';

interface RideDetailsScreenProps {
  navigation: any;
  route?: any;
}

export const RideDetailsScreen: React.FC<RideDetailsScreenProps> = ({ navigation }) => {
  const { currentRide } = useRideStore();

  const ride = currentRide;

  const callDriver = () => {
    if (ride?.driver?.phone) {
      Linking.openURL(`tel:${ride.driver.phone}`);
    }
  };

  const shareRide = () => {
    // Share location with emergency contacts
  };

  if (!ride) {
    return (
      <View style={styles.container}>
        <Text style={styles.status}>No active ride</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.status}>{ride.status}</Text>
        <Text style={styles.otp}>OTP: {ride.otp || 'N/A'}</Text>
      </View>

      <View style={styles.driverCard}>
        <View style={styles.driverInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{ride.driver?.name?.[0] || 'D'}</Text>
          </View>
          <View style={styles.driverDetails}>
            <Text style={styles.driverName}>{ride.driver?.name || 'Driver'}</Text>
            <Text style={styles.vehicleInfo}>{ride.driver?.vehicle?.make} {ride.driver?.vehicle?.model}</Text>
            <Text style={styles.vehiclePlate}>{ride.driver?.vehicle?.plate || 'N/A'}</Text>
          </View>
          <View style={styles.rating}>
            <Text style={styles.ratingText}>⭐ {ride.driver?.rating || '4.5'}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={callDriver}>
            <Text style={styles.actionIcon}>📞</Text>
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={shareRide}>
            <Text style={styles.actionIcon}>📍</Text>
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.fareCard}>
        <Text style={styles.fareLabel}>Fare Details</Text>
        <View style={styles.fareRow}>
          <Text>Base Fare</Text>
          <Text>₹{ride.fare?.base || 0}</Text>
        </View>
        <View style={styles.fareRow}>
          <Text>Distance Charge</Text>
          <Text>₹{ride.fare?.distanceCharge || 0}</Text>
        </View>
        <View style={styles.fareRow}>
          <Text>Time Charge</Text>
          <Text>₹{ride.fare?.timeCharge || 0}</Text>
        </View>
        <View style={[styles.fareRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalPrice}>₹{ride.fare?.total || 0}</Text>
        </View>
        {ride.cashbackAmount && ride.cashbackAmount > 0 && (
          <View style={styles.cashbackRow}>
            <Text style={styles.cashbackText}>+ ₹{ride.cashbackAmount} cashback earned!</Text>
          </View>
        )}
      </View>

      {ride.status === 'completed' && (
        <TouchableOpacity style={styles.rateButton} onPress={() => navigation.navigate('Rating')}>
          <Text style={styles.rateText}>Rate Your Ride</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  status: { fontSize: 24, fontWeight: 'bold', color: '#22c55e' },
  otp: { fontSize: 20, fontWeight: '600', backgroundColor: '#f5f5f5', padding: 8, borderRadius: 8 },
  driverCard: { backgroundColor: '#f5f5f5', borderRadius: 12, padding: 16 },
  driverInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#6B4EFF', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  driverDetails: { flex: 1, marginLeft: 12 },
  driverName: { fontSize: 18, fontWeight: '600' },
  vehicleInfo: { fontSize: 14, color: '#666' },
  vehiclePlate: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  rating: { backgroundColor: '#fef3c7', padding: 8, borderRadius: 8 },
  ratingText: { fontSize: 16, fontWeight: '600' },
  actions: { flexDirection: 'row', marginTop: 16, justifyContent: 'space-around' },
  actionButton: { alignItems: 'center', padding: 12 },
  actionIcon: { fontSize: 24 },
  actionText: { marginTop: 4, fontSize: 14 },
  fareCard: { backgroundColor: '#f5f5f5', borderRadius: 12, padding: 16, marginTop: 20 },
  fareLabel: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  fareRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  totalRow: { borderTopWidth: 1, borderTopColor: '#ddd', marginTop: 8, paddingTop: 12 },
  totalLabel: { fontSize: 18, fontWeight: 'bold' },
  totalPrice: { fontSize: 18, fontWeight: 'bold' },
  cashbackRow: { marginTop: 12, padding: 12, backgroundColor: '#dcfce7', borderRadius: 8 },
  cashbackText: { color: '#22c55e', fontWeight: '600', textAlign: 'center' },
  rateButton: { backgroundColor: '#6B4EFF', padding: 16, borderRadius: 12, marginTop: 24 },
  rateText: { color: '#fff', fontSize: 18, fontWeight: '600', textAlign: 'center' },
});

export default RideDetailsScreen;
