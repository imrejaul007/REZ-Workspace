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
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';
import { logger } from '@/utils/logger';
import { walletService, WalletSummary } from '@/services/api/wallet';
import { platformAlertSimple } from '@/utils/platformAlert';
import { requireBiometric } from '@/utils/biometric';

type StatusFilter = 'all' | 'pending' | 'processing' | 'paid' | 'failed';

interface Payout {
  _id: string;
  amountPaise: number;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  requestedAt: string;
  processedAt?: string;
  transactionRef?: string;
  rejectionReason?: string;
}

const STATUS_CONFIG: Record<Payout['status'], { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: '#D97706', bg: '#FEF3C7' },
  processing: { label: 'Processing', color: '#2563EB', bg: '#DBEAFE' },
  paid: { label: 'Paid', color: '#059669', bg: '#D1FAE5' },
  failed: { label: 'Failed', color: '#DC2626', bg: '#FEE2E2' },
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
    });
  } catch {
    return '—';
  }
}

function formatRupees(paise: number): string {
  return '₹' + (paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

function StatusBadge({ status }: { status: Payout['status'] }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <View style={[badgeStyles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[badgeStyles.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});

function PayoutRow({ item }: { item: Payout }) {
  return (
    <View style={rowStyles.card}>
      <View style={rowStyles.left}>
        <Text style={rowStyles.amount}>{formatRupees(item.amountPaise)}</Text>
        <Text style={rowStyles.date}>Requested: {formatDate(item.requestedAt)}</Text>
        {item.processedAt && (
          <Text style={rowStyles.date}>Processed: {formatDate(item.processedAt)}</Text>
        )}
        {item.transactionRef && <Text style={rowStyles.ref}>Ref: {item.transactionRef}</Text>}
        {item.status === 'failed' && item.rejectionReason && (
          <Text style={rowStyles.rejection}>{item.rejectionReason}</Text>
        )}
      </View>
      <StatusBadge status={item.status} />
    </View>
  );
}

const rowStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  left: { flex: 1, marginRight: 12 },
  amount: { fontSize: 16, fontWeight: '700', color: Colors.light.textHeading, marginBottom: 4 },
  date: { fontSize: 12, color: Colors.light.textSecondary },
  ref: { fontSize: 11, color: Colors.light.textSecondary, marginTop: 2 },
  rejection: { fontSize: 11, color: Colors.light.destructive, marginTop: 4 },
});

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'processing', label: 'Processing' },
  { key: 'paid', label: 'Paid' },
  { key: 'failed', label: 'Failed' },
];

interface RequestForm {
  amountRupees: string;
}

