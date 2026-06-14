/**
 * Active Discounts List Screen
 *
 * Lists all discount rules from marketing service API
 * Allows editing (navigate to builder) and deactivating rules.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  getDiscountCodes,
  updateDiscountCode,
  DiscountCode,
  formatCurrencyINR,
  isDiscountCodeValid,
} from '@/services/api/marketingService';

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

interface StatusBadgeProps {
  isActive: boolean;
}

const StatusBadge = ({ isActive }: StatusBadgeProps) => (
  <View style={[badgeStyles.badge, isActive ? badgeStyles.active : badgeStyles.inactive]}>
    <Text style={[badgeStyles.text, isActive ? badgeStyles.textActive : badgeStyles.textInactive]}>
      {isActive ? 'Active' : 'Inactive'}
    </Text>
  </View>
);

const badgeStyles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  active: { backgroundColor: '#d1fae5' },
  inactive: { backgroundColor: '#f3f4f6' },
  text: { fontSize: 12, fontWeight: '600' },
  textActive: { color: '#059669' },
  textInactive: { color: '#6b7280' },
});

// ---------------------------------------------------------------------------
// Row item
// ---------------------------------------------------------------------------

interface DiscountRowProps {
  rule: DiscountCode;
  onDeactivate: (id: string) => void;
}

const DiscountRow = ({ rule, onDeactivate }: DiscountRowProps) => {
  const isValid = isDiscountCodeValid(rule);
  const valueLabel = rule.type === 'percentage' ? `${rule.value}% off` : `${formatCurrencyINR(rule.value)} off`;
  const minLabel = rule.minPurchase ? ` on orders above ${formatCurrencyINR(rule.minPurchase)}` : '';
  const usesLabel = rule.maxUses ? ` (${rule.usedCount}/${rule.maxUses} used)` : '';

  const confirmDeactivate = () =>
    Alert.alert('Deactivate Discount', `Deactivate code "${rule.code}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Deactivate', style: 'destructive', onPress: () => onDeactivate(rule.id) },
    ]);

  const validFrom = new Date(rule.validFrom).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const validTo = new Date(rule.validTo).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <View style={rowStyles.container}>
      <View style={rowStyles.topRow}>
        <View style={rowStyles.iconWrap}>
          <Ionicons name="pricetag-outline" size={20} color="#6366f1" />
        </View>
        <View style={rowStyles.info}>
          <View style={rowStyles.codeRow}>
            <Text style={rowStyles.name} numberOfLines={1}>
              {rule.code}
            </Text>
            {isValid && (
              <View style={rowStyles.validBadge}>
                <Text style={rowStyles.validBadgeText}>Valid</Text>
              </View>
            )}
          </View>
          <Text style={rowStyles.detail}>
            {valueLabel}
            {minLabel}
          </Text>
          <Text style={rowStyles.dates}>
            {validFrom} - {validTo}
          </Text>
          {rule.maxUses && (
            <Text style={rowStyles.uses}>{usesLabel}</Text>
          )}
        </View>
        <StatusBadge isActive={rule.isActive} />
      </View>
      {rule.isActive && (
        <TouchableOpacity style={rowStyles.deactivateBtn} onPress={confirmDeactivate}>
          <Ionicons name="close-circle-outline" size={15} color="#6b7280" />
          <Text style={rowStyles.deactivateBtnText}>Deactivate</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const rowStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  info: { flex: 1 },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  name: { fontSize: 14, fontWeight: '700', color: '#111827' },
  validBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  validBadgeText: { fontSize: 10, fontWeight: '600', color: '#059669' },
  detail: { fontSize: 13, color: '#4b5563', marginBottom: 2 },
  dates: { fontSize: 11, color: '#9ca3af' },
  uses: { fontSize: 11, color: '#6366f1', marginTop: 2 },
  deactivateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  deactivateBtnText: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
});

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function DiscountsIndexScreen() {
  const [rules, setRules] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const merchantId = 'default'; // In production, get from auth context

      // Try marketing service first
      const result = await getDiscountCodes(merchantId);
      if (result.success && result.data) {
        setRules(result.data);
      } else {
        // Fallback to legacy endpoint
        const { apiClient } = await import('@/services/api/client');
        const res = await apiClient.get<{ items: DiscountCode[] }>('/merchant/discount-rules');
        if (res.success && res.data) {
          setRules(Array.isArray(res.data) ? res.data : ((res.data as unknown as { items?: DiscountCode[] }).items ?? []));
        } else {
          setRules([]);
        }
      }
    } catch (e) {
      setError(e?.message || 'Failed to load discounts');
      Alert.alert('Error', e?.message || 'Failed to load discounts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleDeactivate = async (id: string) => {
    try {
      const merchantId = 'default'; // In production, get from auth context

      // Try marketing service first
      const result = await updateDiscountCode(merchantId, id, { isActive: false });
      if (result.success) {
        setRules((prev) => prev.map((r) => (r.id === id ? { ...r, isActive: false } : r)));
      } else {
        // Fallback to legacy endpoint
        const { apiClient } = await import('@/services/api/client');
        await apiClient.delete(`/merchant/discount-rules/${id}`);
        setRules((prev) => prev.map((r) => (r.id === id ? { ...r, isActive: false } : r)));
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to deactivate discount');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading discounts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const active = rules.filter((r) => r.isActive && isDiscountCodeValid(r));
  const inactive = rules.filter((r) => !r.isActive || !isDiscountCodeValid(r));

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchRules(true)}
            tintColor="#6366f1"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.pageTitle}>Discount Codes</Text>
            <Text style={styles.pageSubtitle}>
              {active.length} active code{active.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/discounts/builder')}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addBtnText}>New</Text>
          </TouchableOpacity>
        </View>

        {rules.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="pricetag-outline" size={56} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No discount codes yet</Text>
            <Text style={styles.emptyDesc}>Tap "New" to create your first discount code.</Text>
          </View>
        ) : (
          <>
            {active.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Active</Text>
                {active.map((r) => (
                  <DiscountRow key={r.id} rule={r} onDeactivate={handleDeactivate} />
                ))}
              </>
            )}
            {inactive.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: 12 }]}>Inactive / Expired</Text>
                {inactive.map((r) => (
                  <DiscountRow key={r.id} rule={r} onDeactivate={handleDeactivate} />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6b7280' },
  scrollContent: { padding: 16, paddingBottom: 40 },

  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  pageTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  pageSubtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  addBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9ca3af',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  empty: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#374151', marginTop: 16, marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: '#9ca3af', textAlign: 'center' },
});
