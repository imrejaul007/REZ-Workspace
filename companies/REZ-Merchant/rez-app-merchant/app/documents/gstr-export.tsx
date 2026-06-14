import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { platformAlertSimple } from '@/utils/platformAlert';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '@/services/api';
import { storageService } from '@/services/storage';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

type GSTTab = 'gstr1' | 'gstr3b';

export default function GSTRExportScreen() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<GSTTab>('gstr1');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [summary, setSummary] = useState<unknown>(null);

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setSummary(null);
      const merchantData = await storageService.getMerchantData<unknown>();
      const storeId = merchantData?.activeStoreId || merchantData?.storeId || merchantData?.id;
      const endpoint = activeTab === 'gstr1' ? 'merchant/gst/gstr1' : 'merchant/gst/gstr3b';
      const response = await apiClient.get(`${endpoint}?storeId=${storeId}&month=${selectedMonth}`);
      setSummary(response.data?.data);
    } catch {
      platformAlertSimple('Error', 'Failed to fetch GST data');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = async () => {
    try {
      setLoading(true);
      const merchantData = await storageService.getMerchantData<unknown>();
      const storeId = merchantData?.activeStoreId || merchantData?.storeId || merchantData?.id;
      const endpoint = activeTab === 'gstr1' ? 'merchant/gst/gstr1' : 'merchant/gst/gstr3b';
      const response = await apiClient.get(
        `${endpoint}?storeId=${storeId}&month=${selectedMonth}&format=csv`
      );
      const csvContent =
        typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      const filename =
        activeTab === 'gstr1' ? `GSTR1_${selectedMonth}.csv` : `GSTR3B_${selectedMonth}.csv`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, csvContent);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: `${activeTab.toUpperCase()} ${selectedMonth}`,
        });
      } else {
        platformAlertSimple('Saved', `File saved to: ${fileUri}`);
      }
    } catch {
      platformAlertSimple('Error', 'Failed to download CSV');
    } finally {
      setLoading(false);
    }
  };

  const [year, mon] = selectedMonth.split('-');
  const monthName = new Date(parseInt(year), parseInt(mon) - 1).toLocaleString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>GST Export</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tab Toggle */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'gstr1' && styles.tabActive]}
          onPress={() => {
            setActiveTab('gstr1');
            setSummary(null);
          }}
        >
          <Text style={[styles.tabText, activeTab === 'gstr1' && styles.tabTextActive]}>
            GSTR-1
          </Text>
          <Text style={[styles.tabSub, activeTab === 'gstr1' && styles.tabSubActive]}>
            Outward Supplies
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'gstr3b' && styles.tabActive]}
          onPress={() => {
            setActiveTab('gstr3b');
            setSummary(null);
          }}
        >
          <Text style={[styles.tabText, activeTab === 'gstr3b' && styles.tabTextActive]}>
            GSTR-3B
          </Text>
          <Text style={[styles.tabSub, activeTab === 'gstr3b' && styles.tabSubActive]}>
            Summary Return
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Select Month</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthScroll}>
          {months.map((m) => {
            const [y, mo] = m.split('-');
            const label = new Date(parseInt(y), parseInt(mo) - 1).toLocaleString('en-IN', {
              month: 'short',
              year: '2-digit',
            });
            return (
              <TouchableOpacity
                key={m}
                style={[styles.monthChip, selectedMonth === m && styles.monthChipActive]}
                onPress={() => {
                  setSelectedMonth(m);
                  setSummary(null);
                }}
              >
                <Text
                  style={[styles.monthChipText, selectedMonth === m && styles.monthChipTextActive]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity style={styles.fetchButton} onPress={fetchSummary} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.fetchButtonText}>Load {monthName} Data</Text>
          )}
        </TouchableOpacity>

        {/* GSTR-1 Summary */}
        {summary && activeTab === 'gstr1' && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>GSTR-1 Summary — {monthName}</Text>
            <SummaryRow
              label="Total Invoices"
              value={String(summary.summary?.totalInvoices || 0)}
            />
            <SummaryRow
              label="Taxable Value"
              value={`₹${fmt(summary.summary?.totalTaxableValue)}`}
            />
            <SummaryRow label="CGST" value={`₹${fmt(summary.summary?.totalCGST)}`} />
            <SummaryRow label="SGST" value={`₹${fmt(summary.summary?.totalSGST)}`} />
            <SummaryRow label="Grand Total" value={`₹${fmt(summary.summary?.grandTotal)}`} bold />
            <DownloadButton onPress={downloadCSV} loading={loading} />
          </View>
        )}

        {/* GSTR-3B Summary */}
        {summary && activeTab === 'gstr3b' && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>GSTR-3B Summary — {monthName}</Text>

            <Text style={styles.sectionHeader}>3.1 Outward Supplies</Text>
            <SummaryRow
              label="Taxable Invoices"
              value={String(summary.section3_1?.totalInvoices || 0)}
            />
            <SummaryRow
              label="Taxable Value"
              value={`₹${fmt(summary.section3_1?.taxableSupplies?.taxableValue)}`}
            />
            <SummaryRow label="CGST" value={`₹${fmt(summary.section3_1?.taxableSupplies?.cgst)}`} />
            <SummaryRow label="SGST" value={`₹${fmt(summary.section3_1?.taxableSupplies?.sgst)}`} />
            <SummaryRow label="IGST" value={`₹${fmt(summary.section3_1?.taxableSupplies?.igst)}`} />
            <SummaryRow
              label="Total Output Tax"
              value={`₹${fmt(summary.section3_1?.taxableSupplies?.totalTax)}`}
              bold
            />
            <SummaryRow
              label="Nil / Exempt Sales"
              value={`₹${fmt(summary.section3_1?.nilExemptSupplies?.taxableValue)}`}
            />

            <Text style={[styles.sectionHeader, { marginTop: 12 }]}>
              4. Input Tax Credit (Estimated)
            </Text>
            <SummaryRow
              label="Received Purchase Orders"
              value={String(summary.section4?.purchaseOrderCount || 0)}
            />
            <SummaryRow
              label="Total Purchase Value"
              value={`₹${fmt(summary.section4?.totalPurchaseValue)}`}
            />
            <SummaryRow
              label="Eligible ITC (est.)"
              value={`₹${fmt(summary.section4?.eligibleITC)}`}
              bold
            />

            <Text style={[styles.sectionHeader, { marginTop: 12 }]}>6.1 Net Tax Payable</Text>
            <SummaryRow label="CGST Payable" value={`₹${fmt(summary.section6_1?.cgstPayable)}`} />
            <SummaryRow label="SGST Payable" value={`₹${fmt(summary.section6_1?.sgstPayable)}`} />
            <SummaryRow label="IGST Payable" value={`₹${fmt(summary.section6_1?.igstPayable)}`} />
            <SummaryRow
              label="Net Tax Payable"
              value={`₹${fmt(summary.section6_1?.netPayable)}`}
              bold
            />

            <View style={styles.itcNote}>
              <Ionicons name="warning-outline" size={14} color="#92400e" />
              <Text style={styles.itcNoteText}>
                ITC is estimated. Verify against actual purchase invoices before filing.
              </Text>
            </View>

            <DownloadButton onPress={downloadCSV} loading={loading} />
          </View>
        )}

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color="#4f46e5" />
          <Text style={styles.infoText}>
            {activeTab === 'gstr1'
              ? 'Export and share with your CA for GSTR-1 monthly filing. Covers all GST-applicable sales.'
              : "GSTR-3B is a monthly summary return. Export CSV to pre-fill your CA's filing tool. Always verify ITC with purchase invoices."}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function fmt(n?: number): string {
  return (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={[styles.summaryRow, bold && styles.totalRow]}>
      <Text style={[styles.summaryLabel, bold && styles.totalLabel]}>{label}</Text>
      <Text style={[styles.summaryValue, bold && styles.totalValue]}>{value}</Text>
    </View>
  );
}

