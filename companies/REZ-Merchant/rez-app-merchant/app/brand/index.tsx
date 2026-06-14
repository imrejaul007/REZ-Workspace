import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { apiClient } from '@/services/api/client';

interface BrandOutlet {
  _id: string;
  name: string;
  logo?: string;
  isActive: boolean;
  location?: { city?: string };
}

interface Brand {
  _id: string;
  name: string;
  logo?: string;
  stores: BrandOutlet[];
  settings: { centralMenuEnabled: boolean };
}

interface OutletAnalytics {
  storeId: string;
  name: string;
  revenue: number;
  transactions: number;
  avgOrderValue: number;
}

interface BrandAnalytics {
  totalRevenue: number;
  totalTransactions: number;
  avgOrderValue: number;
  outlets: OutletAnalytics[];
  topOutlet?: OutletAnalytics;
}

export default function BrandDashboardScreen() {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [analytics, setAnalytics] = useState<BrandAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pushingMenu, setPushingMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('merchant/brands');
      const raw = res.data?.data;
      const fetchedBrands: Brand[] = Array.isArray(raw) ? raw : [];
      setBrands(fetchedBrands);
      if (fetchedBrands.length > 0) {
        const brand = fetchedBrands[0];
        setSelectedBrand(brand);
        try {
          const analyticsRes = await apiClient.get(`merchant/brands/${brand._id}/analytics`);
          setAnalytics(analyticsRes.data?.data || null);
        } catch {
          setAnalytics(null);
        }
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load brands');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handlePushMenu = async () => {
    const sourceStore = selectedBrand?.stores?.[0];
    if (!selectedBrand || !sourceStore || selectedBrand.stores.length < 2) {
      Alert.alert('Need at least 2 outlets to push menu');
      return;
    }
    Alert.alert(
      'Push Menu',
      `Copy all products from "${sourceStore.name || 'source outlet'}" to all other outlets?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Push Menu',
          style: 'destructive',
          onPress: async () => {
            setPushingMenu(true);
            try {
              const res = await apiClient.post(`merchant/brands/${selectedBrand._id}/push-menu`, {
                sourceStoreId: sourceStore._id,
              });
              const { pushed, skipped, outlets } = res.data?.data || {};
              Alert.alert(
                'Menu Pushed',
                `${pushed} products added to ${outlets} outlet(s). ${skipped} already existed.`
              );
            } catch (e) {
              Alert.alert('Error', e?.response?.data?.message || 'Push failed');
            } finally {
              setPushingMenu(false);
            }
          },
        },
      ]
    );
  };

  if (loading)
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );

  if (error)
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={{ fontSize: 16, color: '#374151', marginTop: 12, textAlign: 'center' }}>
          {error}
        </Text>
        <TouchableOpacity style={styles.createBtn} onPress={() => loadData()}>
          <Text style={styles.createBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1a3a52', '#2d5a7b']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Brand Dashboard</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/brand/create')}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />}
      >
        {brands.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="storefront-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No brands yet</Text>
            <Text style={styles.emptySub}>
              Group your stores under a brand to manage them centrally
            </Text>
            <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/brand/create')}>
              <Text style={styles.createBtnText}>Create Brand</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Brand selector */}
            {brands.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.brandTabs}
              >
                {brands.map((b) => (
                  <TouchableOpacity
                    key={b._id}
                    style={[styles.brandTab, selectedBrand?._id === b._id && styles.brandTabActive]}
                    onPress={() => setSelectedBrand(b)}
                  >
                    <Text
                      style={[
                        styles.brandTabText,
                        selectedBrand?._id === b._id && styles.brandTabTextActive,
                      ]}
                    >
                      {b.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {selectedBrand && (
              <>
                {/* Brand header */}
                <View style={styles.brandCard}>
                  <Text style={styles.brandName}>{selectedBrand.name}</Text>
                  <Text style={styles.brandSub}>
                    {selectedBrand.stores.length} outlet
                    {selectedBrand.stores.length !== 1 ? 's' : ''}
                  </Text>
                </View>

                {/* Consolidated analytics */}
                {analytics && (
                  <View style={styles.statsCard}>
                    <Text style={styles.statsTitle}>Last 30 Days</Text>
                    <View style={styles.statsRow}>
                      <View style={styles.stat}>
                        <Text style={styles.statValue}>
                          &#x20B9;{analytics.totalRevenue.toLocaleString('en-IN')}
                        </Text>
                        <Text style={styles.statLabel}>Total Revenue</Text>
                      </View>
                      <View style={styles.statDivider} />
                      <View style={styles.stat}>
                        <Text style={styles.statValue}>{analytics.totalTransactions}</Text>
                        <Text style={styles.statLabel}>Transactions</Text>
                      </View>
                      <View style={styles.statDivider} />
                      <View style={styles.stat}>
                        <Text style={styles.statValue}>&#x20B9;{analytics.avgOrderValue}</Text>
                        <Text style={styles.statLabel}>Avg. Order</Text>
                      </View>
                    </View>
                    {analytics.topOutlet && (
                      <View style={styles.topOutlet}>
                        <Ionicons name="trophy" size={14} color="#F59E0B" />
                        <Text style={styles.topOutletText}>
                          Best: {analytics.topOutlet.name} — &#x20B9;
                          {analytics.topOutlet.revenue.toLocaleString('en-IN')}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Outlet performance list */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Outlet Performance</Text>
                  {(analytics?.outlets || selectedBrand.stores).map((outlet, idx) => {
                    // In fallback mode (no analytics), outlet is a Store with _id.
                    // In analytics mode, outlet has storeId. Compare against both.
                    const outletId = outlet.storeId || outlet._id;
                    const perfData = analytics?.outlets.find((o) => o.storeId === outletId);
                    return (
                      <View key={outletId} style={styles.outletRow}>
                        <View style={styles.outletRank}>
                          <Text style={styles.outletRankText}>{idx + 1}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.outletName}>{outlet.name}</Text>
                          {outlet.location?.city && (
                            <Text style={styles.outletCity}>{outlet.location.city}</Text>
                          )}
                        </View>
                        {perfData && (
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.outletRevenue}>
                              &#x20B9;{perfData.revenue.toLocaleString('en-IN')}
                            </Text>
                            <Text style={styles.outletTxn}>{perfData.transactions} txns</Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>

                {/* Actions */}
                <View style={styles.actionsCard}>
                  <TouchableOpacity
                    style={[styles.actionBtn, pushingMenu && styles.actionBtnDisabled]}
                    onPress={handlePushMenu}
                    disabled={pushingMenu}
                  >
                    {pushingMenu ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Ionicons name="push" size={20} color="#fff" />
                    )}
                    <Text style={styles.actionBtnText}>Push Menu to All Outlets</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 40) + 10,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  brandTabs: { marginBottom: 12 },
  brandTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    marginRight: 8,
  },
  brandTabActive: { backgroundColor: '#7C3AED' },
  brandTabText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  brandTabTextActive: { color: '#fff' },
  brandCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  brandName: { fontSize: 20, fontWeight: '800', color: '#111827' },
  brandSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  statsCard: {
    backgroundColor: '#F5F3FF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  statsTitle: { fontSize: 13, fontWeight: '600', color: '#7C3AED', marginBottom: 12 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: '#4C1D95' },
  statLabel: { fontSize: 11, color: '#7C3AED', marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: '#DDD6FE' },
  topOutlet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: '#EDE9FE',
    borderRadius: 8,
    padding: 8,
  },
  topOutletText: { fontSize: 12, color: '#5B21B6', fontWeight: '500' },
  section: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 12 },
  outletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  outletRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outletRankText: { fontSize: 13, fontWeight: '700', color: '#7C3AED' },
  outletName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  outletCity: { fontSize: 12, color: '#9CA3AF' },
  outletRevenue: { fontSize: 14, fontWeight: '700', color: '#111827' },
  outletTxn: { fontSize: 11, color: '#9CA3AF' },
  actionsCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 14,
  },
  actionBtnDisabled: { opacity: 0.6 },
  actionBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#374151' },
  emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center', paddingHorizontal: 32 },
  createBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 8,
  },
  createBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
