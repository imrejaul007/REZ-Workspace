/**
 * Content Moderation Status — read-only view of this merchant's
 * content (reviews, photos) moderation status.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import apiClient from '@/services/api/client';
import { logger } from '@/utils/logger';

interface ModerationStats {
  reviews: Record<string, number>;
  photos: Record<string, number>;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  approved: { label: 'Approved', color: '#10b981', icon: 'checkmark-circle' },
  pending: { label: 'Pending Review', color: '#f59e0b', icon: 'time' },
  rejected: { label: 'Rejected', color: '#ef4444', icon: 'close-circle' },
  featured: { label: 'Featured', color: '#8b5cf6', icon: 'star' },
};

export default function ModerationStatusScreen() {
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await apiClient.get<unknown>('/moderation/status');
      if (res.data?.data) setStats(res.data.data);
    } catch (err) {
      logger.error('Failed to load moderation status:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);
  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <ThemedText style={styles.title}>Content Moderation</ThemedText>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading && <ThemedText style={styles.loadingText}>Loading...</ThemedText>}

        {stats && (
          <>
            {renderSection('Reviews', 'chatbubbles-outline', stats.reviews)}
            {renderSection('Photos', 'images-outline', stats.photos)}
          </>
        )}

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#3b82f6" />
          <ThemedText style={styles.infoText}>
            Content moderation is handled by the platform team. Pending items are typically reviewed
            within 24 hours.
          </ThemedText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function renderSection(title: string, icon: string, data: Record<string, number>) {
  const total = data.total || 0;
  const entries = Object.entries(data).filter(([k]) => k !== 'total' && k !== 'unknown');

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon as unknown as keyof typeof Ionicons.glyphMap} size={20} color="#334155" />
        <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
        <ThemedText style={styles.totalBadge}>{total}</ThemedText>
      </View>

      {total === 0 ? (
        <ThemedText style={styles.emptyText}>No {title.toLowerCase()} to moderate</ThemedText>
      ) : (
        entries.map(([status, count]) => {
          const config = STATUS_CONFIG[status] || {
            label: status,
            color: '#6b7280',
            icon: 'ellipse',
          };
          return (
            <View key={status} style={styles.statRow}>
              <View style={styles.statLeft}>
                <Ionicons name={config.icon as unknown as keyof typeof Ionicons.glyphMap} size={18} color={config.color} />
                <ThemedText style={styles.statLabel}>{config.label}</ThemedText>
              </View>
              <ThemedText style={[styles.statValue, { color: config.color }]}>{count}</ThemedText>
            </View>
          );
        })
      )}
    </View>
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
  loadingText: { textAlign: 'center', marginTop: 40, color: '#64748b' },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    margin: 16,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '600', flex: 1 },
  totalBadge: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center', paddingVertical: 12 },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  statLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statLabel: { fontSize: 14, color: '#475569' },
  statValue: { fontSize: 16, fontWeight: '700' },
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
