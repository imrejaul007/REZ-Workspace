// @ts-nocheck
/**
 * REZ Loyalty Hub - Enhanced Consumer Loyalty Experience
 *
 * Features:
 * - ReZ Score (0-1000) with tier
 * - Streak tracking with milestones
 * - Cross-merchant badges
 * - Karma-Loyalty integration
 * - AI-powered insights
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  StatusBar,
  RefreshControl,
  Text,
  Image,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/DesignSystem';
import { useAuthUser } from '@/stores/selectors';
import axios from 'axios';

// ============================================================================
// TYPES
// ============================================================================

interface ReZScore {
  composite: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'rez_elite';
  breakdown: {
    engagement: number;
    spending: number;
    karma: number;
    social: number;
    streak: number;
  };
}

interface StreakData {
  current: number;
  longest: number;
  lastVisit: string;
  milestones: MilestoneProgress[];
}

interface MilestoneProgress {
  days: number;
  coins: number;
  badge?: string;
  achieved: boolean;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  progress: number;
  required: number;
  earned: boolean;
  earnedAt?: string;
}

interface LoyaltyProfile {
  userId: string;
  reZScore: ReZScore;
  streak: StreakData;
  loyalty: {
    points: number;
    lifetimeSpend: number;
    visitCount: number;
    tier: string;
  };
  karma: {
    score: number;
    level: string;
    badges: string[];
  };
  badges: Badge[];
  aiInsights?: {
    satisfactionScore: number;
    churnRisk: number;
    recommendedActions: string[];
  };
}

interface CustomerHealth {
  score: number;
  level: string;
  factors: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PROFILE_SERVICE = process.env.PROFILE_SERVICE_URL || 'https://rez-profile-service.onrender.com';
const TIER_CONFIG = {
  bronze: { color: '#CD7F32', min: 0, title: 'Explorer' },
  silver: { color: '#C0C0C0', min: 200, title: 'Active' },
  gold: { color: '#FFD700', min: 400, title: 'Regular' },
  platinum: { color: '#E5E4E2', min: 600, title: 'Loyal' },
  diamond: { color: '#B9F2FF', min: 800, title: 'Champion' },
  rez_elite: { color: '#FF6B6B', min: 900, title: 'Legend' },
};

const STREAK_MILESTONES = [
  { days: 3, coins: 10, badge: 'streak_starter' },
  { days: 7, coins: 50, badge: 'weekly_warrior' },
  { days: 14, coins: 100, badge: 'streak_master' },
  { days: 30, coins: 250, badge: 'loyal_legend' },
  { days: 60, coins: 500, badge: 'unstoppable' },
  { days: 90, coins: 1000, badge: 'rez_champion' },
];

const CROSS_MERCHANT_BADGES = [
  { id: 'cafe_explorer', name: 'Cafe Explorer', category: 'cafe', required: 5, icon: 'cafe' },
  { id: 'coffee_connoisseur', name: 'Coffee Connoisseur', category: 'cafe', required: 10, icon: 'cafe' },
  { id: 'foodie_elite', name: 'Foodie Elite', category: 'restaurant', required: 5, icon: 'restaurant' },
  { id: 'glow_member', name: 'Glow Member', category: 'salon', required: 3, icon: 'sparkles' },
  { id: 'rez_citizen', name: 'ReZ Citizen', category: 'city', required: 10, icon: 'people' },
  { id: 'city_explorer', name: 'City Explorer', category: 'city', required: 20, icon: 'map' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function LoyaltyHubPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<LoyaltyProfile | null>(null);
  const [customerHealth, setCustomerHealth] = useState<CustomerHealth | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'badges' | 'streaks' | 'insights'>('overview');

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await axios.get(`${PROFILE_SERVICE}/api/v1/profile/${user.id}/summary`);
      if (response.data?.data) {
        setProfile(response.data.data);
      }
    } catch (error) {
      logger.error('Failed to fetch profile:', error);
      // Use mock data for demo
      setProfile(getMockProfile());
    }
  }, [user?.id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  // ============================================================================
  // RENDER: HEADER WITH REZ SCORE
  // ============================================================================

  const renderHeader = () => {
    const tier = profile?.reZScore?.tier || 'bronze';
    const score = profile?.reZScore?.composite || 0;
    const tierInfo = TIER_CONFIG[tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.bronze;

    return (
      <LinearGradient
        colors={[tierInfo.color, Colors.background]}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          {/* User greeting */}
          <View style={styles.headerTop}>
            <View>
              <ThemedText type="title" style={styles.greeting}>
                Hello, {user?.name || 'Explorer'}!
              </ThemedText>
              <View style={styles.tierBadge}>
                <Ionicons name="star" size={14} color={tierInfo.color} />
                <ThemedText type="caption" style={[styles.tierText, { color: tierInfo.color }]}>
                  {tierInfo.title} Member
                </ThemedText>
              </View>
            </View>
            <Pressable style={styles.settingsButton}>
              <Ionicons name="settings-outline" size={24} color={Colors.text} />
            </Pressable>
          </View>

          {/* ReZ Score Circle */}
          <View style={styles.scoreContainer}>
            <View style={[styles.scoreCircle, { borderColor: tierInfo.color }]}>
              <ThemedText type="hero" style={styles.scoreNumber}>
                {score}
              </ThemedText>
              <ThemedText type="caption" style={styles.scoreLabel}>
                ReZ Score
              </ThemedText>
            </View>

            {/* Progress to next tier */}
            <View style={styles.nextTierContainer}>
              <ThemedText type="caption" style={styles.nextTierLabel}>
                {getNextTierLabel(tier, score)}
              </ThemedText>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${getProgressPercent(tier, score)}%`,
                      backgroundColor: tierInfo.color,
                    },
                  ]}
                />
              </View>
              <ThemedText type="caption" style={styles.progressLabel}>
                {getPointsToNextTier(tier, score)} points to {getNextTierName(tier)}
              </ThemedText>
            </View>
          </View>

          {/* Quick Stats Row */}
          <View style={styles.quickStats}>
            <QuickStat
              icon="wallet"
              value={profile?.loyalty?.points?.toLocaleString() || '0'}
              label="Points"
            />
            <QuickStat
              icon="local-fireburn"
              value={profile?.streak?.current?.toString() || '0'}
              label="Day Streak"
            />
            <QuickStat
              icon="trophy"
              value={profile?.badges?.filter(b => b.earned).length.toString() || '0'}
              label="Badges"
            />
            <QuickStat
              icon="heart"
              value={profile?.karma?.level || 'L1'}
              label="Karma"
            />
          </View>
        </View>
      </LinearGradient>
    );
  };

  // ============================================================================
  // RENDER: TAB NAVIGATION
  // ============================================================================

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      {['overview', 'badges', 'streaks', 'insights'].map((tab) => (
        <Pressable
          key={tab}
          style={[styles.tab, activeTab === tab && styles.activeTab]}
          onPress={() => setActiveTab(tab as unknown)}
        >
          <ThemedText
            type="caption"
            style={[styles.tabText, activeTab === tab && styles.activeTabText]}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );

  // ============================================================================
  // RENDER: OVERVIEW TAB
  // ============================================================================

  const renderOverview = () => (
    <View style={styles.section}>
      {/* Score Breakdown */}
      {profile?.reZScore?.breakdown && (
        <View style={styles.card}>
          <ThemedText type="title" style={styles.cardTitle}>
            Your Score Breakdown
          </ThemedText>
          <ScoreBreakdown breakdown={profile.reZScore.breakdown} />
        </View>
      )}

      {/* Loyalty Summary */}
      <View style={styles.card}>
        <ThemedText type="title" style={styles.cardTitle}>
          Loyalty Summary
        </ThemedText>
        <View style={styles.loyaltySummary}>
          <LoyaltyStat
            label="Total Points"
            value={profile?.loyalty?.points?.toLocaleString() || '0'}
            icon="diamond"
            color={Colors.primary}
          />
          <LoyaltyStat
            label="Lifetime Spend"
            value={`₹${(profile?.loyalty?.lifetimeSpend || 0).toLocaleString()}`}
            icon="wallet"
            color="#10B981"
          />
          <LoyaltyStat
            label="Total Visits"
            value={profile?.loyalty?.visitCount?.toString() || '0'}
            icon="location"
            color="#F59E0B"
          />
        </View>
      </View>

      {/* Karma Summary */}
      <View style={styles.card}>
        <ThemedText type="title" style={styles.cardTitle}>
          Karma Impact
        </ThemedText>
        <View style={styles.karmaContainer}>
          <View style={styles.karmaScore}>
            <Ionicons name="heart" size={32} color="#EF4444" />
            <ThemedText type="title" style={styles.karmaNumber}>
              {profile?.karma?.score || 0}
            </ThemedText>
            <ThemedText type="caption" style={styles.karmaLabel}>
              Karma Score
            </ThemedText>
          </View>
          <View style={styles.karmaDetails}>
            <View style={styles.karmaBadge}>
              <ThemedText type="body" style={styles.karmaLevel}>
                {profile?.karma?.level || 'L1'}
              </ThemedText>
              <ThemedText type="caption" style={styles.karmaLevelLabel}>
                Current Level
              </ThemedText>
            </View>
            <View style={styles.karmaBadges}>
              {(profile?.karma?.badges || []).slice(0, 3).map((badge, i) => (
                <View key={i} style={styles.karmaBadgeIcon}>
                  <Ionicons name="ribbon" size={16} color="#EF4444" />
                </View>
              ))}
            </View>
          </View>
        </View>
        <Pressable style={styles.learnMoreButton}>
          <ThemedText type="caption" style={styles.learnMoreText}>
            How Karma converts to Loyalty →
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );

  // ============================================================================
  // RENDER: BADGES TAB
  // ============================================================================

  const renderBadges = () => (
    <View style={styles.section}>
      <ThemedText type="title" style={styles.sectionTitle}>
        City-Wide Badges
      </ThemedText>
      <ThemedText type="caption" style={styles.sectionSubtitle}>
        Visit different merchants to unlock badges
      </ThemedText>

      {CROSS_MERCHANT_BADGES.map((badge) => (
        <BadgeCard key={badge.id} badge={badge} profile={profile} />
      ))}
    </View>
  );

  // ============================================================================
  // RENDER: STREAKS TAB
  // ============================================================================

  const renderStreaks = () => (
    <View style={styles.section}>
      <ThemedText type="title" style={styles.sectionTitle}>
        Your Streak Journey
      </ThemedText>

      {/* Current Streak */}
      <View style={styles.streakCard}>
        <View style={styles.streakHeader}>
          <Ionicons name="local-fireburn" size={40} color="#F59E0B" />
          <View>
            <ThemedText type="hero" style={styles.streakNumber}>
              {profile?.streak?.current || 0}
            </ThemedText>
            <ThemedText type="caption" style={styles.streakLabel}>
              Current Streak (days)
            </ThemedText>
          </View>
        </View>
        <View style={styles.streakStats}>
          <View style={styles.streakStat}>
            <ThemedText type="body" style={styles.streakStatValue}>
              {profile?.streak?.longest || 0}
            </ThemedText>
            <ThemedText type="caption" style={styles.streakStatLabel}>
              Longest
            </ThemedText>
          </View>
          <View style={styles.streakStat}>
            <ThemedText type="body" style={styles.streakStatValue}>
              {getDaysSinceLastVisit(profile?.streak?.lastVisit)}
            </ThemedText>
            <ThemedText type="caption" style={styles.streakStatLabel}>
              Days Since Last
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Milestones */}
      <ThemedText type="title" style={styles.milestoneTitle}>
        Milestone Rewards
      </ThemedText>
      {STREAK_MILESTONES.map((milestone) => (
        <MilestoneCard
          key={milestone.days}
          milestone={milestone}
          currentStreak={profile?.streak?.current || 0}
        />
      ))}
    </View>
  );

  // ============================================================================
  // RENDER: INSIGHTS TAB
  // ============================================================================

  const renderInsights = () => (
    <View style={styles.section}>
      <ThemedText type="title" style={styles.sectionTitle}>
        AI Insights
      </ThemedText>

      {/* Customer Health */}
      {customerHealth && (
        <View style={styles.healthCard}>
          <View style={styles.healthHeader}>
            <Ionicons
              name="pulse"
              size={24}
              color={getHealthColor(customerHealth.score)}
            />
            <ThemedText type="title" style={styles.healthTitle}>
              Customer Health
            </ThemedText>
          </View>
          <View style={styles.healthScore}>
            <ThemedText
              type="hero"
              style={[styles.healthScoreValue, { color: getHealthColor(customerHealth.score) }]}
            >
              {customerHealth.score}
            </ThemedText>
            <ThemedText type="caption">/100</ThemedText>
          </View>
          <View style={styles.healthBar}>
            <View
              style={[
                styles.healthBarFill,
                { width: `${customerHealth.score}%`, backgroundColor: getHealthColor(customerHealth.score) },
              ]}
            />
          </View>
          <ThemedText type="body" style={styles.healthLevel}>
            {customerHealth.level.charAt(0).toUpperCase() + customerHealth.level.slice(1).replace('_', ' ')}
          </ThemedText>
        </View>
      )}

      {/* Recommended Actions */}
      <View style={styles.card}>
        <ThemedText type="title" style={styles.cardTitle}>
          Recommended For You
        </ThemedText>
        {(profile?.aiInsights?.recommendedActions || getDefaultRecommendations()).map((action, i) => (
          <View key={i} style={styles.actionItem}>
            <Ionicons name="bulb" size={20} color={Colors.primary} />
            <ThemedText type="body" style={styles.actionText}>{action}</ThemedText>
          </View>
        ))}
      </View>

      {/* Benefits at Current Tier */}
      <View style={styles.card}>
        <ThemedText type="title" style={styles.cardTitle}>
          Your Tier Benefits
        </ThemedText>
        <View style={styles.benefitsList}>
          {(getTierBenefits(profile?.reZScore?.tier || 'bronze') || []).map((benefit, i) => (
            <View key={i} style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <ThemedText type="body" style={styles.benefitText}>{benefit}</ThemedText>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderHeader()}
        {renderTabs()}

        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'badges' && renderBadges()}
        {activeTab === 'streaks' && renderStreaks()}
        {activeTab === 'insights' && renderInsights()}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const QuickStat = ({ icon, value, label }: { icon: string; value: string; label: string }) => (
  <View style={styles.quickStat}>
    <Ionicons name={icon as unknown} size={20} color={Colors.textSecondary} />
    <ThemedText type="title" style={styles.quickStatValue}>{value}</ThemedText>
    <ThemedText type="caption" style={styles.quickStatLabel}>{label}</ThemedText>
  </View>
);

const ScoreBreakdown = ({ breakdown }: { breakdown: ReZScore['breakdown'] }) => (
  <View style={styles.breakdown}>
    {Object.entries(breakdown).map(([key, value]) => (
      <View key={key} style={styles.breakdownItem}>
        <View style={styles.breakdownHeader}>
          <ThemedText type="caption" style={styles.breakdownLabel}>
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </ThemedText>
          <ThemedText type="body" style={styles.breakdownValue}>{value}</ThemedText>
        </View>
        <View style={styles.miniBar}>
          <View style={[styles.miniBarFill, { width: `${value}%` }]} />
        </View>
      </View>
    ))}
  </View>
);

const LoyaltyStat = ({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) => (
  <View style={styles.loyaltyStat}>
    <Ionicons name={icon as unknown} size={24} color={color} />
    <ThemedText type="title" style={styles.loyaltyStatValue}>{value}</ThemedText>
    <ThemedText type="caption" style={styles.loyaltyStatLabel}>{label}</ThemedText>
  </View>
);

const BadgeCard = ({ badge, profile }: { badge: typeof CROSS_MERCHANT_BADGES[0]; profile: LoyaltyProfile | null }) => {
  const userBadge = profile?.badges?.find(b => b.id === badge.id);
  const progress = userBadge?.progress || 0;
  const earned = userBadge?.earned || false;

  return (
    <View style={[styles.badgeCard, earned && styles.badgeCardEarned]}>
      <View style={[styles.badgeIcon, earned && styles.badgeIconEarned]}>
        <Ionicons name={badge.icon as unknown} size={28} color={earned ? '#FFF' : Colors.textSecondary} />
      </View>
      <View style={styles.badgeContent}>
        <ThemedText type="body" style={[styles.badgeName, earned && styles.badgeNameEarned]}>
          {badge.name}
        </ThemedText>
        <ThemedText type="caption" style={styles.badgeCategory}>
          {badge.category.charAt(0).toUpperCase() + badge.category.slice(1)}
        </ThemedText>
        <View style={styles.badgeProgress}>
          <View style={styles.badgeProgressBar}>
            <View
              style={[
                styles.badgeProgressFill,
                { width: `${Math.min(100, (progress / badge.required) * 100)}%` },
              ]}
            />
          </View>
          <ThemedText type="caption" style={styles.badgeProgressText}>
            {progress}/{badge.required}
          </ThemedText>
        </View>
      </View>
      {earned && (
        <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
      )}
    </View>
  );
};

const MilestoneCard = ({ milestone, currentStreak }: { milestone: typeof STREAK_MILESTONES[0]; currentStreak: number }) => {
  const achieved = currentStreak >= milestone.days;
  const nextMilestone = currentStreak < milestone.days ? milestone.days - currentStreak : 0;

  return (
    <View style={[styles.milestoneCard, achieved && styles.milestoneCardAchieved]}>
      <View style={styles.milestoneLeft}>
        <View style={[styles.milestoneIcon, achieved && styles.milestoneIconAchieved]}>
          <Ionicons
            name={achieved ? 'checkmark' : 'gift'}
            size={20}
            color={achieved ? '#FFF' : Colors.textSecondary}
          />
        </View>
        {currentStreak > 0 && !achieved && (
          <View style={styles.milestoneConnector} />
        )}
      </View>
      <View style={styles.milestoneContent}>
        <View style={styles.milestoneHeader}>
          <ThemedText type="body" style={styles.milestoneDays}>
            {milestone.days} Days
          </ThemedText>
          {achieved && (
            <View style={styles.achievedBadge}>
              <Ionicons name="trophy" size={12} color="#FFD700" />
              <ThemedText type="caption" style={styles.achievedText}>Achieved!</ThemedText>
            </View>
          )}
        </View>
        <ThemedText type="caption" style={styles.milestoneReward}>
          {milestone.coins} coins + {milestone.badge?.replace('_', ' ')}
        </ThemedText>
        {!achieved && nextMilestone > 0 && (
          <ThemedText type="caption" style={styles.milestoneNext}>
            {nextMilestone} days to go
          </ThemedText>
        )}
      </View>
    </View>
  );
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getMockProfile(): LoyaltyProfile {
  return {
    userId: 'user_demo',
    reZScore: {
      composite: 520,
      tier: 'gold',
      breakdown: {
        engagement: 65,
        spending: 70,
        karma: 80,
        social: 45,
        streak: 40,
      },
    },
    streak: {
      current: 7,
      longest: 14,
      lastVisit: new Date(Date.now() - 86400000).toISOString(),
      milestones: [],
    },
    loyalty: {
      points: 2500,
      lifetimeSpend: 15000,
      visitCount: 45,
      tier: 'gold',
    },
    karma: {
      score: 350,
      level: 'L2',
      badges: ['volunteer', 'donor'],
    },
    badges: [],
    aiInsights: {
      satisfactionScore: 85,
      churnRisk: 15,
      recommendedActions: [
        'Visit your favorite cafe this week for bonus points!',
        'Complete your Cafe Explorer badge - just 2 more cafes to go',
        'You\'re on track for Gold tier renewal!',
      ],
    },
  };
}

function getNextTierLabel(tier: string, score: number): string {
  const tiers = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'rez_elite'];
  const tierIndex = tiers.indexOf(tier);
  if (tierIndex >= tiers.length - 1) return 'Maximum tier reached!';

  const nextTier = tiers[tierIndex + 1];
  const nextMin = TIER_CONFIG[nextTier as keyof typeof TIER_CONFIG]?.min || 0;
  return `Next: ${nextTier.charAt(0).toUpperCase() + nextTier.slice(1)}`;
}

function getNextTierName(tier: string): string {
  const tiers = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'rez_elite'];
  const tierIndex = tiers.indexOf(tier);
  if (tierIndex >= tiers.length - 1) return 'Max';
  return tiers[tierIndex + 1].charAt(0).toUpperCase() + tiers[tierIndex + 1].slice(1);
}

function getPointsToNextTier(tier: string, score: number): number {
  const tiers = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'rez_elite'];
  const tierIndex = tiers.indexOf(tier);
  if (tierIndex >= tiers.length - 1) return 0;

  const nextMin = TIER_CONFIG[tiers[tierIndex + 1] as keyof typeof TIER_CONFIG]?.min || 1000;
  return Math.max(0, nextMin - score);
}

function getProgressPercent(tier: string, score: number): number {
  const tiers = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'rez_elite'];
  const tierIndex = tiers.indexOf(tier);
  if (tierIndex >= tiers.length - 1) return 100;

  const currentMin = TIER_CONFIG[tier as keyof typeof TIER_CONFIG]?.min || 0;
  const nextMin = TIER_CONFIG[tiers[tierIndex + 1] as keyof typeof TIER_CONFIG]?.min || 1000;
  const range = nextMin - currentMin;
  const progress = score - currentMin;

  return Math.min(100, Math.max(0, (progress / range) * 100));
}

function getDaysSinceLastVisit(lastVisit?: string): string {
  if (!lastVisit) return 'N/A';
  const days = Math.floor((Date.now() - new Date(lastVisit).getTime()) / 86400000);
  return days === 0 ? 'Today' : `${days}d ago`;
}

function getHealthColor(score: number): string {
  if (score >= 80) return '#10B981';
  if (score >= 60) return '#F59E0B';
  if (score >= 40) return '#F97316';
  return '#EF4444';
}

function getTierBenefits(tier: string): string[] {
  const benefits: Record<string, string[]> = {
    bronze: ['Earn 1x points on purchases', 'Basic support'],
    silver: ['Earn 1.1x points', 'Priority support', 'Birthday bonus'],
    gold: ['Earn 1.2x points', 'Priority support', 'Early access', 'Birthday bonus'],
    platinum: ['Earn 1.3x points', 'VIP support', 'Early access', 'Free delivery', 'Birthday bonus'],
    diamond: ['Earn 1.4x points', 'Concierge support', 'Exclusive events', 'Free delivery', 'Birthday bonus'],
    rez_elite: ['Earn 1.5x points', 'White-glove support', 'All exclusive perks', 'VIP events'],
  };
  return benefits[tier] || benefits.bronze;
}

function getDefaultRecommendations(): string[] {
  return [
    'Place an order today to maintain your streak!',
    'Explore a new category to earn cross-merchant badges',
    'Check out current offers in your area',
  ];
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    paddingHorizontal: Spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  greeting: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  tierText: {
    marginLeft: 4,
    fontWeight: '600',
  },
  settingsButton: {
    padding: 8,
  },
  scoreContainer: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  scoreCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreNumber: {
    color: '#FFF',
    fontSize: 42,
    fontWeight: 'bold',
  },
  scoreLabel: {
    color: 'rgba(255,255,255,0.8)',
  },
  nextTierContainer: {
    width: '80%',
    marginTop: Spacing.md,
  },
  nextTierLabel: {
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabel: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 4,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.lg,
  },
  quickStat: {
    alignItems: 'center',
  },
  quickStatValue: {
    color: '#FFF',
    marginTop: 4,
  },
  quickStatLabel: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginTop: -20,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  cardTitle: {
    marginBottom: Spacing.md,
  },
  breakdown: {},
  breakdownItem: {
    marginBottom: Spacing.sm,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownLabel: {
    color: Colors.textSecondary,
  },
  breakdownValue: {
    fontWeight: '600',
  },
  miniBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  loyaltySummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  loyaltyStat: {
    alignItems: 'center',
  },
  loyaltyStatValue: {
    marginTop: 4,
  },
  loyaltyStatLabel: {
    color: Colors.textSecondary,
    marginTop: 2,
  },
  karmaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  karmaScore: {
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  karmaNumber: {
    marginTop: 4,
  },
  karmaLabel: {
    color: Colors.textSecondary,
  },
  karmaDetails: {
    flex: 1,
  },
  karmaBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  karmaLevel: {
    color: '#EF4444',
    fontWeight: '600',
  },
  karmaLevelLabel: {
    color: Colors.textSecondary,
  },
  karmaBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  karmaBadgeIcon: {
    backgroundColor: '#FEE2E2',
    padding: 6,
    borderRadius: 12,
  },
  learnMoreButton: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  learnMoreText: {
    color: Colors.primary,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  badgeCardEarned: {
    borderWidth: 2,
    borderColor: Colors.success,
  },
  badgeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  badgeIconEarned: {
    backgroundColor: Colors.success,
  },
  badgeContent: {
    flex: 1,
  },
  badgeName: {
    fontWeight: '600',
  },
  badgeNameEarned: {
    color: Colors.success,
  },
  badgeCategory: {
    color: Colors.textSecondary,
  },
  badgeProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  badgeProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  badgeProgressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  badgeProgressText: {
    marginLeft: 8,
    color: Colors.textSecondary,
  },
  streakCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  streakNumber: {
    marginLeft: Spacing.md,
    color: '#F59E0B',
  },
  streakLabel: {
    color: Colors.textSecondary,
  },
  streakStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  streakStat: {
    alignItems: 'center',
  },
  streakStatValue: {
    fontWeight: '600',
  },
  streakStatLabel: {
    color: Colors.textSecondary,
    marginTop: 4,
  },
  milestoneTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  milestoneCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  milestoneCardAchieved: {
    backgroundColor: '#ECFDF5',
  },
  milestoneLeft: {
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  milestoneIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestoneIconAchieved: {
    backgroundColor: Colors.success,
  },
  milestoneConnector: {
    width: 2,
    height: 40,
    backgroundColor: Colors.border,
    marginTop: 4,
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  milestoneDays: {
    fontWeight: '600',
  },
  achievedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  achievedText: {
    color: '#D97706',
    marginLeft: 4,
  },
  milestoneReward: {
    color: Colors.textSecondary,
    marginTop: 4,
  },
  milestoneNext: {
    color: Colors.primary,
    marginTop: 4,
  },
  healthCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    alignItems: 'center',
    ...Shadows.md,
  },
  healthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  healthTitle: {
    marginLeft: 8,
  },
  healthScore: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  healthScoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  healthBar: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    marginVertical: Spacing.md,
    overflow: 'hidden',
  },
  healthBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  healthLevel: {
    textTransform: 'capitalize',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  actionText: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  benefitsList: {},
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  bottomPadding: {
    height: 100,
  },
});
