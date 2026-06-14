import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '@/services/api/client';
import { useStore } from '@/contexts/StoreContext';

interface NetworkStats {
  networkCustomers: number;
  newCustomers: number;
  networkRevenue: number;
  networkPct: number;
  insight: string;
}

export default function NetworkStatsCard() {
  const { activeStore } = useStore();
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeStore?._id) return;
    let cancelled = false;
    apiClient
      .get('merchant/intelligence/network-stats', { params: { storeId: activeStore._id } })
      .then((r) => {
        if (!cancelled) setStats(r.data?.data);
      })
      .catch((e) => console.warn('[NetworkStats] Fetch failed:', e))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeStore?._id]);

  if (loading) return null;
  if (!stats || stats.networkCustomers === 0) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBg}>
          <Ionicons name="globe" size={18} color="#7C3AED" />
        </View>
        <Text style={styles.headerText}>REZ Network Impact</Text>
        <Text style={styles.period}>30 days</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{stats.networkCustomers}</Text>
          <Text style={styles.statLabel}>Network{'\n'}Customers</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            ₹{(stats.networkRevenue ?? 0).toLocaleString('en-IN')}
          </Text>
          <Text style={styles.statLabel}>Revenue{'\n'}from Coins</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{stats.networkPct}%</Text>
          <Text style={styles.statLabel}>Coin-driven{'\n'}Traffic</Text>
        </View>
      </View>

      <View style={styles.insightRow}>
        <Ionicons name="sparkles" size={14} color="#7C3AED" />
        <Text style={styles.insightText}>{stats.insight}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  iconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#4C1D95' },
  period: { fontSize: 11, color: '#8B5CF6', fontWeight: '500' },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#4C1D95', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#7C3AED', textAlign: 'center', lineHeight: 15 },
  divider: { width: 1, height: 40, backgroundColor: '#DDD6FE' },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#EDE9FE',
    borderRadius: 10,
    padding: 10,
  },
  insightText: { flex: 1, fontSize: 12, color: '#5B21B6', lineHeight: 17 },
});
