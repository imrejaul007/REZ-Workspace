// RisaCare Mobile - Profile Screen

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>RK</Text>
          </View>
          <Text style={styles.name}>Rahul Kumar</Text>
          <Text style={styles.email}>rahul.kumar@email.com</Text>
          <Text style={styles.phone}>+91 98765 43210</Text>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>👤</Text>
            <Text style={styles.menuText}>Personal Information</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>👨‍👩‍👧</Text>
            <Text style={styles.menuText}>Family Members</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>💊</Text>
            <Text style={styles.menuText}>Medications</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>⚠️</Text>
            <Text style={styles.menuText}>Allergies</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>📋</Text>
            <Text style={styles.menuText}>Medical History</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>🔔</Text>
            <Text style={styles.menuText}>Notifications</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>🔒</Text>
            <Text style={styles.menuText}>Privacy Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>📱</Text>
            <Text style={styles.menuText}>Connected Devices</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 20 },
  profileCard: { backgroundColor: '#007AFF', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: '#007AFF' },
  name: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  email: { fontSize: 14, color: '#B3D4FF', marginBottom: 2 },
  phone: { fontSize: 14, color: '#B3D4FF' },
  section: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 16, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  menuIcon: { fontSize: 20, marginRight: 12 },
  menuText: { fontSize: 16, color: '#333' },
  logoutButton: { backgroundColor: '#FF3B30', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 12 },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: '600' }
});
