import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';
import { logger } from '@/utils/logger';

interface Invoice {
  id: string;
  date: string;
  dueDate: string;
  amount: number;
  amountPaid: number;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  plan: string;
  billingCycle: 'monthly' | 'yearly';
  paymentMethod?: string;
  transactionId?: string;
  invoiceUrl?: string;
}

interface PaymentSummary {
  totalPaid: number;
  totalPending: number;
  lastPaymentDate: string | null;
  nextPaymentDate: string | null;
  paymentMethod?: string;
}

const STATUS_CONFIG: Record<
  Invoice['status'],
  { label: string; color: string; bgColor: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  paid: { label: 'Paid', color: '#059669', bgColor: '#D1FAE5', icon: 'checkmark-circle' },
  pending: { label: 'Pending', color: '#D97706', bgColor: '#FEF3C7', icon: 'time' },
  failed: { label: 'Failed', color: '#DC2626', bgColor: '#FEE2E2', icon: 'close-circle' },
  refunded: { label: 'Refunded', color: '#7C3AED', bgColor: '#EDE9FE', icon: 'arrow-undo' },
};

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatAmount(paise: number): string {
  return '₹' + (paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

function InvoiceCard({ invoice, onDownload }: { invoice: Invoice; onDownload: () => void }) {
  const status = STATUS_CONFIG[invoice.status];

  return (
    <View style={styles.invoiceCard}>
      <View style={styles.invoiceHeader}>
        <View style={styles.invoiceInfo}>
          <Text style={styles.invoiceId}>Invoice #{invoice.id.slice(-8).toUpperCase()}</Text>
          <Text style={styles.invoiceDate}>{formatDate(invoice.date)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.bgColor }]}>
          <Ionicons name={status.icon} size={14} color={status.color} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      <View style={styles.invoiceDetails}>
        <View style={styles.invoiceRow}>
          <Text style={styles.invoiceLabel}>Plan</Text>
          <Text style={styles.invoiceValue}>
            {invoice.plan.charAt(0).toUpperCase() + invoice.plan.slice(1)} ({invoice.billingCycle})
          </Text>
        </View>
        <View style={styles.invoiceRow}>
          <Text style={styles.invoiceLabel}>Amount</Text>
          <Text style={styles.invoiceAmount}>{formatAmount(invoice.amount)}</Text>
        </View>
        {invoice.status === 'paid' && invoice.amountPaid !== invoice.amount && (
          <View style={styles.invoiceRow}>
            <Text style={styles.invoiceLabel}>Amount Paid</Text>
            <Text style={styles.invoiceAmount}>{formatAmount(invoice.amountPaid)}</Text>
          </View>
        )}
        {invoice.paymentMethod && (
          <View style={styles.invoiceRow}>
            <Text style={styles.invoiceLabel}>Payment Method</Text>
            <Text style={styles.invoiceValue}>{invoice.paymentMethod}</Text>
          </View>
        )}
        {invoice.transactionId && (
          <View style={styles.invoiceRow}>
            <Text style={styles.invoiceLabel}>Transaction ID</Text>
            <Text style={styles.transactionId}>{invoice.transactionId}</Text>
          </View>
        )}
      </View>

      <View style={styles.invoiceActions}>
        <TouchableOpacity style={styles.downloadButton} onPress={onDownload}>
          <Ionicons name="download-outline" size={18} color={Colors.light.primary} />
          <Text style={styles.downloadButtonText}>Download</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.viewButton}>
          <Ionicons name="eye-outline" size={18} color={Colors.light.primary} />
          <Text style={styles.viewButtonText}>View</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function PaymentHistoryScreen() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'failed'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const PAGE_SIZE = 10;

  const loadPaymentHistory = useCallback(
    async (isRefreshing = false, pageNum = 1, currentFilter = filter) => {
      try {
        if (isRefreshing) setRefreshing(true);
        else if (pageNum === 1) setLoading(true);
        setError(null);

        let url = `merchant/subscription/invoices?page=${pageNum}&limit=${PAGE_SIZE}`;
        if (currentFilter !== 'all') {
          url += `&status=${currentFilter}`;
        }

        const [invoicesRes, summaryRes] = await Promise.all([
          apiClient.get<{ invoices: Invoice[]; total: number }>(url),
          pageNum === 1 ? apiClient.get<PaymentSummary>('merchant/subscription/payment-summary') : Promise.resolve(null),
        ]);

        if (invoicesRes.success && invoicesRes.data) {
          const data = invoicesRes.data;
          const list: Invoice[] = data.invoices || [];

          if (pageNum === 1) {
            setInvoices(list);
          } else {
            setInvoices((prev) => [...prev, ...list]);
          }
          setPage(pageNum);
          setHasMore(list.length === PAGE_SIZE);
        }

        if (summaryRes?.success && summaryRes.data) {
          setSummary(summaryRes.data);
        }
      } catch (error) {
        logger.error('[PaymentHistory] Failed to load:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [filter]
  );

  React.useEffect(() => {
    loadPaymentHistory(false, 1, filter);
  }, [filter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPaymentHistory(true, 1, filter);
    setRefreshing(false);
  }, [filter]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    loadPaymentHistory(false, page + 1, filter);
  }, [loadingMore, hasMore, page, filter]);

  const handleDownload = (invoice: Invoice) => {
    // In production, this would trigger a PDF download
    logger.info('[PaymentHistory] Download invoice:', invoice.id);
  };

  const handleViewDetail = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setDetailModalVisible(true);
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (filter === 'all') return true;
    return inv.status === filter;
  });

  const totalPaid = summary?.totalPaid ?? invoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + i.amountPaid, 0);
  const totalPending = summary?.totalPending ?? invoices.filter((i) => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#7C3AED', '#6366F1']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment History</Text>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <View style={[styles.summaryIcon, { backgroundColor: '#D1FAE5' }]}>
            <Ionicons name="checkmark-circle" size={20} color="#059669" />
          </View>
          <Text style={styles.summaryLabel}>Total Paid</Text>
          <Text style={styles.summaryValue}>{formatAmount(totalPaid)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <View style={[styles.summaryIcon, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="time" size={20} color="#D97706" />
          </View>
          <Text style={styles.summaryLabel}>Pending</Text>
          <Text style={styles.summaryValue}>{formatAmount(totalPending)}</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'paid', 'pending', 'failed'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Invoice List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading payments...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredInvoices}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.light.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={64} color={Colors.light.textSecondary} />
              <Text style={styles.emptyTitle}>No Invoices Found</Text>
              <Text style={styles.emptyText}>
                {filter === 'all'
                  ? 'Your payment history will appear here once you make a payment.'
                  : `No ${filter} invoices found.`}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <InvoiceCard invoice={item} onDownload={() => handleDownload(item)} />
          )}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator size="small" color={Colors.light.primary} style={{ paddingVertical: 16 }} />
            ) : null
          }
        />
      )}

      {/* Invoice Detail Modal */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invoice Details</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.light.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedInvoice && (
              <View style={styles.modalContent}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Invoice Number</Text>
                  <Text style={styles.detailValue}>#{selectedInvoice.id.slice(-8).toUpperCase()}</Text>
                </View>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedInvoice.date)}</Text>
                </View>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Plan</Text>
                  <Text style={styles.detailValue}>
                    {selectedInvoice.plan.charAt(0).toUpperCase() + selectedInvoice.plan.slice(1)}
                  </Text>
                </View>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Billing Cycle</Text>
                  <Text style={styles.detailValue}>
                    {selectedInvoice.billingCycle.charAt(0).toUpperCase() +
                      selectedInvoice.billingCycle.slice(1)}
                  </Text>
                </View>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Amount</Text>
                  <Text style={styles.detailAmount}>{formatAmount(selectedInvoice.amount)}</Text>
                </View>
                {selectedInvoice.transactionId && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Transaction ID</Text>
                    <Text style={styles.detailValue}>{selectedInvoice.transactionId}</Text>
                  </View>
                )}

                <TouchableOpacity style={styles.modalDownloadBtn}>
                  <Ionicons name="download-outline" size={20} color="white" />
                  <Text style={styles.modalDownloadBtnText}>Download Invoice</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.textHeading,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  filterTabActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  filterTextActive: {
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  invoiceCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  invoiceInfo: {},
  invoiceId: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textHeading,
    marginBottom: 2,
  },
  invoiceDate: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  invoiceDetails: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: 12,
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  invoiceLabel: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  invoiceValue: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.textHeading,
  },
  invoiceAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  transactionId: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  invoiceActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  downloadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: Colors.light.primaryLight2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  downloadButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 8,
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.textHeading,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.textHeading,
  },
  modalContent: {},
  detailSection: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.light.textHeading,
  },
  detailAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  modalDownloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  modalDownloadBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },
});

const Platform = require('react-native').Platform;
