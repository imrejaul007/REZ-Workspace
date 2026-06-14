/**
 * StayOwn Staff App - Room Detail Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

const ROOM_DATA: Record<string, any> = {
  '101': { id: '101', type: 'Deluxe', floor: 1, status: 'vacant-clean', guest: null, notes: [] },
  '102': { id: '102', type: 'Standard', floor: 1, status: 'occupied', guest: { name: 'John Smith', checkin: 'Jun 1', checkout: 'Jun 5' }, notes: ['VIP guest'] },
  '103': { id: '103', type: 'Suite', floor: 1, status: 'vacant-dirty', guest: null, notes: [] },
  '201': { id: '201', type: 'Standard', floor: 2, status: 'occupied-cleaning', guest: { name: 'Sarah M.' }, notes: [] },
  '202': { id: '202', type: 'Deluxe', floor: 2, status: 'vacant-clean', guest: null, notes: [] },
  '205': { id: '205', type: 'Suite', floor: 2, status: 'occupied', guest: { name: 'Mike R.', checkin: 'May 30', checkout: 'Jun 3' }, notes: ['Early check-in requested'] },
  '302': { id: '302', type: 'Deluxe', floor: 3, status: 'vacant-dirty', guest: null, notes: ['Maintenance required - AC'] },
};

const STATUS_OPTIONS = [
  { value: 'vacant-clean', label: 'Vacant Clean', icon: '✨', color: '#10B981' },
  { value: 'vacant-dirty', label: 'Needs Cleaning', icon: '🧹', color: '#F59E0B' },
  { value: 'occupied', label: 'Occupied', icon: '🛏️', color: '#6366F1' },
  { value: 'occupied-cleaning', label: 'Cleaning in Progress', icon: '🔄', color: '#8B5CF6' },
  { value: 'out-of-order', label: 'Out of Order', icon: '🚫', color: '#EF4444' },
];

export default function RoomDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [room, setRoom] = useState(ROOM_DATA[id || '101'] || ROOM_DATA['101']);

  const updateStatus = (newStatus: string) => {
    setRoom(prev => ({ ...prev, status: newStatus }));
    Alert.alert('Updated', `Room status changed to ${newStatus.replace('-', ' ')}`);
  };

  const currentStatus = STATUS_OPTIONS.find(s => s.value === room.status);

  return (
    <ScrollView style={styles.container}>
      {/* Room Header */}
      <View style={styles.header}>
        <View style={styles.roomInfo}>
          <Text style={styles.roomNumber}>Room {room.id}</Text>
          <Text style={styles.roomType}>{room.type} • Floor {room.floor}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: currentStatus?.color + '20' }]}>
          <Text style={styles.statusIcon}>{currentStatus?.icon}</Text>
          <Text style={[styles.statusText, { color: currentStatus?.color }]}>
            {currentStatus?.label}
          </Text>
        </View>
      </View>

      {/* Guest Info */}
      {room.guest && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Guest</Text>
          <View style={styles.guestCard}>
            <View style={styles.guestAvatar}>
              <Text style={styles.guestInitial}>
                {room.guest.name.charAt(0)}
              </Text>
            </View>
            <View style={styles.guestInfo}>
              <Text style={styles.guestName}>{room.guest.name}</Text>
              {room.guest.checkin && (
                <Text style={styles.guestDates}>
                  📅 {room.guest.checkin} → {room.guest.checkout}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.messageButton}
              onPress={() => router.push('/(tabs)/messages')}
            >
              <Text style={styles.messageIcon}>💬</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => updateStatus('vacant-clean')}
          >
            <Text style={styles.actionIcon}>✅</Text>
            <Text style={styles.actionLabel}>Mark Clean</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => updateStatus('occupied-cleaning')}
          >
            <Text style={styles.actionIcon}>🧹</Text>
            <Text style={styles.actionLabel}>Start Cleaning</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/scan')}
          >
            <Text style={styles.actionIcon}>📷</Text>
            <Text style={styles.actionLabel}>Scan QR</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonDanger]}
            onPress={() => updateStatus('out-of-order')}
          >
            <Text style={styles.actionIcon}>🚫</Text>
            <Text style={styles.actionLabel}>Report Issue</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Status Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Change Status</Text>
        <View style={styles.statusGrid}>
          {STATUS_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.statusOption,
                room.status === option.value && styles.statusOptionActive,
                { borderColor: option.color }
              ]}
              onPress={() => updateStatus(option.value)}
            >
              <Text style={styles.statusOptionIcon}>{option.icon}</Text>
              <Text style={[
                styles.statusOptionLabel,
                room.status === option.value && { color: option.color }
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Room Notes */}
      {room.notes && room.notes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Room Notes</Text>
          {room.notes.map((note: string, i: number) => (
            <View key={i} style={styles.noteCard}>
              <Text style={styles.noteText}>📝 {note}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Maintenance Request */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Maintenance</Text>
        <TouchableOpacity style={styles.maintenanceButton}>
          <Text style={styles.maintenanceIcon}>🔧</Text>
          <View style={styles.maintenanceContent}>
            <Text style={styles.maintenanceLabel}>Report Maintenance Issue</Text>
            <Text style={styles.maintenanceHint}>AC, plumbing, electrical, etc.</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    padding: 20,
    paddingTop: 60,
  },
  roomInfo: {},
  roomNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  roomType: {
    fontSize: 14,
    color: '#BFDBFE',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
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
  guestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  guestAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  guestInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  guestInfo: {
    flex: 1,
  },
  guestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  guestDates: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  messageButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageIcon: {
    fontSize: 20,
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
  actionButtonDanger: {
    backgroundColor: '#FEE2E2',
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
  statusGrid: {
    gap: 8,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  statusOptionActive: {
    borderWidth: 2,
  },
  statusOptionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  statusOptionLabel: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  noteCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  noteText: {
    fontSize: 14,
    color: '#92400E',
  },
  maintenanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  maintenanceIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  maintenanceContent: {
    flex: 1,
  },
  maintenanceLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  maintenanceHint: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    color: '#D1D5DB',
  },
  bottomPadding: {
    height: 100,
  },
});
