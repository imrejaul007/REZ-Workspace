// @ts-nocheck
import { withErrorBoundary } from '@/utils/withErrorBoundary';
/**
 * Combo Deals Screen
 * Shows active bundle deals for a specific store, sorted by highest savings.
 * Accessible from the store page → "Deals & Combos" section.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import apiClient from '@/services/apiClient';
import { useIsMounted } from '@/hooks/useIsMounted';
import { Colors, Spacing, BorderRadius } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ComboItem {
  productId: string;
  productName: string;
  quantity: number;
  basePrice: number;
}

interface ComboProduct {
  id: string;
  name: string;
  image: string | null;
  comboPrice: number;
  originalTotal: number;
  savings: number;
  savingsPercentage: number;
  items: ComboItem[];
  validFrom: string | null;
  validTo: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

// ─── Combo Card ───────────────────────────────────────────────────────────────

function ComboCard({ combo, currencySymbol }: { combo: ComboProduct; currencySymbol: string }) {
  const expiryStr = formatDate(combo.validTo);

  return (
    <View style={styles.card}>
      {/* Savings badge */}
      <View style={styles.savingsBadge}>
        <Text style={styles.savingsText}>{combo.savingsPercentage}% OFF</Text>
      </View>

      {/* Image or gradient placeholder */}
      {combo.image ? (
        <Image source={{ uri: combo.image }} style={styles.comboImage} resizeMode="cover" />
      ) : (
        <LinearGradient colors={['#1a3a52', '#FFC857']} style={styles.comboImagePlaceholder}>
          <Ionicons name="fast-food-outline" size={36} color="rgba(255,255,255,0.6)" />
        </LinearGradient>
      )}

      <View style={styles.cardBody}>
        <Text style={styles.comboName}>{combo.name}</Text>

        {/* Items list */}
        <View style={styles.itemsList}>
          {combo.items.map((item, idx) => (
            <View key={item.productId} style={styles.itemRow}>
              <Text style={styles.itemBullet}>•</Text>
              <Text style={styles.itemName}>
                {item.quantity > 1 ? `${item.quantity}× ` : ''}
                {item.productName}
              </Text>
              <Text style={styles.itemPrice}>{formatCurrency(item.basePrice * item.quantity)}</Text>
            </View>
          ))}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Price row */}
        <View style={styles.priceRow}>
          <View>
            <Text style={styles.originalPrice}>{formatCurrency(combo.originalTotal)}</Text>
            <Text style={styles.comboPrice}>{formatCurrency(combo.comboPrice)}</Text>
          </View>
          <View style={styles.savingsChip}>
            <Ionicons name="pricetag" size={12} color="#059669" style={{ marginRight: 4 }} />
            <Text style={styles.savingsChipText}>Save {formatCurrency(combo.savings)}</Text>
          </View>
        </View>

        {/* Validity */}
        {expiryStr && <Text style={styles.validityText}>Valid till {expiryStr}</Text>}
      </View>
    </View>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Ionicons name="fast-food-outline" size={52} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No combo deals right now</Text>
      <Text style={styles.emptyBody}>Check back soon — this store may add bundle deals for even better value.</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

function CombosScreen() {
  const isMounted = useIsMounted();
  const router = useRouter();
  const params = useLocalSearchParams<unknown>();
  const storeId = params.storeId;
  const storeName = params.storeName || 'Store';

  const [combos, setCombos] = useState<ComboProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCombos = useCallback(
    async (isRefresh = false) => {
      if (!storeId) {
        setLoading(false);
        return;
      }
      try {
        // eslint-disable-next-line no-unused-expressions
        isRefresh ? setRefreshing(true) : setLoading(true);
        const res = await apiClient.get<{ combos: ComboProduct[] }>(`/stores/${storeId}/combos`);
        if (!isMounted()) return;
        if (res.success && res.data?.combos) {
          setCombos(res.data.combos);
        }
      } catch {
        // silently handle
      } finally {
        if (!isMounted()) return;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [storeId, isMounted],
  );

  useFocusEffect(
    useCallback(() => {
      fetchCombos();
    }, [fetchCombos]),
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Combo Deals</Text>
          <Text style={styles.headerSubtitle}>{storeName}</Text>
        </View>
        <Ionicons name="pricetags-outline" size={24} color="#1a3a52" />
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#1a3a52" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchCombos(true)} />}
          showsVerticalScrollIndicator={false}
        >
          {combos.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <Text style={styles.sectionHint}>
                {combos.length} bundle deal{combos.length !== 1 ? 's' : ''} available · Sorted by best savings
              </Text>
              {combos.map((combo) => (
                <ComboCard key={combo.id} combo={combo} currencySymbol="₹" />
              ))}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  headerSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 40 },
  sectionHint: { fontSize: 13, color: '#6B7280', marginBottom: 16 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  savingsBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  savingsText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  comboImage: { width: '100%', height: 140 },
  comboImagePlaceholder: {
    width: '100%',
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: { padding: 16 },
  comboName: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 12 },
  itemsList: { gap: 6, marginBottom: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemBullet: { color: '#1a3a52', fontSize: 16, lineHeight: 20 },
  itemName: { flex: 1, fontSize: 14, color: '#374151' },
  itemPrice: { fontSize: 13, color: '#6B7280' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginBottom: 12 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  originalPrice: { fontSize: 13, color: '#9CA3AF', textDecorationLine: 'line-through', marginBottom: 2 },
  comboPrice: { fontSize: 22, fontWeight: '800', color: '#1a3a52' },
  savingsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  savingsChipText: { fontSize: 13, fontWeight: '600', color: '#059669' },
  validityText: { fontSize: 11, color: '#9CA3AF', marginTop: 10 },

  emptyState: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginTop: 16, marginBottom: 8 },
  emptyBody: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
});

export default withErrorBoundary(CombosScreen, 'CombosScreen');
