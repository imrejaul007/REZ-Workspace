/**
 * SimplifiedWalletView
 *
 * Phase 1.3 — "One Balance" Mode
 * Shows ONE big number: total available balance (ReZ + branded combined).
 * Subtitle shows rupee equivalent (1 coin = Rs.1).
 * Small link to detailed breakdown.
 * Coin expiry warning banner if unknown coins expire within 7 days.
 */

import React from 'react';
import {
  View,
  StyleSheet,
  Pressable,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { colors } from '@/constants/theme';
import CoinExpiryBanner from './CoinExpiryBanner';

// ============================================================================
// TYPES
// ============================================================================

export interface ExpiringCoin {
  count: number;
  daysLeft: number;
}

export interface SimplifiedWalletViewProps {
  balance: number;
  expiringCoins?: ExpiringCoin | null;
  onDetailPress: () => void;
  onExpiryPress?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

const SimplifiedWalletView: React.FC<SimplifiedWalletViewProps> = ({
  balance,
  expiringCoins,
  onDetailPress,
  onExpiryPress,
}) => {
  const safeBalance = typeof balance === 'number' && !isNaN(balance) ? balance : 0;
  const formattedBalance = safeBalance.toLocaleString('en-IN');

  return (
    <View style={styles.container}>
      {/* Expiry Banner (shown when coins expire within 7 days) */}
      {expiringCoins && expiringCoins.daysLeft <= 7 && (
        <CoinExpiryBanner
          expiringCount={expiringCoins.count}
          daysLeft={expiringCoins.daysLeft}
          onPress={onExpiryPress ?? onDetailPress}
        />
      )}

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <ThemedText style={styles.balanceLabel}>Your REZ Balance</ThemedText>

        <View style={styles.balanceRow}>
          <ThemedText style={styles.coinIcon}>🪙</ThemedText>
          <ThemedText style={styles.balanceNumber}>{formattedBalance}</ThemedText>
          <ThemedText style={styles.coinsLabel}> coins</ThemedText>
        </View>

        <ThemedText style={styles.rupeeEquivalent}>
          = Rs.{safeBalance.toLocaleString('en-IN')}
        </ThemedText>

        <Pressable
          style={({ pressed }) => [styles.detailLink, pressed ? styles.detailLinkPressed : null]}
          onPress={onDetailPress}
          hitSlop={8}
        >
          <ThemedText style={styles.detailLinkText}>View detailed breakdown &gt;</ThemedText>
        </Pressable>
      </View>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  balanceCard: {
    backgroundColor: colors.background.dark,
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: colors.nileBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  balanceLabel: {
    fontSize: 13,
    color: colors.lightPeach,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  coinIcon: {
    fontSize: 28,
    lineHeight: 40,
  },
  balanceNumber: {
    fontSize: 52,
    fontWeight: '800',
    color: colors.lightMustard,
    lineHeight: 58,
    letterSpacing: -1,
  },
  coinsLabel: {
    fontSize: 18,
    color: colors.lightPeach,
    fontWeight: '500',
    paddingBottom: 8,
  },
  rupeeEquivalent: {
    fontSize: 18,
    color: colors.lightPeach,
    fontWeight: '600',
    marginTop: 6,
    opacity: 0.85,
  },
  detailLink: {
    marginTop: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,205,87,0.3)',
  },
  detailLinkPressed: {
    backgroundColor: 'rgba(255,205,87,0.1)',
  },
  detailLinkText: {
    fontSize: 13,
    color: colors.lightMustard,
    fontWeight: '600',
  },
});

export default React.memo(SimplifiedWalletView);
