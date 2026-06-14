import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useStore } from '@/contexts/StoreContext';
import { gstService, GSTR1Data, GSTR3BData } from '@/services/api/gst';
import { platformAlertSimple } from '@/utils/platformAlert';

type TabType = 'gstr1' | 'gstr3b';

function formatCurrency(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

function getPreviousMonths(count: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

export default function GSTScreen() {
  const { activeStore } = useStore();
  const storeId = activeStore?._id;

  const [activeTab, setActiveTab] = useState<TabType>('gstr1');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [gstr1, setGstr1] = useState<GSTR1Data | null>(null);
  const [gstr3b, setGstr3b] = useState<GSTR3BData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const months = getPreviousMonths(12);

  const fetchData = useCallback(
    async (isRefreshing = false) => {
      if (!storeId) return;
      try {
        if (isRefreshing) setRefreshing(true);
        else setLoading(true);

        const [r1, r3b] = await Promise.all([
          gstService.getGSTR1(storeId, selectedMonth).catch(() => null),
          gstService.getGSTR3B(storeId, selectedMonth).catch(() => null),
        ]);

        setGstr1(r1);
        setGstr3b(r3b);
      } catch (err) {
        platformAlertSimple('Error', err.message || 'Failed to load GST data');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [storeId, selectedMonth]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.title}>GST Returns</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Month Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.monthBar}
        contentContainerStyle={styles.monthBarContent}
      >
        {months.map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.monthChip, selectedMonth === m && styles.monthChipActive]}
            onPress={() => setSelectedMonth(m)}
          >
            <Text style={[styles.monthChipText, selectedMonth === m && styles.monthChipTextActive]}>
              {getMonthLabel(m)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['gstr1', 'gstr3b'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'gstr1' ? 'GSTR-1' : 'GSTR-3B'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} />
        }
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <Text style={styles.loadingText}>Loading GST data...</Text>
          </View>
        ) : activeTab === 'gstr1' ? (
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>GSTR-1 Summary</Text>
            <Text style={styles.sectionSubtitle}>
              Outward supplies for {getMonthLabel(selectedMonth)}
            </Text>

            {gstr1 ? (
              <View style={styles.cardGrid}>
                <View style={styles.statCard}>
                  <Ionicons name="cart-outline" size={24} color={Colors.light.primary} />
                  <Text style={styles.statValue}>{gstr1.count}</Text>
                  <Text style={styles.statLabel}>Invoices</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="cash-outline" size={24} color={Colors.light.success} />
                  <Text style={styles.statValue}>{formatCurrency(gstr1.totalSales)}</Text>
                  <Text style={styles.statLabel}>Total Sales</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="receipt-outline" size={24} color={Colors.light.warning} />
                  <Text style={styles.statValue}>{formatCurrency(gstr1.totalTax)}</Text>
                  <Text style={styles.statLabel}>Total Tax Collected</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons
                    name="calculator-outline"
                    size={24}
                    color={Colors.light.textSecondary}
                  />
                  <Text style={styles.statValue}>
                    {gstr1.totalSales > 0
                      ? ((gstr1.totalTax / gstr1.totalSales) * 100).toFixed(1) + '%'
                      : '0%'}
                  </Text>
                  <Text style={styles.statLabel}>Effective Tax Rate</Text>
                </View>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons
                  name="document-text-outline"
                  size={48}
                  color={Colors.light.textSecondary}
                />
                <Text style={styles.emptyText}>No GSTR-1 data for this period</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>GSTR-3B Summary</Text>
            <Text style={styles.sectionSubtitle}>
              Tax liability for {getMonthLabel(selectedMonth)}
            </Text>

            {gstr3b ? (
              <>
                <View style={styles.cardGrid}>
                  <View style={[styles.statCard, { width: '100%' }]}>
                    <Text style={styles.statLabel}>Taxable Value</Text>
                    <Text style={[styles.statValue, { fontSize: 22 }]}>
                      {formatCurrency(gstr3b.taxableValue)}
                    </Text>
                  </View>
                </View>

                <View style={styles.taxBreakdown}>
                  <Text style={styles.breakdownTitle}>Tax Breakdown</Text>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>CGST</Text>
                    <Text style={styles.breakdownValue}>{formatCurrency(gstr3b.cgst)}</Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>SGST</Text>
                    <Text style={styles.breakdownValue}>{formatCurrency(gstr3b.sgst)}</Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>IGST</Text>
                    <Text style={styles.breakdownValue}>{formatCurrency(gstr3b.igst)}</Text>
                  </View>
                  <View style={[styles.breakdownRow, styles.breakdownRowTotal]}>
                    <Text style={styles.breakdownTotalLabel}>Total Tax Liability</Text>
                    <Text style={styles.breakdownTotalValue}>
                      {formatCurrency(gstr3b.cgst + gstr3b.sgst + gstr3b.igst)}
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons
                  name="document-text-outline"
                  size={48}
                  color={Colors.light.textSecondary}
                />
                <Text style={styles.emptyText}>No GSTR-3B data for this period</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={18} color={Colors.light.primary} />
          <Text style={styles.infoText}>
            This data is auto-computed from your completed orders. Consult your CA for official GST
            filing.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.backgroundSecondary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.light.textHeading },
  monthBar: { backgroundColor: Colors.light.background, maxHeight: 48 },
  monthBarContent: { paddingHorizontal: 14, paddingVertical: 8, gap: 8 },
  monthChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  monthChipActive: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  monthChipText: { fontSize: 12, fontWeight: '600', color: Colors.light.textSecondary },
  monthChipTextActive: { color: '#fff' },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.light.background,
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
  },
  tabActive: { backgroundColor: Colors.light.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.light.textSecondary },
  tabTextActive: { color: '#fff' },
  scroll: { flex: 1 },
  content: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.light.textHeading },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
    marginBottom: 16,
  },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: {
    width: '47%',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  statValue: { fontSize: 18, fontWeight: '700', color: Colors.light.textHeading },
  statLabel: { fontSize: 12, color: Colors.light.textSecondary },
  taxBreakdown: {
    marginTop: 16,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
  },
  breakdownTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.textHeading,
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  breakdownRowTotal: {
    borderBottomWidth: 0,
    borderTopWidth: 2,
    borderTopColor: Colors.light.textHeading,
    marginTop: 4,
    paddingTop: 12,
  },
  breakdownLabel: { fontSize: 14, color: Colors.light.textSecondary },
  breakdownValue: { fontSize: 14, fontWeight: '600', color: Colors.light.text },
  breakdownTotalLabel: { fontSize: 14, fontWeight: '700', color: Colors.light.textHeading },
  breakdownTotalValue: { fontSize: 16, fontWeight: '800', color: Colors.light.primary },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 14, color: Colors.light.textSecondary },
  centered: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  loadingText: { fontSize: 14, color: Colors.light.textSecondary },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.light.primaryLight2,
    borderRadius: 10,
    padding: 14,
    margin: 16,
  },
  infoText: { flex: 1, fontSize: 12, color: Colors.light.primary, lineHeight: 18 },
});
