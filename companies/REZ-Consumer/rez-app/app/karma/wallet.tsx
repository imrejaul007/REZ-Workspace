/**
 * Karma Wallet Screen
 * Shows karma points and ReZ coins balance, transactions, and earn-more CTA.
 */

import { withErrorBoundary } from '@/utils/withErrorBoundary';
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { KarmaHeader } from './_layout';
import karmaService, { WalletBalance, Transaction } from '@/services/karmaService';
import { useIsAuthenticated } from '@/stores/selectors';
import { useIsMounted } from '@/hooks/useIsMounted';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';

const KARMA_PURPLE = '#8B5CF6';
const KARMA_GRADIENT = ['#7C3AED', '#8B5CF6', '#A78BFA'];

type TxType = 'earned' | 'converted' | 'spent' | 'bonus';
type KarmaCoinFilter = 'karma_points' | 'rez_coins' | 'branded_coin' | 'all';

const TX_CONFIG: Record<TxType, { icon: string; color: string; label: string }> = {
  earned: { icon: 'leaf', color: '#22C55E', label: 'Earned' },
  converted: { icon: 'swap-horizontal', color: '#3B82F6', label: 'Converted' },
  spent: { icon: 'arrow-down', color: '#EF4444', label: 'Spent' },
  bonus: { icon: 'gift', color: '#F59E0B', label: 'Bonus' },
};

const COIN_TYPE_CONFIG: Record<KarmaCoinFilter, { label: string; icon: string; color: string }> = {
  karma_points: { label: 'Karma Points', icon: 'leaf', color: KARMA_PURPLE },
  rez_coins: { label: 'ReZ Coins', icon: 'wallet', color: '#F59E0B' },
  branded_coin: { label: 'Branded Coins', icon: 'storefront', color: '#6366F1' },
  all: { label: 'All', icon: 'apps', color: '#6B7280' },
};

function TransactionItem({ tx }: { tx: Transaction }) {
  const txCfg = TX_CONFIG[tx.type] ?? TX_CONFIG.earned;
  const coinCfg = COIN_TYPE_CONFIG[tx.coinType as KarmaCoinFilter] ?? COIN_TYPE_CONFIG.rez_coins;

  return (
    <View style={txStyles.item}>
      <View style={txStyles.left}>
        <View style={[txStyles.iconWrap, { backgroundColor: txCfg.color + '20' }]}>
          <Ionicons name={txCfg.icon as unknown as keyof typeof Ionicons.glyphMap} size={18} color={txCfg.color} />
        </View>
        <View style={txStyles.info}>
          <Text style={txStyles.desc} numberOfLines={1}>
            {tx.description}
          </Text>
          <Text style={txStyles.date}>
            {new Date(tx.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
        </View>
      </View>
      <View style={txStyles.right}>
        <Text style={[txStyles.amount, { color: tx.type === 'spent' ? Colors.error : '#22C55E' }]}>
          {tx.type === 'spent' ? '-' : '+'}
          {tx.amount}
        </Text>
        <View style={[txStyles.coinBadge, { backgroundColor: coinCfg.color + '15' }]}>
          <Ionicons name={coinCfg.icon as unknown as keyof typeof Ionicons.glyphMap} size={10} color={coinCfg.color} />
        </View>
      </View>
    </View>
  );
}

const txStyles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1 },
  desc: { fontSize: Typography.body.fontSize, fontWeight: '600', color: colors.deepNavy },
  date: { fontSize: Typography.caption.fontSize, color: Colors.textSecondary, marginTop: 2 },
  right: { alignItems: 'flex-end' },
  amount: { fontSize: Typography.body.fontSize, fontWeight: '800' },
  coinBadge: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
});

