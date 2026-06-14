// @ts-nocheck
/**
 * Karma My Karma Screen
 * User's karma level, progress, badges, and conversion history.
 */

import { withErrorBoundary } from '@/utils/withErrorBoundary';
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import QRCode from 'react-native-qrcode-svg';
import { KarmaHeader } from './_layout';
import karmaService, { KarmaProfile, EarnRecord } from '@/services/karmaService';
import { useIsAuthenticated } from '@/stores/selectors';
import { useAuthStore } from '@/stores/authStore';
import { useIsMounted } from '@/hooks/useIsMounted';
import { showAlert } from '@/utils/alert';
import { showToast } from '@/components/common/ToastManager';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';

const KARMA_PURPLE = '#8B5CF6';
const KARMA_GRADIENT = ['#7C3AED', '#8B5CF6', '#A78BFA'] as const;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const LEVEL_CONFIG = {
  L1: { label: 'L1', name: 'Seed', color: '#86EFAC', bg: '#DCFCE7', threshold: 0, next: 500 },
  L2: { label: 'L2', name: 'Sprout', color: '#67E8F9', bg: '#ECFEFF', threshold: 500, next: 2000 },
  L3: { label: 'L3', name: 'Bloom', color: '#FCA5A5', bg: '#FFF1F2', threshold: 2000, next: 5000 },
  L4: { label: 'L4', name: 'Tree', color: '#FCD34D', bg: '#FEF9C3', threshold: 5000, next: null },
};

const CONVERSION_RATES: Record<string, number> = {
  L1: 25,
  L2: 50,
  L3: 75,
  L4: 100,
};

// =============================================================================
// KARMA PASSPORT CARD
// =============================================================================

function qrPayload(profile: KarmaProfile): string {
  return JSON.stringify({
    u: profile.userId,
    l: profile.level,
    k: profile.activeKarma,
    t: profile.trustScore,
  });
}

const PASSPORT_BG: Record<string, readonly [string, string]> = {
  L1: ['#1a3a52', '#2A5577'],
  L2: ['#064E3B', '#059669'],
  L3: ['#7C3AED', '#A78BFA'],
  L4: ['#92400E', '#F59E0B'],
};

function PassportCard({ profile }: { profile: KarmaProfile }) {
  const authState = useAuthStore.getState().state;
  const userName = authState.user?.profile?.firstName ?? authState.user?.phoneNumber ?? 'Volunteer';
  const levelCfg = LEVEL_CONFIG[profile.level];
  const qrData = qrPayload(profile);
  const conversionRate = CONVERSION_RATES[profile.level] ?? 25;
  const bgGradient = PASSPORT_BG[profile.level] ?? PASSPORT_BG.L1;

  return (
    <View style={styles.passportCard}>
      <LinearGradient colors={bgGradient as readonly [string, string]} style={styles.passportGradient}>
        {/* Header row */}
        <View style={styles.passportHeader}>
          <View>
            <Text style={styles.passportLabel}>KARMA PASSPORT</Text>
            <Text style={styles.passportName}>{userName}</Text>
            <View style={styles.passportLevelRow}>
              <View style={[styles.passportLevelBadge, { backgroundColor: levelCfg.bg }]}>
                <Text style={[styles.passportLevelText, { color: levelCfg.color }]}>{profile.level}</Text>
              </View>
              <Text style={[styles.passportLevelName, { color: levelCfg.color }]}>{levelCfg.name}</Text>
            </View>
          </View>
          <View style={styles.passportQrWrap}>
            <QRCode value={qrData} size={80} backgroundColor="transparent" color="#ffffff" />
          </View>
        </View>

        {/* Divider */}
        <View style={styles.passportDivider} />

        {/* Stats row */}
        <View style={styles.passportStats}>
          <View style={styles.passportStat}>
            <Text style={styles.passportStatValue}>{profile.activeKarma.toLocaleString()}</Text>
            <Text style={styles.passportStatLabel}>Active Karma</Text>
          </View>
          <View style={styles.passportStatDivider} />
          <View style={styles.passportStat}>
            <Text style={styles.passportStatValue}>{conversionRate}%</Text>
            <Text style={styles.passportStatLabel}>Conversion</Text>
          </View>
          <View style={styles.passportStatDivider} />
          <View style={styles.passportStat}>
            <Text style={styles.passportStatValue}>{profile.trustScore}%</Text>
            <Text style={styles.passportStatLabel}>Trust</Text>
          </View>
          <View style={styles.passportStatDivider} />
          <View style={styles.passportStat}>
            <Text style={styles.passportStatValue}>{profile.eventsCompleted}</Text>
            <Text style={styles.passportStatLabel}>Events</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.passportFooter}>Doing Good. Build Karma. Unlock More.</Text>
      </LinearGradient>
    </View>
  );
}

