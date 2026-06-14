import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export const ProfileScreen: React.FC = () => {
  const user = { name: 'John Doe', phone: '+91 98765 43210', email: 'john@email.com' };

  const menuItems = [
    { icon: '👤', label: 'Edit Profile' },
    { icon: '📍', label: 'Saved Addresses' },
    { icon: '💳', label: 'Payment Methods' },
    { icon: '🎫', label: 'Offers & Vouchers' },
    { icon: '🛡️', label: 'Safety' },
    { icon: '🔔', label: 'Notifications' },
    { icon: '🌐', label: 'Language' },
    { icon: '❓', label: 'Help & Support' },
    { icon: '📜', label: 'Terms & Privacy' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.name[0]}</Text>
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.phone}>{user.phone}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>Rides</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>₹450</Text>
          <Text style={styles.statLabel}>Saved</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>4.8</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
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
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { alignItems: 'center', paddingVertical: 32, backgroundColor: '#6B4EFF' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: '#6B4EFF' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 16 },
  phone: { fontSize: 14, color: '#fff', opacity: 0.8, marginTop: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 20, backgroundColor: '#f5f5f5' },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  menu: { paddingVertical: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  menuIcon: { fontSize: 20, width: 32 },
  menuLabel: { flex: 1, fontSize: 16 },
  menuArrow: { fontSize: 24, color: '#ccc' },
  logoutButton: { margin: 20, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#ef4444', alignItems: 'center' },
  logoutText: { color: '#ef4444', fontSize: 16, fontWeight: '600' },
});

export default ProfileScreen;
