/**
 * StayOwn Mobile - Services Screen
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';

const COLORS = { primary: '#6366F1', background: '#F9FAFB', white: '#FFFFFF', text: '#1F2937', textLight: '#6B7280', success: '#10B981' };

const SERVICES = [
  { id: '1', name: 'Room Service', icon: '🍽️', description: 'Order food & beverages to your room' },
  { id: '2', name: 'Housekeeping', icon: '🧹', description: 'Request room cleaning' },
  { id: '3', name: 'Spa Booking', icon: '💆', description: 'Book spa treatments' },
  { id: '4', name: 'Restaurant', icon: '🍴', description: 'Reserve a table' },
  { id: '5', name: 'Airport Transfer', icon: '🚗', description: 'Book airport pickup/drop' },
  { id: '6', name: 'Late Checkout', icon: '⏰', description: 'Request late check-out' },
];

export default function ServicesScreen({ route, navigation }: any) {
  const handleServicePress = (service: any) => {
    Alert.alert(service.name, service.description + '\n\nThis feature is coming soon!');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hotel Services</Text>
        <Text style={styles.subtitle}>Room 201 • Check-out: Jun 3, 2026</Text>
      </View>

      <View style={styles.grid}>
        {SERVICES.map((service) => (
          <TouchableOpacity key={service.id} style={styles.serviceCard} onPress={() => handleServicePress(service)}>
            <Text style={styles.serviceIcon}>{service.icon}</Text>
            <Text style={styles.serviceName}>{service.name}</Text>
            <Text style={styles.serviceDesc}>{service.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionIcon}>📞</Text>
          <Text style={styles.actionText}>Call Front Desk</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionText}>Chat with Hotel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionIcon}>🎒</Text>
          <Text style={styles.actionText}>Luggage Storage</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.white, padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textLight, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12 },
  serviceCard: { width: '50%', padding: 8 },
  serviceIcon: { fontSize: 40, textAlign: 'center', marginBottom: 8 },
  serviceName: { fontSize: 14, fontWeight: '600', color: COLORS.text, textAlign: 'center' },
  serviceDesc: { fontSize: 11, color: COLORS.textLight, textAlign: 'center', marginTop: 4 },
  quickActions: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: 16, borderRadius: 12, marginBottom: 8 },
  actionIcon: { fontSize: 24, marginRight: 12 },
  actionText: { fontSize: 15, color: COLORS.text },
});
