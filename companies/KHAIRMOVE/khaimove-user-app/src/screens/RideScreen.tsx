// KHAIRMOVE User App - Ride Selection Screen
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';

const VEHICLES = [
  { id: 'bike', name: 'Bike', icon: '🏍️', capacity: 1, baseFare: 15, perKm: 6 },
  { id: 'auto', name: 'Auto', icon: '🛺', capacity: 3, baseFare: 25, perKm: 10 },
  { id: 'cab', name: 'Cab', icon: '🚗', capacity: 4, baseFare: 40, perKm: 14 },
  { id: 'suv', name: 'SUV', icon: '🚙', capacity: 6, baseFare: 60, perKm: 18 },
];

export default function RideScreen({ navigation }: any) {
  const [selectedVehicle, setSelectedVehicle] = useState('cab');

  const handleRequestRide = () => {
    navigation.navigate('Tracking', { rideId: 'demo-ride-123' });
  };

  const vehicle = VEHICLES.find((v) => v.id === selectedVehicle)!;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Choose Your Ride</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Select Vehicle</Text>

        {VEHICLES.map((v) => (
          <TouchableOpacity
            key={v.id}
            style={[styles.vehicleCard, selectedVehicle === v.id && styles.vehicleCardSelected]}
            onPress={() => setSelectedVehicle(v.id)}
          >
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleIcon}>{v.icon}</Text>
              <View>
                <Text style={styles.vehicleName}>{v.name}</Text>
                <Text style={styles.vehicleCapacity}>Up to {v.capacity} seats</Text>
              </View>
            </View>
            <View style={styles.vehiclePrice}>
              <Text style={styles.priceAmount}>₹{v.baseFare}</Text>
              <Text style={styles.priceLabel}>Base</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.fareCard}>
          <Text style={styles.fareCardTitle}>Fare Details</Text>
          <View style={styles.fareRow}>
            <Text style={styles.fareLabel}>Base Fare</Text>
            <Text style={styles.fareValue}>₹{vehicle.baseFare}</Text>
          </View>
          <View style={styles.fareRow}>
            <Text style={styles.fareLabel}>Per KM</Text>
            <Text style={styles.fareValue}>₹{vehicle.perKm}/km</Text>
          </View>
          <View style={styles.fareRow}>
            <Text style={styles.fareLabel}>Cashback (10%)</Text>
            <Text style={[styles.fareValue, { color: '#22C55E' }]}>+₹{Math.round(vehicle.baseFare * 0.1)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.requestButton} onPress={handleRequestRide}>
          <Text style={styles.requestButtonText}>Request {vehicle.name}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backButton: { fontSize: 16, color: '#3B82F6', marginRight: 16 },
  title: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  content: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 12 },
  vehicleCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 2, borderColor: '#E5E7EB' },
  vehicleCardSelected: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  vehicleInfo: { flexDirection: 'row', alignItems: 'center' },
  vehicleIcon: { fontSize: 32, marginRight: 12 },
  vehicleName: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  vehicleCapacity: { fontSize: 12, color: '#6B7280' },
  vehiclePrice: { alignItems: 'flex-end' },
  priceAmount: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  priceLabel: { fontSize: 12, color: '#6B7280' },
  fareCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginTop: 8 },
  fareCardTitle: { fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 12 },
  fareRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  fareLabel: { fontSize: 14, color: '#6B7280' },
  fareValue: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  footer: { padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  requestButton: { backgroundColor: '#22C55E', padding: 16, borderRadius: 12, alignItems: 'center' },
  requestButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
