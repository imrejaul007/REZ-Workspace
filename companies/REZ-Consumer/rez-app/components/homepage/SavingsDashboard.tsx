// @ts-nocheck
/**
 * SavingsDashboard — Smart savings companion hero section.
 *
 * Replaces the generic HeroBanner with a financial dashboard that makes savings
 * the first thing users see. Shows: total saved this month, average per visit,
 * and a contextual CTA. Designed to reinforce the habit loop:
 * "I save money every time I use REZ."
 *
 * Data: walletStore.savingsInsights (totalSaved, thisMonth, avgPerVisit)
 * Design: Nile Blue gradient, mustard accent, CRED-style clean typography.
 */

import React, { memo, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// ── Brand tokens (matched to HeroBanner) ────────────────────────────────────
const NILE_BLUE       = '#1a3a52';
const NILE_BLUE_LIGHT = '#2a5a7c';
const MUSTARD         = '#FFC857';
const MUSTARD_DARK    = '#E6A800';
const WHITE           = '#FFFFFF';
const WHITE_70        = 'rgba(255,255,255,0.70)';
const WHITE_50        = 'rgba(255,255,255,0.50)';
const WHITE_15        = 'rgba(255,255,255,0.15)';
const WHITE_10        = 'rgba(255,255,255,0.10)';
const GREEN           = '#4ADE80';

// ── Time-aware context ──────────────────────────────────────────────────────
function getTimeContext(): { emoji: string; nudge: string } {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 11)  return { emoji: '☀️', nudge: 'Save on breakfast & coffee' };
  if (hour >= 11 && hour < 14) return { emoji: '🍽️', nudge: 'Lunch deals waiting for you' };
  if (hour >= 14 && hour < 20) return { emoji: '🌆', nudge: 'Evening savings nearby' };
  return { emoji: '🌙', nudge: 'Late night? Save on orders' };
}

// ── Top merchant shape (from insightsApi) ───────────────────────────────────
export interface TopMerchantSnippet {
  merchantName: string;
  totalSaved: number;
}

