// @ts-nocheck
// Sprint 12: Bill Simulator — full-page screen
// Enter a bill amount, see nearby store savings options ranked by best deal

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTheme } from '@/contexts/ThemeContext';
import apiClient from '@/services/apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NearbyStore {
  storeId: string;
  storeName: string;
  distanceMeters: number;
  cashbackPercent: number;
  expectedSavingPaise: number;
}

interface BestNearbyResponse {
  stores: NearbyStore[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function fetchBestNearby(budgetPaise: number): Promise<NearbyStore[]> {
  let lat = 0;
  let lng = 0;

  try {
    const pos = await Location.getLastKnownPositionAsync({});
    if (pos) {
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    }
  } catch {
    // fallback to 0,0
  }

  const response = await apiClient.get<{ stores: NearbyStore[] }>(
    `/user/savings/best-nearby?lat=${lat}&lng=${lng}&budgetPaise=${budgetPaise}`,
  );
  if (!response.success) throw new Error(response.error || 'Failed to fetch');
  return (response.data?.stores ?? []) as NearbyStore[];
}

// ─── StoreCard ────────────────────────────────────────────────────────────────

interface StoreCardProps {
  store: NearbyStore;
  isBest: boolean;
  onPress: (storeId: string) => void;
  isDark: boolean;
  cardColor: string;
  textColor: string;
  subtextColor: string;
  borderColor: string;
}

// eslint-disable-next-line react/display-name
const StoreCard = React.memo(
  ({ store, isBest, onPress, isDark, cardColor, textColor, subtextColor, borderColor }: StoreCardProps) => (
    <Pressable
      style={[styles.storeCard, { backgroundColor: cardColor, borderColor }, isBest && styles.storeCardBest]}
      onPress={() => onPress(store.storeId)}
      accessibilityRole="button"
      accessibilityLabel={`${store.storeName}. Save ${formatRupees(store.expectedSavingPaise)} with ${store.cashbackPercent}% cashback. ${formatDistance(store.distanceMeters)} away.`}
    >
      {isBest && (
        <View style={styles.bestBadge}>
          <Text style={styles.bestBadgeText}>Best Deal</Text>
        </View>
      )}

      <View style={styles.storeCardRow}>
        <View style={styles.storeCardLeft}>
          <Text style={[styles.storeName, { color: textColor }]} numberOfLines={1}>
            {store.storeName}
          </Text>
          <Text style={[styles.storeDistance, { color: subtextColor }]}>
            {formatDistance(store.distanceMeters)} away
          </Text>
        </View>

        <View style={styles.storeCardRight}>
          <Text style={styles.savingAmount}>{formatRupees(store.expectedSavingPaise)}</Text>
          <Text style={[styles.cashbackLabel, { color: subtextColor }]}>{store.cashbackPercent}% cashback</Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color={subtextColor} style={{ marginLeft: 4 }} />
      </View>
    </Pressable>
  ),
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function BillSimulatorScreen() {
  const router = useRouter();
  const { isDark, sprintColors: themeColors } = useTheme();

  const [inputText, setInputText] = useState('');
  const [stores, setStores] = useState<NearbyStore[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const budgetPaise = inputText.trim() ? Math.round(parseFloat(inputText) * 100) : 0;
  const bestStore = stores.length > 0 ? stores[0] : null;
  const totalBestSaving = bestStore ? bestStore.expectedSavingPaise : 0;

  const loadStores = useCallback(async (paise: number) => {
    if (paise <= 0) {
      setStores([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const results = await fetchBestNearby(paise);
      setStores(results);
    } catch {
      setError('Could not load nearby stores. Please try again.');
      setStores([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadStores(budgetPaise);
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [budgetPaise, loadStores]);

  const handleStorePress = useCallback(
    (_storeId: string) => {
      router.push('/smart-spend' as unknown as string);
    },
    [router],
  );

  const renderStore = useCallback(
    ({ item, index }: { item: NearbyStore; index: number }) => (
      <StoreCard
        store={item}
        isBest={index === 0}
        onPress={handleStorePress}
        isDark={isDark}
        cardColor={themeColors.card}
        textColor={themeColors.text}
        subtextColor={themeColors.subtext}
        borderColor={themeColors.border}
      />
    ),
    [handleStorePress, isDark, themeColors],
  );

  const showEmpty = !loading && !error && stores.length === 0;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={themeColors.card} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.card, borderBottomColor: themeColors.border }]}>
        <Pressable
          style={styles.backBtn}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as unknown))}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Bill Simulator</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Input */}
      <View style={[styles.inputSection, { backgroundColor: themeColors.card, borderBottomColor: themeColors.border }]}>
        <Text style={[styles.inputLabel, { color: themeColors.subtext }]}>Enter bill amount (₹)</Text>
        <View style={[styles.inputWrapper, { borderColor: themeColors.border }]}>
          <Text style={[styles.currencyPrefix, { color: themeColors.text }]}>₹</Text>
          <TextInput
            style={[styles.input, { color: themeColors.text }]}
            value={inputText}
            onChangeText={setInputText}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={themeColors.subtext}
            maxLength={10}
            returnKeyType="done"
            accessibilityLabel="Bill amount in rupees"
          />
        </View>
      </View>

      {/* Summary card — shown when we have results */}
      {bestStore && budgetPaise > 0 && (
        <View style={[styles.summaryCard, { backgroundColor: '#1A3A52' }]}>
          <Ionicons name="sparkles" size={18} color="#FFD700" />
          <Text style={styles.summaryText}>
            {'You could save '}
            <Text style={styles.summaryHighlight}>{formatRupees(totalBestSaving)}</Text>
            {' by going to '}
            <Text style={styles.summaryHighlight}>{bestStore.storeName}</Text>
          </Text>
        </View>
      )}

      {/* Results */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FFD700" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={themeColors.subtext} />
          <Text style={[styles.emptyText, { color: themeColors.subtext }]}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={() => loadStores(budgetPaise)}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : showEmpty ? (
        <View style={styles.centered}>
          <Ionicons name="calculator-outline" size={64} color={themeColors.subtext} />
          <Text style={[styles.emptyText, { color: themeColors.text }]}>
            {budgetPaise > 0
              ? 'No nearby stores found for this amount.'
              : 'Enter a bill amount to see your savings potential'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={stores}
          renderItem={renderStore}
          keyExtractor={(item) => item.storeId}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  headerRight: {
    width: 32,
  },
  inputSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  currencyPrefix: {
    fontSize: 26,
    fontWeight: '700',
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    padding: 0,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  summaryText: {
    flex: 1,
    fontSize: 14,
    color: '#E2E8F0',
    lineHeight: 20,
  },
  summaryHighlight: {
    color: '#FFD700',
    fontWeight: '700',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 24,
  },
  retryBtn: {
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#1A3A52',
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 10,
  },
  storeCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 2,
  },
  storeCardBest: {
    borderColor: '#FFD700',
    borderWidth: 1.5,
  },
  bestBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFD700',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 8,
  },
  bestBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0A1628',
  },
  storeCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeCardLeft: {
    flex: 1,
  },
  storeName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  storeDistance: {
    fontSize: 12,
  },
  storeCardRight: {
    alignItems: 'flex-end',
    marginRight: 4,
  },
  savingAmount: {
    fontSize: 17,
    fontWeight: '700',
    color: '#16A34A',
  },
  cashbackLabel: {
    fontSize: 12,
    marginTop: 1,
  },
});