export default function PayoutsScreen() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletData, setWalletData] = useState<WalletSummary | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<RequestForm>({ amountRupees: '' });

  const PAGE_SIZE = 20;

  const fetchPayouts = useCallback(
    async (isRefreshing = false, pageNum = 1, filter: StatusFilter = statusFilter) => {
      try {
        if (isRefreshing) setRefreshing(true);
        else if (pageNum === 1) setLoading(true);
        setError(null);

        let url = `merchant/payouts?page=${pageNum}&limit=${PAGE_SIZE}`;
        if (filter !== 'all') url += `&status=${filter}`;

        const [res, wallet] = await Promise.all([
          apiClient.get<unknown>(url),
          pageNum === 1
            ? walletService.getWalletSummary().catch(() => null)
            : Promise.resolve(null),
        ]);

        if (wallet) setWalletData(wallet);

        const payload = res.data ?? res;
        const list: Payout[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.payouts)
            ? payload.payouts
            : [];

        if (pageNum === 1) {
          setPayouts(list);
        } else {
          setPayouts((prev) => [...prev, ...list]);
        }
        setPage(pageNum);
        setHasMore(list.length === PAGE_SIZE);
      } catch (err) {
        logger.error('[Payouts] fetch error:', err);
        const msg = err.message || 'Failed to load payouts';
        setError(msg);
        if (!isRefreshing) platformAlertSimple('Error', msg);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [statusFilter]
  );

  React.useEffect(() => {
    fetchPayouts(false, 1, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    fetchPayouts(false, page + 1);
  }, [loadingMore, hasMore, page, fetchPayouts]);

  const handleRequestPayout = async () => {
    const rupees = parseFloat(form.amountRupees);
    if (!form.amountRupees.trim() || isNaN(rupees) || rupees <= 0) {
      platformAlertSimple('Validation', 'Please enter a valid amount greater than 0.');
      return;
    }
    // Biometric verification before payout
    const bioResult = await requireBiometric('Confirm payout request');
    if (!bioResult.success) {
      if (bioResult.error === 'BIOMETRIC_UNAVAILABLE') {
        platformAlertSimple(
          'Biometric Unavailable',
          'Your device does not support biometric authentication. Please use your device passcode or PIN to continue.'
        );
      } else {
        platformAlertSimple(
          'Authentication Required',
          bioResult.error || 'Please authenticate to continue.'
        );
      }
      return;
    }
    if (walletData && rupees > walletData.balance.available) {
      platformAlertSimple(
        'Validation',
        `Amount exceeds available balance of ${formatRupees(walletData.balance.available)}.`
      );
      return;
    }
    if (walletData && rupees < walletData.minWithdrawalAmount) {
      platformAlertSimple(
        'Validation',
        `Minimum payout amount is ${formatRupees(walletData.minWithdrawalAmount)}.`
      );
      return;
    }
    try {
      setSubmitting(true);
      await apiClient.post('merchant/payouts/request', {
        amountPaise: Math.round(rupees * 100),
      });
      setModalVisible(false);
      setForm({ amountRupees: '' });
      await fetchPayouts(true);
      platformAlertSimple('Success', 'Payout request submitted successfully.');
    } catch (err) {
      logger.error('[Payouts] request error:', err);
      platformAlertSimple('Error', err.message || 'Failed to submit payout request.');
    } finally {
      setSubmitting(false);
    }
  };

  const openModal = () => {
    setForm({ amountRupees: '' });
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Payouts</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Balance Card */}
      <View style={styles.balanceBanner}>
        <View style={{ flex: 1 }}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>
            {walletData ? formatRupees(walletData.balance.available) : '—'}
          </Text>
          {walletData && (
            <View style={styles.balanceBreakdown}>
              <Text style={styles.balanceMeta}>
                Pending: {formatRupees(walletData.balance.pending)}
              </Text>
              <Text style={styles.balanceMeta}>
                Withdrawn: {formatRupees(walletData.balance.withdrawn)}
              </Text>
            </View>
          )}
          {walletData?.bankDetails && (
            <View style={styles.bankInfo}>
              <Ionicons name="business-outline" size={12} color={Colors.light.textSecondary} />
              <Text style={styles.bankInfoText}>
                {walletData.bankDetails.bankName} ••{walletData.bankDetails.accountNumber.slice(-4)}
                {walletData.bankDetails.isVerified ? ' ✓' : ''}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.requestBtn} onPress={openModal}>
          <Ionicons name="add-circle-outline" size={16} color="#fff" />
          <Text style={styles.requestBtnText}>Request Payout</Text>
        </TouchableOpacity>
      </View>

      {/* Status Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterBarContent}
      >
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, statusFilter === f.key && styles.filterChipActive]}
            onPress={() => setStatusFilter(f.key)}
          >
            <Text
              style={[styles.filterChipText, statusFilter === f.key && styles.filterChipTextActive]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading payouts...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.light.destructive} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchPayouts()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={payouts}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchPayouts(true)}
              colors={[Colors.light.primary]}
              tintColor={Colors.light.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={56} color={Colors.light.textSecondary} />
              <Text style={styles.emptyTitle}>No payouts yet</Text>
              <Text style={styles.emptySubtitle}>
                Your payout history will appear here once you request one.
              </Text>
            </View>
          }
          renderItem={({ item }) => <PayoutRow item={item} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                size="small"
                color={Colors.light.primary}
                style={{ paddingVertical: 16 }}
              />
            ) : null
          }
        />
      )}

      {/* Request Payout Bottom Sheet Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Payout</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalClose}>
                <Ionicons name="close" size={22} color={Colors.light.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {walletData && (
                <View style={styles.modalBalanceInfo}>
                  <Text style={styles.modalBalanceLabel}>Available Balance</Text>
                  <Text style={styles.modalBalanceValue}>
                    {formatRupees(walletData.balance.available)}
                  </Text>
                  {walletData.minWithdrawalAmount > 0 && (
                    <Text style={styles.modalMinAmount}>
                      Min. payout: {formatRupees(walletData.minWithdrawalAmount)}
                    </Text>
                  )}
                </View>
              )}

              <Text style={styles.fieldLabel}>Amount (₹) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 5000"
                placeholderTextColor={Colors.light.textSecondary}
                keyboardType="decimal-pad"
                value={form.amountRupees}
                onChangeText={(v) => setForm((f) => ({ ...f, amountRupees: v }))}
              />

              {walletData?.bankDetails ? (
                <View style={styles.modalBankCard}>
                  <View style={styles.modalBankHeader}>
                    <Ionicons name="business-outline" size={16} color={Colors.light.primary} />
                    <Text style={styles.modalBankTitle}>Payout to</Text>
                  </View>
                  {/* TS-H2 fix: bankDetails fields guarded since bankDetails can be absent */}
                  <Text style={styles.modalBankName}>
                    {walletData.bankDetails?.bankName ?? '—'}
                  </Text>
                  <Text style={styles.modalBankDetail}>
                    A/C: ••••{walletData.bankDetails?.accountNumber?.slice(-4) ?? '—'} | IFSC:{' '}
                    {walletData.bankDetails?.ifscCode ?? '—'}
                  </Text>
                  <Text style={styles.modalBankDetail}>
                    {walletData.bankDetails?.accountHolderName ?? '—'}
                  </Text>
                  {walletData.bankDetails?.upiId && (
                    <Text style={styles.modalBankDetail}>UPI: {walletData.bankDetails.upiId}</Text>
                  )}
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addBankBtn}
                  onPress={() => {
                    setModalVisible(false);
                    router.push('/(dashboard)/wallet');
                  }}
                >
                  <Ionicons name="add-circle-outline" size={16} color={Colors.light.primary} />
                  <Text style={styles.addBankBtnText}>Add bank details in Wallet settings</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  (submitting || !walletData?.bankDetails) && styles.submitBtnDisabled,
                ]}
                onPress={handleRequestPayout}
                disabled={submitting || !walletData?.bankDetails}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Submit Request</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.backgroundSecondary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.light.textHeading },
  balanceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.light.primaryLight2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  balanceLabel: { fontSize: 12, fontWeight: '600', color: Colors.light.textSecondary },
  balanceAmount: { fontSize: 22, fontWeight: '800', color: Colors.light.primary, marginTop: 2 },
  balanceBreakdown: { flexDirection: 'row', gap: 12, marginTop: 4 },
  balanceMeta: { fontSize: 11, color: Colors.light.textSecondary },
  bankInfo: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  bankInfoText: { fontSize: 11, color: Colors.light.textSecondary },
  requestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.light.primary,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  requestBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  listContent: { padding: 14, paddingBottom: 32 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  loadingText: { fontSize: 14, color: Colors.light.textSecondary, marginTop: 8 },
  errorText: { fontSize: 14, color: Colors.light.destructive, textAlign: 'center' },
  retryBtn: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
  },
  retryBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  emptyState: { alignItems: 'center', paddingVertical: 56, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.light.text },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: Colors.light.text },
  modalClose: { padding: 4 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  submitBtn: {
    marginTop: 24,
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  // Filter bar
  filterBar: { backgroundColor: Colors.light.background, maxHeight: 48 },
  filterBarContent: { paddingHorizontal: 14, paddingVertical: 8, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  filterChipActive: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  filterChipText: { fontSize: 12, fontWeight: '600', color: Colors.light.textSecondary },
  filterChipTextActive: { color: '#fff' },
  // Modal extras
  modalBalanceInfo: {
    backgroundColor: Colors.light.primaryLight2,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  modalBalanceLabel: { fontSize: 12, color: Colors.light.textSecondary },
  modalBalanceValue: { fontSize: 20, fontWeight: '800', color: Colors.light.primary, marginTop: 2 },
  modalMinAmount: { fontSize: 11, color: Colors.light.textSecondary, marginTop: 4 },
  modalBankCard: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  modalBankHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  modalBankTitle: { fontSize: 13, fontWeight: '600', color: Colors.light.primary },
  modalBankName: { fontSize: 14, fontWeight: '700', color: Colors.light.text },
  modalBankDetail: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 2 },
  addBankBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    borderStyle: 'dashed',
  },
  addBankBtnText: { fontSize: 13, color: Colors.light.primary, fontWeight: '600' },
});
