// Profile Screen
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/store/auth';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const menuItems = [
    { icon: 'person-outline', title: 'My Profile', onPress: () => {} },
    { icon: 'document-text-outline', title: 'My Properties', onPress: () => {} },
    { icon: 'receipt-outline', title: 'Bookings', onPress: () => {} },
    { icon: 'chatbubbles-outline', title: 'Messages', onPress: () => {} },
    { icon: 'settings-outline', title: 'Settings', onPress: () => {} },
    { icon: 'help-circle-outline', title: 'Help & Support', onPress: () => {} },
    { icon: 'log-out-outline', title: 'Logout', onPress: logout, danger: true },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'G'}</Text>
        </View>
        <Text style={styles.name}>{user?.name || 'Guest User'}</Text>
        <Text style={styles.email}>{user?.email || 'Sign in to continue'}</Text>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Saved</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Views</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Referrals</Text>
        </View>
      </View>

      {/* Menu */}
      <View style={styles.menu}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <View style={styles.menuLeft}>
              <Ionicons
                name={item.icon as any}
                size={24}
                color={item.danger ? '#ef4444' : '#374151'}
              />
              <Text style={[styles.menuText, item.danger && styles.menuTextDanger]}>
                {item.title}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#0ea5e9', paddingTop: 60, paddingBottom: 24, alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#0ea5e9' },
  name: { fontSize: 20, fontWeight: 'bold', color: '#ffffff', marginTop: 12 },
  email: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  stats: { flexDirection: 'row', backgroundColor: '#ffffff', paddingVertical: 16, marginTop: -12, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  statDivider: { width: 1, backgroundColor: '#e5e7eb' },
  menu: { backgroundColor: '#ffffff', marginTop: 12, paddingVertical: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 16 },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuText: { fontSize: 16, color: '#374151', marginLeft: 12 },
  menuTextDanger: { color: '#ef4444' },
});
