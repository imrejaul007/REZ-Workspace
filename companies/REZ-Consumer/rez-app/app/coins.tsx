// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { withErrorBoundary } from '@/utils/withErrorBoundary';
import priveApi from '@/services/priveApi';
import walletApi, { TransactionResponse } from '@/services/walletApi';
import { useRezBalance } from '@/stores/selectors';

// Default coin-to-rupee display rate — overridden by backend config on mount
const DEFAULT_COIN_CONVERSION_RATE = 0.5;

interface CoinTransaction {
  id: string;
  type: 'earn' | 'spend' | 'expire';
  description: string;
  amount: number;
  date: string;
  source?: string;
}

function mapApiTransaction(t: TransactionResponse): CoinTransaction {
  return {
    id: t.id || t.transactionId,
    type: t.type === 'credit' ? 'earn' : 'spend',
    description: t.description || t.source?.description || 'Transaction',
    amount: t.type === 'credit' ? Math.abs(t.amount) : -Math.abs(t.amount),
    date: formatRelativeDate(t.createdAt),
    source: t.source?.type,
  };
}

function formatRelativeDate(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? 'Just now' : `${mins} minutes ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return days === 1 ? 'Yesterday' : `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function CoinsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'earn' | 'spend'>('all');
  const [coinConversionRate, setCoinConversionRate] = useState(DEFAULT_COIN_CONVERSION_RATE);
  const [expiringCoins, setExpiringCoins] = useState(0);
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [transactionsError, setTransactionsError] = useState(false);

  // Use live balance from wallet store instead of hardcoded value
  const coinBalance = useRezBalance() ?? 0;

  const fetchTransactions = useCallback(async () => {
    setTransactionsLoading(true);
    setTransactionsError(false);
    try {
      const res = await walletApi.getTransactions({ limit: 50 });
      if (res.success && res.data?.transactions) {
        setTransactions(res.data.transactions.map(mapApiTransaction));
      } else {
        setTransactionsError(true);
      }
    } catch {
      setTransactionsError(true);
    } finally {
      setTransactionsLoading(false);
    }
  }, []);

  // Fetch the live conversion rate from backend redemption config
  useEffect(() => {
    priveApi
      .getRedeemConfig()
      .then((res) => {
        if (res.success && res.data?.conversionRates?.coins_to_inr) {
          setCoinConversionRate(res.data.conversionRates.coins_to_inr);
        } else if (res.success && res.data?.conversionRates?.bill_pay) {
          setCoinConversionRate(res.data.conversionRates.bill_pay);
        }
      })
      .catch(() => {});

    // Fetch expiring coins total
    walletApi
      .getExpiringCoins()
      .then((res) => {
        if (res.success && res.data) {
          const total = typeof res.data.totalExpiring === 'number' ? res.data.totalExpiring : 0;
          setExpiringCoins(total);
        }
      })
      .catch(() => {});

    fetchTransactions();
  }, [fetchTransactions]);

  const filteredTransactions = activeTab === 'all' ? transactions : transactions.filter((t) => t.type === activeTab);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earn':
        return 'arrow-down-circle';
      case 'spend':
        return 'arrow-up-circle';
      case 'expire':
        return 'alert-circle';
      default:
        return 'help-circle';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'earn':
        return '#10b981';
      case 'spend':
        return '#ef4444';
      case 'expire':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const renderTransaction = ({ item }: { item: CoinTransaction }) => (
    <View style={styles.transactionItem}>
      <View style={[styles.transactionIcon, { backgroundColor: `${getTransactionColor(item.type)}15` }]}>
        <Ionicons name={getTransactionIcon(item.type)} size={20} color={getTransactionColor(item.type)} />
      </View>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionDesc}>{item.description}</Text>
        <Text style={styles.transactionDate}>{item.date}</Text>
      </View>
      <View style={styles.transactionAmountWrap}>
        <Text style={[styles.transactionAmount, { color: getTransactionColor(item.type) }]}>
          {item.amount > 0 ? '+' : ''}
          {item.amount}
        </Text>
        <Text style={styles.transactionRupee}>≈ ₹{Math.floor(Math.abs(item.amount) * coinConversionRate)}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>REZ Coins</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Coin Balance Card */}
        <LinearGradient
          colors={['#1a3a52', '#FFC857']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <View style={styles.coinIconBg}>
            <Ionicons name="sparkles" size={32} color="#fff" />
          </View>
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>Your Coin Balance</Text>
            <Text style={styles.balanceAmount}>{coinBalance}</Text>
            <Text style={styles.balanceSubtext}>≈ ₹{Math.floor(coinBalance * coinConversionRate)}</Text>
          </View>
        </LinearGradient>

        {/* Expiring Coins Alert */}
        {expiringCoins > 0 && (
          <TouchableOpacity style={styles.expiringCard}>
            <Ionicons name="warning" size={24} color="#f59e0b" />
            <View style={styles.expiringInfo}>
              <Text style={styles.expiringLabel}>{expiringCoins} coins expiring soon</Text>
              <Text style={styles.expiringSubtext}>Use before 30 days</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>
        )}

        {/* Ways to Earn */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ways to Earn Coins</Text>
          <View style={styles.waysGrid}>
            <TouchableOpacity style={styles.wayCard}>
              <View style={[styles.wayIcon, { backgroundColor: '#fef2f2' }]}>
                <Ionicons name="bag" size={24} color="#dc2626" />
              </View>
              <Text style={styles.wayLabel}>Shopping</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.wayCard}>
              <View style={[styles.wayIcon, { backgroundColor: '#ecfdf5' }]}>
                <Ionicons name="document" size={24} color="#059669" />
              </View>
              <Text style={styles.wayLabel}>Bill Payment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.wayCard}>
              <View style={[styles.wayIcon, { backgroundColor: '#eff6ff' }]}>
                <Ionicons name="people" size={24} color="#0284c7" />
              </View>
              <Text style={styles.wayLabel}>Referral</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.wayCard}>
              <View style={[styles.wayIcon, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="flame" size={24} color="#d97706" />
              </View>
              <Text style={styles.wayLabel}>Challenges</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Transaction Tabs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          <View style={styles.tabBar}>
            {(['all', 'earn', 'spend'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab ? styles.activeTab : null]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab ? styles.activeTabText : null]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Transactions List */}
        {transactionsLoading ? (
          <View style={styles.centeredState}>
            <ActivityIndicator size="small" color="#1a3a52" />
            <Text style={styles.centeredStateText}>Loading transactions…</Text>
          </View>
        ) : transactionsError ? (
          <TouchableOpacity style={styles.centeredState} onPress={fetchTransactions}>
            <Ionicons name="refresh" size={24} color="#6b7280" />
            <Text style={styles.centeredStateText}>Couldn't load transactions. Tap to retry.</Text>
          </TouchableOpacity>
        ) : filteredTransactions.length === 0 ? (
          <View style={styles.centeredState}>
            <Ionicons name="receipt-outline" size={40} color="#d1d5db" />
            <Text style={styles.centeredStateText}>No transactions yet</Text>
          </View>
        ) : (
          <FlashList
            scrollEnabled={false}
            data={filteredTransactions}
            keyExtractor={(item) => item.id}
            renderItem={renderTransaction}
            contentContainerStyle={styles.transactionsList}
            estimatedItemSize={60}
          />
        )}

        {/* Learn More Button */}
        <TouchableOpacity style={styles.learnBtn} onPress={() => router.push('/coin-system' as unknown as string)}>
          <Ionicons name="book" size={20} color="#1a3a52" />
          <Text style={styles.learnBtnText}>Learn More About Coins</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Sticky conversion rate footer */}
      <View style={styles.conversionFooter}>
        <Ionicons name="information-circle-outline" size={14} color="#6b7280" />
        <Text style={styles.conversionFooterText}>1 coin = ₹{coinConversionRate} — redeemable at checkout</Text>
      </View>
    </SafeAreaView>
  );
}

