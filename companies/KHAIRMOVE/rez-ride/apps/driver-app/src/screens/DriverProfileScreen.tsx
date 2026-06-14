import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export const DriverProfileScreen: React.FC = () => {
  const driver = { name: 'Rajesh Kumar', phone: '+91 98765 43210', rating: 4.8, totalRides: 1250, vehicle: 'Maruti Swift', plate: 'KA01AB1234' };

  const menuItems = [
    { icon: '📊', label: 'My Performance' },
    { icon: '🚗', label: 'Vehicle Details' },
    { icon: '📄', label: 'Documents' },
    { icon: '💳', label: 'Bank Account' },
    { icon: '🎁', label: 'Offers & Incentives' },
    { icon: '🛡️', label: 'Insurance' },
    { icon: '❓', label: 'Help' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{driver.name[0]}</Text>
        </View>
        <Text style={styles.name}>{driver.name}</Text>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>⭐ {driver.rating}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{driver.totalRides}</Text>
          <Text style={styles.statLabel}>Total Rides</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>₹45K</Text>
          <Text style={styles.statLabel}>This Month</Text>
        </View>
      </View>

      <View style={styles.vehicleCard}>
        <Text style={styles.vehicleTitle}>Your Vehicle</Text>
        <Text style={styles.vehicleName}>{driver.vehicle}</Text>
        <Text style={styles.vehiclePlate}>{driver.plate}</Text>
      </View>

      <View style={styles.menu}>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.menuItem}>
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton}>
        <Text style={styles.logoutText}>Go Offline</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: { alignItems: 'center', paddingVertical: 32 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#6B4EFF', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
  name: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 16 },
  ratingBadge: { backgroundColor: '#fbbf24', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16, marginTop: 8 },
  ratingText: { color: '#1a1a2e', fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 20, backgroundColor: '#2d2d44', marginHorizontal: 16, borderRadius: 12 },
  stat: { alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  statLabel: { color: '#9ca3af', fontSize: 12, marginTop: 4 },
  vehicleCard: { backgroundColor: '#2d2d44', margin: 16, padding: 16, borderRadius: 12 },
  vehicleTitle: { color: '#9ca3af', fontSize: 14 },
  vehicleName: { color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 4 },
  vehiclePlate: { color: '#6B4EFF', fontSize: 16, fontWeight: 'bold', marginTop: 4 },
  menu: { paddingHorizontal: 16 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#2d2d44' },
  menuIcon: { fontSize: 20, width: 32 },
  menuLabel: { flex: 1, color: '#fff', fontSize: 16 },
  menuArrow: { color: '#9ca3af', fontSize: 24 },
  logoutButton: { margin: 16, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#ef4444', alignItems: 'center' },
  logoutText: { color: '#ef4444', fontSize: 16, fontWeight: '600' },
});

export default DriverProfileScreen;
