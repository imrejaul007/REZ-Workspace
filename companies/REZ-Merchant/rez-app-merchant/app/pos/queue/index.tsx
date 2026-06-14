/**
 * Walk-in Queue Management
 * Indian salons get 60-70% walk-ins without appointments
 * This module manages the queue efficiently
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '@/constants/DesignTokens';

interface QueueCustomer {
  id: string;
  name: string;
  phone?: string;
  service: string;
  preferredStylist?: string;
  joinedAt: Date;
  estimatedWait: number;
  status: 'waiting' | 'called' | 'in_service' | 'completed';
  position: number;
}

const AVG_SERVICE_TIME = 30; // minutes per service

export default function QueueScreen() {
  const [queue, setQueue] = useState<QueueCustomer[]>([]);
  const [currentServing, setCurrentServing] = useState<QueueCustomer | null>(null);
  const [completedToday, setCompletedToday] = useState(0);

  useEffect(() => {
    // Initialize with some mock customers
    setQueue([
      { id: '1', name: 'Priya', service: 'Haircut', joinedAt: new Date(), estimatedWait: 0, status: 'waiting', position: 1 },
      { id: '2', name: 'Anita', service: 'Hair Coloring', joinedAt: new Date(), estimatedWait: 30, status: 'waiting', position: 2 },
      { id: '3', name: 'Meera', service: 'Facial', joinedAt: new Date(), estimatedWait: 60, status: 'waiting', position: 3 },
    ]);
  }, []);

  const updateWaitTimes = () => {
    setQueue(prev => prev.map((customer, idx) => ({
      ...customer,
      position: idx + 1,
      estimatedWait: idx * AVG_SERVICE_TIME,
    })));
  };

  const addToQueue = (name: string, service: string, stylist?: string) => {
    const newCustomer: QueueCustomer = {
      id: Date.now().toString(),
      name,
      service,
      preferredStylist: stylist,
      joinedAt: new Date(),
      estimatedWait: queue.length * AVG_SERVICE_TIME,
      status: 'waiting',
      position: queue.length + 1,
    };

    setQueue([...queue, newCustomer]);
    updateWaitTimes();
  };

  const callNext = () => {
    if (queue.length === 0) {
      Alert.alert('Queue Empty', 'No customers waiting');
      return;
    }

    const next = queue[0];
    setQueue(queue.slice(1).map((c, idx) => ({
      ...c,
      position: idx + 1,
      estimatedWait: idx * AVG_SERVICE_TIME,
    })));

    setCurrentServing({ ...next, status: 'in_service' });
    updateWaitTimes();
  };

  const completeService = () => {
    if (!currentServing) return;

    setCompletedToday(prev => prev + 1);
    setCurrentServing(null);
  };

  const noShow = () => {
    if (!currentServing) return;

    // Put back at front of queue
    setQueue([
      { ...currentServing, status: 'waiting' },
      ...queue,
    ]);
    setCurrentServing(null);
  };

  const formatTime = (minutes: number) => {
    if (minutes === 0) return 'Now';
    if (minutes < 60) return `${minutes} min`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
  };

  const getTimeSinceJoined = (joinedAt: Date) => {
    const mins = Math.floor((Date.now() - joinedAt.getTime()) / 60000);
    return `${mins} min ago`;
  };

  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{queue.length}</Text>
          <Text style={styles.statLabel}>In Queue</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{completedToday}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {queue.length > 0 ? formatTime(queue[0].estimatedWait) : '-'}
          </Text>
          <Text style={styles.statLabel}>Wait Time</Text>
        </View>
      </View>

      {/* Current Customer */}
      {currentServing ? (
        <View style={styles.currentCard}>
          <View style={styles.currentHeader}>
            <Text style={styles.nowServing}>NOW SERVING</Text>
            <TouchableOpacity style={styles.completeButton} onPress={completeService}>
              <Ionicons name="checkmark-circle" size={24} color="white" />
              <Text style={styles.completeText}>Complete</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.currentName}>{currentServing.name}</Text>
          <Text style={styles.currentService}>{currentServing.service}</Text>

          <View style={styles.currentActions}>
            <TouchableOpacity style={styles.noshowButton} onPress={noShow}>
              <Ionicons name="person-outline" size={20} color={Colors.warning} />
              <Text style={styles.noshowText}>No Show</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.callNextButton} onPress={callNext}>
          <Ionicons name="call" size={32} color="white" />
          <Text style={styles.callNextText}>Call Next Customer</Text>
        </TouchableOpacity>
      )}

      {/* Queue List */}
      <View style={styles.queueHeader}>
        <Text style={styles.queueTitle}>Waiting ({queue.length})</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            Alert.prompt(
              'Add to Queue',
              'Customer name',
              (name) => {
                if (name) addToQueue(name, 'General Service');
              }
            );
          }}
        >
          <Ionicons name="add" size={20} color={Colors.primary} />
          <Text style={styles.addText}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.queueList}>
        {queue.map((customer, index) => (
          <View key={customer.id} style={styles.queueItem}>
            <View style={styles.positionBadge}>
              <Text style={styles.positionText}>{customer.position}</Text>
            </View>

            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{customer.name}</Text>
              <Text style={styles.customerService}>{customer.service}</Text>
            </View>

            <View style={styles.waitInfo}>
              <Text style={styles.waitTime}>
                {formatTime(customer.estimatedWait)}
              </Text>
              <Text style={styles.waitLabel}>wait</Text>
            </View>

            <TouchableOpacity
              style={styles.callButton}
              onPress={() => {
                setCurrentServing({ ...customer, status: 'called' });
                setQueue(queue.filter(c => c.id !== customer.id));
                updateWaitTimes();
              }}
            >
              <Ionicons name="radio-button-on" size={24} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        ))}

        {queue.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="cafe-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No one waiting!</Text>
            <Text style={styles.emptySubtext}>Walk-ins will appear here</Text>
          </View>
        )}
      </ScrollView>

      {/* Quick Add Buttons */}
      <View style={styles.quickAdd}>
        <Text style={styles.quickAddTitle}>Quick Add</Text>
        <View style={styles.quickButtons}>
          {['Haircut', 'Hair Wash', 'Facial', 'Massage'].map(service => (
            <TouchableOpacity
              key={service}
              style={styles.quickButton}
              onPress={() => {
                Alert.prompt(
                  'Customer Name',
                  service,
                  (name) => {
                    if (name) addToQueue(name, service);
                  }
                );
              }}
            >
              <Text style={styles.quickButtonText}>{service}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  statsRow: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  statValue: { fontSize: 24, fontWeight: 'bold', color: Colors.primary },
  statLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  currentCard: {
    margin: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
  },
  currentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nowServing: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 'bold' },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: 8,
  },
  completeText: { color: 'white', fontWeight: '600' },
  currentName: { color: 'white', fontSize: 28, fontWeight: 'bold', marginTop: Spacing.sm },
  currentService: { color: 'rgba(255,255,255,0.8)', fontSize: 16, marginTop: 4 },
  currentActions: { marginTop: Spacing.md },
  noshowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Spacing.sm,
  },
  noshowText: { color: Colors.warning, fontWeight: '600' },
  callNextButton: {
    margin: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  callNextText: { color: Colors.primary, fontSize: 18, fontWeight: '600' },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  queueTitle: { fontSize: 16, fontWeight: '600', color: Colors.text },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addText: { color: Colors.primary, fontWeight: '600' },
  queueList: { flex: 1, paddingHorizontal: Spacing.md },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  positionBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionText: { fontWeight: 'bold', color: Colors.text },
  customerInfo: { flex: 1, marginLeft: Spacing.md },
  customerName: { fontSize: 16, fontWeight: '600', color: Colors.text },
  customerService: { fontSize: 12, color: Colors.textSecondary },
  waitInfo: { alignItems: 'center', marginRight: Spacing.md },
  waitTime: { fontSize: 16, fontWeight: '600', color: Colors.primary },
  waitLabel: { fontSize: 10, color: Colors.textSecondary },
  callButton: { padding: Spacing.xs },
  emptyState: { alignItems: 'center', padding: Spacing.xl * 2 },
  emptyText: { fontSize: 18, fontWeight: '600', color: Colors.textSecondary, marginTop: Spacing.md },
  emptySubtext: { fontSize: 14, color: Colors.textSecondary },
  quickAdd: { padding: Spacing.md },
  quickAddTitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: Spacing.sm },
  quickButtons: { flexDirection: 'row', gap: Spacing.sm },
  quickButton: {
    flex: 1,
    padding: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  quickButtonText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
});
