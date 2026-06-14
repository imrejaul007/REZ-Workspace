/**
 * Ledger Screen
 * Supplier ledger view with credit balance, transactions, payment history
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import {
  getSupplierLedger,
  getSupplierBalances,
  recordPayment,
  SupplierLedger,
  LedgerEntry,
} from '@/services/b2bApi';
import { LedgerEntry as LedgerEntryComponent } from '@/components/b2b';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';

const ITEMS_PER_PAGE = 50;

interface SupplierBalance {
  supplierId: string;
  supplierName: string;
  balance: number;
}

export default function LedgerScreen(): React.JSX.Element {
  const { merchantId } = useAuth();

  // State
  const [supplierBalances, setSupplierBalances] = useState<SupplierBalance[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierBalance | null>(null);
  const [ledger, setLedger] = useState<SupplierLedger | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Payment modal
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'bank_transfer' | 'cheque'>('upi');
  const [paymentReference, setPaymentReference] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch supplier balances
  const fetchSupplierBalances = useCallback(async () => {
    if (!merchantId) return;

    try {
      setError(null);
      const balances = await getSupplierBalances(merchantId);
      setSupplierBalances(balances);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch supplier balances');
    }
  }, [merchantId]);

  // Fetch ledger for selected supplier
  const fetchLedger = useCallback(async () => {
    if (!selectedSupplier) return;

    setLoading(true);
    try {
      const ledgerData = await getSupplierLedger(selectedSupplier.supplierId, {
        limit: ITEMS_PER_PAGE,
      });
      setLedger(ledgerData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ledger');
    } finally {
      setLoading(false);
    }
  }, [selectedSupplier]);

  // Initial load
  useEffect(() => {
    fetchSupplierBalances();
  }, [fetchSupplierBalances]);

  // Load ledger when supplier selected
  useEffect(() => {
    if (selectedSupplier) {
      fetchLedger();
    }
  }, [selectedSupplier, fetchLedger]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchSupplierBalances(), selectedSupplier ? fetchLedger() : Promise.resolve()]);
    setRefreshing(false);
  }, [fetchSupplierBalances, selectedSupplier, fetchLedger]);

  // Record payment
  const handleRecordPayment = async () => {
    if (!selectedSupplier || !paymentAmount) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setSaving(true);
    try {
      await recordPayment(selectedSupplier.supplierId, {
        amount,
        paymentMethod,
        referenceNumber: paymentReference || undefined,
      });
      setPaymentModalVisible(false);
      setPaymentAmount('');
      setPaymentReference('');
      fetchLedger();
      fetchSupplierBalances();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Total outstanding
  const totalOutstanding = supplierBalances.reduce((sum, s) => sum + s.balance, 0);

  // Supplier item
  const renderSupplierItem = ({ item }: { item: SupplierBalance }) => {
    const isSelected = selectedSupplier?.supplierId === item.supplierId;
    const isOwed = item.balance < 0; // Negative means you owe supplier
    const isCredit = item.balance > 0; // Positive means supplier owes you

    return (
      <TouchableOpacity
        style={[styles.supplierItem, isSelected && styles.supplierItemSelected]}
        onPress={() => setSelectedSupplier(isSelected ? null : item)}
      >
        <View style={styles.supplierInfo}>
          <Text style={styles.supplierName}>{item.supplierName}</Text>
          <Text style={styles.supplierBalanceLabel}>
            {isOwed ? 'You owe' : isCredit ? 'Owes you' : 'Settled'}
          </Text>
        </View>
        <Text
          style={[
            styles.supplierBalance,
            { color: isOwed ? colors.error[600] : isCredit ? colors.success[600] : colors.text.secondary },
          ]}
        >
          {formatCurrency(Math.abs(item.balance))}
        </Text>
      </TouchableOpacity>
    );
  };

  // Ledger entry
  const renderLedgerEntry = ({ item, index }: { item: LedgerEntry; index: number }) => (
    <LedgerEntryComponent
      entry={item}
      isFirst={index === 0}
      isLast={index === (ledger?.entries.length || 0) - 1}
    />
  );

  const paymentMethods = [
    { key: 'cash' as const, label: 'Cash' },
    { key: 'upi' as const, label: 'UPI' },
    { key: 'bank_transfer' as const, label: 'Bank Transfer' },
    { key: 'cheque' as const, label: 'Cheque' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Supplier Ledger</Text>
        <View style={styles.summaryBadge}>
          <Text style={styles.summaryLabel}>Outstanding</Text>
          <Text
            style={[
              styles.summaryValue,
              { color: totalOutstanding > 0 ? colors.error[600] : colors.success[600] },
            ]}
          >
            {formatCurrency(Math.abs(totalOutstanding))}
          </Text>
        </View>
      </View>

      {/* Supplier list */}
      <View style={styles.supplierListContainer}>
        <Text style={styles.sectionTitle}>Suppliers</Text>
        <FlatList
          data={supplierBalances}
          renderItem={renderSupplierItem}
          keyExtractor={(item) => item.supplierId}
          style={styles.supplierList}
          contentContainerStyle={styles.supplierListContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primaryMain]}
              tintColor={colors.primaryMain}
            />
          }
          ListEmptyComponent={
            !loading ? (
              <EmptyState
                title="No suppliers"
                message="Add suppliers to track ledger"
              />
            ) : (
              <LoadingSpinner size="small" />
            )
          }
        />
      </View>

      {/* Ledger details */}
      {selectedSupplier && (
        <View style={styles.ledgerContainer}>
          <View style={styles.ledgerHeader}>
            <View style={styles.ledgerHeaderTop}>
              <Text style={styles.ledgerTitle}>{selectedSupplier.supplierName}</Text>
              <TouchableOpacity
                style={styles.paymentButton}
                onPress={() => setPaymentModalVisible(true)}
              >
                <Text style={styles.paymentButtonText}>Record Payment</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.ledgerStats}>
              <View style={styles.ledgerStat}>
                <Text style={styles.ledgerStatLabel}>Opening</Text>
                <Text style={styles.ledgerStatValue}>
                  {formatCurrency(ledger?.openingBalance || 0)}
                </Text>
              </View>
              <View style={styles.ledgerStat}>
                <Text style={styles.ledgerStatLabel}>Current</Text>
                <Text
                  style={[
                    styles.ledgerStatValue,
                    {
                      color:
                        (ledger?.currentBalance || 0) > 0
                          ? colors.error[600]
                          : colors.success[600],
                    },
                  ]}
                >
                  {formatCurrency(Math.abs(ledger?.currentBalance || 0))}
                </Text>
              </View>
            </View>
          </View>

          {loading ? (
            <LoadingSpinner message="Loading ledger..." />
          ) : (
            <FlatList
              data={ledger?.entries || []}
              renderItem={renderLedgerEntry}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.ledgerList}
              ListEmptyComponent={
                <EmptyState
                  title="No transactions"
                  message="No ledger entries found"
                />
              }
            />
          )}
        </View>
      )}

      {/* Payment Modal */}
      <Modal
        visible={paymentModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Record Payment</Text>
            <TouchableOpacity onPress={handleRecordPayment} disabled={saving}>
              <Text style={[styles.modalSave, saving && styles.modalSaveDisabled]}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Amount *</Text>
              <TextInput
                style={styles.formInput}
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                placeholder="Enter amount"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Payment Method *</Text>
              <View style={styles.paymentMethods}>
                {paymentMethods.map((method) => (
                  <TouchableOpacity
                    key={method.key}
                    style={[
                      styles.paymentMethodButton,
                      paymentMethod === method.key && styles.paymentMethodButtonActive,
                    ]}
                    onPress={() => setPaymentMethod(method.key)}
                  >
                    <Text
                      style={[
                        styles.paymentMethodText,
                        paymentMethod === method.key && styles.paymentMethodTextActive,
                      ]}
                    >
                      {method.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Reference Number (optional)</Text>
              <TextInput
                style={styles.formInput}
                value={paymentReference}
                onChangeText={setPaymentReference}
                placeholder="Transaction ID, cheque number, etc."
                placeholderTextColor={colors.text.tertiary}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  } as ViewStyle,
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  } as TextStyle,
  summaryBadge: {
    alignItems: 'flex-end',
  } as ViewStyle,
  summaryLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  } as TextStyle,
  summaryValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  } as TextStyle,
  supplierListContainer: {
    maxHeight: 200,
    backgroundColor: colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  } as ViewStyle,
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  } as TextStyle,
  supplierList: {
    flex: 1,
  } as ViewStyle,
  supplierListContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
  } as ViewStyle,
  supplierItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  } as ViewStyle,
  supplierItemSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  } as ViewStyle,
  supplierInfo: {
    flex: 1,
  } as ViewStyle,
  supplierName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  } as TextStyle,
  supplierBalanceLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: 2,
  } as TextStyle,
  supplierBalance: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  } as TextStyle,
  ledgerContainer: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  } as ViewStyle,
  ledgerHeader: {
    padding: spacing.base,
    backgroundColor: colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  } as ViewStyle,
  ledgerHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  } as ViewStyle,
  ledgerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  } as TextStyle,
  paymentButton: {
    backgroundColor: colors.success[500],
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  } as ViewStyle,
  paymentButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
  } as TextStyle,
  ledgerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  } as ViewStyle,
  ledgerStat: {
    alignItems: 'center',
  } as ViewStyle,
  ledgerStatLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  } as TextStyle,
  ledgerStatValue: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginTop: 2,
  } as TextStyle,
  ledgerList: {
    padding: spacing.base,
    paddingBottom: 100,
  } as ViewStyle,
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  } as ViewStyle,
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  } as ViewStyle,
  modalCancel: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  } as TextStyle,
  modalTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  } as TextStyle,
  modalSave: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[600],
  } as TextStyle,
  modalSaveDisabled: {
    color: colors.text.tertiary,
  } as TextStyle,
  modalContent: {
    flex: 1,
    padding: spacing.base,
  } as ViewStyle,
  formGroup: {
    marginBottom: spacing.lg,
  } as ViewStyle,
  formLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  } as TextStyle,
  formInput: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
  } as TextStyle,
  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  } as ViewStyle,
  paymentMethodButton: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.border.light,
  } as ViewStyle,
  paymentMethodButtonActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  } as ViewStyle,
  paymentMethodText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  } as TextStyle,
  paymentMethodTextActive: {
    color: colors.text.inverse,
  } as TextStyle,
});
