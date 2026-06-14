/**
 * Reconciliation Screen
 * Bank transaction upload, auto-match display, manual reconciliation
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
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import {
  getBankTransactions,
  uploadBankStatement,
  autoMatchTransactions,
  matchTransaction,
  unmatchTransaction,
  getSuggestedMatches,
  BankTransaction,
  TransactionStatus,
  ReconciliationResult,
} from '@/services/b2bApi';
import { BankTransactionRow } from '@/components/b2b';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';

const ITEMS_PER_PAGE = 20;

type StatusFilter = 'all' | TransactionStatus;

export default function ReconciliationScreen(): React.JSX.Element {
  const { merchantId } = useAuth();

  // State
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [autoMatching, setAutoMatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Match modal
  const [matchModalVisible, setMatchModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<BankTransaction | null>(null);
  const [suggestions, setSuggestions] = useState<ReconciliationResult[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    matched: 0,
    unmatched: 0,
    disputed: 0,
    total: 0,
  });

  // Fetch transactions
  const fetchTransactions = useCallback(async (page = 1, append = false) => {
    if (!merchantId) return;

    try {
      setError(null);
      const response = await getBankTransactions(merchantId, {
        page,
        limit: ITEMS_PER_PAGE,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });

      if (append) {
        setTransactions(prev => [...prev, ...response.data]);
      } else {
        setTransactions(response.data);
      }
      setTotalPages(response.totalPages);
      setHasMore(page < response.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    }
  }, [merchantId, statusFilter]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    if (!merchantId) return;

    try {
      const [matchedRes, unmatchedRes, disputedRes] = await Promise.all([
        getBankTransactions(merchantId, { status: 'matched', limit: 1 }),
        getBankTransactions(merchantId, { status: 'unmatched', limit: 1 }),
        getBankTransactions(merchantId, { status: 'disputed', limit: 1 }),
      ]);

      setStats({
        matched: matchedRes.total,
        unmatched: unmatchedRes.total,
        disputed: disputedRes.total,
        total: matchedRes.total + unmatchedRes.total + disputedRes.total,
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, [merchantId]);

  // Initial load
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchTransactions(1), fetchStats()]);
      setLoading(false);
    };
    load();
  }, [statusFilter]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setCurrentPage(1);
    await Promise.all([fetchTransactions(1), fetchStats()]);
    setRefreshing(false);
  }, [fetchTransactions, fetchStats]);

  // Load more
  const onEndReached = useCallback(() => {
    if (!hasMore || loading) return;
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchTransactions(nextPage, true);
  }, [hasMore, loading, currentPage, fetchTransactions]);

  // Upload bank statement
  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/csv', 'application/vnd.ms-excel'],
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const file = result.assets[0];

      setUploading(true);
      const uploadResult = await uploadBankStatement(merchantId!, {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/octet-stream',
      });

      Alert.alert(
        'Upload Complete',
        `Imported ${uploadResult.transactionsImported} transactions. ${uploadResult.duplicatesSkipped} duplicates skipped.`
      );

      fetchTransactions(1);
      fetchStats();
    } catch (err) {
      Alert.alert('Upload Failed', err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  // Auto-match
  const handleAutoMatch = async () => {
    setAutoMatching(true);
    try {
      const result = await autoMatchTransactions(merchantId!);
      Alert.alert(
        'Auto-Match Complete',
        `Matched ${result.matched} transactions. ${result.unmatched} remain unmatched.`
      );
      fetchTransactions(1);
      fetchStats();
    } catch (err) {
      Alert.alert('Auto-Match Failed', err instanceof Error ? err.message : 'Failed to auto-match');
    } finally {
      setAutoMatching(false);
    }
  };

  // Open match modal
  const openMatchModal = async (transaction: BankTransaction) => {
    setSelectedTransaction(transaction);
    setMatchModalVisible(true);
    setLoadingSuggestions(true);

    try {
      const matchSuggestions = await getSuggestedMatches(transaction.id);
      setSuggestions(matchSuggestions);
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Manual match
  const handleMatch = async (result: ReconciliationResult) => {
    if (!selectedTransaction) return;

    try {
      await matchTransaction(selectedTransaction.id, result.orderId, result.confidence);
      setMatchModalVisible(false);
      setSelectedTransaction(null);
      fetchTransactions(1);
      fetchStats();
    } catch (err) {
      Alert.alert('Match Failed', err instanceof Error ? err.message : 'Failed to match');
    }
  };

  // Unmatch
  const handleUnmatch = async (transaction: BankTransaction) => {
    Alert.alert(
      'Unmatch Transaction',
      'Are you sure you want to unmatch this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unmatch',
          style: 'destructive',
          onPress: async () => {
            try {
              await unmatchTransaction(transaction.id);
              fetchTransactions(1);
              fetchStats();
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to unmatch');
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Status tabs
  const statusTabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'matched', label: 'Matched', count: stats.matched },
    { key: 'unmatched', label: 'Unmatched', count: stats.unmatched },
    { key: 'disputed', label: 'Disputed', count: stats.disputed },
  ];

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Bank Reconciliation</Text>
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.uploadButton]}
          onPress={handleUpload}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color={colors.text.inverse} />
          ) : (
            <Text style={styles.actionButtonText}>Upload</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.matchButton]}
          onPress={handleAutoMatch}
          disabled={autoMatching}
        >
          {autoMatching ? (
            <ActivityIndicator size="small" color={colors.text.inverse} />
          ) : (
            <Text style={styles.actionButtonText}>Auto-Match</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <FlatList
        horizontal
        data={statusTabs}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.statusTab,
              statusFilter === item.key && styles.statusTabActive,
            ]}
            onPress={() => setStatusFilter(item.key)}
          >
            <Text
              style={[
                styles.statusTabText,
                statusFilter === item.key && styles.statusTabTextActive,
              ]}
            >
              {item.label}
            </Text>
            <View
              style={[
                styles.statusBadge,
                statusFilter === item.key && styles.statusBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  statusFilter === item.key && styles.statusBadgeTextActive,
                ]}
              >
                {item.count}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statusTabsContent}
      />
    </View>
  );

  const renderTransaction = ({ item }: { item: BankTransaction }) => (
    <BankTransactionRow
      transaction={item}
      onMatch={item.status === 'unmatched' ? () => openMatchModal(item) : undefined}
      onUnmatch={item.status === 'matched' ? () => handleUnmatch(item) : undefined}
      style={styles.transactionCard}
    />
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <LoadingSpinner fullScreen message="Loading transactions..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderFilters()}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchTransactions(1)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primaryMain]}
            tintColor={colors.primaryMain}
          />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <EmptyState
            title="No transactions"
            message="Upload a bank statement to get started"
            actionLabel="Upload Statement"
            onAction={handleUpload}
          />
        }
        ListFooterComponent={
          loading && transactions.length > 0 ? (
            <View style={styles.loadingFooter}>
              <LoadingSpinner size="small" />
            </View>
          ) : null
        }
      />

      {/* Match Modal */}
      <Modal
        visible={matchModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setMatchModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setMatchModalVisible(false)}>
              <Text style={styles.modalCancel}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Match Transaction</Text>
            <View style={{ width: 50 }} />
          </View>

          <View style={styles.modalContent}>
            {selectedTransaction && (
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionAmount}>
                  {formatCurrency(selectedTransaction.amount)}
                </Text>
                <Text style={styles.transactionDesc}>
                  {selectedTransaction.description}
                </Text>
              </View>
            )}

            <Text style={styles.suggestionsTitle}>Suggested Matches</Text>

            {loadingSuggestions ? (
              <LoadingSpinner message="Finding matches..." />
            ) : suggestions.length === 0 ? (
              <EmptyState
                title="No matches found"
                message="No orders match this transaction amount"
              />
            ) : (
              <FlatList
                data={suggestions}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.suggestionItem}
                    onPress={() => handleMatch(item)}
                  >
                    <View style={styles.suggestionInfo}>
                      <Text style={styles.suggestionOrder}>Order #{item.orderId.slice(-8)}</Text>
                      <Text style={styles.suggestionAmount}>
                        Expected: {formatCurrency(item.suggestedAmount)}
                      </Text>
                    </View>
                    <View style={styles.suggestionConfidence}>
                      <Text
                        style={[
                          styles.confidenceText,
                          {
                            color:
                              item.confidence === 'high'
                                ? colors.success[600]
                                : item.confidence === 'medium'
                                ? colors.warning[600]
                                : colors.error[600],
                          },
                        ]}
                      >
                        {item.confidence.toUpperCase()}
                      </Text>
                      {item.amountDifference !== 0 && (
                        <Text style={styles.differenceText}>
                          Diff: {formatCurrency(Math.abs(item.amountDifference))}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.orderId}
              />
            )}
          </View>
        </View>
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
    marginBottom: spacing.md,
  } as TextStyle,
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  } as ViewStyle,
  actionButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  } as ViewStyle,
  uploadButton: {
    backgroundColor: colors.primary[500],
  } as ViewStyle,
  matchButton: {
    backgroundColor: colors.success[500],
  } as ViewStyle,
  actionButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
  } as TextStyle,
  filtersContainer: {
    backgroundColor: colors.surface.primary,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  } as ViewStyle,
  statusTabsContent: {
    paddingHorizontal: spacing.base,
  } as ViewStyle,
  statusTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
  } as ViewStyle,
  statusTabActive: {
    backgroundColor: colors.primary[500],
  } as ViewStyle,
  statusTabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  } as TextStyle,
  statusTabTextActive: {
    color: colors.text.inverse,
  } as TextStyle,
  statusBadge: {
    marginLeft: spacing.xs,
    backgroundColor: colors.gray[200],
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    minWidth: 24,
    alignItems: 'center',
  } as ViewStyle,
  statusBadgeActive: {
    backgroundColor: colors.primary[400],
  } as ViewStyle,
  statusBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
  } as TextStyle,
  statusBadgeTextActive: {
    color: colors.text.inverse,
  } as TextStyle,
  listContent: {
    padding: spacing.base,
    paddingBottom: 100,
  } as ViewStyle,
  transactionCard: {
    marginBottom: spacing.md,
  } as ViewStyle,
  loadingFooter: {
    padding: spacing.lg,
    alignItems: 'center',
  } as ViewStyle,
  errorContainer: {
    backgroundColor: colors.error[50],
    padding: spacing.md,
    marginHorizontal: spacing.base,
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error[700],
    flex: 1,
  } as TextStyle,
  retryText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[600],
    marginLeft: spacing.md,
  } as TextStyle,
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
  modalContent: {
    flex: 1,
    padding: spacing.base,
  } as ViewStyle,
  transactionInfo: {
    backgroundColor: colors.surface.primary,
    padding: spacing.base,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
  } as ViewStyle,
  transactionAmount: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  } as TextStyle,
  transactionDesc: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  } as TextStyle,
  suggestionsTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  } as TextStyle,
  suggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface.primary,
    padding: spacing.base,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  } as ViewStyle,
  suggestionInfo: {
    flex: 1,
  } as ViewStyle,
  suggestionOrder: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  } as TextStyle,
  suggestionAmount: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  } as TextStyle,
  suggestionConfidence: {
    alignItems: 'flex-end',
  } as ViewStyle,
  confidenceText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  } as TextStyle,
  differenceText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: 2,
  } as TextStyle,
});
