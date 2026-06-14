/**
 * Reports & Exports Screen
 * Download business data in various formats: CSV, XML, JSON
 * Features: Date range selection, multiple export formats, download history
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { platformAlertSimple } from '@/utils/platformAlert';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useStore } from '@/contexts/StoreContext';
import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';
import { reportService, DateRange as ReportDateRange } from '@/services/reportService';
import { logger } from '@/utils/logger';
import Toast from 'react-native-toast-message';

interface ReportExport {
  id: string;
  type: string;
  date: string;
  filename: string;
}

interface ExportCard {
  id: string;
  icon: string;
  title: string;
  description: string;
  color: string;
  iconBg: string;
  endpoint: string;
  format: string;
}

type DateRange = 'today' | 'week' | 'month' | 'last-month' | 'custom';

export default function ReportsScreen() {
  const router = useRouter();
  const { activeStore } = useStore();
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [recentExports, setRecentExports] = useState<ReportExport[]>([]);

  // Prompt modal state (replaces iOS-only Alert.prompt)
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [promptField, setPromptField] = useState<'from' | 'to'>('from');
  const [promptValue, setPromptValue] = useState('');

  // Load recent exports on mount
  useEffect(() => {
    loadRecentExports();
  }, []);

  const loadRecentExports = async () => {
    try {
      const stored = await AsyncStorage.getItem('recent_exports');
      if (stored) {
        try {
          setRecentExports(JSON.parse(stored).slice(0, 5));
        } catch (e) {
          logger.error('[Reports] Failed to parse recent exports:', e);
          setRecentExports([]);
        }
      }
    } catch (error) {
      logger.error('[Reports] Failed to load recent exports:', error);
    }
  };

  const saveExportToHistory = async (type: string, filename: string) => {
    try {
      const existing = await AsyncStorage.getItem('recent_exports');
      const exports: ReportExport[] = existing ? JSON.parse(existing) : [];

      const newExport: ReportExport = {
        id: Date.now().toString(),
        type,
        date: new Date().toLocaleString(),
        filename,
      };

      const updated = [newExport, ...exports].slice(0, 5);
      await AsyncStorage.setItem('recent_exports', JSON.stringify(updated));
      setRecentExports(updated);
    } catch (error) {
      logger.error('[Reports] Failed to save export to history:', error);
    }
  };

  const getDateRange = (): { startDate: string; endDate: string } => {
    const today = new Date();
    let startDate: Date;
    let endDate: Date = new Date();

    switch (dateRange) {
      case 'today':
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        break;
      case 'week':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'last-month':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'custom':
        if (!customFromDate || !customToDate) {
          platformAlertSimple('Error', 'Please select both start and end dates');
          return { startDate: '', endDate: '' };
        }
        return {
          startDate: customFromDate,
          endDate: customToDate,
        };
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    }

    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    return {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
    };
  };

  const handleDownload = async (exportCard: ExportCard) => {
    if (!activeStore) {
      platformAlertSimple('Error', 'Please select a store first');
      return;
    }

    setDownloadingId(exportCard.id);

    try {
      const { startDate, endDate } = getDateRange();
      if (!startDate || !endDate) return;

      // Try using the report service for PDF/Excel exports first
      const reportTypeMap: Record<string, 'sales' | 'revenue' | 'customers' | 'inventory'> = {
        sales: 'sales',
        tally: 'sales',
        gst: 'revenue',
        payroll: 'sales',
        campaigns: 'sales',
      };

      const reportType = reportTypeMap[exportCard.id];
      const dateRange: ReportDateRange = { startDate, endDate };

      // For PDF and Excel exports, use the report service
      if ((exportCard.format === 'pdf' || exportCard.format === 'excel') && reportType) {
        const merchantId = activeStore.merchantId || activeStore._id;

        try {
          const exportResult = exportCard.format === 'pdf'
            ? await reportService.exportToPDF(reportType, merchantId, dateRange)
            : await reportService.exportToExcel(reportType, merchantId, dateRange);

          const filename = exportResult.filename || `rez-${exportCard.id}-${new Date().toISOString().split('T')[0]}.${exportCard.format}`;

          // Save to history
          await saveExportToHistory(exportCard.title, filename);

          Toast.show({
            type: 'success',
            text1: 'Export Ready',
            text2: `Your ${exportCard.title} has been generated`,
          });
        } catch (reportError) {
          // Fall back to legacy API if report service fails
          logger.warn('[Reports] Report service failed, falling back to legacy API:', reportError);
          await downloadViaLegacyAPI(exportCard, startDate, endDate);
        }
      } else {
        // For other formats (csv, xml), use the legacy API
        await downloadViaLegacyAPI(exportCard, startDate, endDate);
      }
    } catch (error) {
      logger.error('Download error:', error);
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to download export';

      platformAlertSimple('Download Failed', errorMessage);
    } finally {
      setDownloadingId(null);
    }
  };

  // Legacy API download function
  const downloadViaLegacyAPI = async (exportCard: ExportCard, startDate: string, endDate: string) => {
    const params = new URLSearchParams({
      storeId: activeStore._id,
      startDate,
      endDate,
      format: exportCard.format,
    });

    const url = `/merchant/${exportCard.endpoint}?${params.toString()}`;

    // Make API request with responseType: arraybuffer for binary data
    const response = await apiClient.getAxiosInstance().get(url, {
      responseType: 'arraybuffer',
    });

    // Generate filename with current date
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `rez-${exportCard.id}-${currentDate}.${exportCard.format}`;
    const fileUri = `${FileSystem.documentDirectory}${filename}`;

    // Write file to document directory
    await FileSystem.writeAsStringAsync(fileUri, Buffer.from(response.data).toString('base64'), {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Share the file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType:
          exportCard.format === 'xml'
            ? 'application/xml'
            : exportCard.format === 'csv'
              ? 'text/csv'
              : 'application/json',
        dialogTitle: `Export ${exportCard.title}`,
      });
    } else {
      platformAlertSimple('Success', `File saved to ${filename}`);
    }

    // Save to history
    await saveExportToHistory(exportCard.title, filename);

    // Show success toast
    Toast.show({
      type: 'success',
      text1: 'Download Complete',
      text2: `${exportCard.title} exported successfully`,
    });
  };

  const exportCards: ExportCard[] = [
    {
      id: 'sales',
      icon: 'receipt-outline',
      title: 'Sales Report',
      description: 'All orders in selected period',
      color: '#7C3AED',
      iconBg: '#EDE9FE',
      endpoint: 'documents/export/csv',
      format: 'csv',
    },
    {
      id: 'tally',
      icon: 'server-outline',
      title: 'Tally Export',
      description: 'Tally XML for accounting software',
      color: '#2563EB',
      iconBg: '#EFF6FF',
      endpoint: 'documents/export/tally',
      format: 'xml',
    },
    {
      id: 'gst',
      icon: 'document-text-outline',
      title: 'GST Summary',
      description: 'GST breakdown by category',
      color: '#059669',
      iconBg: '#ECFDF5',
      endpoint: 'documents/export/gst',
      format: 'csv',
    },
    {
      id: 'payroll',
      icon: 'people-outline',
      title: 'Staff Payroll',
      description: 'Staff hours and payroll data',
      color: '#D97706',
      iconBg: '#FEF3C7',
      endpoint: 'documents/export/payroll',
      format: 'csv',
    },
    {
      id: 'campaigns',
      icon: 'megaphone-outline',
      title: 'Campaign Performance',
      description: 'Campaign reach, engagement, ROI',
      color: '#7C3AED',
      iconBg: '#EDE9FE',
      endpoint: 'broadcasts',
      format: 'csv',
    },
  ];

  const renderDateRangeSelector = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Date Range</Text>

      {/* Quick select chips */}
      <View style={styles.chipsContainer}>
        {(['today', 'week', 'month', 'last-month', 'custom'] as DateRange[]).map((range) => (
          <TouchableOpacity
            key={range}
            style={[styles.chip, dateRange === range && styles.chipActive]}
            onPress={() => setDateRange(range)}
          >
            <Text style={[styles.chipText, dateRange === range && styles.chipTextActive]}>
              {range === 'today' && 'Today'}
              {range === 'week' && 'This Week'}
              {range === 'month' && 'This Month'}
              {range === 'last-month' && 'Last Month'}
              {range === 'custom' && 'Custom'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Custom date inputs */}
      {dateRange === 'custom' && (
        <View style={styles.customDateContainer}>
          <View style={styles.dateInputGroup}>
            <Text style={styles.dateLabel}>From Date</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => {
                setPromptField('from');
                setPromptValue(customFromDate);
                setShowPromptModal(true);
              }}
            >
              <Text style={styles.dateInputText}>{customFromDate || 'Select date'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dateInputGroup}>
            <Text style={styles.dateLabel}>To Date</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => {
                setPromptField('to');
                setPromptValue(customToDate);
                setShowPromptModal(true);
              }}
            >
              <Text style={styles.dateInputText}>{customToDate || 'Select date'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  const renderExportCard = (card: ExportCard) => (
    <TouchableOpacity
      key={card.id}
      style={styles.exportCard}
      onPress={() => handleDownload(card)}
      disabled={downloadingId !== null}
      activeOpacity={0.7}
    >
      <View style={[styles.exportIconContainer, { backgroundColor: card.iconBg }]}>
        <Ionicons name={card.icon as unknown as keyof typeof Ionicons.glyphMap} size={28} color={card.color} />
      </View>

      <View style={styles.exportContent}>
        <Text style={styles.exportTitle}>{card.title}</Text>
        <Text style={styles.exportDescription}>{card.description}</Text>
      </View>

      {downloadingId === card.id ? (
        <ActivityIndicator color={card.color} size="small" />
      ) : (
        <View style={styles.downloadButton}>
          <Ionicons name="download" size={20} color={card.color} />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderRecentExports = () => {
    if (recentExports.length === 0) {
      return null;
    }

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Exports</Text>
        <View style={styles.recentList}>
          {recentExports.map((exp) => (
            <View key={exp.id} style={styles.recentItem}>
              <View style={styles.recentInfo}>
                <Text style={styles.recentType}>{exp.type}</Text>
                <Text style={styles.recentDate}>{exp.date}</Text>
              </View>
              <TouchableOpacity
                style={styles.reDownloadButton}
                onPress={() => {
                  Toast.show({
                    type: 'info',
                    text1: 'Tip',
                    text2: 'Re-download from available reports above',
                  });
                }}
              >
                <Ionicons name="download" size={18} color="#7C3AED" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const handlePromptSubmit = () => {
    if (promptField === 'from') {
      setCustomFromDate(promptValue);
    } else {
      setCustomToDate(promptValue);
    }
    setShowPromptModal(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Cross-platform date prompt modal (replaces iOS-only Alert.prompt) */}
      <Modal
        visible={showPromptModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPromptModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {promptField === 'from' ? 'Enter From Date' : 'Enter To Date'}
            </Text>
            <Text style={styles.modalSubtitle}>Format: YYYY-MM-DD</Text>
            <TextInput
              style={styles.modalInput}
              value={promptValue}
              onChangeText={setPromptValue}
              placeholder="e.g. 2024-01-01"
              placeholderTextColor={Colors.light.textMuted}
              autoFocus
              keyboardType="default"
              returnKeyType="done"
              onSubmitEditing={handlePromptSubmit}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowPromptModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSubmit]}
                onPress={handlePromptSubmit}
              >
                <Text style={styles.modalButtonSubmitText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Header */}
      <LinearGradient colors={['#7C3AED', '#6366F1']} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Reports & Exports</Text>
            <Text style={styles.headerSubtitle}>Download your business data</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Date Range Selector */}
        {renderDateRangeSelector()}

        {/* Export Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Reports</Text>
          {exportCards.map(renderExportCard)}
        </View>

        {/* Recent Exports */}
        {renderRecentExports()}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundTertiary,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 40) + 10,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.card,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },

  // Card styles
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.textHeading,
    marginBottom: 12,
  },

  // Date range selector
  chipsContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundTertiary,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  chipActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textMuted,
  },
  chipTextActive: {
    color: Colors.light.card,
  },

  // Custom date inputs
  customDateContainer: {
    marginTop: 16,
    gap: 12,
  },
  dateInputGroup: {
    gap: 6,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textMuted,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.light.backgroundTertiary,
  },
  dateInputText: {
    fontSize: 14,
    color: Colors.light.text,
  },

  // Section
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },

  // Export cards
  exportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 12,
  },
  exportIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportContent: {
    flex: 1,
    gap: 2,
  },
  exportTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  exportDescription: {
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  downloadButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
  },

  // Recent exports
  recentList: {
    gap: 10,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: Colors.light.backgroundTertiary,
    borderRadius: 10,
  },
  recentInfo: {
    flex: 1,
    gap: 2,
  },
  recentType: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  recentDate: {
    fontSize: 11,
    color: Colors.light.textMuted,
  },
  reDownloadButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Date prompt modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  modalBox: {
    width: '100%',
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.textHeading,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.light.textMuted,
    textAlign: 'center',
    marginTop: -6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundTertiary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: Colors.light.backgroundTertiary,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  modalButtonCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textMuted,
  },
  modalButtonSubmit: {
    backgroundColor: '#7C3AED',
  },
  modalButtonSubmitText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
