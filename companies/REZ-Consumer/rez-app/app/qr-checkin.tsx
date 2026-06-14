// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
} from 'react-native';
import { showToast } from '@/components/common/ToastManager';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '@/services/apiClient';
import { logger } from '@/utils/logger';
import RatingPrompt from '@/components/store/RatingPrompt';

export default function QRCheckinScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ storeId?: string; store?: string }>();
  const [storeId, setStoreId] = useState(params.storeId || '');
  const [storeName, setStoreName] = useState(params.store ? decodeURIComponent(params.store) : '');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStore, setLoadingStore] = useState(false);
  const [result, setResult] = useState<{ coinsEarned: number; message: string } | null>(null);
  const [streakCount, setStreakCount] = useState<number | null>(null);
  const [ratingTrigger, setRatingTrigger] = useState(0);

  useEffect(() => {
    if (storeId && !storeName) {
      setLoadingStore(true);
      apiClient
        .get(`/qr-checkin/store/${storeId}`)
        .then((r) => setStoreName((r as unknown).data?.name || ''))
        .catch((err) => logger.error('QRCheckin: store lookup failed', new Error(String(err)), 'store lookup'))
        .finally(() => setLoadingStore(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const handleSubmit = async () => {
    const amt = parseFloat(amount);
    if (!storeId || isNaN(amt) || amt <= 0) {
      showToast({
        type: 'warning',
        message: 'Please enter a valid amount.',
      });
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post('/qr-checkin', { storeId, amount: amt, paymentMethod: 'cash' });
      setResult((res as unknown).data?.data);
      setRatingTrigger((t) => t + 1);
      // Refresh streak after successful check-in (non-blocking)
      import('@/services/gamificationApi')
        .then((mod) => mod.default.getStreakStatus())
        .then((streakRes) => {
          if (streakRes?.success && streakRes.data) {
            setStreakCount(streakRes.data.currentStreak || streakRes.data.savings?.currentStreak || 0);
          }
        })
        .catch((err) => logger.error('QRCheckin: streak status fetch failed', new Error(String(err)), 'streak status'));
    } catch (err) {
      const msg = err?.response?.data?.message || 'Check-in failed. Try again.';
      showToast({
        type: 'error',
        message: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <RatingPrompt storeId={storeId} storeName={storeName} triggerCount={ratingTrigger} />
        <View style={styles.successCard}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={64} color="#10B981" />
          </View>
          <Text style={styles.successTitle}>Check-in Successful!</Text>
          <Text style={styles.successStore}>{storeName}</Text>
          {result.coinsEarned > 0 && (
            <View style={styles.coinsBadge}>
              <Ionicons name="sparkles" size={20} color="#F59E0B" />
              <Text style={styles.coinsText}>+{result.coinsEarned} REZ Coins</Text>
            </View>
          )}
          {streakCount !== null && streakCount > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 Day {streakCount} Visit Streak</Text>
            </View>
          )}
          <Text style={styles.successMsg}>{result.message}</Text>
          <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1a3a52', '#2d5a7b']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Earn REZ Coins</Text>
        <View style={{ width: 38 }} />
      </LinearGradient>

      <View style={styles.body}>
        {loadingStore ? (
          <ActivityIndicator color="#7C3AED" style={{ margin: 20 }} />
        ) : storeName ? (
          <View style={styles.storeCard}>
            <Ionicons name="storefront" size={28} color="#7C3AED" />
            <View style={{ flex: 1 }}>
              <Text style={styles.storeLabel}>Checking in at</Text>
              <Text style={styles.storeName}>{storeName}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>How much did you pay?</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#D1D5DB"
              maxLength={7}
            />
          </View>
          <Text style={styles.amountHint}>Enter the total amount you paid at this store</Text>
        </View>

        <View style={styles.howItWorks}>
          <Text style={styles.howTitle}>How it works</Text>
          <View style={styles.howRow}>
            <Ionicons name="qr-code" size={16} color="#7C3AED" />
            <Text style={styles.howText}>You scanned the store's REZ QR code</Text>
          </View>
          <View style={styles.howRow}>
            <Ionicons name="cash-outline" size={16} color="#7C3AED" />
            <Text style={styles.howText}>Enter what you paid — we trust you</Text>
          </View>
          <View style={styles.howRow}>
            <Ionicons name="sparkles" size={16} color="#F59E0B" />
            <Text style={styles.howText}>REZ coins land in your wallet instantly</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, (loading || !amount) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading || !amount}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="flash" size={20} color="#fff" />
              <Text style={styles.submitText}>Earn Coins</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 40) + 10,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  body: { flex: 1, padding: 20 },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  storeLabel: { fontSize: 12, color: '#9CA3AF' },
  storeName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  amountCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  amountLabel: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 12 },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  currencySymbol: { fontSize: 36, fontWeight: '700', color: '#111827' },
  amountInput: {
    fontSize: 48,
    fontWeight: '800',
    color: '#111827',
    minWidth: 120,
    textAlign: 'left',
  },
  amountHint: { fontSize: 12, color: '#9CA3AF', marginTop: 8 },
  howItWorks: {
    backgroundColor: '#F5F3FF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    gap: 10,
  },
  howTitle: { fontSize: 13, fontWeight: '700', color: '#7C3AED', marginBottom: 4 },
  howRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  howText: { fontSize: 13, color: '#4B5563' },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    paddingVertical: 16,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  successCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  successIcon: { marginBottom: 16 },
  successTitle: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 4 },
  successStore: { fontSize: 15, color: '#6B7280', marginBottom: 16 },
  coinsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 12,
  },
  coinsText: { fontSize: 20, fontWeight: '800', color: '#F59E0B' },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 12,
  },
  streakText: { fontSize: 15, fontWeight: '700', color: '#F59E0B' },
  successMsg: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
  doneBtn: {
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingHorizontal: 40,
    paddingVertical: 14,
  },
  doneBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
