/**
 * StayOwn Staff App - Guest Detail Screen
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

const GUEST_DATA: Record<string, any> = {
  'g1': {
    id: 'g1',
    name: 'John Smith',
    phone: '+91 98765 43210',
    email: 'john.smith@email.com',
    room: '102',
    checkin: 'Jun 1, 2026',
    checkout: 'Jun 5, 2026',
    nights: 4,
    totalSpent: 24000,
    loyaltyTier: 'Gold',
    preferences: ['Extra pillows', 'Late checkout'],
    notes: 'VIP guest - birthday on Jun 3',
  },
};

export default function GuestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const guest = GUEST_DATA[id || 'g1'] || GUEST_DATA['g1'];

  return (
    <ScrollView style={styles.container}>
      {/* Guest Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {guest.name.split(' ').map(n => n[0]).join('')}
          </Text>
        </View>
        <Text style={styles.name}>{guest.name}</Text>
        <View style={styles.roomBadge}>
          <Text style={styles.roomIcon}>🚪</Text>
          <Text style={styles.roomText}>Room {guest.room}</Text>
        </View>
        <View style={styles.loyaltyBadge}>
          <Text style={styles.loyaltyIcon}>⭐</Text>
          <Text style={styles.loyaltyText}>{guest.loyaltyTier}</Text>
        </View>
      </View>

      {/* Contact Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📱</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{guest.phone}</Text>
            </View>
            <TouchableOpacity style={styles.callButton}>
              <Text style={styles.callIcon}>📞</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>✉️</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{guest.email}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Stay Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stay Details</Text>
        <View style={styles.infoCard}>
          <View style={styles.stayRow}>
            <View style={styles.stayItem}>
              <Text style={styles.stayLabel}>Check-in</Text>
              <Text style={styles.stayValue}>{guest.checkin}</Text>
            </View>
            <Text style={styles.stayArrow}>→</Text>
            <View style={styles.stayItem}>
              <Text style={styles.stayLabel}>Check-out</Text>
              <Text style={styles.stayValue}>{guest.checkout}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{guest.nights}</Text>
              <Text style={styles.statLabel}>Nights</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>₹{guest.totalSpent.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Total Spent</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Guest Preferences</Text>
        <View style={styles.preferencesCard}>
          {guest.preferences.map((pref: string, i: number) => (
            <View key={i} style={styles.preferenceTag}>
              <Text style={styles.preferenceText}>✓ {pref}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Notes */}
      {guest.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Important Notes</Text>
          <View style={styles.notesCard}>
            <Text style={styles.notesIcon}>📝</Text>
            <Text style={styles.notesText}>{guest.notes}</Text>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/messages')}
          >
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionLabel}>Send Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>🧹</Text>
            <Text style={styles.actionLabel}>Room Service</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>🛎️</Text>
            <Text style={styles.actionLabel}>Special Request</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionLabel}>View History</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  roomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  roomIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  roomText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  loyaltyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCD34D',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  loyaltyIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  loyaltyText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#1F2937',
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callIcon: {
    fontSize: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  stayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stayItem: {
    alignItems: 'center',
  },
  stayLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  stayValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  stayArrow: {
    fontSize: 24,
    color: '#D1D5DB',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  preferencesCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  preferenceTag: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  preferenceText: {
    color: '#065F46',
    fontSize: 14,
  },
  notesCard: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  notesIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  notesText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  bottomPadding: {
    height: 100,
  },
});
