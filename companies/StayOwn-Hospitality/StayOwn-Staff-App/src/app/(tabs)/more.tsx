/**
 * StayOwn Staff App - Settings/More Screen
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '../../context/AppContext';

export default function MoreScreen() {
  const { staffInfo, setAuthenticated } = useAppStore();
  const [offlineMode, setOfflineMode] = React.useState(true);
  const [notifications, setNotifications] = React.useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            setAuthenticated(false);
            router.replace('/');
          },
        },
      ]
    );
  };

  const menuItems = [
    { icon: '👤', label: 'My Profile', action: () => Alert.alert('Profile', 'Coming soon!') },
    { icon: '📅', label: 'My Schedule', action: () => Alert.alert('Schedule', 'Coming soon!') },
    { icon: '📊', label: 'My Performance', action: () => Alert.alert('Performance', 'Coming soon!') },
    { icon: '🔔', label: 'Notifications', toggle: true, value: notifications, onToggle: setNotifications },
    { icon: '📴', label: 'Offline Mode', toggle: true, value: offlineMode, onToggle: setOfflineMode },
  ];

  const adminItems = [
    { icon: '🔑', label: 'Admin Panel', action: () => Alert.alert('Admin', 'Contact admin for access') },
    { icon: '📈', label: 'Analytics', action: () => Alert.alert('Analytics', 'Coming soon!') },
    { icon: '⚙️', label: 'Hotel Settings', action: () => Alert.alert('Settings', 'Coming soon!') },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {staffInfo?.name?.charAt(0) || 'S'}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{staffInfo?.name || 'Staff Member'}</Text>
          <Text style={styles.profileRole}>{staffInfo?.department || 'Hotel Staff'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>
              {(staffInfo?.role || 'staff').toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* Menu Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Account</Text>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.action}
            disabled={item.toggle}
          >
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </View>
            {item.toggle ? (
              <Switch
                value={item.value}
                onValueChange={item.onToggle}
                trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
                thumbColor={item.value ? '#2563EB' : '#9CA3AF'}
              />
            ) : (
              <Text style={styles.menuChevron}>›</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Admin Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Management</Text>
        {adminItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.action}
          >
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </View>
            <Text style={styles.menuChevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Help', 'Contact support@stayown.com')}>
          <View style={styles.menuItemLeft}>
            <Text style={styles.menuIcon}>❓</Text>
            <Text style={styles.menuLabel}>Help & Support</Text>
          </View>
          <Text style={styles.menuChevron}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('About', 'StayOwn Staff v1.0.0')}>
          <View style={styles.menuItemLeft}>
            <Text style={styles.menuIcon}>ℹ️</Text>
            <Text style={styles.menuLabel}>About</Text>
          </View>
          <Text style={styles.menuChevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutIcon}>🚪</Text>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* Version */}
      <Text style={styles.version}>StayOwn Staff v1.0.0</Text>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4F46E5',
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingVertical: 12,
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 14,
    width: 24,
    textAlign: 'center',
  },
  menuLabel: {
    fontSize: 16,
    color: '#1F2937',
  },
  menuChevron: {
    fontSize: 24,
    color: '#D1D5DB',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  logoutIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  version: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 24,
    marginBottom: 8,
  },
  bottomPadding: {
    height: 100,
  },
});
