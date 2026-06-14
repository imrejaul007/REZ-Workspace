/**
 * StayOwn Staff App - Rooms Screen
 * Room management and status updates
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';

type RoomStatus = 'vacant-clean' | 'vacant-dirty' | 'occupied' | 'out-of-order' | 'occupied-cleaning';

const ROOMS = [
  { id: '101', floor: 1, type: 'Deluxe', status: 'vacant-clean' as RoomStatus, guest: null },
  { id: '102', floor: 1, type: 'Standard', status: 'occupied' as RoomStatus, guest: 'John D.' },
  { id: '103', floor: 1, type: 'Suite', status: 'vacant-dirty' as RoomStatus, guest: null },
  { id: '201', floor: 2, type: 'Standard', status: 'occupied-cleaning' as RoomStatus, guest: 'Sarah M.' },
  { id: '202', floor: 2, type: 'Deluxe', status: 'vacant-clean' as RoomStatus, guest: null },
  { id: '203', floor: 2, type: 'Suite', status: 'out-of-order' as RoomStatus, guest: null },
  { id: '301', floor: 3, type: 'Standard', status: 'vacant-dirty' as RoomStatus, guest: null },
  { id: '302', floor: 3, type: 'Deluxe', status: 'occupied' as RoomStatus, guest: 'Mike R.' },
];

const STATUS_CONFIG = {
  'vacant-clean': { label: 'Vacant Clean', color: '#10B981', icon: '✨' },
  'vacant-dirty': { label: 'Needs Cleaning', color: '#F59E0B', icon: '🧹' },
  'occupied': { label: 'Occupied', color: '#6366F1', icon: '🛏️' },
  'occupied-cleaning': { label: 'In Cleaning', color: '#8B5CF6', icon: '🔄' },
  'out-of-order': { label: 'Out of Order', color: '#EF4444', icon: '🚫' },
};

export default function RoomsScreen() {
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const floors = [...new Set(ROOMS.map(r => r.floor))];
  const filteredRooms = ROOMS.filter(room => {
    const matchesFloor = selectedFloor === null || room.floor === selectedFloor;
    const matchesSearch = searchQuery === '' ||
      room.id.includes(searchQuery) ||
      room.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFloor && matchesSearch;
  });

  const getStatusInfo = (status: RoomStatus) => STATUS_CONFIG[status];

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search rooms..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Floor Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.floorFilter}>
        <TouchableOpacity
          style={[styles.floorChip, selectedFloor === null && styles.floorChipActive]}
          onPress={() => setSelectedFloor(null)}
        >
          <Text style={[styles.floorChipText, selectedFloor === null && styles.floorChipTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        {floors.map(floor => (
          <TouchableOpacity
            key={floor}
            style={[styles.floorChip, selectedFloor === floor && styles.floorChipActive]}
            onPress={() => setSelectedFloor(floor)}
          >
            <Text style={[styles.floorChipText, selectedFloor === floor && styles.floorChipTextActive]}>
              Floor {floor}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Room Grid */}
      <ScrollView style={styles.roomList}>
        <View style={styles.roomGrid}>
          {filteredRooms.map(room => {
            const statusInfo = getStatusInfo(room.status);
            return (
              <TouchableOpacity
                key={room.id}
                style={styles.roomCard}
                onPress={() => router.push(`/room/${room.id}`)}
              >
                <View style={styles.roomHeader}>
                  <Text style={styles.roomNumber}>{room.id}</Text>
                  <Text style={styles.roomIcon}>{statusInfo.icon}</Text>
                </View>
                <Text style={styles.roomType}>{room.type}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
                  <Text style={[styles.statusText, { color: statusInfo.color }]}>
                    {statusInfo.label}
                  </Text>
                </View>
                {room.guest && (
                  <Text style={styles.guestName}>👤 {room.guest}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
          <View key={key} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: config.color }]} />
            <Text style={styles.legendText}>{config.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  floorFilter: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  floorChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  floorChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  floorChipText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  floorChipTextActive: {
    color: '#fff',
  },
  roomList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  roomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  roomCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roomNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  roomIcon: {
    fontSize: 20,
  },
  roomType: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  guestName: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: '#6B7280',
  },
});
