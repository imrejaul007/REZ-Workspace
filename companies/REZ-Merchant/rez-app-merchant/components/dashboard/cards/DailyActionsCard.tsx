/**
 * DailyActionsCard — Phase E dashboard card.
 *
 * Renders today's server-computed "daily actions" feed at the top of
 * the merchant dashboard. Tapping an action either:
 *   - (launch-template) launches the referenced campaign template via
 *     POST /api/merchant/campaign-templates/:id/launch
 *   - (deep-link)  navigates to the given in-app route
 *   - (external-url) opens in the system browser
 *
 * Visibility rules (owned by the registry / shell, not this component):
 *   - Hide when actions is empty.
 *   - Hide when response.mode === 'off' (feature flag off globally).
 *   - Hide when response.stale AND actions.length === 0.
 */

import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, Linking } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/DesignTokens';
import { Heading3, BodyText, Caption } from '@/components/ui/DesignSystemComponents';
import { apiClient } from '@/services/api/client';
import type { DailyActionItem } from '@/services/api/dailyActions';

export interface DailyActionsCardProps {
  /** Today's actions (already fetched by the shell via TanStack Query). */
  actions: DailyActionItem[];
  /** YYYY-MM-DD — used for the "for Today" header suffix. */
  day: string;
  /** When true, show a subtle "generated yesterday" banner under the header. */
  stale?: boolean;
  /** Optional override for the campaign-template launch endpoint.
   *  Default: POST /api/merchant/campaign-templates/:id/launch */
  onLaunchTemplate?: (templateId: string, params?: Record<string, unknown>) => Promise<void>;
}

export const DailyActionsCard: React.FC<DailyActionsCardProps> = ({
  actions,
  stale,
  onLaunchTemplate,
}) => {
  const router = useRouter();
  const [busyActionId, setBusyActionId] = useState<string | null>(null);

  const handlePress = useCallback(
    async (action: DailyActionItem) => {
      if (busyActionId) return;
      setBusyActionId(action.actionId);
      try {
        if (action.cta.kind === 'launch-template') {
          if (onLaunchTemplate) {
            await onLaunchTemplate(action.cta.target, action.cta.params);
          } else {
            const endpoint = `/api/merchant/campaign-templates/${encodeURIComponent(
              action.cta.target,
            )}/launch`;
            await apiClient.post(endpoint, action.cta.params ?? {});
          }
          Alert.alert('Launched', `Your "${action.title}" campaign is on the way.`);
        } else if (action.cta.kind === 'deep-link') {
          router.push(action.cta.target as unknown);
        } else if (action.cta.kind === 'external-url') {
          const canOpen = await Linking.canOpenURL(action.cta.target);
          if (canOpen) {
            await Linking.openURL(action.cta.target);
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unable to complete the action';
        Alert.alert("Couldn't launch", msg);
      } finally {
        setBusyActionId(null);
      }
    },
    [busyActionId, onLaunchTemplate, router],
  );

  if (!actions || actions.length === 0) return null;

  return (
    <Animated.View
      entering={FadeInDown.delay(100).springify()}
      style={styles.container}
      testID="dashboard-card-daily-actions"
      accessibilityLabel={`Today's ${actions.length} daily actions`}
    >
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <Ionicons name="today" size={16} color="#0E7490" />
        </View>
        <Heading3 style={styles.title}>Today's Actions</Heading3>
      </View>

      {stale && (
        <Caption style={styles.staleBanner}>
          Generated yesterday — we'll refresh this in the morning.
        </Caption>
      )}

      {actions.map((action) => (
        <Pressable
          key={action.actionId}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          onPress={() => handlePress(action)}
          disabled={busyActionId !== null}
          accessibilityRole="button"
          accessibilityLabel={action.title}
          accessibilityHint={action.description}
          testID={`daily-action-${action.actionId}`}
        >
          <View style={styles.rowIcon}>
            <Ionicons
              name={(action.icon as unknown) || 'arrow-forward-circle'}
              size={20}
              color={Colors.primary[500]}
            />
          </View>
          <View style={styles.meta}>
            <BodyText style={styles.name}>{action.title}</BodyText>
            <Caption style={styles.sub} numberOfLines={2}>
              {action.description}
            </Caption>
          </View>
          <View style={styles.chevron}>
            {busyActionId === action.actionId ? (
              <ActivityIndicator size="small" color={Colors.primary[500]} />
            ) : (
              <Ionicons name="chevron-forward" size={18} color={Colors.text.tertiary} />
            )}
          </View>
        </Pressable>
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  iconBadge: {
    backgroundColor: '#A5F3FC',
    borderRadius: 8,
    padding: 8,
  },
  title: {
    color: Colors.text.primary,
  },
  staleBanner: {
    color: Colors.text.tertiary,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.gray[50],
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  rowPressed: {
    opacity: 0.75,
  },
  rowIcon: {
    width: 40,
    height: 40,
    backgroundColor: Colors.primary[100],
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
  },
  name: {
    fontWeight: '600',
    color: Colors.text.primary,
    fontSize: 13,
  },
  sub: {
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  chevron: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DailyActionsCard;
