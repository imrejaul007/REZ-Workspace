import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useGo } from '@/components/go/GoContext';
import { SavingsMeter } from '@/components/go/SavingsMeter';

export default function GoHomeScreen() {
  const router = useRouter();
  const { activeSession, cartSummary, currentStore } = useGo();

  // If there's an active session, show the cart summary
  if (activeSession) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.activeSessionContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>REZ Go</Text>
            <Text style={styles.headerSubtitle}>Smart Shopping</Text>
          </View>

          {/* Store Info */}
          <View style={styles.storeCard}>
            <Text style={styles.storeName}>{currentStore?.name || activeSession.storeName}</Text>
            <Text style={styles.storeStatus}>Shopping in progress</Text>
          </View>

          {/* Savings Meter - The Killer Feature */}
          {cartSummary && cartSummary.totalSaved > 0 && (
            <SavingsMeter
              saved={cartSummary.totalSaved}
              cashback={cartSummary.cashbackEarned}
              compact={false}
            />
          )}

          {/* Cart Summary */}
          <View style={styles.cartSummaryCard}>
            <Text style={styles.summaryTitle}>Your Cart</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Items</Text>
              <Text style={styles.summaryValue}>{cartSummary?.itemCount || 0}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₹{cartSummary?.subtotal?.toFixed(2) || '0.00'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax (18% GST)</Text>
              <Text style={styles.summaryValue}>₹{cartSummary?.tax?.toFixed(2) || '0.00'}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{cartSummary?.total?.toFixed(2) || '0.00'}</Text>
            </View>
            {cartSummary && cartSummary.cashbackEarned > 0 && (
              <View style={styles.cashbackRow}>
                <Text style={styles.cashbackLabel}>+ Cashback Earned</Text>
                <Text style={styles.cashbackValue}>₹{cartSummary.cashbackEarned.toFixed(2)}</Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => router.push('/go/scan')}
            >
              <Text style={styles.scanButtonText}>+ Scan More</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cartButton}
              onPress={() => router.push('/go/cart')}
            >
              <Text style={styles.cartButtonText}>View Cart</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={() => router.push('/go/checkout')}
          >
            <Text style={styles.checkoutButtonText}>
              Pay ₹{cartSummary?.total?.toFixed(2) || '0.00'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // No active session - show empty state with how it works
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.emptyContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>REZ Go</Text>
          <Text style={styles.headerSubtitle}>Smart Savings + Fast Checkout</Text>
        </View>

        {/* Hero Illustration */}
        <View style={styles.heroCard}>
          <Text style={styles.heroEmoji}>🛒</Text>
          <Text style={styles.heroTitle}>Skip the Queue</Text>
          <Text style={styles.heroDescription}>
            Scan products as you shop, pay instantly, and collect cashback on everything.
          </Text>
        </View>

        {/* How it Works */}
        <View style={styles.howItWorks}>
          <Text style={styles.sectionTitle}>How It Works</Text>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Scan Store QR</Text>
              <Text style={styles.stepDescription}>
                Open scanner, point at store QR to start shopping
              </Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Scan Products</Text>
              <Text style={styles.stepDescription}>
                Barcode scan each item - prices update instantly
              </Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Pay & Go</Text>
              <Text style={styles.stepDescription}>
                UPI or wallet pay, collect cashback, show exit QR
              </Text>
            </View>
          </View>
        </View>

        {/* Benefits */}
        <View style={styles.benefits}>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>💰</Text>
            <Text style={styles.benefitText}>Earn Cashback</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>⚡</Text>
            <Text style={styles.benefitText}>Skip Queue</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>📱</Text>
            <Text style={styles.benefitText}>Digital Receipt</Text>
          </View>
        </View>

        {/* CTA */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Ready to start smart shopping?</Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => router.push('/scan')}
          >
            <Text style={styles.startButtonText}>Scan to Start</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#22C55E',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 4,
  },
  activeSessionContainer: {
    padding: 16,
  },
  storeCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginTop: -20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  storeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  storeStatus: {
    fontSize: 14,
    color: '#22C55E',
    marginTop: 4,
  },
  cartSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1F2937',
  },
  totalRow: {
    borderBottomWidth: 0,
    marginTop: 8,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  cashbackLabel: {
    fontSize: 14,
    color: '#92400E',
  },
  cashbackValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  scanButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  cartButton: {
    flex: 1,
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cartButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
  },
  checkoutButton: {
    backgroundColor: '#22C55E',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkoutButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyContainer: {
    padding: 16,
  },
  heroCard: {
    backgroundColor: '#22C55E',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginTop: 16,
  },
  heroEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  heroDescription: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
  },
  howItWorks: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  stepDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  benefits: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    paddingVertical: 16,
  },
  benefitItem: {
    alignItems: 'center',
  },
  benefitIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#6B7280',
  },
  ctaSection: {
    marginTop: 32,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  startButton: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
