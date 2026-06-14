/**
 * POS Invoice Screen — Professional GST Tax Invoice viewer for POS transactions
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Share,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/DesignTokens';
import { invoiceService, InvoiceData } from '@/services/api/invoices';
import { printerService, ReceiptData } from '@/services/printer';
import { showAlert } from '@/utils/alert';
import { logger } from '@/utils/logger';

export default function POSInvoiceScreen() {
  const { billId } = useLocalSearchParams<{ billId: string }>();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [printing, setPrinting] = useState(false);

  const fetchInvoice = useCallback(async () => {
    if (!billId) return;
    try {
      setLoading(true);
      const response = await invoiceService.getInvoice(billId);
      setInvoice(response.data || null);
    } catch (error) {
      if (__DEV__) console.error('Error fetching invoice:', error);
      showAlert('Error', 'Failed to load invoice');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [billId]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const handleShare = async () => {
    if (!invoice) return;
    try {
      setSharing(true);
      const text = `TAX INVOICE\n${invoice.storeName}\nInvoice: ${invoice.invoiceNo}\nTotal: ₹${invoice.total.toFixed(2)}`;
      await Share.share({ message: text, title: `Invoice ${invoice.invoiceNo}` });
    } catch (error) {
      if (__DEV__) console.error('Share error:', error);
    } finally {
      setSharing(false);
    }
  };

  const handlePrint = async () => {
    if (!invoice) return;
    try {
      setPrinting(true);
      const receiptData: ReceiptData = {
        storeName: invoice.storeName,
        storeAddress: invoice.storeAddress,
        gstin: invoice.gstin,
        invoiceNo: invoice.invoiceNo,
        date: invoice.date,
        billNo: invoice.billNo,
        items: invoice.items,
        subtotal: invoice.subtotal,
        cgst: invoice.cgst,
        sgst: invoice.sgst,
        igst: invoice.igst,
        total: invoice.total,
        paymentMethod: invoice.paymentMethod,
        customerPhone: invoice.customerPhone,
        upiId: invoice.upiId,
      };

      const result = await printerService.printReceipt(receiptData);

      if (!result.success) {
        // Queue for retry and inform user
        printerService.queuePrintRetry(receiptData);
        showAlert(
          'Print Queued',
          'Printer unavailable. Receipt queued for retry. You can also share as PDF.'
        );
      } else if (result.method === 'pdf_share') {
        showAlert('Info', 'Printer unavailable — shared as PDF instead');
      } else {
        showAlert('Success', 'Receipt sent to printer');
      }
    } catch (error) {
      if (__DEV__) console.error('Print error:', error);
      showAlert('Error', error.message || 'Failed to print receipt');
    } finally {
      setPrinting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  if (!invoice) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error[500]} />
          <Text style={styles.errorText}>Invoice not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#F0FFF4', '#ECFDF5', '#ffffff']}
        style={StyleSheet.absoluteFillObject}
      />
      <Animated.View entering={FadeIn} style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary[500]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>TAX INVOICE</Text>
        <TouchableOpacity style={styles.headerButton} onPress={handleShare} disabled={sharing}>
          <Ionicons
            name="share-social"
            size={20}
            color={sharing ? Colors.gray[400] : Colors.primary[500]}
          />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(100)} style={styles.card}>
          <View style={styles.section}>
            <Text style={styles.storeName}>{invoice.storeName}</Text>
            <Text style={styles.storeAddress}>{invoice.storeAddress}</Text>
            {invoice.gstin && <Text style={styles.gstinText}>GSTIN: {invoice.gstin}</Text>}
          </View>
          <View style={styles.divider} />
          <View style={styles.section}>
            <View style={styles.row}>
              <View style={styles.column}>
                <Text style={styles.label}>Invoice No</Text>
                <Text style={styles.value}>{invoice.invoiceNo}</Text>
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>Date</Text>
                <Text style={styles.value}>{invoice.date}</Text>
              </View>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.section}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>₹{invoice.subtotal.toFixed(2)}</Text>
            </View>
            {invoice.cgst && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>CGST (9%)</Text>
                <Text style={styles.totalValue}>₹{invoice.cgst.toFixed(2)}</Text>
              </View>
            )}
            {invoice.sgst && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>SGST (9%)</Text>
                <Text style={styles.totalValue}>₹{invoice.sgst.toFixed(2)}</Text>
              </View>
            )}
          </View>
          <View style={styles.heavyDivider} />
          <View style={styles.section}>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>TOTAL</Text>
              <Text style={styles.grandTotalValue}>₹{invoice.total.toFixed(2)}</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <Animated.View entering={FadeInDown.delay(200)} style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.actionButton, styles.printButton]}
          onPress={handlePrint}
          disabled={printing}
        >
          {printing ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="print" size={18} color="white" />
              <Text style={styles.actionButtonText}>Print</Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background.primary },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  errorText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.error[500],
  },
  backButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.lg,
  },
  backButtonText: { color: 'white', fontSize: Typography.fontSize.base, fontWeight: '600' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
  },
  headerTitle: {
    flex: 1,
    marginLeft: Spacing.md,
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  content: { padding: Spacing.lg, paddingBottom: 100 },
  card: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  section: { padding: Spacing.lg },
  storeName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  storeAddress: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  gstinText: { fontSize: Typography.fontSize.xs, color: Colors.text.tertiary, fontWeight: '500' },
  divider: { height: 1, backgroundColor: Colors.border.light, marginHorizontal: Spacing.lg },
  heavyDivider: { height: 2, backgroundColor: Colors.primary[500], marginHorizontal: Spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  column: { flex: 1 },
  label: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    marginBottom: Spacing.xs,
    fontWeight: '500',
  },
  value: { fontSize: Typography.fontSize.base, fontWeight: '600', color: Colors.text.primary },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  totalLabel: { fontSize: Typography.fontSize.sm, color: Colors.text.secondary },
  totalValue: { fontSize: Typography.fontSize.sm, fontWeight: '600', color: Colors.text.primary },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grandTotalLabel: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  grandTotalValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.success[600],
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  printButton: { backgroundColor: Colors.primary[500] },
  actionButtonText: { fontSize: Typography.fontSize.sm, fontWeight: '600', color: 'white' },
});
