'use client';
import { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, TrendingDown, Minus, User, Briefcase, Award, Star, Shield, Users, CheckCircle } from 'lucide-react-native';
import { useAppStore } from '../../store/useAppStore';
import { scoreColorMap } from '../../utils/mockData';

export default function ScoreScreen() {
  const { ciScore, initializeMockData } = useAppStore();

  useEffect(() => {
    if (!ciScore) {
      initializeMockData();
    }
  }, []);

  const getTierColor = (tier: string) => {
    const colors = scoreColorMap[tier] || { primary: '#6366f1', secondary: '#4f46e5' };
    return colors.primary;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp size={16} color="#22c55e" />;
      case 'down': return <TrendingDown size={16} color="#ef4444" />;
      default: return <Minus size={16} color="#888" />;
    }
  };

  const getFactorIcon = (factor: string) => {
    switch (factor) {
      case 'identity': return <User size={20} color="#6366f1" />;
      case 'employment': return <Briefcase size={20} color="#22c55e" />;
      case 'skills': return <Award size={20} color="#f59e0b" />;
      case 'reputation': return <Star size={20} color="#8b5cf6" />;
      case 'compliance': return <Shield size={20} color="#3b82f6" />;
      case 'references': return <Users size={20} color="#ec4899" />;
      default: return <CheckCircle size={20} color="#6366f1" />;
    }
  };

  const getFactorColor = (factor: string) => {
    switch (factor) {
      case 'identity': return '#6366f1';
      case 'employment': return '#22c55e';
      case 'skills': return '#f59e0b';
      case 'reputation': return '#8b5cf6';
      case 'compliance': return '#3b82f6';
      case 'references': return '#ec4899';
      default: return '#6366f1';
    }
  };

  const getFactorLabel = (factor: string) => {
    switch (factor) {
      case 'identity': return 'Identity Verification';
      case 'employment': return 'Employment History';
      case 'skills': return 'Skills & Certifications';
      case 'reputation': return 'Reputation Score';
      case 'compliance': return 'Compliance Record';
      case 'references': return 'Professional References';
      default: return factor;
    }
  };

  const getTierDescription = (tier: string) => {
    switch (tier) {
      case 'ELITE': return 'You are among the top 1% of verified professionals. Enjoy priority services and exclusive benefits.';
      case 'PREMIUM': return 'Strong verification profile with multiple verified credentials. Access premium features and partner offers.';
      case 'VERIFIED': return 'Basic verification complete. Your identity and credentials have been confirmed.';
      case 'BASIC': return 'Limited verification. Complete more verifications to improve your score.';
      case 'UNVERIFIED': return 'No verifications completed. Start by verifying your identity.';
      default: return '';
    }
  };

  if (!ciScore) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Score */}
        <LinearGradient
          colors={['#1a1a2e', '#0f0f23']}
          style={styles.header}
        >
          <View style={styles.scoreCircleContainer}>
            <View style={[styles.scoreCircle, { borderColor: getTierColor(ciScore.tier) }]}>
              <Text style={[styles.scoreValue, { color: getTierColor(ciScore.tier) }]}>
                {ciScore.score}
              </Text>
              <Text style={styles.scoreMax}>/1000</Text>
            </View>
          </View>

          <View style={[styles.tierBadge, { backgroundColor: getTierColor(ciScore.tier) }]}>
            <Text style={styles.tierText}>{ciScore.tier}</Text>
          </View>

          <View style={styles.trendContainer}>
            {getTrendIcon(ciScore.trend)}
            <Text style={[
              styles.trendText,
              { color: ciScore.trend === 'up' ? '#22c55e' : ciScore.trend === 'down' ? '#ef4444' : '#888' }
            ]}>
              {ciScore.trend === 'up' ? 'Score increased' : ciScore.trend === 'down' ? 'Score decreased' : 'Score stable'}
            </Text>
          </View>

          <Text style={styles.tierDescription}>
            {getTierDescription(ciScore.tier)}
          </Text>
        </LinearGradient>

        {/* Score Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Score Breakdown</Text>
          <View style={styles.breakdownCard}>
            {Object.entries(ciScore.breakdown).map(([factor, value], index) => (
              <View key={factor}>
                <View style={styles.breakdownItem}>
                  <View style={styles.breakdownLeft}>
                    <View style={[styles.factorIcon, { backgroundColor: `${getFactorColor(factor)}20` }]}>
                      {getFactorIcon(factor)}
                    </View>
                    <View style={styles.factorInfo}>
                      <Text style={styles.factorName}>{getFactorLabel(factor)}</Text>
                      <Text style={styles.factorSubtext}>
                        Max 200 points possible
                      </Text>
                    </View>
                  </View>
                  <View style={styles.breakdownRight}>
                    <Text style={[styles.factorValue, { color: getFactorColor(factor) }]}>
                      {value}
                    </Text>
                    <Text style={styles.factorMax}>/200</Text>
                  </View>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${(value / 200) * 100}%`,
                        backgroundColor: getFactorColor(factor)
                      }
                    ]}
                  />
                </View>
                {index < Object.keys(ciScore.breakdown).length - 1 && (
                  <View style={styles.breakdownDivider} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Global Ranking */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Global Ranking</Text>
          <View style={styles.rankingCard}>
            <View style={styles.rankingItem}>
              <Text style={styles.rankingLabel}>Your Rank</Text>
              <Text style={styles.rankingValue}>#2,847</Text>
            </View>
            <View style={styles.rankingDivider} />
            <View style={styles.rankingItem}>
              <Text style={styles.rankingLabel}>Percentile</Text>
              <Text style={styles.rankingValue}>Top 15%</Text>
            </View>
            <View style={styles.rankingDivider} />
            <View style={styles.rankingItem}>
              <Text style={styles.rankingLabel}>Category</Text>
              <Text style={styles.rankingValue}>Technology</Text>
            </View>
          </View>
        </View>

        {/* Tips to Improve */}
        <View style={[styles.section, styles.lastSection]}>
          <Text style={styles.sectionTitle}>Tips to Improve</Text>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <View style={[styles.tipIcon, { backgroundColor: 'rgba(34, 197, 94, 0.2)' }]}>
                <CheckCircle size={18} color="#22c55e" />
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Add References</Text>
                <Text style={styles.tipDescription}>
                  Get verified references from colleagues to add +50 points
                </Text>
              </View>
            </View>
            <View style={styles.tipItem}>
              <View style={[styles.tipIcon, { backgroundColor: 'rgba(99, 102, 241, 0.2)' }]}>
                <Award size={18} color="#6366f1" />
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Certify Skills</Text>
                <Text style={styles.tipDescription}>
                  Add more professional certifications to boost skills score
                </Text>
              </View>
            </View>
            <View style={styles.tipItem}>
              <View style={[styles.tipIcon, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                <Shield size={18} color="#f59e0b" />
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Build Reputation</Text>
                <Text style={styles.tipDescription}>
                  Maintain consistent verification history to improve reputation
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f23',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  scoreCircleContainer: {
    marginBottom: 20,
  },
  scoreCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f23',
    ...Platform.select({
      ios: {
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  scoreValue: {
    fontSize: 52,
    fontWeight: 'bold',
  },
  scoreMax: {
    color: '#666',
    fontSize: 18,
  },
  tierBadge: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  tierText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  trendText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tierDescription: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  breakdownCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  factorIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  factorInfo: {
    flex: 1,
  },
  factorName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  factorSubtext: {
    color: '#666',
    fontSize: 11,
    marginTop: 2,
  },
  breakdownRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  factorValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  factorMax: {
    color: '#666',
    fontSize: 12,
    marginLeft: 2,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    marginTop: 4,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: '#2d2d4a',
    marginVertical: 4,
  },
  rankingCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
  },
  rankingItem: {
    flex: 1,
    alignItems: 'center',
  },
  rankingDivider: {
    width: 1,
    backgroundColor: '#333',
  },
  rankingLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
  },
  rankingValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tipDescription: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
  },
  lastSection: {
    paddingBottom: 32,
  },
});
