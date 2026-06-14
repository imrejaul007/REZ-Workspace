import React, { memo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, parseISO, isValid } from 'date-fns';
import {
  PurchaseOrder,
  POStatus,
  PaymentStatus,
} from '../types';

interface POCardProps {
  purchaseOrder: PurchaseOrder;
  onPress: (po: PurchaseOrder) => void;
  onApprove?: (po: PurchaseOrder) => void;
  onReject?: (po: PurchaseOrder) => void;
  compact?: boolean;
}

const STATUS_CONFIG: Record<POStatus, { color: string; icon: string; label: string }> = {
  draft: { color: '#9E9E9E', icon: 'file-edit-outline', label: 'Draft' },
  pending_approval: { color: '#FF9800', icon: 'clock-outline', label: 'Pending Approval' },
  approved: { color: '#4CAF50', icon: 'check-circle-outline', label: 'Approved' },
  rejected: { color: '#F44336', icon: 'close-circle-outline', label: 'Rejected' },
  sent: { color: '#2196F3', icon: 'send-outline', label: 'Sent' },
  acknowledged: { color: '#03A9F4', icon: 'check-all', label: 'Acknowledged' },
  in_transit: { color: '#9C27B0', icon: 'truck-delivery-outline', label: 'In Transit' },
  delivered: { color: '#4CAF50', icon: 'package-variant-closed-check', label: 'Delivered' },
  cancelled: { color: '#757575', icon: 'cancel', label: 'Cancelled' },
};

const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { color: string; label: string }> = {
  unpaid: { color: '#F44336', label: 'Unpaid' },
  partial: { color: '#FF9800', label: 'Partial' },
  paid: { color: '#4CAF50', label: 'Paid' },
};

const PRIORITY_CONFIG: Record<string, { color: string; icon: string }> = {
  low: { color: '#4CAF50', icon: 'arrow-down' },
  medium: { color: '#FF9800', icon: 'minus' },
  high: { color: '#F44336', icon: 'arrow-up' },
  urgent: { color: '#9C27B0', icon: 'alert' },
};

