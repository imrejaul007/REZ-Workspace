/**
 * POS Success Screen — Shown after payment is confirmed.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Share,
  Platform,
} from 'react-native';
import { platformAlertSimple, platformAlert } from '@/utils/platformAlert';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { Colors, Shadows } from '@/constants/DesignTokens';
import { apiClient } from '@/services/api/client';
import { logger } from '@/utils/logger';

// ─── Animated Checkmark ────────────────────────────────────────────────────

const AnimatedCheckmark = () => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(200, withSpring(1, { damping: 10, stiffness: 120 }));
    opacity.value = withDelay(200, withTiming(1, { duration: 300 }));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.checkmarkContainer, animStyle]}>
      <LinearGradient colors={['#10B981', '#059669']} style={styles.checkmarkGradient}>
        <Ionicons name="checkmark" size={60} color="white" />
      </LinearGradient>
    </Animated.View>
  );
};

// ─── Coin Burst ────────────────────────────────────────────────────────────

const CoinBurst = ({ count }: { count: number }) => {
  const y = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    if (count <= 0) return;
    opacity.value = withDelay(600, withTiming(1, { duration: 200 }));
    scale.value = withDelay(600, withSpring(1.1));
    y.value = withDelay(
      600,
      withSequence(withTiming(-12, { duration: 300 }), withTiming(0, { duration: 200 }))
    );
  }, [count]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: y.value }, { scale: scale.value }],
  }));

  if (count <= 0) return null;

  return (
    <Animated.View style={[styles.coinBurst, style]}>
      <Ionicons name="sparkles" size={18} color="#F59E0B" />
      <Text style={styles.coinBurstText}>+{count} coins earned!</Text>
    </Animated.View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────

export default function SuccessScreen() {
  const {
    billId,
    amount: amountParam,
    coinsEarned: coinsParam,
    paymentMethod,
    coinDiscount: coinDiscountParam,
    tipAmount: tipAmountParam,
  } = useLocalSearchParams<{
    billId: string;
    amount: string;
    coinsEarned: string;
    paymentMethod: string;
    coinDiscount: string;
    tipAmount: string;
  }>();

  const amount = parseFloat(amountParam || '0');
  const coins = parseInt(coinsParam || '0', 10);
  const method = paymentMethod || 'qr';
  const coinDiscount = parseFloat(coinDiscountParam || '0');
  // BUG FIX: Tip was already captured on the Payment screen before
  // mark-as-paid. Read it from the route param and display only —
  // DO NOT let success.tsx try to POST a new tip, because the backend
  // /bills/:billId/tip route rejects tips on bills that aren't still
  // pending (always 400 after payment). The previous implementation
  // had its own broken interactive selector that fired cleanup POSTs
  // on every tap and got 400 every time.
  const tipAmount = parseFloat(tipAmountParam || '0') || 0;
  const finalTotal = amount; // `amount` already includes the tip (payment.tsx sends finalAmount)

  // Validate payment confirmation
  useEffect(() => {
    try {
      if (!billId) {
        throw new Error('Missing bill ID');
      }
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid payment amount');
      }
    } catch (error) {
      logger.error('[POS Success] Validation error:', error);
      platformAlert(
        'Invalid Transaction',
        'The transaction could not be confirmed. Please verify your payment details.',
        [
          { text: 'Retry', onPress: () => router.replace('/pos') },
          { text: 'Dashboard', onPress: () => router.replace('/(dashboard)'), style: 'cancel' },
        ]
      );
    }
  }, [billId, amount]);

  const paymentMethodLabel: Record<string, string> = {
    qr: 'UPI / QR Code',
    cash: 'Cash',
    card: 'Card / POS',
  };

  const handleShareReceipt = async () => {
    const receiptText = `Payment Receipt\n\nAmount: ₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\nBill ID: ${billId}\nMethod: ${paymentMethodLabel[method] || method}\nDate: ${new Date().toLocaleString('en-IN')}\n\nPowered by Rez`;
    await Share.share({ message: receiptText, title: 'Payment Receipt' });
  };

  // C-03: Digital Receipt Sending
  //
  // BUG FIX: The previous impl hardcoded `customerPhone: null, customerEmail: null`
  // which the backend route /merchant/pos/bills/:billId/send-receipt unconditionally
  // 400s (it requires a phone for sms/whatsapp and an email for email). So the
  // three digital-receipt icons always failed.
  //
  // Fix: prompt the cashier for the recipient. Uses `window.prompt` on web
  // (which is where this app runs under Expo web), falls back to a notice on
  // native until an inline sheet is wired up. Non-paper receipts are a nice-
  // to-have, so graceful degradation is acceptable.
  const handleSendReceipt = async (sendMethod: 'whatsapp' | 'sms' | 'email') => {
    const isWeb = Platform.OS === 'web';
    const promptLabel =
      sendMethod === 'email' ? "Customer's email address:" : "Customer's phone number:";

    let recipient: string | null = null;
    if (isWeb && typeof window !== 'undefined' && typeof window.prompt === 'function') {
      recipient = window.prompt(promptLabel);
    } else {
      platformAlertSimple(
        'Not available',
        'Collect the customer contact on the POS charge screen — inline contact entry on the success screen is coming soon.'
      );
      return;
    }

    if (!recipient) return;
    recipient = recipient.trim();
    if (!recipient) return;

    const payload: Record<string, unknown> = { method: sendMethod };
    if (sendMethod === 'email') payload.customerEmail = recipient;
    else payload.customerPhone = recipient;

    try {
      await apiClient.post(`/merchant/pos/bills/${billId}/send-receipt`, payload);
      platformAlertSimple('Success', `Receipt sent via ${sendMethod.toUpperCase()}!`);
    } catch (error) {
      platformAlertSimple('Error', error?.message || 'Failed to send receipt');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#F0FFF4', '#ECFDF5', '#ffffff']}
        style={StyleSheet.absoluteFillObject}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Checkmark */}
        <View style={styles.heroSection}>
          <AnimatedCheckmark />
          <Animated.Text entering={FadeInDown.delay(400)} style={styles.successTitle}>
            Payment Received!
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(500)} style={styles.successSubtitle}>
            Transaction completed successfully
          </Animated.Text>
        </View>

        {/* Amount Card */}
        <Animated.View entering={ZoomIn.delay(300).springify()} style={styles.amountCard}>
          <Text style={styles.amountLabel}>AMOUNT PAID</Text>
          <Text style={styles.amountDisplay}>
            ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </Text>
          <CoinBurst count={coins} />
        </Animated.View>

        {/* Tip confirmation — display-only. The tip is captured on the Payment
            screen before mark-as-paid; success.tsx only echoes it back. */}
        {tipAmount > 0 && (
          <Animated.View entering={FadeInDown.delay(400)} style={styles.tipContainer}>
            <View style={styles.tipConfirmation}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text style={styles.tipConfirmText}>
                ✓ ₹{tipAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} tip included in
                total
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Receipt Details */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.receiptCard}>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Bill ID</Text>
            <Text style={styles.receiptValue}>{billId || 'N/A'}</Text>
          </View>
          <View style={styles.receiptDivider} />
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Payment Method</Text>
            <View style={styles.methodBadge}>
              <Ionicons
                name={
                  method === 'cash'
                    ? 'cash-outline'
                    : method === 'card'
                      ? 'card-outline'
                      : 'phone-portrait-outline'
                }
                size={14}
                color="#7C3AED"
              />
              <Text style={styles.methodText}>{paymentMethodLabel[method] || method}</Text>
            </View>
          </View>
          <View style={styles.receiptDivider} />
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Date & Time</Text>
            <Text style={styles.receiptValue}>
              {new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </Text>
          </View>
          {coinDiscount > 0 && (
            <>
              <View style={styles.receiptDivider} />
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Coin Redemption</Text>
                <View style={styles.coinsRow}>
                  <Ionicons name="logo-bitcoin" size={14} color="#F59E0B" />
                  <Text style={[styles.coinsValue, { color: '#059669' }]}>
                    -₹{coinDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>
            </>
          )}
          {coins > 0 && (
            <>
              <View style={styles.receiptDivider} />
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Customer Coins</Text>
                <View style={styles.coinsRow}>
                  <Ionicons name="sparkles" size={14} color="#F59E0B" />
                  <Text style={styles.coinsValue}>+{coins} coins</Text>
                </View>
              </View>
            </>
          )}
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View entering={FadeInUp.delay(600)} style={styles.actions}>
          {/* New Sale */}
          <TouchableOpacity
            style={styles.newSaleButton}
            onPress={() => router.replace('/pos')}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle" size={22} color="white" />
            <Text style={styles.newSaleButtonText}>New Sale</Text>
          </TouchableOpacity>

          {/* View Receipt */}
          <TouchableOpacity
            style={styles.receiptButton}
            onPress={handleShareReceipt}
            activeOpacity={0.85}
          >
            <Ionicons name="share-outline" size={20} color="#7C3AED" />
            <Text style={styles.receiptButtonText}>Share Receipt</Text>
          </TouchableOpacity>

          {/* Download GST Invoice */}
          <TouchableOpacity
            style={styles.invoiceButton}
            onPress={() => billId && router.push(`/documents/pos-invoice/${billId}`)}
            activeOpacity={0.85}
          >
            <Ionicons name="document-text" size={20} color="#7C3AED" />
            <Text style={styles.receiptButtonText}>Download GST Invoice</Text>
          </TouchableOpacity>

          {/* Print Receipt */}
          <TouchableOpacity
            style={styles.invoiceButton}
            onPress={() => billId && router.push(`/documents/pos-invoice/${billId}?action=print`)}
            activeOpacity={0.85}
          >
            <Ionicons name="print" size={20} color="#7C3AED" />
            <Text style={styles.receiptButtonText}>Print Receipt</Text>
          </TouchableOpacity>

          {/* C-03: Digital Receipt Options */}
          <View style={styles.digitalReceiptRow}>
            <TouchableOpacity
              style={styles.digitalReceiptButton}
              onPress={() => handleSendReceipt('whatsapp')}
              activeOpacity={0.85}
            >
              <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.digitalReceiptButton}
              onPress={() => handleSendReceipt('sms')}
              activeOpacity={0.85}
            >
              <Ionicons name="mail" size={18} color="#7C3AED" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.digitalReceiptButton}
              onPress={() => handleSendReceipt('email')}
              activeOpacity={0.85}
            >
              <Ionicons name="at" size={18} color="#EA4335" />
            </TouchableOpacity>
          </View>

          {/* Process Refund */}
          {/* MA-GAP-144: Guard against zero-amount refund navigation */}
          {billId && finalTotal > 0 && (
            <TouchableOpacity
              style={styles.refundButton}
              onPress={() =>
                router.push({
                  pathname: '/pos/refund',
                  params: { billId, amount: String(finalTotal) },
                })
              }
              activeOpacity={0.8}
            >
              <Ionicons name="return-up-back" size={18} color="#ef4444" />
              <Text style={styles.refundButtonText}>Process Refund</Text>
            </TouchableOpacity>
          )}

          {/* Go to Dashboard */}
          <TouchableOpacity
            style={styles.dashboardButton}
            onPress={() => router.replace('/(dashboard)')}
            activeOpacity={0.8}
          >
            <Text style={styles.dashboardButtonText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0FFF4',
  },
  tipContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FED7AA',
    ...Shadows.sm,
  },
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tipLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  tipBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  tipChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  tipChip: {
    flex: 1,
    minWidth: '48%',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
  },
  tipChipActive: {
    borderColor: '#F59E0B',
    backgroundColor: '#FEF3C7',
  },
  tipChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  tipChipTextActive: {
    color: '#D97706',
  },
  tipConfirmation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  tipConfirmText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    alignItems: 'center',
  },
  heroSection: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 28,
  },
  checkmarkContainer: {
    marginBottom: 8,
  },
  checkmarkGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  successSubtitle: {
    fontSize: 15,
    color: Colors.text.secondary,
  },
  amountCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 40,
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    gap: 6,
    ...Shadows.lg,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.success[600],
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  amountDisplay: {
    fontSize: 48,
    fontWeight: '900',
    color: Colors.success[600],
    letterSpacing: -1,
  },
  coinBurst: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 4,
  },
  coinBurstText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D97706',
  },
  receiptCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 24,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: Colors.border.light,
  },
  receiptLabel: {
    fontSize: 14,
    color: Colors.text.tertiary,
    fontWeight: '500',
  },
  receiptValue: {
    fontSize: 14,
    color: Colors.text.primary,
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  methodText: {
    fontSize: 13,
    color: '#7C3AED',
    fontWeight: '600',
  },
  coinsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coinsValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D97706',
  },
  actions: {
    width: '100%',
    gap: 10,
  },
  newSaleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 17,
    borderRadius: 14,
    backgroundColor: '#7C3AED',
    ...Shadows.md,
  },
  newSaleButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#EDE9FE',
    borderWidth: 1.5,
    borderColor: '#7C3AED',
  },
  receiptButtonText: {
    color: '#7C3AED',
    fontSize: 15,
    fontWeight: '600',
  },
  invoiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#EDE9FE',
    borderWidth: 1.5,
    borderColor: '#7C3AED',
  },
  refundButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 8,
    marginBottom: 4,
  },
  refundButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  dashboardButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dashboardButtonText: {
    color: Colors.text.tertiary,
    fontSize: 14,
    fontWeight: '500',
  },
  digitalReceiptRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    marginVertical: 8,
  },
  digitalReceiptButton: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#EDE9FE',
    borderWidth: 1.5,
    borderColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
