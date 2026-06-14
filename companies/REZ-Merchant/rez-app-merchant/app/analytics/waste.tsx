import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Modal,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';
import { showAlert } from '@/utils/alert';
import { logger } from '@/utils/logger';
import { useStore } from '@/contexts/StoreContext';

interface WasteSummary {
  totalWaste: number;
  wastePercentageOfRevenue: number;
  targetPercentage: number;
  potentialSavings: number;
  byReason: Array<{
    reason: string;
    amount: number;
    percentage: number;
  }>;
  byCategory: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  recentLogs: Array<{
    date: string;
    amount: number;
    itemCount: number;
  }>;
}

type PeriodType = 'week' | 'month' | '3months';

export default function WasteAnalyticsScreen() {
  const { activeStore } = useStore();
  const [summary, setSummary] = useState<WasteSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<PeriodType>('month');
  const [showNewEntryModal, setShowNewEntryModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [wasteForm, setWasteForm] = useState({
    itemName: '',
    quantity: '',
    unit: 'kg',
    costPerUnit: '',
    reason: 'spoilage',
    notes: '',
  });

  const UNITS = ['kg', 'g', 'L', 'ml', 'pcs', 'portions'];
  const REASONS = ['spoilage', 'over_production', 'damaged', 'expired', 'other'];
  const REASON_LABELS: Record<string, string> = {
    spoilage: 'Spoilage',
    over_production: 'Over Production',
    damaged: 'Damaged',
    expired: 'Expired',
    other: 'Other',
  };

  const resetForm = () =>
    setWasteForm({
      itemName: '',
      quantity: '',
      unit: 'kg',
      costPerUnit: '',
      reason: 'spoilage',
      notes: '',
    });

  const handleLogWaste = async () => {
    if (!wasteForm.itemName.trim() || !wasteForm.quantity || !wasteForm.costPerUnit) {
      showAlert('Missing Fields', 'Item name, quantity, and cost per unit are required.');
      return;
    }
    try {
      setSubmitting(true);
      const response = await apiClient.post('/merchant/waste', {
        storeId: activeStore?._id,
        itemName: wasteForm.itemName.trim(),
        quantity: Number(wasteForm.quantity),
        unit: wasteForm.unit,
        costPerUnit: Number(wasteForm.costPerUnit),
        reason: wasteForm.reason,
        notes: wasteForm.notes.trim() || undefined,
      });
      if (response.success) {
        setShowNewEntryModal(false);
        resetForm();
        fetchAnalytics(true);
      } else {
        showAlert('Error', response.message || 'Failed to log waste entry');
      }
    } catch (error) {
      showAlert('Error', error?.message || 'Failed to log waste entry');
    } finally {
      setSubmitting(false);
    }
  };

  const getPeriodDays = (periodType: PeriodType): number => {
    switch (periodType) {
      case 'week':
        return 7;
      case '3months':
        return 90;
      default:
        return 30;
    }
  };

  const fetchAnalytics = useCallback(
    async (showRefreshing = false) => {
      try {
        if (showRefreshing) setRefreshing(true);
        else setIsLoading(true);

        const days = getPeriodDays(period);
        const storeId = activeStore?._id;
        const response = await apiClient.get<WasteSummary>(
          `/merchant/waste/summary?days=${days}${storeId ? `&storeId=${storeId}` : ''}`
        );

        if (response.success && response.data) {
          setSummary(response.data);
        } else {
          showAlert('Error', response.message || 'Failed to load analytics');
        }
      } catch (error) {
        logger.error('Error fetching waste analytics:', error);
        showAlert('Error', error?.message || 'Failed to load analytics');
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [period, activeStore]
  );

  useEffect(() => {
    fetchAnalytics();
  }, [period, fetchAnalytics]);

  const handleRefresh = () => {
    fetchAnalytics(true);
  };

  const getWasteStatusColor = (wastePercentage: number, target: number): string => {
    if (wastePercentage <= target) return Colors.light.success;
    return Colors.light.error;
  };

  const renderProgressBar = (percentage: number, total: number = 100) => {
    const width = (percentage / total) * 100;
    return (
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${Math.min(width, 100)}%`,
              backgroundColor: Colors.light.tint,
            },
          ]}
        />
      </View>
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <ThemedText style={styles.loadingText}>Loading analytics...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Waste Analytics</ThemedText>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['week', 'month', '3months'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodButton, period === p && styles.periodButtonActive]}
              onPress={() => setPeriod(p)}
            >
              <ThemedText
                style={[styles.periodButtonText, period === p && styles.periodButtonTextActive]}
              >
                {p === 'week' ? 'Week' : p === 'month' ? 'Month' : '3 Months'}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {summary && (
          <>
            {/* Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View>
                  <ThemedText style={styles.summaryValue}>
                    ₹{summary.totalWaste.toLocaleString()}
                  </ThemedText>
                  <ThemedText style={styles.summaryLabel}>Total waste</ThemedText>
                </View>
                <View
                  style={[
                    styles.summaryBadge,
                    {
                      backgroundColor: `${getWasteStatusColor(
                        summary.wastePercentageOfRevenue,
                        summary.targetPercentage
                      )}20`,
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.summaryBadgeText,
                      {
                        color: getWasteStatusColor(
                          summary.wastePercentageOfRevenue,
                          summary.targetPercentage
                        ),
                      },
                    ]}
                  >
                    {summary.wastePercentageOfRevenue.toFixed(1)}%
                  </ThemedText>
                </View>
              </View>

              <View style={styles.targetRow}>
                <ThemedText style={styles.targetLabel}>Target:</ThemedText>
                <ThemedText style={styles.targetValue}>
                  {'< ' + summary.targetPercentage + '%'}
                </ThemedText>
                <View style={styles.statusBadge}>
                  {summary.wastePercentageOfRevenue > summary.targetPercentage ? (
                    <>
                      <Ionicons name="alert-circle" size={16} color={Colors.light.error} />
                      <ThemedText style={styles.statusText}>Above target</ThemedText>
                    </>
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={16} color={Colors.light.success} />
                      <ThemedText style={[styles.statusText, { color: Colors.light.success }]}>
                        On target
                      </ThemedText>
                    </>
                  )}
                </View>
              </View>

              {summary.potentialSavings > 0 && (
                <View style={styles.insightRow}>
                  <Ionicons name="bulb" size={16} color={Colors.light.warning} />
                  <ThemedText style={styles.insightText}>
                    Reducing to {summary.targetPercentage}% saves ₹
                    {summary.potentialSavings.toLocaleString()}/month
                  </ThemedText>
                </View>
              )}
            </View>

            {/* By Reason */}
            {summary.byReason.length > 0 && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>By reason</ThemedText>
                {summary.byReason.map((item, index) => (
                  <View key={`${item.reason}-${index}`} style={styles.breakdownItem}>
                    <View style={styles.breakdownHeader}>
                      <ThemedText style={styles.breakdownLabel}>{item.reason}</ThemedText>
                      <ThemedText style={styles.breakdownValue}>
                        {item.percentage.toFixed(0)}%
                      </ThemedText>
                    </View>
                    {renderProgressBar(item.percentage)}
                  </View>
                ))}
              </View>
            )}

            {/* By Category */}
            {summary.byCategory.length > 0 && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>By category</ThemedText>
                {summary.byCategory.map((item, index) => (
                  <View key={`${item.category}-${index}`} style={styles.breakdownItem}>
                    <View style={styles.breakdownHeader}>
                      <ThemedText style={styles.breakdownLabel}>{item.category}</ThemedText>
                      <ThemedText style={styles.breakdownValue}>
                        ₹{item.amount.toLocaleString()}
                      </ThemedText>
                    </View>
                    {renderProgressBar(item.percentage)}
                  </View>
                ))}
              </View>
            )}

            {/* Recent Logs */}
            {summary.recentLogs.length > 0 && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Recent logs</ThemedText>
                <FlatList
                  data={summary.recentLogs}
                  renderItem={({ item }) => (
                    <View style={styles.logRow}>
                      <View style={styles.logInfo}>
                        <ThemedText style={styles.logDate}>{item.date}</ThemedText>
                        <ThemedText style={styles.logItems}>
                          {item.itemCount} item{item.itemCount !== 1 ? 's' : ''}
                        </ThemedText>
                      </View>
                      <ThemedText style={styles.logAmount}>
                        ₹{item.amount.toLocaleString()}
                      </ThemedText>
                    </View>
                  )}
                  keyExtractor={(item, index) => `${item.date}-${index}`}
                  scrollEnabled={false}
                />
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* FAB to log waste */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowNewEntryModal(true)}>
        <Ionicons name="add" size={32} color={Colors.light.card} />
      </TouchableOpacity>

      {/* Waste Log Entry Modal */}
      <Modal
        visible={showNewEntryModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowNewEntryModal(false);
          resetForm();
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Log Waste Entry</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowNewEntryModal(false);
                    resetForm();
                  }}
                >
                  <Ionicons name="close" size={24} color={Colors.light.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ paddingHorizontal: 20 }} keyboardShouldPersistTaps="handled">
                {/* Item Name */}
                <Text style={styles.fieldLabel}>Item Name *</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={wasteForm.itemName}
                  onChangeText={(v) => setWasteForm((p) => ({ ...p, itemName: v }))}
                  placeholder="e.g. Tomatoes, Bread, Paneer"
                  placeholderTextColor={Colors.light.icon}
                />

                {/* Quantity + Unit */}
                <Text style={styles.fieldLabel}>Quantity *</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    style={[styles.fieldInput, { flex: 1 }]}
                    value={wasteForm.quantity}
                    onChangeText={(v) => setWasteForm((p) => ({ ...p, quantity: v }))}
                    placeholder="0"
                    placeholderTextColor={Colors.light.icon}
                    keyboardType="decimal-pad"
                  />
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ flexShrink: 0 }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        gap: 6,
                        alignItems: 'center',
                        paddingVertical: 4,
                      }}
                    >
                      {UNITS.map((u) => (
                        <TouchableOpacity
                          key={u}
                          onPress={() => setWasteForm((p) => ({ ...p, unit: u }))}
                          style={[styles.chip, wasteForm.unit === u && styles.chipActive]}
                        >
                          <Text
                            style={[styles.chipText, wasteForm.unit === u && styles.chipTextActive]}
                          >
                            {u}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Cost per unit */}
                <Text style={styles.fieldLabel}>Cost per Unit (₹) *</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={wasteForm.costPerUnit}
                  onChangeText={(v) => setWasteForm((p) => ({ ...p, costPerUnit: v }))}
                  placeholder="0.00"
                  placeholderTextColor={Colors.light.icon}
                  keyboardType="decimal-pad"
                />
                {wasteForm.quantity && wasteForm.costPerUnit && (
                  <Text style={styles.totalCost}>
                    Total waste cost: ₹
                    {(Number(wasteForm.quantity) * Number(wasteForm.costPerUnit)).toFixed(2)}
                  </Text>
                )}

                {/* Reason */}
                <Text style={styles.fieldLabel}>Reason *</Text>
                <View style={styles.chipRow}>
                  {REASONS.map((r) => (
                    <TouchableOpacity
                      key={r}
                      onPress={() => setWasteForm((p) => ({ ...p, reason: r }))}
                      style={[styles.chip, wasteForm.reason === r && styles.chipActive]}
                    >
                      <Text
                        style={[styles.chipText, wasteForm.reason === r && styles.chipTextActive]}
                      >
                        {REASON_LABELS[r]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Notes */}
                <Text style={styles.fieldLabel}>Notes (optional)</Text>
                <TextInput
                  style={[styles.fieldInput, { height: 72, textAlignVertical: 'top' }]}
                  value={wasteForm.notes}
                  onChangeText={(v) => setWasteForm((p) => ({ ...p, notes: v }))}
                  placeholder="Any additional details..."
                  placeholderTextColor={Colors.light.icon}
                  multiline
                  numberOfLines={3}
                />

                <TouchableOpacity
                  style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                  onPress={handleLogWaste}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.submitBtnText}>Log Waste Entry</Text>
                  )}
                </TouchableOpacity>
                <View style={{ height: 32 }} />
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.light.tint,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.light.card,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    backgroundColor: Colors.light.card,
  },
  periodButtonActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.text,
  },
  periodButtonTextActive: {
    color: Colors.light.card,
  },
  summaryCard: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.light.icon,
    marginTop: 4,
  },
  summaryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  summaryBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  targetLabel: {
    fontSize: 12,
    color: Colors.light.icon,
  },
  targetValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.error,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: `${Colors.light.warning}15`,
    borderRadius: 6,
  },
  insightText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.text,
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  breakdownItem: {
    marginBottom: 12,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  breakdownLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.text,
    textTransform: 'capitalize',
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.light.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: Colors.light.card,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  logInfo: {
    flex: 1,
  },
  logDate: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },
  logItems: {
    fontSize: 11,
    color: Colors.light.icon,
    marginTop: 2,
  },
  logAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.light.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  modalBody: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 14,
    marginBottom: 6,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.light.text,
    backgroundColor: Colors.light.background,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  chipActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.text,
  },
  chipTextActive: {
    color: '#fff',
  },
  totalCost: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.tint,
    marginTop: 4,
  },
  submitBtn: {
    marginTop: 20,
    backgroundColor: Colors.light.tint,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
