/**
 * Tally Export Screen
 * Export accounting data in Tally XML format and other formats
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
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Colors } from '@/constants/Colors';
import { useStore } from '@/contexts/StoreContext';
import { tallyExportService, GSTR1Response, GSTR3BResponse } from '@/services/api/tallyExport';

type ExportType = 'sales' | 'purchase' | 'expense';
type TabType = 'export' | 'gstr1' | 'gstr3b';

function formatCurrency(amount: number): string {
  return 'Rs. ' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2 });
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

export default function TallyExportScreen() {
  const { activeStore } = useStore();
  const storeId = activeStore?._id;

  const [activeTab, setActiveTab] = useState<TabType>('export');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [fromMonth, setFromMonth] = useState(getCurrentMonth());
  const [toMonth, setToMonth] = useState(getCurrentMonth());
  const [exportType, setExportType] = useState<ExportType>('sales');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // GST data
  const [gstr1, setGstr1] = useState<GSTR1Response | null>(null);
  const [gstr3b, setGstr3b] = useState<GSTR3BResponse | null>(null);

  const months = getPreviousMonths(24);

  const fetchGSTRData = useCallback(async (isRefreshing = false) => {
    if (!storeId) return;
    try {
      if (isRefreshing) setRefreshing(true);
      else setLoading(true);

      const [r1, r3b] = await Promise.all([
        tallyExportService.getGSTR1(storeId, selectedMonth).catch(() => null),
        tallyExportService.getGSTR3B(storeId, selectedMonth).catch(() => null),
      ]);

      setGstr1(r1);
      setGstr3b(r3b);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to load GST data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [storeId, selectedMonth]);

  useEffect(() => {
    if (activeTab !== 'export' && storeId) {
      fetchGSTRData();
    }
  }, [activeTab, fetchGSTRData]);

  const downloadTallyXML = async () => {
    if (!storeId) {
      Alert.alert('Error', 'No store selected. Please select a store first.');
      return;
    }

    try {
      setLoading(true);
      const xmlContent = await tallyExportService.downloadTallyXML(
        storeId,
        fromMonth,
        toMonth,
        exportType
      );

      const fileUri = `${FileSystem.documentDirectory}Tally_${exportType}_${fromMonth}_${toMonth}.xml`;
      await FileSystem.writeAsStringAsync(fileUri, xmlContent);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/xml',
          dialogTitle: `Tally XML Export (${fromMonth} to ${toMonth})`,
        });
      } else {
        Alert.alert('Saved', `File saved to: ${fileUri}`);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to download Tally XML');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = async () => {
    if (!storeId) {
      Alert.alert('Error', 'No store selected. Please select a store first.');
      return;
    }

    try {
      setLoading(true);
      const csvContent = await tallyExportService.downloadCSV(storeId, fromMonth, toMonth);

      const fileUri = `${FileSystem.documentDirectory}Transactions_${fromMonth}_${toMonth}.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csvContent);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: `Transaction CSV (${fromMonth} to ${toMonth})`,
        });
      } else {
        Alert.alert('Saved', `File saved to: ${fileUri}`);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to download CSV');
    } finally {
      setLoading(false);
    }
  };

  const downloadGSTR1JSON = async () => {
    if (!storeId || !gstr1) return;

    try {
      setLoading(true);
      const jsonContent = JSON.stringify(gstr1, null, 2);
      const fileUri = `${FileSystem.documentDirectory}GSTR1_${selectedMonth}.json`;
      await FileSystem.writeAsStringAsync(fileUri, jsonContent);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: `GSTR-1 Export (${selectedMonth})`,
        });
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to download GSTR-1');
    } finally {
      setLoading(false);
    }
  };

  const downloadGSTR3BJSON = async () => {
    if (!storeId || !gstr3b) return;

    try {
      setLoading(true);
      const jsonContent = JSON.stringify(gstr3b, null, 2);
      const fileUri = `${FileSystem.documentDirectory}GSTR3B_${selectedMonth}.json`;
      await FileSystem.writeAsStringAsync(fileUri, jsonContent);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: `GSTR-3B Export (${selectedMonth})`,
        });
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to download GSTR-3B');
    } finally {
      setLoading(false);
    }
  };

  const renderExportTab = () => (
    <View style={styles.tabContent}>
      {/* Date Range Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Date Range</Text>

        <View style={styles.dateRow}>
          <View style={styles.dateColumn}>
            <Text style={styles.dateLabel}>From Month</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.monthScroll}
            >
              {months.map((m) => (
                <TouchableOpacity
                  key={`from-${m}`}
                  style={[styles.monthChip, fromMonth === m && styles.monthChipActive]}
                  onPress={() => setFromMonth(m)}
                >
                  <Text
                    style={[styles.monthChipText, fromMonth === m && styles.monthChipTextActive]}
                  >
                    {getMonthLabel(m)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={styles.dateRow}>
          <View style={styles.dateColumn}>
            <Text style={styles.dateLabel}>To Month</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.monthScroll}
            >
              {months.map((m) => (
                <TouchableOpacity
                  key={`to-${m}`}
                  style={[styles.monthChip, toMonth === m && styles.monthChipActive]}
                  onPress={() => setToMonth(m)}
                >
                  <Text
                    style={[styles.monthChipText, toMonth === m && styles.monthChipTextActive]}
                  >
                    {getMonthLabel(m)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>

      {/* Export Type Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Export Type</Text>
        <View style={styles.exportTypeGrid}>
          {(['sales', 'purchase', 'expense'] as ExportType[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.exportTypeCard, exportType === type && styles.exportTypeCardActive]}
              onPress={() => setExportType(type)}
            >
              <Ionicons
                name={
                  type === 'sales'
                    ? 'cart'
                    : type === 'purchase'
                      ? 'basket'
                      : 'receipt'
                }
                size={24}
                color={exportType === type ? Colors.light.primary : Colors.light.textSecondary}
              />
              <Text
                style={[
                  styles.exportTypeLabel,
                  exportType === type && styles.exportTypeLabelActive,
                ]}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Export Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Export Formats</Text>

        <TouchableOpacity
          style={[styles.exportButton, styles.tallyButton]}
          onPress={downloadTallyXML}
          disabled={loading}
        >
          <View style={[styles.exportIcon, { backgroundColor: '#d1fae5' }]}>
            <Ionicons name="document-outline" size={24} color="#059669" />
          </View>
          <View style={styles.exportInfo}>
            <Text style={styles.exportLabel}>Tally XML</Text>
            <Text style={styles.exportDesc}>For Tally ERP 9 & Tally Prime</Text>
          </View>
          {loading ? (
            <ActivityIndicator color="#059669" size="small" />
          ) : (
            <Ionicons name="download-outline" size={20} color="#059669" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.exportButton, styles.csvButton]}
          onPress={downloadCSV}
          disabled={loading}
        >
          <View style={[styles.exportIcon, { backgroundColor: '#dbeafe' }]}>
            <Ionicons name="document-text-outline" size={24} color="#1d4ed8" />
          </View>
          <View style={styles.exportInfo}>
            <Text style={styles.exportLabel}>CSV File</Text>
            <Text style={styles.exportDesc}>For Zoho, QuickBooks & Excel</Text>
          </View>
          {loading ? (
            <ActivityIndicator color="#1d4ed8" size="small" />
          ) : (
            <Ionicons name="download-outline" size={20} color="#1d4ed8" />
          )}
        </TouchableOpacity>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={20} color={Colors.light.primary} />
        <Text style={styles.infoText}>
          Export transaction data for your accountant. The Tally XML format is compatible with
          Tally ERP 9 & Tally Prime.
        </Text>
      </View>
    </View>
  );

  const renderGSTR1Tab = () => (
    <View style={styles.tabContent}>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading GSTR-1 data...</Text>
        </View>
      ) : gstr1 ? (
        <>
          <View style={styles.gstrCard}>
            <Text style={styles.gstrTitle}>GSTR-1 Summary</Text>
            <Text style={styles.gstrPeriod}>{getMonthLabel(selectedMonth)}</Text>

            <View style={styles.gstrStats}>
              <View style={styles.gstrStat}>
                <Text style={styles.gstrStatValue}>{gstr1.summary.totalInvoices}</Text>
                <Text style={styles.gstrStatLabel}>Invoices</Text>
              </View>
              <View style={styles.gstrStat}>
                <Text style={styles.gstrStatValue}>
                  {formatCurrency(gstr1.summary.totalTaxableValue)}
                </Text>
                <Text style={styles.gstrStatLabel}>Taxable Value</Text>
              </View>
              <View style={styles.gstrStat}>
                <Text style={styles.gstrStatValue}>
                  {formatCurrency(gstr1.summary.totalCGST + gstr1.summary.totalSGST)}
                </Text>
                <Text style={styles.gstrStatLabel}>Tax Collected</Text>
              </View>
            </View>

            <View style={styles.gstrBreakdown}>
              <View style={styles.gstrRow}>
                <Text style={styles.gstrLabel}>CGST</Text>
                <Text style={styles.gstrValue}>{formatCurrency(gstr1.summary.totalCGST)}</Text>
              </View>
              <View style={styles.gstrRow}>
                <Text style={styles.gstrLabel}>SGST</Text>
                <Text style={styles.gstrValue}>{formatCurrency(gstr1.summary.totalSGST)}</Text>
              </View>
              <View style={styles.gstrRow}>
                <Text style={styles.gstrLabel}>IGST</Text>
                <Text style={styles.gstrValue}>{formatCurrency(gstr1.summary.totalIGST)}</Text>
              </View>
              <View style={styles.gstrRow}>
                <Text style={styles.gstrLabel}>Cess</Text>
                <Text style={styles.gstrValue}>{formatCurrency(gstr1.summary.totalCess)}</Text>
              </View>
              <View style={[styles.gstrRow, styles.gstrRowTotal]}>
                <Text style={styles.gstrLabelTotal}>Total Invoice Value</Text>
                <Text style={styles.gstrValueTotal}>
                  {formatCurrency(gstr1.summary.totalInvoiceValue)}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.downloadGstrButton}
            onPress={downloadGSTR1JSON}
            disabled={loading}
          >
            <Ionicons name="download-outline" size={20} color="#fff" />
            <Text style={styles.downloadGstrText}>Download GSTR-1 JSON</Text>
          </TouchableOpacity>
        </>
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
  );

  const renderGSTR3BTab = () => (
    <View style={styles.tabContent}>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading GSTR-3B data...</Text>
        </View>
      ) : gstr3b ? (
        <>
          <View style={styles.gstrCard}>
            <Text style={styles.gstrTitle}>GSTR-3B Summary</Text>
            <Text style={styles.gstrPeriod}>{getMonthLabel(selectedMonth)}</Text>
            <Text style={styles.gstrGstin}>GSTIN: {gstr3b.gstin || 'Not Available'}</Text>

            <View style={styles.gstrBreakdown}>
              <Text style={styles.breakdownTitle}>Tax Liability</Text>
              <View style={styles.gstrRow}>
                <Text style={styles.gstrLabel}>Taxable Value</Text>
                <Text style={styles.gstrValue}>{formatCurrency(gstr3b.taxableValue)}</Text>
              </View>
              <View style={styles.gstrRow}>
                <Text style={styles.gstrLabel}>CGST</Text>
                <Text style={styles.gstrValue}>{formatCurrency(gstr3b.cgst)}</Text>
              </View>
              <View style={styles.gstrRow}>
                <Text style={styles.gstrLabel}>SGST</Text>
                <Text style={styles.gstrValue}>{formatCurrency(gstr3b.sgst)}</Text>
              </View>
              <View style={styles.gstrRow}>
                <Text style={styles.gstrLabel}>IGST</Text>
                <Text style={styles.gstrValue}>{formatCurrency(gstr3b.igst)}</Text>
              </View>
              <View style={styles.gstrRow}>
                <Text style={styles.gstrLabel}>Cess</Text>
                <Text style={styles.gstrValue}>{formatCurrency(gstr3b.cess)}</Text>
              </View>
              <View style={[styles.gstrRow, styles.gstrRowTotal]}>
                <Text style={styles.gstrLabelTotal}>Total Tax</Text>
                <Text style={styles.gstrValueTotal}>{formatCurrency(gstr3b.totalTax)}</Text>
              </View>
            </View>

            <View style={styles.gstrBreakdown}>
              <Text style={styles.breakdownTitle}>Supply Details</Text>
              <View style={styles.gstrRow}>
                <Text style={styles.gstrLabel}>Intra-State</Text>
                <Text style={styles.gstrValue}>
                  {formatCurrency(gstr3b.intraStateSupplies.taxableValue)}
                </Text>
              </View>
              <View style={styles.gstrRow}>
                <Text style={styles.gstrLabel}>Inter-State</Text>
                <Text style={styles.gstrValue}>
                  {formatCurrency(gstr3b.interStateSupplies.taxableValue)}
                </Text>
              </View>
              <View style={styles.gstrRow}>
                <Text style={styles.gstrLabel}>Nil Rated</Text>
                <Text style={styles.gstrValue}>{formatCurrency(gstr3b.nilRatedSupplies)}</Text>
              </View>
              <View style={styles.gstrRow}>
                <Text style={styles.gstrLabel}>Exempted</Text>
                <Text style={styles.gstrValue}>{formatCurrency(gstr3b.exemptedSupplies)}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.downloadGstrButton}
            onPress={downloadGSTR3BJSON}
            disabled={loading}
          >
            <Ionicons name="download-outline" size={20} color="#fff" />
            <Text style={styles.downloadGstrText}>Download GSTR-3B JSON</Text>
          </TouchableOpacity>
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
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Export for Accountant</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Month Selector (for GST tabs) */}
      {activeTab !== 'export' && (
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
              <Text
                style={[styles.monthChipText, selectedMonth === m && styles.monthChipTextActive]}
              >
                {getMonthLabel(m)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['export', 'gstr1', 'gstr3b'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'export' ? 'Export' : tab === 'gstr1' ? 'GSTR-1' : 'GSTR-3B'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchGSTRData(true)}
          />
        }
      >
        {activeTab === 'export' && renderExportTab()}
        {activeTab === 'gstr1' && renderGSTR1Tab()}
        {activeTab === 'gstr3b' && renderGSTR3BTab()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
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
  monthBar: { backgroundColor: Colors.light.background, maxHeight: 52 },
  monthBarContent: { paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  monthChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginRight: 8,
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
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.light.textSecondary },
  tabTextActive: { color: '#fff' },
  scroll: { flex: 1 },
  tabContent: { padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: Colors.light.textHeading, marginBottom: 12 },
  dateRow: { marginBottom: 12 },
  dateColumn: { gap: 8 },
  dateLabel: { fontSize: 12, fontWeight: '600', color: Colors.light.textSecondary },
  monthScroll: { marginTop: 4 },
  exportTypeGrid: { flexDirection: 'row', gap: 12 },
  exportTypeCard: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  exportTypeCardActive: { borderColor: Colors.light.primary },
  exportTypeLabel: { fontSize: 12, fontWeight: '600', color: Colors.light.textSecondary, marginTop: 8 },
  exportTypeLabelActive: { color: Colors.light.primary },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
  },
  tallyButton: { borderColor: '#d1fae5' },
  csvButton: { borderColor: '#dbeafe' },
  exportIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  exportInfo: { flex: 1 },
  exportLabel: { fontSize: 14, fontWeight: '600', color: Colors.light.text },
  exportDesc: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 2 },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.light.primaryLight2,
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginTop: 8,
  },
  infoText: { flex: 1, fontSize: 13, color: Colors.light.primary, lineHeight: 18 },
  centered: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  loadingText: { fontSize: 14, color: Colors.light.textSecondary },
  gstrCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  gstrTitle: { fontSize: 18, fontWeight: '700', color: Colors.light.textHeading },
  gstrPeriod: { fontSize: 14, color: Colors.light.textSecondary, marginTop: 4 },
  gstrGstin: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 2 },
  gstrStats: { flexDirection: 'row', marginTop: 20, marginBottom: 20, gap: 12 },
  gstrStat: { flex: 1, alignItems: 'center' },
  gstrStatValue: { fontSize: 18, fontWeight: '700', color: Colors.light.textHeading },
  gstrStatLabel: { fontSize: 11, color: Colors.light.textSecondary, marginTop: 4 },
  gstrBreakdown: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  breakdownTitle: { fontSize: 13, fontWeight: '600', color: Colors.light.textHeading, marginBottom: 12 },
  gstrRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  gstrRowTotal: { borderBottomWidth: 0, borderTopWidth: 2, borderTopColor: Colors.light.textHeading, marginTop: 4, paddingTop: 14 },
  gstrLabel: { fontSize: 13, color: Colors.light.textSecondary },
  gstrValue: { fontSize: 13, fontWeight: '600', color: Colors.light.text },
  gstrLabelTotal: { fontSize: 14, fontWeight: '700', color: Colors.light.textHeading },
  gstrValueTotal: { fontSize: 15, fontWeight: '800', color: Colors.light.primary },
  downloadGstrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  downloadGstrText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 14, color: Colors.light.textSecondary },
});
