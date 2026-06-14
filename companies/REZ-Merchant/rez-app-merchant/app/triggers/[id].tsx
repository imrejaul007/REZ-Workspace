/**
 * Trigger Rule Details Screen
 *
 * Displays detailed information about a trigger rule, including conditions,
 * actions, and triggered event history.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { showConfirm, showAlert } from '@/utils/alert';
import { formatDistanceToNow, format } from 'date-fns';
import { Colors } from '@/constants/Colors';
import {
  useTriggerRule,
  useToggleRuleStatus,
  useDeleteRule,
  useDuplicateRule,
  useTriggeredEvents,
} from './hooks';
import {
  TriggerRule,
  TriggerType,
  TriggerStatus,
  ActionType,
  TriggeredEvent,
} from './types';

const ACCENT = Colors.light.primary;

const TRIGGER_TYPE_CONFIG: Record<
  TriggerType,
  { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  inactivity: { label: 'Inactivity', icon: 'time-outline', color: '#8B5CF6' },
  location: { label: 'Location', icon: 'location-outline', color: '#3B82F6' },
  birthday: { label: 'Birthday', icon: 'gift-outline', color: '#EC4899' },
  first_visit: { label: 'First Visit', icon: 'footsteps-outline', color: '#10B981' },
  loyalty_milestone: { label: 'Loyalty Milestone', icon: 'star-outline', color: '#F59E0B' },
  custom: { label: 'Custom', icon: 'settings-outline', color: '#6B7280' },
};

const STATUS_CONFIG: Record<
  TriggerStatus,
  { label: string; color: string; bgColor: string }
> = {
  active: { label: 'Active', color: Colors.light.success, bgColor: Colors.light.successLight },
  inactive: { label: 'Inactive', color: Colors.light.textMuted, bgColor: Colors.light.backgroundTertiary },
  draft: { label: 'Draft', color: Colors.light.warning, bgColor: Colors.light.warningLight },
};

const ACTION_TYPE_CONFIG: Record<
  ActionType,
  { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  push: { label: 'Push', icon: 'notifications-outline', color: '#3B82F6' },
  sms: { label: 'SMS', icon: 'chatbubbles-outline', color: '#10B981' },
  email: { label: 'Email', icon: 'mail-outline', color: '#8B5CF6' },
  in_app: { label: 'In-App', icon: 'alert-circle-outline', color: '#F59E0B' },
};

export default function RuleDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { rule, isLoading: ruleLoading, error: ruleError } = useTriggerRule(id);
  const { events, isLoading: eventsLoading, isRefreshing, refresh } = useTriggeredEvents(id);
  const { toggleStatus, isLoading: toggling } = useToggleRuleStatus();
  const { deleteRule, isLoading: deleting } = useDeleteRule();
  const { duplicateRule } = useDuplicateRule();

  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'analytics'>('overview');

  const handleToggleStatus = async () => {
    if (!rule) return;
    const newStatus = rule.status === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';

    showConfirm(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Rule`,
      `Are you sure you want to ${action} "${rule.name}"?`,
      async () => {
        try {
          await toggleStatus(rule);
          showAlert('Success', `Rule ${action}d successfully`);
        } catch {
          showAlert('Error', `Failed to ${action} rule`);
        }
      }
    );
  };

  const handleDelete = () => {
    if (!rule) return;

    showConfirm(
      'Delete Rule',
      `Are you sure you want to delete "${rule.name}"? This action cannot be undone.`,
      async () => {
        try {
          await deleteRule(rule.id);
          showAlert('Success', 'Rule deleted successfully');
          router.back();
        } catch {
          showAlert('Error', 'Failed to delete rule');
        }
      }
    );
  };

  const handleDuplicate = async () => {
    if (!rule) return;

    try {
      const newRule = await duplicateRule(rule);
      if (newRule) {
        showAlert('Success', 'Rule duplicated successfully');
        router.replace(`/triggers/${newRule.id}`);
      }
    } catch {
      showAlert('Error', 'Failed to duplicate rule');
    }
  };

  const handleEdit = () => {
    // Navigate to edit screen if it exists, or use a modal
    showAlert('Info', 'Edit functionality will be implemented in the next version');
  };

  if (ruleLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ACCENT} />
        <Text style={styles.loadingText}>Loading rule details...</Text>
      </View>
    );
  }

  if (ruleError || !rule) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={Colors.light.error} />
        <Text style={styles.errorTitle}>Failed to load rule</Text>
        <Text style={styles.errorMessage}>
          {ruleError?.message || 'This rule could not be found.'}
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const typeConfig = TRIGGER_TYPE_CONFIG[rule.type];
  const statusConfig = STATUS_CONFIG[rule.status];

  const renderConditionDetails = (condition: TriggerRule['conditions'][0]) => {
    const getConditionSummary = () => {
      switch (condition.type) {
        case 'inactivity':
          return `Inactive for ${(condition as unknown).days || 0} days`;
        case 'location':
          const loc = condition as unknown;
          return `${loc.locationType || 'nearby'} location (${loc.radius || 0}m radius)`;
        case 'birthday':
          const birth = condition as unknown;
          return `Birthday: ${birth.daysBefore || 0} days before to ${birth.daysAfter || 0} days after`;
        case 'first_visit':
          return `First visit within ${(condition as unknown).withinDays || 0} days`;
        case 'loyalty':
          const loyalty = condition as unknown;
          return `${loyalty.milestoneType || 'points'}: ${loyalty.milestoneValue || 0}`;
        default:
          return 'Custom condition';
      }
    };

    return (
      <View key={condition.id} style={styles.conditionItem}>
        <View style={[styles.conditionIcon, { backgroundColor: typeConfig.color + '20' }]}>
          <Ionicons name={typeConfig.icon} size={16} color={typeConfig.color} />
        </View>
        <Text style={styles.conditionText}>{getConditionSummary()}</Text>
      </View>
    );
  };

  const renderActionDetails = (action: TriggerRule['actions'][0]) => {
    const actionConfig = ACTION_TYPE_CONFIG[action.type];

    const getActionSummary = () => {
      switch (action.type) {
        case 'push':
          return `${action.title}\n${action.body.substring(0, 50)}...`;
        case 'sms':
          return action.message.substring(0, 60) + (action.message.length > 60 ? '...' : '');
        case 'email':
          return `Subject: ${action.subject}`;
        case 'in_app':
          return `${action.title}\n${action.message.substring(0, 50)}...`;
        default:
          return 'Action details';
      }
    };

    return (
      <View key={action.id} style={styles.actionItem}>
        <View style={[styles.actionIcon, { backgroundColor: actionConfig.color + '20' }]}>
          <Ionicons name={actionConfig.icon} size={16} color={actionConfig.color} />
        </View>
        <View style={styles.actionContent}>
          <Text style={styles.actionType}>{actionConfig.label}</Text>
          <Text style={styles.actionSummary} numberOfLines={2}>
            {getActionSummary()}
          </Text>
        </View>
      </View>
    );
  };

  const renderEventItem = ({ item }: { item: TriggeredEvent }) => (
    <View style={styles.eventItem}>
      <View style={styles.eventHeader}>
        <View style={styles.eventInfo}>
          <Text style={styles.eventCustomer}>
            {item.customerName || 'Unknown Customer'}
          </Text>
          <Text style={styles.eventTime}>
            {formatDistanceToNow(new Date(item.triggeredAt), { addSuffix: true })}
          </Text>
        </View>
        <View
          style={[
            styles.eventStatus,
            {
              backgroundColor:
                item.status === 'success'
                  ? Colors.light.successLight
                  : item.status === 'failed'
                    ? Colors.light.errorLight
                    : Colors.light.warningLight,
            },
          ]}
        >
          <Text
            style={[
              styles.eventStatusText,
              {
                color:
                  item.status === 'success'
                    ? Colors.light.success
                    : item.status === 'failed'
                      ? Colors.light.error
                      : Colors.light.warning,
              },
            ]}
          >
            {item.status}
          </Text>
        </View>
      </View>
      <View style={styles.eventActions}>
        {item.actionsExecuted.map((actionType, idx) => {
          const config = ACTION_TYPE_CONFIG[actionType];
          return (
            <View key={idx} style={[styles.eventActionBadge, { backgroundColor: config.color + '20' }]}>
              <Ionicons name={config.icon} size={12} color={config.color} />
              <Text style={[styles.eventActionText, { color: config.color }]}>{config.label}</Text>
            </View>
          );
        })}
      </View>
      {item.errorMessage && (
        <Text style={styles.eventError}>Error: {item.errorMessage}</Text>
      )}
    </View>
  );

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* Rule Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rule Information</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Status</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {rule.description && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Description</Text>
            <Text style={styles.infoValue}>{rule.description}</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Priority</Text>
          <Text style={styles.infoValue}>{rule.priority}</Text>
        </View>

        {rule.startDate && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Start Date</Text>
            <Text style={styles.infoValue}>{format(new Date(rule.startDate), 'MMM d, yyyy')}</Text>
          </View>
        )}

        {rule.endDate && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>End Date</Text>
            <Text style={styles.infoValue}>{format(new Date(rule.endDate), 'MMM d, yyyy')}</Text>
          </View>
        )}

        {rule.maxExecutions && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Max Executions</Text>
            <Text style={styles.infoValue}>{rule.maxExecutions}</Text>
          </View>
        )}
      </View>

      {/* Conditions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Conditions</Text>
          <Text style={styles.logicBadge}>
            {rule.conditionLogic.toUpperCase()}
          </Text>
        </View>

        {rule.conditions.map(renderConditionDetails)}

        {rule.conditions.length === 0 && (
          <Text style={styles.emptyText}>No conditions configured</Text>
        )}
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>

        {rule.actions.map(renderActionDetails)}

        {rule.actions.length === 0 && (
          <Text style={styles.emptyText}>No actions configured</Text>
        )}
      </View>

      {/* Tags */}
      {rule.tags && rule.tags.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tagsContainer}>
            {rule.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  const renderEventsTab = () => (
    <View style={styles.tabContent}>
      {eventsLoading && events.length === 0 ? (
        <View style={styles.loadingTab}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      ) : events.length === 0 ? (
        <View style={styles.emptyTab}>
          <Ionicons name="pulse-outline" size={48} color={Colors.light.border} />
          <Text style={styles.emptyTabTitle}>No Events Yet</Text>
          <Text style={styles.emptyTabText}>
            Triggered events will appear here when customers match your rule conditions.
          </Text>
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEventItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.eventsList}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refresh} colors={[ACCENT]} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );

  const renderAnalyticsTab = () => (
    <View style={styles.tabContent}>
      {/* Analytics Cards */}
      <View style={styles.analyticsGrid}>
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsValue}>{rule.executionCount}</Text>
          <Text style={styles.analyticsLabel}>Total Executions</Text>
        </View>
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsValue}>{rule.analytics?.totalTriggers || 0}</Text>
          <Text style={styles.analyticsLabel}>Triggers</Text>
        </View>
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsValue}>{rule.analytics?.last30Days || 0}</Text>
          <Text style={styles.analyticsLabel}>Last 30 Days</Text>
        </View>
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsValue}>
            {rule.analytics?.conversionRate?.toFixed(1) || '0'}%
          </Text>
          <Text style={styles.analyticsLabel}>Conversion</Text>
        </View>
      </View>

      {/* Execution Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Execution Statistics</Text>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Successful</Text>
          <Text style={[styles.statValue, { color: Colors.light.success }]}>
            {rule.analytics?.successfulExecutions || 0}
          </Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Failed</Text>
          <Text style={[styles.statValue, { color: Colors.light.error }]}>
            {rule.analytics?.failedExecutions || 0}
          </Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Last Triggered</Text>
          <Text style={styles.statValue}>
            {rule.lastTriggered
              ? formatDistanceToNow(new Date(rule.lastTriggered), { addSuffix: true })
              : 'Never'}
          </Text>
        </View>
      </View>

      {/* Conversion Funnel */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Conversion Funnel</Text>
        <View style={styles.funnelContainer}>
          <View style={styles.funnelStep}>
            <View style={[styles.funnelBar, { width: '100%', backgroundColor: Colors.light.primary }]}>
              <Text style={styles.funnelValue}>{rule.executionCount}</Text>
            </View>
            <Text style={styles.funnelLabel}>Triggered</Text>
          </View>
          <View style={styles.funnelStep}>
            <View
              style={[
                styles.funnelBar,
                {
                  width: `${rule.analytics?.conversionRate || 0}%`,
                  backgroundColor: Colors.light.success,
                },
              ]}
            >
              <Text style={styles.funnelValue}>{rule.analytics?.totalTriggers || 0}</Text>
            </View>
            <Text style={styles.funnelLabel}>Converted</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[typeConfig.color, typeConfig.color + 'CC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerActionBtn} onPress={handleDuplicate}>
                <Ionicons name="copy-outline" size={22} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerActionBtn} onPress={handleEdit}>
                <Ionicons name="create-outline" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.headerContent}>
            <View style={[styles.headerIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name={typeConfig.icon} size={32} color="#fff" />
            </View>
            <Text style={styles.ruleName}>{rule.name}</Text>
            <Text style={styles.ruleType}>{typeConfig.label} Rule</Text>
            <View style={[styles.headerStatusBadge, { backgroundColor: statusConfig.bgColor }]}>
              <Text style={[styles.headerStatusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'events' && styles.tabActive]}
          onPress={() => setActiveTab('events')}
        >
          <Text style={[styles.tabText, activeTab === 'events' && styles.tabTextActive]}>
            Events
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'analytics' && styles.tabActive]}
          onPress={() => setActiveTab('analytics')}
        >
          <Text style={[styles.tabText, activeTab === 'analytics' && styles.tabTextActive]}>
            Analytics
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'events' && renderEventsTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.statusToggleBtn}
          onPress={handleToggleStatus}
          disabled={toggling}
        >
          {toggling ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons
                name={rule.status === 'active' ? 'pause' : 'play'}
                size={20}
                color="#fff"
              />
              <Text style={styles.statusToggleText}>
                {rule.status === 'active' ? 'Deactivate' : 'Activate'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={handleDelete}
          disabled={deleting}
        >
          {deleting ? (
            <ActivityIndicator size="small" color={Colors.light.error} />
          ) : (
            <>
              <Ionicons name="trash-outline" size={20} color={Colors.light.error} />
              <Text style={styles.deleteBtnText}>Delete</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.light.textMuted,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.textHeading,
    marginTop: 16,
  },
  errorMessage: {
    fontSize: 14,
    color: Colors.light.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: ACCENT,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Header
  headerGradient: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingBottom: 32,
  },
  headerIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  ruleName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  ruleType: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  headerStatusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
  },
  headerStatusText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.light.background,
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: ACCENT,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textMuted,
  },
  tabTextActive: {
    color: '#fff',
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  tabContent: {
    flex: 1,
  },

  // Sections
  section: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.textHeading,
    marginBottom: 12,
  },
  logicBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: ACCENT,
    backgroundColor: Colors.light.primaryLight2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textMuted,
    fontStyle: 'italic',
  },

  // Info Rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.light.textMuted,
    width: 100,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.textHeading,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Conditions
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  conditionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conditionText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.textHeading,
    marginLeft: 12,
  },

  // Actions
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    flex: 1,
    marginLeft: 12,
  },
  actionType: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textMuted,
    textTransform: 'uppercase',
  },
  actionSummary: {
    fontSize: 14,
    color: Colors.light.textHeading,
    marginTop: 2,
  },

  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: Colors.light.primaryLight2,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    color: ACCENT,
  },

  // Events List
  eventsList: {
    gap: 12,
  },
  eventItem: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  eventInfo: {
    flex: 1,
  },
  eventCustomer: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  eventTime: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  eventStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  eventStatusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  eventActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  eventActionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  eventActionText: {
    fontSize: 11,
    fontWeight: '600',
  },
  eventError: {
    fontSize: 12,
    color: Colors.light.error,
    marginTop: 8,
    fontStyle: 'italic',
  },

  // Empty States
  loadingTab: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyTab: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTabTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.textHeading,
    marginTop: 16,
  },
  emptyTabText: {
    fontSize: 14,
    color: Colors.light.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },

  // Analytics
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  analyticsCard: {
    width: '47%',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  analyticsValue: {
    fontSize: 28,
    fontWeight: '700',
    color: ACCENT,
  },
  analyticsLabel: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 4,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.light.textMuted,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },

  // Funnel
  funnelContainer: {
    gap: 16,
  },
  funnelStep: {
    gap: 8,
  },
  funnelBar: {
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 12,
    minWidth: 40,
  },
  funnelValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  funnelLabel: {
    fontSize: 12,
    color: Colors.light.textMuted,
  },

  // Bottom Actions
  bottomActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: Colors.light.background,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  statusToggleBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  statusToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.errorLight,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  deleteBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.error,
  },
});
