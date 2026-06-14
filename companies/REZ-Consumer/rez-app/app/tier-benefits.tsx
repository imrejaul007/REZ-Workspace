/**
 * Tier Benefits Screen
 *
 * Shows all REZ Score tiers with their benefits.
 * Current user's tier is highlighted/expanded; locked tiers are grayed out.
 * Also shows tips to improve the REZ Score.
 */

import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Animated, StatusBar } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getScore } from '@/services/rezScoreApi';
import { colors } from '@/constants/theme';
import { shareAchievement } from '@/utils/shareAchievement';

// ============================================================================
// TIER DATA
// ============================================================================

interface TierInfo {
  name: string;
  minScore: number;
  maxScore: number;
  emoji: string;
  color: string;
  bgColor: string;
  gradientColors: [string, string];
  benefits: {
    cashbackBonus: string;
    coinMultiplier: string;
    freeDelivery: string;
    prioritySupport: boolean;
    exclusiveDeals: boolean;
    extraPerk?: string;
  };
}

const TIERS: TierInfo[] = [
  {
    name: 'Bronze',
    minScore: 0,
    maxScore: 199,
    emoji: '🥉',
    color: '#92400E',
    bgColor: '#FEF3C7',
    gradientColors: ['#D97706', '#B45309'],
    benefits: {
      cashbackBonus: '0%',
      coinMultiplier: '1x',
      freeDelivery: 'Orders above ₹500',
      prioritySupport: false,
      exclusiveDeals: false,
    },
  },
  {
    name: 'Silver',
    minScore: 200,
    maxScore: 399,
    emoji: '🥈',
    color: '#374151',
    bgColor: '#F3F4F6',
    gradientColors: ['#6B7280', '#374151'],
    benefits: {
      cashbackBonus: '2%',
      coinMultiplier: '1.5x',
      freeDelivery: 'Orders above ₹300',
      prioritySupport: false,
      exclusiveDeals: false,
      extraPerk: 'Monthly scratch card',
    },
  },
  {
    name: 'Gold',
    minScore: 400,
    maxScore: 599,
    emoji: '🥇',
    color: '#92400E',
    bgColor: '#FFFBEB',
    gradientColors: ['#F59E0B', '#D97706'],
    benefits: {
      cashbackBonus: '5%',
      coinMultiplier: '2x',
      freeDelivery: 'Orders above ₹200',
      prioritySupport: false,
      exclusiveDeals: true,
      extraPerk: 'Weekly bonus coins',
    },
  },
  {
    name: 'Platinum',
    minScore: 600,
    maxScore: 799,
    emoji: '💎',
    color: '#1D4ED8',
    bgColor: '#EFF6FF',
    gradientColors: ['#2563EB', '#1D4ED8'],
    benefits: {
      cashbackBonus: '8%',
      coinMultiplier: '3x',
      freeDelivery: 'All orders',
      prioritySupport: true,
      exclusiveDeals: true,
      extraPerk: 'Priority queue at stores',
    },
  },
  {
    name: 'Diamond',
    minScore: 800,
    maxScore: 1000,
    emoji: '👑',
    color: '#6D28D9',
    bgColor: '#F5F3FF',
    gradientColors: ['#7C3AED', '#6D28D9'],
    benefits: {
      cashbackBonus: '12%',
      coinMultiplier: '5x',
      freeDelivery: 'All orders + express',
      prioritySupport: true,
      exclusiveDeals: true,
      extraPerk: 'Dedicated account manager',
    },
  },
];

const IMPROVEMENT_TIPS = [
  { icon: 'storefront-outline' as const, tip: 'Visit stores daily to earn streak bonuses', boost: '+5 pts/day' },
  { icon: 'person-outline' as const, tip: 'Complete your profile to 100%', boost: '+50 pts' },
  { icon: 'bag-handle-outline' as const, tip: 'Make regular purchases at partner stores', boost: '+2 pts/purchase' },
  { icon: 'star-outline' as const, tip: 'Leave reviews after purchases', boost: '+3 pts/review' },
  { icon: 'people-outline' as const, tip: 'Refer friends who make their first purchase', boost: '+20 pts/referral' },
  { icon: 'qr-code-outline' as const, tip: "Scan QR at new stores you haven't visited", boost: '+10 pts/new store' },
];

// ============================================================================
// TIER CARD
// ============================================================================

