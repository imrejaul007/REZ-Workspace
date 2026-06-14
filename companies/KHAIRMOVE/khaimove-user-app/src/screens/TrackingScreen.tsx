// KHAIRMOVE User App - Ride Tracking Screen
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';

export default function TrackingScreen({ navigation, route }: any) {
  const { rideId } = route.params || { rideId: 'demo-ride' };

  const handleCancel = () => {
    navigation.navigate('Main');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.status}>Finding Driver...</Text>
      </View>

      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapIcon}>🗺️</Text>
        <Text style={styles.mapText}>Live Map View</Text>
        <Text style={styles.rideId}>Ride: {rideId}</Text>
      </View>

      <View style={styles.driverCard}>
        <View style={styles.driverAvatar}>
          <Text style={styles.driverInitial}>D</Text>
        </View>
        <View style={styles.driverInfo}>
          <Text style={styles.driverName}>Driver Assigned</Text>
          <Text style={styles.driverVehicle}>Maruti Swift • ABC 1234</Text>
          <Text style={styles.driverRating}>⭐ 4.8</Text>
        </View>
      </View>

      <View style={styles.otpSection}>
        <Text style={styles.otpLabel}>Share OTP with driver to start ride</Text>
        <Text style={styles.otpNote}>OTP will be shown when driver arrives</Text>
      </View>

      <View style={styles.fareCard}>
        <View style={styles.fareRow}>
          <Text style={styles.fareLabel}>Total Fare</Text>
          <Text style={styles.fareValue}>₹250</Text>
        </View>
        <View style={styles.fareRow}>
          <Text style={styles.fareLabel}>Cashback (10%)</Text>
          <Text style={[styles.fareValue, { color: '#22C55E' }]}>+₹25</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelText}>Cancel Ride</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 16, alignItems: 'center', backgroundColor: '#3B82F6' },
  status: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
  mapPlaceholder: { flex: 1, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  mapIcon: { fontSize: 64 },
  mapText: { fontSize: 16, color: '#6B7280', marginTop: 8 },
  rideId: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  driverCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', margin: 16, padding: 16, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  driverAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' },
  driverInitial: { fontSize: 20, fontWeight: '600', color: '#FFFFFF' },
  driverInfo: { flex: 1, marginLeft: 12 },
  driverName: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  driverVehicle: { fontSize: 14, color: '#6B7280' },
  driverRating: { fontSize: 14, color: '#92400E', fontWeight: '600' },
  otpSection: { alignItems: 'center', margin: 16, padding: 16, backgroundColor: '#FEF3C7', borderRadius: 12 },
  otpLabel: { fontSize: 14, color: '#92400E', fontWeight: '500' },
  otpNote: { fontSize: 12, color: '#92400E', marginTop: 4 },
  fareCard: { backgroundColor: '#FFFFFF', margin: 16, padding: 16, borderRadius: 12 },
  fareRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  fareLabel: { fontSize: 14, color: '#6B7280' },
  fareValue: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  footer: { padding: 16 },
  cancelButton: { padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#EF4444' },
  cancelText: { fontSize: 16, fontWeight: '600', color: '#EF4444' },
});
