// Habixo Host Settings Screen
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Switch, Image } from 'react-native';
import { useRouter } from 'expo-router';

const SETTINGS_SECTIONS = [
  {
    title: 'Account',
    items: [
      { icon: '👤', title: 'Profile', subtitle: 'Edit your profile', action: 'arrow' },
      { icon: '🔐', title: 'Security', subtitle: 'Password, 2FA', action: 'arrow' },
      { icon: '📧', title: 'Notifications', subtitle: 'Email & push notifications', action: 'arrow' },
    ],
  },
  {
    title: 'Hosting',
    items: [
      { icon: '🏠', title: 'Listings', subtitle: 'Manage your properties', action: 'arrow' },
      { icon: '📅', title: 'Calendar', subtitle: 'Sync calendars', action: 'arrow' },
      { icon: '💲', title: 'Pricing', subtitle: 'Smart pricing settings', action: 'arrow' },
      { icon: '🔄', title: 'Co-hosts', subtitle: 'Manage co-host access', action: 'arrow' },
    ],
  },
  {
    title: 'Payment',
    items: [
      { icon: '💳', title: 'Payout Methods', subtitle: 'Bank account, UPI', action: 'arrow' },
      { icon: '🧾', title: 'Tax Info', subtitle: 'GSTIN, PAN', action: 'arrow' },
    ],
  },
  {
    title: 'Trust & Safety',
    items: [
      { icon: '🛡️', title: 'Insurance', subtitle: 'Host protection', action: 'arrow' },
      { icon: '⚠️', title: 'Safety', subtitle: 'Safety tools', action: 'arrow' },
    ],
  },
];

const TOGGLE_SETTINGS = [
  { icon: '📍', title: 'Instant Booking', subtitle: 'Let guests book instantly', enabled: false },
  { icon: '🔔', title: 'Booking Alerts', subtitle: 'Get notified of new bookings', enabled: true },
  { icon: '💬', title: 'Auto-Message', subtitle: 'Send automated messages', enabled: true },
  { icon: '📊', title: 'Marketing', subtitle: 'Appear in search results', enabled: true },
];

const HOST_PROFILE = {
  name: 'Rahul Sharma',
  email: 'rahul@habixo.com',
  phone: '+91 98765 43210',
  avatar: 'https://i.pravatar.cc/100?img=12',
  verified: true,
  superhost: true,
  memberSince: 'January 2024',
};

export default function HabixoSettings() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Image source={{ uri: HOST_PROFILE.avatar }} style={styles.avatar} />
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{HOST_PROFILE.name}</Text>
              {HOST_PROFILE.verified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>✓</Text>
                </View>
              )}
            </View>
            <Text style={styles.email}>{HOST_PROFILE.email}</Text>
            <Text style={styles.memberSince}>Host since {HOST_PROFILE.memberSince}</Text>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Properties</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>127</Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>4.8</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        {/* Toggles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Settings</Text>
          {TOGGLE_SETTINGS.map((setting, index) => (
            <View key={index} style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleIcon}>{setting.icon}</Text>
                <View>
                  <Text style={styles.toggleTitle}>{setting.title}</Text>
                  <Text style={styles.toggleSubtitle}>{setting.subtitle}</Text>
                </View>
              </View>
              <Switch
                value={setting.enabled}
                trackColor={{ false: '#e5e7eb', true: '#a5b4fc' }}
                thumbColor={setting.enabled ? '#6366f1' : '#f4f4f5'}
              />
            </View>
          ))}
        </View>

        {/* Settings Sections */}
        {SETTINGS_SECTIONS.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.settingsCard}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.settingsRow,
                    itemIndex < section.items.length - 1 && styles.settingsRowBorder,
                  ]}
                >
                  <View style={styles.settingsInfo}>
                    <Text style={styles.settingsIcon}>{item.icon}</Text>
                    <View>
                      <Text style={styles.settingsTitle}>{item.title}</Text>
                      <Text style={styles.settingsSubtitle}>{item.subtitle}</Text>
                    </View>
                  </View>
                  <Text style={styles.arrow}>→</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.settingsRow}>
              <View style={styles.settingsInfo}>
                <Text style={styles.settingsIcon}>❓</Text>
                <View>
                  <Text style={styles.settingsTitle}>Help Center</Text>
                  <Text style={styles.settingsSubtitle}>FAQs and guides</Text>
                </View>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.settingsRow, styles.settingsRowBorder]}>
              <View style={styles.settingsInfo}>
                <Text style={styles.settingsIcon}>💬</Text>
                <View>
                  <Text style={styles.settingsTitle}>Contact Support</Text>
                  <Text style={styles.settingsSubtitle}>Chat with us</Text>
                </View>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.version}>Habixo Host v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  profileCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  verifiedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  memberSince: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  section: {
    padding: 16,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  toggleSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  settingsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  settingsRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  settingsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  settingsSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  arrow: {
    fontSize: 18,
    color: '#9ca3af',
  },
  logoutButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9ca3af',
    paddingBottom: 32,
  },
});
