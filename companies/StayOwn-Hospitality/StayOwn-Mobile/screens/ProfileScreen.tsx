/**
 * StayOwn Mobile - Profile Screen
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';

const COLORS = { primary: '#6366F1', background: '#F9FAFB', white: '#FFFFFF', text: '#1F2937', textLight: '#6B7280', error: '#EF4444' };

const MENU = [
  { icon: '👤', title: 'Personal Info', action: 'personal' },
  { icon: '💳', title: 'Payment Methods', action: 'payment' },
  { icon: '🎁', title: 'REZ Coins', subtitle: '5,000 coins available', action: 'coins' },
  { icon: '⭐', title: 'My Reviews', action: 'reviews' },
  { icon: '🔔', title: 'Notifications', action: 'notifications' },
  { icon: '🔐', title: 'Privacy & Security', action: 'security' },
  { icon: '❓', title: 'Help & Support', action: 'help' },
  { icon: '📄', title: 'Terms & Conditions', action: 'terms' },
];

export default function ProfileScreen({ navigation }: any) {
  const handleMenuPress = (item: any) => {
    Alert.alert(item.title, 'This feature is coming soon!');
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive' },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}><Text style={styles.avatarText}>JD</Text></View>
        <Text style={styles.name}>John Doe</Text>
        <Text style={styles.email}>john.doe@email.com</Text>
        <TouchableOpacity style={styles.editBtn}><Text style={styles.editBtnText}>Edit Profile</Text></TouchableOpacity>
      </View>

      <View style={styles.menu}>
        {MENU.map((item, index) => (
          <TouchableOpacity key={index} style={styles.menuItem} onPress={() => handleMenuPress(item)}>
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              {item.subtitle && <Text style={styles.menuSubtitle}>{item.subtitle}</Text>}
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.version}>StayOwn v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.white, alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 32, color: COLORS.white, fontWeight: '600' },
  name: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginTop: 12 },
  email: { fontSize: 14, color: COLORS.textLight, marginTop: 4 },
  editBtn: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.primary },
  editBtnText: { color: COLORS.primary, fontWeight: '500' },
  menu: { backgroundColor: COLORS.white, marginTop: 16 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  menuIcon: { fontSize: 24, marginRight: 16 },
  menuContent: { flex: 1 },
  menuTitle: { fontSize: 16, color: COLORS.text },
  menuSubtitle: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  menuArrow: { fontSize: 24, color: COLORS.textLight },
  logoutBtn: { margin: 16, padding: 16, borderRadius: 12, backgroundColor: COLORS.white', alignItems: 'center' },
  logoutText: { fontSize: 16, fontWeight: '600', color: COLORS.error },
  version: { textAlign: 'center', fontSize: 12, color: COLORS.textLight, marginBottom: 30 },
});
