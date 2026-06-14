// KHAIRMOVE Driver App - Dashboard Screen
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import * as Location from 'expo-location';

export default function DriverDashboard() {
  const [isOnline, setIsOnline] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [earnings, setEarnings] = useState({ today: 1250, week: 8500 });

  useEffect(() => {
    startLocationTracking();
  }, [isOnline]);

  const startLocationTracking = async () => {
    if (!isOnline) return;

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 10 },
      (loc) => setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude })
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, Driver!</Text>
          <Text style={styles.status}>
            {isOnline ? '🟢 Online' : '⚫ Offline'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.onlineButton, isOnline && styles.onlineButtonActive]}
          onPress={() => setIsOnline(!isOnline)}
        >
          <Text style={[styles.onlineButtonText, isOnline && styles.onlineButtonTextActive]}>
            {isOnline ? 'GO OFFLINE' : 'GO ONLINE'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.locationCard}>
        <Text style={styles.locationIcon}>📍</Text>
        <Text style={styles.locationText}>
          {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Location off'}
        </Text>
      </View>

      <View style={styles.earningsGrid}>
        <View style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>Today's Earnings</Text>
          <Text style={styles.earningsValue}>₹{earnings.today}</Text>
        </View>
        <View style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>This Week</Text>
          <Text style={styles.earningsValue}>₹{earnings.week}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>45</Text>
          <Text style={styles.statLabel}>Total Rides</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>4.8</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>Silver</Text>
          <Text style={styles.statLabel}>Tier</Text>
        </View>
      </View>

      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>📋</Text>
          <Text style={styles.menuText}>Ride History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>💰</Text>
          <Text style={styles.menuText}>Withdraw Earnings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>🚗</Text>
          <Text style={styles.menuText}>My Vehicle</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>❓</Text>
          <Text style={styles.menuText}>Help & Support</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.promoBanner}>
        <Text style={styles.promoText}>🎁 Complete 10 rides today to earn ₹500 bonus!</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#16A34A' },
  greeting: { fontSize: 20, fontWeight: '600', color: '#FFFFFF' },
  status: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  onlineButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 2, borderColor: '#FFFFFF' },
  onlineButtonActive: { backgroundColor: '#FFFFFF' },
  onlineButtonText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  onlineButtonTextActive: { color: '#16A34A' },
  locationCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: '#FFFFFF', margin: 16, borderRadius: 12 },
  locationIcon: { fontSize: 20, marginRight: 8 },
  locationText: { fontSize: 14, color: '#6B7280' },
  earningsGrid: { flexDirection: 'row', paddingHorizontal: 16, gap: 12 },
  earningsCard: { flex: 1, backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, alignItems: 'center' },
  earningsLabel: { fontSize: 12, color: '#6B7280' },
  earningsValue: { fontSize: 24, fontWeight: 'bold', color: '#16A34A', marginTop: 4 },
  statsRow: { flexDirection: 'row', padding: 16, gap: 12 },
  statItem: { flex: 1, backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  menuSection: { padding: 16 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 8 },
  menuIcon: { fontSize: 24, marginRight: 12 },
  menuText: { fontSize: 16, color: '#1F2937' },
  promoBanner: { margin: 16, padding: 16, backgroundColor: '#FEF3C7', borderRadius: 12, alignItems: 'center' },
  promoText: { fontSize: 14, color: '#92400E', fontWeight: '500' },
});
