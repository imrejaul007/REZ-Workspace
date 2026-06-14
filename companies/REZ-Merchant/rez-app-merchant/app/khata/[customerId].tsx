/**
 * Khata (Customer Credit Book) - Detail Screen
 * Shows customer details, balance, and transaction history
 */

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
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { apiClient, ApiResponse } from '@/services/api/client';
import { showAlert } from '@/utils/alert';
import { logger } from '@/utils/logger';

interface KhataTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  balance: number;
}

interface KhataDetail {
  customer: {
    customerId: string;
    customerName: string;
    phone: string;
  };
  transactions: KhataTransaction[];
  currentBalance: number;
}

export default function KhataDetailScreen() {
  const { customerId } = useLocalSearchParams<{ customerId?: string }>();
  const [khataData, setKhataData] = useState<KhataDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionType, setTransactionType] = useState<'credit' | 'debit'>('credit');
  const [transactionDescription, setTransactionDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchKhataDetail = useCallback(
    async (showRefreshing = false) => {
      try {
        if (!customerId) {
          setError('Invalid customer ID. Please go back and try again.');
          setIsLoading(false);
          setRefreshing(false);
          return;
        }

        if (showRefreshing) setRefreshing(true);
        else setIsLoading(true);

        const response = await apiClient.get<KhataDetail>(`/merchant/khata/${customerId}`);

        if (response.success && response.data) {
          setKhataData(response.data);
        } else {
          showAlert('Error', response.message || 'Failed to load khata details');
        }
      } catch (error) {
        if (__DEV__) console.error('Error fetching khata detail:', error);
        showAlert('Error', error?.message || 'Failed to load khata details');
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [customerId]
  );

  useEffect(() => {
    fetchKhataDetail();
  }, [fetchKhataDetail]);

  const handleAddTransaction = async () => {
    if (!transactionAmount.trim()) {
      showAlert('Validation', 'Please enter an amount');
      return;
    }

    const amount = parseFloat(transactionAmount);
    if (isNaN(amount) || amount <= 0) {
      showAlert('Validation', 'Please enter a valid amount');
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await apiClient.post(`/merchant/khata/${customerId}/payment`, {
        amount,
        note: transactionDescription.trim() || 'Manual entry',
      });

      if (response.success) {
        showAlert('Success', 'Transaction added successfully');
        setTransactionAmount('');
        setTransactionDescription('');
        setShowAddModal(false);
        await fetchKhataDetail(false);
      } else {
        showAlert('Error', response.message || 'Failed to add transaction');
      }
    } catch (error) {
      if (__DEV__) console.error('Error adding transaction:', error);
      showAlert('Error', error?.message || 'Failed to add transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefresh = () => {
    fetchKhataDetail(true);
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) {
      return Colors.light.error; // Red - merchant credit owed
    } else if (balance < 0) {
      return Colors.light.success; // Green - advance paid by customer
    }
    return Colors.light.text;
  };

  const formatCurrency = (amount: number) => {
    const absAmount = Math.abs(amount);
    return `₹${absAmount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <ThemedText style={styles.loadingText}>Loading khata details...</ThemedText>
      </ThemedView>
    );
  }

  if (error || !customerId) {
    return (
      <ThemedView style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={Colors.light.error} />
        <ThemedText style={styles.errorTitle}>Failed to load khata</ThemedText>
        <ThemedText style={styles.errorMessage}>{error || 'No customer ID provided'}</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <ThemedText style={styles.retryButtonText}>Go Back</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  if (!khataData) {
    return (
      <ThemedView style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={Colors.light.error} />
        <ThemedText style={styles.errorTitle}>Failed to load khata</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchKhataDetail()}>
          <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  const renderTransactionRow = useCallback(
    ({ item }: { item: KhataTransaction }) => (
      <View style={styles.transactionRow}>
        <View style={styles.transactionLeft}>
          <View
            style={[
              styles.transactionIcon,
              {
                backgroundColor:
                  item.type === 'credit' ? `${Colors.light.success}20` : `${Colors.light.error}20`,
              },
            ]}
          >
            <Ionicons
              name={item.type === 'credit' ? 'add-circle' : 'remove-circle'}
              size={24}
              color={item.type === 'credit' ? Colors.light.success : Colors.light.error}
            />
          </View>
          <View style={styles.transactionInfo}>
            <ThemedText style={styles.transactionDesc}>{item.description}</ThemedText>
            <ThemedText style={styles.transactionDate}>{formatDate(item.date)}</ThemedText>
          </View>
        </View>
        <View style={styles.transactionRight}>
          <ThemedText
            style={[
              styles.transactionAmount,
              {
                color: item.type === 'credit' ? Colors.light.success : Colors.light.error,
              },
            ]}
          >
            {item.type === 'credit' ? '+' : '-'}
            {formatCurrency(item.amount)}
          </ThemedText>
          <ThemedText style={styles.balanceAfter}>
            Balance: {formatCurrency(item.balance)}
          </ThemedText>
        </View>
      </View>
    ),
    []
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={Colors.light.card} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Khata Details</ThemedText>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Customer Info */}
        <View style={styles.customerCard}>
          <ThemedText style={styles.customerName}>{khataData.customer.customerName}</ThemedText>
          <ThemedText style={styles.customerPhone}>{khataData.customer.phone}</ThemedText>
        </View>

        {/* Balance Card */}
        <View
          style={[
            styles.balanceCard,
            {
              backgroundColor:
                khataData.currentBalance > 0
                  ? `${Colors.light.error}15`
                  : khataData.currentBalance < 0
                    ? `${Colors.light.success}15`
                    : Colors.light.card,
            },
          ]}
        >
          <ThemedText style={styles.balanceLabel}>Current Balance</ThemedText>
          <ThemedText
            style={[styles.balanceValue, { color: getBalanceColor(khataData.currentBalance) }]}
          >
            {khataData.currentBalance > 0 ? '+' : ''}
            {formatCurrency(khataData.currentBalance)}
          </ThemedText>
          <ThemedText style={styles.balanceNote}>
            {khataData.currentBalance > 0
              ? 'Credit owed to merchant'
              : khataData.currentBalance < 0
                ? 'Advance paid by customer'
                : 'No outstanding balance'}
          </ThemedText>
        </View>

        {/* Transactions */}
        <View style={styles.transactionsSection}>
          <ThemedText style={styles.sectionTitle}>Transaction History</ThemedText>
          {khataData.transactions.length === 0 ? (
            <View style={styles.emptyTransactions}>
              <ThemedText style={styles.emptyText}>No transactions yet</ThemedText>
            </View>
          ) : (
            <FlatList
              data={khataData.transactions}
              renderItem={renderTransactionRow}
              keyExtractor={(item, index) => `${item.date}-${item.amount}-${item.type}-${index}`}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>

      {/* Add Transaction Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
        accessibilityRole="button"
        accessibilityLabel="Add transaction"
      >
        <Ionicons name="add" size={32} color={Colors.light.card} />
      </TouchableOpacity>

      {/* Add Transaction Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Add Transaction</ThemedText>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={28} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Amount (₹)</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Enter amount"
                placeholderTextColor={Colors.light.icon}
                keyboardType="decimal-pad"
                value={transactionAmount}
                onChangeText={setTransactionAmount}
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Type</ThemedText>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    transactionType === 'credit' && styles.typeButtonActive,
                  ]}
                  onPress={() => setTransactionType('credit')}
                >
                  <ThemedText
                    style={[
                      styles.typeButtonText,
                      transactionType === 'credit' && styles.typeButtonTextActive,
                    ]}
                  >
                    Credit (Owed)
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    transactionType === 'debit' && styles.typeButtonActive,
                  ]}
                  onPress={() => setTransactionType('debit')}
                >
                  <ThemedText
                    style={[
                      styles.typeButtonText,
                      transactionType === 'debit' && styles.typeButtonTextActive,
                    ]}
                  >
                    Debit (Paid)
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Description (Optional)</ThemedText>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="e.g., Payment received, Advance payment"
                placeholderTextColor={Colors.light.icon}
                value={transactionDescription}
                onChangeText={setTransactionDescription}
                multiline
                numberOfLines={3}
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.buttonCancel]}
                onPress={() => setShowAddModal(false)}
                disabled={isSubmitting}
                accessibilityRole="button"
                accessibilityLabel="Cancel transaction"
              >
                <ThemedText style={styles.buttonCancelText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonSubmit]}
                onPress={handleAddTransaction}
                disabled={isSubmitting}
                accessibilityRole="button"
                accessibilityLabel="Add transaction"
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={Colors.light.card} />
                ) : (
                  <ThemedText style={styles.buttonSubmitText}>Add Transaction</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14 },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: { fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  errorMessage: { fontSize: 14, textAlign: 'center', marginBottom: 24, opacity: 0.7 },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
  },
  retryButtonText: { color: Colors.light.card, fontWeight: '600' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.light.tint,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: Colors.light.card },
  customerCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  customerName: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  customerPhone: { fontSize: 14, color: Colors.light.icon },
  balanceCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  balanceLabel: { fontSize: 14, color: Colors.light.icon, marginBottom: 8 },
  balanceValue: { fontSize: 32, fontWeight: '700', marginBottom: 8 },
  balanceNote: { fontSize: 13, color: Colors.light.icon },
  transactionsSection: { paddingHorizontal: 16, paddingBottom: 100 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  transactionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: { flex: 1 },
  transactionDesc: { fontSize: 14, fontWeight: '500', marginBottom: 2 },
  transactionDate: { fontSize: 12, color: Colors.light.icon },
  transactionRight: { alignItems: 'flex-end', marginLeft: 12 },
  transactionAmount: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  balanceAfter: { fontSize: 12, color: Colors.light.icon },
  emptyTransactions: { paddingVertical: 24, alignItems: 'center' },
  emptyText: { color: Colors.light.icon, fontSize: 14 },
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.light.text,
    backgroundColor: Colors.light.card,
  },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  typeSelector: { flexDirection: 'row', gap: 8 },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    backgroundColor: Colors.light.card,
  },
  typeButtonActive: { backgroundColor: Colors.light.tint, borderColor: Colors.light.tint },
  typeButtonText: { fontSize: 14, fontWeight: '500', color: Colors.light.text },
  typeButtonTextActive: { color: Colors.light.card },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCancel: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  buttonCancelText: { color: Colors.light.text, fontWeight: '600' },
  buttonSubmit: { backgroundColor: Colors.light.tint },
  buttonSubmitText: { color: Colors.light.card, fontWeight: '600' },
});
