import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export const DriverEarningsScreen: React.FC = () => {
  const todayEarnings = 1250;
  const weekEarnings = 8500;
  const trips = 28;
  const hoursOnline = 6;

  const recentTrips = [
    { id: '1', amount: 180, from: 'MG Road', time: '10:30 AM' },
    { id: '2', amount: 220, from: 'Koramangala', time: '9:15 AM' },
    { id: '3', amount: 150, from: 'Indiranagar', time: '8:00 AM' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Earnings</Text>
      </View>

      <View style={styles.todayCard}>
        <Text style={styles.todayLabel}>Today's Earnings</Text>
        <Text style={styles.todayAmount}>₹{todayEarnings}</Text>
        <View style={styles.todayStats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{trips}</Text>
            <Text style={styles.statLabel}>Trips</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{hoursOnline}h</Text>
            <Text style={styles.statLabel}>Online</Text>
          </View>
        </View>
      </View>

      <View style={styles.weekCard}>
        <Text style={styles.weekLabel}>This Week</Text>
        <Text style={styles.weekAmount}>₹{weekEarnings}</Text>
      </View>

      <Text style={styles.sectionTitle}>Recent Trips</Text>
      {recentTrips.map(trip => (
        <View key={trip.id} style={styles.tripCard}>
          <View>
            <Text style={styles.tripFrom}>{trip.from}</Text>
            <Text style={styles.tripTime}>{trip.time}</Text>
          </View>
          <Text style={styles.tripAmount}>+₹{trip.amount}</Text>
        </View>
      ))}

      <View style={styles.questCard}>
        <Text style={styles.questTitle}>Today's Quest</Text>
        <View style={styles.questProgress}>
          <View style={styles.questBar}>
            <View style={[styles.questFill, { width: '60%' }]} />
          </View>
          <Text style={styles.questText}>18/30 trips</Text>
        </View>
        <Text style={styles.questBonus}>+₹150 bonus on completion!</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: { padding: 20, paddingTop: 50 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  todayCard: { backgroundColor: '#22c55e', margin: 16, borderRadius: 16, padding: 24, alignItems: 'center' },
  todayLabel: { color: '#fff', opacity: 0.9, fontSize: 16 },
  todayAmount: { color: '#fff', fontSize: 48, fontWeight: 'bold', marginTop: 8 },
  todayStats: { flexDirection: 'row', marginTop: 16 },
  stat: { alignItems: 'center', marginHorizontal: 24 },
  statValue: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  statLabel: { color: '#fff', opacity: 0.8, marginTop: 4 },
  weekCard: { backgroundColor: '#2d2d44', margin: 16, marginTop: 0, borderRadius: 12, padding: 20, alignItems: 'center' },
  weekLabel: { color: '#9ca3af' },
  weekAmount: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginTop: 8 },
  sectionTitle: { color: '#9ca3af', fontSize: 16, marginLeft: 16, marginTop: 16, marginBottom: 8 },
  tripCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2d2d44', marginHorizontal: 16, marginVertical: 4, padding: 16, borderRadius: 12 },
  tripFrom: { color: '#fff', fontSize: 16, fontWeight: '600' },
  tripTime: { color: '#9ca3af', fontSize: 12, marginTop: 4 },
  tripAmount: { color: '#22c55e', fontSize: 18, fontWeight: 'bold' },
  questCard: { backgroundColor: '#2d2d44', margin: 16, padding: 20, borderRadius: 12 },
  questTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  questProgress: { marginTop: 12 },
  questBar: { height: 8, backgroundColor: '#4a4a6a', borderRadius: 4 },
  questFill: { height: 8, backgroundColor: '#fbbf24', borderRadius: 4 },
  questText: { color: '#9ca3af', marginTop: 8, fontSize: 12 },
  questBonus: { color: '#fbbf24', fontWeight: '600', marginTop: 8 },
});

export default DriverEarningsScreen;
