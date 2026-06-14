/**
 * REZ Business AI - Merchant Dashboard
 * Autonomous AI Operating System for Merchants
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useMerchant } from '@/hooks/useMerchant';
import { useAuth } from '@/hooks/useAuth';

// API Configuration
const BUSINESS_AI_URL = process.env.EXPO_PUBLIC_BUSINESS_AI_URL || 'http://localhost:4059';

// Types
interface AIAction {
  id: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  agent: string;
  reasoning: string;
  estimatedImpact: {
    revenue: number;
    customers: number;
    roi: number;
    confidence: number;
  };
  requiresApproval: boolean;
  createdAt: string;
}

interface BusinessIntelligence {
  demandSignals: DemandSignal[];
  weatherImpact: WeatherImpact;
  eventImpact: EventImpact[];
  competitorData: CompetitorData[];
  financialHealth: FinancialHealth;
}

interface DemandSignal {
  type: string;
  strength: number;
  confidence: number;
  description: string;
  recommendedAction?: string;
}

interface WeatherImpact {
  condition: string;
  expectedDemandChange: number;
  recommendedOffers: string[];
}

interface EventImpact {
  event: string;
  type: string;
  date: string;
  expectedBoost: number;
}

interface CompetitorData {
  name: string;
  distance: string;
  pricing: number;
  offers: string[];
  rating: number;
}

interface FinancialHealth {
  revenue: number;
  expenses: number;
  profitMargin: number;
  healthScore: number;
}

type ApprovalMode = 'suggestion' | 'semi_autonomous' | 'autonomous';

export default function BusinessAIDashboard() {
  const { merchant } = useMerchant();
  const { token } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState<'overview' | 'actions' | 'config' | 'reports'>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [approvalMode, setApprovalMode] = useState<ApprovalMode>('suggestion');
  const [actions, setActions] = useState<AIAction[]>([]);
  const [intelligence, setIntelligence] = useState<BusinessIntelligence | null>(null);
  const [config, setConfig] = useState({
    maxDiscount: 30,
    maxAdBudget: 5000,
    minMargin: 15,
    requireApprovalAbove: 10,
    isActive: true,
  });

  // Fetch Data
  const fetchData = useCallback(async () => {
    if (!token || !merchant?.id) return;

    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || '',
      };

      // Fetch intelligence
      const intelResponse = await fetch(`${BUSINESS_AI_URL}/api/business-ai/intelligence`, {
        headers,
      });
      if (intelResponse.ok) {
        const intelData = await intelResponse.json();
        setIntelligence(intelData.data);
      }

      // Fetch actions
      const actionsResponse = await fetch(`${BUSINESS_AI_URL}/api/business-ai/actions?limit=20`, {
        headers,
      });
      if (actionsResponse.ok) {
        const actionsData = await actionsResponse.json();
        setActions(actionsData.data || []);
      }

      // Fetch config
      const configResponse = await fetch(`${BUSINESS_AI_URL}/api/business-ai/config`, {
        headers,
      });
      if (configResponse.ok) {
        const configData = await configResponse.json();
        if (configData.data) {
          setConfig({
            maxDiscount: configData.data.constraints?.maxDiscount || 30,
            maxAdBudget: configData.data.constraints?.maxAdBudget || 5000,
            minMargin: configData.data.constraints?.minMargin || 15,
            requireApprovalAbove: configData.data.constraints?.requireApprovalAbove || 10,
            isActive: configData.data.isActive ?? true,
          });
          setApprovalMode(configData.data.approvalMode || 'suggestion');
        }
      }
    } catch (error) {
      console.error('Error fetching Business AI data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, merchant?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Handle Approve Action
  const handleApproveAction = async (actionId: string) => {
    try {
      const response = await fetch(`${BUSINESS_AI_URL}/api/business-ai/actions/${actionId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || '',
        },
      });

      if (response.ok) {
        Alert.alert('Success', 'Action approved and executed!');
        fetchData();
      } else {
        Alert.alert('Error', 'Failed to approve action');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error');
    }
  };

  // Handle Reject Action
  const handleRejectAction = async (actionId: string) => {
    Alert.alert(
      'Reject Action',
      'Are you sure you want to reject this AI suggestion?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${BUSINESS_AI_URL}/api/business-ai/actions/${actionId}/reject`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
              });
              if (response.ok) fetchData();
            } catch (error) {
              Alert.alert('Error', 'Failed to reject action');
            }
          },
        },
      ]
    );
  };

  // Handle Execute All
  const handleExecuteAll = async () => {
    Alert.alert(
      'Execute All',
      'This will execute all approved actions automatically. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Execute',
          onPress: async () => {
            try {
              const response = await fetch(`${BUSINESS_AI_URL}/api/business-ai/execute-all`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
              });
              if (response.ok) {
                const result = await response.json();
                Alert.alert('Success', `Executed ${result.data?.executed || 0} actions`);
                fetchData();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to execute actions');
            }
          },
        },
      ]
    );
  };

  // Handle Mode Change
  const handleModeChange = async (mode: ApprovalMode) => {
    try {
      const response = await fetch(`${BUSINESS_AI_URL}/api/business-ai/config/mode`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ mode }),
      });
      if (response.ok) {
        setApprovalMode(mode);
        Alert.alert('Success', `Mode changed to ${mode.replace('_', ' ')}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to change mode');
    }
  };

  // Get Priority Color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  // Get Action Icon
  const getActionIcon = (type: string) => {
    switch (type) {
      case 'pricing_adjustment': return '💰';
      case 'campaign_create': return '📢';
      case 'customer_reengagement': return '👥';
      case 'offer_launch': return '🎁';
      case 'notification_send': return '📱';
      case 'demand_forecast': return '📊';
      case 'inventory_alert': return '⚠️';
      default: return '🤖';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading Business AI...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Business AI</Text>
          <Text style={styles.headerSubtitle}>Autonomous Growth Assistant</Text>
        </View>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>
            {approvalMode === 'autonomous' ? '🟢' : approvalMode === 'semi_autonomous' ? '🟡' : '🔵'} Auto
          </Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {(['overview', 'actions', 'config', 'reports'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <View style={styles.section}>
            {/* Health Score Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Business Health</Text>
              <View style={styles.healthScoreContainer}>
                <View style={styles.healthScoreCircle}>
                  <Text style={styles.healthScoreNumber}>
                    {intelligence?.financialHealth?.healthScore || 75}
                  </Text>
                  <Text style={styles.healthScoreLabel}>/100</Text>
                </View>
                <View style={styles.healthScoreDetails}>
                  <Text style={styles.healthScoreRevenue}>
                    ₹{(intelligence?.financialHealth?.revenue || 0).toLocaleString()}
                  </Text>
                  <Text style={styles.healthScoreMargin}>
                    {(intelligence?.financialHealth?.profitMargin || 0) * 100}% margin
                  </Text>
                </View>
              </View>
            </View>

            {/* Demand Signals */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Demand Signals</Text>
              {intelligence?.demandSignals?.map((signal, index) => (
                <View key={index} style={styles.signalItem}>
                  <View style={styles.signalDot} />
                  <View style={styles.signalContent}>
                    <Text style={styles.signalText}>{signal.description}</Text>
                    <Text style={styles.signalMeta}>
                      {signal.type} • {Math.round(signal.confidence * 100)}% confidence
                    </Text>
                  </View>
                </View>
              )) || (
                <Text style={styles.emptyText}>No demand signals detected</Text>
              )}
            </View>

            {/* Weather Impact */}
            {intelligence?.weatherImpact && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Weather Impact</Text>
                <View style={styles.weatherCard}>
                  <Text style={styles.weatherIcon}>
                    {intelligence.weatherImpact.condition === 'rainy' ? '🌧️' :
                     intelligence.weatherImpact.condition === 'sunny' ? '☀️' : '⛅'}
                  </Text>
                  <View style={styles.weatherContent}>
                    <Text style={styles.weatherCondition}>
                      {intelligence.weatherImpact.condition}
                    </Text>
                    <Text style={styles.weatherChange}>
                      {intelligence.weatherImpact.expectedDemandChange > 0 ? '+' : ''}
                      {Math.round(intelligence.weatherImpact.expectedDemandChange * 100)}% demand
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Upcoming Events */}
            {intelligence?.eventImpact?.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Upcoming Events</Text>
                {intelligence.eventImpact.slice(0, 3).map((event, index) => (
                  <View key={index} style={styles.eventItem}>
                    <View style={styles.eventIcon}>
                      <Text>{event.type === 'sports' ? '🏏' : event.type === 'festival' ? '🎉' : '📅'}</Text>
                    </View>
                    <View style={styles.eventContent}>
                      <Text style={styles.eventName}>{event.event}</Text>
                      <Text style={styles.eventDate}>
                        {new Date(event.date).toLocaleDateString()} • +{Math.round(event.expectedBoost * 100)}% boost
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Competitors */}
            {intelligence?.competitorData?.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Competitors Nearby</Text>
                {intelligence.competitorData.slice(0, 3).map((comp, index) => (
                  <View key={index} style={styles.competitorItem}>
                    <Text style={styles.competitorName}>{comp.name}</Text>
                    <Text style={styles.competitorMeta}>
                      {comp.distance} • Rating: {comp.rating} • {comp.offers.join(', ')}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Actions Tab */}
        {activeTab === 'actions' && (
          <View style={styles.section}>
            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.quickActionButton} onPress={fetchData}>
                <Text style={styles.quickActionIcon}>🔄</Text>
                <Text style={styles.quickActionText}>Refresh</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionButtonPrimary} onPress={handleExecuteAll}>
                <Text style={styles.quickActionIconPrimary}>▶️</Text>
                <Text style={styles.quickActionTextPrimary}>Execute All</Text>
              </TouchableOpacity>
            </View>

            {/* Pending Actions */}
            <Text style={styles.sectionTitle}>AI Suggestions</Text>
            {actions.filter(a => a.status === 'pending').length > 0 ? (
              actions.filter(a => a.status === 'pending').map((action) => (
                <View key={action.id} style={styles.actionCard}>
                  <View style={styles.actionHeader}>
                    <Text style={styles.actionIcon}>{getActionIcon(action.type)}</Text>
                    <View style={styles.actionInfo}>
                      <Text style={styles.actionType}>
                        {action.type.replace(/_/g, ' ')}
                      </Text>
                      <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(action.priority) }]}>
                        <Text style={styles.priorityText}>{action.priority}</Text>
                      </View>
                    </View>
                  </View>

                  <Text style={styles.actionReasoning}>{action.reasoning}</Text>

                  <View style={styles.actionImpact}>
                    <View style={styles.impactItem}>
                      <Text style={styles.impactValue}>₹{action.estimatedImpact?.revenue?.toLocaleString() || 0}</Text>
                      <Text style={styles.impactLabel}>Est. Revenue</Text>
                    </View>
                    <View style={styles.impactItem}>
                      <Text style={styles.impactValue}>{action.estimatedImpact?.customers || 0}</Text>
                      <Text style={styles.impactLabel}>Customers</Text>
                    </View>
                    <View style={styles.impactItem}>
                      <Text style={styles.impactValue}>{Math.round((action.estimatedImpact?.roi || 0) * 100)}%</Text>
                      <Text style={styles.impactLabel}>ROI</Text>
                    </View>
                  </View>

                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => handleRejectAction(action.id)}
                    >
                      <Text style={styles.rejectButtonText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.approveButton}
                      onPress={() => handleApproveAction(action.id)}
                    >
                      <Text style={styles.approveButtonText}>Approve</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>✨</Text>
                <Text style={styles.emptyTitle}>All Caught Up!</Text>
                <Text style={styles.emptyText}>No pending actions. Check back later.</Text>
              </View>
            )}
          </View>
        )}

        {/* Config Tab */}
        {activeTab === 'config' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Operating Mode</Text>
            <View style={styles.modeContainer}>
              {(['suggestion', 'semi_autonomous', 'autonomous'] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[styles.modeButton, approvalMode === mode && styles.modeButtonActive]}
                  onPress={() => handleModeChange(mode)}
                >
                  <Text style={styles.modeIcon}>
                    {mode === 'suggestion' ? '💡' : mode === 'semi_autonomous' ? '⚡' : '🚀'}
                  </Text>
                  <Text style={[styles.modeText, approvalMode === mode && styles.modeTextActive]}>
                    {mode === 'suggestion' ? 'Suggestion' : mode === 'semi_autonomous' ? 'Semi-Auto' : 'Autonomous'}
                  </Text>
                  <Text style={styles.modeDescription}>
                    {mode === 'suggestion' ? 'Approve each action' :
                     mode === 'semi_autonomous' ? 'Execute low-risk tasks' :
                     'Full automation'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Constraints</Text>
            <View style={styles.configCard}>
              <View style={styles.configItem}>
                <Text style={styles.configLabel}>Max Discount</Text>
                <Text style={styles.configValue}>{config.maxDiscount}%</Text>
              </View>
              <View style={styles.configItem}>
                <Text style={styles.configLabel}>Max Ad Budget</Text>
                <Text style={styles.configValue}>₹{config.maxAdBudget.toLocaleString()}</Text>
              </View>
              <View style={styles.configItem}>
                <Text style={styles.configLabel}>Min Margin</Text>
                <Text style={styles.configValue}>{config.minMargin}%</Text>
              </View>
              <View style={styles.configItem}>
                <Text style={styles.configLabel}>Require Approval Above</Text>
                <Text style={styles.configValue}>{config.requireApprovalAbove}%</Text>
              </View>
            </View>

            <View style={styles.configCard}>
              <View style={styles.configSwitch}>
                <Text style={styles.configLabel}>AI Active</Text>
                <Switch
                  value={config.isActive}
                  onValueChange={(value) => setConfig({ ...config, isActive: value })}
                  trackColor={{ false: '#767577', true: '#6366f1' }}
                />
              </View>
            </View>
          </View>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.generateReportButton}>
              <Text style={styles.generateReportIcon}>📊</Text>
              <Text style={styles.generateReportText}>Generate Report</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Recent Reports</Text>
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📄</Text>
              <Text style={styles.emptyTitle}>No Reports Yet</Text>
              <Text style={styles.emptyText}>
                Reports will appear here after generation
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    backgroundColor: '#6366f1',
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  headerBadgeText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#6366f1',
  },
  tabText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#6366f1',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
    marginTop: 8,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  healthScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthScoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  healthScoreNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  healthScoreLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  healthScoreDetails: {
    marginLeft: 16,
    flex: 1,
  },
  healthScoreRevenue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  healthScoreMargin: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  signalItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  signalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366f1',
    marginTop: 6,
    marginRight: 12,
  },
  signalContent: {
    flex: 1,
  },
  signalText: {
    fontSize: 14,
    color: '#1e293b',
  },
  signalMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  weatherCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  weatherContent: {
    flex: 1,
  },
  weatherCondition: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    textTransform: 'capitalize',
  },
  weatherChange: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventContent: {
    flex: 1,
  },
  eventName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  eventDate: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  competitorItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  competitorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  competitorMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginRight: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quickActionButtonPrimary: {
    flex: 1,
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    marginLeft: 8,
    alignItems: 'center',
  },
  quickActionIcon: {
    fontSize: 24,
  },
  quickActionIconPrimary: {
    fontSize: 24,
  },
  quickActionText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  quickActionTextPrimary: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
    marginTop: 4,
  },
  actionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  actionInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    textTransform: 'capitalize',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  actionReasoning: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 20,
  },
  actionImpact: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  impactItem: {
    flex: 1,
    alignItems: 'center',
  },
  impactValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  impactLabel: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  rejectButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
  },
  approveButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
  },
  approveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
  modeContainer: {
    marginBottom: 16,
  },
  modeButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  modeButtonActive: {
    borderColor: '#6366f1',
    backgroundColor: '#f0f9ff',
  },
  modeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  modeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  modeTextActive: {
    color: '#6366f1',
  },
  modeDescription: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  configCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  configItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  configLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  configValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  configSwitch: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  generateReportButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  generateReportIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  generateReportText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
});
