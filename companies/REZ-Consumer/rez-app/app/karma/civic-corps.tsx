/**
 * NBKC Home — Namma Bengaluru Karma Corps landing screen
 * Shows member dashboard or join CTA based on membership status.
 */

import { withErrorBoundary } from '@/utils/withErrorBoundary';
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import { NBKCHeader } from './civic-corps/_layout';
import { useIsAuthenticated } from '@/stores/selectors';
import * as nbkcService from '@/services/nbkcService';
import { showAlert } from '@/utils/alert';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import type { NBKCStatus, NBKCMission } from '@/types/entities/nbkc';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── TIER CONFIG ────────────────────────────────────────────────────────────────

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  citizen: { label: 'Citizen', color: '#22C55E', bg: '#DCFCE7', icon: 'person' },
  active: { label: 'Active', color: '#3B82F6', bg: '#DBEAFE', icon: 'shield-checkmark' },
  civic_leader: { label: 'Civic Leader', color: '#8B5CF6', bg: '#EDE9FE', icon: 'medal' },
  ambassador: { label: 'Ambassador', color: '#F59E0B', bg: '#FEF3C7', icon: 'star' },
};

const CATEGORY_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  environment: { icon: 'leaf', color: '#22C55E', bg: '#DCFCE7' },
  water: { icon: 'water', color: '#3B82F6', bg: '#DBEAFE' },
  waste: { icon: 'trash', color: '#F97316', bg: '#FFF7ED' },
  civic: { icon: 'construct', color: '#8B5CF6', bg: '#EDE9FE' },
  community: { icon: 'people', color: '#EC4899', bg: '#FCE7F3' },
};

// ── MEMBER DASHBOARD ───────────────────────────────────────────────────────────

