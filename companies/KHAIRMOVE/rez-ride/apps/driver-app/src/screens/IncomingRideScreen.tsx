import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export const IncomingRideScreen: React.FC<{
  ride: any;
  onAccept: () => void;
  onReject: () => void;
}> = ({ ride, onAccept, onReject }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.requests}>1 New Request!</Text>
        <Text style={styles.timer}>12s</Text>
      </View>

      <View style={styles.rideCard}>
        <View style={styles.locationRow}>
          <Text style={styles.dotGreen}>●</Text>
          <Text style={styles.address}>{ride.pickup.address}</Text>
        </View>
        <View style={styles.line} />
        <View style={styles.locationRow}>
          <Text style={styles.dotRed}>●</Text>
          <Text style={styles.address}>{ride.drop.address}</Text>
        </View>
      </View>

      <View style={styles.earningsCard}>
        <Text style={styles.earningLabel}>Estimated Earning</Text>
        <Text style={styles.earningAmount}>₹{ride.estimatedFare}</Text>
        <Text style={styles.distance}>{ride.distance} km • {ride.duration} mins</Text>
      </View>

      <View style={styles.riderCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{ride.rider.name[0]}</Text>
        </View>
        <View style={styles.riderInfo}>
          <Text style={styles.riderName}>{ride.rider.name}</Text>
          <Text style={styles.riderRating}>⭐ {ride.rider.rating}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.rejectButton} onPress={onReject}>
          <Text style={styles.rejectIcon}>✕</Text>
          <Text style={styles.rejectText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
          <Text style={styles.acceptIcon}>✓</Text>
          <Text style={styles.acceptText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  requests: { fontSize: 20, fontWeight: 'bold', color: '#fbbf24' },
  timer: { fontSize: 24, fontWeight: 'bold', color: '#ef4444' },
  rideCard: { backgroundColor: '#2d2d44', borderRadius: 12, padding: 16, marginBottom: 16 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  dotGreen: { color: '#22c55e', fontSize: 12 },
  dotRed: { color: '#ef4444', fontSize: 12 },
  address: { color: '#fff', fontSize: 16, marginLeft: 12, flex: 1 },
  line: { width: 2, height: 20, backgroundColor: '#4a4a6a', marginLeft: 5, marginVertical: 8 },
  earningsCard: { backgroundColor: '#2d2d44', borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 16 },
  earningLabel: { color: '#9ca3af', fontSize: 14 },
  earningAmount: { color: '#22c55e', fontSize: 40, fontWeight: 'bold', marginTop: 8 },
  distance: { color: '#9ca3af', marginTop: 8 },
  riderCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2d2d44', borderRadius: 12, padding: 16, marginBottom: 24 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#6B4EFF', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  riderInfo: { marginLeft: 16, flex: 1 },
  riderName: { color: '#fff', fontSize: 18, fontWeight: '600' },
  riderRating: { color: '#fbbf24', marginTop: 4 },
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  rejectButton: { flex: 1, backgroundColor: '#ef4444', borderRadius: 12, padding: 20, marginRight: 8, alignItems: 'center' },
  rejectIcon: { fontSize: 32, color: '#fff' },
  rejectText: { color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 4 },
  acceptButton: { flex: 2, backgroundColor: '#22c55e', borderRadius: 12, padding: 20, marginLeft: 8, alignItems: 'center' },
  acceptIcon: { fontSize: 32, color: '#fff' },
  acceptText: { color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 4 },
});

export default IncomingRideScreen;
