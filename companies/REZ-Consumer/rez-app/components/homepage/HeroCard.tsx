/**
 * HeroCard — Home page hero card with two states.
 *
 * Design: clean white card, navy text, mustard CTA only.
 * No dark backgrounds.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { colors, spacing, borderRadius } from '@/constants/theme';

// ─── Brand constants ────────────────────────────────────────────────────────
const MUSTARD = '#FFC857';
const NAVY    = '#1a3a52';
const BORDER  = '#E2E8F0';
const LIGHT   = '#F8F9FA';
const BODY    = '#475569';
const MUTED   = '#94A3B8';

// ─── Props ───────────────────────────────────────────────────────────────────
interface HeroCardProps {
  totalSaved?: number;
  savingsThisMonth?: number;
  unlockAmount?: number;
  missedAmount?: number;
  expiringCoins?: number;
  onScanPay?: () => void;
  onViewWallet?: () => void;
  onClaimPress?: () => void;
  onUseCoinPress?: () => void;
}

// ─── First-time state ─────────────────────────────────────────────────────────
const FirstTimeState: React.FC<{ onClaimPress?: () => void }> = ({ onClaimPress }) => (
  <View style={first.wrapper}>
    <View style={first.inner}>
      {/* Top row */}
      <View style={first.headerRow}>
        <View style={first.liveBadge}>
          <View style={first.pulseDot} />
          <Text style={first.liveText}>Welcome to REZ</Text>
        </View>
        <View style={first.storePill}>
          <Text style={first.storePillText}>24 stores near you</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={first.title}>
        {'Save money on\n'}
        <Text style={first.titleAccent}>everything</Text>
        {' you buy'}
      </Text>

      {/* Subtitle */}
      <Text style={first.subtitle}>
        Cashback, coins & free trials at 2,400+ stores. Zero effort.
      </Text>

      {/* CTA row */}
      <View style={first.ctaRow}>
        <Pressable
          style={({ pressed }) => [first.ctaBtn, pressed && { opacity: 0.85 }]}
          onPress={onClaimPress}
        >
          <Text style={first.ctaText}>🎁  Claim your welcome reward</Text>
        </Pressable>
        <View style={first.socialProof}>
          <Text style={first.proofAmount}>₹0</Text>
          <Text style={first.proofLabel}>saved so far</Text>
        </View>
      </View>
    </View>

    {/* Bottom strip */}
    <View style={first.bottomStrip}>
      <Text style={first.stripText}>
        <Text style={first.stripBold}>Scan & Pay</Text>
        {' at unknown nearby store to start earning'}
      </Text>
    </View>
  </View>
);

const first = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER,
  },
  inner: {
    padding: 20,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontSize: 11,
    fontWeight: '600',
    color: BODY,
  },
  storePill: {
    backgroundColor: LIGHT,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: BORDER,
  },
  storePillText: {
    fontSize: 10,
    fontWeight: '600',
    color: NAVY,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: NAVY,
    letterSpacing: -0.5,
    lineHeight: 34,
    marginBottom: 8,
  },
  titleAccent: {
    color: MUSTARD,
  },
  subtitle: {
    fontSize: 13,
    color: BODY,
    lineHeight: 19,
    marginBottom: 20,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  ctaBtn: {
    flex: 1,
    backgroundColor: MUSTARD,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '800',
    color: NAVY,
  },
  socialProof: {
    alignItems: 'center',
  },
  proofAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: NAVY,
    lineHeight: 24,
  },
  proofLabel: {
    fontSize: 9,
    color: MUTED,
    textAlign: 'center',
  },
  bottomStrip: {
    backgroundColor: LIGHT,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  stripText: {
    fontSize: 11,
    color: BODY,
  },
  stripBold: {
    fontWeight: '700',
    color: NAVY,
  },
});

// ─── Returning user state ─────────────────────────────────────────────────────
interface ReturningProps {
  savingsThisMonth?: number;
  unlockAmount?: number;
  missedAmount?: number;
  expiringCoins?: number;
  onScanPay?: () => void;
  onViewWallet?: () => void;
  onUseCoinPress?: () => void;
}

