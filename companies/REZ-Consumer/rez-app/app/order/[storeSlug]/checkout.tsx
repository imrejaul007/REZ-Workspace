// @ts-nocheck
import { withErrorBoundary } from '@/utils/withErrorBoundary';
import { logger } from '@/utils/logger';
/**
 * Web QR Ordering — Checkout
 *
 * Receives cart + store data from the menu screen via route params.
 * Steps:
 *   1. Review cart + enter name / table / instructions
 *   2. Enter phone → receive OTP → verify (creates sessionToken)
 *   3. Place order → Razorpay payment sheet
 *   4. On success → navigate to confirmation screen
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Button, Input } from '@/components/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RazorpayCheckout from 'react-native-razorpay';
import {
  sendWebOtp,
  verifyWebOtp,
  createWebOrder,
  verifyWebPayment,
  creditWebOrderCoins,
  CartItem,
} from '@/services/webOrderingApi';
import { platformAlertSimple, platformAlertConfirm } from '@/utils/platformAlert';
import financeApi, { ContextualOffer } from '@/services/financeApi';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StoreInfo {
  id: string;
  name: string;
  slug: string;
  gstPercent: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── OTP Input ────────────────────────────────────────────────────────────────

function OtpInput({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled: boolean }) {
  const refs = useRef<(TextInput | null)[]>(Array(6).fill(null));

  const handleChange = (char: string, index: number) => {
    const digits = value.split('');
    digits[index] = char.replace(/\D/g, '').slice(-1);
    const next = digits.join('');
    onChange(next);
    if (char && index < 5) refs.current[index + 1]?.focus();
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !value[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={otpStyles.row}>
      {Array.from({ length: 6 }, (_, i) => (
        <TextInput
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          style={[otpStyles.cell, value[i] ? otpStyles.cellFilled : null]}
          value={value[i] ?? ''}
          onChangeText={(c) => handleChange(c, i)}
          onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
          keyboardType="number-pad"
          maxLength={1}
          editable={!disabled}
          selectTextOnFocus
          textContentType="oneTimeCode"
        />
      ))}
    </View>
  );
}

const otpStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  cell: {
    width: 44,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  cellFilled: { borderColor: '#1a3a52', backgroundColor: '#F5F3FF' },
});

// ─── Order Summary section ────────────────────────────────────────────────────

function OrderSummary({ cart, gstPercent }: { cart: CartItem[]; gstPercent: number }) {
  const subtotal = cart.reduce((s, c) => s + c.item.price * c.quantity, 0);
  const taxes = Math.round((subtotal * gstPercent) / 100);
  const total = subtotal + taxes;

  return (
    <View style={styles.summaryCard}>
      <Text style={styles.sectionTitle}>Order Summary</Text>
      {cart.map((c) => (
        <View key={c.item.id} style={styles.summaryRow}>
          <Text style={styles.summaryQty}>{c.quantity}×</Text>
          <Text style={styles.summaryName} numberOfLines={1}>
            {c.item.name}
          </Text>
          <Text style={styles.summaryPrice}>{formatCurrency(c.item.price * c.quantity)}</Text>
        </View>
      ))}
      <View style={styles.divider} />
      <View style={styles.summaryRow}>
        <Text style={[styles.summaryName, { color: '#6B7280' }]}>Subtotal</Text>
        <Text style={styles.summaryPrice}>{formatCurrency(subtotal)}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={[styles.summaryName, { color: '#6B7280' }]}>GST ({gstPercent}%)</Text>
        <Text style={styles.summaryPrice}>{formatCurrency(taxes)}</Text>
      </View>
      <View style={[styles.summaryRow, styles.totalRow]}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalAmount}>{formatCurrency(total)}</Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

// CD-TS-05 FIX: Wrap with ErrorBoundary to prevent crashes from killing the entire screen
function CheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<unknown>();

  // Cart and store are loaded from AsyncStorage on mount to avoid URL length
  // limits that can corrupt large carts with long customisation strings (P3-12).
  const [cart, setCart] = useState<CartItem[]>([]);
  const [store, setStore] = useState<StoreInfo | null>(null);

  // ── Customer fields ──
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [instructions, setInstructions] = useState('');

  // ── OTP ──
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpResendCountdown, setOtpResendCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  // Load cart and store from AsyncStorage written by the menu screen.
  useEffect(() => {
    const slug = params.storeSlug as string;
    if (!slug) return;
    Promise.all([AsyncStorage.getItem(`web_order_cart_${slug}`), AsyncStorage.getItem(`web_order_store_${slug}`)]).then(
      ([cartData, storeData]) => {
        if (!isMountedRef.current) return;
        if (cartData) {
          try {
            setCart(JSON.parse(cartData));
          } catch {
            /* malformed — leave empty */
          }
        }
        if (storeData) {
          try {
            setStore(JSON.parse(storeData));
          } catch {
            /* malformed — leave null */
          }
        }
      },
    );
  }, [params.storeSlug]);

  // ── Placement ──
  const [placingOrder, setPlacingOrder] = useState(false);

  // ── BNPL (Pay Later) ──
  const [bnplOffer, setBnplOffer] = useState<ContextualOffer | null>(null);
  const [useBnpl, setUseBnpl] = useState(false);

  // Check BNPL eligibility when cart total is known
  const cartTotal = cart.reduce((s, c) => s + c.item.price * c.quantity, 0);
  useEffect(() => {
    if (cartTotal > 0) {
      financeApi
        .checkBnpl(cartTotal, 'checkout_' + Date.now())
        .then((res) => {
          if ((res.data as unknown)?.eligible) setBnplOffer(res.data as unknown);
        })
        .catch((err) => {
          logger.error('BNPL offer check failed', err, 'Checkout');
        });
    }
  }, [cartTotal]);

  // Countdown timer for OTP resend
  const startCountdown = useCallback(() => {
    setOtpResendCountdown(30);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setOtpResendCountdown((p) => {
        if (p <= 1) {
          clearInterval(countdownRef.current!);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
  }, []);

  useEffect(
    () => () => {
      isMountedRef.current = false;
      if (countdownRef.current) clearInterval(countdownRef.current);
    },
    [],
  );

  const handleSendOtp = useCallback(async () => {
    const cleaned = phone.replace(/\s/g, '');
    if (!/^[6-9]\d{9}$/.test(cleaned)) {
      platformAlertSimple('Invalid number', 'Enter a valid 10-digit Indian mobile number.');
      return;
    }
    setOtpLoading(true);
    try {
      await sendWebOtp(cleaned);
      if (!isMountedRef.current) return;
      setOtpSent(true);
      startCountdown();
    } catch (e) {
      platformAlertSimple('Error', e.message || 'Could not send OTP');
    } finally {
      setOtpLoading(false);
    }
  }, [phone, startCountdown]);

  const handleVerifyOtp = useCallback(async () => {
    if (otpValue.length < 6) return;
    setOtpLoading(true);
    try {
      const token = await verifyWebOtp(phone.replace(/\s/g, ''), otpValue);
      setSessionToken(token);
    } catch (e) {
      platformAlertSimple('Wrong OTP', e.message || 'OTP did not match. Try again.');
      setOtpValue('');
    } finally {
      setOtpLoading(false);
    }
  }, [phone, otpValue]);

  const handlePlaceOrder = useCallback(async () => {
    if (!sessionToken || !store) return;
    if (!name.trim()) {
      platformAlertSimple('Name required', 'Please enter your name.');
      return;
    }

    setPlacingOrder(true);
    try {
      const orderData = await createWebOrder({
        storeSlug: store.slug,
        items: cart.map((c) => ({ id: c.item.id, quantity: c.quantity, customisation: c.customisation })),
        customerName: name.trim(),
        tableNumber: params.table || undefined,
        specialInstructions: instructions.trim() || undefined,
        sessionToken,
      });

      if (!orderData.razorpay) {
        // COD / no payment gateway configured — go straight to confirmation
        router.replace({
          pathname: '/order/[storeSlug]/confirmation',
          params: { storeSlug: store.slug, orderNumber: orderData.orderNumber },
        });
        return;
      }

      if (__DEV__) {
        // DEV ONLY: Simulate payment success to speed up local testing.
        // This block is stripped from production builds.
        platformAlertConfirm(
          'Complete Payment (DEV)',
          `Amount: ${formatCurrency(orderData.total)}\nOrder: ${orderData.orderNumber}\n\nDev mode: tap Simulate to skip the Razorpay sheet.`,
          async () => {
            try {
              // In a real flow: use react-native-razorpay or open Razorpay web checkout
              // and receive {razorpay_payment_id, razorpay_order_id, razorpay_signature}
              // then call verifyWebPayment(...)
              router.replace({
                pathname: '/order/[storeSlug]/confirmation',
                params: { storeSlug: store.slug, orderNumber: orderData.orderNumber },
              });
            } catch (verifyErr) {
              platformAlertSimple('Payment Error', verifyErr.message);
            }
          },
          'Simulate Success',
          'Cancel',
        );
      } else {
        // Production Razorpay payment
        try {
          const razorpayData = await RazorpayCheckout.open({
            key: orderData.razorpay.keyId,
            amount: orderData.razorpay.amount, // already in paise from backend
            currency: orderData.razorpay.currency,
            order_id: orderData.razorpay.orderId,
            name: 'REZ',
            description: `Order #${orderData.orderNumber}`,
            prefill: { name: name.trim() },
            theme: { color: '#16C266' },
          });
          // Verify payment signature with backend.
          // sessionToken is required so the backend can confirm the caller owns this order.
          await verifyWebPayment({
            orderId: orderData.orderId,
            razorpay_order_id: razorpayData.razorpay_order_id,
            razorpay_payment_id: razorpayData.razorpay_payment_id,
            razorpay_signature: razorpayData.razorpay_signature,
            sessionToken,
          });
          // Credit REZ Coins for this order (best-effort — non-blocking).
          creditWebOrderCoins({ orderNumber: orderData.orderNumber, sessionToken }).catch((err) => {
            logger.warn(
              'Coin credit failed (non-blocking)',
              { orderNumber: orderData.orderNumber, error: err?.message },
              'Checkout',
            );
          });
          router.replace({
            pathname: '/order/[storeSlug]/confirmation',
            params: { storeSlug: store.slug, orderNumber: orderData.orderNumber },
          });
        } catch (paymentErr) {
          // User cancelled — don't show an error, just let them retry
          if (paymentErr?.code === 0 || paymentErr?.description === 'Payment cancelled by user.') {
            return; // Silent cancel
          }
          platformAlertSimple(
            'Payment Failed',
            paymentErr?.description || paymentErr?.message || 'Payment could not be completed. Please try again.',
          );
        }
      }
    } catch (e) {
      platformAlertSimple('Order Failed', e.message || 'Could not place order. Try again.');
    } finally {
      setPlacingOrder(false);
    }
  }, [sessionToken, store, cart, name, instructions, params.table, router]);

  if (!cart.length) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.centerScreen}>
          <Ionicons name="cart-outline" size={52} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Cart is empty</Text>
          <Button
            onPress={() => router.back()}
            label="← Go back to menu"
            variant="secondary"
            style={styles.backLinkButton}
            textStyle={styles.backLinkText}
          />
        </View>
      </SafeAreaView>
    );
  }

  const gst = store?.gstPercent ?? 5;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <LinearGradient colors={['#1a3a52', '#1a3a52']} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Checkout</Text>
            <Text style={styles.headerSub}>{store?.name}</Text>
          </View>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Cart summary */}
          <Animated.View entering={FadeInDown.delay(0).springify()}>
            <OrderSummary cart={cart} gstPercent={gst} />
          </Animated.View>

          {/* Customer details */}
          <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.card}>
            <Text style={styles.sectionTitle}>Your Details</Text>

            <Text style={styles.fieldLabel}>Name *</Text>
            <Input
              style={styles.input}
              placeholder="Your name"
              value={name}
              onChangeText={setName}
              editable={!sessionToken}
            />

            {params.table ? (
              <View style={styles.tableRow}>
                <Ionicons name="restaurant-outline" size={15} color="#1a3a52" />
                <Text style={styles.tableLabel}>Table {params.table}</Text>
              </View>
            ) : null}

            <Text style={styles.fieldLabel}>Special Instructions</Text>
            <Input
              style={[styles.input, styles.inputMulti]}
              placeholder="Allergies, spice level, etc."
              value={instructions}
              onChangeText={setInstructions}
            />
          </Animated.View>

          {/* Phone verification */}
          <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.card}>
            <Text style={styles.sectionTitle}>{sessionToken ? '✅ Phone Verified' : 'Verify Your Phone'}</Text>

            {!sessionToken && (
              <>
                <Text style={styles.fieldLabel}>Mobile Number</Text>
                <View style={styles.phoneRow}>
                  <View style={styles.phonePrefix}>
                    <Text style={styles.phonePrefixText}>+91</Text>
                  </View>
                  <Input
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    placeholder="9876543210"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    editable={!otpSent || otpResendCountdown > 0}
                  />
                </View>

                {!otpSent ? (
                  <Button
                    onPress={handleSendOtp}
                    disabled={otpLoading}
                    label={otpLoading ? '' : 'Send OTP'}
                    variant="primary"
                    style={[styles.primaryBtn, { opacity: otpLoading ? 0.7 : 1 }]}
                    textStyle={styles.primaryBtnText}
                  >
                    {otpLoading && <ActivityIndicator size="small" color="#fff" />}
                  </Button>
                ) : (
                  <>
                    <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Enter 6-digit OTP</Text>
                    <OtpInput value={otpValue} onChange={setOtpValue} disabled={otpLoading} />

                    <Button
                      onPress={handleVerifyOtp}
                      disabled={otpValue.length < 6 || otpLoading}
                      label={otpLoading ? '' : 'Verify OTP'}
                      variant="primary"
                      style={[
                        styles.primaryBtn,
                        { marginTop: 16, opacity: otpValue.length < 6 || otpLoading ? 0.6 : 1 },
                      ]}
                      textStyle={styles.primaryBtnText}
                    >
                      {otpLoading && <ActivityIndicator size="small" color="#fff" />}
                    </Button>

                    <Button
                      onPress={() => otpResendCountdown === 0 && handleSendOtp()}
                      disabled={otpResendCountdown > 0}
                      label={otpResendCountdown > 0 ? `Resend in ${otpResendCountdown}s` : 'Resend OTP'}
                      variant="secondary"
                      style={{ marginTop: 10 }}
                      textStyle={[styles.resendText, otpResendCountdown > 0 ? { color: '#9CA3AF' } : null]}
                    />
                  </>
                )}
              </>
            )}

            {sessionToken && (
              <View style={styles.verifiedRow}>
                <Ionicons name="checkmark-circle" size={20} color="#059669" />
                <Text style={styles.verifiedText}>+91 {phone} verified</Text>
              </View>
            )}
          </Animated.View>

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* BNPL Pay Later banner */}
        {bnplOffer?.eligible && !useBnpl && (
          <TouchableOpacity style={styles.bnplBanner} onPress={() => setUseBnpl(true)}>
            <Text style={styles.bnplText}>💳 {bnplOffer.message}</Text>
            <Text style={styles.bnplAction}>Use Pay Later →</Text>
          </TouchableOpacity>
        )}
        {useBnpl && (
          <View style={[styles.bnplBanner, { backgroundColor: '#E8F8F0' }]}>
            <Text style={styles.bnplText}>✅ Pay Later selected — pay in 30 days</Text>
            <TouchableOpacity onPress={() => setUseBnpl(false)}>
              <Text style={[styles.bnplAction, { color: '#E44' }]}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Place Order button */}
        {sessionToken && (
          <Animated.View entering={FadeInDown.springify()} style={styles.placeOrderBar}>
            <Button
              onPress={handlePlaceOrder}
              disabled={placingOrder}
              label={placingOrder ? '' : 'Place Order'}
              variant="primary"
              style={[styles.placeOrderBtn, { opacity: placingOrder ? 0.75 : 1 }]}
              textStyle={styles.placeOrderText}
            >
              {!placingOrder && (
                <Text style={styles.placeOrderAmount}>
                  {formatCurrency(cart.reduce((s, c) => s + c.item.price * c.quantity, 0) * (1 + gst / 100))}
                </Text>
              )}
              {placingOrder && <ActivityIndicator size="small" color="#fff" />}
            </Button>
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F9FAFB' },
  centerScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#374151' },
  backLink: { fontSize: 14, color: '#1a3a52', fontWeight: '600' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  content: { padding: 16, gap: 14 },

  // Cards
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 },
  summaryQty: { width: 28, fontSize: 13, fontWeight: '700', color: '#1a3a52', textAlign: 'center' },
  summaryName: { flex: 1, fontSize: 13, color: '#374151' },
  summaryPrice: { fontSize: 13, fontWeight: '600', color: '#111827' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 8 },
  totalRow: { paddingTop: 4 },
  totalLabel: { flex: 1, fontSize: 15, fontWeight: '800', color: '#111827' },
  totalAmount: { fontSize: 16, fontWeight: '800', color: '#1a3a52' },

  // Form
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    marginBottom: 12,
  },
  backLinkButton: {
    backgroundColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backLinkText: {
    color: '#7C3AED',
    fontWeight: '600',
  },
  inputMulti: { minHeight: 72, textAlignVertical: 'top' },
  tableRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  tableLabel: { fontSize: 13, fontWeight: '600', color: '#1a3a52' },

  // Phone
  phoneRow: { flexDirection: 'row', gap: 8, alignItems: 'stretch', marginBottom: 12 },
  phonePrefix: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  phonePrefixText: { fontSize: 14, fontWeight: '600', color: '#374151' },

  // Buttons
  primaryBtn: { backgroundColor: '#1a3a52', borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  resendText: { fontSize: 13, color: '#1a3a52', fontWeight: '600' },

  // Verified
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  verifiedText: { fontSize: 14, fontWeight: '600', color: '#059669' },

  // BNPL banner
  bnplBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F4FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0E7FF',
  },
  bnplText: { flex: 1, fontSize: 13, color: '#334', fontWeight: '500' },
  bnplAction: { fontSize: 13, color: '#4F46E5', fontWeight: '700', marginLeft: 8 },

  // Place order bar
  placeOrderBar: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  placeOrderBtn: {
    backgroundColor: '#1a3a52',
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  placeOrderText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  placeOrderAmount: { fontSize: 16, fontWeight: '800', color: '#fff' },
});

export default withErrorBoundary(CheckoutScreen, 'WebCheckout');
