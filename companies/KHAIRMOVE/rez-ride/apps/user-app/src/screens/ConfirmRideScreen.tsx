import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRideStore } from '../stores/ride.store';

interface ConfirmRideScreenProps {
  navigation: any;
  route?: any;
  onConfirm?: () => void;
}

const VEHICLE_TYPES = [
  { id: 'auto', name: 'Auto', icon: '🛺', desc: 'Affordable', price: 80, eta: '3 min' },
  { id: 'cab', name: 'Cab', icon: '🚗', desc: 'Comfortable', price: 150, eta: '4 min' },
  { id: 'suv', name: 'SUV', icon: '🚙', desc: 'Spacious', price: 220, eta: '5 min' },
  { id: 'bike', name: 'Bike', icon: '🏍️', desc: 'Quick', price: 50, eta: '2 min' },
];

export const ConfirmRideScreen: React.FC<ConfirmRideScreenProps> = ({ navigation, onConfirm }) => {
  const [selected, setSelected] = useState('auto');
  const { pickupLocation, dropLocation } = useRideStore();

  const vehicle = VEHICLE_TYPES.find(v => v.id === selected)!;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      navigation.navigate('FindingDriver');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Confirm Ride</Text>

      <View style={styles.locationCard}>
        <View style={styles.locationRow}>
          <Text style={styles.dotGreen}>●</Text>
          <Text style={styles.address}>{pickupLocation?.address || 'Current Location'}</Text>
        </View>
        <View style={styles.line} />
        <View style={styles.locationRow}>
          <Text style={styles.dotRed}>●</Text>
          <Text style={styles.address}>{dropLocation?.address || 'Select destination'}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Select Vehicle</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vehicleList}>
        {VEHICLE_TYPES.map(v => (
          <TouchableOpacity
            key={v.id}
            style={[styles.vehicleCard, selected === v.id && styles.vehicleCardSelected]}
            onPress={() => setSelected(v.id)}
          >
            <Text style={styles.vehicleIcon}>{v.icon}</Text>
            <Text style={styles.vehicleName}>{v.name}</Text>
            <Text style={styles.vehicleDesc}>{v.desc}</Text>
            <Text style={styles.vehiclePrice}>₹{v.price}</Text>
            <Text style={styles.vehicleEta}>{v.eta}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.fareCard}>
        <Text style={styles.fareLabel}>Estimated Fare</Text>
        <Text style={styles.farePrice}>₹{vehicle.price}</Text>
        <Text style={styles.cashback}>+ ₹{Math.round(vehicle.price * 0.1)} cashback</Text>
      </View>

      <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
        <Text style={styles.confirmText}>Confirm Ride</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  locationCard: { backgroundColor: '#f5f5f5', borderRadius: 12, padding: 16 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  dotGreen: { color: '#22c55e', fontSize: 12 },
  dotRed: { color: '#ef4444', fontSize: 12 },
  address: { marginLeft: 12, fontSize: 16, flex: 1 },
  line: { width: 2, height: 20, backgroundColor: '#ddd', marginLeft: 5, marginVertical: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 12 },
  vehicleList: { flexDirection: 'row' },
  vehicleCard: { width: 100, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#ddd', marginRight: 12, alignItems: 'center' },
  vehicleCardSelected: { borderColor: '#6B4EFF', backgroundColor: '#f5f3ff' },
  vehicleIcon: { fontSize: 32 },
  vehicleName: { fontSize: 16, fontWeight: '600', marginTop: 8 },
  vehicleDesc: { fontSize: 12, color: '#666', marginTop: 2 },
  vehiclePrice: { fontSize: 16, fontWeight: 'bold', marginTop: 8 },
  vehicleEta: { fontSize: 12, color: '#22c55e', marginTop: 2 },
  fareCard: { backgroundColor: '#f5f5f5', borderRadius: 12, padding: 20, marginTop: 24, alignItems: 'center' },
  fareLabel: { fontSize: 14, color: '#666' },
  farePrice: { fontSize: 32, fontWeight: 'bold', marginTop: 8 },
  cashback: { fontSize: 14, color: '#22c55e', marginTop: 4 },
  confirmButton: { backgroundColor: '#6B4EFF', padding: 16, borderRadius: 12, marginTop: 24 },
  confirmText: { color: '#fff', fontSize: 18, fontWeight: '600', textAlign: 'center' },
});

export default ConfirmRideScreen;
