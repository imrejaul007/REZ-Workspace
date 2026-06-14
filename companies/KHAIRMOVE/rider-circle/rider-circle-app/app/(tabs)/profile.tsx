import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/auth';

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.displayName?.split(' ').map(n => n[0]).join('') || 'RC'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.displayName || 'Rider'}</Text>
        <Text style={styles.location}>📍 Bangalore, Karnataka</Text>
        <View style={styles.trustBadge}>
          <Text style={styles.trustScore}>⭐ Trust Score: {user?.trustScore || 78}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <StatItem value="127" label="Rides" />
        <StatItem value="8,420" label="KM" />
        <StatItem value="5" label="Groups" />
        <StatItem value="12" label="Badges" />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/profile/safeqr')}
        >
          <Text style={styles.menuIcon}>🔐</Text>
          <Text style={styles.menuText}>SafeQR Code</Text>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/profile/bikes')}
        >
          <Text style={styles.menuIcon}>🏍️</Text>
          <Text style={styles.menuText}>My Bikes</Text>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/ride/history')}
        >
          <Text style={styles.menuIcon}>📊</Text>
          <Text style={styles.menuText}>Ride History</Text>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/profile/emergency')}
        >
          <Text style={styles.menuIcon}>🛡️</Text>
          <Text style={styles.menuText}>Emergency Contacts</Text>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Community */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Community</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/community/groups')}
        >
          <Text style={styles.menuIcon}>👥</Text>
          <Text style={styles.menuText}>My Groups</Text>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/community/events')}
        >
          <Text style={styles.menuIcon}>📅</Text>
          <Text style={styles.menuText}>My Events</Text>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/profile/memories')}
        >
          <Text style={styles.menuIcon}>📖</Text>
          <Text style={styles.menuText}>My Memories</Text>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/profile/settings')}
        >
          <Text style={styles.menuIcon}>⚙️</Text>
          <Text style={styles.menuText}>App Settings</Text>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/profile/edit')}
        >
          <Text style={styles.menuIcon}>✏️</Text>
          <Text style={styles.menuText}>Edit Profile</Text>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/help')}
        >
          <Text style={styles.menuIcon}>❓</Text>
          <Text style={styles.menuText}>Help & Support</Text>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Version */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>RiderCircle v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16213e',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e94560',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
  },
  trustBadge: {
    backgroundColor: '#0f3460',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  trustScore: {
    color: '#facc15',
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1a1a2e',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#888',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  menuArrow: {
    fontSize: 16,
    color: '#666',
  },
  versionContainer: {
    alignItems: 'center',
    padding: 24,
  },
  versionText: {
    fontSize: 12,
    color: '#666',
  },
});