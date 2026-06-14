/**
 * Airzy Itinerary Screen
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function ItineraryScreen() {
  const upcomingTrips = [
    { id: '1', name: 'Bangalore → Delhi', dates: 'May 25-27', status: 'confirmed', segments: 3 },
    { id: '2', name: 'Mumbai Business Trip', dates: 'Jun 10-12', status: 'planning', segments: 5 },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Trips</Text>
        <TouchableOpacity style={styles.createButton}>
          <Text style={styles.createButtonText}>+ Create Trip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming</Text>
        {upcomingTrips.map(trip => (
          <TouchableOpacity key={trip.id} style={styles.tripCard}>
            <View style={styles.tripHeader}>
              <Text style={styles.tripName}>{trip.name}</Text>
              <View style={[styles.statusBadge, trip.status === 'confirmed' ? styles.confirmedBadge : styles.planningBadge]}>
                <Text style={styles.statusText}>{trip.status}</Text>
              </View>
            </View>
            <Text style={styles.tripDates}>{trip.dates}</Text>
            <Text style={styles.tripSegments}>{trip.segments} segments</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>🗺️</Text>
        <Text style={styles.emptyTitle}>Plan Your Next Adventure</Text>
        <Text style={styles.emptyText}>Create a trip and manage all your travel in one place</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  createButton: { backgroundColor: '#6366F1', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  createButtonText: { color: '#FFFFFF', fontWeight: '600' },
  section: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  tripCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 12 },
  tripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tripName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  confirmedBadge: { backgroundColor: '#DCFCE7' },
  planningBadge: { backgroundColor: '#FEF3C7' },
  statusText: { fontSize: 11, fontWeight: '600', color: '#16A34A' },
  tripDates: { fontSize: 14, color: '#6B7280', marginTop: 8 },
  tripSegments: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  emptyState: { alignItems: 'center', padding: 40, marginTop: 40 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
});