const ReturningState: React.FC<ReturningProps> = ({
  savingsThisMonth = 0,
  unlockAmount = 580,
  missedAmount = 80,
  expiringCoins = 240,
  onScanPay,
  onViewWallet,
  onUseCoinPress,
}) => {
  const formatted = `₹${savingsThisMonth.toLocaleString('en-IN')}`;

  return (
    <View style={ret.wrapper}>
      {/* Savings block */}
      <View style={ret.topSection}>
        <Text style={ret.label}>SAVED THIS MONTH</Text>
        <Text style={ret.amount}>{formatted}</Text>

        <View style={ret.unlockBox}>
          <Text style={ret.unlockText}>
            ₹{unlockAmount.toLocaleString('en-IN')} more → VIP tier
          </Text>
        </View>

        {missedAmount > 0 && (
          <View style={ret.missedRow}>
            <View style={ret.missedPill}>
              <Text style={ret.missedText}>₹{missedAmount} missed yesterday</Text>
            </View>
          </View>
        )}
      </View>

      {/* CTA row */}
      <View style={ret.ctaRow}>
        <Pressable
          style={({ pressed }) => [ret.scanBtn, pressed && { opacity: 0.85 }]}
          onPress={onScanPay}
        >
          <Text style={ret.scanText}>Scan & Pay</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [ret.walletBtn, pressed && { opacity: 0.85 }]}
          onPress={onViewWallet}
        >
          <Text style={ret.walletText}>View Wallet</Text>
        </Pressable>
      </View>

      {/* Coin expiry row */}
      {expiringCoins > 0 && (
        <Pressable
          style={({ pressed }) => [ret.expiryRow, pressed && { opacity: 0.85 }]}
          onPress={onUseCoinPress}
        >
          <Text style={ret.expiryText}>
            ⚡ {expiringCoins} coins expiring — use them now ›
          </Text>
        </Pressable>
      )}
    </View>
  );
};

const ret = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER,
  },
  topSection: {
    padding: 20,
    paddingBottom: 16,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: MUTED,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  amount: {
    fontSize: 34,
    fontWeight: '800',
    color: NAVY,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  unlockBox: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: MUSTARD,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 10,
  },
  unlockText: {
    fontSize: 11,
    fontWeight: '600',
    color: NAVY,
  },
  missedRow: {
    flexDirection: 'row',
  },
  missedPill: {
    backgroundColor: '#FEF2F2',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  missedText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '500',
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  scanBtn: {
    flex: 1,
    backgroundColor: MUSTARD,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  scanText: {
    fontSize: 13,
    fontWeight: '700',
    color: NAVY,
  },
  walletBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  walletText: {
    fontSize: 13,
    fontWeight: '600',
    color: NAVY,
  },
  expiryRow: {
    backgroundColor: '#FFFBEB',
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  expiryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
  },
});

// ─── Main component ───────────────────────────────────────────────────────────
const HeroCard: React.FC<HeroCardProps> = ({
  totalSaved,
  savingsThisMonth,
  unlockAmount,
  missedAmount,
  expiringCoins,
  onScanPay,
  onViewWallet,
  onClaimPress,
  onUseCoinPress,
}) => {
  const isFirstTime = !totalSaved || totalSaved === 0;

  return (
    <View style={styles.shadow}>
      {isFirstTime ? (
        <FirstTimeState onClaimPress={onClaimPress} />
      ) : (
        <ReturningState
          savingsThisMonth={savingsThisMonth}
          unlockAmount={unlockAmount}
          missedAmount={missedAmount}
          expiringCoins={expiringCoins}
          onScanPay={onScanPay}
          onViewWallet={onViewWallet}
          onUseCoinPress={onUseCoinPress}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  shadow: {
    marginHorizontal: spacing.base,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
    }),
  },
});

export default React.memo(HeroCard);
