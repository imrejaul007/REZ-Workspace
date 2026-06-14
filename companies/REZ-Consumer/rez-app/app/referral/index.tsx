// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Share,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useReferral } from '../../hooks/useReferral';
import { useWallet } from '../../hooks/useWallet';

export default function ReferralHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { stats, referralCode, ambassadorInfo, isLoading, refresh } = useReferral();
  const { balance } = useWallet();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const shareReferralLink = async () => {
    try {
      const referralUrl = `https://rez.app/join?ref=${referralCode?.code}`;
      await Share.share({
        message: `Join me on REZ! Use my referral code ${referralCode?.code} and get ₹50 coins on signup. Download: ${referralUrl}`,
        title: 'Invite Friends',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const copyCode = () => {
    // In real app, use Clipboard API
    Alert.alert('Copied!', `Referral code ${referralCode?.code} copied to clipboard`);
  };

  const getTierColor = (tier?: string) => {
    switch (tier) {
      case 'diamond': return '#E5E4E2';
      case 'platinum': return '#E5E4E2';
      case 'gold': return '#FFD700';
      case 'silver': return '#C0C0C0';
      case 'bronze':
      default:
        return '#CD7F32';
    }
  };

  const getNextTierProgress = () => {
    if (!ambassadorInfo) return 0;
    const { currentTier, referralsToNextTier, totalReferrals } = ambassadorInfo;
    const tiers = { bronze: 0, silver: 26, gold: 101, platinum: 501, diamond: 5001 };
    const currentThreshold = tiers[currentTier as keyof typeof tiers] || 0;
    const nextThreshold = tiers[getNextTier() as keyof typeof tiers] || currentThreshold + 100;
    const range = nextThreshold - currentThreshold;
    const progress = totalReferrals - currentThreshold;
    return Math.min(100, (progress / range) * 100);
  };

  const getNextTier = () => {
    if (!ambassadorInfo) return 'silver';
    switch (ambassadorInfo.currentTier) {
      case 'bronze': return 'silver';
      case 'silver': return 'gold';
      case 'gold': return 'platinum';
      case 'platinum': return 'diamond';
      default: return null;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Refer & Earn</Text>
        <Text style={styles.subtitle}>Share REZ with friends, earn rewards</Text>
      </View>

      {/* Referral Code Card */}
      <View style={styles.codeCard}>
        <View style={styles.codeHeader}>
          <Text style={styles.codeLabel}>Your Referral Code</Text>
          <TouchableOpacity onPress={copyCode}>
            <Text style={styles.copyButton}>Copy</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.codeText}>{referralCode?.code || 'Loading...'}</Text>
        <Text style={styles.codeUrl}>
          rez.app/join?ref={referralCode?.code}
        </Text>

        {/* Share Buttons */}
        <View style={styles.shareButtons}>
          <TouchableOpacity style={styles.shareButton} onPress={shareReferralLink}>
            <Text style={styles.shareButtonText}>Share Link</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.shareButton, styles.qrButton]}
            onPress={() => router.push('/referral/qr')}
          >
            <Text style={styles.shareButtonText}>Show QR</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => router.push('/referral/stats')}
        >
          <Text style={styles.statValue}>{stats?.totalReferrals || 0}</Text>
          <Text style={styles.statLabel}>Invites</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCard}
          onPress={() => router.push('/referral/stats')}
        >
          <Text style={styles.statValue}>{stats?.qualifiedReferrals || 0}</Text>
          <Text style={styles.statLabel}>Qualified</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCard}
          onPress={() => router.push('/referral/leaderboard')}
        >
          <Text style={styles.statValue}>
            {stats?.conversionRate?.toFixed(0) || 0}%
          </Text>
          <Text style={styles.statLabel}>Conversion</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCard}
          onPress={() => router.push('/referral/earnings')}
        >
          <Text style={styles.statValue}>
            ₹{stats?.lifetimeEarnings || 0}
          </Text>
          <Text style={styles.statLabel}>Earned</Text>
        </TouchableOpacity>
      </View>

      {/* Ambassador Progress */}
      {ambassadorInfo && (
        <View style={styles.ambassadorCard}>
          <View style={styles.ambassadorHeader}>
            <View style={styles.tierBadge}>
              <Text
                style={[
                  styles.tierText,
                  { color: getTierColor(ambassadorInfo.currentTier) },
                ]}
              >
                {ambassadorInfo.currentTier?.toUpperCase()}
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/referral/ambassador')}>
              <Text style={styles.ambassadorLink}>View Benefits →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.progressSection}>
            <Text style={styles.progressLabel}>
              {ambassadorInfo.referralsToNextTier} more referrals to{' '}
              {getNextTier()?.charAt(0).toUpperCase() + getNextTier()?.slice(1)}
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${getNextTierProgress()}%` }]}
              />
            </View>
          </View>

          <View style={styles.benefitsPreview}>
            {ambassadorInfo.benefits.slice(0, 2).map((benefit, index) => (
              <View key={index} style={styles.benefitTag}>
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
            {ambassadorInfo.benefits.length > 2 && (
              <View style={styles.benefitTag}>
                <Text style={styles.benefitText}>
                  +{ambassadorInfo.benefits.length - 2} more
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/referral/leaderboard')}
          >
            <Text style={styles.actionIcon}>🏆</Text>
            <Text style={styles.actionLabel}>Leaderboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/referral/campaigns')}
          >
            <Text style={styles.actionIcon}>🎯</Text>
            <Text style={styles.actionLabel}>Campaigns</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/referral/creator')}
          >
            <Text style={styles.actionIcon}>⭐</Text>
            <Text style={styles.actionLabel}>Become Creator</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/referral/history')}
          >
            <Text style={styles.actionIcon}>📜</Text>
            <Text style={styles.actionLabel}>History</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Referrals */}
      <View style={styles.recentSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Referrals</Text>
          <TouchableOpacity onPress={() => router.push('/referral/referrals')}>
            <Text style={styles.viewAllLink}>View All</Text>
          </TouchableOpacity>
        </View>

        {/* Placeholder - would render actual referrals */}
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyText}>
            Share your code to start referring!
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#6366F1',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 4,
  },
  codeCard: {
    margin: 16,
    marginTop: -20,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  copyButton: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
  },
  codeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginVertical: 12,
    letterSpacing: 4,
  },
  codeUrl: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  shareButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#6366F1',
    borderRadius: 12,
    alignItems: 'center',
  },
  qrButton: {
    backgroundColor: '#10B981',
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  ambassadorCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  ambassadorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  tierText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  ambassadorLink: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '500',
  },
  progressSection: {
    marginTop: 16,
  },
  progressLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 4,
  },
  benefitsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  benefitTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  benefitText: {
    fontSize: 12,
    color: '#4B5563',
  },
  actionsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '47%',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  recentSection: {
    padding: 16,
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllLink: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '500',
  },
  emptyState: {
    padding: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
