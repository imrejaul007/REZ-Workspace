// KHAIRMOVE Driver App - Ride Request Screen
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';

export default function RideRequestScreen({ navigation }: any) {
  const handleAccept = () => {
    navigation.navigate('ActiveRide');
  };

  const handleReject = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>New Ride Request!</Text>
        <Text style={styles.subtitle}>Tap to accept</Text>
      </View>

      <View style={styles.rideCard}>
        <View style={styles.pickupSection}>
          <View style={styles.dot} />
          <View>
            <Text style={styles.label}>Pickup</Text>
            <Text style={styles.address}>MG Road Metro Station</Text>
            <Text style={styles.distance}>1.2 km away</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.dropSection}>
          <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
          <View>
            <Text style={styles.label}>Drop</Text>
            <Text style={styles.address}>Koramangala 5th Block</Text>
            <Text style={styles.distance}>~15 min</Text>
          </View>
        </View>
      </View>

      <View style={styles.fareCard}>
        <Text style={styles.fareLabel}>Estimated Earnings</Text>
        <Text style={styles.fareValue}>₹180</Text>
        <View style={styles.fareBreakdown}>
          <Text style={styles.fareItem}>Base: ₹60</Text>
          <Text style={styles.fareItem}>Distance: ₹90</Text>
          <Text style={styles.fareItem}>Time: ₹30</Text>
        </View>
      </View>

      <View style={styles.vehicleCard}>
        <Text style={styles.vehicleIcon}>🚗</Text>
        <View>
          <Text style={styles.vehicleName}>Maruti Swift</Text>
          <Text style={styles.vehicleNumber}>KA 01 AB 1234</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.rejectButton} onPress={handleReject}>
          <Text style={styles.rejectText}>✕</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
          <Text style={styles.acceptText}>Accept</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.timer}>
        <Text style={styles.timerText}>Auto-declining in 30s</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 20, alignItems: 'center', backgroundColor: '#16A34A' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  rideCard: { backgroundColor: '#FFFFFF', margin: 16, padding: 16, borderRadius: 16 },
  pickupSection: { flexDirection: 'row', alignItems: 'flex-start' },
  dot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#22C55E', marginRight: 12, marginTop: 4 },
  label: { fontSize: 12, color: '#6B7280' },
  address: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginTop: 2 },
  distance: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  divider: { height: 40, width: 2, backgroundColor: '#E5E7EB', marginLeft: 7, marginVertical: 8 },
  dropSection: { flexDirection: 'row', alignItems: 'flex-start' },
  fareCard: { backgroundColor: '#FFFFFF', margin: 16, padding: 20, borderRadius: 16, alignItems: 'center' },
  fareLabel: { fontSize: 14, color: '#6B7280' },
  fareValue: { fontSize: 36, fontWeight: 'bold', color: '#16A34A', marginTop: 8 },
  fareBreakdown: { flexDirection: 'row', gap: 12, marginTop: 12 },
  fareItem: { fontSize: 12, color: '#6B7280' },
  vehicleCard: { flexDirection: 'row', alignItems: 'center', margin: 16, padding: 16, backgroundColor: '#FFFFFF', borderRadius: 12 },
  vehicleIcon: { fontSize: 40, marginRight: 12 },
  vehicleName: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  vehicleNumber: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  buttonContainer: { flexDirection: 'row', padding: 16, gap: 12 },
  rejectButton: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', backgroundColor: '#FEE2E2' },
  rejectText: { fontSize: 24, color: '#EF4444' },
  acceptButton: { flex: 3, padding: 16, borderRadius: 12, alignItems: 'center', backgroundColor: '#16A34A' },
  acceptText: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
  timer: { alignItems: 'center', padding: 8 },
  timerText: { fontSize: 12, color: '#6B7280' },
});
