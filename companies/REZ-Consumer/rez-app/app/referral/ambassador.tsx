// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useReferral } from '../../hooks/useReferral';

const TIERS = [
  { id: 'bronze', name: 'Bronze', min: 0, max: 25, bonus: '1.0x', color: '#CD7F32', icon: '🥉' },
  { id: 'silver', name: 'Silver', min: 26, max: 100, bonus: '1.05x', color: '#C0C0C0', icon: '🥈' },
  { id: 'gold', name: 'Gold', min: 101, max: 500, bonus: '1.1x', color: '#FFD700', icon: '🥇' },
  { id: 'platinum', name: 'Platinum', min: 501, max: 5000, bonus: '1.15x', color: '#E5E4E2', icon: '💎' },
  { id: 'diamond', name: 'Diamond', min: 5001, max: Infinity, bonus: '1.2x', color: '#B9F2FF', icon: '👑' },
];

export default function AmbassadorScreen() {
  const router = useRouter();
  const { ambassadorInfo, stats, getAmbassadorInfo } = useReferral();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getAmbassadorInfo();
  }, [getAmbassadorInfo]);

  const onRefresh = async () => {
    setRefreshing(true);
    await getAmbassadorInfo();
    setRefreshing(false);
  };

  const getCurrentTierIndex = () => {
    if (!ambassadorInfo) return 0;
    return TIERS.findIndex(t => t.id === ambassadorInfo.currentTier) || 0;
  };

  const currentTierIndex = getCurrentTierIndex();
  const nextTier = TIERS[currentTierIndex + 1];
  const progress = nextTier
    ? Math.min(100, ((stats?.qualifiedReferrals || 0) / nextTier.min) * 100)
    : 100;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Ambassador Program</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Current Status */}
        <View style={styles.currentStatus}>
          <View style={[styles.tierBadge, { borderColor: TIERS[currentTierIndex].color }]}>
            <Text style={styles.tierIcon}>{TIERS[currentTierIndex].icon}</Text>
            <Text style={[styles.tierName, { color: TIERS[currentTierIndex].color }]}>
              {TIERS[currentTierIndex].name.toUpperCase()}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats?.qualifiedReferrals || 0}</Text>
              <Text style={styles.statLabel}>Qualified</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{TIERS[currentTierIndex].bonus}</Text>
              <Text style={styles.statLabel}>Bonus</Text>
            </View>
          </View>
        </View>

        {/* Progress to Next Tier */}
        {nextTier && (
          <View style={styles.progressCard}>
            <Text style={styles.progressTitle}>
              {nextTier.referralsToNextTier || nextTier.min - (stats?.qualifiedReferrals || 0)} more to {nextTier.name}
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressSubtext}>
              {(stats?.qualifiedReferrals || 0)} / {nextTier.min} qualified referrals
            </Text>
          </View>
        )}

        {/* Tier Ladder */}
        <View style={styles.tierLadder}>
          <Text style={styles.sectionTitle}>Tier Benefits</Text>

          {TIERS.map((tier, index) => {
            const isActive = index === currentTierIndex;
            const isAchieved = index < currentTierIndex;
            return (
              <View
                key={tier.id}
                style={[
                  styles.tierRow,
                  isActive && styles.tierRowActive,
                  isAchieved && styles.tierRowAchieved,
                ]}
              >
                <View style={styles.tierLeft}>
                  <Text style={styles.tierRowIcon}>{tier.icon}</Text>
                  <View>
                    <Text style={[styles.tierRowName, isActive && styles.tierRowNameActive]}>
                      {tier.name}
                    </Text>
                    <Text style={styles.tierRowRange}>{tier.min}+ referrals</Text>
                  </View>
                </View>
                <View style={styles.tierRight}>
                  <Text style={[styles.tierBonus, { color: tier.color }]}>{tier.bonus}</Text>
                  {isAchieved && <Text style={styles.achievedBadge}>✓</Text>}
                </View>
              </View>
            );
          })}
        </View>

        {/* Benefits */}
        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>Your Benefits</Text>

          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>💰</Text>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Reward Multiplier</Text>
                <Text style={styles.benefitDescription}>
                  Earn {TIERS[currentTierIndex].bonus} bonus on all referrals
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🎯</Text>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Priority Support</Text>
                <Text style={styles.benefitDescription}>
                  Get dedicated support for any questions
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🏆</Text>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Exclusive Events</Text>
                <Text style={styles.benefitDescription}>
                  Invite to ambassador-only events
                </Text>
              </View>
            </View>

            {currentTierIndex >= 2 && (
              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>🎁</Text>
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Early Access</Text>
                  <Text style={styles.benefitDescription}>
                    Test new features before launch
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* How to Earn */}
        <View style={styles.howToSection}>
          <Text style={styles.sectionTitle}>How to Level Up</Text>

          <View style={styles.tipItem}>
            <Text style={styles.tipNumber}>1</Text>
            <Text style={styles.tipText}>Share your referral code daily</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipNumber}>2</Text>
            <Text style={styles.tipText}>Help referred users complete verification</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipNumber}>3</Text>
            <Text style={styles.tipText}>Join campaigns for bonus multipliers</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    fontSize: 16,
    color: '#6366F1',
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  scrollView: {
    flex: 1,
  },
  currentStatus: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    alignItems: 'center',
  },
  tierBadge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 50,
    borderWidth: 3,
    alignItems: 'center',
  },
  tierIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  tierName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 24,
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },
  progressCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  progressTitle: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
    marginBottom: 12,
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
  progressSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  tierLadder: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  tierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  tierRowActive: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  tierRowAchieved: {
    backgroundColor: '#ECFDF5',
  },
  tierLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tierRowIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  tierRowName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  tierRowNameActive: {
    color: '#6366F1',
  },
  tierRowRange: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  tierRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tierBonus: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  achievedBadge: {
    marginLeft: 8,
    fontSize: 16,
    color: '#10B981',
  },
  benefitsSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  benefitsList: {},
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  benefitIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  benefitDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  howToSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    marginBottom: 100,
    padding: 16,
    borderRadius: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#4B5563',
  },
});
