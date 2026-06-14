/**
 * Settlement Detail Screen
 * Order-level breakdown for the settlement cycle
 */

import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '@/utils/logger';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Modal,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { settlementService, SettlementRecord } from '@/services/api/settlements';
import { showAlert } from '@/utils/alert';
import { storageService } from '@/services/storage';
import { apiClient } from '@/services/api/client';
import { getApiUrl } from '@/config/api';

interface SettlementOrder {
  orderId: string;
  date: string;
  amount: number;
  platformFee: number;
  tax: number;
  netAmount: number;
  status: 'completed' | 'refunded' | 'disputed';
}

interface SettlementDetail extends SettlementRecord {
  orders: SettlementOrder[];
}

export default function SettlementDetailScreen() {
  const router = useRouter();
  const { settlementId } = useLocalSearchParams<{ settlementId?: string }>();

  const [settlement, setSettlement] = useState<SettlementDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);

  const fetchSettlementDetail = useCallback(
    async (showRefreshing = false) => {
      if (!settlementId) {
        setError('Invalid settlement ID');
        setIsLoading(false);
        return;
      }

      try {
        if (showRefreshing) setRefreshing(true);
        else setIsLoading(true);

        const response = await apiClient.get<SettlementDetail>(
          `merchant/settlements/${settlementId}`
        );

        if (response.success && response.data) {
          setSettlement(response.data);
          setError(null);
        } else {
          setError(response.message || 'Failed to load settlement details');
        }
      } catch (err) {
        logger.error('Error fetching settlement detail:', err);
        setError(err?.message || 'Failed to load settlement details');
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [settlementId]
  );

  useEffect(() => {
    fetchSettlementDetail();
  }, [fetchSettlementDetail]);

  const handleDownloadStatement = async () => {
    try {
      if (!settlement) return;

      const baseUrl = getApiUrl().replace(/\/$/, '');
      const url = `${baseUrl}/merchant/settlements/${settlement._id}/statement`;

      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        await Linking.openURL(url);
      }
      showAlert('Success', 'Statement downloaded');
    } catch (error) {
      logger.error('Download failed:', error);
      showAlert('Error', 'Failed to download statement');
    }
  };

  const handleRaiseDispute = async () => {
    if (!disputeReason.trim()) {
      showAlert('Validation', 'Please enter a reason for the dispute');
      return;
    }

    try {
      setIsSubmittingDispute(true);

      const response = await apiClient.post(`merchant/settlements/${settlementId}/dispute`, {
        reason: disputeReason.trim(),
      });

      if (response.success) {
        showAlert('Success', 'Dispute raised successfully. Our team will review it.');
        setShowDisputeModal(false);
        setDisputeReason('');
        await fetchSettlementDetail(false);
      } else {
        showAlert('Error', response.message || 'Failed to raise dispute');
      }
    } catch (error) {
      logger.error('Error raising dispute:', error);
      showAlert('Error', error?.message || 'Failed to raise dispute');
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${Math.abs(amount).toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      active: { bg: '#DBEAFE', text: '#2563EB' },
      pending_settlement: { bg: '#FEF3C7', text: '#D97706' },
      settled: { bg: '#DCFCE7', text: '#16A34A' },
      disputed: { bg: '#FEE2E2', text: '#DC2626' },
      void: { bg: '#F3F4F6', text: '#6B7280' },
    };
    return colors[status] || colors.void;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
          <Text style={styles.loadingText}>Loading settlement details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !settlement) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settlement Details</Text>
        </View>

        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={Colors.light.error} />
          <Text style={styles.errorTitle}>Failed to load settlement</Text>
          <Text style={styles.errorMessage}>{error || 'No settlement data available'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchSettlementDetail()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusColor = getStatusColor(settlement.status);

  const renderOrderRow = useCallback(
    ({ item }: { item: SettlementOrder }) => (
      <View style={styles.orderRow}>
        <View style={styles.orderLeft}>
          <Text style={styles.orderId}>{item.orderId}</Text>
          <Text style={styles.orderDate}>{formatDate(item.date)}</Text>
        </View>
        <View style={styles.orderCenter}>
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Amount</Text>
            <Text style={styles.amountValue}>{formatCurrency(item.amount)}</Text>
          </View>
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Fee</Text>
            <Text style={styles.amountValue}>{formatCurrency(item.platformFee)}</Text>
          </View>
        </View>
        <View style={styles.orderRight}>
          <Text style={styles.netAmount}>{formatCurrency(item.netAmount)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusColor.text }]}>{item.status}</Text>
          </View>
        </View>
      </View>
    ),
    []
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settlement Details</Text>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchSettlementDetail(true)} />
        }
      >
        {/* Settlement Card */}
        <View style={styles.settlementCard}>
          <View style={styles.settlementHeader}>
            <View>
              <Text style={styles.cycleName}>
                {settlement.cycleId === 'instant' ? 'Instant Settlement' : settlement.cycleId}
              </Text>
              <Text style={styles.campaignType}>{settlement.campaignType}</Text>
            </View>
            <View style={[styles.statusBadgeLarge, { backgroundColor: statusColor.bg }]}>
              <Text style={[styles.statusBadgeLargeText, { color: statusColor.text }]}>
                {settlement.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </Text>
            </View>
          </View>

          {/* Summary Stats */}
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Issued</Text>
              <Text style={styles.statValue}>{formatCurrency(settlement.rewardIssued)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Redeemed</Text>
              <Text style={styles.statValue}>{formatCurrency(settlement.rewardRedeemed)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Platform Fee</Text>
              <Text style={[styles.statValue, { color: Colors.light.error }]}>
                {formatCurrency(settlement.rewardIssued * 0.05)} {/* Assume 5% fee */}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Settled</Text>
              <Text style={[styles.statValue, { color: Colors.light.success }]}>
                {formatCurrency(settlement.settledAmount)}
              </Text>
            </View>
          </View>

          {/* Pending Amount */}
          {settlement.pendingAmount > 0 && (
            <View style={styles.pendingBox}>
              <Ionicons name="time-outline" size={18} color={Colors.light.warning} />
              <View style={styles.pendingContent}>
                <Text style={styles.pendingLabel}>Pending Settlement</Text>
                <Text style={styles.pendingAmount}>{formatCurrency(settlement.pendingAmount)}</Text>
              </View>
            </View>
          )}

          {/* Settlement Date */}
          {settlement.settlementDate && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Settled on:</Text>
              <Text style={styles.infoValue}>{formatDate(settlement.settlementDate)}</Text>
            </View>
          )}
        </View>

        {/* Orders Section */}
        <View style={styles.ordersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Order Breakdown</Text>
            <View style={styles.orderCount}>
              <Text style={styles.orderCountText}>{settlement.redemptionCount} orders</Text>
            </View>
          </View>

          {settlement.orders && settlement.orders.length > 0 ? (
            <FlatList
              data={settlement.orders}
              renderItem={renderOrderRow}
              keyExtractor={(item) => item.orderId}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyOrders}>
              <Text style={styles.emptyText}>No orders in this settlement</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton} onPress={handleDownloadStatement}>
            <Ionicons name="download-outline" size={18} color={Colors.light.tint} />
            <Text style={styles.actionButtonText}>Download Statement</Text>
          </TouchableOpacity>

          {settlement.status !== 'disputed' && settlement.status !== 'settled' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.disputeButton]}
              onPress={() => setShowDisputeModal(true)}
            >
              <Ionicons name="alert-circle-outline" size={18} color={Colors.light.error} />
              <Text style={[styles.actionButtonText, styles.disputeButtonText]}>Raise Dispute</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Dispute Modal */}
      <Modal
        visible={showDisputeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDisputeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Raise Dispute</Text>
              <TouchableOpacity onPress={() => setShowDisputeModal(false)}>
                <Ionicons name="close" size={28} color="#111" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Reason for Dispute</Text>
              <View style={styles.textInputWrapper}>
                <View
                  style={styles.input}
                  // @ts-ignore
                  as="textarea"
                  multiline
                  numberOfLines={5}
                  placeholder="Please explain the issue with this settlement"
                  placeholderTextColor="#9CA3AF"
                  value={disputeReason}
                  onChangeText={setDisputeReason}
                  editable={!isSubmittingDispute}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.buttonCancel]}
                onPress={() => setShowDisputeModal(false)}
                disabled={isSubmittingDispute}
              >
                <Text style={styles.buttonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonSubmit]}
                onPress={handleRaiseDispute}
                disabled={isSubmittingDispute}
              >
                {isSubmittingDispute ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonSubmitText}>Submit Dispute</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginTop: 16,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  settlementCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  settlementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cycleName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  campaignType: {
    fontSize: 13,
    color: '#6B7280',
  },
  statusBadgeLarge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgeLargeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  statItem: {
    width: '48%',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  pendingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    marginBottom: 12,
    gap: 12,
  },
  pendingContent: {
    flex: 1,
  },
  pendingLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  pendingAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.warning,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111',
  },
  ordersSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  orderCount: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
  },
  orderCountText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  orderLeft: {
    flex: 0.3,
  },
  orderId: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  orderCenter: {
    flex: 0.35,
    gap: 8,
  },
  amountBox: {
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111',
  },
  orderRight: {
    flex: 0.35,
    alignItems: 'flex-end',
  },
  netAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  emptyOrders: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  actionsSection: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.tint,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.tint,
  },
  disputeButton: {
    borderColor: Colors.light.error,
  },
  disputeButtonText: {
    color: Colors.light.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
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
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#111',
  },
  textInputWrapper: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111',
    minHeight: 100,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCancel: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  buttonCancelText: {
    color: '#111',
    fontWeight: '600',
  },
  buttonSubmit: {
    backgroundColor: Colors.light.tint,
  },
  buttonSubmitText: {
    color: '#fff',
    fontWeight: '600',
  },
});
