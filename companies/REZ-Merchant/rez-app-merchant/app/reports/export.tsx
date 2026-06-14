/**
 * CSV Export Screen — Generate and share CSV exports for transactions, customers, or payouts.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Shadows } from '@/constants/DesignTokens';
import { storageService } from '@/services/storage';
import { getApiUrl } from '@/config/api';
import { useStore } from '@/contexts/StoreContext';
import { reportService, DateRange as ReportDateRange } from '@/services/reportService';

// ─── Types ────────────────────────────────────────────────────────────────────

type ReportType = 'transactions' | 'customers' | 'payouts';
type DateRange = 'this_month' | 'last_month' | 'last_3_months' | 'custom';

interface ExportRecord {
  filename: string;
  path: string;
  type: ReportType;
  generatedAt: string;
}

const PREVIOUS_EXPORTS_KEY = 'rez_previous_exports_v1';
const MAX_STORED_EXPORTS = 3;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDateRange(
  range: DateRange,
  customFrom: string,
  customTo: string
): { from: string; to: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (range === 'this_month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: fmt(from), to: fmt(now) };
  }
  if (range === 'last_month') {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const to = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: fmt(from), to: fmt(to) };
  }
  if (range === 'last_3_months') {
    const from = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    return { from: fmt(from), to: fmt(now) };
  }
  return { from: customFrom, to: customTo };
}

function formatDisplayDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface PillProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function Pill({ label, selected, onPress }: PillProps) {
  return (
    <TouchableOpacity
      style={[styles.pill, selected && styles.pillSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

interface DateInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

// Cross-platform date input. Uses a plain TextInput because Alert.prompt is iOS-only
// and would crash on Android/Web. Validation happens at submit time.
function DateInput({ label, value, onChange }: DateInputProps) {
  return (
    <View style={styles.dateInputWrap}>
      <Text style={styles.dateInputLabel}>{label}</Text>
      <View style={styles.dateInputBox}>
        <Ionicons name="calendar-outline" size={16} color="#6366F1" />
        <TextInput
          style={styles.dateInputText}
          value={value}
          onChangeText={onChange}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />
      </View>
    </View>
  );
}

// YYYY-MM-DD validator that also rejects obviously-bad dates like 2026-13-45.
function isValidIsoDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s);
  return !isNaN(d.getTime()) && s === d.toISOString().slice(0, 10);
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ExportScreen() {
  const router = useRouter();
  const { activeStore } = useStore();

  const [reportType, setReportType] = useState<ReportType>('transactions');
  const [dateRange, setDateRange] = useState<DateRange>('this_month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previousExports, setPreviousExports] = useState<ExportRecord[]>([]);

  const storeId = activeStore?._id || '';

  const loadPreviousExports = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(PREVIOUS_EXPORTS_KEY);
      if (raw) setPreviousExports(JSON.parse(raw));
    } catch {
      // Non-blocking
    }
  }, []);

  useEffect(() => {
    loadPreviousExports();
  }, [loadPreviousExports]);

  const savePreviousExport = async (record: ExportRecord) => {
    try {
      // Use functional update to avoid stale closure when exports fire in rapid succession.
      let updated: ExportRecord[] = [];
      setPreviousExports((prev) => {
        updated = [record, ...prev].slice(0, MAX_STORED_EXPORTS);
        return updated;
      });
      await AsyncStorage.setItem(PREVIOUS_EXPORTS_KEY, JSON.stringify(updated));
    } catch {
      // Non-blocking
    }
  };

  const handleGenerate = async () => {
    setError(null);
    const { from, to } = getDateRange(dateRange, customFrom, customTo);

    if (dateRange === 'custom') {
      if (!from || !to) {
        setError('Please select both a from and to date for custom range.');
        return;
      }
      if (!isValidIsoDate(from) || !isValidIsoDate(to)) {
        setError('Please enter valid dates in YYYY-MM-DD format.');
        return;
      }
      if (from > to) {
        setError('"From" date must be on or before "to" date.');
        return;
      }
    }

    if (!storeId) {
      setError('Please select a store before generating an export.');
      return;
    }

    setLoading(true);
    try {
      // Try using report service first for Excel exports
      const merchantId = activeStore?.merchantId || activeStore?._id || '';
      const reportDateRange: ReportDateRange = { startDate: from, endDate: to };

      // Map report type to report service format
      const reportTypeMap: Record<string, 'sales' | 'revenue' | 'customers' | 'inventory'> = {
        transactions: 'sales',
        customers: 'customers',
        payouts: 'revenue',
      };

      const mappedReportType = reportTypeMap[reportType];

      if (mappedReportType && merchantId) {
        try {
          // Try Excel export via report service
          const exportResult = await reportService.exportToExcel(mappedReportType, merchantId, reportDateRange);

          await savePreviousExport({
            filename: exportResult.filename || `rez_${reportType}_${from}_${to}.xlsx`,
            path: exportResult.url || '',
            type: reportType,
            generatedAt: exportResult.generatedAt || new Date().toISOString(),
          });

          Alert.alert('Export Ready', 'Your Excel report has been generated. Check your downloads.');
          setLoading(false);
          return;
        } catch (reportError) {
          // Fall through to legacy CSV API
          console.warn('[Export] Report service failed, using legacy API:', reportError);
        }
      }

      // Legacy CSV export via direct API
      const token = await storageService.getAuthToken();
      if (!token) {
        throw new Error('You are not signed in. Please log in again.');
      }
      const baseUrl = getApiUrl().replace(/\/$/, '');
      // Backend routes are mounted at /api/merchant/exports (plural) with per-type endpoints.
      // storeId is required by the route for ownership check + store scoping.
      const url = `${baseUrl}/merchant/exports/${reportType}?storeId=${encodeURIComponent(
        storeId
      )}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&format=csv`;
      const fetchResp = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'text/csv',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!fetchResp.ok) {
        // Try to parse error body as JSON for a clearer message.
        let msg = `Server returned ${fetchResp.status}`;
        try {
          const body = await fetchResp.text();
          const parsed = JSON.parse(body);
          if (parsed?.message) msg = parsed.message;
        } catch {
          // Non-JSON body — keep default message.
        }
        throw new Error(msg);
      }

      const csvContent = await fetchResp.text();
      const filename = `rez_${reportType}_${from}_${to}.csv`;
      const filePath = `${FileSystem.cacheDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(filePath, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      await savePreviousExport({
        filename,
        path: filePath,
        type: reportType,
        generatedAt: new Date().toISOString(),
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'text/csv',
          dialogTitle: `Share ${reportType} export`,
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        Alert.alert('Saved', `Export saved to: ${filePath}`);
      }
    } catch (err) {
      setError(err?.message || 'Failed to generate export. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSharePrevious = async (record: ExportRecord) => {
    try {
      const info = await FileSystem.getInfoAsync(record.path);
      if (!info.exists) {
        Alert.alert('File not found', 'This export file no longer exists in cache.');
        return;
      }
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(record.path, {
          mimeType: 'text/csv',
          dialogTitle: `Share ${record.type} export`,
        });
      }
    } catch {
      Alert.alert('Error', 'Unable to share this file.');
    }
  };

  const REPORT_TYPES: { key: ReportType; label: string }[] = [
    { key: 'transactions', label: 'Transactions' },
    { key: 'customers', label: 'Customers' },
    { key: 'payouts', label: 'Payouts' },
  ];

  const DATE_RANGES: { key: DateRange; label: string }[] = [
    { key: 'this_month', label: 'This Month' },
    { key: 'last_month', label: 'Last Month' },
    { key: 'last_3_months', label: 'Last 3 Months' },
    { key: 'custom', label: 'Custom' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={['#6366F1', '#4F46E5']} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Export Reports</Text>
        <Text style={styles.headerSubtitle}>Download your business data as CSV</Text>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Report Type */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Report Type</Text>
          <View style={styles.pillRow}>
            {REPORT_TYPES.map(({ key, label }) => (
              <Pill
                key={key}
                label={label}
                selected={reportType === key}
                onPress={() => setReportType(key)}
              />
            ))}
          </View>
        </View>

        {/* Date Range */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Date Range</Text>
          <View style={styles.pillRow}>
            {DATE_RANGES.map(({ key, label }) => (
              <Pill
                key={key}
                label={label}
                selected={dateRange === key}
                onPress={() => setDateRange(key)}
              />
            ))}
          </View>

          {dateRange === 'custom' && (
            <View style={styles.customDateRow}>
              <DateInput label="From" value={customFrom} onChange={setCustomFrom} />
              <DateInput label="To" value={customTo} onChange={setCustomTo} />
            </View>
          )}
        </View>

        {/* Error State */}
        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={18} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Generate Button */}
        <TouchableOpacity
          style={[styles.generateButton, loading && styles.generateButtonDisabled]}
          onPress={handleGenerate}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="download-outline" size={20} color="#fff" />
          )}
          <Text style={styles.generateButtonText}>
            {loading ? 'Generating...' : 'Generate Export'}
          </Text>
        </TouchableOpacity>

        {/* Previous Exports */}
        {previousExports.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Previous Exports</Text>
            <View style={styles.exportList}>
              {previousExports.map((record, idx) => (
                <TouchableOpacity
                  key={`${record.filename}-${idx}`}
                  style={[
                    styles.exportItem,
                    idx < previousExports.length - 1 && styles.exportItemBorder,
                  ]}
                  onPress={() => handleSharePrevious(record)}
                  activeOpacity={0.7}
                >
                  <View style={styles.exportIconWrap}>
                    <Ionicons name="document-text-outline" size={20} color="#6366F1" />
                  </View>
                  <View style={styles.exportInfo}>
                    <Text style={styles.exportFilename} numberOfLines={1}>
                      {record.filename}
                    </Text>
                    <Text style={styles.exportMeta}>
                      {record.type.charAt(0).toUpperCase() + record.type.slice(1)} •{' '}
                      {formatDisplayDate(record.generatedAt)}
                    </Text>
                  </View>
                  <Ionicons name="share-outline" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 40) + 10,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  backButton: {
    marginBottom: 12,
    alignSelf: 'flex-start',
    padding: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text?.secondary || '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
  },
  pillSelected: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  pillTextSelected: {
    color: '#fff',
  },
  customDateRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  dateInputWrap: {
    flex: 1,
  },
  dateInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  dateInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  dateInputText: {
    fontSize: 13,
    color: '#374151',
    flex: 1,
    padding: 0,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '500',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 28,
    ...Shadows.md,
  },
  generateButtonDisabled: {
    opacity: 0.65,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  exportList: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Shadows.sm,
  },
  exportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  exportItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  exportIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportInfo: {
    flex: 1,
  },
  exportFilename: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  exportMeta: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
});
