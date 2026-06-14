import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  ScrollView,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useGo } from '@/components/go/GoContext';
import { SavingsMeter } from '@/components/go/SavingsMeter';

export default function SuccessScreen() {
  const router = useRouter();
  const { activeSession, cartSummary } = useGo();

  if (!activeSession) {
    return (
      <>
        <Stack.Screen options={{ title: 'Success' }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Session not found</Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => router.replace('/go')}
          >
            <Text style={styles.startButtonText}>Back to REZ Go</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I just saved ₹${cartSummary?.totalSaved?.toFixed(0) || 0} shopping at ${activeSession.storeName} with REZ Go! 🛒💚`,
      });
    } catch {
      // Share cancelled
    }
  };

  const handleNewSession = () => {
    router.replace('/go');
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Success', headerBackVisible: false }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Success Animation */}
        <View style={styles.successHeader}>
          <View style={styles.checkCircle}>
            <Text style={styles.checkIcon}>✓</Text>
          </View>
          <Text style={styles.successTitle}>Payment Successful!</Text>
          <Text style={styles.successSubtitle}>
            Thank you for shopping at {activeSession.storeName}
          </Text>
        </View>

        {/* Receipt */}
        <View style={styles.receiptCard}>
          <Text style={styles.receiptTitle}>Receipt</Text>

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Transaction ID</Text>
            <Text style={styles.receiptValue}>{activeSession.sessionId}</Text>
          </View>

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Store</Text>
            <Text style={styles.receiptValue}>{activeSession.storeName}</Text>
          </View>

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Items</Text>
            <Text style={styles.receiptValue}>{cartSummary?.itemCount || 0}</Text>
          </View>

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Subtotal</Text>
            <Text style={styles.receiptValue}>₹{cartSummary?.subtotal?.toFixed(2)}</Text>
          </View>

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Tax</Text>
            <Text style={styles.receiptValue}>₹{cartSummary?.tax?.toFixed(2)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.receiptRow}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalValue}>₹{cartSummary?.total?.toFixed(2)}</Text>
          </View>

          {cartSummary && cartSummary.cashbackEarned > 0 && (
            <View style={styles.cashbackBadge}>
              <Text style={styles.cashbackText}>
                + ₹{cartSummary.cashbackEarned.toFixed(2)} cashback credited!
              </Text>
            </View>
          )}
        </View>

        {/* Savings Summary */}
        {cartSummary && (
          <SavingsMeter
            saved={cartSummary.totalSaved}
            cashback={cartSummary.cashbackEarned}
            compact={false}
          />
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Text style={styles.shareIcon}>📤</Text>
            <Text style={styles.shareText}>Share Savings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.newSessionButton} onPress={handleNewSession}>
            <Text style={styles.newSessionText}>Start New Shopping</Text>
          </TouchableOpacity>
        </View>

        {/* Exit Instructions */}
        <View style={styles.exitCard}>
          <Text style={styles.exitTitle}>Before You Leave</Text>
          <Text style={styles.exitText}>
            Show this receipt or the exit QR code at the counter to complete your checkout.
          </Text>
          <View style={styles.exitQRPlaceholder}>
            <Text style={styles.exitQRText}>Exit QR</Text>
            <Text style={styles.exitQRSubtext}>Scan at exit</Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 16,
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
  successHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  checkIcon: {
    fontSize: 40,
    color: '#FFFFFF',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  successSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  receiptCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  receiptTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  receiptLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  receiptValue: {
    fontSize: 14,
    color: '#1F2937',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
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
  cashbackBadge: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  cashbackText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  actions: {
    gap: 12,
    marginBottom: 24,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  shareIcon: {
    fontSize: 20,
  },
  shareText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
  },
  newSessionButton: {
    backgroundColor: '#22C55E',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  newSessionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  exitCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  exitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  exitText: {
    fontSize: 14,
    color: '#B45309',
    textAlign: 'center',
    marginBottom: 16,
  },
  exitQRPlaceholder: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 120,
  },
  exitQRText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  exitQRSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
});
