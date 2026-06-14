'use client';

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface MenuQRStats {
  todayScans: number;
  weekScans: number;
  monthScans: number;
  todayOrders: number;
  weekOrders: number;
  monthOrders: number;
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  topItems: { name: string; orders: number }[];
  popularTimes: { hour: string; scans: number }[];
}

export default function MenuQRPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [stats, setStats] = useState<MenuQRStats | null>(null);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setStats({
        todayScans: 147,
        weekScans: 892,
        monthScans: 3421,
        todayOrders: 12,
        weekOrders: 67,
        monthOrders: 289,
        todayRevenue: 4560,
        weekRevenue: 23400,
        monthRevenue: 98600,
        topItems: [
          { name: 'Butter Chicken', orders: 45 },
          { name: 'Garlic Naan', orders: 38 },
          { name: 'Paneer Tikka', orders: 32 },
          { name: 'Dal Makhani', orders: 28 },
          { name: 'Biryani', orders: 24 },
        ],
        popularTimes: [
          { hour: '12 PM', scans: 45 },
          { hour: '7 PM', scans: 38 },
          { hour: '1 PM', scans: 32 },
          { hour: '8 PM', scans: 28 },
        ],
      });
      setLoading(false);
    }, 500);
  }, [period]);

  const getStats = () => {
    switch (period) {
      case 'today':
        return { scans: stats?.todayScans, orders: stats?.todayOrders, revenue: stats?.todayRevenue };
      case 'week':
        return { scans: stats?.weekScans, orders: stats?.weekOrders, revenue: stats?.weekRevenue };
      case 'month':
        return { scans: stats?.monthScans, orders: stats?.monthOrders, revenue: stats?.monthRevenue };
    }
  };

  const periodStats = getStats();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
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
        <Text style={styles.title}>Menu QR</Text>
        <TouchableOpacity onPress={() => router.push('/(dashboard)/qr-generator')}>
          <Ionicons name="qr-code" size={24} color="#10B981" />
        </TouchableOpacity>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {(['today', 'week', 'month'] as const).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodButton, period === p && styles.periodButtonActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#10B98120' }]}>
            <Ionicons name="scan" size={20} color="#10B981" />
          </View>
          <Text style={styles.statValue}>{periodStats.scans}</Text>
          <Text style={styles.statLabel}>Scans</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#6366F120' }]}>
            <Ionicons name="cart" size={20} color="#6366F1" />
          </View>
          <Text style={styles.statValue}>{periodStats.orders}</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
        <View style={[styles.statCard, styles.statCardWide]}>
          <View style={[styles.statIcon, { backgroundColor: '#F59E0B20' }]}>
            <Ionicons name="cash" size={20} color="#F59E0B" />
          </View>
          <Text style={styles.statValue}>₹{periodStats.revenue?.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
      </View>

      {/* Top Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Items</Text>
        <View style={styles.itemsList}>
          {stats?.topItems.map((item, index) => (
            <View key={item.name} style={styles.itemRow}>
              <View style={styles.itemRank}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemOrders}>{item.orders} orders</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Popular Times */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Popular Times</Text>
        <View style={styles.timesGrid}>
          {stats?.popularTimes.map((time) => (
            <View key={time.hour} style={styles.timeCard}>
              <Text style={styles.timeHour}>{time.hour}</Text>
              <Text style={styles.timeScans}>{time.scans} scans</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(dashboard)/products')}
        >
          <Ionicons name="restaurant" size={20} color="#10B981" />
          <Text style={styles.actionText}>Edit Menu</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(dashboard)/orders')}
        >
          <Ionicons name="list" size={20} color="#6366F1" />
          <Text style={styles.actionText}>View Orders</Text>
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
  periodSelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#10B981',
  },
  periodText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  periodTextActive: {
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '30%',
  },
  statCardWide: {
    width: '36%',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  itemsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  itemOrders: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  timesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    minWidth: 70,
  },
  timeHour: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  timeScans: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
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
    color: '#111827',
  },
});
