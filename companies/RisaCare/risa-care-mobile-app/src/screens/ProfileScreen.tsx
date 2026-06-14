import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS } from '../../App';

const menuItems = [
  { id: '1', title: 'My Appointments', icon: '📅', screen: 'Appointments' },
  { id: '2', title: 'Medical Records', icon: '📋', screen: 'Records' },
  { id: '3', title: 'Lab Reports', icon: '🧪', screen: 'LabTests' },
  { id: '4', title: 'Prescriptions', icon: '💊', screen: 'Pharmacy' },
  { id: '5', title: 'Health Wallet', icon: '💰', screen: 'HealthWallet' },
  { id: '6', title: 'Insurance', icon: '🛡️', screen: '' },
  { id: '7', title: 'Family Members', icon: '👨‍👩‍👧', screen: '' },
  { id: '8', title: 'Settings', icon: '⚙️', screen: '' },
  { id: '9', title: 'Help & Support', icon: '❓', screen: '' },
];

export default function ProfileScreen({ navigation }: any) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
        <Text style={styles.name}>Rahul Sharma</Text>
        <Text style={styles.phone}>+91 98765 43210</Text>
        <Text style={styles.email}>rahul.sharma@email.com</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>Appointments</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>8</Text>
          <Text style={styles.statLabel}>Reports</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>₹2,500</Text>
          <Text style={styles.statLabel}>Wallet</Text>
        </View>
      </View>

      <View style={styles.menuSection}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={() => item.screen && navigation.navigate(item.screen)}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuTitle}>{item.title}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, padding: 30, paddingTop: 50, alignItems: 'center' },
  avatar: { width: 80, height: 80, backgroundColor: COLORS.white, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 40 },
  name: { fontSize: 22, fontWeight: 'bold', color: COLORS.white, marginTop: 15 },
  phone: { fontSize: 14, color: COLORS.white, marginTop: 5 },
  email: { fontSize: 14, color: COLORS.white, opacity: 0.8, marginTop: 3 },
  statsRow: { flexDirection: 'row', backgroundColor: COLORS.white, marginHorizontal: 20, marginTop: -20, borderRadius: 15, padding: 20, elevation: 4 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  statLabel: { fontSize: 12, color: COLORS.textLight, marginTop: 5 },
  statDivider: { width: 1, backgroundColor: COLORS.background },
  menuSection: { marginTop: 20, marginHorizontal: 20 },
  menuItem: { flexDirection: 'row', backgroundColor: COLORS.white, padding: 18, borderRadius: 15, marginBottom: 10, alignItems: 'center' },
  menuIcon: { fontSize: 22 },
  menuTitle: { flex: 1, marginLeft: 15, fontSize: 16, color: COLORS.text },
  menuArrow: { fontSize: 22, color: COLORS.textLight },
  logoutBtn: { marginHorizontal: 20, marginTop: 20, padding: 18, backgroundColor: COLORS.danger + '20', borderRadius: 15, alignItems: 'center' },
  logoutText: { color: COLORS.danger, fontSize: 16, fontWeight: '600' },
});
