/**
 * System Status — shows health of services the merchant depends on.
 * Pings /health endpoints of known services.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { getApiUrl } from '@/config/api';

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'slow' | 'error' | 'checking';
  latency?: number;
}

const SLOW_THRESHOLD_MS = 2000;

const SERVICES = [
  { name: 'API Gateway', path: '/health' },
  { name: 'Merchant Service', path: '/api/merchant/health' },
  { name: 'Order Processing', path: '/health' },
];

export default function SystemStatusScreen() {
  const [services, setServices] = useState<ServiceStatus[]>(
    SERVICES.map((s) => ({ name: s.name, status: 'checking' }))
  );
  const [refreshing, setRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkHealth = useCallback(async () => {
    const baseUrl = getApiUrl().replace('/api', '');

    const results = await Promise.all(
      SERVICES.map(async (svc) => {
        const start = Date.now();
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);
          const res = await fetch(`${baseUrl}${svc.path}`, { signal: controller.signal });
          clearTimeout(timeout);
          const latency = Date.now() - start;
          return {
            name: svc.name,
            status: (res.ok
              ? latency > SLOW_THRESHOLD_MS
                ? 'slow'
                : 'healthy'
              : 'error') as ServiceStatus['status'],
            latency,
          };
        } catch {
          return { name: svc.name, status: 'error' as const, latency: Date.now() - start };
        }
      })
    );

    setServices(results);
    setLastChecked(new Date());
    setRefreshing(false);
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);
  const onRefresh = () => {
    setRefreshing(true);
    checkHealth();
  };

  const allHealthy = services.every((s) => s.status === 'healthy');
  const hasError = services.some((s) => s.status === 'error');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <ThemedText style={styles.title}>System Status</ThemedText>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Overall Status */}
        <View
          style={[
            styles.overallCard,
            {
              backgroundColor: allHealthy ? '#ecfdf5' : hasError ? '#fef2f2' : '#fffbeb',
            },
          ]}
        >
          <Ionicons
            name={allHealthy ? 'checkmark-circle' : hasError ? 'alert-circle' : 'warning'}
            size={32}
            color={allHealthy ? '#10b981' : hasError ? '#ef4444' : '#f59e0b'}
          />
          <View>
            <ThemedText style={styles.overallText}>
              {allHealthy
                ? 'All Systems Operational'
                : hasError
                  ? 'Service Issues Detected'
                  : 'Degraded Performance'}
            </ThemedText>
            {lastChecked && (
              <ThemedText style={styles.lastChecked}>
                Last checked: {lastChecked.toLocaleTimeString()}
              </ThemedText>
            )}
          </View>
        </View>

        {/* Service List */}
        <View style={styles.section}>
          {services.map((svc) => (
            <View key={svc.name} style={styles.serviceRow}>
              <View style={styles.serviceLeft}>
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        svc.status === 'healthy'
                          ? '#10b981'
                          : svc.status === 'slow'
                            ? '#f59e0b'
                            : svc.status === 'error'
                              ? '#ef4444'
                              : '#94a3b8',
                    },
                  ]}
                />
                <ThemedText style={styles.serviceName}>{svc.name}</ThemedText>
              </View>
              <View style={styles.serviceRight}>
                {svc.latency != null && (
                  <ThemedText style={styles.latency}>{svc.latency}ms</ThemedText>
                )}
                <ThemedText
                  style={[
                    styles.statusLabel,
                    {
                      color:
                        svc.status === 'healthy'
                          ? '#10b981'
                          : svc.status === 'slow'
                            ? '#f59e0b'
                            : svc.status === 'error'
                              ? '#ef4444'
                              : '#94a3b8',
                    },
                  ]}
                >
                  {svc.status === 'checking' ? 'Checking...' : svc.status}
                </ThemedText>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#3b82f6" />
          <ThemedText style={styles.infoText}>
            If you're experiencing issues, pull down to refresh. Persistent problems are
            automatically reported to our engineering team.
          </ThemedText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: { marginRight: 12 },
  title: { fontSize: 20, fontWeight: '700' },
  scroll: { flex: 1 },
  overallCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    margin: 16,
    padding: 18,
    borderRadius: 12,
  },
  overallText: { fontSize: 17, fontWeight: '700' },
  lastChecked: { fontSize: 12, color: '#64748b', marginTop: 2 },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  serviceLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  serviceName: { fontSize: 15, fontWeight: '500' },
  serviceRight: { alignItems: 'flex-end' },
  latency: { fontSize: 12, color: '#94a3b8' },
  statusLabel: { fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    padding: 14,
    margin: 16,
  },
  infoText: { flex: 1, fontSize: 13, color: '#1e40af', lineHeight: 18 },
});
