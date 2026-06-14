'use client';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Shield, TrendingUp, Award, ChevronRight, CheckCircle, Clock, AlertCircle } from 'lucide-react-native';
import { useAppStore } from '../../store/useAppStore';
import { scoreColorMap, verificationTypeLabels } from '../../utils/mockData';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { user, ciScore, verifications, badges, initializeMockData, isLoading, setLoading } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Initialize with mock data for demo
    initializeMockData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API refresh
    setTimeout(() => {
      initializeMockData();
      setRefreshing(false);
    }, 1000);
  };

  const getTierColor = (tier: string) => {
    const colors = scoreColorMap[tier] || { primary: '#6366f1', secondary: '#4f46e5' };
    return colors.primary;
  };

  const recentVerifications = verifications.slice(0, 3);
  const earnedBadges = badges.filter(b => b.category === 'achievement' || b.category === 'verification').slice(0, 3);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
      }
    >
      {/* Header */}
      <LinearGradient colors={['#1a1a2e', '#0f0f23']} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.welcomeText}>Welcome back</Text>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Shield size={14} color={user?.status === 'VERIFIED' ? '#22c55e' : '#f59e0b'} />
          <Text style={[styles.statusText, { color: user?.status === 'VERIFIED' ? '#22c55e' : '#f59e0b' }]}>
            {user?.status || 'PENDING'}
          </Text>
        </View>
      </LinearGradient>

      {/* CorpID Card */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.corpIdCard}
          onPress={() => router.push('/(tabs)/passport')}
          activeOpacity={0.8}
        >
          <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.corpIdGradient}>
            <View style={styles.corpIdHeader}>
              <Text style={styles.corpIdLabel}>YOUR CORPID</Text>
              <View style={styles.verifiedBadge}>
                <CheckCircle size={14} color="#22c55e" />
                <Text style={styles.verifiedText}>VERIFIED</Text>
              </View>
            </View>
            <Text style={styles.corpIdNumber}>{user?.corpId || 'CI-IND-XXXXX'}</Text>
            <View style={styles.corpIdFooter}>
              <View style={styles.entityType}>
                <Text style={styles.entityTypeText}>{user?.entityType || 'INDIVIDUAL'}</Text>
              </View>
              <Text style={styles.levelText}>Level {user?.verificationLevel || 0}/5</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* CI Score Card */}
      {ciScore && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.scoreCard}
            onPress={() => router.push('/(tabs)/score')}
            activeOpacity={0.8}
          >
            <View style={styles.scoreHeader}>
              <Text style={styles.sectionTitle}>CI Score</Text>
              {ciScore.trend === 'up' && (
                <View style={styles.trendBadge}>
                  <TrendingUp size={12} color="#22c55e" />
                  <Text style={styles.trendText}>+12 this month</Text>
                </View>
              )}
            </View>
            <View style={styles.scoreContent}>
              <View style={styles.scoreCircleContainer}>
                <View style={[styles.scoreCircle, { borderColor: getTierColor(ciScore.tier) }]}>
                  <Text style={[styles.scoreValue, { color: getTierColor(ciScore.tier) }]}>
                    {ciScore.score}
                  </Text>
                  <Text style={styles.scoreMax}>/1000</Text>
                </View>
              </View>
              <View style={styles.scoreInfo}>
                <View style={[styles.tierBadge, { backgroundColor: getTierColor(ciScore.tier) }]}>
                  <Text style={styles.tierText}>{ciScore.tier}</Text>
                </View>
                <Text style={styles.scoreRank}>Top 15% globally</Text>
                <TouchableOpacity style={styles.viewDetailsBtn}>
                  <Text style={styles.viewDetailsText}>View Details</Text>
                  <ChevronRight size={14} color="#6366f1" />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Stats */}
      <View style={styles.section}>
        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push('/(tabs)/passport')}
            activeOpacity={0.8}
          >
            <Award size={24} color="#6366f1" />
            <Text style={styles.statValue}>{earnedBadges.length}</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push('/(tabs)/wallet')}
            activeOpacity={0.8}
          >
            <CheckCircle size={24} color="#22c55e" />
            <Text style={styles.statValue}>{verifications.filter(v => v.status === 'approved').length}</Text>
            <Text style={styles.statLabel}>Verified</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push('/(tabs)/wallet')}
            activeOpacity={0.8}
          >
            <Shield size={24} color="#f59e0b" />
            <Text style={styles.statValue}>50+</Text>
            <Text style={styles.statLabel}>Connections</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Verifications</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/passport')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        {recentVerifications.map((verification) => (
          <View key={verification.id} style={styles.activityItem}>
            <View style={styles.activityIcon}>
              {verification.status === 'approved' ? (
                <CheckCircle size={20} color="#22c55e" />
              ) : verification.status === 'pending' ? (
                <Clock size={20} color="#f59e0b" />
              ) : (
                <AlertCircle size={20} color="#ef4444" />
              )}
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>
                {verificationTypeLabels[verification.type] || verification.type}
              </Text>
              <Text style={styles.activitySubtitle}>
                {new Date(verification.submittedAt).toLocaleDateString()}
              </Text>
            </View>
            <View style={[styles.statusPill, {
              backgroundColor: verification.status === 'approved' ? 'rgba(34, 197, 94, 0.2)' :
                             verification.status === 'pending' ? 'rgba(245, 158, 11, 0.2)' :
                             'rgba(239, 68, 68, 0.2)'
            }]}>
              <Text style={[styles.statusPillText, {
                color: verification.status === 'approved' ? '#22c55e' :
                       verification.status === 'pending' ? '#f59e0b' :
                       '#ef4444'
              }]}>
                {verification.status.toUpperCase()}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={[styles.section, styles.lastSection]}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/passport')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBg, { backgroundColor: 'rgba(99, 102, 241, 0.2)' }]}>
              <Award size={24} color="#6366f1" />
            </View>
            <Text style={styles.actionTitle}>View Passport</Text>
            <Text style={styles.actionSubtitle}>Career credentials</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/score')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBg, { backgroundColor: 'rgba(34, 197, 94, 0.2)' }]}>
              <TrendingUp size={24} color="#22c55e" />
            </View>
            <Text style={styles.actionTitle}>Check CI Score</Text>
            <Text style={styles.actionSubtitle}>Trust breakdown</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/wallet')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBg, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
              <Shield size={24} color="#f59e0b" />
            </View>
            <Text style={styles.actionTitle}>Trust Wallet</Text>
            <Text style={styles.actionSubtitle}>Your badges</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/settings')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBg, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
              <Shield size={24} color="#8b5cf6" />
            </View>
            <Text style={styles.actionTitle}>Settings</Text>
            <Text style={styles.actionSubtitle}>Manage account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 24,
  },
  headerContent: {
    flex: 1,
  },
  welcomeText: {
    color: '#888',
    fontSize: 14,
  },
  userName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
  corpIdCard: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  corpIdGradient: {
    padding: 20,
  },
  corpIdHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  corpIdLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  corpIdNumber: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginVertical: 16,
  },
  corpIdFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entityType: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  entityTypeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  levelText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  scoreCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  trendText: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '600',
  },
  scoreContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreCircleContainer: {
    marginRight: 20,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f23',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  scoreMax: {
    color: '#666',
    fontSize: 14,
  },
  scoreInfo: {
    flex: 1,
  },
  tierBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  tierText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  scoreRank: {
    color: '#888',
    fontSize: 14,
    marginBottom: 12,
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailsText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  activitySubtitle: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  actionCard: {
    width: (width - 44) / 2,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  actionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionSubtitle: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  lastSection: {
    paddingBottom: 32,
  },
});