// ── Props ────────────────────────────────────────────────────────────────────
interface SavingsDashboardProps {
  totalSaved: number;
  thisMonth: number;
  avgPerVisit: number;
  currencySymbol?: string;
  onScanPayPress?: () => void;
  onViewWalletPress?: () => void;
  // Sprint 2: spending intelligence extras (optional, backward-compatible)
  lastMonthSaved?: number;
  topMerchants?: TopMerchantSnippet[];
  // Sprint 3: savings streak & missed savings
  savingsStreak?: number;       // 0 means no streak
  missedSavingsCount?: number;  // 0 means none
  topCategory?: string;
  onMissedPress?: () => void;   // navigate to missed savings
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatAmount(amount: number, symbol: string): string {
  if (amount >= 1000) {
    const k = amount / 1000;
    return `${symbol}${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
  }
  return `${symbol}${Math.round(amount)}`;
}

// ── Component ────────────────────────────────────────────────────────────────
function SavingsDashboard({
  totalSaved,
  thisMonth,
  avgPerVisit,
  currencySymbol = '₹',
  onScanPayPress,
  onViewWalletPress,
  lastMonthSaved,
  topMerchants,
  savingsStreak = 0,
  missedSavingsCount = 0,
  topCategory,
  onMissedPress,
}: SavingsDashboardProps) {
  const router = useRouter();
  const timeCtx = useMemo(() => getTimeContext(), []);

  const hasHistory = totalSaved > 0;

  const handleExploreDeals = () => {
    router.push('/offers' as unknown);
  };

  const handleScanPay = () => {
    if (onScanPayPress) {
      onScanPayPress();
    } else {
      router.push('/pay-in-store/' as unknown);
    }
  };

  const handleWallet = () => {
    if (onViewWalletPress) {
      onViewWalletPress();
    } else {
      router.push('/wallet-screen' as unknown);
    }
  };

  return (
    <View style={styles.container}>
      {/* Savings headline */}
      {hasHistory ? (
        <>
          <Text style={styles.label}>You've saved</Text>
          <View style={styles.amountRow}>
            <Text style={styles.amount}>
              {formatAmount(totalSaved, currencySymbol)}
            </Text>
            <Text style={styles.amountSuffix}>total</Text>
          </View>
        </>
      ) : (
        <>
          <View style={styles.greetingPill}>
            <Text style={styles.greetingText}>{timeCtx.emoji} {timeCtx.nudge}</Text>
          </View>
          <Text style={styles.heroHeadline}>Start Saving{'\n'}With Every Visit</Text>
        </>
      )}

      {/* Sprint 3: Savings streak pill — only shown when streak > 0 */}
      {hasHistory && savingsStreak > 0 && (
        <View style={styles.streakRow}>
          <Text style={styles.streakText}>🔥 {savingsStreak} day streak</Text>
        </View>
      )}

      {/* Sprint 3: Missed savings alert — tappable, only shown when count > 0 */}
      {missedSavingsCount > 0 && (
        <Pressable style={styles.missedRow} onPress={onMissedPress}>
          <Text style={styles.missedText}>⚡ {missedSavingsCount} missed savings this month</Text>
        </Pressable>
      )}

      {/* Stats row — only when user has savings history */}
      {hasHistory && (
        <View style={styles.statsRow}>
          <Pressable style={styles.statCard} onPress={handleWallet}>
            <Text style={styles.statValue}>
              {formatAmount(thisMonth, currencySymbol)}
            </Text>
            <Text style={styles.statLabel}>This month</Text>
          </Pressable>

          <View style={styles.statDivider} />

          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {formatAmount(avgPerVisit, currencySymbol)}
            </Text>
            <Text style={styles.statLabel}>Avg per visit</Text>
          </View>

          <View style={styles.statDivider} />

          <Pressable style={styles.statCard} onPress={handleWallet}>
            <Ionicons name="wallet-outline" size={18} color={MUSTARD} />
            <Text style={styles.statLabel}>My Wallet</Text>
          </Pressable>
        </View>
      )}

      {/* Sprint 2: Month-over-month comparison */}
      {hasHistory && lastMonthSaved !== undefined && (
        <View style={styles.trendRow}>
          {(() => {
            const diff = thisMonth - lastMonthSaved;
            const isUp = diff > 0;
            const isDown = diff < 0;
            const trendColor = isUp ? GREEN : isDown ? '#F87171' : WHITE_70;
            const arrow = isUp ? '▲' : isDown ? '▼' : '—';
            return (
              <>
                <Text style={[styles.trendArrow, { color: trendColor }]}>{arrow}</Text>
                <Text style={[styles.trendText, { color: trendColor }]}>
                  {isUp ? '+' : ''}{formatAmount(diff, currencySymbol)} vs last month
                  {lastMonthSaved > 0 ? ` (${formatAmount(lastMonthSaved, currencySymbol)})` : ''}
                </Text>
              </>
            );
          })()}
        </View>
      )}

      {/* Sprint 2: Top 3 stores */}
      {hasHistory && topMerchants && topMerchants.length > 0 && (
        <View style={styles.topStoresRow}>
          <Text style={styles.topStoresLabel}>Top stores this month</Text>
          <View style={styles.topStoresList}>
            {topMerchants.slice(0, 3).map((m, i) => (
              <View key={i} style={styles.topStoreChip}>
                <Text style={styles.topStoreRank}>{i + 1}</Text>
                <Text style={styles.topStoreName} numberOfLines={1}>
                  {m.merchantName}
                </Text>
                <Text style={styles.topStoreSaved}>{formatAmount(m.totalSaved, currencySymbol)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Sprint 3: Top category pill — only shown when topCategory is set */}
      {topCategory ? (
        <View style={styles.topCategoryPill}>
          <Text style={styles.topCategoryText}>🏆 Top: {topCategory}</Text>
        </View>
      ) : null}

      {/* Contextual subline */}
      <Text style={styles.subline}>
        {hasHistory
          ? `${timeCtx.emoji} ${timeCtx.nudge}`
          : 'Earn cashback at 2,400+ stores — every payment saves you money'}
      </Text>

      {/* CTA Row */}
      <View style={styles.ctaRow}>
        <Pressable
          style={({ pressed }) => [styles.ctaPrimary, pressed && styles.ctaPrimaryPressed]}
          onPress={handleExploreDeals}
          accessibilityRole="button"
          accessibilityLabel="Explore deals"
        >
          <Text style={styles.ctaPrimaryText}>
            {hasHistory ? 'Save More →' : 'Explore Deals →'}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.ctaSecondary, pressed && { opacity: 0.75 }]}
          onPress={handleScanPay}
          accessibilityRole="button"
          accessibilityLabel="Scan and pay"
        >
          <Text style={styles.ctaSecondaryText}>Scan & Pay</Text>
        </Pressable>
      </View>

      {/* Trust strip */}
      <View style={styles.trustStrip}>
        <View style={styles.trustDot} />
        <Text style={styles.trustText}>2,400+ stores · Instant cashback · Zero fees</Text>
      </View>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 0,
    borderRadius: 0,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 28,
    backgroundColor: NILE_BLUE,
    overflow: 'hidden',
  },

  // New user greeting pill (same as HeroBanner)
  greetingPill: {
    alignSelf: 'flex-start',
    backgroundColor: WHITE_15,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 14,
  },
  greetingText: {
    fontSize: 12,
    fontWeight: '600',
    color: WHITE,
    letterSpacing: 0.3,
  },

  // New user hero headline
  heroHeadline: {
    fontSize: 32,
    fontWeight: '800',
    color: WHITE,
    letterSpacing: -0.8,
    lineHeight: 40,
    marginBottom: 10,
  },

  // Returning user — savings headline
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: WHITE_50,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  amount: {
    fontSize: 42,
    fontWeight: '800',
    color: MUSTARD,
    letterSpacing: -1.2,
  },
  amountSuffix: {
    fontSize: 16,
    fontWeight: '500',
    color: WHITE_50,
    marginLeft: 8,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE_10,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 4,
    marginTop: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: WHITE,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: WHITE_70,
    letterSpacing: 0.2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: WHITE_15,
  },

  // Sprint 2: Month-over-month trend row
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  trendArrow: {
    fontSize: 11,
    fontWeight: '700',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },

  // Sprint 2: Top stores strip
  topStoresRow: {
    marginBottom: 14,
    gap: 6,
  },
  topStoresLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: WHITE_50,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  topStoresList: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  topStoreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: WHITE_10,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: WHITE_15,
  },
  topStoreRank: {
    fontSize: 10,
    fontWeight: '700',
    color: MUSTARD,
  },
  topStoreName: {
    fontSize: 11,
    fontWeight: '600',
    color: WHITE,
    maxWidth: 80,
  },
  topStoreSaved: {
    fontSize: 10,
    fontWeight: '700',
    color: GREEN,
  },

  // Sprint 3: Savings streak pill
  streakRow: {
    alignSelf: 'flex-start',
    backgroundColor: WHITE_15,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '700',
    color: MUSTARD,
    letterSpacing: 0.2,
  },

  // Sprint 3: Missed savings alert row
  missedRow: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.30)',
  },
  missedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FCA5A5',
    letterSpacing: 0.1,
  },

  // Sprint 3: Top category pill
  topCategoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: WHITE_10,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: WHITE_15,
  },
  topCategoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: WHITE_70,
    letterSpacing: 0.2,
  },

  // Subline
  subline: {
    fontSize: 14,
    fontWeight: '400',
    color: WHITE_70,
    lineHeight: 20,
    marginBottom: 20,
  },

  // CTAs (identical to HeroBanner)
  ctaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  ctaPrimary: {
    flex: 1,
    backgroundColor: MUSTARD,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPrimaryPressed: {
    backgroundColor: MUSTARD_DARK,
  },
  ctaPrimaryText: {
    fontSize: 14,
    fontWeight: '800',
    color: NILE_BLUE,
    letterSpacing: 0.3,
  },
  ctaSecondary: {
    flex: 1,
    backgroundColor: WHITE_15,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  ctaSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: WHITE,
    letterSpacing: 0.1,
  },

  // Trust strip
  trustStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: WHITE_10,
  },
  trustDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GREEN,
  },
  trustText: {
    fontSize: 11,
    fontWeight: '500',
    color: WHITE_70,
    letterSpacing: 0.2,
  },
});

export default memo(SavingsDashboard);