export const POCard: React.FC<POCardProps> = memo(({
  purchaseOrder,
  onPress,
  onApprove,
  onReject,
  compact = false,
}) => {
  const statusConfig = STATUS_CONFIG[purchaseOrder.status] || STATUS_CONFIG.draft;
  const paymentConfig = PAYMENT_STATUS_CONFIG[purchaseOrder.paymentStatus];
  const priorityConfig = PRIORITY_CONFIG[purchaseOrder.priority] || PRIORITY_CONFIG.medium;

  const formatDate = useCallback((dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return '-';
      return format(date, 'MMM dd, yyyy');
    } catch {
      return '-';
    }
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, []);

  const itemCount = purchaseOrder.items?.length || 0;
  const hasPendingApproval = purchaseOrder.status === 'pending_approval';

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={() => onPress(purchaseOrder)}
        activeOpacity={0.7}
      >
        <View style={styles.compactHeader}>
          <Text style={styles.compactPONumber}>{purchaseOrder.poNumber}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '20' }]}>
            <MaterialCommunityIcons
              name={statusConfig.icon as unknown}
              size={12}
              color={statusConfig.color}
            />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>
        <Text style={styles.compactSupplier}>{purchaseOrder.supplier?.name || 'Unknown Supplier'}</Text>
        <View style={styles.compactFooter}>
          <Text style={styles.compactAmount}>{formatCurrency(purchaseOrder.grandTotal)}</Text>
          <Text style={styles.compactDate}>{formatDate(purchaseOrder.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(purchaseOrder)}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.poNumber}>{purchaseOrder.poNumber}</Text>
          <View style={[styles.priorityBadge, { backgroundColor: priorityConfig.color + '20' }]}>
            <MaterialCommunityIcons
              name={priorityConfig.icon as unknown}
              size={10}
              color={priorityConfig.color}
            />
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '20' }]}>
          <MaterialCommunityIcons
            name={statusConfig.icon as unknown}
            size={14}
            color={statusConfig.color}
          />
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* Supplier Info */}
      <View style={styles.supplierSection}>
        <MaterialCommunityIcons name="domain" size={16} color="#666" />
        <Text style={styles.supplierName}>{purchaseOrder.supplier?.name || 'Unknown Supplier'}</Text>
        {purchaseOrder.supplier?.isVerified && (
          <MaterialCommunityIcons name="check-decagram" size={14} color="#4CAF50" />
        )}
      </View>

      {/* Items Summary */}
      <View style={styles.itemsSection}>
        <MaterialCommunityIcons name="package-variant" size={16} color="#666" />
        <Text style={styles.itemsText}>
          {itemCount} item{itemCount !== 1 ? 's' : ''}
        </Text>
        <View style={styles.dot} />
        <Text style={styles.itemsText}>
          {purchaseOrder.items?.reduce((sum, item) => sum + item.quantity, 0) || 0} units
        </Text>
      </View>

      {/* Amount Section */}
      <View style={styles.amountSection}>
        <View>
          <Text style={styles.amountLabel}>Total Amount</Text>
          <Text style={styles.amountValue}>{formatCurrency(purchaseOrder.grandTotal)}</Text>
        </View>
        <View style={[styles.paymentBadge, { backgroundColor: paymentConfig.color + '20' }]}>
          <Text style={[styles.paymentText, { color: paymentConfig.color }]}>
            {paymentConfig.label}
          </Text>
        </View>
      </View>

      {/* Date Info */}
      <View style={styles.dateSection}>
        <View style={styles.dateItem}>
          <MaterialCommunityIcons name="calendar-plus" size={14} color="#999" />
          <Text style={styles.dateLabel}>Created</Text>
          <Text style={styles.dateValue}>{formatDate(purchaseOrder.createdAt)}</Text>
        </View>
        {purchaseOrder.expectedDeliveryDate && (
          <View style={styles.dateItem}>
            <MaterialCommunityIcons name="calendar-clock" size={14} color="#999" />
            <Text style={styles.dateLabel}>Expected</Text>
            <Text style={styles.dateValue}>{formatDate(purchaseOrder.expectedDeliveryDate)}</Text>
          </View>
        )}
      </View>

      {/* Tags */}
      {purchaseOrder.tags && purchaseOrder.tags.length > 0 && (
        <View style={styles.tagsSection}>
          {purchaseOrder.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
          {purchaseOrder.tags.length > 3 && (
            <Text style={styles.moreTags}>+{purchaseOrder.tags.length - 3}</Text>
          )}
        </View>
      )}

      {/* Sync Status */}
      {purchaseOrder.syncStatus === 'pending' && (
        <View style={styles.syncBadge}>
          <MaterialCommunityIcons name="cloud-sync" size={12} color="#FF9800" />
          <Text style={styles.syncText}>Pending sync</Text>
        </View>
      )}

      {/* Action Buttons for Pending Approval */}
      {hasPendingApproval && (onApprove || onReject) && (
        <View style={styles.actionSection}>
          {onReject && (
            <Pressable
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => onReject(purchaseOrder)}
            >
              <MaterialCommunityIcons name="close" size={18} color="#F44336" />
              <Text style={styles.rejectText}>Reject</Text>
            </Pressable>
          )}
          {onApprove && (
            <Pressable
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => onApprove(purchaseOrder)}
            >
              <MaterialCommunityIcons name="check" size={18} color="#4CAF50" />
              <Text style={styles.approveText}>Approve</Text>
            </Pressable>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
});

POCard.displayName = 'POCard';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compactContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  poNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  supplierSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  supplierName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  itemsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  itemsText: {
    fontSize: 13,
    color: '#666',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CCC',
  },
  amountSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  paymentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  paymentText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dateSection: {
    flexDirection: 'row',
    gap: 24,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateLabel: {
    fontSize: 12,
    color: '#999',
  },
  dateValue: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  tagsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  tag: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 11,
    color: '#666',
  },
  moreTags: {
    fontSize: 11,
    color: '#999',
    alignSelf: 'center',
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#FFF3E0',
  },
  syncText: {
    fontSize: 11,
    color: '#FF9800',
  },
  actionSection: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  approveButton: {
    backgroundColor: '#E8F5E9',
  },
  rejectButton: {
    backgroundColor: '#FFEBEE',
  },
  approveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  rejectText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F44336',
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  compactPONumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  compactSupplier: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  compactFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  compactDate: {
    fontSize: 12,
    color: '#999',
  },
});

export default POCard;
