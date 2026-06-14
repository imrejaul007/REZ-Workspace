/**
 * StayOwn Staff App - Dashboard Screen
 * Today's overview and quick actions
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '../../context/AppContext';

export default function DashboardScreen() {
  const { staffInfo, syncStatus } = useAppStore();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const stats = [
    { label: 'Rooms to Clean', value: '12', icon: '🧹', color: '#F59E0B' },
    { label: 'Check-ins Today', value: '8', icon: '📥', color: '#10B981' },
    { label: 'Check-outs', value: '6', icon: '📤', color: '#6366F1' },
    { label: 'Open Requests', value: '5', icon: '📋', color: '#EF4444' },
  ];

  const tasks = [
    { id: '1', room: '101', type: 'cleaning', status: 'pending', priority: 'high' },
    { id: '2', room: '205', type: 'cleaning', status: 'in-progress', priority: 'normal' },
    { id: '3', room: '302', type: 'maintenance', status: 'pending', priority: 'low' },
    { id: '4', room: '104', type: 'check-in', status: 'pending', priority: 'high' },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'normal': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#9CA3AF';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'in-progress': return 'In Progress';
      case 'completed': return 'Done';
      default: return status;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good Morning,</Text>
          <Text style={styles.name}>{staffInfo?.name || 'Staff'}</Text>
        </View>
        <View style={styles.syncBadge}>
          <View style={[styles.syncDot, {
            backgroundColor: syncStatus.isOnline ? '#10B981' : '#EF4444'
          }]} />
          <Text style={styles.syncText}>
            {syncStatus.isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <TouchableOpacity
            key={index}
            style={styles.statCard}
            onPress={() => {
              // Navigate based on stat type
            }}
          >
            <Text style={styles.statIcon}>{stat.icon}</Text>
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/scan')}
          >
            <Text style={styles.actionIcon}>📷</Text>
            <Text style={styles.actionLabel}>Scan QR</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/rooms')}
          >
            <Text style={styles.actionIcon}>🧹</Text>
            <Text style={styles.actionLabel}>Start Cleaning</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/requests')}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionLabel}>New Request</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Today's Tasks */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Tasks</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/requests')}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {tasks.map((task) => (
          <TouchableOpacity
            key={task.id}
            style={styles.taskCard}
            onPress={() => router.push(`/room/${task.room}`)}
          >
            <View style={[styles.priorityBar, { backgroundColor: getPriorityColor(task.priority) }]} />
            <View style={styles.taskContent}>
              <View style={styles.taskHeader}>
                <Text style={styles.taskRoom}>Room {task.room}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getPriorityColor(task.priority) + '20' }]}>
                  <Text style={[styles.statusText, { color: getPriorityColor(task.priority) }]}>
                    {getStatusLabel(task.status)}
                  </Text>
                </View>
              </View>
              <Text style={styles.taskType}>
                {task.type === 'cleaning' ? '🧹 General Cleaning' :
                 task.type === 'maintenance' ? '🔧 Maintenance' :
                 '📥 Guest Check-in'}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Pending Sync */}
      {syncStatus.pendingOperations > 0 && (
        <View style={styles.syncBanner}>
          <Text style={styles.syncBannerIcon}>🔄</Text>
          <View style={styles.syncBannerContent}>
            <Text style={styles.syncBannerTitle}>Pending Sync</Text>
            <Text style={styles.syncBannerText}>
              {syncStatus.pendingOperations} operations waiting to sync
            </Text>
          </View>
          <TouchableOpacity style={styles.syncButton}>
            <Text style={styles.syncButtonText}>Sync Now</Text>
          </TouchableOpacity>
        </View>
      )}

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
    padding: 20,
    backgroundColor: '#2563EB',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  greeting: {
    fontSize: 14,
    color: '#BFDBFE',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  syncText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    marginTop: -20,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    margin: '1%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  viewAll: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  priorityBar: {
    width: 4,
    height: '100%',
  },
  taskContent: {
    flex: 1,
    padding: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  taskRoom: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  taskType: {
    fontSize: 13,
    color: '#6B7280',
  },
  chevron: {
    fontSize: 24,
    color: '#D1D5DB',
    paddingRight: 12,
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  syncBannerIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  syncBannerContent: {
    flex: 1,
  },
  syncBannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  syncBannerText: {
    fontSize: 12,
    color: '#B45309',
  },
  syncButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 100,
  },
});
