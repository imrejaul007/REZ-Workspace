/**
 * Copilot Dashboard
 *
 * AI-powered insights dashboard connecting to REZ Intent Graph agents.
 * Shows real-time intelligence from all 8 AI agents:
 * 1. DemandSignal Agent
 * 2. Scarcity Agent
 * 3. Personalization Agent
 * 4. Attribution Agent
 * 5. ChurnSignal Agent
 * 6. MarginAlert Agent
 * 7. InventoryForecast Agent
 * 8. RevenueOptimizer Agent
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';

import { Colors, Shadows } from '@/constants/DesignTokens';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import {
  useCopilotDashboard,
  useAgentStatuses,
  useDemandTrends,
  useScarcitySummary,
  useRevenueImpact,
  useInventoryAlerts,
  useHighPriorityInsights,
  useMarginAlerts,
  useChurnSignals,
  useRefreshAgents,
} from '@/hooks/useCopilotInsights';

const { width } = Dimensions.get('window');

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatCurrency(n: number): string {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatPercentage(n: number): string {
  return `${n.toFixed(1)}%`;
}

function formatTimeAgo(date: Date | string | null): string {
  if (!date) return 'Never';
  const d = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// ─── Agent Icons Map ───────────────────────────────────────────────────────────

const AGENT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'demand-signal-agent': 'trending-up',
  'scarcity-agent': 'flash',
  'personalization-agent': 'person',
  'attribution-agent': 'link',
  'adaptive-scoring-agent': 'analytics',
  'feedback-loop-agent': 'refresh',
  'network-effect-agent': 'git-network',
  'revenue-attribution-agent': 'cash',
  'churn-signal-agent': 'warning',
  'margin-alert-agent': 'alert-circle',
  'inventory-forecast-agent': 'cube',
  'revenue-optimizer-agent': 'trending-up',
};

const AGENT_COLORS: Record<string, string> = {
  'demand-signal-agent': '#10B981',
  'scarcity-agent': '#F59E0B',
  'personalization-agent': '#8B5CF6',
  'attribution-agent': '#3B82F6',
  'adaptive-scoring-agent': '#EC4899',
  'feedback-loop-agent': '#06B6D4',
  'network-effect-agent': '#6366F1',
  'revenue-attribution-agent': '#84CC16',
  'churn-signal-agent': '#EF4444',
  'margin-alert-agent': '#F97316',
  'inventory-forecast-agent': '#14B8A6',
  'revenue-optimizer-agent': '#A855F7',
};

// ─── Agent Card Component ───────────────────────────────────────────────────────

interface AgentCardProps {
  name: string;
  status: 'healthy' | 'degraded' | 'failed';
  lastRun: string | null;
  avgDurationMs: number;
  consecutiveFailures: number;
}

const AgentCard: React.FC<AgentCardProps> = ({
  name,
  status,
  lastRun,
  avgDurationMs,
  consecutiveFailures,
}) => {
  const icon = AGENT_ICONS[name] || 'bulb';
  const color = AGENT_COLORS[name] || '#6B7280';

  const statusColors = {
    healthy: { bg: '#D1FAE5', text: '#059669', icon: 'checkmark-circle' },
    degraded: { bg: '#FEF3C7', text: '#D97706', icon: 'warning' },
    failed: { bg: '#FEE2E2', text: '#DC2626', icon: 'close-circle' },
  };

  const s = statusColors[status];

  return (
    <View style={[agentCardStyles.card, { borderLeftColor: color }]}>
      <View style={agentCardStyles.header}>
        <View style={[agentCardStyles.iconWrap, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon} size={16} color={color} />
        </View>
        <Text style={agentCardStyles.name} numberOfLines={1}>
          {name.replace('-agent', '').replace(/-/g, ' ')}
        </Text>
      </View>
      <View style={[agentCardStyles.statusBadge, { backgroundColor: s.bg }]}>
        <Ionicons name={s.icon as keyof typeof Ionicons.glyphMap} size={12} color={s.text} />
        <Text style={[agentCardStyles.statusText, { color: s.text }]}>{status}</Text>
      </View>
      <View style={agentCardStyles.stats}>
        <Text style={agentCardStyles.statLabel}>Last run: {formatTimeAgo(lastRun)}</Text>
        <Text style={agentCardStyles.statLabel}>
          Avg: {avgDurationMs > 1000 ? `${(avgDurationMs / 1000).toFixed(1)}s` : `${avgDurationMs}ms`}
        </Text>
      </View>
      {consecutiveFailures > 0 && (
        <View style={agentCardStyles.failureBadge}>
          <Text style={agentCardStyles.failureText}>{consecutiveFailures} failures</Text>
        </View>
      )}
    </View>
  );
};

const agentCardStyles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    width: (width - 48) / 2,
    ...Shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text.primary,
    flex: 1,
    textTransform: 'capitalize',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  stats: {
    gap: 2,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.text.tertiary,
  },
  failureBadge: {
    marginTop: 6,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  failureText: {
    fontSize: 9,
    color: '#DC2626',
    fontWeight: '600',
  },
});

// ─── Insight Card Component ─────────────────────────────────────────────────────

interface InsightCardProps {
  insight: {
    id: string;
    title: string;
    description: string;
    type: string;
    priority: string;
    value?: number;
    unit?: string;
    trend?: string;
    timestamp: string;
  };
  onDismiss?: (id: string) => void;
}

const InsightCard: React.FC<InsightCardProps> = ({ insight, onDismiss }) => {
  const typeIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
    opportunity: 'sparkles',
    alert: 'alert-circle',
    recommendation: 'bulb',
    metric: 'analytics',
  };

  const priorityColors: Record<string, string> = {
    high: '#EF4444',
    medium: '#F59E0B',
    low: '#6B7280',
  };

  const icon = typeIcons[insight.type] || 'information-circle';
  const color = priorityColors[insight.priority] || '#6B7280';

  return (
    <View style={[insightCardStyles.card, { borderLeftColor: color }]}>
      <View style={insightCardStyles.header}>
        <View style={[insightCardStyles.iconWrap, { backgroundColor: `${color}15` }]}>
          <Ionicons name={icon} size={14} color={color} />
        </View>
        <View style={insightCardStyles.titleRow}>
          <Text style={insightCardStyles.title} numberOfLines={1}>
            {insight.title}
          </Text>
          <View style={[insightCardStyles.priorityBadge, { backgroundColor: `${color}20` }]}>
            <Text style={[insightCardStyles.priorityText, { color }]}>{insight.priority}</Text>
          </View>
        </View>
      </View>
      <Text style={insightCardStyles.description} numberOfLines={2}>
        {insight.description}
      </Text>
      <View style={insightCardStyles.footer}>
        {insight.value !== undefined && (
          <Text style={[insightCardStyles.value, { color }]}>
            {insight.value.toLocaleString()} {insight.unit || ''}
          </Text>
        )}
        {insight.trend && (
          <View style={insightCardStyles.trendRow}>
            <Ionicons
              name={
                insight.trend === 'rising'
                  ? 'trending-up'
                  : insight.trend === 'declining'
                    ? 'trending-down'
                    : 'remove'
              }
              size={12}
              color={color}
            />
            <Text style={[insightCardStyles.trendText, { color }]}>{insight.trend}</Text>
          </View>
        )}
        {onDismiss && (
          <TouchableOpacity onPress={() => onDismiss(insight.id)} style={insightCardStyles.dismissBtn}>
            <Ionicons name="close" size={14} color={Colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const insightCardStyles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    marginBottom: 8,
    ...Shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 6,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.primary,
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 16,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  dismissBtn: {
    padding: 4,
  },
});

// ─── Metric Card Component ──────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: string;
  subLabel?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  trend?: number;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, subLabel, icon, color, trend }) => (
  <View style={[metricCardStyles.card, { borderTopColor: color }]}>
    <View style={[metricCardStyles.iconWrap, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <Text style={metricCardStyles.label}>{label}</Text>
    <Text style={[metricCardStyles.value, { color }]}>{value}</Text>
    {subLabel && <Text style={metricCardStyles.subLabel}>{subLabel}</Text>}
    {typeof trend === 'number' && (
      <View style={[metricCardStyles.trendBadge, { backgroundColor: trend >= 0 ? '#D1FAE5' : '#FEE2E2' }]}>
        <Ionicons
          name={trend >= 0 ? 'trending-up' : 'trending-down'}
          size={10}
          color={trend >= 0 ? '#059669' : '#DC2626'}
        />
        <Text style={[metricCardStyles.trendText, { color: trend >= 0 ? '#059669' : '#DC2626' }]}>
          {Math.abs(trend).toFixed(1)}%
        </Text>
      </View>
    )}
  </View>
);

const metricCardStyles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    borderTopWidth: 3,
    width: (width - 48) / 2,
    ...Shadows.sm,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 11,
    color: Colors.text.tertiary,
    fontWeight: '500',
    marginBottom: 2,
  },
  value: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subLabel: {
    fontSize: 10,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  trendText: {
    fontSize: 10,
    fontWeight: '700',
  },
});

// ─── Demand Trend Item ──────────────────────────────────────────────────────────

interface DemandTrendItemProps {
  demand: {
    category: string;
    demandCount: number;
    unmetDemandPct: number;
    trend: string;
    spikeDetected: boolean;
    topCities: string[];
  };
}

const DemandTrendItem: React.FC<DemandTrendItemProps> = ({ demand }) => {
  const trendColor = demand.trend === 'rising' ? '#10B981' : demand.trend === 'declining' ? '#EF4444' : '#6B7280';

  return (
    <View style={demandStyles.item}>
      <View style={demandStyles.header}>
        <Text style={demandStyles.category}>{demand.category}</Text>
        {demand.spikeDetected && (
          <View style={demandStyles.spikeBadge}>
            <Ionicons name="flash" size={10} color="#F59E0B" />
            <Text style={demandStyles.spikeText}>Spike!</Text>
          </View>
        )}
      </View>
      <View style={demandStyles.stats}>
        <View style={demandStyles.stat}>
          <Text style={demandStyles.statValue}>{demand.demandCount}</Text>
          <Text style={demandStyles.statLabel}>Demand</Text>
        </View>
        <View style={demandStyles.stat}>
          <Text style={demandStyles.statValue}>{demand.unmetDemandPct}%</Text>
          <Text style={demandStyles.statLabel}>Unmet</Text>
        </View>
        <View style={demandStyles.stat}>
          <Ionicons
            name={demand.trend === 'rising' ? 'trending-up' : demand.trend === 'declining' ? 'trending-down' : 'remove'}
            size={14}
            color={trendColor}
          />
          <Text style={[demandStyles.statLabel, { color: trendColor }]}>{demand.trend}</Text>
        </View>
      </View>
      {demand.topCities.length > 0 && (
        <View style={demandStyles.cities}>
          {demand.topCities.slice(0, 3).map((city, idx) => (
            <View key={idx} style={demandStyles.cityBadge}>
              <Text style={demandStyles.cityText}>{city}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const demandStyles = StyleSheet.create({
  item: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    ...Shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  category: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  spikeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  spikeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stat: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.text.tertiary,
    textTransform: 'capitalize',
  },
  cities: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  cityBadge: {
    backgroundColor: Colors.gray[100],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  cityText: {
    fontSize: 10,
    color: Colors.text.secondary,
  },
});

// ─── Inventory Alert Item ───────────────────────────────────────────────────────

interface InventoryAlertItemProps {
  forecast: {
    category: string;
    currentStock: number;
    daysUntilStockout: number;
    dailyBurnRate: number;
    restockRecommendation: {
      quantity: number;
      urgency: string;
    };
  };
}

const InventoryAlertItem: React.FC<InventoryAlertItemProps> = ({ forecast }) => {
  const urgencyColors: Record<string, { bg: string; text: string }> = {
    critical: { bg: '#FEE2E2', text: '#DC2626' },
    high: { bg: '#FEF3C7', text: '#D97706' },
    medium: { bg: '#DBEAFE', text: '#2563EB' },
    low: { bg: '#D1FAE5', text: '#059669' },
  };

  const c = urgencyColors[forecast.restockRecommendation.urgency] || urgencyColors.low;

  return (
    <View style={[invStyles.item, { borderLeftColor: c.text }]}>
      <View style={invStyles.header}>
        <Text style={invStyles.category}>{forecast.category}</Text>
        <View style={[invStyles.urgencyBadge, { backgroundColor: c.bg }]}>
          <Text style={[invStyles.urgencyText, { color: c.text }]}>
            {forecast.daysUntilStockout <= 2 ? 'Critical!' : `${forecast.daysUntilStockout}d left`}
          </Text>
        </View>
      </View>
      <View style={invStyles.stats}>
        <View style={invStyles.stat}>
          <Text style={invStyles.statValue}>{forecast.currentStock}</Text>
          <Text style={invStyles.statLabel}>In Stock</Text>
        </View>
        <View style={invStyles.stat}>
          <Text style={invStyles.statValue}>{forecast.dailyBurnRate}/day</Text>
          <Text style={invStyles.statLabel}>Burn Rate</Text>
        </View>
        <View style={invStyles.stat}>
          <Text style={[invStyles.statValue, { color: c.text }]}>
            +{forecast.restockRecommendation.quantity}
          </Text>
          <Text style={invStyles.statLabel}>Suggested</Text>
        </View>
      </View>
    </View>
  );
};

const invStyles = StyleSheet.create({
  item: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3,
    marginBottom: 8,
    ...Shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  category: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
});

// ─── Main Screen ───────────────────────────────────────────────────────────────

type TabType = 'overview' | 'demand' | 'inventory' | 'revenue' | 'agents';

const TABS: { key: TabType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'overview', label: 'Overview', icon: 'grid' },
  { key: 'demand', label: 'Demand', icon: 'trending-up' },
  { key: 'inventory', label: 'Inventory', icon: 'cube' },
  { key: 'revenue', label: 'Revenue', icon: 'cash' },
  { key: 'agents', label: 'Agents', icon: 'hardware-chip' },
];

export default function CopilotDashboardScreen() {
  const { merchant } = useAuth();
  const { activeStore } = useStore();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [refreshing, setRefreshing] = useState(false);

  // Data hooks
  const { data: dashboard, isLoading: dashboardLoading, refetch: refetchDashboard } = useCopilotDashboard(activeStore?._id);
  const { data: agentStatuses } = useAgentStatuses();
  const { data: demandTrends } = useDemandTrends(merchant?.id || '');
  const { data: scarcitySummary } = useScarcitySummary(merchant?.id || '');
  const { data: revenueImpact } = useRevenueImpact(merchant?.id || '');
  const { data: inventoryAlerts } = useInventoryAlerts(merchant?.id || '');
  const { data: highPriorityInsights } = useHighPriorityInsights(merchant?.id || '');
  const { data: marginAlerts } = useMarginAlerts(merchant?.id || '');
  const { data: churnSignals } = useChurnSignals(merchant?.id || '');

  const refreshMutation = useRefreshAgents();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchDashboard(), refreshMutation.mutateAsync()]);
    setRefreshing(false);
  }, [refetchDashboard, refreshMutation]);

  // Derived values
  const healthyAgents = agentStatuses?.filter((a) => a.status === 'healthy').length || 0;
  const totalAgents = agentStatuses?.length || 0;

  if (dashboardLoading && !dashboard) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Loading AI Insights...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient colors={['#7C3AED', '#6366F1']} style={styles.header}>
          <Animated.View entering={FadeInDown.delay(50)}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.headerTitle}>REZ Copilot</Text>
                <Text style={styles.headerSubtitle}>
                  AI-Powered Merchant Intelligence
                </Text>
              </View>
              <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
                <Ionicons name="refresh" size={20} color="white" />
              </TouchableOpacity>
            </View>
            <View style={styles.connectionBadge}>
              <View style={[styles.connectionDot, { backgroundColor: healthyAgents > 0 ? '#10B981' : '#EF4444' }]} />
              <Text style={styles.connectionText}>
                {healthyAgents}/{totalAgents} agents active
              </Text>
            </View>
          </Animated.View>
        </LinearGradient>

        {/* Tab Selector */}
        <View style={styles.tabSelector}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons
                name={tab.icon}
                size={16}
                color={activeTab === tab.key ? '#7C3AED' : Colors.text.tertiary}
              />
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Summary Metrics */}
            <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
              <Text style={styles.sectionTitle}>At a Glance</Text>
              <View style={styles.metricsGrid}>
                <MetricCard
                  label="Total Revenue"
                  value={formatCurrency(revenueImpact?.totalGMV || 0)}
                  icon="cash"
                  color="#10B981"
                />
                <MetricCard
                  label="Nudge Influence"
                  value={formatPercentage(revenueImpact?.nudgeLift || 0)}
                  subLabel="GMV Lift"
                  icon="trending-up"
                  color="#8B5CF6"
                  trend={revenueImpact?.nudgeLift || 0}
                />
                <MetricCard
                  label="Avg Scarcity"
                  value={`${scarcitySummary?.avgScore || 0}`}
                  subLabel="Score 0-100"
                  icon="flash"
                  color="#F59E0B"
                />
                <MetricCard
                  label="High Priority"
                  value={`${highPriorityInsights?.length || 0}`}
                  subLabel="Insights"
                  icon="alert-circle"
                  color="#EF4444"
                />
              </View>
            </Animated.View>

            {/* High Priority Insights */}
            {highPriorityInsights && highPriorityInsights.length > 0 && (
              <Animated.View entering={FadeInDown.delay(150)} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Priority Actions</Text>
                  <TouchableOpacity onPress={() => setActiveTab('overview')}>
                    <Text style={styles.seeAllText}>See All</Text>
                  </TouchableOpacity>
                </View>
                {highPriorityInsights.slice(0, 5).map((insight) => (
                  <InsightCard key={insight.id} insight={insight} />
                ))}
              </Animated.View>
            )}

            {/* Revenue Impact Summary */}
            {revenueImpact && (
              <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
                <Text style={styles.sectionTitle}>Revenue Impact</Text>
                <View style={styles.impactCard}>
                  <View style={styles.impactRow}>
                    <Text style={styles.impactLabel}>Total GMV</Text>
                    <Text style={styles.impactValue}>{formatCurrency(revenueImpact.totalGMV)}</Text>
                  </View>
                  <View style={styles.impactRow}>
                    <Text style={styles.impactLabel}>Nudge Influenced</Text>
                    <Text style={[styles.impactValue, { color: '#8B5CF6' }]}>
                      {formatCurrency(revenueImpact.nudgeInfluence)}
                    </Text>
                  </View>
                  <View style={styles.impactRow}>
                    <Text style={styles.impactLabel}>Conversion Lift</Text>
                    <Text style={[styles.impactValue, { color: '#10B981' }]}>
                      +{formatPercentage(revenueImpact.conversionLift)}
                    </Text>
                  </View>
                  {revenueImpact.topChannel && (
                    <View style={styles.impactRow}>
                      <Text style={styles.impactLabel}>Top Channel</Text>
                      <Text style={styles.impactValue}>{revenueImpact.topChannel}</Text>
                    </View>
                  )}
                </View>
              </Animated.View>
            )}

            {/* Inventory Alerts */}
            {inventoryAlerts && inventoryAlerts.length > 0 && (
              <Animated.View entering={FadeInDown.delay(250)} style={styles.section}>
                <Text style={styles.sectionTitle}>Inventory Alerts</Text>
                {inventoryAlerts.slice(0, 3).map((forecast, idx) => (
                  <InventoryAlertItem key={idx} forecast={forecast} />
                ))}
              </Animated.View>
            )}
          </>
        )}

        {/* Demand Tab */}
        {activeTab === 'demand' && (
          <>
            <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
              <Text style={styles.sectionTitle}>Demand Trends</Text>
              {demandTrends && demandTrends.length > 0 ? (
                demandTrends.map((demand, idx) => (
                  <DemandTrendItem key={idx} demand={demand} />
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="trending-up-outline" size={40} color={Colors.gray[300]} />
                  <Text style={styles.emptyText}>No demand data available</Text>
                  <Text style={styles.emptySubtext}>
                    Demand signals will appear as customers interact with your store
                  </Text>
                </View>
              )}
            </Animated.View>

            {/* Scarcity Summary */}
            {scarcitySummary && (
              <Animated.View entering={FadeInDown.delay(150)} style={styles.section}>
                <Text style={styles.sectionTitle}>Scarcity Analysis</Text>
                <View style={styles.scarcityGrid}>
                  <View style={[styles.scarcityItem, { borderTopColor: '#EF4444' }]}>
                    <Text style={styles.scarcityValue}>{scarcitySummary.critical}</Text>
                    <Text style={styles.scarcityLabel}>Critical</Text>
                  </View>
                  <View style={[styles.scarcityItem, { borderTopColor: '#F59E0B' }]}>
                    <Text style={styles.scarcityValue}>{scarcitySummary.high}</Text>
                    <Text style={styles.scarcityLabel}>High</Text>
                  </View>
                  <View style={[styles.scarcityItem, { borderTopColor: '#3B82F6' }]}>
                    <Text style={styles.scarcityValue}>{scarcitySummary.medium}</Text>
                    <Text style={styles.scarcityLabel}>Medium</Text>
                  </View>
                  <View style={[styles.scarcityItem, { borderTopColor: '#10B981' }]}>
                    <Text style={styles.scarcityValue}>{scarcitySummary.low}</Text>
                    <Text style={styles.scarcityLabel}>Low</Text>
                  </View>
                </View>
              </Animated.View>
            )}
          </>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <>
            <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
              <Text style={styles.sectionTitle}>Inventory Forecasts</Text>
              {inventoryAlerts && inventoryAlerts.length > 0 ? (
                inventoryAlerts.map((forecast, idx) => (
                  <InventoryAlertItem key={idx} forecast={forecast} />
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="cube-outline" size={40} color={Colors.gray[300]} />
                  <Text style={styles.emptyText}>No inventory alerts</Text>
                  <Text style={styles.emptySubtext}>
                    Your inventory levels are healthy
                  </Text>
                </View>
              )}
            </Animated.View>
          </>
        )}

        {/* Revenue Tab */}
        {activeTab === 'revenue' && (
          <>
            <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
              <Text style={styles.sectionTitle}>Revenue Optimization</Text>
              {revenueImpact && (
                <View style={styles.impactCard}>
                  <View style={styles.impactRow}>
                    <Text style={styles.impactLabel}>Total GMV</Text>
                    <Text style={styles.impactValue}>{formatCurrency(revenueImpact.totalGMV)}</Text>
                  </View>
                  <View style={styles.impactRow}>
                    <Text style={styles.impactLabel}>Nudge Influenced GMV</Text>
                    <Text style={[styles.impactValue, { color: '#8B5CF6' }]}>
                      {formatCurrency(revenueImpact.nudgeInfluence)}
                    </Text>
                  </View>
                  <View style={styles.impactRow}>
                    <Text style={styles.impactLabel}>Nudge Lift</Text>
                    <Text style={[styles.impactValue, { color: '#10B981' }]}>
                      +{formatPercentage(revenueImpact.nudgeLift)}
                    </Text>
                  </View>
                  <View style={styles.impactRow}>
                    <Text style={styles.impactLabel}>Conversion Lift</Text>
                    <Text style={[styles.impactValue, { color: '#10B981' }]}>
                      +{formatPercentage(revenueImpact.conversionLift)}
                    </Text>
                  </View>
                  <View style={styles.impactRow}>
                    <Text style={styles.impactLabel}>Incrementality</Text>
                    <Text style={[styles.impactValue, { color: '#8B5CF6' }]}>
                      {formatCurrency(revenueImpact.incrementality)}
                    </Text>
                  </View>
                </View>
              )}
            </Animated.View>

            {/* Margin Alerts */}
            {marginAlerts && marginAlerts.length > 0 && (
              <Animated.View entering={FadeInDown.delay(150)} style={styles.section}>
                <Text style={styles.sectionTitle}>Margin Alerts</Text>
                {marginAlerts.map((alert, idx) => (
                  <View key={idx} style={styles.alertCard}>
                    <View style={styles.alertHeader}>
                      <Ionicons
                        name={alert.severity === 'critical' ? 'alert-circle' : 'warning'}
                        size={16}
                        color={alert.severity === 'critical' ? '#EF4444' : '#F59E0B'}
                      />
                      <Text style={styles.alertTitle}>{alert.title}</Text>
                    </View>
                    <Text style={styles.alertDescription}>{alert.description}</Text>
                    <Text style={styles.alertMargin}>
                      Current Margin: {alert.currentMargin.toFixed(1)}%
                    </Text>
                  </View>
                ))}
              </Animated.View>
            )}

            {/* Churn Signals */}
            {churnSignals && churnSignals.length > 0 && (
              <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
                <Text style={styles.sectionTitle}>Churn Risk Signals</Text>
                {churnSignals.slice(0, 5).map((signal, idx) => (
                  <View key={idx} style={styles.churnCard}>
                    <View style={styles.churnHeader}>
                      <Text style={styles.churnIntent}>{signal.intentKey}</Text>
                      <View style={[
                        styles.churnBadge,
                        { backgroundColor: signal.churnRisk === 'high' ? '#FEE2E2' : '#FEF3C7' }
                      ]}>
                        <Text style={[
                          styles.churnRisk,
                          { color: signal.churnRisk === 'high' ? '#DC2626' : '#D97706' }
                        ]}>
                          {signal.churnRisk} risk
                        </Text>
                      </View>
                    </View>
                    <View style={styles.churnStats}>
                      <Text style={styles.churnStat}>
                        Conversion Prob: {(signal.predictedConversionProb * 100).toFixed(0)}%
                      </Text>
                      <Text style={styles.churnStat}>
                        Confidence: {(signal.confidence * 100).toFixed(0)}%
                      </Text>
                    </View>
                  </View>
                ))}
              </Animated.View>
            )}
          </>
        )}

        {/* Agents Tab */}
        {activeTab === 'agents' && (
          <>
            <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>AI Agent Status</Text>
                <TouchableOpacity style={styles.refreshAllBtn} onPress={onRefresh}>
                  <Ionicons name="refresh" size={14} color="#7C3AED" />
                  <Text style={styles.refreshAllText}>Refresh</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.agentsGrid}>
                {agentStatuses && agentStatuses.length > 0 ? (
                  agentStatuses.map((agent) => (
                    <AgentCard
                      key={agent.name}
                      name={agent.name}
                      status={agent.status}
                      lastRun={agent.lastRun}
                      avgDurationMs={agent.avgDurationMs}
                      consecutiveFailures={agent.consecutiveFailures}
                    />
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="hardware-chip-outline" size={40} color={Colors.gray[300]} />
                    <Text style={styles.emptyText}>Connecting to agents...</Text>
                    <Text style={styles.emptySubtext}>
                      AI agents will appear once connected
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>

            {/* Agent Legend */}
            <Animated.View entering={FadeInDown.delay(150)} style={styles.section}>
              <Text style={styles.sectionTitle}>Agent Legend</Text>
              <View style={styles.legendCard}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.legendText}>Healthy - Running normally</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                  <Text style={styles.legendText}>Degraded - Minor issues</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                  <Text style={styles.legendText}>Failed - Needs attention</Text>
                </View>
              </View>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Colors.background.secondary,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  header: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectionText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  tabSelector: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background.primary,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: Colors.background.secondary,
  },
  tabActive: {
    backgroundColor: '#EDE9FE',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text.tertiary,
  },
  tabTextActive: {
    color: '#7C3AED',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 13,
    color: '#7C3AED',
    fontWeight: '600',
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  impactCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    ...Shadows.sm,
  },
  impactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  impactLabel: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  impactValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  scarcityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  scarcityItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderTopWidth: 3,
    width: (width - 56) / 2,
    alignItems: 'center',
    ...Shadows.sm,
  },
  scarcityValue: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  scarcityLabel: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 4,
    fontWeight: '500',
  },
  agentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  refreshAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EDE9FE',
    borderRadius: 8,
  },
  refreshAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C3AED',
  },
  legendCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    ...Shadows.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.text.tertiary,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  alertCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
    ...Shadows.sm,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    flex: 1,
  },
  alertDescription: {
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  alertMargin: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  churnCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    ...Shadows.sm,
  },
  churnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  churnIntent: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.primary,
    flex: 1,
  },
  churnBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  churnRisk: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  churnStats: {
    flexDirection: 'row',
    gap: 16,
  },
  churnStat: {
    fontSize: 11,
    color: Colors.text.tertiary,
  },
});
