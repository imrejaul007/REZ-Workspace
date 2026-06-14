/**
 * AgentInsights Component
 * Shows AI agent insights and scores
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { agentOrchestrator } from '@/services/agentOrchestrator';
import { useUserStore } from '@/stores';

interface InsightCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}

export const InsightCard: React.FC<InsightCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  color,
}) => {
  const { colors } = useTheme();

  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
  const trendColor =
    trend === 'up'
      ? colors.systemGreen
      : trend === 'down'
      ? colors.systemRed
      : colors.labelSecondary;

  return (
    <View style={[styles.card, { backgroundColor: colors.backgroundElevated }]}>
      <Text style={[styles.cardTitle, { color: colors.labelSecondary }]}>{title}</Text>
      <View style={styles.cardValueRow}>
        <Text style={[styles.cardValue, { color: color || colors.label }]}>{value}</Text>
        {trend && (
          <Text style={[styles.trendIcon, { color: trendColor }]}>{trendIcon}</Text>
        )}
      </View>
      {subtitle && (
        <Text style={[styles.cardSubtitle, { color: colors.labelTertiary }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
};

interface UserScoresProps {
  compact?: boolean;
}

export const UserScores: React.FC<UserScoresProps> = ({ compact = false }) => {
  const { colors } = useTheme();
  const { profile } = useUserStore();
  const userId = profile?.id;

  const [scores, setScores] = useState<{
    churnRisk?: { score: number; level: string };
    ltv?: { ltv: number; tier: string };
    engagement?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const loadScores = async () => {
      try {
        const [churnRisk, ltv] = await Promise.all([
          agentOrchestrator.getChurnRiskScore(userId),
          agentOrchestrator.getLTVPrediction(userId),
        ]);

        setScores({ churnRisk, ltv });
      } catch (error) {
        logger.warn('Failed to load scores:', error);
      } finally {
        setLoading(false);
      }
    };

    loadScores();
  }, [userId]);

  if (loading || !scores) {
    return null;
  }

  if (compact) {
    return (
      <View style={styles.compactRow}>
        <View style={[styles.compactBadge, { backgroundColor: colors.fill }]}>
          <Text style={[styles.compactText, { color: colors.labelSecondary }]}>
            {scores.ltv?.tier?.toUpperCase() || 'STANDARD'}
          </Text>
        </View>
        <View style={[styles.compactBadge, { backgroundColor: colors.fill }]}>
          <Text style={[styles.compactText, { color: colors.labelSecondary }]}>
            {(scores.churnRisk?.level || 'low').toUpperCase()} RISK
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.label }]}>AI Insights</Text>
      <View style={styles.grid}>
        <InsightCard
          title="Lifetime Value"
          value={`₹${scores.ltv?.ltv?.toLocaleString() || 0}`}
          subtitle={scores.ltv?.tier}
          color={colors.systemGreen}
        />
        <InsightCard
          title="Churn Risk"
          value={`${Math.round((scores.churnRisk?.score || 0) * 100)}%`}
          subtitle={scores.churnRisk?.level}
          trend={
            scores.churnRisk?.level === 'high'
              ? 'up'
              : scores.churnRisk?.level === 'low'
              ? 'down'
              : 'neutral'
          }
          color={
            scores.churnRisk?.level === 'high'
              ? colors.systemRed
              : scores.churnRisk?.level === 'low'
              ? colors.systemGreen
              : colors.systemOrange
          }
        />
      </View>
    </View>
  );
};

interface TrendIndicatorProps {
  category: string;
  score: number;
  compact?: boolean;
}

export const TrendIndicator: React.FC<TrendIndicatorProps> = ({
  category,
  score,
  compact = false,
}) => {
  const { colors } = useTheme();

  const getTrendColor = () => {
    if (score >= 0.8) return colors.systemGreen;
    if (score >= 0.5) return colors.systemOrange;
    return colors.systemRed;
  };

  const getTrendLabel = () => {
    if (score >= 0.8) return 'Hot';
    if (score >= 0.5) return 'Rising';
    return 'Stable';
  };

  if (compact) {
    return (
      <View style={[styles.compactBadge, { backgroundColor: getTrendColor() + '20' }]}>
        <Text style={[styles.compactText, { color: getTrendColor() }]}>
          🔥 {getTrendLabel()}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.trendCard, { backgroundColor: colors.backgroundElevated }]}>
      <View style={styles.trendHeader}>
        <Text style={[styles.trendCategory, { color: colors.label }]}>{category}</Text>
        <View style={[styles.trendBadge, { backgroundColor: getTrendColor() + '20' }]}>
          <Text style={[styles.trendBadgeText, { color: getTrendColor() }]}>
            {Math.round(score * 100)}%
          </Text>
        </View>
      </View>
      <View style={[styles.trendBar, { backgroundColor: colors.fill }]}>
        <View
          style={[
            styles.trendBarFill,
            {
              backgroundColor: getTrendColor(),
              width: `${score * 100}%`,
            },
          ]}
        />
      </View>
    </View>
  );
};

interface EngagementScoreProps {
  score: number;
}

export const EngagementScore: React.FC<EngagementScoreProps> = ({ score }) => {
  const { colors } = useTheme();

  const getEngagementColor = () => {
    if (score >= 0.7) return colors.systemGreen;
    if (score >= 0.4) return colors.systemOrange;
    return colors.systemRed;
  };

  const getEngagementLabel = () => {
    if (score >= 0.7) return 'Highly Engaged';
    if (score >= 0.4) return 'Moderately Active';
    return 'At Risk';
  };

  return (
    <View style={[styles.engagementCard, { backgroundColor: colors.backgroundElevated }]}>
      <View style={styles.engagementHeader}>
        <Text style={[styles.engagementTitle, { color: colors.label }]}>
          Engagement
        </Text>
        <Text style={[styles.engagementScore, { color: getEngagementColor() }]}>
          {Math.round(score * 100)}%
        </Text>
      </View>
      <View style={[styles.engagementBar, { backgroundColor: colors.fill }]}>
        <View
          style={[
            styles.engagementBarFill,
            {
              backgroundColor: getEngagementColor(),
              width: `${score * 100}%`,
            },
          ]}
        />
      </View>
      <Text style={[styles.engagementLabel, { color: colors.labelSecondary }]}>
        {getEngagementLabel()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 12,
    marginBottom: 4,
  },
  cardValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  trendIcon: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  compactRow: {
    flexDirection: 'row',
    gap: 8,
  },
  compactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  compactText: {
    fontSize: 10,
    fontWeight: '600',
  },
  trendCard: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendCategory: {
    fontSize: 14,
    fontWeight: '600',
  },
  trendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  trendBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  trendBar: {
    height: 4,
    borderRadius: 2,
  },
  trendBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  engagementCard: {
    padding: 16,
    borderRadius: 12,
  },
  engagementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  engagementTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  engagementScore: {
    fontSize: 24,
    fontWeight: '700',
  },
  engagementBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 8,
  },
  engagementBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  engagementLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
});
