/**
 * GrowthActionsCard — surfaces the 3 most actionable growth prompts
 * for a merchant based on their current store state.
 *
 * Triggered by: GET /api/merchant/intelligence/growth-actions
 * Each action maps to a deep-link into the growth flow.
 * Shows as a sticky card at the top of the dashboard when mode >= growth.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiClient } from '@/services/api/client';
import { useStore } from '@/contexts/StoreContext';

export interface GrowthAction {
  id: string;
  ruleId: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaRoute: string;
  ctaParams?: Record<string, string>;
  priority: 'high' | 'medium' | 'low';
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
}

interface IntelligenceResponse {
  actions: GrowthAction[];
  computedAt: string;
}

const ICON_MAP: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  low_afternoon_traffic: { icon: 'time', color: '#F59E0B', bg: '#FFFBEB' },
  dormant_segment_available: { icon: 'people', color: '#3B82F6', bg: '#EFF6FF' },
  no_campaign_7d: { icon: 'megaphone', color: '#10B981', bg: '#ECFDF5' },
  low_retention: { icon: 'arrow-redo', color: '#EF4444', bg: '#FEF2F2' },
  first_discount_exhausted: { icon: 'gift', color: '#8B5CF6', bg: '#F5F3FF' },
};

const ROUTE_MAP: Record<string, string> = {
  low_afternoon_traffic: '/discounts/builder',
  dormant_segment_available: '/(dashboard)/create-offer',
  no_campaign_7d: '/(dashboard)/create-offer',
  low_retention: '/(dashboard)/create-offer',
  first_discount_exhausted: '/loyalty',
};

const PARAM_MAP: Record<string, Record<string, string>> = {
  low_afternoon_traffic: { preset: 'happyhour' },
  dormant_segment_available: { preset: 'acquire' },
  no_campaign_7d: { preset: 'awareness' },
};

/** Fallback local actions computed from common patterns */
function computeLocalActions(): GrowthAction[] {
  const now = new Date();
  const hour = now.getHours();
  const isAfternoon = hour >= 14 && hour <= 17;

  const actions: GrowthAction[] = [];

  if (isAfternoon) {
    actions.push({
      id: 'local-low-afternoon',
      ruleId: 'low_afternoon_traffic',
      title: 'Afternoon lull detected',
      description: 'Create a Happy Hour deal to boost your 2–5 PM traffic.',
      ctaLabel: 'Add Happy Hour Deal',
      ctaRoute: '/discounts/builder',
      ctaParams: { preset: 'happyhour' },
      priority: 'high',
      icon: 'time',
      iconColor: '#F59E0B',
      iconBg: '#FFFBEB',
    });
  }

  actions.push({
    id: 'local-no-campaign',
    ruleId: 'no_campaign_7d',
    title: 'No campaigns this week',
    description: 'Launch a quick offer to keep customers engaged.',
    ctaLabel: 'Create Offer',
    ctaRoute: '/(dashboard)/create-offer',
    ctaParams: { preset: 'awareness' },
    priority: 'medium',
    icon: 'megaphone',
    iconColor: '#10B981',
    iconBg: '#ECFDF5',
  });

  return actions;
}

function buildRoute(route: string, params?: Record<string, string>): string {
  if (!params) return route;
  const qs = new URLSearchParams(params).toString();
  return `${route}?${qs}`;
}

export default function GrowthActionsCard() {
  const { activeStore } = useStore();
  const router = useRouter();
  const [actions, setActions] = useState<GrowthAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeStore?._id) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await apiClient.get('merchant/intelligence/growth-actions', {
          params: { storeId: activeStore._id },
        });
        if (!cancelled && res.data?.data?.actions?.length > 0) {
          setActions(res.data.data.actions);
        } else if (!cancelled) {
          // Fall back to local computation
          setActions(computeLocalActions());
        }
      } catch {
        if (!cancelled) {
          setActions(computeLocalActions());
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [activeStore?._id]);

  const handleAction = useCallback((action: GrowthAction) => {
    const route = buildRoute(action.ctaRoute, action.ctaParams);
    router.push(route as unknown);
  }, [router]);

  if (loading) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconBg}>
            <Ionicons name="trending-up" size={18} color="#7C3AED" />
          </View>
          <Text style={styles.headerText}>Growth Actions</Text>
        </View>
        <ActivityIndicator size="small" color="#7C3AED" style={{ alignSelf: 'center', marginTop: 12 }} />
      </View>
    );
  }

  if (actions.length === 0) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBg}>
          <Ionicons name="trending-up" size={18} color="#7C3AED" />
        </View>
        <Text style={styles.headerText}>Growth Actions</Text>
        <View style={styles.priorityBadge}>
          <Text style={styles.priorityBadgeText}>{actions.length}</Text>
        </View>
      </View>

      <View style={styles.actionsList}>
        {actions.slice(0, 3).map((action) => {
          const iconDef = ICON_MAP[action.ruleId] ?? { icon: 'bulb', color: '#6B7280', bg: '#F3F4F6' };
          return (
            <TouchableOpacity
              key={action.id}
              style={styles.actionRow}
              onPress={() => handleAction(action)}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconBg, { backgroundColor: iconDef.bg }]}>
                <Ionicons name={iconDef.icon} size={16} color={iconDef.color} />
              </View>
              <View style={styles.actionTextGroup}>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionDesc} numberOfLines={1}>
                  {action.description}
                </Text>
              </View>
              <View style={[styles.priorityDot, { backgroundColor: action.priority === 'high' ? '#EF4444' : action.priority === 'medium' ? '#F59E0B' : '#6B7280' }]} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  iconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4C1D95',
    flex: 1,
  },
  priorityBadge: {
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  priorityBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  actionsList: {
    gap: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  actionIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextGroup: {
    flex: 1,
    marginLeft: 10,
    gap: 2,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  actionDesc: {
    fontSize: 11,
    color: '#6B7280',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
});
