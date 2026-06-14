/**
 * Airzy Wallet Screen
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

export default function WalletScreen() {
  const transactions = [
    { id: '1', type: 'earn', amount: 500, source: 'flight', description: 'Flight BLR → DEL', date: 'May 20' },
    { id: '2', type: 'redeem', amount: -200, source: 'lounge', description: 'Plaza Premium Lounge', date: 'May 18' },
    { id: '3', type: 'earn', amount: 300, source: 'hotel', description: 'Taj Bangalore', date: 'May 15' },
    { id: '4', type: 'bonus', amount: 100, source: 'tier', description: 'Elite Tier Bonus', date: 'May 10' },
  ];

  const tiers = [
    { id: 'basic', name: 'Basic', price: 'Free', features: ['Earn 1% coins', 'Airport offers'] },
    { id: 'plus', name: 'Plus', price: '₹2,999', features: ['Earn 1.5% coins', '2 lounge visits', 'Priority support'] },
    { id: 'elite', name: 'Elite', price: '₹9,999', features: ['Earn 2% coins', '5 lounge visits', 'Concierge', 'Free transfers'], popular: true },
    { id: 'royale', name: 'Royale', price: '₹29,999', features: ['Earn 3% coins', 'Unlimited lounges', 'VIP concierge', 'Private terminals'] },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Airzy Coins</Text>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Your Balance</Text>
          <Text style={styles.balance}>2,847</Text>
          <Text style={styles.balanceValue}>≈ ₹2,847</Text>
        </View>
        <View style={styles.tierBadge}>
          <Text style={styles.tierBadgeText}>ELITE</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>💰</Text>
          <Text style={styles.actionText}>Add Coins</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>🎁</Text>
          <Text style={styles.actionText}>Send</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>📜</Text>
          <Text style={styles.actionText}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>⭐</Text>
          <Text style={styles.actionText}>Upgrade</Text>
        </TouchableOpacity>
      </View>

      {/* Earnings Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Earned This Month</Text>
          <Text style={styles.summaryValue}>+1,200</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Redeemed</Text>
          <Text style={styles.summaryValueRed}>-450</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Multiplier</Text>
          <Text style={styles.summaryValue}>2.0x</Text>
        </View>
      </View>

      {/* Upgrade Tiers */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Membership Tiers</Text>
        {tiers.map((tier) => (
          <TouchableOpacity
            key={tier.id}
            style={[
              styles.tierCard,
              tier.popular && styles.tierCardPopular,
            ]}
          >
            {tier.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
              </View>
            )}
            <View style={styles.tierHeader}>
              <View>
                <Text style={[
                  styles.tierName,
                  tier.popular && styles.tierNamePopular,
                ]}>{tier.name}</Text>
                <Text style={styles.tierPrice}>{tier.price}/year</Text>
              </View>
              {tier.id !== 'basic' && (
                <TouchableOpacity style={[
                  styles.upgradeButton,
                  tier.popular && styles.upgradeButtonPopular,
                ]}>
                  <Text style={[
                    styles.upgradeButtonText,
                    tier.popular && styles.upgradeButtonTextPopular,
                  ]}>Upgrade</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.tierFeatures}>
              {tier.features.map((feature, index) => (
                <View key={index} style={styles.tierFeature}>
                  <Text style={styles.tierFeatureIcon}>✓</Text>
                  <Text style={styles.tierFeatureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Transaction History */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        {transactions.map((tx) => (
          <View key={tx.id} style={styles.transactionCard}>
            <View style={styles.transactionIcon}>
              <Text style={styles.transactionIconText}>
                {tx.type === 'earn' ? '💰' : tx.type === 'redeem' ? '🛒' : '🎁'}
              </Text>
            </View>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionDescription}>{tx.description}</Text>
              <Text style={styles.transactionDate}>{tx.date}</Text>
            </View>
            <Text style={[
              styles.transactionAmount,
              tx.amount > 0 ? styles.transactionEarn : styles.transactionRedeem,
            ]}>
              {tx.amount > 0 ? '+' : ''}{tx.amount}
            </Text>
          </View>
        ))}
      </View>

      {/* Ways to Earn */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Earn More Coins</Text>
        <View style={styles.earnCard}>
          <View style={styles.earnItem}>
            <Text style={styles.earnIcon}>✈️</Text>
            <View style={styles.earnInfo}>
              <Text style={styles.earnTitle}>Flights</Text>
              <Text style={styles.earnDesc}>Earn 10 coins per ₹100</Text>
            </View>
            <Text style={styles.earnRate}>10%</Text>
          </View>
          <View style={styles.earnItem}>
            <Text style={styles.earnIcon}>🏨</Text>
            <View style={styles.earnInfo}>
              <Text style={styles.earnTitle}>Hotels</Text>
              <Text style={styles.earnDesc}>Earn 8 coins per ₹100</Text>
            </View>
            <Text style={styles.earnRate}>8%</Text>
          </View>
          <View style={styles.earnItem}>
            <Text style={styles.earnIcon}>🛋️</Text>
            <View style={styles.earnInfo}>
              <Text style={styles.earnTitle}>Lounges</Text>
              <Text style={styles.earnDesc}>Earn 5 coins per ₹100</Text>
            </View>
            <Text style={styles.earnRate}>5%</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#6366F1',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#C7D2FE',
    marginBottom: 16,
  },
  balanceContainer: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#C7D2FE',
  },
  balance: {
    fontSize: 56,
    fontWeight: '700',
    color: '#FFFFFF',
    marginVertical: 8,
  },
  balanceValue: {
    fontSize: 18,
    color: '#C7D2FE',
  },
  tierBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 16,
  },
  tierBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366F1',
    letterSpacing: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: -20,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  actionText: {
    fontSize: 12,
    color: '#6B7280',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  summaryValueRed: {
    fontSize: 20,
    fontWeight: '700',
    color: '#EF4444',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
  },
  tierCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tierCardPopular: {
    borderColor: '#6366F1',
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    left: 20,
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tierName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  tierNamePopular: {
    color: '#6366F1',
  },
  tierPrice: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  upgradeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  upgradeButtonPopular: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  upgradeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  upgradeButtonTextPopular: {
    color: '#FFFFFF',
  },
  tierFeatures: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  tierFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tierFeatureIcon: {
    fontSize: 14,
    color: '#10B981',
    marginRight: 10,
  },
  tierFeatureText: {
    fontSize: 13,
    color: '#6B7280',
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionIconText: {
    fontSize: 20,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  transactionDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  transactionEarn: {
    color: '#10B981',
  },
  transactionRedeem: {
    color: '#EF4444',
  },
  earnCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  earnItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  earnIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  earnInfo: {
    flex: 1,
  },
  earnTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  earnDesc: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  earnRate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  bottomPadding: {
    height: 100,
  },
});
