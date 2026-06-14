import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';

export const DriverRideActiveScreen: React.FC<{ ride: any; onComplete: () => void }> = ({ ride, onComplete }) => {
  const callRider = () => Linking.openURL(`tel:${ride.rider.phone}`);

  return (
    <View style={styles.container}>
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>Ride in Progress</Text>
        <Text style={styles.otp}>OTP: {ride.otp}</Text>
      </View>

      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>Map View</Text>
        <Text style={styles.distance}>{ride.distanceRemaining} km away</Text>
      </View>

      <View style={styles.destinationCard}>
        <View style={styles.locationRow}>
          <Text style={styles.dotGreen}>●</Text>
          <Text style={styles.address}>{ride.drop.address}</Text>
        </View>
      </View>

      <View style={styles.riderCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{ride.rider.name[0]}</Text>
        </View>
        <View style={styles.riderInfo}>
          <Text style={styles.riderName}>{ride.rider.name}</Text>
          <Text style={styles.payment}>{ride.paymentMethod} • ₹{ride.fare}</Text>
        </View>
        <TouchableOpacity style={styles.callButton} onPress={callRider}>
          <Text style={styles.callIcon}>📞</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.completeButton} onPress={onComplete}>
        <Text style={styles.completeText}>Complete Ride</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  statusBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#22c55e' },
  statusText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  otp: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  mapPlaceholder: { flex: 1, backgroundColor: '#2d2d44', justifyContent: 'center', alignItems: 'center' },
  mapText: { color: '#9ca3af', fontSize: 24 },
  distance: { color: '#fff', fontSize: 18, marginTop: 8 },
  destinationCard: { backgroundColor: '#2d2d44', margin: 16, padding: 16, borderRadius: 12 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  dotGreen: { color: '#22c55e', fontSize: 12 },
  address: { color: '#fff', fontSize: 16, marginLeft: 12, flex: 1 },
  riderCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2d2d44', margin: 16, padding: 16, borderRadius: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#6B4EFF', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  riderInfo: { marginLeft: 16, flex: 1 },
  riderName: { color: '#fff', fontSize: 18, fontWeight: '600' },
  payment: { color: '#9ca3af', marginTop: 4 },
  callButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#22c55e', justifyContent: 'center', alignItems: 'center' },
  callIcon: { fontSize: 24 },
  completeButton: { backgroundColor: '#22c55e', margin: 16, padding: 16, borderRadius: 12 },
  completeText: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
});

export default DriverRideActiveScreen;
