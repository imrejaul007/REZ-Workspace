/**
 * StayOwn Mobile - My Trips Screen
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';

const COLORS = { primary: '#6366F1', background: '#F9FAFB', white: '#FFFFFF', text: '#1F2937', textLight: '#6B7280', success: '#10B981' };

const TRIPS = [
  { id: '1', name: 'The Grand Palace', location: 'Mumbai', status: 'upcoming', checkin: 'Jun 1, 2026', checkout: 'Jun 3, 2026', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945' },
  { id: '2', name: 'Skyline Suites', location: 'Delhi', status: 'completed', checkin: 'May 15, 2026', checkout: 'May 17, 2026', image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa' },
];

export default function MyTripsScreen({ navigation }: any) {
  const renderTrip = ({ item }: any) => (
    <TouchableOpacity style={styles.tripCard}>
      <Image source={{ uri: item.image }} style={styles.tripImage} />
      <View style={styles.tripContent}>
        <View style={styles.statusBadge}>
          <Text style={[styles.statusText, item.status === 'upcoming' ? styles.upcoming : styles.completed]}>
            {item.status === 'upcoming' ? 'Upcoming' : 'Completed'}
          </Text>
        </View>
        <Text style={styles.tripName}>{item.name}</Text>
        <Text style={styles.tripLocation}>📍 {item.location}</Text>
        <Text style={styles.tripDates}>{item.checkin} → {item.checkout}</Text>
        {item.status === 'upcoming' && (
          <TouchableOpacity style={styles.checkinBtn} onPress={() => navigation.navigate('CheckIn', { bookingId: item.id })}>
            <Text style={styles.checkinBtnText}>Digital Check-in</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Trips</Text>
      <FlatList data={TRIPS} renderItem={renderTrip} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text, padding: 16 },
  list: { padding: 16, paddingTop: 0 },
  tripCard: { backgroundColor: COLORS.white, borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  tripImage: { width: '100%', height: 150 },
  tripContent: { padding: 16 },
  statusBadge: { position: 'absolute', top: -140, right: 16, backgroundColor: COLORS.white, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '600' },
  upcoming: { color: COLORS.success },
  completed: { color: COLORS.textLight },
  tripName: { fontSize: 18, fontWeight: '600', color: COLORS.text },
  tripLocation: { fontSize: 14, color: COLORS.textLight, marginTop: 4 },
  tripDates: { fontSize: 14, color: COLORS.text, marginTop: 8 },
  checkinBtn: { backgroundColor: COLORS.primary, padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  checkinBtnText: { color: COLORS.white, fontWeight: '600' },
});