function MemberDashboard({ status }: { status: NBKCStatus }) {
  const router = useRouter();
  const { membership, greenScore, greenBengaluruScore } = status;
  if (!membership) return null;

  const tierCfg = TIER_CONFIG[membership.tier] ?? TIER_CONFIG.citizen;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      {/* Member Card */}
      <View style={styles.memberCard}>
        <View style={styles.memberCardHeader}>
          <View>
            <Text style={styles.memberCardTitle}>NBKC Member</Text>
            <Text style={styles.memberCardSubtitle}>{membership.memberNumber}</Text>
          </View>
          <View style={[styles.tierBadge, { backgroundColor: tierCfg.bg }]}>
            <Ionicons name={tierCfg.icon as unknown} size={16} color={tierCfg.color} />
            <Text style={[styles.tierLabel, { color: tierCfg.color }]}>{tierCfg.label}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{membership.totalCivicHours.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Civic Hours</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{membership.missionsCompleted}</Text>
            <Text style={styles.statLabel}>Missions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{Math.round(greenScore)}</Text>
            <Text style={styles.statLabel}>Green Score</Text>
          </View>
        </View>

        {membership.stickerIssued && (
          <View style={styles.stickerRow}>
            <Ionicons name="checkmark-circle" size={16} color="#059669" />
            <Text style={styles.stickerText}>Vehicle sticker issued</Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        <Pressable style={styles.actionCard} onPress={() => router.push('/karma/civic-corps/missions')}>
          <View style={[styles.actionIcon, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="map" size={22} color="#22C55E" />
          </View>
          <Text style={styles.actionLabel}>Find Missions</Text>
        </Pressable>
        <Pressable style={styles.actionCard} onPress={() => router.push('/karma/civic-corps/leaderboard')}>
          <View style={[styles.actionIcon, { backgroundColor: '#DBEAFE' }]}>
            <Ionicons name="trophy" size={22} color="#3B82F6" />
          </View>
          <Text style={styles.actionLabel}>Leaderboard</Text>
        </Pressable>
        <Pressable style={styles.actionCard} onPress={() => router.push('/karma/civic-corps/join')}>
          <View style={[styles.actionIcon, { backgroundColor: '#EDE9FE' }]}>
            <Ionicons name="add-circle" size={22} color="#8B5CF6" />
          </View>
          <Text style={styles.actionLabel}>Green Action</Text>
        </Pressable>
      </View>

      {/* Perks */}
      {membership.perks.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Your Perks</Text>
          <View style={styles.perksCard}>
            {membership.perks.map((perk, i) => (
              <View key={i} style={styles.perkRow}>
                <Ionicons name="checkmark-circle" size={16} color="#059669" />
                <Text style={styles.perkText}>{perk}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

// ── NON-MEMBER CTA ─────────────────────────────────────────────────────────────

function NonMemberCTA({ onJoin }: { onJoin: () => void }) {
  return (
    <View style={styles.ctaContainer}>
      <View style={styles.ctaIcon}>
        <Ionicons name="leaf" size={48} color="#059669" />
      </View>
      <Text style={styles.ctaTitle}>Namma Bengaluru Karma Corps</Text>
      <Text style={styles.ctaSubtitle}>Join the movement to make Bengaluru greener and cleaner</Text>
      <View style={styles.ctaFeatures}>
        {[
          { icon: 'checkmark-circle', text: 'Earn karma through civic action' },
          { icon: 'checkmark-circle', text: 'Track your green impact score' },
          { icon: 'checkmark-circle', text: 'Unlock vehicle stickers & perks' },
          { icon: 'checkmark-circle', text: 'Join the ward leaderboard' },
        ].map((f, i) => (
          <View key={i} style={styles.ctaFeature}>
            <Ionicons name={f.icon as unknown} size={18} color="#059669" />
            <Text style={styles.ctaFeatureText}>{f.text}</Text>
          </View>
        ))}
      </View>
      <Pressable style={styles.joinButton} onPress={onJoin}>
        <LinearGradient colors={['#047857', '#059669', '#10B981']} style={styles.joinButtonGradient}>
          <Text style={styles.joinButtonText}>Join NBKC — It's Free</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

// ── MAIN SCREEN ────────────────────────────────────────────────────────────────

function CivicCorpsScreen() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const [status, setStatus] = useState<NBKCStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      const res = await nbkcService.getCivicCorpsStatus();
      if (res.success && res.data) {
        setStatus(res.data);
      }
    } catch (e) {
      setError('Failed to load NBKC status');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      fetchStatus();
    }, [fetchStatus]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStatus();
  }, [fetchStatus]);

  const handleJoin = () => {
    router.push('/karma/civic-corps/join');
  };

  return (
    <View style={styles.container}>
      <NBKCHeader title="NBKC" subtitle="Namma Bengaluru Karma Corps" />
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : !isAuthenticated ? (
        <View style={styles.centered}>
          <Ionicons name="lock-closed" size={48} color="#9CA3AF" />
          <Text style={styles.authPrompt}>Sign in to join NBKC</Text>
        </View>
      ) : (
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669">
          {status?.isMember ? <MemberDashboard status={status} /> : <NonMemberCTA onJoin={handleJoin} />}
        </RefreshControl>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.secondary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.base },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.base },
  authPrompt: { ...Typography.body, color: colors.text.secondary, marginTop: Spacing.sm },
  bottomPadding: { height: 40 },
  // Member card
  memberCard: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  memberCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.base,
  },
  memberCardTitle: { ...Typography.h4, color: '#065F46', fontWeight: '700' },
  memberCardSubtitle: { ...Typography.bodySmall, color: '#6B7280', marginTop: 2 },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  tierLabel: { ...Typography.bodySmall, fontWeight: '600' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: Spacing.sm },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { ...Typography.h3, color: '#065F46', fontWeight: '700' },
  statLabel: { ...Typography.bodySmall, color: '#6B7280', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#E5E7EB', marginVertical: 4 },
  stickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  stickerText: { ...Typography.bodySmall, color: '#059669', fontWeight: '500' },
  // Actions
  sectionTitle: { ...Typography.h4, color: colors.text.primary, marginBottom: Spacing.sm, marginTop: Spacing.md },
  actionsRow: { flexDirection: 'row', gap: Spacing.sm },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionLabel: { ...Typography.bodySmall, fontWeight: '500', textAlign: 'center', color: colors.text.primary },
  // Perks
  perksCard: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  perkText: { ...Typography.body, color: '#065F46', flex: 1 },
  // CTA
  ctaContainer: { flex: 1, padding: Spacing.lg, justifyContent: 'center', alignItems: 'center' },
  ctaIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  ctaTitle: { ...Typography.h3, color: '#065F46', fontWeight: '700', textAlign: 'center', marginBottom: Spacing.sm },
  ctaSubtitle: { ...Typography.body, color: '#6B7280', textAlign: 'center', marginBottom: Spacing.lg },
  ctaFeatures: { alignSelf: 'stretch', marginBottom: Spacing.lg },
  ctaFeature: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  ctaFeatureText: { ...Typography.body, color: '#374151', flex: 1 },
  joinButton: { alignSelf: 'stretch', borderRadius: BorderRadius.md, overflow: 'hidden' },
  joinButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  joinButtonText: { color: '#fff', ...Typography.h4, fontWeight: '700' },
});

export default withErrorBoundary(CivicCorpsScreen, 'NBKC');
