// Habixo User Profile Screen
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Image } from 'react-native';
import { useRouter } from 'expo-router';

export default function HabixoProfile() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Profile Header */}
        <View style={styles.header}>
          <Image source={{ uri: 'https://i.pravatar.cc/100?img=12' }} style={styles.avatar} />
          <Text style={styles.name}>Rahul Sharma</Text>
          <Text style={styles.email}>rahul@email.com</Text>
          <Text style={styles.memberSince}>Member since 2024</Text>
        </View>

        {/* Trust Score */}
        <View style={styles.trustCard}>
          <Text style={styles.trustTitle}>🛡️ Habixo Trust Score</Text>
          <View style={styles.trustScore}>
            <Text style={styles.scoreValue}>94</Text>
            <Text style={styles.scoreLabel}>/100</Text>
          </View>
          <Text style={styles.trustLevel}>Exceptional</Text>
        </View>

        {/* Karma Level */}
        <View style={styles.karmaCard}>
          <Text style={styles.karmaTitle}>⭐ Karma Level</Text>
          <Text style={styles.karmaLevel}>Level 3 - Valued</Text>
          <Text style={styles.karmaPoints}>12,500 karma points</Text>
        </View>

        {/* Coins */}
        <View style={styles.coinsCard}>
          <Text style={styles.coinsTitle}>🪙 REZ Coins</Text>
          <Text style={styles.coinsValue}>2,340 coins</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>8</Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>5</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.settings}>
          <TouchableOpacity style={styles.settingsRow}>
            <Text style={styles.settingsIcon}>👤</Text>
            <Text style={styles.settingsText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsRow}>
            <Text style={styles.settingsIcon}>💳</Text>
            <Text style={styles.settingsText}>Payment Methods</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsRow}>
            <Text style={styles.settingsIcon}>🔔</Text>
            <Text style={styles.settingsText}>Notifications</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsRow}>
            <Text style={styles.settingsIcon}>❓</Text>
            <Text style={styles.settingsText}>Help & Support</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.settingsRow, styles.logoutRow]}>
            <Text style={[styles.settingsIcon, styles.logoutText]}>🚪</Text>
            <Text style={[styles.settingsText, styles.logoutText]}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { backgroundColor: '#6366f1', padding: 30, alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 12, borderWidth: 3, borderColor: '#fff' },
  name: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  email: { fontSize: 14, color: '#e0e7ff', marginBottom: 4 },
  memberSince: { fontSize: 12, color: '#c7d2fe' },
  trustCard: { backgroundColor: '#fff', margin: 16, padding: 20, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  trustTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 12 },
  trustScore: { flexDirection: 'row', alignItems: 'baseline' },
  scoreValue: { fontSize: 48, fontWeight: 'bold', color: '#10b981' },
  scoreLabel: { fontSize: 24, color: '#6b7280' },
  trustLevel: { fontSize: 14, color: '#10b981', fontWeight: '600', marginTop: 4 },
  karmaCard: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 16, padding: 16, borderRadius: 12, alignItems: 'center' },
  karmaTitle: { fontSize: 14, color: '#6b7280', marginBottom: 4 },
  karmaLevel: { fontSize: 18, fontWeight: 'bold', color: '#7c3aed' },
  karmaPoints: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  coinsCard: { backgroundColor: '#fef3c7', marginHorizontal: 16, marginBottom: 16, padding: 16, borderRadius: 12, alignItems: 'center' },
  coinsTitle: { fontSize: 14, color: '#92400e', marginBottom: 4 },
  coinsValue: { fontSize: 24, fontWeight: 'bold', color: '#92400e' },
  statsRow: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 12, padding: 16, marginBottom: 16 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  settings: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 12, overflow: 'hidden' },
  settingsRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  settingsIcon: { fontSize: 20, marginRight: 12 },
  settingsText: { fontSize: 16, color: '#1f2937', flex: 1 },
  logoutRow: { borderBottomWidth: 0 },
  logoutText: { color: '#ef4444' },
});