function KarmaWalletScreen() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const isMounted = useIsMounted();
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedCoin, setSelectedCoin] = useState<KarmaCoinFilter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }
      if (!isRefresh) setLoading(true);
      try {
        const [balRes, txRes] = await Promise.all([
          karmaService.getWalletBalance('all'),
          karmaService.getTransactions(selectedCoin as 'karma_points' | 'rez_coins' | 'all', 1),
        ]);
        if (!isMounted()) return;
        if (balRes.success && balRes.data) setBalance(balRes.data);
        if (txRes.success && txRes.data) setTransactions(txRes.data.transactions ?? []);
      } catch {
        // non-fatal
      } finally {
        if (!isMounted()) return;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isAuthenticated, selectedCoin, isMounted],
  );

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <KarmaHeader title="Wallet" showBack />
        <View style={styles.authRequired}>
          <Ionicons name="lock-closed-outline" size={64} color={Colors.textSecondary} />
          <Text style={styles.authTitle}>Login Required</Text>
          <Text style={styles.authSubtitle}>Sign in to view your wallet</Text>
          <Pressable style={styles.loginBtn} onPress={() => router.push('/sign-in' as unknown as string)}>
            <Text style={styles.loginBtnText}>Sign In</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <KarmaHeader title="Wallet" showBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={KARMA_PURPLE} />
        </View>
      </View>
    );
  }

  const karmaPoints = balance?.karmaPoints ?? 0;
  const rezCoins = balance?.rezCoins ?? 0;

  return (
    <View style={styles.container}>
      <KarmaHeader
        title="Wallet"
        showBack
        rightAction={
          <Pressable style={styles.headerAction} onPress={() => router.push('/karma/my-karma')} hitSlop={8}>
            <Ionicons name="leaf" size={20} color={colors.text.inverse} />
          </Pressable>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[KARMA_PURPLE]}
            tintColor={KARMA_PURPLE}
          />
        }
      >
        {/* Balance Cards */}
        <View style={styles.balanceCards}>
          {/* Karma Points Card */}
          <LinearGradient colors={['#7C3AED', '#8B5CF6']} style={styles.balanceCard}>
            <View style={styles.balanceCardHeader}>
              <View style={styles.balanceIconWrap}>
                <Ionicons name="leaf" size={20} color={colors.text.inverse} />
              </View>
              <Text style={styles.balanceLabel}>Karma Points</Text>
            </View>
            <Text style={styles.balanceNumber}>{karmaPoints.toLocaleString()}</Text>
            <Text style={styles.balanceSub}>Identity layer — grows with every event</Text>
            <View style={styles.balanceCardFooter}>
              <View style={styles.balanceTag}>
                <Ionicons name="time" size={12} color="rgba(255,255,255,0.8)" />
                <Text style={styles.balanceTagText}>Rolling 30-45 days</Text>
              </View>
            </View>
          </LinearGradient>

          {/* ReZ Coins Card */}
          <View style={styles.rezCoinCard}>
            <View style={styles.balanceCardHeader}>
              <View style={[styles.balanceIconWrap, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="wallet" size={20} color="#D97706" />
              </View>
              <Text style={[styles.balanceLabel, { color: colors.deepNavy }]}>ReZ Coins</Text>
            </View>
            <Text style={[styles.balanceNumber, { color: colors.deepNavy }]}>{rezCoins.toLocaleString()}</Text>
            <Text style={[styles.balanceSub, { color: Colors.textSecondary }]}>
              Universal currency — spend anywhere
            </Text>
            <View style={styles.balanceCardFooter}>
              <View style={[styles.balanceTag, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="swap-horizontal" size={12} color="#D97706" />
                <Text style={[styles.balanceTagText, { color: '#92400E' }]}>Convert from karma</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Conversion Info */}
        <View style={styles.conversionSection}>
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.06)', 'rgba(139, 92, 246, 0.02)']}
            style={styles.conversionCard}
          >
            <View style={styles.conversionHeader}>
              <Ionicons name="swap-horizontal" size={20} color={KARMA_PURPLE} />
              <Text style={styles.conversionTitle}>How Conversion Works</Text>
            </View>
            <Text style={styles.conversionDesc}>
              Your Karma Points auto-convert to ReZ Coins weekly based on your level. Higher levels = higher conversion
              rate.
            </Text>
            <View style={styles.conversionRates}>
              {[
                { level: 'L1', rate: '25%', karma: '0-500' },
                { level: 'L2', rate: '50%', karma: '500-2000' },
                { level: 'L3', rate: '75%', karma: '2000-5000' },
                { level: 'L4', rate: '100%', karma: '5000+' },
              ].map((item) => (
                <View key={item.level} style={styles.conversionRateItem}>
                  <Text style={styles.conversionLevel}>{item.level}</Text>
                  <Text style={styles.conversionRate}>{item.rate}</Text>
                  <Text style={styles.conversionKarma}>{item.karma}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </View>

        {/* Coin Type Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Transactions</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {(Object.entries(COIN_TYPE_CONFIG) as [KarmaCoinFilter, (typeof COIN_TYPE_CONFIG)['all']][]).map(
              ([key, cfg]) => (
                <Pressable
                  key={key}
                  style={[
                    styles.filterChip,
                    selectedCoin === key && { backgroundColor: cfg.color, borderColor: cfg.color },
                  ]}
                  onPress={() => setSelectedCoin(key as KarmaCoinFilter)}
                >
                  <Ionicons
                    name={cfg.icon as unknown as keyof typeof Ionicons.glyphMap}
                    size={14}
                    color={selectedCoin === key ? colors.text.inverse : Colors.textSecondary}
                  />
                  <Text style={[styles.filterChipText, selectedCoin === key && { color: colors.text.inverse }]}>
                    {cfg.label}
                  </Text>
                </Pressable>
              ),
            )}
          </ScrollView>
        </View>

        {/* Transaction List */}
        <View style={styles.txSection}>
          {transactions.length === 0 ? (
            <View style={styles.emptyTx}>
              <Ionicons name="receipt-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyTxTitle}>No transactions yet</Text>
              <Text style={styles.emptyTxSub}>Start earning karma to see your activity here</Text>
              <Pressable style={styles.exploreBtn} onPress={() => router.push('/karma/explore')}>
                <Text style={styles.exploreBtnText}>Find Events</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.txList}>
              {transactions.map((tx) => (
                <TransactionItem key={tx._id} tx={tx} />
              ))}
            </View>
          )}
        </View>

        {/* Earn More CTA */}
        <View style={styles.earnMoreSection}>
          <LinearGradient colors={['rgba(255,205,87,0.08)', 'rgba(255,205,87,0.03)']} style={styles.earnMoreCard}>
            <View style={styles.earnMoreContent}>
              <Ionicons name="leaf" size={32} color="#22C55E" />
              <View style={{ flex: 1 }}>
                <Text style={styles.earnMoreTitle}>Earn More Karma</Text>
                <Text style={styles.earnMoreDesc}>Join events, complete activities, and build your impact</Text>
              </View>
            </View>
            <View style={styles.earnMoreActions}>
              <Pressable style={styles.earnMoreBtn} onPress={() => router.push('/karma/explore')}>
                <Text style={styles.earnMoreBtnText}>Explore Events</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.text.inverse} />
              </Pressable>
              <Pressable style={styles.scanBtn} onPress={() => router.push('/karma/scan')}>
                <Ionicons name="qr-code-outline" size={18} color={KARMA_PURPLE} />
              </Pressable>
            </View>
          </LinearGradient>
        </View>

        {/* Phase 2: Branded Coins teaser */}
        <View style={styles.brandedSection}>
          <View style={styles.brandedCard}>
            <View style={styles.brandedHeader}>
              <Ionicons name="sparkles" size={20} color={KARMA_PURPLE} />
              <Text style={styles.brandedTitle}>Branded Coins (Coming Soon)</Text>
            </View>
            <Text style={styles.brandedDesc}>
              Earn special coins from partner brands when you participate in their events. Redeem at partner stores.
            </Text>
            <View style={styles.brandedBrands}>
              {['Partner A', 'Partner B', 'Partner C'].map((brand, idx) => (
                <View
                  key={brand}
                  style={[styles.brandedChip, idx === 0 && { backgroundColor: '#DCFCE7', borderColor: '#22C55E' }]}
                >
                  <Text style={[styles.brandedChipText, idx === 0 && { color: '#22C55E' }]}>{brand}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.secondary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  authRequired: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing['2xl'] },
  authTitle: {
    fontSize: Typography.h3.fontSize,
    fontWeight: '700',
    color: colors.deepNavy,
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
  },
  authSubtitle: {
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  loginBtn: {
    backgroundColor: KARMA_PURPLE,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
  },
  loginBtnText: { fontSize: Typography.body.fontSize, fontWeight: '600', color: colors.text.inverse },
  scrollView: { flex: 1 },
  headerAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Balance Cards
  balanceCards: { padding: Spacing.base, gap: Spacing.md },
  balanceCard: { padding: Spacing.lg, borderRadius: BorderRadius.xl, marginBottom: 0 },
  rezCoinCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    backgroundColor: colors.text.inverse,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  balanceCardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  balanceIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceLabel: { fontSize: Typography.body.fontSize, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  balanceNumber: { fontSize: 36, fontWeight: '800', color: colors.text.inverse, marginBottom: 4 },
  balanceSub: { fontSize: Typography.caption.fontSize, color: 'rgba(255,255,255,0.7)', marginBottom: Spacing.md },
  balanceCardFooter: { flexDirection: 'row' },
  balanceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  balanceTagText: { fontSize: Typography.caption.fontSize, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },

  // Conversion
  conversionSection: { paddingHorizontal: Spacing.base, marginBottom: Spacing.lg },
  conversionCard: {
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.15)',
  },
  conversionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  conversionTitle: { fontSize: Typography.body.fontSize, fontWeight: '700', color: colors.deepNavy },
  conversionDesc: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  conversionRates: { flexDirection: 'row', justifyContent: 'space-between' },
  conversionRateItem: { alignItems: 'center' },
  conversionLevel: { fontSize: Typography.bodySmall.fontSize, fontWeight: '700', color: colors.deepNavy },
  conversionRate: { fontSize: Typography.body.fontSize, fontWeight: '800', color: KARMA_PURPLE, marginVertical: 2 },
  conversionKarma: { fontSize: Typography.caption.fontSize, color: Colors.textSecondary },

  // Filter
  filterSection: { paddingHorizontal: Spacing.base, marginBottom: Spacing.md },
  sectionTitle: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.deepNavy,
    marginBottom: Spacing.md,
  },
  filterScroll: { gap: Spacing.sm },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.text.inverse,
    borderWidth: 1,
    borderColor: colors.border.default,
    gap: 6,
    marginRight: Spacing.sm,
  },
  filterChipText: { fontSize: Typography.bodySmall.fontSize, fontWeight: '500', color: Colors.textSecondary },

  // Transactions
  txSection: { paddingHorizontal: Spacing.base, marginBottom: Spacing.lg },
  emptyTx: {
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: colors.text.inverse,
    borderRadius: BorderRadius.lg,
  },
  emptyTxTitle: {
    fontSize: Typography.body.fontSize,
    fontWeight: '700',
    color: colors.deepNavy,
    marginTop: Spacing.base,
  },
  emptyTxSub: {
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.lg,
  },
  exploreBtn: {
    backgroundColor: KARMA_PURPLE,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
  },
  exploreBtnText: { fontSize: Typography.body.fontSize, fontWeight: '600', color: colors.text.inverse },
  txList: {
    backgroundColor: colors.text.inverse,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.base,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border.default,
  },

  // Earn More
  earnMoreSection: { paddingHorizontal: Spacing.base, marginBottom: Spacing.lg },
  earnMoreCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,205,87,0.2)',
  },
  earnMoreContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  earnMoreTitle: { fontSize: Typography.body.fontSize, fontWeight: '700', color: colors.deepNavy },
  earnMoreDesc: { fontSize: Typography.caption.fontSize, color: Colors.textSecondary, marginTop: 2 },
  earnMoreActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  earnMoreBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22C55E',
    paddingVertical: 12,
    borderRadius: BorderRadius.xl,
    gap: 8,
  },
  earnMoreBtnText: { fontSize: Typography.body.fontSize, fontWeight: '600', color: colors.text.inverse },
  scanBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: KARMA_PURPLE,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Branded
  brandedSection: { paddingHorizontal: Spacing.base, marginBottom: Spacing.lg },
  brandedCard: {
    backgroundColor: colors.text.inverse,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  brandedHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  brandedTitle: { fontSize: Typography.body.fontSize, fontWeight: '700', color: colors.deepNavy },
  brandedDesc: {
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  brandedBrands: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  brandedChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  brandedChipText: { fontSize: Typography.caption.fontSize, fontWeight: '600', color: Colors.textSecondary },
});

export default withErrorBoundary(KarmaWalletScreen, 'KarmaWallet');
