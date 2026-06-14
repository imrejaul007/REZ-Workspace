import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useColorScheme } from 'react-native';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { showAlert } from '@/utils/alert';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import {
  walletService,
  WalletSummary,
  WalletTransaction,
  WalletStatistics,
  BankDetails,
} from '@/services/api/wallet';
import { requireBiometric } from '@/utils/biometric';
import { logger } from '@/utils/logger';

type TabType = 'overview' | 'transactions' | 'bank' | 'analytics';
type TransactionFilter = 'all' | 'credit' | 'withdrawal' | 'refund';
type WalletColors = typeof Colors.light;

const TRANSACTIONS_PAGE_SIZE = 20;

const formatCurrency = (amount: number) =>
  `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

function getWalletThemedStyles(colors: WalletColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      padding: 16,
    },
    header: {
      marginBottom: 20,
    },
    title: {
      color: colors.text,
      marginBottom: 4,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    balanceCard: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
    },
    balanceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    balanceItem: {},
    balanceLabel: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: 14,
      marginBottom: 4,
    },
    balanceValue: {
      color: colors.background,
      fontSize: 28,
      fontWeight: 'bold',
    },
    withdrawButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      gap: 8,
    },
    withdrawButtonText: {
      color: colors.background,
      fontWeight: '600',
    },
    balanceDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.2)',
      paddingTop: 16,
    },
    balanceDetailItem: {
      alignItems: 'center',
    },
    detailLabel: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: 12,
      marginBottom: 4,
    },
    detailValue: {
      color: colors.background,
      fontSize: 14,
      fontWeight: '600',
    },
    tabs: {
      flexDirection: 'row',
      backgroundColor: colors.background,
      borderRadius: 10,
      padding: 4,
      marginBottom: 20,
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 8,
    },
    activeTab: {
      backgroundColor: colors.primary,
    },
    tabText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
    },
    activeTabText: {
      color: colors.background,
    },
    sectionTitle: {
      marginBottom: 16,
      color: colors.text,
    },
    statsContainer: {},
    feeBreakdownCard: {
      marginTop: 20,
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
    },
    feeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    feeRowTotal: {
      borderBottomWidth: 0,
      marginTop: 4,
      paddingTop: 12,
      borderTopWidth: 2,
      borderTopColor: colors.text,
    },
    feeLabel: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    feeValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    feeTotalLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    feeTotalValue: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.success,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    statCard: {
      width: '48%',
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginTop: 8,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    transactionsContainer: {},
    filterRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 16,
    },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.background,
    },
    activeFilterChip: {
      backgroundColor: colors.primary,
    },
    filterText: {
      fontSize: 13,
      color: colors.text,
    },
    activeFilterText: {
      color: colors.background,
    },
    emptyState: {
      alignItems: 'center',
      padding: 40,
      backgroundColor: colors.background,
      borderRadius: 12,
    },
    emptyText: {
      marginTop: 12,
      color: colors.textSecondary,
    },
    transactionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
    },
    transactionIcon: {
      marginRight: 12,
    },
    transactionDetails: {
      flex: 1,
    },
    transactionDesc: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 2,
    },
    transactionDate: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    transactionAmount: {
      alignItems: 'flex-end',
    },
    transactionValue: {
      fontSize: 15,
      fontWeight: '600',
    },
    feeText: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
    bankContainer: {},
    verifiedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      marginBottom: 16,
      gap: 8,
    },
    verifiedText: {
      color: colors.success,
      fontWeight: '500',
    },
    pendingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(234, 179, 8, 0.1)',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      marginBottom: 16,
      gap: 8,
    },
    pendingText: {
      color: colors.warning,
      fontWeight: '500',
    },
    bankCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    bankLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
      marginTop: 12,
    },
    bankValue: {
      fontSize: 15,
      color: colors.text,
      fontWeight: '500',
    },
    updateBankButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 10,
      gap: 8,
    },
    updateBankText: {
      color: colors.background,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalScrollContent: {
      maxHeight: '80%',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
    },
    modalTitle: {
      textAlign: 'center',
      marginBottom: 20,
      color: colors.text,
    },
    modalLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 6,
      marginTop: 12,
    },
    modalInput: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 10,
      padding: 14,
      fontSize: 16,
      color: colors.text,
    },
    modalHint: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 8,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    cancelButtonText: {
      color: colors.text,
      fontWeight: '500',
    },
    confirmButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 10,
      backgroundColor: colors.primary,
      alignItems: 'center',
    },
    confirmButtonText: {
      color: colors.background,
      fontWeight: '600',
    },
    loadMoreButton: {
      padding: 12,
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: 8,
    },
    loadMoreText: {
      color: colors.primary,
      fontWeight: '600',
    },
  });
}

export default function WalletScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'] as WalletColors;
  const themedStyles = getWalletThemedStyles(colors);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [walletData, setWalletData] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [transactionFilter, setTransactionFilter] = useState<TransactionFilter>('all');
  const [txPage, setTxPage] = useState(1);
  const [txHasMore, setTxHasMore] = useState(false);
  const [txLoadingMore, setTxLoadingMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankDetails, setBankDetails] = useState<Partial<BankDetails>>({});

  const fetchWalletData = useCallback(
    async (showRefreshing = false) => {
      try {
        if (showRefreshing) setRefreshing(true);
        else setIsLoading(true);

        const [summary, transactionsData] = await Promise.all([
          walletService.getWalletSummary(),
          walletService.getTransactions(
            1,
            TRANSACTIONS_PAGE_SIZE,
            transactionFilter !== 'all' ? transactionFilter : undefined
          ),
        ]);

        setWalletData(summary);
        setTransactions(transactionsData.transactions);
        setTxPage(1);
        // H5 FIX: track whether more pages exist for load-more
        setTxHasMore(transactionsData.transactions.length === TRANSACTIONS_PAGE_SIZE);

        if (summary.bankDetails) {
          setBankDetails(summary.bankDetails);
        }
      } catch (error) {
        if (__DEV__) console.error('Error fetching wallet data:', error);
        showAlert('Error', error.message || 'Failed to load wallet data');
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [transactionFilter]
  );

  // H5 FIX: re-fetch when filter changes while screen is mounted
  useEffect(() => {
    fetchWalletData();
  }, [transactionFilter]);

  useFocusEffect(
    useCallback(() => {
      fetchWalletData();
    }, [fetchWalletData])
  );

  const loadMoreTransactions = useCallback(async () => {
    if (txLoadingMore || !txHasMore) return;
    try {
      setTxLoadingMore(true);
      const nextPage = txPage + 1;
      const data = await walletService.getTransactions(
        nextPage,
        TRANSACTIONS_PAGE_SIZE,
        transactionFilter !== 'all' ? transactionFilter : undefined
      );
      setTransactions((prev) => [...prev, ...data.transactions]);
      setTxPage(nextPage);
      setTxHasMore(data.transactions.length === TRANSACTIONS_PAGE_SIZE);
    } catch (error) {
      if (__DEV__) console.error('Load more transactions error:', error);
    } finally {
      setTxLoadingMore(false);
    }
  }, [txLoadingMore, txHasMore, txPage, transactionFilter]);

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      showAlert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    if (walletData && amount > walletData.balance.available) {
      showAlert('Insufficient Balance', 'Withdrawal amount exceeds available balance');
      return;
    }

    if (walletData && amount < walletData.minWithdrawalAmount) {
      showAlert(
        'Minimum Amount',
        `Minimum withdrawal amount is ${formatCurrency(walletData.minWithdrawalAmount)}`
      );
      return;
    }

    // Biometric verification before withdrawal
    const bioResult = await requireBiometric('Confirm withdrawal request');
    if (!bioResult.success) {
      showAlert('Authentication Required', bioResult.error || 'Please authenticate to continue.');
      return;
    }

    try {
      const result = await walletService.requestWithdrawal(amount);
      showAlert('Success', result.message);
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      fetchWalletData();
    } catch (error) {
      showAlert('Error', error.message || 'Failed to request withdrawal');
    }
  };

  const handleUpdateBankDetails = async () => {
    if (
      !bankDetails.accountNumber ||
      !bankDetails.ifscCode ||
      !bankDetails.accountHolderName ||
      !bankDetails.bankName
    ) {
      showAlert('Missing Information', 'Please fill all required fields');
      return;
    }

    // Biometric verification before updating bank details
    const bioResult = await requireBiometric('Confirm bank details update');
    if (!bioResult.success) {
      showAlert('Authentication Required', bioResult.error || 'Please authenticate to continue.');
      return;
    }

    try {
      const result = await walletService.updateBankDetails({
        accountNumber: bankDetails.accountNumber!,
        ifscCode: bankDetails.ifscCode!,
        accountHolderName: bankDetails.accountHolderName!,
        bankName: bankDetails.bankName!,
        branchName: bankDetails.branchName,
        upiId: bankDetails.upiId,
      });
      showAlert('Success', result.message);
      setShowBankModal(false);
      fetchWalletData();
    } catch (error) {
      showAlert('Error', error.message || 'Failed to update bank details');
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'credit':
        return 'arrow-down-circle';
      case 'withdrawal':
        return 'arrow-up-circle';
      case 'refund':
        return 'refresh-circle';
      default:
        return 'ellipse';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'credit':
        return colors.success;
      case 'withdrawal':
        return colors.warning;
      case 'refund':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  if (isLoading && !refreshing) {
    return (
      <View style={[themedStyles.container, themedStyles.centered]}>
        <ThemedText>Loading wallet...</ThemedText>
      </View>
    );
  }

  return (
    <ScrollView
      style={themedStyles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => fetchWalletData(true)} />
      }
    >
      <ThemedView style={themedStyles.content}>
        {/* Header */}
        <View style={themedStyles.header}>
          <View>
            <ThemedText type="title" style={themedStyles.title}>
              Wallet
            </ThemedText>
            <ThemedText style={themedStyles.subtitle}>
              Manage your earnings and withdrawals
            </ThemedText>
          </View>
        </View>

        {/* Balance Card */}
        {walletData && (
          <View style={themedStyles.balanceCard}>
            <View style={themedStyles.balanceRow}>
              <View style={themedStyles.balanceItem}>
                <ThemedText style={themedStyles.balanceLabel}>Available Balance</ThemedText>
                <ThemedText style={themedStyles.balanceValue}>
                  {formatCurrency(walletData.balance.available)}
                </ThemedText>
              </View>
              <TouchableOpacity
                style={themedStyles.withdrawButton}
                onPress={() => setShowWithdrawModal(true)}
                disabled={walletData.balance.available < walletData.minWithdrawalAmount}
              >
                <Ionicons name="wallet-outline" size={20} color={colors.background} />
                <ThemedText style={themedStyles.withdrawButtonText}>Withdraw</ThemedText>
              </TouchableOpacity>
            </View>
            <View style={themedStyles.balanceDetails}>
              <View style={themedStyles.balanceDetailItem}>
                <ThemedText style={themedStyles.detailLabel}>Pending</ThemedText>
                <ThemedText style={themedStyles.detailValue}>
                  {formatCurrency(walletData.balance.pending)}
                </ThemedText>
              </View>
              <View style={themedStyles.balanceDetailItem}>
                <ThemedText style={themedStyles.detailLabel}>Total Withdrawn</ThemedText>
                <ThemedText style={themedStyles.detailValue}>
                  {formatCurrency(walletData.balance.withdrawn)}
                </ThemedText>
              </View>
              <View style={themedStyles.balanceDetailItem}>
                <ThemedText style={themedStyles.detailLabel}>Total Earned</ThemedText>
                <ThemedText style={themedStyles.detailValue}>
                  {formatCurrency(walletData.balance.total)}
                </ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* Tabs */}
        <View style={themedStyles.tabs}>
          {(['overview', 'transactions', 'bank', 'analytics'] as TabType[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[themedStyles.tab, activeTab === tab && themedStyles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <ThemedText
                style={[themedStyles.tabText, activeTab === tab && themedStyles.activeTabText]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'overview' && walletData && (
          <View style={themedStyles.statsContainer}>
            <ThemedText type="subtitle" style={themedStyles.sectionTitle}>
              Sales Overview
            </ThemedText>

            <View style={themedStyles.statsGrid}>
              <View style={themedStyles.statCard}>
                <Ionicons name="trending-up" size={24} color={colors.success} />
                <ThemedText style={themedStyles.statValue}>
                  {formatCurrency(walletData.statistics.totalSales)}
                </ThemedText>
                <ThemedText style={themedStyles.statLabel}>Gross Sales</ThemedText>
              </View>
              <View style={themedStyles.statCard}>
                <Ionicons name="remove-circle-outline" size={24} color={colors.error} />
                <ThemedText style={themedStyles.statValue}>
                  {formatCurrency(walletData.statistics.totalPlatformFees)}
                </ThemedText>
                {/* L1 FIX: don't hardcode the fee percentage — compute it from the data */}
                <ThemedText style={themedStyles.statLabel}>
                  Platform Fees
                  {walletData.statistics.totalSales > 0
                    ? ` (${((walletData.statistics.totalPlatformFees / walletData.statistics.totalSales) * 100).toFixed(0)}%)`
                    : ''}
                </ThemedText>
              </View>
              <View style={themedStyles.statCard}>
                <Ionicons name="cash-outline" size={24} color={colors.primary} />
                <ThemedText style={themedStyles.statValue}>
                  {formatCurrency(walletData.statistics.netSales)}
                </ThemedText>
                <ThemedText style={themedStyles.statLabel}>Net Sales</ThemedText>
              </View>
              <View style={themedStyles.statCard}>
                <Ionicons name="receipt-outline" size={24} color={colors.warning} />
                <ThemedText style={themedStyles.statValue}>
                  {walletData.statistics.totalOrders}
                </ThemedText>
                <ThemedText style={themedStyles.statLabel}>Total Orders</ThemedText>
              </View>
              <View style={themedStyles.statCard}>
                <Ionicons name="analytics-outline" size={24} color={colors.textSecondary} />
                <ThemedText style={themedStyles.statValue}>
                  {formatCurrency(walletData.statistics.averageOrderValue)}
                </ThemedText>
                <ThemedText style={themedStyles.statLabel}>Avg Order Value</ThemedText>
              </View>
              <View style={themedStyles.statCard}>
                <Ionicons name="refresh-outline" size={24} color={colors.error} />
                <ThemedText style={themedStyles.statValue}>
                  {formatCurrency(walletData.statistics.totalRefunds)}
                </ThemedText>
                <ThemedText style={themedStyles.statLabel}>Refunds</ThemedText>
              </View>
            </View>

            {/* Fee Breakdown Card */}
            {walletData.statistics.totalSales > 0 && (
              <View style={themedStyles.feeBreakdownCard}>
                <ThemedText type="subtitle" style={themedStyles.sectionTitle}>
                  Fee Breakdown
                </ThemedText>
                <View style={themedStyles.feeRow}>
                  <ThemedText style={themedStyles.feeLabel}>Gross Sales</ThemedText>
                  <ThemedText style={themedStyles.feeValue}>
                    {formatCurrency(walletData.statistics.totalSales)}
                  </ThemedText>
                </View>
                <View style={themedStyles.feeRow}>
                  <ThemedText style={themedStyles.feeLabel}>
                    Platform Commission (
                    {(
                      (walletData.statistics.totalPlatformFees / walletData.statistics.totalSales) *
                      100
                    ).toFixed(1)}
                    %)
                  </ThemedText>
                  <ThemedText style={[themedStyles.feeValue, { color: colors.error }]}>
                    -{formatCurrency(walletData.statistics.totalPlatformFees)}
                  </ThemedText>
                </View>
                {walletData.statistics.totalRefunds > 0 && (
                  <View style={themedStyles.feeRow}>
                    <ThemedText style={themedStyles.feeLabel}>Refunds</ThemedText>
                    <ThemedText style={[themedStyles.feeValue, { color: colors.error }]}>
                      -{formatCurrency(walletData.statistics.totalRefunds)}
                    </ThemedText>
                  </View>
                )}
                <View style={[themedStyles.feeRow, themedStyles.feeRowTotal]}>
                  <ThemedText style={themedStyles.feeTotalLabel}>Net Earnings</ThemedText>
                  <ThemedText style={themedStyles.feeTotalValue}>
                    {formatCurrency(walletData.statistics.netSales)}
                  </ThemedText>
                </View>
                <View style={themedStyles.feeRow}>
                  <ThemedText style={themedStyles.feeLabel}>Settlement Cycle</ThemedText>
                  <ThemedText style={themedStyles.feeValue}>
                    {walletData.settlementCycle.charAt(0).toUpperCase() +
                      walletData.settlementCycle.slice(1)}
                  </ThemedText>
                </View>
              </View>
            )}
          </View>
        )}

        {activeTab === 'transactions' && (
          <View style={themedStyles.transactionsContainer}>
            <View style={themedStyles.filterRow}>
              {(['all', 'credit', 'withdrawal', 'refund'] as TransactionFilter[]).map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    themedStyles.filterChip,
                    transactionFilter === filter && themedStyles.activeFilterChip,
                  ]}
                  onPress={() => setTransactionFilter(filter)}
                >
                  <ThemedText
                    style={[
                      themedStyles.filterText,
                      transactionFilter === filter && themedStyles.activeFilterText,
                    ]}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            {transactions.length === 0 ? (
              <View style={themedStyles.emptyState}>
                <Ionicons name="document-text-outline" size={48} color={colors.textSecondary} />
                <ThemedText style={themedStyles.emptyText}>No transactions found</ThemedText>
              </View>
            ) : (
              <>
                {transactions.map((tx) => (
                  <View key={tx._id} style={themedStyles.transactionCard}>
                    <View style={themedStyles.transactionIcon}>
                      <Ionicons
                        name={getTransactionIcon(tx.type) as unknown as keyof typeof Ionicons.glyphMap}
                        size={28}
                        color={getTransactionColor(tx.type)}
                      />
                    </View>
                    <View style={themedStyles.transactionDetails}>
                      <ThemedText style={themedStyles.transactionDesc}>{tx.description}</ThemedText>
                      <ThemedText style={themedStyles.transactionDate}>
                        {formatDate(tx.createdAt)} {tx.orderNumber && `• ${tx.orderNumber}`}
                      </ThemedText>
                    </View>
                    <View style={themedStyles.transactionAmount}>
                      {/* H5 FIX: credit shows +, debit-type shows - based on type not hardcoded + */}
                      <ThemedText
                        style={[
                          themedStyles.transactionValue,
                          { color: getTransactionColor(tx.type) },
                        ]}
                      >
                        {tx.type === 'credit' ? '+' : '-'}
                        {formatCurrency(tx.netAmount || tx.amount)}
                      </ThemedText>
                      {tx.platformFee && tx.platformFee > 0 && (
                        <ThemedText style={themedStyles.feeText}>
                          Fee: {formatCurrency(tx.platformFee)}
                        </ThemedText>
                      )}
                    </View>
                  </View>
                ))}
                {/* H5 FIX: load-more pagination */}
                {txHasMore && (
                  <TouchableOpacity
                    style={themedStyles.loadMoreButton}
                    onPress={loadMoreTransactions}
                    disabled={txLoadingMore}
                  >
                    <ThemedText style={themedStyles.loadMoreText}>
                      {txLoadingMore ? 'Loading...' : 'Load More'}
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}

        {activeTab === 'bank' && (
          <View style={themedStyles.bankContainer}>
            {walletData?.bankDetails?.isVerified ? (
              <View style={themedStyles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <ThemedText style={themedStyles.verifiedText}>Bank Account Verified</ThemedText>
              </View>
            ) : walletData?.bankDetails?.accountNumber ? (
              <View style={themedStyles.pendingBadge}>
                <Ionicons name="time-outline" size={20} color={colors.warning} />
                <ThemedText style={themedStyles.pendingText}>Verification Pending</ThemedText>
              </View>
            ) : null}

            <View style={themedStyles.bankCard}>
              <ThemedText style={themedStyles.bankLabel}>Account Holder</ThemedText>
              <ThemedText style={themedStyles.bankValue}>
                {walletData?.bankDetails?.accountHolderName || 'Not set'}
              </ThemedText>

              <ThemedText style={themedStyles.bankLabel}>Account Number</ThemedText>
              <ThemedText style={themedStyles.bankValue}>
                {walletData?.bankDetails?.accountNumber
                  ? `****${walletData.bankDetails.accountNumber.slice(-4)}`
                  : 'Not set'}
              </ThemedText>

              <ThemedText style={themedStyles.bankLabel}>IFSC Code</ThemedText>
              <ThemedText style={themedStyles.bankValue}>
                {walletData?.bankDetails?.ifscCode || 'Not set'}
              </ThemedText>

              <ThemedText style={themedStyles.bankLabel}>Bank Name</ThemedText>
              <ThemedText style={themedStyles.bankValue}>
                {walletData?.bankDetails?.bankName || 'Not set'}
              </ThemedText>

              {walletData?.bankDetails?.upiId && (
                <>
                  <ThemedText style={themedStyles.bankLabel}>UPI ID</ThemedText>
                  <ThemedText style={themedStyles.bankValue}>
                    {walletData.bankDetails.upiId}
                  </ThemedText>
                </>
              )}
            </View>

            <TouchableOpacity
              style={themedStyles.updateBankButton}
              onPress={() => setShowBankModal(true)}
            >
              <Ionicons name="pencil" size={18} color={colors.background} />
              <ThemedText style={themedStyles.updateBankText}>
                {walletData?.bankDetails?.accountNumber
                  ? 'Update Bank Details'
                  : 'Add Bank Details'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'analytics' && <WalletAnalyticsTab />}
      </ThemedView>

      {/* Withdraw Modal */}
      <Modal visible={showWithdrawModal} transparent animationType="slide">
        <View style={themedStyles.modalOverlay}>
          <View style={themedStyles.modalContent}>
            <ThemedText type="subtitle" style={themedStyles.modalTitle}>
              Request Withdrawal
            </ThemedText>

            <ThemedText style={themedStyles.modalLabel}>Amount</ThemedText>
            <TextInput
              style={themedStyles.modalInput}
              placeholder="Enter amount"
              keyboardType="numeric"
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
            />

            <ThemedText style={themedStyles.modalHint}>
              Available: {formatCurrency(walletData?.balance.available || 0)} | Min:{' '}
              {formatCurrency(walletData?.minWithdrawalAmount || 100)}
            </ThemedText>

            <View style={themedStyles.modalButtons}>
              <TouchableOpacity
                style={themedStyles.cancelButton}
                onPress={() => setShowWithdrawModal(false)}
              >
                <ThemedText style={themedStyles.cancelButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={themedStyles.confirmButton} onPress={handleWithdraw}>
                <ThemedText style={themedStyles.confirmButtonText}>Withdraw</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bank Details Modal */}
      <Modal visible={showBankModal} transparent animationType="slide">
        <View style={themedStyles.modalOverlay}>
          <ScrollView style={themedStyles.modalScrollContent}>
            <View style={themedStyles.modalContent}>
              <ThemedText type="subtitle" style={themedStyles.modalTitle}>
                Bank Details
              </ThemedText>

              <ThemedText style={themedStyles.modalLabel}>Account Holder Name *</ThemedText>
              <TextInput
                style={themedStyles.modalInput}
                placeholder="Enter name as per bank"
                value={bankDetails.accountHolderName || ''}
                onChangeText={(text) => setBankDetails({ ...bankDetails, accountHolderName: text })}
              />

              <ThemedText style={themedStyles.modalLabel}>Account Number *</ThemedText>
              <TextInput
                style={themedStyles.modalInput}
                placeholder="Enter account number"
                keyboardType="numeric"
                value={bankDetails.accountNumber || ''}
                onChangeText={(text) => setBankDetails({ ...bankDetails, accountNumber: text })}
              />

              <ThemedText style={themedStyles.modalLabel}>IFSC Code *</ThemedText>
              <TextInput
                style={themedStyles.modalInput}
                placeholder="Enter IFSC code"
                autoCapitalize="characters"
                value={bankDetails.ifscCode || ''}
                onChangeText={(text) =>
                  setBankDetails({ ...bankDetails, ifscCode: text.toUpperCase() })
                }
              />

              <ThemedText style={themedStyles.modalLabel}>Bank Name *</ThemedText>
              <TextInput
                style={themedStyles.modalInput}
                placeholder="Enter bank name"
                value={bankDetails.bankName || ''}
                onChangeText={(text) => setBankDetails({ ...bankDetails, bankName: text })}
              />

              <ThemedText style={themedStyles.modalLabel}>Branch Name</ThemedText>
              <TextInput
                style={themedStyles.modalInput}
                placeholder="Enter branch name (optional)"
                value={bankDetails.branchName || ''}
                onChangeText={(text) => setBankDetails({ ...bankDetails, branchName: text })}
              />

              <ThemedText style={themedStyles.modalLabel}>UPI ID</ThemedText>
              <TextInput
                style={themedStyles.modalInput}
                placeholder="Enter UPI ID (optional)"
                value={bankDetails.upiId || ''}
                onChangeText={(text) => setBankDetails({ ...bankDetails, upiId: text })}
              />

              <View style={themedStyles.modalButtons}>
                <TouchableOpacity
                  style={themedStyles.cancelButton}
                  onPress={() => setShowBankModal(false)}
                >
                  <ThemedText style={themedStyles.cancelButtonText}>Cancel</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={themedStyles.confirmButton}
                  onPress={handleUpdateBankDetails}
                >
                  <ThemedText style={themedStyles.confirmButtonText}>Save</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ── Wallet Analytics Tab Component ──────────────────────────────────────────

function getAnalyticsThemedStyles(colors: WalletColors) {
  return StyleSheet.create({
    container: { paddingBottom: 20 },
    centered: { alignItems: 'center', paddingVertical: 40 },
    card: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 14 },
    barContainer: {
      flexDirection: 'row',
      height: 12,
      borderRadius: 6,
      overflow: 'hidden',
      marginBottom: 10,
    },
    bar: { height: '100%' },
    legendRow: { flexDirection: 'row', gap: 16 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: 12, color: colors.textSecondary },
    statRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    statLabel: { fontSize: 14, color: colors.textSecondary },
    statValue: { fontSize: 14, fontWeight: '700' },
  });
}

function WalletAnalyticsTab() {
  const analyticsColorScheme = useColorScheme();
  const analyticsColors = Colors[analyticsColorScheme ?? 'light'] as WalletColors;
  const themedAnalyticsStyles = getAnalyticsThemedStyles(analyticsColors);

  const [stats, setStats] = useState<WalletStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);

  const loadStats = useCallback(() => {
    setStatsError(false);
    setLoading(true);
    walletService
      .getStats()
      .then((data: WalletStatistics) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        if (__DEV__) console.error('Wallet stats error:', err);
        setStatsError(true);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading) {
    return (
      <View style={themedAnalyticsStyles.centered}>
        <ThemedText>Loading analytics...</ThemedText>
      </View>
    );
  }

  if (statsError || !stats) {
    return (
      <View style={themedAnalyticsStyles.centered}>
        <ThemedText>Unable to load analytics</ThemedText>
        <TouchableOpacity
          style={{
            marginTop: 12,
            paddingHorizontal: 16,
            paddingVertical: 8,
            backgroundColor: analyticsColors.primary,
            borderRadius: 8,
          }}
          onPress={loadStats}
        >
          <ThemedText style={{ color: '#fff', fontWeight: '600' }}>Tap to retry</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  const feePercentage =
    stats.totalSales > 0 ? ((stats.totalPlatformFees / stats.totalSales) * 100).toFixed(1) : '0.0';

  const rows: { label: string; value: string; color?: string }[] = [
    { label: 'Total Sales', value: formatCurrency(stats.totalSales) },
    {
      label: 'Platform Fees',
      value: formatCurrency(stats.totalPlatformFees),
      color: analyticsColors.destructive,
    },
    { label: 'Net Revenue', value: formatCurrency(stats.netSales), color: analyticsColors.success },
    { label: 'Fee Rate', value: `${feePercentage}%` },
    { label: 'Total Orders', value: stats.totalOrders.toLocaleString() },
    { label: 'Avg Order Value', value: formatCurrency(stats.averageOrderValue) },
    {
      label: 'Total Refunds',
      value: formatCurrency(stats.totalRefunds),
      color: analyticsColors.warning,
    },
    { label: 'Total Withdrawals', value: formatCurrency(stats.totalWithdrawals) },
  ];

  return (
    <View style={themedAnalyticsStyles.container}>
      {/* Revenue Breakdown */}
      <View style={themedAnalyticsStyles.card}>
        <ThemedText style={themedAnalyticsStyles.cardTitle}>Revenue Breakdown</ThemedText>
        <View style={themedAnalyticsStyles.barContainer}>
          <View
            style={[
              themedAnalyticsStyles.bar,
              { flex: stats.netSales, backgroundColor: Colors.light.success },
            ]}
          />
          <View
            style={[
              themedAnalyticsStyles.bar,
              { flex: stats.totalPlatformFees || 1, backgroundColor: Colors.light.destructive },
            ]}
          />
          <View
            style={[
              themedAnalyticsStyles.bar,
              { flex: stats.totalRefunds || 1, backgroundColor: Colors.light.warning },
            ]}
          />
        </View>
        <View style={themedAnalyticsStyles.legendRow}>
          <View style={themedAnalyticsStyles.legendItem}>
            <View
              style={[themedAnalyticsStyles.legendDot, { backgroundColor: Colors.light.success }]}
            />
            <ThemedText style={themedAnalyticsStyles.legendText}>Net Revenue</ThemedText>
          </View>
          <View style={themedAnalyticsStyles.legendItem}>
            <View
              style={[
                themedAnalyticsStyles.legendDot,
                { backgroundColor: Colors.light.destructive },
              ]}
            />
            <ThemedText style={themedAnalyticsStyles.legendText}>Fees</ThemedText>
          </View>
          <View style={themedAnalyticsStyles.legendItem}>
            <View
              style={[themedAnalyticsStyles.legendDot, { backgroundColor: Colors.light.warning }]}
            />
            <ThemedText style={themedAnalyticsStyles.legendText}>Refunds</ThemedText>
          </View>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={themedAnalyticsStyles.card}>
        <ThemedText style={themedAnalyticsStyles.cardTitle}>Financial Summary</ThemedText>
        {rows.map((row) => (
          <View key={row.label} style={themedAnalyticsStyles.statRow}>
            <ThemedText style={themedAnalyticsStyles.statLabel}>{row.label}</ThemedText>
            <ThemedText
              style={[
                themedAnalyticsStyles.statValue,
                row.color ? { color: row.color } : undefined,
              ]}
            >
              {row.value}
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

const analyticsStyles = StyleSheet.create({
  container: { paddingBottom: 20 },
  centered: { alignItems: 'center', paddingVertical: 40 },
  card: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 14 },
  barContainer: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 10,
  },
  bar: { height: '100%' },
  legendRow: { flexDirection: 'row', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: Colors.light.textSecondary },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  statLabel: { fontSize: 14, color: Colors.light.textSecondary },
  statValue: { fontSize: 14, fontWeight: '700' },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    color: Colors.light.text,
    marginBottom: 4,
  },
  subtitle: {
    color: Colors.light.textSecondary,
    fontSize: 14,
  },
  balanceCard: {
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceItem: {},
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 4,
  },
  balanceValue: {
    color: Colors.light.background,
    fontSize: 28,
    fontWeight: 'bold',
  },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  withdrawButtonText: {
    color: Colors.light.background,
    fontWeight: '600',
  },
  balanceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 16,
  },
  balanceDetailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    color: Colors.light.background,
    fontSize: 14,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: Colors.light.primary,
  },
  tabText: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '500',
  },
  activeTabText: {
    color: Colors.light.background,
  },
  sectionTitle: {
    marginBottom: 16,
    color: Colors.light.text,
  },
  statsContainer: {},
  feeBreakdownCard: {
    marginTop: 20,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  feeRowTotal: {
    borderBottomWidth: 0,
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: Colors.light.text,
  },
  feeLabel: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  feeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  feeTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
  },
  feeTotalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.light.success,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  transactionsContainer: {},
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
  },
  activeFilterChip: {
    backgroundColor: Colors.light.primary,
  },
  filterText: {
    fontSize: 13,
    color: Colors.light.text,
  },
  activeFilterText: {
    color: Colors.light.background,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
  },
  emptyText: {
    marginTop: 12,
    color: Colors.light.textSecondary,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  transactionIcon: {
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDesc: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  feeText: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  bankContainer: {},
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  verifiedText: {
    color: Colors.light.success,
    fontWeight: '500',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  pendingText: {
    color: Colors.light.warning,
    fontWeight: '500',
  },
  bankCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  bankLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 4,
    marginTop: 12,
  },
  bankValue: {
    fontSize: 15,
    color: Colors.light.text,
    fontWeight: '500',
  },
  updateBankButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  updateBankText: {
    color: Colors.light.background,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalScrollContent: {
    maxHeight: '80%',
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 20,
    color: Colors.light.text,
  },
  modalLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 6,
    marginTop: 12,
  },
  modalInput: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: Colors.light.text,
  },
  modalHint: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.light.text,
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: Colors.light.background,
    fontWeight: '600',
  },
  loadMoreButton: {
    padding: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    marginTop: 8,
  },
  loadMoreText: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
});
