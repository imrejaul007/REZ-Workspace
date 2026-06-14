/**
 * Profile Screen
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#7c3aed',
  background: '#0f172a',
  surface: '#1e293b',
  surfaceLight: '#334155',
  text: '#ffffff',
  textSecondary: '#94a3b8',
};

const MOCK_PROFILE = {
  name: 'Rahul Sharma',
  email: 'rahul@example.com',
  corpId: 'CI-IND-001',
  department: 'Engineering',
  role: 'Senior Software Engineer',
  joinDate: '2024-01-15',
};

export default function ProfileScreen({ navigation }: any) {
  const menuItems = [
    { icon: 'person-outline', label: 'Edit Profile', onPress: () => {} },
    { icon: 'lock-closed-outline', label: 'Privacy Settings', onPress: () => {} },
    { icon: 'download-outline', label: 'Export Twin Data', onPress: () => {} },
    { icon: 'notifications-outline', label: 'Notifications', onPress: () => {} },
    { icon: 'card-outline', label: 'Subscription & Billing', onPress: () => {} },
    { icon: 'help-circle-outline', label: 'Help & Support', onPress: () => {} },
    { icon: 'document-text-outline', label: 'Terms & Conditions', onPress: () => {} },
    { icon: 'shield-checkmark-outline', label: 'Privacy Policy', onPress: () => {} },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>RS</Text>
          </View>
          <Text style={styles.name}>{MOCK_PROFILE.name}</Text>
          <Text style={styles.role}>{MOCK_PROFILE.role}</Text>
          <View style={styles.corpIdContainer}>
            <Text style={styles.corpIdLabel}>CorpID:</Text>
            <Text style={styles.corpId}>{MOCK_PROFILE.corpId}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>5</Text>
            <Text style={styles.statLabel}>Twins</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>8.5x</Text>
            <Text style={styles.statLabel}>Productivity</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>2500</Text>
            <Text style={styles.statLabel}>Training Hrs</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
              <View style={styles.menuLeft}>
                <Ionicons name={item.icon as any} size={22} color={COLORS.primary} />
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.version}>TwinOS v1.0.0</Text>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  profileCard: { alignItems: 'center', paddingVertical: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  name: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  role: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 12 },
  corpIdContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  corpIdLabel: { fontSize: 12, color: COLORS.textSecondary, marginRight: 8 },
  corpId: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 20, marginHorizontal: 16, backgroundColor: COLORS.surface, borderRadius: 16 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  menuContainer: { marginTop: 24, marginHorizontal: 16, backgroundColor: COLORS.surface, borderRadius: 16, paddingVertical: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuLabel: { fontSize: 16, color: COLORS.text, marginLeft: 14 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, marginHorizontal: 16, backgroundColor: '#ef444420', borderRadius: 12, paddingVertical: 14 },
  logoutText: { fontSize: 16, color: '#ef4444', fontWeight: '600', marginLeft: 8 },
  version: { textAlign: 'center', fontSize: 12, color: COLORS.textSecondary, marginTop: 24 },
});
