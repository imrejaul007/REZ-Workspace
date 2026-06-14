// @ts-nocheck
import { withErrorBoundary } from '@/utils/withErrorBoundary';
/**
 * Merchant Loyalty Tier Progress Screen
 * Shows the store's Bronze → Silver → Gold → Platinum loyalty program,
 * the user's current tier, cumulative spend, and spend needed to level up.
 *
 * Accessible from the loyalty hub within a store's category page.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import apiClient from '@/services/apiClient';
import { useIsMounted } from '@/hooks/useIsMounted';
import { useGetCurrencySymbol } from '@/stores/selectors';
import { getCategoryTheme } from '@/config/categoryThemeConfig';
import { Colors, Spacing, BorderRadius } from '@/constants/DesignSystem';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TierLevel {
  name: string;
  minCumulativeSpend: number;
  coinMultiplier: number;
  perks: string[];
  color: string;
  icon: string;
}

interface TierProgress {
  cumulativeSpend: number;
  currentTier: TierLevel | null;
  nextTier: (TierLevel & { minCumulativeSpend: number }) | null;
  spendToNextTier: number;
  progressPercent: number;
}

interface LoyaltyProgram {
  programName: string;
  storeId: string;
  storeName: string;
  tiers: TierLevel[];
}

interface LoyaltyData {
  program: LoyaltyProgram;
  userProgress: TierProgress | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

function getTierGradient(color: string): [string, string] {
  // Map tier colour to a subtle gradient pair
  if (color.startsWith('#FFD')) return ['#FFF9C4', '#FFF176']; // Gold
  if (color.startsWith('#C0C')) return ['#F5F5F5', '#E0E0E0']; // Silver
  if (color.startsWith('#E5E')) return ['#F0F0F0', '#BDBDBD']; // Platinum
  return ['#EFEBE9', '#D7CCC8']; // Bronze default
}

// ─── Tier Card ────────────────────────────────────────────────────────────────

function TierCard({
  tier,
  isCurrentTier,
  isUnlocked,
  index,
}: {
  tier: TierLevel;
  isCurrentTier: boolean;
  isUnlocked: boolean;
  index: number;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
      <View style={[styles.tierCard, isCurrentTier ? styles.tierCardActive : null]}>
        {isCurrentTier && (
          <View style={styles.currentBadge}>
            <Text style={styles.currentBadgeText}>YOUR TIER</Text>
          </View>
        )}

        {/* Tier header */}
        <View style={styles.tierHeader}>
          <View style={[styles.tierIconCircle, { backgroundColor: `${tier.color}22` }]}>
            <Text style={styles.tierIconText}>{tier.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.tierName, { color: tier.color }]}>{tier.name}</Text>
            <Text style={styles.tierThreshold}>
              {tier.minCumulativeSpend === 0
                ? 'Entry tier — free to join'
                : `From ${formatCurrency(tier.minCumulativeSpend)} total spend`}
            </Text>
          </View>
          <View style={styles.multiplierBadge}>
            <Text style={styles.multiplierText}>{tier.coinMultiplier}x</Text>
            <Text style={styles.multiplierLabel}>coins</Text>
          </View>
        </View>

        {/* Perks */}
        {tier.perks.length > 0 && (
          <View style={styles.perksList}>
            {tier.perks.map((perk, i) => (
              <View key={i} style={styles.perkRow}>
                <Ionicons
                  name={isUnlocked ? 'checkmark-circle' : 'lock-closed-outline'}
                  size={14}
                  color={isUnlocked ? '#059669' : '#9CA3AF'}
                />
                <Text style={[styles.perkText, !isUnlocked ? styles.perkTextLocked : null]}>{perk}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

// ─── Progress Section ─────────────────────────────────────────────────────────

function UserProgressSection({ progress, tiers }: { progress: TierProgress; tiers: TierLevel[] }) {
  const sortedTiers = [...tiers].sort((a, b) => a.minCumulativeSpend - b.minCumulativeSpend);
  const currentIdx = sortedTiers.findIndex((t) => t.name === progress.currentTier?.name);
  const isTopTier = !progress.nextTier;

  return (
    <View style={styles.progressCard}>
      <View style={styles.progressHeader}>
        <View>
          <Text style={styles.progressLabel}>Your total spend</Text>
          <Text style={styles.progressSpend}>{formatCurrency(progress.cumulativeSpend)}</Text>
        </View>
        {progress.currentTier && (
          <View style={[styles.currentTierChip, { borderColor: progress.currentTier.color }]}>
            <Text style={styles.currentTierIcon}>{progress.currentTier.icon}</Text>
            <Text style={[styles.currentTierName, { color: progress.currentTier.color }]}>
              {progress.currentTier.name}
            </Text>
          </View>
        )}
      </View>

      {/* Progress bar across tiers */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${progress.progressPercent}%` }]} />
        </View>
        <View style={styles.tierDots}>
          {sortedTiers.map((tier, idx) => (
            <View
              key={tier.name}
              style={[styles.tierDot, { backgroundColor: idx <= currentIdx ? tier.color : '#E5E7EB' }]}
            />
          ))}
        </View>
      </View>

      {/* Next tier info */}
      {isTopTier ? (
        <View style={styles.topTierMsg}>
          <Ionicons name="trophy" size={18} color="#F59E0B" />
          <Text style={styles.topTierText}>You've reached the highest tier! 🎉</Text>
        </View>
      ) : (
        <Text style={styles.nextTierHint}>
          Spend <Text style={styles.nextTierAmount}>{formatCurrency(progress.spendToNextTier)}</Text> more to reach{' '}
          <Text style={{ fontWeight: '700' }}>
            {progress.nextTier?.icon} {progress.nextTier?.name}
          </Text>
        </Text>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

function TierProgressScreen() {
  const isMounted = useIsMounted();
  const router = useRouter();
  const { slug, storeId } = useLocalSearchParams<unknown>();
  const theme = getCategoryTheme(slug || 'food');
  const getCurrencySymbol = useGetCurrencySymbol();

  const [data, setData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (!storeId) {
        setLoading(false);
        return;
      }
      try {
        // eslint-disable-next-line no-unused-expressions
        isRefresh ? setRefreshing(true) : setLoading(true);
        const res = await apiClient.get<LoyaltyData>(`/stores/${storeId}/loyalty-program`);
        if (!isMounted()) return;
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch {
        // silently handle
      } finally {
        if (!isMounted()) return;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [storeId, isMounted],
  );

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const sortedTiers = data ? [...data.program.tiers].sort((a, b) => a.minCumulativeSpend - b.minCumulativeSpend) : [];

  const currentTierName = data?.userProgress?.currentTier?.name;
  const currentTierIdx = sortedTiers.findIndex((t) => t.name === currentTierName);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={[(theme as unknown).primary, (theme as unknown).secondary || (theme as unknown).primary]}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{data?.program.programName || 'Loyalty Program'}</Text>
          <Text style={styles.headerSubtitle}>{data?.program.storeName || ''}</Text>
        </View>
        <Ionicons name="trophy-outline" size={24} color="#fff" />
      </LinearGradient>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={(theme as unknown).primary} />
        </View>
      ) : !data ? (
        <View style={styles.loader}>
          <Ionicons name="alert-circle-outline" size={40} color="#9CA3AF" />
          <Text style={{ marginTop: 12, color: '#6B7280' }}>No loyalty program found for this store.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} />}
          showsVerticalScrollIndicator={false}
        >
          {/* User Progress Card — only if logged in */}
          {data.userProgress ? (
            <UserProgressSection progress={data.userProgress} tiers={data.program.tiers} />
          ) : (
            <View style={styles.loginPrompt}>
              <Ionicons name="person-circle-outline" size={32} color="#1a3a52" />
              <Text style={styles.loginPromptText}>Sign in to see your tier progress and earn rewards.</Text>
            </View>
          )}

          {/* All Tiers */}
          <Text style={styles.sectionTitle}>All Tiers</Text>
          {sortedTiers.map((tier, idx) => (
            <TierCard
              key={tier.name}
              tier={tier}
              isCurrentTier={tier.name === currentTierName}
              isUnlocked={idx <= currentTierIdx || currentTierIdx === -1}
              index={idx}
            />
          ))}

          {/* How it works note */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color="#1a3a52" style={{ marginRight: 6 }} />
            <Text style={styles.infoText}>
              Tier progress is calculated from your total spend at this store. Coins earned are automatically multiplied
              by your tier rate.
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, paddingBottom: 20 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12, marginTop: 8 },

  // Progress card
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  progressLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  progressSpend: { fontSize: 26, fontWeight: '800', color: '#111827' },
  currentTierChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  currentTierIcon: { fontSize: 16 },
  currentTierName: { fontSize: 14, fontWeight: '700' },
  progressBarContainer: { marginBottom: 12 },
  progressBarTrack: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressBarFill: { height: 8, backgroundColor: '#1a3a52', borderRadius: 4 },
  tierDots: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 },
  tierDot: { width: 10, height: 10, borderRadius: 5 },
  topTierMsg: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  topTierText: { fontSize: 14, color: '#F59E0B', fontWeight: '600' },
  nextTierHint: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  nextTierAmount: { color: '#1a3a52', fontWeight: '700' },

  // Tier card
  tierCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  tierCardActive: { borderColor: '#1a3a52', borderWidth: 2 },
  currentBadge: {
    position: 'absolute',
    top: -1,
    right: 16,
    backgroundColor: '#1a3a52',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  currentBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.8 },
  tierHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  tierIconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  tierIconText: { fontSize: 22 },
  tierName: { fontSize: 16, fontWeight: '700' },
  tierThreshold: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  multiplierBadge: {
    alignItems: 'center',
    backgroundColor: '#e8f0f7',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  multiplierText: { fontSize: 16, fontWeight: '800', color: '#1a3a52' },
  multiplierLabel: { fontSize: 10, color: '#1a3a52', marginTop: -2 },
  perksList: { gap: 6 },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  perkText: { fontSize: 13, color: '#374151', flex: 1 },
  perkTextLocked: { color: '#9CA3AF' },

  // Login prompt
  loginPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#e8f0f7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  loginPromptText: { flex: 1, fontSize: 13, color: '#374151' },

  // Info box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e8f0f7',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  infoText: { flex: 1, fontSize: 12, color: '#374151', lineHeight: 18 },
});

export default withErrorBoundary(TierProgressScreen, 'TierProgressScreen');
