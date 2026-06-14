'use client';

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface RoomQRStats {
  activeRooms: number;
  totalRooms: number;
  todayRequests: number;
  pendingRequests: number;
  completedRequests: number;
  avgResponseTime: string;
  todayRevenue: number;
  weekRevenue: number;
  recentRequests: { room: string; type: string; status: string; time: string }[];
  topServices: { name: string; count: number }[];
}

export default function RoomQRPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RoomQRStats | null>(null);

  useEffect(() => {
    setTimeout(() => {
      setStats({
        activeRooms: 24,
        totalRooms: 50,
        todayRequests: 45,
        pendingRequests: 8,
        completedRequests: 37,
        avgResponseTime: '12 min',
        todayRevenue: 12400,
        weekRevenue: 67800,
        recentRequests: [
          { room: '201', type: 'Room Service', status: 'pending', time: '2 min ago' },
          { room: '305', type: 'Housekeeping', status: 'in_progress', time: '5 min ago' },
          { room: '102', type: 'Laundry', status: 'completed', time: '8 min ago' },
          { room: '410', type: 'Room Service', status: 'pending', time: '3 min ago' },
        ],
        topServices: [
          { name: 'Room Service', count: 23 },
          { name: 'Housekeeping', count: 15 },
          { name: 'Laundry', count: 8 },
          { name: 'Spa', count: 5 },
          { name: 'Transport', count: 3 },
        ],
      });
      setLoading(false);
    }, 500);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#EF4444';
      case 'in_progress': return '#F59E0B';
      case 'completed': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'time-outline';
      case 'in_progress': return 'refresh';
      case 'completed': return 'checkmark-circle';
      default: return 'help-circle';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Room QR</Text>
        <TouchableOpacity>
          <Ionicons name="download-outline" size={24} color="#8B5CF6" />
        </TouchableOpacity>
      </View>

      {/* Room Status */}
      <View style={styles.roomStatus}>
        <View style={styles.roomStatusMain}>
          <Text style={styles.roomCount}>{stats?.activeRooms}</Text>
          <Text style={styles.roomLabel}>Active Rooms</Text>
        </View>
        <View style={styles.roomStatusDivider} />
        <View style={styles.roomStatusMain}>
          <Text style={styles.roomCount}>{stats?.totalRooms}</Text>
          <Text style={styles.roomLabel}>Total Rooms</Text>
        </View>
      </View>

      {/* Request Stats */}
      <View style={styles.requestStats}>
        <View style={styles.requestStatCard}>
          <Text style={styles.requestStatValue}>{stats?.todayRequests}</Text>
          <Text style={styles.requestStatLabel}>Today's Requests</Text>
        </View>
        <View style={styles.requestStatCard}>
          <View style={[styles.statusBadge, { backgroundColor: '#EF444420' }]}>
            <Text style={[styles.statusBadgeText, { color: '#EF4444' }]}>
              {stats?.pendingRequests}
            </Text>
          </View>
          <Text style={styles.requestStatLabel}>Pending</Text>
        </View>
        <View style={styles.requestStatCard}>
          <View style={[styles.statusBadge, { backgroundColor: '#10B98120' }]}>
            <Text style={[styles.statusBadgeText, { color: '#10B981' }]}>
              {stats?.completedRequests}
            </Text>
          </View>
          <Text style={styles.requestStatLabel}>Completed</Text>
        </View>
      </View>

      {/* Revenue */}
      <View style={styles.revenueCard}>
        <View style={styles.revenueRow}>
          <View>
            <Text style={styles.revenueLabel}>Today's Revenue</Text>
            <Text style={styles.revenueValue}>₹{stats?.todayRevenue?.toLocaleString()}</Text>
          </View>
          <View>
            <Text style={styles.revenueLabel}>This Week</Text>
            <Text style={styles.revenueValue}>₹{stats?.weekRevenue?.toLocaleString()}</Text>
          </View>
        </View>
        <View style={styles.avgResponse}>
          <Ionicons name="time-outline" size={16} color="#6B7280" />
          <Text style={styles.avgResponseText}>Avg response: {stats?.avgResponseTime}</Text>
        </View>
      </View>

      {/* Pending Requests */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pending Requests</Text>
          <TouchableOpacity onPress={() => router.push('/(dashboard)')}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.requestsList}>
          {stats?.recentRequests.map((req, index) => (
            <View key={index} style={styles.requestCard}>
              <View style={styles.requestLeft}>
                <View style={styles.roomBadge}>
                  <Text style={styles.roomBadgeText}>{req.room}</Text>
                </View>
                <View>
                  <Text style={styles.requestType}>{req.type}</Text>
                  <Text style={styles.requestTime}>{req.time}</Text>
                </View>
              </View>
              <View style={[styles.requestStatus, { backgroundColor: getStatusColor(req.status) + '20' }]}>
                <Ionicons name={getStatusIcon(req.status)} size={16} color={getStatusColor(req.status)} />
                <Text style={[styles.requestStatusText, { color: getStatusColor(req.status) }]}>
                  {req.status.replace('_', ' ')}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Top Services */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Services</Text>
        <View style={styles.servicesList}>
          {stats?.topServices.map((service, index) => (
            <View key={service.name} style={styles.serviceRow}>
              <Text style={styles.serviceRank}>{index + 1}</Text>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.serviceCount}>{service.count}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="download" size={20} color="#8B5CF6" />
          <Text style={styles.actionText}>Download All QR</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="print" size={20} color="#8B5CF6" />
          <Text style={styles.actionText}>Print Labels</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  roomStatus: {
    flexDirection: 'row',
    backgroundColor: '#8B5CF6',
    margin: 16,
    borderRadius: 16,
    padding: 20,
  },
  roomStatusMain: {
    flex: 1,
    alignItems: 'center',
  },
  roomStatusDivider: {
    width: 1,
    backgroundColor: '#FFFFFF40',
    marginHorizontal: 16,
  },
  roomCount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  roomLabel: {
    fontSize: 12,
    color: '#FFFFFFB0',
    marginTop: 4,
  },
  requestStats: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  requestStatCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  requestStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  requestStatLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  revenueCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  revenueLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  revenueValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginTop: 4,
  },
  avgResponse: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 6,
  },
  avgResponseText: {
    fontSize: 12,
    color: '#6B7280',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  viewAll: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  requestsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  requestLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roomBadge: {
    backgroundColor: '#8B5CF620',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  roomBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  requestType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  requestTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  requestStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  requestStatusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  servicesList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  serviceRank: {
    width: 24,
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  serviceName: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  serviceCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B5CF6',
  },
});
