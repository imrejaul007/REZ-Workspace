import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Coins, Gift, History, ChevronRight, Sparkles, TrendingUp, Award, Star } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '@/theme/ThemeProvider';
import { useUserStore } from '@/stores';
import { rezApi, Transaction, WalletData, KarmaStatus } from '@/services/rezApi';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';

export const WalletScreen: React.FC = () => {
  const { colors, spacing, typography, borderRadius } = useTheme();
  const router = useRouter();
  const { karma, wallet, setKarma, setWallet } = useUserStore();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [walletData, karmaData] = await Promise.all([
        rezApi.getWallet(),
        rezApi.getKarmaStatus(),
      ]);
      setWallet({ coins: walletData.coins, vouchers: walletData.vouchers });
      setKarma({
        tier: karmaData.tier,
        points: karmaData.points,
        pointsToNextTier: karmaData.nextTier.pointsRequired,
        multiplier: karmaData.multiplier,
      });
    } catch (error) {
      logger.error('Wallet load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return colors.karmaBronze;
      case 'silver': return colors.karmaSilver;
      case 'gold': return colors.karmaGold;
      case 'platinum': return colors.karmaPlatinum;
      default: return colors.karmaBronze;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundGrouped }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={[styles.header, { padding: spacing.screenPadding }]}>
          <Text style={[styles.headerTitle, { color: colors.label, ...typography.displaySmall }]}>
            Wallet
          </Text>
        </View>

        {/* Balance Card */}
        <Animated.View entering={FadeInDown.delay(100)} style={{ paddingHorizontal: spacing.screenPadding }}>
          <Card variant="elevated" style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
            <View style={styles.balanceContent}>
              <View>
                <Text style={[styles.balanceLabel, { color: colors.white + '80' }]}>
                  Your Balance
                </Text>
                <View style={styles.balanceRow}>
                  <Coins size={32} color={colors.gold} />
                  <Text style={[styles.balanceAmount, { color: colors.white }]}>
                    {wallet?.coins?.toLocaleString() || '0'}
                  </Text>
                </View>
              </View>

              <View style={[styles.voucherBadge, { backgroundColor: colors.white + '20' }]}>
                <Gift size={16} color={colors.white} />
                <Text style={[styles.voucherCount, { color: colors.white }]}>
                  {wallet?.vouchers || 0}
                </Text>
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <Button
                variant="secondary"
                size="small"
                onPress={() => Alert.alert('Earn Coins', 'Complete bookings to earn coins!')}
                style={[styles.quickAction, { backgroundColor: colors.white }]}
              >
                <Sparkles size={14} color={colors.primary} />
                <Text style={{ color: colors.primary, marginLeft: 4 }}>Earn</Text>
              </Button>
              <Button
                variant="secondary"
                size="small"
                onPress={() => Alert.alert('Redeem', 'Use coins for discounts on bookings!')}
                style={[styles.quickAction, { backgroundColor: colors.white + '40' }]}
              >
                <TrendingUp size={14} color={colors.white} />
                <Text style={{ color: colors.white, marginLeft: 4 }}>Redeem</Text>
              </Button>
            </View>
          </Card>
        </Animated.View>

        {/* Karma Progress */}
        <Animated.View entering={FadeInDown.delay(200)} style={{ paddingHorizontal: spacing.screenPadding, marginTop: spacing.lg }}>
          <Card variant="default" padding="medium">
            <View style={styles.karmaHeader}>
              <View style={styles.karmaTitleRow}>
                <Award size={20} color={getTierColor(karma?.tier || 'bronze')} />
                <Text style={[styles.karmaTitle, { color: colors.label, ...typography.titleSmall }]}>
                  {karma?.tier?.charAt(0).toUpperCase()}{karma?.tier?.slice(1)} Status
                </Text>
              </View>
              <Text style={[styles.karmaPoints, { color: colors.labelSecondary, ...typography.captionMedium }]}>
                {karma?.points || 0} points
              </Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: colors.fill }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: getTierColor(karma?.tier || 'bronze'),
                      width: `${karma?.points ? Math.min((karma.points / (karma.points + (karma.pointsToNextTier || 1000))) * 100, 100) : 0}%`,
                    },
                  ]}
                />
              </View>
              <View style={styles.progressLabels}>
                <Text style={[styles.progressLabel, { color: colors.labelSecondary, ...typography.captionSmall }]}>
                  {karma?.points || 0}
                </Text>
                <Text style={[styles.progressLabel, { color: colors.labelSecondary, ...typography.captionSmall }]}>
                  {karma?.pointsToNextTier || 0} to next tier
                </Text>
              </View>
            </View>

            {/* Tier Benefits */}
            <View style={[styles.benefitsRow, { marginTop: spacing.md }]}>
              <View style={[styles.benefit, { backgroundColor: colors.fill }]}>
                <Text style={[styles.benefitValue, { color: colors.primary }]}>
                  {((karma?.multiplier || 1) * 100).toFixed(0)}%
                </Text>
                <Text style={[styles.benefitLabel, { color: colors.labelSecondary, ...typography.captionSmall }]}>
                  Coin Bonus
                </Text>
              </View>
              <View style={[styles.benefit, { backgroundColor: colors.fill }]}>
                <Text style={[styles.benefitValue, { color: colors.primary }]}>
                  {(karma?.tier === 'platinum' ? 30 : karma?.tier === 'gold' ? 20 : karma?.tier === 'silver' ? 10 : 5)}%
                </Text>
                <Text style={[styles.benefitLabel, { color: colors.labelSecondary, ...typography.captionSmall }]}>
                  Max Discount
                </Text>
              </View>
              <View style={[styles.benefit, { backgroundColor: colors.fill }]}>
                <Text style={[styles.benefitValue, { color: colors.primary }]}>
                  {karma?.tier === 'platinum' ? '∞' : '5'}
                </Text>
                <Text style={[styles.benefitLabel, { color: colors.labelSecondary, ...typography.captionSmall }]}>
                  Free Trials
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(300)} style={{ paddingHorizontal: spacing.screenPadding, marginTop: spacing.lg }}>
          <Text style={[styles.sectionTitle, { color: colors.label, ...typography.titleMedium }]}>
            Quick Actions
          </Text>

          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.backgroundElevated }]}
              onPress={() => Alert.alert('Coming Soon', 'Gift coins to friends will be available soon!')}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.systemGreen + '20' }]}>
                <Gift size={24} color={colors.systemGreen} />
              </View>
              <Text style={[styles.actionTitle, { color: colors.label, ...typography.buttonMedium }]}>
                Gift Coins
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.backgroundElevated }]}
              onPress={() => Alert.alert('Coming Soon', 'Upgrade to Gold tier coming soon!')}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.systemOrange + '20' }]}>
                <Star size={24} color={colors.systemOrange} />
              </View>
              <Text style={[styles.actionTitle, { color: colors.label, ...typography.buttonMedium }]}>
                Get Gold
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.backgroundElevated }]}
              onPress={() => Alert.alert('Coming Soon', 'View your achievement badges coming soon!')}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.systemPink + '20' }]}>
                <Award size={24} color={colors.systemPink} />
              </View>
              <Text style={[styles.actionTitle, { color: colors.label, ...typography.buttonMedium }]}>
                View Badges
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.backgroundElevated }]}
              onPress={() => Alert.alert('Coming Soon', 'Full transaction history coming soon!')}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.systemBlue + '20' }]}>
                <History size={24} color={colors.systemBlue} />
              </View>
              <Text style={[styles.actionTitle, { color: colors.label, ...typography.buttonMedium }]}>
                History
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Recent Activity */}
        <Animated.View entering={FadeInDown.delay(400)} style={[styles.section, { paddingHorizontal: spacing.screenPadding, paddingBottom: 100 }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.label, ...typography.titleMedium }]}>
              Recent Activity
            </Text>
            <TouchableOpacity>
              <Text style={[styles.seeAll, { color: colors.primary, ...typography.buttonSmall }]}>
                See All
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sample transactions */}
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.transactionItem,
                { backgroundColor: colors.backgroundElevated },
              ]}
            >
              <View style={[styles.transactionIcon, { backgroundColor: i % 2 === 0 ? colors.systemGreen + '20' : colors.systemBlue + '20' }]}>
                {i % 2 === 0 ? (
                  <Coins size={16} color={colors.systemGreen} />
                ) : (
                  <Gift size={16} color={colors.systemBlue} />
                )}
              </View>
              <View style={styles.transactionContent}>
                <Text style={[styles.transactionTitle, { color: colors.label, ...typography.bodyMedium }]}>
                  {i % 2 === 0 ? 'Booking Reward' : 'Trial Completed'}
                </Text>
                <Text style={[styles.transactionDate, { color: colors.labelSecondary, ...typography.captionSmall }]}>
                  {i === 1 ? 'Today' : i === 2 ? 'Yesterday' : '2 days ago'}
                </Text>
              </View>
              <Text
                style={[
                  styles.transactionAmount,
                  { color: i % 2 === 0 ? colors.systemGreen : colors.systemBlue },
                ]}
              >
                {i % 2 === 0 ? '+' : '-'}{i * 25} coins
              </Text>
            </View>
          ))}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 8,
  },
  headerTitle: {},
  balanceCard: {
    padding: 20,
  },
  balanceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  balanceLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
  },
  voucherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  voucherCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  karmaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  karmaTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  karmaTitle: {},
  karmaPoints: {},
  progressContainer: {
    marginTop: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressLabel: {},
  benefitsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  benefit: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  benefitValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  benefitLabel: {
    marginTop: 4,
    textAlign: 'center',
  },
  section: {},
  sectionTitle: {
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAll: {},
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '47%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    textAlign: 'center',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionContent: {
    flex: 1,
  },
  transactionTitle: {},
  transactionDate: {
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
});
