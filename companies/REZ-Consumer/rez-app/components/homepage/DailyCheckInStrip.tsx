/**
 * DailyCheckInStrip — Compact banner that lets a user claim their daily
 * check-in reward (10 RC).
 *
 * Two states:
 *   • unclaimed — mustard CTA pill, calls POST /api/gamification/daily-checkin
 *   • claimed   — gray "✓ Claimed" pill, no further action
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, borderRadius } from '@/constants/theme';
import gamificationApi from '@/services/gamificationApi';

// CRED Light palette
const MUSTARD       = '#FFC857';
const MUSTARD_DARK  = '#E6A800';
const NILE_BLUE     = '#1a3a52';
const CARD_BG       = '#FFFFFF';
const CARD_BORDER   = 'rgba(0,0,0,0.06)';
const PRIMARY_TEXT  = '#1a1a1a';
const MUTED_TEXT    = '#6B7280';
const CARD_BG_CLAIMED = '#F3F4F6';

// ─── Props ────────────────────────────────────────────────────────────────────
interface DailyCheckInStripProps {
  isClaimed: boolean;
  onClaim?: () => void | Promise<void>;
}

// ─── Component ────────────────────────────────────────────────────────────────
const DailyCheckInStrip: React.FC<DailyCheckInStripProps> = ({
  isClaimed: initialClaimed,
  onClaim,
}) => {
  const [claimed, setClaimed]   = useState(initialClaimed);
  const [loading, setLoading]   = useState(false);

  const handleClaim = useCallback(async () => {
    if (claimed || loading) return;

    setLoading(true);
    try {
      await gamificationApi.performCheckIn();
      setClaimed(true);
      await onClaim?.();
    } catch {
      // Silently swallow; real implementation should handle errors gracefully
    } finally {
      setLoading(false);
    }
  }, [claimed, loading, onClaim]);

  return (
    <View style={styles.strip}>
      {/* Text block */}
      <View style={styles.textBlock}>
        <Text style={styles.title}>Check in today → earn ₹10 cashback</Text>
        <Text style={styles.subtitle}>Free cashback · visit a store to redeem · resets midnight</Text>
      </View>

      {/* CTA pill */}
      {claimed ? (
        <View style={styles.claimedPill}>
          <Text style={styles.claimedText}>✓ Claimed</Text>
        </View>
      ) : (
        <Pressable
          style={({ pressed }) => [styles.claimPill, pressed && { opacity: 0.82 }]}
          onPress={handleClaim}
          disabled={loading}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {loading ? (
            <ActivityIndicator size="small" color={NILE_BLUE} />
          ) : (
            <Text style={styles.claimText}>Claim ›</Text>
          )}
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  strip: {
    marginHorizontal: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    borderLeftWidth: 3,
    borderLeftColor: MUSTARD,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  textBlock: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: PRIMARY_TEXT,
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 11,
    color: MUTED_TEXT,
    fontWeight: '400',
  },
  // Unclaimed CTA — Nile Blue button (primary CTA color)
  claimPill: {
    backgroundColor: NILE_BLUE,
    borderRadius: 99,
    paddingHorizontal: 18,
    paddingVertical: 10,
    minWidth: 76,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  // Claimed state — muted gray pill
  claimedPill: {
    backgroundColor: CARD_BG_CLAIMED,
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 76,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  claimedText: {
    fontSize: 12,
    fontWeight: '600',
    color: MUTED_TEXT,
  },
});

export default React.memo(DailyCheckInStrip);