export default withErrorBoundary(CoinsScreen, 'Coins');

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backBtn: { marginRight: 12 },
  title: { fontSize: 18, fontWeight: '600', color: '#1a1a1a' },
  content: { padding: 16, gap: 16 },
  balanceCard: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    overflow: 'hidden',
  },
  coinIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceInfo: { flex: 1 },
  balanceLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  balanceAmount: { fontSize: 32, fontWeight: '700', color: '#fff', marginVertical: 4 },
  balanceSubtext: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  expiringCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  expiringInfo: { flex: 1 },
  expiringLabel: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  expiringSubtext: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  waysGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  wayCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  wayIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  wayLabel: { fontSize: 12, fontWeight: '500', color: '#1a1a1a', textAlign: 'center' },
  tabBar: { flexDirection: 'row', gap: 12, backgroundColor: '#f3f4f6', padding: 4, borderRadius: 8 },
  tab: { flex: 1, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6, alignItems: 'center' },
  activeTab: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#6b7280' },
  activeTabText: { color: '#1a1a1a' },
  transactionsList: { gap: 12 },
  transactionItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  transactionIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  transactionInfo: { flex: 1 },
  transactionDesc: { fontSize: 14, fontWeight: '500', color: '#1a1a1a' },
  transactionDate: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  transactionAmountWrap: { alignItems: 'flex-end' },
  transactionAmount: { fontSize: 14, fontWeight: '600' },
  transactionRupee: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  centeredState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  centeredStateText: { fontSize: 13, color: '#6b7280', textAlign: 'center' },
  learnBtn: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 20,
  },
  learnBtnText: { fontSize: 14, fontWeight: '600', color: '#1a3a52' },
  conversionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  conversionFooterText: { fontSize: 12, color: '#6b7280' },
});
