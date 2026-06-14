/**
 * MerchantLoyaltyCard
 *
 * Phase 1.4 — Visit Progress Visualization
 * Card showing: merchant name/logo, tier badge (Bronze/Silver/Gold/Platinum),
 * visit count, coin multiplier, progress to next tier.
 */

import React from 'react';
import {
  View,
  StyleSheet,
  Image,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import VisitProgressBar, { TierName } from './VisitProgressBar';

// ============================================================================
// TYPES
// ============================================================================

export interface MerchantLoyaltyCardProps {
  merchantName: string;
  merchantLogo?: string;
  tier: TierName;
  visitCount: number;
  multiplier: number;       // e.g. 1.5 = 1.5x coins
  progress: number;         // 0–1 fraction toward next tier
  nextTierAt: number;       // visit count required for next tier
}

// ============================================================================
// HELPERS
// ============================================================================

// CV-14 FIX: TIER_ORDER and TIER_STYLES keys are lowercase to match backend values.
const TIER_ORDER: TierName[] = ['bronze', 'silver', 'gold', 'platinum'];

const TIER_STYLES: Record<TierName, { gradient: string[]; badge: string; text: string }> = {
  bronze:   { gradient: ['#CD7F32', '#A0522D'], badge: '#FDF0E8', text: '#A0522D' },
  silver:   { gradient: ['#B0B7BD', '#9AA7B2'], badge: '#F4F6F8', text: '#627D98' },
  gold:     { gradient: [colors.lightMustard, colors.brand.goldRich], badge: colors.tint.amber, text: colors.brand.amberDark },
  platinum: { gradient: ['#B2DFDB', '#80CBC4'], badge: '#E0F2F1', text: '#00796B' },
};

function getNextTier(tier: TierName): TierName {
  const idx = TIER_ORDER.indexOf(tier);
  return TIER_ORDER[Math.min(idx + 1, TIER_ORDER.length - 1)];
}

// ============================================================================
// COMPONENT
// ============================================================================

const MerchantLoyaltyCard: React.FC<MerchantLoyaltyCardProps> = ({
  merchantName,
  merchantLogo,
  tier,
  visitCount,
  multiplier,
  progress,
  nextTierAt,
}) => {
  const tierStyle = TIER_STYLES[tier];
  const nextTier = getNextTier(tier);
  const isPlatinum = tier === 'platinum';
  const requiredVisits = nextTierAt;
  const currentVisits = Math.round(progress * requiredVisits);

  return (
    <View style={styles.container}>
      {/* Header row */}
      <View style={styles.header}>
        {/* Merchant logo or initial */}
        <View style={styles.logoWrapper}>
          {merchantLogo ? (
            <Image
              source={{ uri: merchantLogo }}
              style={styles.logo}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.logoFallback, { backgroundColor: tierStyle.badge }]}>
              <ThemedText style={[styles.logoInitial, { color: tierStyle.text }]}>
                {merchantName.charAt(0).toUpperCase()}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Merchant info */}
        <View style={styles.merchantInfo}>
          <ThemedText style={styles.merchantName} numberOfLines={1}>
            {merchantName}
          </ThemedText>
          <View style={styles.visitRow}>
            <Ionicons name="location-outline" size={12} color={colors.gray[400]} />
            <ThemedText style={styles.visitCountText}>
              {visitCount} {visitCount === 1 ? 'visit' : 'visits'}
            </ThemedText>
          </View>
        </View>

        {/* Tier badge */}
        <View style={[styles.tierBadge, { backgroundColor: tierStyle.badge }]}>
          <ThemedText style={[styles.tierText, { color: tierStyle.text }]}>
            {tier}
          </ThemedText>
        </View>
      </View>

      {/* Multiplier row */}
      <View style={styles.multiplierRow}>
        <View style={styles.multiplierChip}>
          <Ionicons name="flash" size={14} color={colors.lightMustard} />
          <ThemedText style={styles.multiplierText}>
            {multiplier}x coins on every visit
          </ThemedText>
        </View>
      </View>

      {/* Progress bar (hidden for Platinum — max tier) */}
      {!isPlatinum && (
        <VisitProgressBar
          currentVisits={currentVisits}
          requiredVisits={requiredVisits}
          currentTier={tier}
          nextTier={nextTier}
          merchantName={merchantName}
        />
      )}

      {isPlatinum && (
        <View style={styles.platinumBanner}>
          <ThemedText style={styles.platinumText}>
            💎 You've reached the highest tier at {merchantName}
          </ThemedText>
        </View>
      )}
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    borderRadius: 18,
    padding: 16,
    gap: 12,
    shadowColor: colors.nileBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoWrapper: {
    flexShrink: 0,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  logoFallback: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInitial: {
    fontSize: 22,
    fontWeight: '700',
  },
  merchantInfo: {
    flex: 1,
    gap: 3,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  visitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  visitCountText: {
    fontSize: 12,
    color: colors.gray[500],
  },
  tierBadge: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    flexShrink: 0,
  },
  tierText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  multiplierRow: {
    flexDirection: 'row',
  },
  multiplierChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.background.dark,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  multiplierText: {
    fontSize: 12,
    color: colors.lightMustard,
    fontWeight: '600',
  },
  platinumBanner: {
    backgroundColor: '#E0F2F1',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  platinumText: {
    fontSize: 13,
    color: colors.tealGreen,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default React.memo(MerchantLoyaltyCard);
