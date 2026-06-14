import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useGo } from '@/components/go/GoContext';

type PaymentMethod = 'upi' | 'wallet' | 'card';

export default function CheckoutScreen() {
  const router = useRouter();
  const { activeSession, cartSummary, checkout, isLoading } = useGo();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('upi');
  const [processing, setProcessing] = useState(false);

  if (!activeSession || !cartSummary) {
    return (
      <>
        <Stack.Screen options={{ title: 'Checkout' }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No items in cart</Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => router.push('/go/scan')}
          >
            <Text style={styles.startButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  const handlePayment = async () => {
    setProcessing(true);
    const success = await checkout(selectedMethod);
    setProcessing(false);

    if (success) {
      router.replace('/go/success');
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Checkout' }} />
      <View style={styles.container}>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {cartSummary.itemCount} items
              </Text>
              <Text style={styles.summaryValue}>
                ₹{cartSummary.subtotal.toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax (18% GST)</Text>
              <Text style={styles.summaryValue}>
                ₹{cartSummary.tax.toFixed(2)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                ₹{cartSummary.total.toFixed(2)}
              </Text>
            </View>
            {cartSummary.cashbackEarned > 0 && (
              <View style={styles.cashbackRow}>
                <Text style={styles.cashbackLabel}>
                  You'll earn ₹{cartSummary.cashbackEarned.toFixed(2)} cashback
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedMethod === 'upi' && styles.paymentOptionSelected,
            ]}
            onPress={() => setSelectedMethod('upi')}
          >
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentIcon}>💳</Text>
              <View>
                <Text style={styles.paymentLabel}>UPI</Text>
                <Text style={styles.paymentDesc}>Pay instantly via any UPI app</Text>
              </View>
            </View>
            <View style={styles.radio}>
              {selectedMethod === 'upi' && <View style={styles.radioSelected} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedMethod === 'wallet' && styles.paymentOptionSelected,
            ]}
            onPress={() => setSelectedMethod('wallet')}
          >
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentIcon}>👛</Text>
              <View>
                <Text style={styles.paymentLabel}>REZ Wallet</Text>
                <Text style={styles.paymentDesc}>Pay with your wallet balance</Text>
              </View>
            </View>
            <View style={styles.radio}>
              {selectedMethod === 'wallet' && <View style={styles.radioSelected} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedMethod === 'card' && styles.paymentOptionSelected,
            ]}
            onPress={() => setSelectedMethod('card')}
          >
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentIcon}>💳</Text>
              <View>
                <Text style={styles.paymentLabel}>Card</Text>
                <Text style={styles.paymentDesc}>Credit/Debit card via Razorpay</Text>
              </View>
            </View>
            <View style={styles.radio}>
              {selectedMethod === 'card' && <View style={styles.radioSelected} />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Pay Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.payButton, processing && styles.payButtonDisabled]}
            onPress={handlePayment}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.payButtonText}>
                Pay ₹{cartSummary.total.toFixed(2)}
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.secureText}>
            Secured by REZ Pay
          </Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 16,
  },
  startButton: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1F2937',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  cashbackRow: {
    backgroundColor: '#FEF3C7',
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  cashbackLabel: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '600',
    textAlign: 'center',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 12,
  },
  paymentOptionSelected: {
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentIcon: {
    fontSize: 24,
  },
  paymentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  paymentDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
  },
  footer: {
    padding: 16,
    marginTop: 'auto',
  },
  payButton: {
    backgroundColor: '#22C55E',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secureText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 12,
  },
});
