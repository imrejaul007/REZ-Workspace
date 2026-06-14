// KHAIRMOVE User App - Home Screen
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import * as Location from 'expo-location';

export default function HomeScreen({ navigation }: any) {
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  React.useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });
    }
  };

  const handleGetEstimate = () => {
    if (!currentLocation || !pickup || !drop) {
      return;
    }
    navigation.navigate('Ride');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>KHAIRMOVE</Text>
        <Text style={styles.tagline}>Mobility & Logistics</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.searchCard}>
          <View style={styles.inputRow}>
            <View style={[styles.dot, { backgroundColor: '#22C55E' }]} />
            <TextInput
              style={styles.input}
              placeholder="Pickup location"
              placeholderTextColor="#9CA3AF"
              value={pickup}
              onChangeText={setPickup}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.inputRow}>
            <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
            <TextInput
              style={styles.input}
              placeholder="Where to?"
              placeholderTextColor="#9CA3AF"
              value={drop}
              onChangeText={setDrop}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.estimateButton} onPress={handleGetEstimate}>
          <Text style={styles.estimateButtonText}>Get Estimates</Text>
        </TouchableOpacity>

        <View style={styles.vehicleGrid}>
          {[
            { id: 'bike', name: 'Bike', icon: '🏍️', price: '₹15' },
            { id: 'auto', name: 'Auto', icon: '🛺', price: '₹25' },
            { id: 'cab', name: 'Cab', icon: '🚗', price: '₹40' },
            { id: 'suv', name: 'SUV', icon: '🚙', price: '₹60' },
          ].map((vehicle) => (
            <TouchableOpacity
              key={vehicle.id}
              style={styles.vehicleCard}
              onPress={() => navigation.navigate('Ride')}
            >
              <Text style={styles.vehicleIcon}>{vehicle.icon}</Text>
              <Text style={styles.vehicleName}>{vehicle.name}</Text>
              <Text style={styles.vehiclePrice}>{vehicle.price} base</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.promoCard}>
          <Text style={styles.promoTitle}>🎁 10% Cashback</Text>
          <Text style={styles.promoSubtitle}>On every ride with KHAIRMOVE</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 20, paddingTop: 40, backgroundColor: '#3B82F6' },
  logo: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  content: { flex: 1, padding: 16 },
  searchCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#1F2937' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginLeft: 24 },
  estimateButton: { backgroundColor: '#3B82F6', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  estimateButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  vehicleGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 20 },
  vehicleCard: { width: '48%', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 12, alignItems: 'center' },
  vehicleIcon: { fontSize: 32, marginBottom: 8 },
  vehicleName: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  vehiclePrice: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  promoCard: { backgroundColor: '#FEF3C7', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  promoTitle: { fontSize: 18, fontWeight: '600', color: '#92400E' },
  promoSubtitle: { fontSize: 14, color: '#92400E', marginTop: 4 },
});
