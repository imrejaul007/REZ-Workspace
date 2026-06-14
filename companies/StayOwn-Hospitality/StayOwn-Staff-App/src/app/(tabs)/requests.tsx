/**
 * StayOwn Staff App - Requests Screen
 * Service requests management
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

type RequestType = 'cleaning' | 'maintenance' | 'service' | 'check-in' | 'check-out';
type RequestStatus = 'pending' | 'in-progress' | 'completed';

const REQUESTS = [
  { id: '1', room: '101', type: 'cleaning' as RequestType, status: 'pending' as RequestStatus, time: '10:30 AM', priority: 'high', description: 'Deep cleaning required' },
  { id: '2', room: '205', type: 'maintenance' as RequestType, status: 'in-progress' as RequestStatus, time: '09:15 AM', priority: 'normal', description: 'AC not cooling properly' },
  { id: '3', room: '302', type: 'service' as RequestType, status: 'pending' as RequestStatus, time: '11:00 AM', priority: 'low', description: 'Extra towels needed' },
  { id: '4', room: '104', type: 'check-in' as RequestType, status: 'pending' as RequestStatus, time: '12:00 PM', priority: 'high', description: 'VIP guest arrival' },
  { id: '5', room: '201', type: 'check-out' as RequestType, status: 'completed' as RequestStatus, time: '08:00 AM', priority: 'normal', description: 'Standard checkout' },
];

const TYPE_CONFIG = {
  cleaning: { icon: '🧹', label: 'Cleaning' },
  maintenance: { icon: '🔧', label: 'Maintenance' },
  service: { icon: '🛎️', label: 'Service' },
  'check-in': { icon: '📥', label: 'Check-in' },
  'check-out': { icon: '📤', label: 'Check-out' },
};

const STATUS_CONFIG = {
  pending: { color: '#F59E0B', label: 'Pending' },
  'in-progress': { color: '#6366F1', label: 'In Progress' },
  completed: { color: '#10B981', label: 'Completed' },
};

const PRIORITY_CONFIG = {
  high: '#EF4444',
  normal: '#F59E0B',
  low: '#10B981',
};

export default function RequestsScreen() {
  const [filter, setFilter] = useState<RequestStatus | 'all'>('all');
  const [requests, setRequests] = useState(REQUESTS);

  const filteredRequests = filter === 'all'
    ? requests
    : requests.filter(r => r.status === filter);

  const updateStatus = (id: string, newStatus: RequestStatus) => {
    setRequests(prev =>
      prev.map(r => r.id === id ? { ...r, status: newStatus } : r)
    );
  };

  const handleAction = (request: typeof REQUESTS[0]) => {
    if (request.status === 'completed') {
      Alert.alert('Completed', 'This request has already been completed.');
      return;
    }

    const nextStatus: RequestStatus = request.status === 'pending' ? 'in-progress' : 'completed';
    Alert.alert(
      `${nextStatus === 'completed' ? 'Complete' : 'Start'} Request`,
      `Mark this ${TYPE_CONFIG[request.type].label} request for Room ${request.room} as ${STATUS_CONFIG[nextStatus].label}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => updateStatus(request.id, nextStatus) },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'pending', 'in-progress', 'completed'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'All' : STATUS_CONFIG[f].label}
            </Text>
            {f !== 'all' && (
              <View style={[styles.filterBadge, { backgroundColor: STATUS_CONFIG[f].color }]}>
                <Text style={styles.filterBadgeText}>
                  {requests.filter(r => r.status === f).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Requests List */}
      <ScrollView style={styles.list}>
        {filteredRequests.map((request) => {
          const typeConfig = TYPE_CONFIG[request.type];
          const statusConfig = STATUS_CONFIG[request.status];
          const priorityColor = PRIORITY_CONFIG[request.priority];

          return (
            <View key={request.id} style={styles.card}>
              <View style={[styles.priorityIndicator, { backgroundColor: priorityColor }]} />

              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <View style={styles.roomBadge}>
                    <Text style={styles.roomIcon}>🚪</Text>
                    <Text style={styles.roomText}>Room {request.room}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '20' }]}>
                    <Text style={[styles.statusText, { color: statusConfig.color }]}>
                      {statusConfig.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.typeRow}>
                  <Text style={styles.typeIcon}>{typeConfig.icon}</Text>
                  <Text style={styles.typeLabel}>{typeConfig.label}</Text>
                  <Text style={styles.timeText}>{request.time}</Text>
                </View>

                <Text style={styles.description}>{request.description}</Text>

                <View style={styles.cardFooter}>
                  <View style={styles.priorityTag}>
                    <Text style={[styles.priorityText, { color: priorityColor }]}>
                      {request.priority.toUpperCase()}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: statusConfig.color },
                    ]}
                    onPress={() => handleAction(request)}
                  >
                    <Text style={styles.actionButtonText}>
                      {request.status === 'pending' ? 'Start' :
                       request.status === 'in-progress' ? 'Complete' : 'Done'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addButtonIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  filterTabActive: {
    backgroundColor: '#2563EB',
  },
  filterText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  filterBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  list: {
    flex: 1,
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  priorityIndicator: {
    width: 4,
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  roomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  roomText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  typeLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  timeText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonIcon: {
    fontSize: 32,
    color: '#fff',
    marginTop: -2,
  },
});
