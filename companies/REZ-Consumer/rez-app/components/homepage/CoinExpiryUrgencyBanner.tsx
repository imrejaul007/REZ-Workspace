/**
 * CoinExpiryUrgencyBanner
 *
 * Loss-aversion trigger — the most powerful daily habit driver.
 * "120 REZ coins expiring in 12 hours" drives more opens than unknown reward promise.
 *
 * Shows when: user has coins expiring in < 48 hours (promoCoinBalance > 0)
 * Data source: walletData.promoCoinBalance + walletData.promoCoinDaysLeft
 *
 * Design: red-tinted card, countdown language, direct "Use before expiry" CTA.
 */

import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const NAVY   = '#1a3a52';
const BORDER = '#FECACA';
const RED_BG = '#FEF2F2';
const RED    = '#DC2626';
const MUTED  = '#94A3B8';

// ─── Props ────────────────────────────────────────────────────────────────────
interface CoinExpiryUrgencyBannerProps {
  expiringCount: number;    // number of coins expiring
  daysLeft: number;         // days until expiry (0 = today, 1 = tomorrow)
  onPress?: () => void;     // navigate to wallet/spend screen
  onDismiss?: () => void;
}

function urgencyLabel(daysLeft: number, count: number): { headline: string; sub: string } {
  if (daysLeft === 0) {
    return {
      headline: `⏰ ${count} RC expiring tonight!`,
      sub: 'Use before midnight or lose them permanently',
    };
  }
  if (daysLeft === 1) {
    return {
      headline: `⚡ ${count} RC expire tomorrow`,
      sub: 'Spend at unknown nearby store before they vanish',
    };
  }
  return {
    headline: `🔔 ${count} RC expiring in ${daysLeft} days`,
    sub: 'Don\'t miss out — use them at a store near you',
  };
}

const CoinExpiryUrgencyBanner: React.FC<CoinExpiryUrgencyBannerProps> = ({
  expiringCount,
  daysLeft,
  onPress,
  onDismiss,
}) => {
  // Don't render for 0 coins or >48h (2 days)
  if (!expiringCount || expiringCount <= 0 || daysLeft > 2) return null;

  const { headline, sub } = urgencyLabel(daysLeft, expiringCount);

  return (
    <View style={styles.card}>
      {/* Left icon */}
      <View style={styles.iconBox}>
        <Ionicons name="hourglass-outline" size={20} color={RED} />
      </View>

      {/* Text */}
      <View style={styles.textBlock}>
        <Text style={styles.headline}>{headline}</Text>
        <Text style={styles.sub}>{sub}</Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.useBtn, pressed && { opacity: 0.85 }]}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`Use ${expiringCount} expiring coins`}
        >
          <Text style={styles.useBtnText}>Use RC</Text>
        </Pressable>
        {onDismiss && (
          <Pressable
            onPress={onDismiss}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Dismiss expiry reminder"
          >
            <Ionicons name="close" size={16} color={MUTED} style={styles.closeIcon} />
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: RED_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    borderLeftWidth: 4,
    borderLeftColor: RED,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
  },

  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  textBlock: {
    flex: 1,
  },
  headline: {
    fontSize: 13,
    fontWeight: '800',
    color: NAVY,
    marginBottom: 2,
  },
  sub: {
    fontSize: 11,
    color: '#7F1D1D',
    lineHeight: 15,
  },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  useBtn: {
    backgroundColor: RED,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  useBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeIcon: {
    marginTop: 1,
  },
});

export default React.memo(CoinExpiryUrgencyBanner);