function DownloadButton({ onPress, loading }: { onPress: () => void; loading: boolean }) {
  return (
    <TouchableOpacity style={styles.downloadButton} onPress={onPress} disabled={loading}>
      <Ionicons name="download-outline" size={18} color="#fff" />
      <Text style={styles.downloadText}>Download CSV for CA</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#111' },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#4f46e5' },
  tabText: { fontSize: 14, fontWeight: '700', color: '#6b7280' },
  tabTextActive: { color: '#4f46e5' },
  tabSub: { fontSize: 11, color: '#9ca3af', marginTop: 1 },
  tabSubActive: { color: '#818cf8' },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 12 },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    marginTop: 4,
  },
  monthScroll: { marginBottom: 16 },
  monthChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  monthChipActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  monthChipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  monthChipTextActive: { color: '#fff' },
  fetchButton: {
    backgroundColor: '#4f46e5',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  fetchButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 12 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  summaryLabel: { fontSize: 13, color: '#6b7280' },
  summaryValue: { fontSize: 13, fontWeight: '600', color: '#111' },
  totalRow: { borderBottomWidth: 0, marginTop: 4, paddingTop: 8 },
  totalLabel: { fontSize: 14, fontWeight: '700', color: '#111' },
  totalValue: { fontSize: 14, fontWeight: '700', color: '#4f46e5' },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  downloadText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  itcNote: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 10,
    gap: 6,
    marginTop: 12,
    alignItems: 'flex-start',
  },
  itcNoteText: { flex: 1, fontSize: 12, color: '#92400e', lineHeight: 16 },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  infoText: { flex: 1, fontSize: 13, color: '#1d4ed8', lineHeight: 18 },
});
