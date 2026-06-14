import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { platformAlertSimple } from '@/utils/platformAlert';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '@/services/api';
import { storageService } from '@/services/storage';

export default function AttendanceScreen() {
  const [attendance, setAttendance] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const merchantData = await storageService.getMerchantData<unknown>();
      const storeId =
        merchantData?.activeStoreId || merchantData?.storeId || merchantData?.stores?.[0]?._id;
      const response = await apiClient.get(`merchant/attendance?storeId=${storeId}&date=${today}`);
      setAttendance(response.data?.data || []);
    } catch {
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async (staffId: string) => {
    try {
      const merchantData = await storageService.getMerchantData<unknown>();
      const storeId =
        merchantData?.activeStoreId || merchantData?.storeId || merchantData?.stores?.[0]?._id;
      await apiClient.post('merchant/attendance/clock-in', { storeId, staffId });
      await loadAttendance();
    } catch {
      platformAlertSimple('Error', 'Failed to clock in');
    }
  };

  const handleClockOut = async (staffId: string) => {
    try {
      const merchantData = await storageService.getMerchantData<unknown>();
      const storeId =
        merchantData?.activeStoreId || merchantData?.storeId || merchantData?.stores?.[0]?._id;
      await apiClient.post('merchant/attendance/clock-out', { storeId, staffId });
      await loadAttendance();
    } catch {
      platformAlertSimple('Error', 'Failed to clock out');
    }
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const renderItem = ({ item }: { item: unknown }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: item.clockIn ? (item.clockOut ? '#6b7280' : '#22c55e') : '#f59e0b' },
          ]}
        />
        <View>
          <Text style={styles.staffName}>{item.staffId?.name || 'Staff'}</Text>
          <Text style={styles.times}>
            In: {formatTime(item.clockIn)} · Out: {formatTime(item.clockOut)}
          </Text>
          {item.hoursWorked > 0 && (
            <Text style={styles.hours}>{item.hoursWorked.toFixed(1)}h worked</Text>
          )}
        </View>
      </View>
      {!item.clockIn && (
        <TouchableOpacity
          style={styles.clockInButton}
          onPress={() => handleClockIn(item.staffId?._id || item.staffId)}
        >
          <Text style={styles.clockInText}>Clock In</Text>
        </TouchableOpacity>
      )}
      {item.clockIn && !item.clockOut && (
        <TouchableOpacity
          style={styles.clockOutButton}
          onPress={() => handleClockOut(item.staffId?._id || item.staffId)}
        >
          <Text style={styles.clockOutText}>Clock Out</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const dateLabel = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>Attendance — {dateLabel}</Text>
        <View style={{ width: 24 }} />
      </View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#4f46e5" />
      ) : attendance.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={48} color="#d1d5db" />
          <Text style={styles.emptyText}>No staff records for today</Text>
        </View>
      ) : (
        <FlatList
          data={attendance}
          keyExtractor={(item) => item._id || item.staffId?._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={loadAttendance}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: { fontSize: 16, fontWeight: '700', color: '#111', flex: 1, textAlign: 'center' },
  list: { padding: 16, gap: 10, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  staffName: { fontSize: 15, fontWeight: '700', color: '#111' },
  times: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  hours: { fontSize: 12, color: '#4f46e5', marginTop: 1, fontWeight: '600' },
  clockInButton: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clockInText: { color: '#166534', fontSize: 13, fontWeight: '700' },
  clockOutButton: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clockOutText: { color: '#991b1b', fontSize: 13, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#374151', marginTop: 12 },
});
