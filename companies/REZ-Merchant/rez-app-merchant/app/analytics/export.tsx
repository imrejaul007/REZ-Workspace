import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { analyticsService } from '@/services/api/analytics';
import type { ExportRequest } from '../../types/analytics';
import { Colors, Spacing } from '@/constants/DesignTokens';

type ExportFormat = 'csv' | 'excel' | 'pdf';
type ReportType = ExportRequest['reportTypes'][number];
type DatePreset = '7d' | '14d' | '30d' | '90d';

const REPORT_OPTIONS: { key: ReportType; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview', icon: 'bar-chart-outline' },
  { key: 'sales_forecast', label: 'Sales Forecast', icon: 'trending-up-outline' },
  { key: 'inventory', label: 'Inventory', icon: 'cube-outline' },
  { key: 'customers', label: 'Customers', icon: 'people-outline' },
  { key: 'trends', label: 'Trends', icon: 'analytics-outline' },
  { key: 'products', label: 'Products', icon: 'pricetag-outline' },
  { key: 'revenue', label: 'Revenue', icon: 'cash-outline' },
];

const FORMAT_OPTIONS: { key: ExportFormat; label: string; icon: string }[] = [
  { key: 'csv', label: 'CSV', icon: 'document-text-outline' },
  { key: 'excel', label: 'Excel', icon: 'grid-outline' },
  { key: 'pdf', label: 'PDF', icon: 'document-outline' },
];

const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: '7d', label: 'Last 7 days' },
  { key: '14d', label: 'Last 14 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: '90d', label: 'Last 90 days' },
];

export default function ExportAnalyticsScreen() {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
  const [selectedReports, setSelectedReports] = useState<Set<ReportType>>(new Set(['overview']));
  const [selectedPreset, setSelectedPreset] = useState<DatePreset>('30d');
  const [loading, setLoading] = useState(false);

  const toggleReport = (key: ReportType) => {
    setSelectedReports((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size === 1) return prev; // keep at least one
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleExport = async () => {
    if (selectedReports.size === 0) {
      Alert.alert('Select Reports', 'Please select at least one report type.');
      return;
    }
    setLoading(true);
    try {
      const dateRange = analyticsService.buildDateRangeFromPreset(selectedPreset);
      const exportRequest: ExportRequest = {
        format: selectedFormat,
        reportTypes: Array.from(selectedReports),
        timeRange: dateRange,
      };
      const result = await analyticsService.exportAnalytics(exportRequest);
      if (result.url) {
        Alert.alert(
          'Export Ready',
          `Your ${selectedFormat.toUpperCase()} report is ready.\n\nFile: ${result.filename}`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open',
              onPress: () => Linking.openURL(result.url),
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Export Failed', error.message || 'Could not generate export. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary[500]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Export Analytics</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Format */}
        <Text style={styles.sectionTitle}>Export Format</Text>
        <View style={styles.optionsRow}>
          {FORMAT_OPTIONS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.formatChip, selectedFormat === f.key && styles.formatChipActive]}
              onPress={() => setSelectedFormat(f.key)}
            >
              <Ionicons
                name={f.icon as unknown as keyof typeof Ionicons.glyphMap}
                size={18}
                color={selectedFormat === f.key ? Colors.text.inverse : Colors.text.secondary}
              />
              <Text
                style={[
                  styles.formatChipText,
                  selectedFormat === f.key && styles.formatChipTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date Range */}
        <Text style={styles.sectionTitle}>Date Range</Text>
        <View style={styles.optionsRow}>
          {DATE_PRESETS.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[styles.presetChip, selectedPreset === p.key && styles.presetChipActive]}
              onPress={() => setSelectedPreset(p.key)}
            >
              <Text
                style={[
                  styles.presetChipText,
                  selectedPreset === p.key && styles.presetChipTextActive,
                ]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Report Types */}
        <Text style={styles.sectionTitle}>Report Types</Text>
        <Text style={styles.sectionSubtitle}>Select one or more reports to include</Text>
        {REPORT_OPTIONS.map((r) => {
          const isSelected = selectedReports.has(r.key);
          return (
            <TouchableOpacity
              key={r.key}
              style={[styles.reportRow, isSelected && styles.reportRowActive]}
              onPress={() => toggleReport(r.key)}
            >
              <View style={styles.reportLeft}>
                <Ionicons
                  name={r.icon as unknown as keyof typeof Ionicons.glyphMap}
                  size={20}
                  color={isSelected ? Colors.primary[500] : Colors.text.secondary}
                />
                <Text style={[styles.reportLabel, isSelected && styles.reportLabelActive]}>
                  {r.label}
                </Text>
              </View>
              <Ionicons
                name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={isSelected ? Colors.primary[500] : Colors.gray[300]}
              />
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Export Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.exportButton, loading && styles.exportButtonDisabled]}
          onPress={handleExport}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.text.inverse} />
          ) : (
            <>
              <Ionicons name="download-outline" size={20} color={Colors.text.inverse} />
              <Text style={styles.exportButtonText}>Export {selectedFormat.toUpperCase()}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: -Spacing.xs,
    marginBottom: Spacing.sm,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  formatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    backgroundColor: Colors.background.primary,
    borderWidth: 1.5,
    borderColor: Colors.border.light,
  },
  formatChipActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  formatChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  formatChipTextActive: {
    color: Colors.text.inverse,
  },
  presetChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    backgroundColor: Colors.background.primary,
    borderWidth: 1.5,
    borderColor: Colors.border.light,
  },
  presetChipActive: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[500],
  },
  presetChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text.secondary,
  },
  presetChipTextActive: {
    color: Colors.primary[600],
    fontWeight: '700',
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderRadius: 10,
    marginBottom: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.border.light,
  },
  reportRowActive: {
    borderColor: Colors.primary[300],
    backgroundColor: Colors.primary[50],
  },
  reportLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  reportLabel: {
    fontSize: 15,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  reportLabelActive: {
    color: Colors.primary[700],
    fontWeight: '600',
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: Colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing.md,
    borderRadius: 12,
  },
  exportButtonDisabled: {
    opacity: 0.6,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
});
