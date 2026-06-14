/**
 * InsightSection - 3-tile horizontal row showing wallet insights
 * Earned This Month | Spent | Top Source
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { InsightTile } from './InsightTile';
import { WalletData } from '@/types/wallet';
import { Spacing } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';

const SEGMENT_THIRD_TILE: Record<string, { label: string; icon: string; iconColor: string }> = {
  verified_student:    { label: 'Campus Rank',    icon: 'trophy-outline',       iconColor: '#F59E0B' },
  verified_employee:   { label: 'Work Perks Used', icon: 'checkmark-circle',    iconColor: '#10B981' },
  verified_healthcare: { label: 'Health Saves',   icon: 'medkit-outline',       iconColor: '#EF4444' },
  verified_defence:    { label: 'Defence Saves',  icon: 'shield-checkmark',     iconColor: '#1a3a52' },
  verified_teacher:    { label: 'Edu Savings',    icon: 'book-outline',         iconColor: '#F59E0B' },
  verified_senior:     { label: 'Senior Saves',   icon: 'heart-outline',        iconColor: '#FFC857' },
};

interface InsightSectionProps {
  walletData: WalletData;
  currencySymbol?: string;
  segment?: string;
}

export const InsightSection: React.FC<InsightSectionProps> = ({ walletData, currencySymbol = '₹', segment }) => {
  const rawEarned = walletData.savingsInsights?.thisMonth;
  const earned = Number.isFinite(rawEarned) ? rawEarned! : 0;
  const rawSaved = walletData.savingsInsights?.totalSaved;
  const totalSaved = Number.isFinite(rawSaved) ? rawSaved! : 0;
  const rawAvg = walletData.savingsInsights?.avgPerVisit;
  const avgPerVisit = Number.isFinite(rawAvg) ? rawAvg! : 0;

  const allZero = earned === 0 && totalSaved === 0 && avgPerVisit === 0;

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Wallet Insights</ThemedText>
      {allZero ? (
        <View style={styles.emptyRow}>
          <ThemedText style={styles.emptyText}>Start earning to see your insights here</ThemedText>
        </View>
      ) : (
        <View style={styles.row}>
          <InsightTile
            label="Earned This Month"
            value={`${currencySymbol}${earned.toLocaleString('en-IN')}`}
            icon="arrow-down-circle"
            iconColor={colors.successScale[700]}
            trend={earned > 0 ? 'up' : 'neutral'}
          />
          <InsightTile
            label="Total Saved"
            value={`${currencySymbol}${totalSaved.toLocaleString('en-IN')}`}
            icon="wallet"
            iconColor={colors.nileBlue}
          />
          {(() => {
            const segTile = segment ? SEGMENT_THIRD_TILE[segment] : null;
            if (segTile && avgPerVisit === 0) {
              return (
                <InsightTile
                  label={segTile.label}
                  value={`${currencySymbol}${totalSaved.toLocaleString('en-IN')}`}
                  icon={segTile.icon}
                  iconColor={segTile.iconColor}
                />
              );
            }
            if (avgPerVisit > 0) {
              return (
                <InsightTile
                  label="Avg Per Visit"
                  value={`${currencySymbol}${avgPerVisit.toLocaleString('en-IN')}`}
                  icon="analytics"
                  iconColor={colors.brand.indigo}
                />
              );
            }
            return null;
          })()}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.sm,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  emptyRow: {
    backgroundColor: colors.background?.secondary || colors.neutral[50],
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
});

export default React.memo(InsightSection);
