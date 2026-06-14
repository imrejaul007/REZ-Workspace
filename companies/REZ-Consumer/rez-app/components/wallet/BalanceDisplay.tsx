// @ts-nocheck
/**
 * BalanceDisplay — Total wallet balance card with hide/reveal toggle,
 * animated count-up, per-coin-type breakdown cards (Rez, Privé, Promo,
 * Branded, Cashback), and "Add Money" / "Send" quick action buttons.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import {
  useSharedValue,
  useAnimatedReaction,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { WalletData, CoinType } from '@/types/wallet';
import { Spacing, BorderRadius, Shadows } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import { BRAND } from '@/constants/brand';
import { useIsMounted } from '@/hooks/useIsMounted';

const BALANCE_HIDDEN_KEY = '@wallet_balance_hidden';

const NILE_BLUE = '#1a3a52';
const NILE_BLUE_DARK = '#0d1f2d';

interface BalanceDisplayProps {
  walletData: WalletData;
  onCoinPress?: (type: CoinType) => void;
  currencySymbol?: string;
}

// ---------------------------------------------------------------------------
// Small helper: icon circle for each coin card
// ---------------------------------------------------------------------------
interface IconCircleProps {
  bgColor: string;
  iconName: React.ComponentProps<typeof Ionicons>['name'];
}
const IconCircle: React.FC<IconCircleProps> = ({ bgColor, iconName }) => (
  <View style={[styles.iconCircle, { backgroundColor: bgColor }]}>
    <Ionicons name={iconName} size={18} color="#fff" />
  </View>
);

// ---------------------------------------------------------------------------
// Individual breakdown card
// ---------------------------------------------------------------------------
interface CoinCardProps {
  iconBg: string;
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
  amount: number;
  isHidden: boolean;
  badge?: React.ReactNode;
  children?: React.ReactNode;
}
const CoinCard: React.FC<CoinCardProps> = ({
  iconBg,
  iconName,
  title,
  subtitle,
  amount,
  isHidden,
  badge,
  children,
}) => {
  const displayAmount = isHidden ? '₹••' : `₹${amount.toLocaleString('en-IN')}`;
  return (
    <View style={styles.coinCard}>
      <IconCircle bgColor={iconBg} iconName={iconName} />
      <View style={styles.coinCardCenter}>
        <View style={styles.coinCardTitleRow}>
          <Text style={styles.coinCardTitle}>{title}</Text>
          {badge}
        </View>
        <Text style={styles.coinCardSubtitle}>{subtitle}</Text>
        {children}
      </View>
      <Text style={[styles.coinCardAmount, { color: NILE_BLUE }]}>{displayAmount}</Text>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
// eslint-disable-next-line react/display-name
export const BalanceDisplay: React.FC<BalanceDisplayProps> = React.memo(
  ({ walletData, onCoinPress, currencySymbol = '₹' }) => {
    const [isHidden, setIsHidden] = useState(false);
    const [brandedExpanded, setBrandedExpanded] = useState(false);
    const isMounted = useIsMounted();
    const router = useRouter();
    const countAnim = useSharedValue(0);

    // Load persisted hide state
    useEffect(() => {
      AsyncStorage.getItem(BALANCE_HIDDEN_KEY)
        .then((val) => {
          if (!isMounted()) return;
          if (val === 'true') setIsHidden(true);
        })
        .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // totalBalance is the canonical value — already in RC units (not divided by rate)
    const totalBalance =
      typeof walletData.totalBalance === 'number' ? walletData.totalBalance : 0;
    const cashbackBalance =
      typeof walletData.cashbackBalance === 'number' ? walletData.cashbackBalance : 0;
    const pendingRewards =
      typeof walletData.pendingRewards === 'number' ? walletData.pendingRewards : 0;

    // Count-up animation whenever balance changes
    useEffect(() => {
      if (!isHidden) {
        countAnim.value = 0;
        countAnim.value = withTiming(1, {
          duration: 700,
          easing: Easing.out(Easing.cubic),
        });
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isHidden, totalBalance]);

    const [animatedBalance, setAnimatedBalance] = useState(0);

    useAnimatedReaction(
      () => countAnim.value,
      (val) => {
        const interpolated = val * totalBalance;
        runOnJS(setAnimatedBalance)(Math.round(interpolated));
      },
      [totalBalance, isHidden]
    );

    const toggleHidden = useCallback(async () => {
      const newVal = !isHidden;
      setIsHidden(newVal);
      if (!isMounted()) return;
      await AsyncStorage.setItem(BALANCE_HIDDEN_KEY, String(newVal));
    }, [isHidden, isMounted]);

    // Derive per-type coin amounts from the coins array
    const rezCoin = walletData.coins?.find((c) => c.type === 'rez');
    const priveCoin = walletData.coins?.find((c) => c.type === 'prive');
    const promoCoin = walletData.coins?.find((c) => c.type === 'promo');
    const brandedTotal =
      typeof walletData.brandedCoinsTotal === 'number' ? walletData.brandedCoinsTotal : 0;

    const rezAmount = rezCoin?.amount ?? 0;
    const priveAmount = priveCoin?.amount ?? 0;
    const promoAmount = promoCoin?.amount ?? 0;

    // Hero balance display
    const heroBalanceText = isHidden
      ? '₹ ••••'
      : `₹ ${animatedBalance.toLocaleString('en-IN')}`;

    // Promo expiry countdown (days)
    let promoExpiryDays: number | null = null;
    if (promoCoin?.expiryDate) {
      const diff = new Date(promoCoin.expiryDate).getTime() - Date.now();
      promoExpiryDays = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    return (
      <View style={styles.outerContainer}>

        {/* ---------------------------------------------------------------- */}
        {/* HERO CARD                                                         */}
        {/* ---------------------------------------------------------------- */}
        <LinearGradient
          colors={[NILE_BLUE, '#0d2035', NILE_BLUE_DARK]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          {/* Depth glow overlays */}
          <View style={styles.glowOverlay} pointerEvents="none" />
          <View style={styles.glowOverlayBottomLeft} pointerEvents="none" />

          {/* Top row: label + eye */}
          <View style={styles.heroTopRow}>
            <Text style={styles.heroLabel}>AVAILABLE BALANCE</Text>
            <Pressable
              onPress={toggleHidden}
              style={styles.eyeButton}
              accessibilityLabel={isHidden ? 'Show balance' : 'Hide balance'}
              accessibilityRole="button"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={isHidden ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="rgba(255,255,255,0.6)"
              />
            </Pressable>
          </View>

          {/* Large balance */}
          <Text
            style={styles.heroBalance}
            accessibilityLabel={`Wallet balance: ${heroBalanceText}`}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
          >
            {heroBalanceText}
          </Text>

          {/* Subtitle */}
          <Text style={styles.heroSubtitle}>
            = {isHidden ? '••••' : animatedBalance.toLocaleString('en-IN')} Rez Coins
          </Text>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <Pressable
              style={({ pressed }) => [styles.actionBtnFilled, pressed && { opacity: 0.82 }]}
              onPress={() => router.push('/payment' as unknown)}
              accessibilityLabel="Add money to wallet"
              accessibilityRole="button"
            >
              <Ionicons name="add-circle" size={17} color="#fff" />
              <Text style={styles.actionBtnFilledText}>Add Money</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.actionBtnOutlined, pressed && { opacity: 0.75 }]}
              onPress={() => router.push('/wallet/transfer' as unknown)}
              accessibilityLabel="Send coins"
              accessibilityRole="button"
            >
              <Ionicons name="paper-plane" size={17} color={NILE_BLUE} />
              <Text style={styles.actionBtnOutlinedText}>Send</Text>
            </Pressable>
          </View>
        </LinearGradient>

        {/* ---------------------------------------------------------------- */}
        {/* COIN BREAKDOWN CARDS                                              */}
        {/* ---------------------------------------------------------------- */}
        <View style={styles.breakdownContainer}>

          {/* Rez Coins */}
          <Pressable
            onPress={() => onCoinPress?.('rez' as CoinType)}
            style={({ pressed }) => [pressed && { opacity: 0.88 }]}
          >
            <CoinCard
              iconBg={NILE_BLUE}
              iconName="diamond"
              title="Rez Coins"
              subtitle="Universal — use at unknown store"
              amount={rezAmount}
              isHidden={isHidden}
            />
          </Pressable>

          {/* Privé Coins */}
          <Pressable
            onPress={() => onCoinPress?.('prive' as CoinType)}
            style={({ pressed }) => [pressed && { opacity: 0.88 }]}
          >
            <CoinCard
              iconBg="#B8860B"
              iconName="shield-checkmark"
              title="Privé Coins"
              subtitle="Premium member exclusive rewards"
              amount={priveAmount}
              isHidden={isHidden}
              badge={
                priveAmount > 0 ? (
                  <View style={styles.premiumBadge}>
                    <Text style={styles.premiumBadgeText}>PREMIUM</Text>
                  </View>
                ) : undefined
              }
            />
          </Pressable>

          {/* Promo Coins */}
          <Pressable
            onPress={() => onCoinPress?.('promo' as CoinType)}
            style={({ pressed }) => [pressed && { opacity: 0.88 }]}
          >
            <CoinCard
              iconBg="#D97706"
              iconName="gift"
              title="Promo Coins"
              subtitle="Limited time — max 20% per order"
              amount={promoAmount}
              isHidden={isHidden}
            >
              {promoExpiryDays !== null && !isHidden && (
                <Text style={styles.expiryText}>
                  Expires in {promoExpiryDays} day{promoExpiryDays !== 1 ? 's' : ''}
                </Text>
              )}
            </CoinCard>
          </Pressable>

          {/* Branded Coins */}
          <Pressable
            onPress={() => {
              setBrandedExpanded((v) => !v);
              onCoinPress?.('branded' as CoinType);
            }}
            style={({ pressed }) => [pressed && { opacity: 0.88 }]}
          >
            <View style={styles.coinCard}>
              <IconCircle bgColor="#4F46E5" iconName="storefront" />
              <View style={styles.coinCardCenter}>
                <View style={styles.coinCardTitleRow}>
                  <Text style={styles.coinCardTitle}>Branded Coins</Text>
                  {walletData.brandedCoins?.length > 0 && (
                    <Ionicons
                      name={brandedExpanded ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color="rgba(0,0,0,0.35)"
                      style={{ marginLeft: 4 }}
                    />
                  )}
                </View>
                <Text style={styles.coinCardSubtitle}>Store-specific rewards</Text>

                {/* Per-brand breakdown when expanded */}
                {brandedExpanded && walletData.brandedCoins?.length > 0 && (
                  <View style={styles.brandedBreakdown}>
                    {walletData.brandedCoins.map((b) => (
                      <View key={b.merchantId} style={styles.brandedRow}>
                        <Text style={styles.brandedName}>{b.merchantName}</Text>
                        <Text style={styles.brandedAmount}>
                          {isHidden ? '₹••' : `₹${b.amount.toLocaleString('en-IN')}`}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              <Text style={[styles.coinCardAmount, { color: NILE_BLUE }]}>
                {isHidden ? '₹••' : `₹${brandedTotal.toLocaleString('en-IN')}`}
              </Text>
            </View>
          </Pressable>

          {/* Cashback */}
          <View style={styles.coinCard}>
            <IconCircle bgColor="#16A34A" iconName="cash" />
            <View style={styles.coinCardCenter}>
              <Text style={styles.coinCardTitle}>Cashback</Text>
              <Text style={styles.coinCardSubtitle}>From your purchases</Text>
            </View>
            <Text style={[styles.coinCardAmount, { color: NILE_BLUE }]}>
              {isHidden ? '₹••' : `₹${cashbackBalance.toLocaleString('en-IN')}`}
            </Text>
          </View>

        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    backgroundColor: '#F4F6F9',
  },

  // ── Hero card ──────────────────────────────────────────────────────────────
  heroCard: {
    width: '100%',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
    overflow: 'hidden',
    position: 'relative',
  },
  glowOverlay: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  glowOverlayBottomLeft: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(212,175,55,0.07)',
  },

  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  heroLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.60)',
    fontWeight: '500',
    letterSpacing: 1.1,
  },
  eyeButton: {
    padding: 2,
  },

  heroBalance: {
    color: '#FFFFFF',
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -1,
    includeFontPadding: false,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.50)',
    fontWeight: '400',
    marginBottom: 24,
  },

  // ── Action buttons ──────────────────────────────────────────────────────────
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtnFilled: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 25,
    backgroundColor: NILE_BLUE,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
    }),
  },
  actionBtnFilledText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  actionBtnOutlined: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 25,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: NILE_BLUE,
  },
  actionBtnOutlinedText: {
    color: NILE_BLUE,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // ── Breakdown section ───────────────────────────────────────────────────────
  breakdownContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },

  // ── Individual coin card ────────────────────────────────────────────────────
  coinCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: NILE_BLUE,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },

  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  coinCardCenter: {
    flex: 1,
  },
  coinCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  coinCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.1,
  },
  coinCardSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
    letterSpacing: 0.1,
  },
  coinCardAmount: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.1,
    flexShrink: 0,
  },

  // ── Premium badge ───────────────────────────────────────────────────────────
  premiumBadge: {
    marginLeft: 6,
    backgroundColor: '#B8860B',
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  premiumBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.6,
  },

  // ── Promo expiry ─────────────────────────────────────────────────────────────
  expiryText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#D97706',
    marginTop: 3,
  },

  // ── Branded breakdown ────────────────────────────────────────────────────────
  brandedBreakdown: {
    marginTop: 8,
    gap: 6,
  },
  brandedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandedName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  brandedAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
});

export default BalanceDisplay;