function TierCard({
  tier,
  isCurrentTier,
  isLocked,
  currentScore,
}: {
  tier: TierInfo;
  isCurrentTier: boolean;
  isLocked: boolean;
  currentScore: number;
}) {
  const scaleAnim = useRef(new Animated.Value(isCurrentTier ? 1 : 0.96)).current;

  useEffect(() => {
    if (isCurrentTier) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 12,
        stiffness: 100,
      }).start();
    }
  }, [isCurrentTier, scaleAnim]);

  const { benefits } = tier;

  return (
    <Animated.View
      style={[
        cardStyles.wrapper,
        isLocked && cardStyles.wrapperLocked,
        isCurrentTier && cardStyles.wrapperCurrent,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      {isCurrentTier && (
        <View style={cardStyles.currentBadge}>
          <Text style={cardStyles.currentBadgeText}>YOUR TIER</Text>
        </View>
      )}

      {/* Share button — visible on all earned (non-locked) tiers */}
      {!isLocked && (
        <Pressable
          style={cardStyles.shareBtn}
          onPress={() => shareAchievement(`${tier.name} Tier`, currentScore)}
          hitSlop={8}
          accessibilityLabel={`Share ${tier.name} tier achievement`}
          accessibilityRole="button"
        >
          <Ionicons
            name="share-social-outline"
            size={16}
            color={isCurrentTier ? colors.brand.purple : colors.text.secondary}
          />
        </Pressable>
      )}

      {/* Header */}
      <LinearGradient
        colors={isLocked ? ['#D1D5DB', '#9CA3AF'] : tier.gradientColors}
        style={cardStyles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={cardStyles.emoji}>{tier.emoji}</Text>
        <View>
          <Text style={cardStyles.tierName}>{tier.name}</Text>
          <Text style={cardStyles.scoreRange}>
            {tier.minScore} – {tier.maxScore} pts
          </Text>
        </View>
        {isLocked && (
          <View style={cardStyles.lockBadge}>
            <Ionicons name="lock-closed" size={14} color="#6B7280" />
            <Text style={cardStyles.lockText}>Locked</Text>
          </View>
        )}
      </LinearGradient>

      {/* Benefits list */}
      <View style={[cardStyles.benefitsWrap, isLocked && cardStyles.benefitsLocked]}>
        <BenefitRow icon="cash-outline" label="Cashback Bonus" value={benefits.cashbackBonus} locked={isLocked} />
        <BenefitRow icon="logo-bitcoin" label="Coin Multiplier" value={benefits.coinMultiplier} locked={isLocked} />
        <BenefitRow icon="bicycle-outline" label="Free Delivery" value={benefits.freeDelivery} locked={isLocked} />
        <BenefitRow
          icon="headset-outline"
          label="Priority Support"
          value={benefits.prioritySupport ? 'Yes' : 'No'}
          positive={benefits.prioritySupport}
          negative={!benefits.prioritySupport}
          locked={isLocked}
        />
        <BenefitRow
          icon="pricetag-outline"
          label="Exclusive Deals"
          value={benefits.exclusiveDeals ? 'Unlocked' : 'Not available'}
          positive={benefits.exclusiveDeals}
          negative={!benefits.exclusiveDeals}
          locked={isLocked}
        />
        {benefits.extraPerk && (
          <BenefitRow icon="gift-outline" label="Perk" value={benefits.extraPerk} positive locked={isLocked} />
        )}
      </View>
    </Animated.View>
  );
}

function BenefitRow({
  icon,
  label,
  value,
  positive,
  negative,
  locked,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  positive?: boolean;
  negative?: boolean;
  locked: boolean;
}) {
  const valueColor = locked ? colors.gray[400] : positive ? '#16A34A' : negative ? '#DC2626' : colors.text.primary;
  return (
    <View style={cardStyles.benefitRow}>
      <Ionicons name={icon} size={16} color={locked ? colors.gray[400] : colors.nileBlue} />
      <Text style={[cardStyles.benefitLabel, locked && cardStyles.textLocked]}>{label}</Text>
      <Text style={[cardStyles.benefitValue, { color: valueColor }, locked && cardStyles.textLocked]}>{value}</Text>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  wrapper: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  wrapperLocked: {
    opacity: 0.65,
  },
  wrapperCurrent: {
    borderColor: colors.brand.purple,
    borderWidth: 2.5,
    shadowColor: colors.brand.purple,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  currentBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.brand.purple,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 12,
    zIndex: 10,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  emoji: { fontSize: 32 },
  tierName: { fontSize: 20, fontWeight: '900', color: '#fff' },
  scoreRange: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 'auto',
  },
  lockText: { fontSize: 11, fontWeight: '600', color: '#6B7280' },
  shareBtn: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    zIndex: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitsWrap: {
    padding: 14,
    gap: 10,
  },
  benefitsLocked: {
    opacity: 0.7,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitLabel: {
    fontSize: 13,
    color: colors.text.secondary,
    flex: 1,
  },
  benefitValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  textLocked: {
    color: colors.gray[400],
  },
});

// ============================================================================
// IMPROVEMENT TIP
// ============================================================================

function ImprovementTip({ icon, tip, boost }: { icon: keyof typeof Ionicons.glyphMap; tip: string; boost: string }) {
  return (
    <View style={tipStyles.row}>
      <View style={tipStyles.iconWrap}>
        <Ionicons name={icon} size={18} color={colors.nileBlue} />
      </View>
      <Text style={tipStyles.tip}>{tip}</Text>
      <View style={tipStyles.boostBadge}>
        <Text style={tipStyles.boostText}>{boost}</Text>
      </View>
    </View>
  );
}

const tipStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray[200],
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.tint.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tip: {
    flex: 1,
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  boostBadge: {
    backgroundColor: colors.successScale[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  boostText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.successScale[700],
  },
});

// ============================================================================
// MAIN SCREEN
// ============================================================================

export default function TierBenefitsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    data: scoreData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['rez-score'],
    queryFn: getScore,
    staleTime: 1000 * 60 * 10,
  });

  const currentScore = scoreData?.score ?? 0;

  const getCurrentTierName = (score: number): string => {
    const tier = TIERS.slice()
      .reverse()
      .find((t) => score >= t.minScore);
    return tier?.name ?? 'Bronze';
  };

  const currentTierName = getCurrentTierName(currentScore);

  return (
    <View style={[styles.screen]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.nileBlue} />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <LinearGradient colors={[colors.nileBlue, '#2A5577']} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={8} accessibilityLabel="Go back" accessibilityRole="button">
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Tier Benefits</Text>
          <Pressable
            onPress={() => router.push('/rez-score' as unknown as string)}
            hitSlop={8}
            accessibilityLabel="View REZ Score"
            accessibilityRole="button"
          >
            <Ionicons name="speedometer-outline" size={22} color="#fff" />
          </Pressable>
        </View>

        {/* REZ Score summary in header */}
        {isLoading ? (
          <ActivityIndicator color="#fff" style={{ marginTop: 12, marginBottom: 8 }} />
        ) : scoreData ? (
          <View style={styles.scoreSummary}>
            <View>
              <Text style={styles.scoreLabel}>Your REZ Score</Text>
              <Text style={styles.scoreValue}>{scoreData.score}</Text>
            </View>
            <View style={styles.tierBadge}>
              <Text style={styles.tierBadgeText}>{currentTierName}</Text>
            </View>
          </View>
        ) : null}
      </LinearGradient>

      {/* Error state */}
      {isError && (
        <View style={styles.errorWrap}>
          <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
          <Text style={styles.errorText}>Could not load your score.</Text>
          <Pressable onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      )}

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Section: Tiers */}
        <Text style={styles.sectionTitle}>All Tiers</Text>
        <View style={styles.tiersContainer}>
          {TIERS.map((tier) => {
            const isCurrent = tier.name === currentTierName;
            const isLocked = !isLoading && scoreData != null && currentScore < tier.minScore;
            return (
              <TierCard
                key={tier.name}
                tier={tier}
                isCurrentTier={isCurrent}
                isLocked={isLocked}
                currentScore={currentScore}
              />
            );
          })}
        </View>

        {/* Section: How to improve */}
        <View style={styles.improveSection}>
          <Text style={styles.sectionTitle}>How to Improve Your Score</Text>
          <View style={styles.tipsCard}>
            {IMPROVEMENT_TIPS.map((tip, idx) => (
              <ImprovementTip key={idx} icon={tip.icon} tip={tip.tip} boost={tip.boost} />
            ))}
          </View>
        </View>

        {/* CTA to full REZ Score screen */}
        <Pressable
          style={styles.scoreCta}
          onPress={() => router.push('/rez-score' as unknown as string)}
          accessibilityLabel="View full REZ Score details"
          accessibilityRole="button"
        >
          <Ionicons name="speedometer-outline" size={20} color={colors.nileBlue} />
          <Text style={styles.scoreCtaText}>View Full REZ Score Breakdown</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.nileBlue} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  scoreSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  scoreLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 42,
  },
  tierBadge: {
    backgroundColor: colors.lightMustard,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tierBadgeText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.nileBlue,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 4,
    marginTop: 8,
  },
  tiersContainer: {
    gap: 14,
  },
  improveSection: {
    marginTop: 8,
    gap: 8,
  },
  tipsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 4,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  scoreCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.lightMustard,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginTop: 8,
  },
  scoreCtaText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.nileBlue,
  },
  errorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 16,
    padding: 14,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
  },
  errorText: {
    fontSize: 13,
    color: colors.error,
    flex: 1,
  },
  retryBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: colors.error,
    borderRadius: 8,
  },
  retryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
});
