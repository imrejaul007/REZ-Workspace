/**
 * SavingsHero - Enhanced version that integrates with the SavingsContext
 * Shows total savings, streak, and quick access to savings dashboard
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSavings } from '@/contexts/SavingsContext';
import { formatSavings } from '@/services/savingsApi';
import { Colors, Spacing, BorderRadius } from '@/constants/DesignSystem';

const SEGMENT_SAVINGS_LABEL: Record<string, string> = {
  verified_student: 'Student Savings',
  verified_employee: 'Work Perks Saved',
  verified_healthcare: 'Healthcare Savings',
  verified_defence: 'Defence Savings',
  verified_teacher: 'Teacher Benefits',
  verified_senior: 'Senior Benefits',
  verified_government: 'Govt Benefits',
};

interface SavingsHeroProps {
  totalSaved?: number;
  thisMonth?: number;
  currencySymbol?: string;
  isHidden?: boolean;
  segment?: string;
}

export default function SavingsHero({
  totalSaved = 0,
  thisMonth = 0,
  currencySymbol = '₹',
  isHidden = false,
  segment,
}: SavingsHeroProps) {
  const router = useRouter();
  const { dashboard } = useSavings();

  // Use context data if available, otherwise use props
  const savings = dashboard?.totalSavingsAmount ?? totalSaved;
  const monthly = dashboard?.thisMonthAmount ?? thisMonth;
  const streak = dashboard?.currentStreak ?? 0;
  const streakActive = dashboard?.streakActive ?? false;

  const savingsLabel = SEGMENT_SAVINGS_LABEL[segment ?? ''] ?? 'Your Total Savings';

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.mainInfo}>
          <Text style={styles.label}>{savingsLabel}</Text>
          <Pressable
            style={styles.amountRow}
            onPress={() => router.push('/savings')}
          >
            <Text
              style={styles.amount}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.65}
            >
              {currencySymbol}{isHidden ? '****' : savings.toLocaleString()}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
          </Pressable>

          {monthly > 0 && (
            <View style={styles.pill}>
              <Text style={styles.pillText}>
                +{currencySymbol}{isHidden ? '***' : monthly.toLocaleString()} this month
              </Text>
            </View>
          )}
        </View>

        <View style={styles.stats}>
          {/* Streak Badge */}
          {streakActive && streak > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakIcon}>🔥</Text>
              <Text style={styles.streakText}>{streak}</Text>
            </View>
          )}

          {/* Quick Action */}
          <Pressable
            style={styles.actionButton}
            onPress={() => router.push('/savings')}
          >
            <Ionicons name="analytics-outline" size={18} color="#fff" />
          </Pressable>
        </View>
      </View>

      {/* Projection Preview */}
      {dashboard && (
        <View style={styles.projectionRow}>
          <View style={styles.projectionItem}>
            <Text style={styles.projectionLabel}>30D</Text>
            <Text style={styles.projectionValue}>
              {currencySymbol}{isHidden ? '***' : (dashboard.projection30Days / 100).toFixed(0)}
            </Text>
          </View>
          <View style={styles.projectionDivider} />
          <View style={styles.projectionItem}>
            <Text style={styles.projectionLabel}>90D</Text>
            <Text style={styles.projectionValue}>
              {currencySymbol}{isHidden ? '***' : (dashboard.projection90Days / 100).toFixed(0)}
            </Text>
          </View>
          <View style={styles.projectionDivider} />
          <View style={styles.projectionItem}>
            <Text style={styles.projectionLabel}>1Y</Text>
            <Text style={styles.projectionValue}>
              {currencySymbol}{isHidden ? '***' : (dashboard.projection365Days / 100).toFixed(0)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  mainInfo: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffcd57',
    marginTop: 4,
  },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  pillText: {
    fontSize: 12,
    color: '#ffcd57',
    fontWeight: '600',
  },
  stats: {
    alignItems: 'flex-end',
    gap: 8,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  streakIcon: {
    fontSize: 14,
  },
  streakText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
  },
  actionButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 20,
  },

  // Projection Row
  projectionRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  projectionItem: {
    flex: 1,
    alignItems: 'center',
  },
  projectionLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  projectionValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
    marginTop: 2,
  },
  projectionDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 8,
  },
});
