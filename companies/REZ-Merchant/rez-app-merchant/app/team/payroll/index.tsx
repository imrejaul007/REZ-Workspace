import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '@/services/api';
import { storageService } from '@/services/storage';
import { logger } from '@/utils/logger';

export default function PayrollScreen() {
  const [payroll, setPayroll] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [totalPayable, setTotalPayable] = useState(0);

  useEffect(() => {
    loadPayroll();
  }, [selectedMonth]);

  const loadPayroll = async () => {
    try {
      setLoading(true);
      const merchantData = await storageService.getMerchantData<unknown>();
      // Use activeStoreId first, then storeId, then first store from stores array.
      // Do NOT fall back to merchantData.id — that is the merchant/user ID, not a store ID.
      const storeId =
        merchantData?.activeStoreId || merchantData?.storeId || merchantData?.stores?.[0]?._id;
      if (!storeId) {
        if (__DEV__) console.warn('[Payroll] No storeId found in merchant data');
        setPayroll([]);
        return;
      }
      const response = await apiClient.get(
        `merchant/payroll?storeId=${storeId}&month=${selectedMonth}`
      );
      setPayroll(response.data?.data?.payroll || []);
      setTotalPayable(response.data?.data?.totalPayable || 0);
    } catch {
      setPayroll([]);
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: -1 | 1) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + direction);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const [year, mon] = selectedMonth.split('-');
  const monthName = new Date(parseInt(year), parseInt(mon) - 1).toLocaleString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  const renderItem = ({ item }: { item: unknown }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: '/team/payroll/[staffId]',
          params: { staffId: item.staffId?._id || item.staffId, month: selectedMonth },
        })
      }
    >
      <View style={styles.cardLeft}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(item.staffId?.name || 'S')[0]?.toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.staffName}>{item.staffId?.name || 'Staff Member'}</Text>
          <Text style={styles.staffRole}>{item.staffId?.role || 'Employee'}</Text>
          <Text style={styles.attendance}>
            {item.daysPresent}/{item.workingDays} days
          </Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.salary}>₹{(item.netSalary || 0).toLocaleString('en-IN')}</Text>
        <View
          style={[
            styles.statusBadge,
            item.status === 'paid' ? styles.paidBadge : styles.pendingBadge,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              item.status === 'paid' ? styles.paidText : styles.pendingText,
            ]}
          >
            {item.status === 'paid' ? 'Paid' : item.status === 'approved' ? 'Ready' : 'Draft'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>Payroll</Text>
        <TouchableOpacity onPress={() => router.push('/team/attendance')}>
          <Ionicons name="calendar-outline" size={24} color="#4f46e5" />
        </TouchableOpacity>
      </View>
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={() => navigateMonth(-1)}>
          <Ionicons name="chevron-back" size={24} color="#4f46e5" />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{monthName}</Text>
        <TouchableOpacity onPress={() => navigateMonth(1)}>
          <Ionicons name="chevron-forward" size={24} color="#4f46e5" />
        </TouchableOpacity>
      </View>
      {totalPayable > 0 && (
        <View style={styles.totalBanner}>
          <Text style={styles.totalLabel}>Total Payable</Text>
          <Text style={styles.totalAmount}>₹{totalPayable.toLocaleString('en-IN')}</Text>
        </View>
      )}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#4f46e5" />
      ) : payroll.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="people-outline" size={48} color="#d1d5db" />
          <Text style={styles.emptyText}>No payroll data for {monthName}</Text>
          <Text style={styles.emptyHint}>Process payroll from the team management screen</Text>
        </View>
      ) : (
        <FlatList
          data={payroll}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={loadPayroll}
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
  title: { fontSize: 18, fontWeight: '700', color: '#111' },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#fff',
    gap: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    minWidth: 160,
    textAlign: 'center',
  },
  totalBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#4f46e5',
    padding: 16,
    margin: 16,
    borderRadius: 12,
  },
  totalLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  totalAmount: { fontSize: 22, fontWeight: '800', color: '#fff' },
  list: { padding: 16, gap: 12, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#4f46e5' },
  staffName: { fontSize: 15, fontWeight: '700', color: '#111' },
  staffRole: { fontSize: 12, color: '#6b7280', marginTop: 1 },
  attendance: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  salary: { fontSize: 16, fontWeight: '700', color: '#111' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  paidBadge: { backgroundColor: '#dcfce7' },
  pendingBadge: { backgroundColor: '#fef3c7' },
  statusText: { fontSize: 11, fontWeight: '600' },
  paidText: { color: '#166534' },
  pendingText: { color: '#92400e' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#374151', marginTop: 12 },
  emptyHint: { fontSize: 13, color: '#9ca3af', textAlign: 'center', paddingHorizontal: 40 },
});
