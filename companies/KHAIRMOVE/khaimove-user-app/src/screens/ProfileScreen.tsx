// KHAIRMOVE User App - Profile Screen
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';

const MENU_ITEMS = [
  { icon: '💳', title: 'Payment Methods', subtitle: 'Add/Manage cards & wallets' },
  { icon: '🎁', title: 'Rewards & Cashback', subtitle: 'View your earnings' },
  { icon: '📍', title: 'Saved Places', subtitle: 'Home, Work, etc.' },
  { icon: '🔔', title: 'Notifications', subtitle: 'Manage alerts' },
  { icon: '⚙️', title: 'Settings', subtitle: 'App preferences' },
  { icon: '❓', title: 'Help & Support', subtitle: 'Get assistance' },
];

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>JD</Text>
          </View>
          <Text style={styles.userName}>John Doe</Text>
          <Text style={styles.userEmail}>john@example.com</Text>
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
              <Text style={styles.statValue}>⭐ 4.9</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
        </View>

        <View style={styles.menuSection}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <View style={styles.menuText}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  title: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  profileCard: { backgroundColor: '#FFFFFF', margin: 16, padding: 24, borderRadius: 16, alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 28, fontWeight: '600', color: '#FFFFFF' },
  userName: { fontSize: 20, fontWeight: '600', color: '#1F2937', marginTop: 12 },
  userEmail: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  statsRow: { flexDirection: 'row', marginTop: 20, gap: 32 },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  menuSection: { backgroundColor: '#FFFFFF', marginHorizontal: 16, borderRadius: 12, marginBottom: 16 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  menuIcon: { fontSize: 24, marginRight: 12 },
  menuText: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: '500', color: '#1F2937' },
  menuSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  menuArrow: { fontSize: 20, color: '#9CA3AF' },
  logoutButton: { margin: 16, padding: 16, borderRadius: 12, alignItems: 'center', backgroundColor: '#FEE2E2' },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#EF4444' },
});
