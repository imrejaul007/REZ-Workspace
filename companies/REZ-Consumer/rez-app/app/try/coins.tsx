// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
  FlatList,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { tryApi } from '@/services/tryApi';
import { logger } from '@/utils/logger';

interface OrderResponse {
  razorpayOrderId: string;
  amount: number;
  currency: string;
}

interface CoinsBucket {
  amount: number;
  expiresAt: string;
  source: 'subscription' | 'pack' | 'earned';
  daysUntilExpiry: number;
}

interface Transaction {
  id: string;
  type: 'earn' | 'spend' | 'expire';
  amount: number;
  description: string;
  date: string;
}

interface CoinPack {
  index: number;
  price: number;
  coins: number;
  savings?: number;
}

const COIN_PACKS: CoinPack[] = [
  { index: 0, price: 49, coins: 60 },
  { index: 1, price: 99, coins: 140, savings: 10 },
  { index: 2, price: 199, coins: 320, savings: 20 },
  { index: 3, price: 399, coins: 700, savings: 30 },
];

export default function TrialCoinsScreen() {
  const router = useRouter();
  const [coinBalance, setCoinBalance] = useState(0);
  const [buckets, setBuckets] = useState<CoinsBucket[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchaseModal, setPurchaseModal] = useState<{
    visible: boolean;
    pack?: CoinPack;
    loading?: boolean;
  }>({ visible: false });

  useEffect(() => {
    const loadCoinsData = async () => {
      try {
        const coinsData = await tryApi.getCoins();
        setCoinBalance(coinsData.totalBalance);

        // Calculate days until expiry and sort buckets
        if (coinsData.buckets && Array.isArray(coinsData.buckets)) {
          const bucketsWithExpiry = coinsData.buckets.map((b) => ({
            ...b,
            daysUntilExpiry: Math.ceil((new Date(b.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
          }));
          setBuckets(bucketsWithExpiry.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry));
        }

        if (coinsData.recentTransactions && Array.isArray(coinsData.recentTransactions)) {
          setTransactions(coinsData.recentTransactions);
        }
      } catch (err) {
        if (__DEV__) logger.error('Failed to load coins data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCoinsData();
  }, []);

  const handlePurchasePack = async (pack: CoinPack) => {
    setPurchaseModal({ visible: true, pack, loading: true });

    try {
      // Create Razorpay order
      const orderResp = await tryApi.createPaymentOrder({
        packIndex: pack.index,
        amount: pack.price,
      });
      const order: OrderResponse = orderResp as OrderResponse;

      // Open Razorpay checkout
      try {
        const RazorpayCheckout = require('react-native-razorpay').default;
        const paymentResponse = await RazorpayCheckout.open({
          description: `REZ TRY Coins — ${pack.coins} coins`,
          currency: 'INR',
          key: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '',
          amount: order.amount || pack.price * 100,
          order_id: order.razorpayOrderId,
          name: 'REZ TRY Coins',
          prefill: { name: '', contact: '' },
          theme: { color: colors.brand.purple },
        });

        // Complete coin purchase with payment ID
        await tryApi.purchaseCoins(pack.index, paymentResponse.razorpay_payment_id);
        setCoinBalance((prev) => prev + pack.coins);

        setTimeout(() => {
          setPurchaseModal({ visible: false });
        }, 1500);
      } catch (paymentErr) {
        if (paymentErr.code !== 2) {
          // 2 = user cancelled
          if (__DEV__) logger.error('Payment error:', paymentErr);
        }
        setPurchaseModal((prev) => ({ ...prev, loading: false }));
      }
    } catch (err) {
      if (__DEV__) logger.error('Failed to purchase coins:', err);
      setPurchaseModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const getEffectiveRate = (pack: CoinPack): number => {
    return Math.round((pack.price / pack.coins) * 100) / 100;
  };

  const renderBucketItem = ({ item, index }: { item: CoinsBucket; index: number }) => {
    const isExpiringSoon = item.daysUntilExpiry < 7;

    return (
      <View style={[styles.bucketItem, isExpiringSoon ? styles.bucketItemExpiring : null]}>
        <View style={styles.bucketHeader}>
          <Text style={styles.bucketAmount}>{item.amount} 🪙</Text>
          {isExpiringSoon && (
            <View style={styles.expiryWarningBadge}>
              <Ionicons name="alert-circle" size={12} color="#fff" />
              <Text style={styles.expiryWarningText}>{item.daysUntilExpiry} days</Text>
            </View>
          )}
        </View>
        <View style={styles.bucketMeta}>
          <Ionicons
            name={item.source === 'subscription' ? 'layers' : item.source === 'pack' ? 'gift' : 'star'}
            size={14}
            color={colors.text.secondary}
          />
          <Text style={styles.bucketSource}>
            {item.source === 'subscription' ? 'Subscription' : item.source === 'pack' ? 'Purchased' : 'Earned'}
          </Text>
          <Text style={styles.bucketDate}>Expires {new Date(item.expiresAt).toLocaleDateString()}</Text>
        </View>
      </View>
    );
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const isIncome = item.type === 'earn';
    const icon: string =
      item.type === 'earn' ? 'arrow-down-circle' : item.type === 'spend' ? 'arrow-up-circle' : 'alert-circle';
    const color = isIncome ? colors.successScale[500] : colors.error;

    return (
      <View style={styles.transactionItem}>
        <View style={[styles.transactionIcon, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionDesc}>{item.description}</Text>
          <Text style={styles.transactionDate}>{item.date}</Text>
        </View>
        <Text style={[styles.transactionAmount, { color }]}>
          {isIncome ? '+' : ''}
          {item.amount}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.purple} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Trial Coins</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Balance Card */}
        <LinearGradient
          colors={['#1a3a52', '#FFC857']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <View style={styles.balanceContent}>
            <View>
              <Text style={styles.balanceLabel}>Your Balance</Text>
              <Text style={styles.balanceAmount}>{coinBalance}</Text>
              <Text style={styles.balanceSubtext}>🪙 Trial Coins</Text>
            </View>
            <Ionicons name="sparkles" size={48} color="rgba(255, 255, 255, 0.3)" />
          </View>
        </LinearGradient>

        {/* Expiry Buckets */}
        {buckets.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Coin Buckets</Text>
            <FlatList
              scrollEnabled={false}
              data={buckets}
              renderItem={renderBucketItem}
              keyExtractor={(_, idx) => `bucket-${idx}`}
              contentContainerStyle={styles.bucketsList}
            />
          </View>
        )}

        {/* Buy More Coins */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Buy More Coins</Text>
          <View style={styles.packsGrid}>
            {COIN_PACKS.map((pack) => (
              <Pressable key={pack.index} style={styles.packCard} onPress={() => handlePurchasePack(pack)}>
                {pack.savings && (
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsText}>Save {pack.savings}%</Text>
                  </View>
                )}
                <Text style={styles.packPrice}>₹{pack.price}</Text>
                <View style={styles.packCoinsBox}>
                  <Text style={styles.packCoins}>{pack.coins}</Text>
                  <Text style={styles.packCoinsLabel}>🪙</Text>
                </View>
                <Text style={styles.packRate}>₹{getEffectiveRate(pack)}/coin</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Transactions */}
        {transactions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <FlatList
              scrollEnabled={false}
              data={transactions.slice(0, 10)}
              renderItem={renderTransactionItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.transactionsList}
            />
          </View>
        )}

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={colors.brand.purple} />
          <Text style={styles.infoText}>
            Trial coins expire after a certain period. Use them before they expire or purchase new ones.
          </Text>
        </View>
      </ScrollView>

      {/* Purchase Confirmation Modal */}
      <Modal visible={purchaseModal.visible && !!purchaseModal.pack} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {purchaseModal.loading ? (
              <>
                <ActivityIndicator size="large" color={colors.brand.purple} />
                <Text style={styles.modalLoadingText}>Processing your payment...</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={48} color={colors.successScale[500]} />
                <Text style={styles.modalTitle}>Purchase Successful! 🎉</Text>
                <Text style={styles.modalText}>You've added {purchaseModal.pack?.coins} coins to your account</Text>

                <Pressable style={styles.modalButton} onPress={() => setPurchaseModal({ visible: false })}>
                  <Text style={styles.modalButtonText}>Continue</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  balanceCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  balanceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: '700',
    color: '#fff',
    marginTop: 4,
  },
  balanceSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  bucketsList: {
    gap: spacing.md,
  },
  bucketItem: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    gap: spacing.sm,
  },
  bucketItemExpiring: {
    backgroundColor: colors.warningScale[50],
    borderColor: colors.warningScale[200],
  },
  bucketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bucketAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  expiryWarningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.warningScale[500],
    borderRadius: borderRadius.sm,
  },
  expiryWarningText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  bucketMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bucketSource: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  bucketDate: {
    fontSize: 11,
    color: colors.text.tertiary,
    marginLeft: 'auto',
  },
  packsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  packCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    gap: spacing.sm,
  },
  savingsBadge: {
    position: 'absolute',
    top: -8,
    backgroundColor: colors.successScale[500],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  savingsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  packPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.sm,
  },
  packCoinsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  packCoins: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.brand.purple,
  },
  packCoinsLabel: {
    fontSize: 16,
  },
  packRate: {
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  transactionsList: {
    gap: spacing.md,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDesc: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.primary,
  },
  transactionDate: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 13,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.tint.purple,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.brand.purpleLight,
    marginBottom: spacing.xl,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.md,
    alignItems: 'center',
    width: '80%',
  },
  modalLoadingText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  modalButton: {
    width: '100%',
    paddingVertical: spacing.md,
    backgroundColor: colors.brand.purple,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
