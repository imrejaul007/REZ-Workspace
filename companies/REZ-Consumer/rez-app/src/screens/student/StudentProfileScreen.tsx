// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
  AccessibilityInfo,
} from 'react-native';
import { studentService, StudentProfile, StudentMission, StudentOffer } from '../../services/student/studentService';

interface Props {
  userId: string;
  institutionId: string;
}

export const StudentProfileScreen: React.FC<Props> = ({ userId, institutionId }) => {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [missions, setMissions] = useState<StudentMission[]>([]);
  const [offers, setOffers] = useState<StudentOffer[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'offers' | 'missions' | 'rankings'>('offers');

  useEffect(() => {
    loadData();
  }, [userId, institutionId]);

  const loadData = async () => {
    try {
      const [profileData, missionsData, offersData] = await Promise.all([
        studentService.getStudentProfile(userId),
        studentService.getMissions(userId),
        studentService.getStudentOffers(institutionId),
      ]);
      setProfile(profileData);
      setMissions(missionsData);
      setOffers(offersData.offers);
    } catch (error) {
      logger.error('Failed to load student data', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (!profile) {
    return (
      <View style={styles.loadingContainer} accessibilityLabel="Loading student profile" accessibilityRole="progressbar">
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={[styles.tierBadge, { backgroundColor: profile.tier.color }]}>
          <Text style={styles.tierText}>{profile.tier.badge}</Text>
        </View>
        <Text style={styles.institutionName}>{profile.institution.name}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.currentCoins}</Text>
            <Text style={styles.statLabel}>Coins</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.campusRank || '-'}</Text>
            <Text style={styles.statLabel}>Campus Rank</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.referralsCount}</Text>
            <Text style={styles.statLabel}>Referrals</Text>
          </View>
        </View>

        {profile.nextTier && (
          <View style={styles.nextTierCard}>
            <Text style={styles.nextTierLabel}>Next: {profile.nextTier.tier}</Text>
            <View style={styles.progressBar}>
              <View style={styles.progressFill} />
            </View>
            <Text style={styles.coinsNeeded}>
              {profile.nextTier.coinsNeeded} coins to go
            </Text>
          </View>
        )}

        <View style={styles.referralCard}>
          <Text style={styles.referralTitle}>Your Referral Code</Text>
          <Text style={styles.referralCode}>{profile.referralCode}</Text>
          <Text style={styles.referralHint}>
            Share with friends to earn bonus coins!
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar} accessibilityRole="tablist">
        <TouchableOpacity
          style={[styles.tab, activeTab === 'offers' && styles.tabActive]}
          onPress={() => setActiveTab('offers')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'offers' }}
          accessibilityLabel="Offers tab"
          accessibilityHint="Shows available student offers"
        >
          <Text style={[styles.tabText, activeTab === 'offers' && styles.tabTextActive]}>
            Offers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'missions' && styles.tabActive]}
          onPress={() => setActiveTab('missions')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'missions' }}
          accessibilityLabel="Missions tab"
          accessibilityHint="Shows your student missions"
        >
          <Text style={[styles.tabText, activeTab === 'missions' && styles.tabTextActive]}>
            Missions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'rankings' && styles.tabActive]}
          onPress={() => setActiveTab('rankings')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'rankings' }}
          accessibilityLabel="Rankings tab"
          accessibilityHint="Shows campus rankings"
        >
          <Text style={[styles.tabText, activeTab === 'rankings' && styles.tabTextActive]}>
            Rankings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'offers' && (
        <View style={styles.tabContent}>
          {offers.map((offer) => (
            <View key={offer.id} style={styles.offerCard}>
              <View style={styles.offerHeader}>
                <Text style={styles.merchantName}>{offer.merchantName}</Text>
                {offer.rating && (
                  <Text style={styles.rating}>★ {offer.rating}</Text>
                )}
              </View>
              <View style={styles.offerBadge}>
                <Text style={styles.offerText}>{offer.offer.display}</Text>
              </View>
              {offer.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>🔥 Popular</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {activeTab === 'missions' && (
        <View style={styles.tabContent}>
          {missions.map((mission) => (
            <View key={mission.id} style={styles.missionCard}>
              <View style={styles.missionInfo}>
                <Text style={styles.missionTitle}>{mission.title}</Text>
                <Text style={styles.missionDesc}>{mission.description}</Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${mission.percentComplete}%` },
                    ]}
                  />
                </View>
                <Text style={styles.missionProgress}>
                  {mission.progress}/{mission.target}
                </Text>
              </View>
              <View style={styles.missionReward}>
                <Text style={styles.coinIcon}>🪙</Text>
                <Text style={styles.coinValue}>{mission.coins}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {activeTab === 'rankings' && (
        <View style={styles.tabContent}>
          <StudentLeaderboard institutionId={institutionId} userId={userId} />
        </View>
      )}
    </ScrollView>
  );
};

const StudentLeaderboard: React.FC<{ institutionId: string; userId: string }> = ({
  institutionId,
  userId,
}) => {
  const [leaderboard, setLeaderboard] = useState<unknown>(null);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const data = await studentService.getCampusLeaderboard(institutionId, {
        period: 'weekly',
        page: 1,
      });
      setLeaderboard(data);
    } catch (error) {
      logger.error('Failed to load leaderboard', error);
    }
  };

  if (!leaderboard) {
    return (
      <View style={styles.loadingContainer} accessibilityLabel="Loading rankings" accessibilityRole="progressbar">
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading rankings...</Text>
      </View>
    );
  }

  return (
    <View>
      {leaderboard.rankings.map((entry, index: number) => (
        <View
          key={entry.userId}
          style={[
            styles.leaderboardEntry,
            entry.userId === userId && styles.leaderboardEntryHighlight,
          ]}
        >
          <Text style={styles.rank}>#{entry.rank}</Text>
          <View style={styles.leaderboardInfo}>
            <Text style={styles.leaderboardName}>
              {entry.userId === userId ? 'You' : `Student ${index + 1}`}
            </Text>
            <Text style={styles.leaderboardCoins}>{entry.coins} coins</Text>
          </View>
          <View style={[styles.tierBadgeSmall, { backgroundColor: '#6366F1' }]}>
            <Text style={styles.tierBadgeSmallText}>{entry.tier}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    minHeight: 200,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4B5563', // Fixed: Was #6B7280 (WCAG AA contrast issue on white)
    fontWeight: '500',
  },
  profileHeader: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    alignItems: 'center',
  },
  tierBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  tierText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  institutionName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  nextTierCard: {
    width: '100%',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  nextTierLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
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
    width: '30%',
  },
  coinsNeeded: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  referralCard: {
    width: '100%',
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  referralTitle: {
    fontSize: 12,
    color: '#6366F1',
    marginBottom: 8,
  },
  referralCode: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366F1',
    letterSpacing: 2,
  },
  referralHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#6366F1',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#6366F1',
    fontWeight: '600',
  },
  tabContent: {
    padding: 16,
  },
  offerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  rating: {
    fontSize: 14,
    color: '#F59E0B',
  },
  offerBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  offerText: {
    color: '#16A34A',
    fontSize: 14,
    fontWeight: '600',
  },
  popularBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 8,
  },
  popularText: {
    fontSize: 12,
    color: '#D97706',
  },
  missionCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  missionInfo: {
    flex: 1,
  },
  missionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  missionDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  missionProgress: {
    fontSize: 12,
    color: '#6366F1',
    marginTop: 8,
  },
  missionReward: {
    alignItems: 'center',
    marginLeft: 16,
  },
  coinIcon: {
    fontSize: 20,
  },
  coinValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  leaderboardEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  leaderboardEntryHighlight: {
    backgroundColor: '#EEF2FF',
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  rank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6366F1',
    width: 40,
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  leaderboardCoins: {
    fontSize: 12,
    color: '#6B7280',
  },
  tierBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tierBadgeSmallText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
});
