/**
 * Fraud Alert Detail — read-only view of a single anomaly alert.
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import fraudService, { AnomalyAlert } from '@/services/api/fraud';
import { logger } from '@/utils/logger';

const STATUS_COLORS: Record<string, string> = {
  monitoring: '#f59e0b',
  reviewed: '#3b82f6',
  dismissed: '#6b7280',
  escalated: '#ef4444',
};

export default function FraudAlertDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [alert, setAlert] = useState<AnomalyAlert | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fraudService
      .getAlertById(id)
      .then((res) => {
        if (res.data?.data) setAlert(res.data.data);
      })
      .catch((err: unknown) => logger.error('Failed to load fraud alert', err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (!alert) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>
          <ThemedText style={styles.title}>Alert Not Found</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <ThemedText style={styles.title}>Alert Detail</ThemedText>
      </View>

      <ScrollView style={styles.scroll}>
        <View style={styles.section}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: STATUS_COLORS[alert.status] || '#6b7280' },
            ]}
          >
            <ThemedText style={styles.statusText}>{alert.status}</ThemedText>
          </View>

          <ThemedText style={styles.alertType}>{alert.type.replace(/_/g, ' ')}</ThemedText>
          <ThemedText style={styles.dateText}>
            Flagged: {new Date(alert.flaggedAt).toLocaleString()}
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Details</ThemedText>
          {alert.value != null && (
            <View style={styles.row}>
              <ThemedText style={styles.label}>Detected Value</ThemedText>
              <ThemedText style={styles.value}>{alert.value}</ThemedText>
            </View>
          )}
          {alert.threshold != null && (
            <View style={styles.row}>
              <ThemedText style={styles.label}>Threshold</ThemedText>
              <ThemedText style={styles.value}>{alert.threshold}</ThemedText>
            </View>
          )}
          {alert.coinsEarned != null && (
            <View style={styles.row}>
              <ThemedText style={styles.label}>Coins Earned</ThemedText>
              <ThemedText style={styles.value}>{alert.coinsEarned}</ThemedText>
            </View>
          )}
          {alert.windowMinutes != null && (
            <View style={styles.row}>
              <ThemedText style={styles.label}>Time Window</ThemedText>
              <ThemedText style={styles.value}>{alert.windowMinutes} min</ThemedText>
            </View>
          )}
        </View>

        {alert.notes && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Admin Notes</ThemedText>
            <ThemedText style={styles.notesText}>{alert.notes}</ThemedText>
          </View>
        )}

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#3b82f6" />
          <ThemedText style={styles.infoText}>
            This is a read-only view. Fraud alerts are managed by the platform admin team.
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
  scroll: { flex: 1, padding: 16 },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  statusText: { fontSize: 12, fontWeight: '600', color: '#fff', textTransform: 'uppercase' },
  alertType: { fontSize: 18, fontWeight: '700', textTransform: 'capitalize', marginBottom: 4 },
  dateText: { fontSize: 13, color: '#64748b' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  label: { fontSize: 14, color: '#475569' },
  value: { fontSize: 14, fontWeight: '600' },
  notesText: { fontSize: 14, color: '#334155', lineHeight: 20 },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 30,
  },
  infoText: { flex: 1, fontSize: 13, color: '#1e40af', lineHeight: 18 },
});
