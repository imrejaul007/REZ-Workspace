/**
 * POS Refund Screen — Process full or partial refund on a paid bill.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { platformAlertSimple, platformAlert } from '@/utils/platformAlert';
import * as Haptics from 'expo-haptics';
import { posService } from '@/services/api/pos';

const REFUND_REASONS = [
  'Customer request',
  'Wrong item delivered',
  'Item not available',
  'Quality issue',
  'Duplicate charge',
  'Other',
];

function formatCurrency(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function RefundScreen() {
  const {
    billId,
    amount: amountParam,
    billNumber,
  } = useLocalSearchParams<{
    billId: string;
    amount: string;
    billNumber: string;
  }>();

  const billTotal = parseFloat(amountParam || '0');

  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [partialAmount, setPartialAmount] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [processing, setProcessing] = useState(false);

  // MA-GAP-139: 1 INR minimum to prevent dust transactions
  const MIN_REFUND_AMOUNT = 1;
  const refundAmount = refundType === 'full' ? billTotal : parseFloat(partialAmount || '0');
  const reason = selectedReason === 'Other' ? customReason.trim() : selectedReason;

  const canSubmit =
    refundAmount >= MIN_REFUND_AMOUNT &&
    refundAmount <= billTotal &&
    reason.length > 0 &&
    (refundType === 'full' || parseFloat(partialAmount || '0') >= MIN_REFUND_AMOUNT);

  const handleRefund = () => {
    if (!canSubmit) return;
    if (!billId) {
      platformAlertSimple('Error', 'Missing bill ID. Cannot process refund.');
      return;
    }

    platformAlert(
      'Confirm Refund',
      `Refund ${formatCurrency(refundAmount)} on Bill ${billNumber || billId.slice(-6)}?\n\nReason: ${reason}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Refund',
          style: 'destructive',
          onPress: processRefund,
        },
      ]
    );
  };

  const processRefund = async () => {
    if (!billId) {
      platformAlertSimple('Error', 'Missing bill ID. Cannot process refund.');
      return;
    }
    setProcessing(true);
    try {
      await posService.refundBill(
        billId,
        reason,
        refundType === 'partial' ? refundAmount : undefined
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      platformAlertSimple('Refund Processed', `${formatCurrency(refundAmount)} has been refunded.`);
      router.back();
    } catch (e) {
      platformAlertSimple('Refund Failed', e.message || 'Could not process refund. Try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Process Refund</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Bill Info */}
        <View style={styles.billCard}>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Bill</Text>
            <Text style={styles.billValue}>
              {billNumber || `#${billId?.slice(-6).toUpperCase()}`}
            </Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Original Total</Text>
            <Text style={styles.billTotal}>{formatCurrency(billTotal)}</Text>
          </View>
        </View>

        {/* Refund Type */}
        <Text style={styles.sectionTitle}>Refund Type</Text>
        <View style={styles.typeRow}>
          <TouchableOpacity
            style={[styles.typeBtn, refundType === 'full' && styles.typeBtnActive]}
            onPress={() => setRefundType('full')}
          >
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={refundType === 'full' ? '#fff' : '#6b7280'}
            />
            <View>
              <Text
                style={[styles.typeBtnLabel, refundType === 'full' && styles.typeBtnLabelActive]}
              >
                Full Refund
              </Text>
              <Text
                style={[
                  styles.typeBtnSub,
                  refundType === 'full' && { color: 'rgba(255,255,255,0.8)' },
                ]}
              >
                {formatCurrency(billTotal)}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, refundType === 'partial' && styles.typeBtnActive]}
            onPress={() => setRefundType('partial')}
          >
            <Ionicons
              name="remove-circle"
              size={18}
              color={refundType === 'partial' ? '#fff' : '#6b7280'}
            />
            <View>
              <Text
                style={[styles.typeBtnLabel, refundType === 'partial' && styles.typeBtnLabelActive]}
              >
                Partial Refund
              </Text>
              <Text
                style={[
                  styles.typeBtnSub,
                  refundType === 'partial' && { color: 'rgba(255,255,255,0.8)' },
                ]}
              >
                Enter amount
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Partial Amount Input */}
        {refundType === 'partial' && (
          <View style={styles.amountBox}>
            <Text style={styles.amountPrefix}>₹</Text>
            <TextInput
              style={styles.amountInput}
              value={partialAmount}
              onChangeText={setPartialAmount}
              keyboardType="decimal-pad"
              placeholder={`Max ${formatCurrency(billTotal)}`}
              placeholderTextColor="#9ca3af"
              autoFocus
            />
          </View>
        )}

        {/* Reason */}
        <Text style={styles.sectionTitle}>Reason *</Text>
        <View style={styles.reasonGrid}>
          {REFUND_REASONS.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.reasonChip, selectedReason === r && styles.reasonChipActive]}
              onPress={() => setSelectedReason(r)}
            >
              <Text
                style={[styles.reasonChipText, selectedReason === r && styles.reasonChipTextActive]}
              >
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedReason === 'Other' && (
          <TextInput
            style={[styles.input, { marginTop: 8 }]}
            value={customReason}
            onChangeText={setCustomReason}
            placeholder="Describe the reason..."
            placeholderTextColor="#9ca3af"
            multiline
          />
        )}

        {/* Summary */}
        {canSubmit && (
          <View style={styles.summary}>
            <Ionicons name="information-circle" size={16} color="#7C3AED" />
            <Text style={styles.summaryText}>
              {refundType === 'full'
                ? 'Full refund'
                : `Partial refund of ${formatCurrency(refundAmount)}`}{' '}
              will be processed.
              {'\n'}Ingredient stock will be{' '}
              {refundType === 'full' ? 'restored automatically.' : 'adjusted if applicable.'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Submit */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, (!canSubmit || processing) && styles.submitBtnDisabled]}
          onPress={handleRefund}
          disabled={!canSubmit || processing}
        >
          {processing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="return-up-back" size={20} color="#fff" />
              <Text style={styles.submitBtnText}>
                Refund {canSubmit ? formatCurrency(refundAmount) : '—'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111' },
  content: { padding: 16, gap: 16, paddingBottom: 100 },
  billCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  billLabel: { fontSize: 13, color: '#6b7280' },
  billValue: { fontSize: 14, fontWeight: '600', color: '#111' },
  billTotal: { fontSize: 20, fontWeight: '800', color: '#111' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#111' },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  typeBtnActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  typeBtnLabel: { fontSize: 14, fontWeight: '700', color: '#374151' },
  typeBtnLabelActive: { color: '#fff' },
  typeBtnSub: { fontSize: 12, color: '#6b7280', marginTop: 1 },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#7C3AED',
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  amountPrefix: { fontSize: 20, fontWeight: '700', color: '#7C3AED', marginRight: 4 },
  amountInput: { flex: 1, fontSize: 24, fontWeight: '800', color: '#111', paddingVertical: 14 },
  reasonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reasonChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  reasonChipActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  reasonChipText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  reasonChipTextActive: { color: '#fff' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111',
    backgroundColor: '#fff',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  summary: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#EDE9FE',
    borderRadius: 8,
    padding: 12,
    alignItems: 'flex-start',
  },
  summaryText: { flex: 1, fontSize: 13, color: '#5B21B6', lineHeight: 18 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 16,
  },
  submitBtnDisabled: { backgroundColor: '#fca5a5' },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