// =============================================================================
// LEVEL PROGRESS BAR

// =============================================================================
// LEVEL PROGRESS BAR
// =============================================================================

function LevelProgressBar({ level }: { level: 'L1' | 'L2' | 'L3' | 'L4' }) {
  const levels: ('L1' | 'L2' | 'L3' | 'L4')[] = ['L1', 'L2', 'L3', 'L4'];
  const currentIdx = levels.indexOf(level);

  return (
    <View style={styles.progressContainer}>
      {/* Track */}
      <View style={styles.progressTrack}>
        {levels.map((lvl, idx) => {
          const cfg = LEVEL_CONFIG[lvl];
          const isActive = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          return (
            <View key={lvl} style={styles.progressStep}>
              <View
                style={[
                  styles.progressDot,
                  isActive && styles.progressDotActive,
                  isCurrent && styles.progressDotCurrent,
                  { backgroundColor: isActive ? cfg.color : colors.background.secondary },
                ]}
              >
                {isCurrent && <View style={styles.progressDotInner} />}
                {isActive && !isCurrent && <Ionicons name="checkmark" size={10} color={colors.text.inverse} />}
              </View>
              <Text style={[styles.progressLabel, isCurrent && { color: cfg.color, fontWeight: '700' }]}>
                {cfg.label}
              </Text>
            </View>
          );
        })}
        {/* Filled line segments */}
        <View style={styles.progressLines}>
          {levels.slice(0, -1).map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.progressLine,
                idx < currentIdx && styles.progressLineActive,
                idx === currentIdx && { flex: 0.5 },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

// =============================================================================
// BADGE ITEM
// =============================================================================

function BadgeItem({
  badge,
  index,
}: {
  badge: { id: string; name: string; icon?: string; earnedAt: string };
  index: number;
}) {
  const colors2 = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F', '#BB8FCE', '#85C1E9'];
  const color = colors2[index % colors2.length];
  const bgColor = color + '20';

  return (
    <View style={styles.badgeItem}>
      <View style={[styles.badgeIcon, { backgroundColor: bgColor }]}>
        <Text style={[styles.badgeEmoji]}>{badge.icon ?? '🏆'}</Text>
      </View>
      <Text style={styles.badgeName} numberOfLines={1}>
        {badge.name}
      </Text>
      <Text style={styles.badgeDate}>
        {new Date(badge.earnedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
      </Text>
    </View>
  );
}

// =============================================================================
// EARN RECORD ITEM
// =============================================================================

function EarnRecordItem({ record }: { record: EarnRecord }) {
  const statusConfig = {
    APPROVED_PENDING_CONVERSION: { label: 'Pending', color: '#F59E0B', bg: '#FFFBEB' },
    CONVERTED: { label: 'Converted', color: '#22C55E', bg: '#DCFCE7' },
    REJECTED: { label: 'Rejected', color: '#EF4444', bg: '#FEF2F2' },
    ROLLED_BACK: { label: 'Rolled Back', color: '#6B7280', bg: '#F3F4F6' },
  };
  const status = statusConfig[record.status] ?? statusConfig.APPROVED_PENDING_CONVERSION;

  return (
    <View style={styles.recordItem}>
      <View style={styles.recordLeft}>
        <View style={[styles.recordIconWrap, { backgroundColor: status.bg }]}>
          <Ionicons name={record.status === 'CONVERTED' ? 'swap-horizontal' : 'leaf'} size={18} color={status.color} />
        </View>
        <View style={styles.recordInfo}>
          <Text style={styles.recordEvent} numberOfLines={1}>
            {record.eventName ?? 'Event'}
          </Text>
          <Text style={styles.recordDate}>
            {new Date(record.createdAt).toLocaleDateString('en-IN', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </View>
      </View>
      <View style={styles.recordRight}>
        <Text style={styles.recordKarma}>+{record.karmaEarned}</Text>
        <View style={[styles.recordStatusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.recordStatusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>
    </View>
  );
}

// =============================================================================
// MAIN SCREEN
// =============================================================================

function KarmaMyKarmaScreen() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const isMounted = useIsMounted();
  const [profile, setProfile] = useState<KarmaProfile | null>(null);
  const [history, setHistory] = useState<EarnRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }
      if (!isRefresh) setLoading(true);
      try {
        const [profileRes, historyRes] = await Promise.all([
          karmaService.getKarmaProfile('me'),
          karmaService.getKarmaHistory('me', 1),
        ]);
        if (!isMounted()) return;
        if (profileRes.success && profileRes.data) setProfile(profileRes.data);
        if (historyRes.success && historyRes.data) setHistory(historyRes.data.records ?? []);
      } catch (err) {
        // G-KU-H5 FIX: Log non-fatal errors instead of silently ignoring.
        logger.warn('[MyKarma] Failed to load karma data', err?.message ?? err);
      } finally {
        if (!isMounted()) return;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isAuthenticated, isMounted],
  );

  // G-KU-M11 FIX: useFocusEffect requires a callback that may return a cleanup fn.
  // Using useCallback correctly ensures fetchData is recreated when its deps change.
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  const handleDownloadReport = async () => {
    if (downloading || !profile) return;
    setDownloading(true);
    try {
      const authState = useAuthStore.getState().state;
      const userName = authState.user?.profile?.firstName ?? authState.user?.phoneNumber ?? 'Volunteer';
      const { blob, filename } = await karmaService.downloadImpactReport(userName);
      const uri = `${FileSystem.cacheDirectory}${filename}`;
      const reader = new FileReader();
      reader.onload = async () => {
        const base64data = (reader.result as string).split(',')[1];
        await FileSystem.writeAsStringAsync(uri, base64data, { encoding: FileSystem.EncodingType.Base64 });
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share Impact Report' });
        } else {
          showToast({ type: 'success', message: `Report saved to ${uri}` });
        }
        if (isMounted()) setDownloading(false);
      };
      reader.onerror = () => {
        if (isMounted()) setDownloading(false);
        showToast({ type: 'error', message: 'Failed to download report' });
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      if (isMounted()) setDownloading(false);
      showToast({ type: 'error', message: 'Could not download your Impact Report. Please try again.' });
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <KarmaHeader title="My Karma" showBack />
        <View style={styles.authRequired}>
          <Ionicons name="lock-closed-outline" size={64} color={Colors.textSecondary} />
          <Text style={styles.authTitle}>Login Required</Text>
          <Text style={styles.authSubtitle}>Sign in to track your karma journey</Text>
          <Pressable style={styles.loginBtn} onPress={() => router.push('/sign-in' as unknown as string)}>
            <Text style={styles.loginBtnText}>Sign In</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <KarmaHeader title="My Karma" showBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={KARMA_PURPLE} />
        </View>
      </View>
    );
  }

  const levelCfg = profile ? LEVEL_CONFIG[profile.level] : LEVEL_CONFIG.L1;
  // G-KU-H6 FIX: If user is authenticated but profile is null, show an error message
  // instead of silently rendering default values (L1, 0 karma, 0 events).
  if (!profile && !loading && isAuthenticated) {
    return (
      <View style={styles.container}>
        <KarmaHeader title="My Karma" showBack />
        <View style={styles.authRequired}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.textSecondary} />
          <Text style={styles.authTitle}>Failed to Load Karma</Text>
          <Text style={styles.authSubtitle}>Could not load your karma profile. Please try again.</Text>
          <Pressable style={styles.loginBtn} onPress={() => fetchData()}>
            <Text style={styles.loginBtnText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }
  const conversionRate = profile ? CONVERSION_RATES[profile.level] : 25;
  const progressPercent =
    profile && profile.level !== 'L4' ? Math.min((profile.activeKarma / (levelCfg.next ?? 1)) * 100, 100) : 100;

  return (
    <View style={styles.container}>
      <KarmaHeader
        title="My Karma"
        showBack
        rightAction={
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable style={styles.headerAction} onPress={handleDownloadReport} hitSlop={8} disabled={downloading}>
              {downloading ? (
                <ActivityIndicator size="small" color={colors.text.inverse} />
              ) : (
                <Ionicons name="document-text" size={20} color={colors.text.inverse} />
              )}
            </Pressable>
            <Pressable style={styles.headerAction} onPress={() => router.push('/karma/wallet')} hitSlop={8}>
              <Ionicons name="wallet" size={20} color={colors.text.inverse} />
            </Pressable>
          </View>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[KARMA_PURPLE]}
            tintColor={KARMA_PURPLE}
          />
        }
      >
        {/* Hero Card */}
        <LinearGradient colors={KARMA_GRADIENT} style={styles.heroCard}>
          {/* Level Badge */}
          <View style={styles.heroTopRow}>
            <View style={[styles.levelBadgeHero, { backgroundColor: levelCfg.bg }]}>
              <Text style={[styles.levelBadgeText, { color: levelCfg.color }]}>{profile?.level ?? 'L1'}</Text>
            </View>
            <Text style={styles.levelNameHero}>{levelCfg.name}</Text>
          </View>

          {/* Karma Numbers */}
          <View style={styles.heroNumbers}>
            <View style={styles.heroNumberItem}>
              <Text style={styles.heroNumber}>{profile?.activeKarma.toLocaleString() ?? '0'}</Text>
              <Text style={styles.heroNumberLabel}>Active Karma</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroNumberItem}>
              <Text style={styles.heroNumber}>{profile?.lifetimeKarma.toLocaleString() ?? '0'}</Text>
              <Text style={styles.heroNumberLabel}>Lifetime</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.heroProgress}>
            <View style={styles.heroProgressBar}>
              <View style={[styles.heroProgressFill, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.heroProgressText}>
              {profile && profile.level !== 'L4'
                ? `${profile.activeKarma.toLocaleString()} / ${levelCfg.next?.toLocaleString()} to ${LEVEL_CONFIG[profile.level === 'L3' ? 'L4' : profile.level === 'L2' ? 'L3' : 'L2']?.label}`
                : 'Maximum level reached!'}
            </Text>
          </View>
        </LinearGradient>

        {/* Karma Passport Card */}
        {profile && <PassportCard profile={profile} />}

        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.statValue}>{profile?.eventsCompleted ?? 0}</Text>
            <Text style={styles.statLabel}>Events</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={20} color={KARMA_PURPLE} />
            <Text style={styles.statValue}>{profile?.totalHours ?? 0}h</Text>
            <Text style={styles.statLabel}>Hours Given</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="swap-horizontal" size={20} color="#F59E0B" />
            <Text style={styles.statValue}>{conversionRate}%</Text>
            <Text style={styles.statLabel}>Rate</Text>
          </View>
          <Pressable style={styles.statCard} onPress={() => router.push('/karma/wallet')}>
            <Ionicons name="wallet" size={20} color="#22C55E" />
            <Text style={styles.statValue}>Wallet</Text>
            <Text style={styles.statLabel}>View</Text>
          </Pressable>
        </View>

        {/* Download Impact Report CTA */}
        <View style={styles.reportCta}>
          <View style={styles.reportCtaLeft}>
            <Ionicons name="document-text-outline" size={24} color={KARMA_PURPLE} />
            <View style={{ flex: 1 }}>
              <Text style={styles.reportCtaTitle}>Download Impact Report</Text>
              <Text style={styles.reportCtaSub}>Share your volunteer story</Text>
            </View>
          </View>
          <Pressable
            style={[styles.reportCtaBtn, downloading && styles.reportCtaBtnDisabled]}
            onPress={handleDownloadReport}
            disabled={downloading}
          >
            {downloading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="download" size={16} color="#fff" />
                <Text style={styles.reportCtaBtnText}>Download</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Trust Score */}
        <View style={styles.trustSection}>
          <Text style={styles.sectionTitle}>Trust Score</Text>
          <View style={styles.trustCard}>
            <View style={styles.trustHeader}>
              <Ionicons name="shield-checkmark" size={24} color={KARMA_PURPLE} />
              <Text style={styles.trustScore}>{profile?.trustScore ?? 0}%</Text>
            </View>
            <View style={styles.trustBar}>
              <View style={[styles.trustFill, { width: `${profile?.trustScore ?? 0}%` }]} />
            </View>
            <Text style={styles.trustDesc}>
              Your trust score is based on consistent participation, NGO approvals, and event completion.
            </Text>
          </View>
        </View>

        {/* Level Progress */}
        <View style={styles.levelSection}>
          <Text style={styles.sectionTitle}>Karma Levels</Text>
          <View style={styles.levelCard}>
            <LevelProgressBar level={profile?.level ?? 'L1'} />
            <View style={styles.levelList}>
              {Object.entries(LEVEL_CONFIG).map(([lvl, cfg]) => {
                const rate = CONVERSION_RATES[lvl];
                const isCurrent = lvl === (profile?.level ?? 'L1');
                return (
                  <View key={lvl} style={[styles.levelRow, isCurrent && styles.levelRowActive]}>
                    <View style={[styles.levelDotSm, { backgroundColor: cfg.bg }]}>
                      <Text style={[styles.levelDotSmText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                    <View style={styles.levelRowInfo}>
                      <Text style={[styles.levelRowName, isCurrent && { fontWeight: '700' }]}>{cfg.name}</Text>
                      <Text style={styles.levelRowThreshold}>
                        {cfg.next ? `From ${cfg.threshold.toLocaleString()} karma` : 'Max level'}
                      </Text>
                    </View>
                    <View style={[styles.ratePill, { backgroundColor: cfg.bg }]}>
                      <Text style={[styles.ratePillText, { color: cfg.color }]}>{rate}%</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Badges */}
        {profile && profile.badges.length > 0 && (
          <View style={styles.badgesSection}>
            <Text style={styles.sectionTitle}>Badges ({profile.badges.length})</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: Spacing.base }}
            >
              {profile.badges.map((badge, idx) => (
                <BadgeItem key={badge.id} badge={badge} index={idx} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Earn History */}
        <View style={styles.historySection}>
          <View style={styles.historySectionHeader}>
            <Text style={styles.sectionTitle}>Earn History</Text>
          </View>
          {history.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Ionicons name="leaf-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyHistoryTitle}>No karma earned yet</Text>
              <Text style={styles.emptyHistorySub}>Join events and complete check-ins to start earning karma</Text>
              <Pressable style={styles.exploreBtn} onPress={() => router.push('/karma/explore')}>
                <Text style={styles.exploreBtnText}>Explore Events</Text>
              </Pressable>
            </View>
          ) : (
            history.map((record) => <EarnRecordItem key={record._id} record={record} />)
          )}
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.secondary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  authRequired: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing['2xl'] },
  authTitle: {
    fontSize: Typography.h3.fontSize,
    fontWeight: '700',
    color: colors.deepNavy,
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
  },
  authSubtitle: {
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  loginBtn: {
    backgroundColor: KARMA_PURPLE,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
  },
  loginBtnText: { fontSize: Typography.body.fontSize, fontWeight: '600', color: colors.text.inverse },
  scrollView: { flex: 1 },

  // Passport Card
  passportCard: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  passportGradient: { padding: Spacing.lg },
  passportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  passportLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  passportName: {
    fontSize: Typography.h3.fontSize,
    fontWeight: '800',
    color: colors.text.inverse,
    marginBottom: Spacing.sm,
  },
  passportLevelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  passportLevelBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  passportLevelText: { fontSize: 14, fontWeight: '800' },
  passportLevelName: { fontSize: Typography.body.fontSize, fontWeight: '700' },
  passportQrWrap: { padding: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: BorderRadius.md },
  passportDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: Spacing.md },
  passportStats: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  passportStat: { alignItems: 'center', flex: 1 },
  passportStatValue: { fontSize: 18, fontWeight: '800', color: colors.text.inverse },
  passportStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  passportStatDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.15)' },
  passportFooter: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    marginTop: Spacing.md,
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  headerAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Hero Card
  heroCard: { margin: Spacing.base, padding: Spacing.lg, borderRadius: BorderRadius.xl },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  levelBadgeHero: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  levelBadgeText: { fontSize: 20, fontWeight: '800' },
  levelNameHero: { fontSize: Typography.h3.fontSize, fontWeight: '700', color: colors.text.inverse },
  heroNumbers: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.lg },
  heroNumberItem: { alignItems: 'center' },
  heroNumber: { fontSize: 32, fontWeight: '800', color: colors.text.inverse },
  heroNumberLabel: { fontSize: Typography.caption.fontSize, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  heroDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  heroProgress: { marginTop: Spacing.sm },
  heroProgressBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, overflow: 'hidden' },
  heroProgressFill: { height: '100%', backgroundColor: '#FCD34D', borderRadius: 4 },
  heroProgressText: { fontSize: Typography.caption.fontSize, color: 'rgba(255,255,255,0.8)', marginTop: 6 },

  // Stats Grid
  statsGrid: { flexDirection: 'row', paddingHorizontal: Spacing.base, gap: Spacing.sm, marginBottom: Spacing.lg },
  statCard: {
    flex: 1,
    backgroundColor: colors.text.inverse,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  statValue: { fontSize: Typography.body.fontSize, fontWeight: '800', color: colors.deepNavy, marginTop: 4 },
  statLabel: { fontSize: Typography.caption.fontSize, color: Colors.textSecondary, marginTop: 2, textAlign: 'center' },

  // Impact Report CTA
  reportCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.text.inverse,
    marginHorizontal: Spacing.base,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: Spacing.lg,
  },
  reportCtaLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: Spacing.md },
  reportCtaTitle: { fontSize: Typography.body.fontSize, fontWeight: '700', color: colors.deepNavy },
  reportCtaSub: { fontSize: Typography.caption.fontSize, color: Colors.textSecondary, marginTop: 2 },
  reportCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: KARMA_PURPLE,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  reportCtaBtnDisabled: { opacity: 0.6 },
  reportCtaBtnText: { fontSize: Typography.caption.fontSize, fontWeight: '700', color: '#fff' },

  // Trust
  trustSection: { paddingHorizontal: Spacing.base, marginBottom: Spacing.lg },
  trustCard: {
    backgroundColor: colors.text.inverse,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  trustHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  trustScore: { fontSize: Typography.h2.fontSize, fontWeight: '800', color: colors.deepNavy },
  trustBar: {
    height: 8,
    backgroundColor: colors.background.secondary,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  trustFill: { height: '100%', backgroundColor: KARMA_PURPLE, borderRadius: 4 },
  trustDesc: { fontSize: Typography.caption.fontSize, color: Colors.textSecondary },

  // Level Progress
  levelSection: { paddingHorizontal: Spacing.base, marginBottom: Spacing.lg },
  sectionTitle: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.deepNavy,
    marginBottom: Spacing.md,
  },
  levelCard: {
    backgroundColor: colors.text.inverse,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  progressContainer: { marginBottom: Spacing.lg },
  progressTrack: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'relative' },
  progressLines: { position: 'absolute', top: 12, left: 20, right: 20, flexDirection: 'row', height: 2 },
  progressLine: { flex: 1, height: 2, backgroundColor: colors.background.secondary },
  progressLineActive: { backgroundColor: KARMA_PURPLE },
  progressStep: { alignItems: 'center', zIndex: 1 },
  progressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border.default,
  },
  progressDotActive: { borderColor: 'transparent' },
  progressDotCurrent: {},
  progressDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.text.inverse },
  progressLabel: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textSecondary,
    marginTop: 4,
    fontWeight: '600',
  },
  levelList: { gap: Spacing.sm },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  levelRowActive: { backgroundColor: '#F5F3FF' },
  levelDotSm: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  levelDotSmText: { fontSize: 12, fontWeight: '800' },
  levelRowInfo: { flex: 1 },
  levelRowName: { fontSize: Typography.body.fontSize, fontWeight: '600', color: colors.deepNavy },
  levelRowThreshold: { fontSize: Typography.caption.fontSize, color: Colors.textSecondary },
  ratePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  ratePillText: { fontSize: Typography.caption.fontSize, fontWeight: '700' },

  // Badges
  badgesSection: { marginBottom: Spacing.lg },
  badgeItem: { alignItems: 'center', width: 80, marginRight: Spacing.md },
  badgeIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  badgeEmoji: { fontSize: 28 },
  badgeName: { fontSize: Typography.caption.fontSize, fontWeight: '600', color: colors.deepNavy, textAlign: 'center' },
  badgeDate: { fontSize: 10, color: Colors.textSecondary, textAlign: 'center', marginTop: 2 },

  // History
  historySection: { paddingHorizontal: Spacing.base, marginBottom: Spacing.lg },
  historySectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  emptyHistory: {
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: colors.text.inverse,
    borderRadius: BorderRadius.lg,
  },
  emptyHistoryTitle: {
    fontSize: Typography.body.fontSize,
    fontWeight: '700',
    color: colors.deepNavy,
    marginTop: Spacing.base,
  },
  emptyHistorySub: {
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.lg,
  },
  exploreBtn: {
    backgroundColor: KARMA_PURPLE,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
  },
  exploreBtnText: { fontSize: Typography.body.fontSize, fontWeight: '600', color: colors.text.inverse },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.text.inverse,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  recordLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  recordIconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  recordInfo: { flex: 1 },
  recordEvent: { fontSize: Typography.body.fontSize, fontWeight: '600', color: colors.deepNavy },
  recordDate: { fontSize: Typography.caption.fontSize, color: Colors.textSecondary, marginTop: 2 },
  recordRight: { alignItems: 'flex-end' },
  recordKarma: { fontSize: Typography.body.fontSize, fontWeight: '800', color: '#22C55E' },
  recordStatusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 4 },
  recordStatusText: { fontSize: 10, fontWeight: '700' },
});

export default withErrorBoundary(KarmaMyKarmaScreen, 'KarmaMyKarma');
