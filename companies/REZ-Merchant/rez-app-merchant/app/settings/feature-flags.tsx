/**
 * Feature Flags — read-only view of which features are enabled
 * for this merchant, including per-merchant overrides from admin.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import featureFlagService, { MerchantFeatureFlag } from '@/services/api/featureFlags';
import { logger } from '@/utils/logger';

export default function FeatureFlagsScreen() {
  const [flags, setFlags] = useState<MerchantFeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFlags = useCallback(async () => {
    try {
      const res = await featureFlagService.getAll();
      if (res.data?.data) setFlags(res.data.data);
    } catch (err) {
      logger.error('Failed to load feature flags:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFlags();
  }, [loadFlags]);
  const onRefresh = () => {
    setRefreshing(true);
    loadFlags();
  };

  const enabledFlags = flags.filter((f) => f.enabled);
  const disabledFlags = flags.filter((f) => !f.enabled);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <ThemedText style={styles.title}>Feature Flags</ThemedText>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading && <ThemedText style={styles.loadingText}>Loading...</ThemedText>}

        {!loading && flags.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="flag-outline" size={48} color="#94a3b8" />
            <ThemedText style={styles.emptyText}>No feature flags configured</ThemedText>
          </View>
        )}

        {enabledFlags.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Enabled ({enabledFlags.length})</ThemedText>
            {enabledFlags.map(renderFlag)}
          </View>
        )}

        {disabledFlags.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Disabled ({disabledFlags.length})</ThemedText>
            {disabledFlags.map(renderFlag)}
          </View>
        )}

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#3b82f6" />
          <ThemedText style={styles.infoText}>
            Feature flags are managed by the platform admin. Contact support if you need a feature
            enabled.
          </ThemedText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function renderFlag(flag: MerchantFeatureFlag) {
  return (
    <View key={flag.key} style={styles.flagCard}>
      <View style={styles.flagRow}>
        <Ionicons
          name={flag.enabled ? 'checkmark-circle' : 'close-circle'}
          size={22}
          color={flag.enabled ? '#10b981' : '#ef4444'}
        />
        <View style={styles.flagInfo}>
          <ThemedText style={styles.flagKey}>{flag.key}</ThemedText>
          <ThemedText style={styles.flagDesc}>{flag.description}</ThemedText>
        </View>
      </View>
      {flag.isOverridden && (
        <View style={styles.overrideBadge}>
          <Ionicons name="shield-outline" size={14} color="#7c3aed" />
          <ThemedText style={styles.overrideText}>Override: {flag.overrideReason}</ThemedText>
          {flag.expiresAt && (
            <ThemedText style={styles.expiryText}>
              Expires: {new Date(flag.expiresAt).toLocaleDateString()}
            </ThemedText>
          )}
        </View>
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
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#64748b', marginTop: 12 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  flagCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  flagRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  flagInfo: { flex: 1 },
  flagKey: { fontSize: 14, fontWeight: '600', fontFamily: 'monospace' },
  flagDesc: { fontSize: 13, color: '#64748b', marginTop: 2 },
  overrideBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  overrideText: { fontSize: 12, color: '#7c3aed', fontWeight: '500' },
  expiryText: { fontSize: 11, color: '#94a3b8', marginLeft: 'auto' },
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
