/**
 * REZ Verify QR - Profile Screen
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { verifyQrApi } from '../services/verifyQrApi';

const menuItems = [
  { id: '1', icon: '📱', title: 'My Products', subtitle: 'View all verified products', route: '/' },
  { id: '2', icon: '🛡️', title: 'Warranties', subtitle: 'Manage your warranties', route: '/warranty' },
  { id: '3', icon: '📋', title: 'Claims History', subtitle: 'View claim status', route: '/claims' },
  { id: '4', icon: '📍', title: 'Service Centers', subtitle: 'Find nearby centers', route: '/service-center' },
  { id: '5', icon: '🔔', title: 'Notifications', subtitle: 'Manage alerts' },
  { id: '6', icon: '⚙️', title: 'Settings', subtitle: 'App preferences' },
  { id: '7', icon: '❓', title: 'Help & Support', subtitle: 'Get assistance' },
  { id: '8', icon: '📜', title: 'Terms & Privacy', subtitle: 'Legal documents' },
];

export default function ProfileScreen() {
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await verifyQrApi.getProfile();
      return response.success ? response.data : null;
    },
  });

  const { data: products } = useQuery({
    queryKey: ['my-products'],
    queryFn: async () => {
      const response = await verifyQrApi.getMyProducts();
      return response.success ? response.data || [] : [];
    },
  });

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await verifyQrApi.clearToken();
            // Navigate to login
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.name}>{profile?.name || 'User'}</Text>
          <Text style={styles.phone}>{profile?.phone || '+91 XXXXXXXXXX'}</Text>
          <Text style={styles.email}>{profile?.email || 'email@example.com'}</Text>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{products?.length || 0}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Claims</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Warranties</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menu}>
          {menuItems.map((item) => (
            <TouchableOpacity key={item.id} style={styles.menuItem}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
  },
  phone: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  email: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6366F1',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  menu: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  menuArrow: {
    fontSize: 24,
    color: '#CBD5E1',
  },
  logoutButton: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  version: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
