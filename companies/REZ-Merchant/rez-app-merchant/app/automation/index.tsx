/**
 * Automations — List Screen
 *
 * Shows preset templates and existing automation rules.
 * Fetched from GET /api/automation-rules?storeId=...
 * FAB navigates to automation/edit (new rule).
 * Tap existing rule → automation/edit?id=ID.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { apiClient } from '@/services/api/client';
import { useStore } from '@/contexts/StoreContext';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TriggerType =
  | 'rebooking_overdue'
  | 'birthday'
  | 'post_visit_review'
  | 'visit_anniversary'
  | 'inactive_client'
  | 'first_visit';

type ActionType = 'send_push' | 'send_sms' | 'send_email' | 'give_coins';

type RuleStatus = 'active' | 'paused' | 'draft';

interface AutomationRule {
  _id: string;
  name: string;
  status: RuleStatus;
  trigger: {
    type: TriggerType;
    config: {
      daysSinceLastVisit?: number;
      daysBeforeBirthday?: number;
      hoursAfterVisit?: number;
      yearsAnniversary?: number;
    };
  };
  action: {
    type: ActionType;
    config: {
      title?: string;
      message: string;
      coinAmount?: number;
    };
  };
  stats: {
    sent: number;
    opened: number;
    converted: number;
  };
}

interface PresetTemplate {
  label: string;
  description: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  prefill: Partial<AutomationRule>;
}

// ---------------------------------------------------------------------------
// Preset Templates
// ---------------------------------------------------------------------------

const PRESETS: PresetTemplate[] = [
  {
    label: 'Rebooking Reminder',
    description: "Haven't seen {name} in 30 days? Remind them to book.",
    icon: 'calendar-outline',
    iconColor: '#6366f1',
    iconBg: '#ede9fe',
    prefill: {
      name: 'Rebooking Reminder',
      trigger: { type: 'rebooking_overdue', config: { daysSinceLastVisit: 30 } },
      action: {
        type: 'send_push',
        config: {
          title: 'Time for your next visit!',
          message:
            "Hey {name}, it's been 30 days! Book your next appointment and keep up the streak.",
        },
      },
    },
  },
  {
    label: 'Birthday Offer',
    description: 'Send a birthday message 1 day before their birthday.',
    icon: 'gift-outline',
    iconColor: '#f59e0b',
    iconBg: '#fef3c7',
    prefill: {
      name: 'Birthday Offer',
      trigger: { type: 'birthday', config: { daysBeforeBirthday: 1 } },
      action: {
        type: 'send_push',
        config: {
          title: 'Happy Birthday {name}!',
          message:
            'Wishing you a wonderful birthday! Enjoy a special treat from us on your big day.',
        },
      },
    },
  },
  {
    label: 'Review Request',
    description: 'Auto-ask for a review 2 hours after each appointment.',
    icon: 'star-outline',
    iconColor: '#10b981',
    iconBg: '#d1fae5',
    prefill: {
      name: 'Review Request',
      trigger: { type: 'post_visit_review', config: { hoursAfterVisit: 2 } },
      action: {
        type: 'send_push',
        config: {
          title: 'How was your visit?',
          message:
            'Hi {name}, thanks for visiting us! We would love to hear your feedback. Leave a quick review.',
        },
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function triggerLabel(rule: AutomationRule): string {
  const { type, config } = rule.trigger;
  switch (type) {
    case 'rebooking_overdue':
      return `${config.daysSinceLastVisit ?? 30} days since last visit`;
    case 'birthday':
      return `${config.daysBeforeBirthday ?? 1} day(s) before birthday`;
    case 'post_visit_review':
      return `${config.hoursAfterVisit ?? 2}h after appointment`;
    case 'visit_anniversary':
      return `${config.yearsAnniversary ?? 1} year anniversary`;
    case 'inactive_client':
      return `${config.daysSinceLastVisit ?? 60} days without visit`;
    case 'first_visit':
      return 'After first visit';
    default:
      return type;
  }
}

function actionIcon(type: ActionType): string {
  switch (type) {
    case 'send_push':
      return 'notifications-outline';
    case 'send_sms':
      return 'chatbubble-ellipses-outline';
    case 'send_email':
      return 'mail-outline';
    case 'give_coins':
      return 'logo-bitcoin';
    default:
      return 'send-outline';
  }
}

function statusColors(status: RuleStatus): { bg: string; text: string } {
  switch (status) {
    case 'active':
      return { bg: '#d1fae5', text: '#059669' };
    case 'paused':
      return { bg: '#fef3c7', text: '#d97706' };
    default:
      return { bg: '#f3f4f6', text: '#6b7280' };
  }
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

interface PresetCardProps {
  preset: PresetTemplate;
  onPress: () => void;
}

const PresetCard = ({ preset, onPress }: PresetCardProps) => (
  <TouchableOpacity style={styles.presetCard} onPress={onPress} activeOpacity={0.82}>
    <View style={[styles.presetIcon, { backgroundColor: preset.iconBg }]}>
      <Ionicons name={preset.icon as unknown as keyof typeof Ionicons.glyphMap} size={22} color={preset.iconColor} />
    </View>
    <View style={styles.presetBody}>
      <Text style={styles.presetLabel}>{preset.label}</Text>
      <Text style={styles.presetDesc} numberOfLines={2}>
        {preset.description}
      </Text>
    </View>
    <Ionicons name="add-circle-outline" size={22} color="#6366f1" />
  </TouchableOpacity>
);

interface RuleCardProps {
  rule: AutomationRule;
  onPress: () => void;
  onToggle: () => void;
  toggling: boolean;
}

const RuleCard = ({ rule, onPress, onToggle, toggling }: RuleCardProps) => {
  const colors = statusColors(rule.status);
  return (
    <TouchableOpacity style={styles.ruleCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.ruleCardHeader}>
        <View style={styles.ruleCardLeft}>
          <Text style={styles.ruleName} numberOfLines={1}>
            {rule.name}
          </Text>
          <Text style={styles.ruleTrigger}>{triggerLabel(rule)}</Text>
        </View>
        <View style={styles.ruleCardRight}>
          <View style={[styles.actionIconBox]}>
            <Ionicons name={actionIcon(rule.action.type) as unknown as keyof typeof Ionicons.glyphMap} size={16} color="#6b7280" />
          </View>
          <Switch
            value={rule.status === 'active'}
            onValueChange={onToggle}
            disabled={toggling}
            trackColor={{ false: '#e5e7eb', true: '#6366f1' }}
            thumbColor={rule.status === 'active' ? '#fff' : '#f3f4f6'}
          />
        </View>
      </View>
      <View style={styles.ruleStats}>
        <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
          <Text style={[styles.statusText, { color: colors.text }]}>
            {rule.status.charAt(0).toUpperCase() + rule.status.slice(1)}
          </Text>
        </View>
        <Text style={styles.statSent}>Sent: {rule.stats.sent}</Text>
        {rule.stats.opened > 0 && (
          <Text style={styles.statOpened}>Opened: {rule.stats.opened}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function AutomationListScreen() {
  const { activeStore } = useStore();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    if (!activeStore?._id) {
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const res = await apiClient.get<unknown>(`automation-rules?storeId=${activeStore._id}`);
      if (res.success && res.data) {
        setRules(res.data.rules ?? []);
      } else {
        throw new Error(res.message || 'Failed to load automation rules');
      }
    } catch (err) {
      setError(err.message || 'Failed to load automation rules');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeStore?._id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchRules();
    }, [fetchRules])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRules();
  }, [fetchRules]);

  const handleToggle = useCallback(
    async (rule: AutomationRule) => {
      if (togglingId) return;
      setTogglingId(rule._id);
      try {
        const res = await apiClient.patch<unknown>(`automation-rules/${rule._id}/toggle`);
        if (res.success && res.data) {
          setRules((prev) =>
            prev.map((r) => (r._id === rule._id ? { ...r, status: res.data.status } : r))
          );
        }
      } catch {
        // ignore — rule stays as is
      } finally {
        setTogglingId(null);
      }
    },
    [togglingId]
  );

  const navigateToEdit = (id?: string, prefill?: Partial<AutomationRule>) => {
    const params: Record<string, string> = {};
    if (id) params.id = id;
    if (prefill) params.prefill = JSON.stringify(prefill);
    router.push({ pathname: '/automation/edit', params });
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading automations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Automations</Text>
          <Text style={styles.headerSubtitle}>Set it and forget it</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Subtitle */}
        <Text style={styles.sectionIntro}>
          Automatic messages that grow your retention — configure once and let REZ handle the rest.
        </Text>

        {/* Preset templates */}
        <Text style={styles.sectionLabel}>Start with a template</Text>
        {PRESETS.map((preset) => (
          <PresetCard
            key={preset.label}
            preset={preset}
            onPress={() => navigateToEdit(undefined, preset.prefill)}
          />
        ))}

        {/* Existing rules */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>Your Rules ({rules.length})</Text>
        </View>

        {error && rules.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="alert-circle-outline" size={40} color="#ef4444" />
            <Text style={styles.emptyTitle}>Could not load rules</Text>
            <Text style={styles.emptySubtitle}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setLoading(true);
                fetchRules();
              }}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : rules.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="flash-outline" size={52} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No automations yet</Text>
            <Text style={styles.emptySubtitle}>
              Use a template above or tap + to create a custom rule.
            </Text>
          </View>
        ) : (
          rules.map((rule) => (
            <RuleCard
              key={rule._id}
              rule={rule}
              onPress={() => navigateToEdit(rule._id)}
              onToggle={() => handleToggle(rule)}
              toggling={togglingId === rule._id}
            />
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => navigateToEdit()} activeOpacity={0.85}>
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6b7280' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backBtn: { marginRight: 12, padding: 4 },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  headerSubtitle: { fontSize: 12, color: '#9ca3af', marginTop: 1 },

  // Scroll
  scrollContent: { padding: 16 },
  sectionIntro: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 19,
    marginBottom: 20,
  },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 10 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 10 },

  // Preset cards
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  presetIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetBody: { flex: 1 },
  presetLabel: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 2 },
  presetDesc: { fontSize: 12, color: '#6b7280', lineHeight: 17 },

  // Rule cards
  ruleCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  ruleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  ruleCardLeft: { flex: 1, marginRight: 10 },
  ruleName: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 3 },
  ruleTrigger: { fontSize: 12, color: '#6b7280' },
  ruleCardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleStats: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  statSent: { fontSize: 12, color: '#6b7280' },
  statOpened: { fontSize: 12, color: '#059669' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#374151' },
  emptySubtitle: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 18,
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
