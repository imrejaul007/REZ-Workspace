/**
 * Airzy Profile Screen
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function ProfileScreen() {
  const menuItems = [
    { icon: '👤', title: 'Personal Info', subtitle: 'Name, email, phone' },
    { icon: '🎫', title: 'Travel Documents', subtitle: 'Passport, visa, loyalty' },
    { icon: '💳', title: 'Payment Methods', subtitle: 'Cards, UPI, wallet' },
    { icon: '🔔', title: 'Notifications', subtitle: 'Alerts, reminders' },
    { icon: '🔒', title: 'Security', subtitle: 'Password, 2FA' },
    { icon: '📱', title: 'Preferences', subtitle: 'Language, currency' },
    { icon: '❓', title: 'Help & Support', subtitle: 'FAQs, contact us' },
    { icon: 'ℹ️', title: 'About', subtitle: 'Version 1.0.0' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>R</Text>
        </View>
        <Text style={styles.name}>Rejaul Karim</Text>
        <Text style={styles.email}>rejaul@rez.money</Text>
        <View style={styles.tierBadge}>
          <Text style={styles.tierText}>ELITE MEMBER</Text>
        </View>
      </View>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.menuItem}>
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { alignItems: 'center', padding: 30, paddingTop: 60, backgroundColor: '#6366F1', borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarText: { fontSize: 36, fontWeight: '700', color: '#6366F1' },
  name: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  email: { fontSize: 14, color: '#C7D2FE', marginBottom: 12 },
  tierBadge: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  tierText: { fontSize: 11, fontWeight: '700', color: '#6366F1', letterSpacing: 1 },
  menuContainer: { padding: 20, marginTop: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 8 },
  menuIcon: { fontSize: 24, marginRight: 16 },
  menuInfo: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  menuSubtitle: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  menuArrow: { fontSize: 24, color: '#D1D5DB' },
  logoutButton: { marginHorizontal: 20, marginVertical: 20, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#EF4444', alignItems: 'center' },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#EF4444' },
});
