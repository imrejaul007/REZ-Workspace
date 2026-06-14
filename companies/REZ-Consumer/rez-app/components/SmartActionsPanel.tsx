// @ts-nocheck
/**
 * Smart Actions Panel Component
 *
 * A unified panel that surfaces intelligent actions based on:
 * - Time of day
 * - Location
 * - User memory
 * - Recent behavior
 *
 * Philosophy: Present one smart action at a time, in context.
 */

import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { useMemoryContinuity } from '@/hooks/useMemoryContinuity';

// ============================================================================
// TYPES
// ============================================================================

export interface SmartAction {
  id: string;
  type: 'savings' | 'discovery' | 'reminder' | 'social' | 'streak' | 'context';
  priority: 'high' | 'medium' | 'low';
  title: string;
  subtitle: string;
  value?: string;
  action: string;
  actionRoute: string;
  icon: string;
  backgroundColor: string;
  memorySource?: string;
  dismissible: boolean;
}

interface SmartActionsPanelProps {
  maxActions?: number;
  showDismissible?: boolean;
  onActionTaken?: (action: SmartAction) => void;
}

// ============================================================================
// CONTEXT-AWARE ACTION GENERATOR
// ============================================================================

function generateSmartActions(
  memories: ReturnType<typeof useMemoryContinuity>['memories'],
  context: { timeOfDay: string; dayOfWeek: string }
): SmartAction[] {
  const actions: SmartAction[] = [];
  const { timeOfDay, dayOfWeek } = context;

  // Time-based actions
  if (timeOfDay === 'morning') {
    const lunchMemory = memories.find(
      (m) => m.category === 'dining' && m.statement.includes('lunch')
    );
    actions.push({
      id: 'morning-coffee',
      type: 'savings',
      priority: 'high',
      title: 'Morning routine',
      subtitle: lunchMemory
        ? 'You usually order lunch around 1pm. Plan ahead?'
        : 'Start your day with smart savings.',
      value: 'Save up to ₹25',
      action: 'Browse',
      actionRoute: '/restaurant',
      icon: '☕',
      backgroundColor: '#FFF3E0',
      dismissible: true,
    });
  }

  if (timeOfDay === 'afternoon') {
    actions.push({
      id: 'lunch-savings',
      type: 'savings',
      priority: 'high',
      title: 'Lunchtime saving',
      subtitle: 'Nearby restaurants with cashback available.',
      value: 'Save ₹40-80',
      action: 'Order Now',
      actionRoute: '/restaurant',
      icon: '🍽️',
      backgroundColor: '#E8F5E9',
      memorySource: 'dining-behavior',
      dismissible: true,
    });
  }

  if (timeOfDay === 'evening') {
    if (dayOfWeek === 'Friday') {
      const shoppingMemory = memories.find((m) =>
        m.statement.includes('Friday') || m.statement.includes('shopping')
      );
      actions.push({
        id: 'friday-shopping',
        type: 'savings',
        priority: 'high',
        title: 'Friday evening',
        subtitle: shoppingMemory
          ? 'Your usual shopping time! Deals are active.'
          : 'Weekend deals are live. Shop smarter.',
        value: 'Up to 25% off',
        action: 'Shop Now',
        actionRoute: '/search',
        icon: '🛍️',
        backgroundColor: '#FCE4EC',
        memorySource: 'shopping-pattern',
        dismissible: true,
      });
    } else {
      actions.push({
        id: 'evening-dining',
        type: 'discovery',
        priority: 'medium',
        title: 'Dinner inspiration',
        subtitle: '3 new restaurants matched your preferences.',
        value: 'Try something new',
        action: 'Explore',
        actionRoute: '/restaurant',
        icon: '🍜',
        backgroundColor: '#E3F2FD',
        dismissible: true,
      });
    }
  }

  // Memory-based actions
  const savingsMemory = memories.find(
    (m) => m.type === 'savings' && m.category === 'finance'
  );
  if (savingsMemory) {
    actions.push({
      id: 'view-savings',
      type: 'reminder',
      priority: 'medium',
      title: 'Your savings this month',
      subtitle: savingsMemory.statement,
      action: 'View Details',
      actionRoute: '/wallet',
      icon: '💰',
      backgroundColor: '#E8F5E9',
      memorySource: savingsMemory.id,
      dismissible: true,
    });
  }

  const wellnessMemory = memories.find(
    (m) => m.category === 'wellness' && m.type === 'preference'
  );
  if (wellnessMemory) {
    actions.push({
      id: 'wellness-nearby',
      type: 'discovery',
      priority: 'low',
      title: 'Wellness near you',
      subtitle: wellnessMemory.statement,
      action: 'Browse',
      actionRoute: '/fitness',
      icon: '💆',
      backgroundColor: '#F3E5F5',
      memorySource: wellnessMemory.id,
      dismissible: true,
    });
  }

  // Streak celebration - Keep positive reinforcement for habit building
  const streakMemory = memories.find((m) =>
    m.statement.includes('streak') || m.statement.includes('active')
  );
  if (streakMemory && timeOfDay === 'evening') {
    actions.push({
      id: 'streak-celebration',
      type: 'streak',
      priority: 'low', // Celebration, not pressure
      title: 'Your streak is going strong',
      subtitle: "You've been building great savings habits. Come back tomorrow to continue!",
      value: '🔥 7 days',
      action: 'View Progress',
      actionRoute: '/',
      icon: '🎉',
      backgroundColor: '#E8F5E9', // Positive green
      dismissible: true,
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return actions;
}

// ============================================================================
// SINGLE ACTION CARD
// ============================================================================

interface ActionCardProps {
  action: SmartAction;
  index: number;
  onDismiss?: () => void;
  onPress?: () => void;
}

function ActionCard({ action, index, onDismiss, onPress }: ActionCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98);
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1);
  }, []);

  const handlePress = useCallback(() => {
    scale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    onPress?.();
  }, [onPress]);

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).duration(300)}
      exiting={FadeOut.duration(200)}
      style={styles.actionCardContainer}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={styles.actionCardTouchable}
      >
        <Animated.View
          style={[styles.actionCard, { backgroundColor: action.backgroundColor }, animatedStyle]}
        >
          <View style={styles.actionHeader}>
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionIcon}>{action.icon}</Text>
            </View>
            <View style={styles.actionMeta}>
              <View style={styles.actionTypeBadge}>
                <Text style={styles.actionTypeText}>
                  {action.type === 'savings' && '💰 Save'}
                  {action.type === 'discovery' && '✨ Discover'}
                  {action.type === 'reminder' && '📝 Reminder'}
                  {action.type === 'social' && '👥 Social'}
                  {action.type === 'streak' && '🔥 Streak'}
                  {action.type === 'context' && '📍 Context'}
                </Text>
              </View>
              {action.memorySource && (
                <View style={styles.memoryIndicator}>
                  <Ionicons name="bulb" size={12} color={colors.brand.primary} />
                </View>
              )}
            </View>
            {action.dismissible && onDismiss && (
              <Pressable style={styles.dismissButton} onPress={onDismiss}>
                <Ionicons name="close" size={16} color={colors.text.tertiary} />
              </Pressable>
            )}
          </View>

          <Text style={styles.actionTitle}>{action.title}</Text>
          <Text style={styles.actionSubtitle} numberOfLines={2}>
            {action.subtitle}
          </Text>

          <View style={styles.actionFooter}>
            {action.value && (
              <View style={styles.valueBadge}>
                <Text style={styles.valueText}>{action.value}</Text>
              </View>
            )}
            <View style={styles.actionButton}>
              <Text style={styles.actionButtonText}>{action.action}</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.brand.primary} />
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// ============================================================================
// MAIN PANEL COMPONENT
// ============================================================================

export function SmartActionsPanel({
  maxActions = 2,
  showDismissible = true,
  onActionTaken,
}: SmartActionsPanelProps) {
  const router = useRouter();
  const { memories } = useMemoryContinuity();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Get current context
  const context = useMemo(() => {
    const hour = new Date().getHours();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    let timeOfDay = 'evening';
    if (hour >= 5 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
    else timeOfDay = 'night';

    return {
      timeOfDay,
      dayOfWeek: days[new Date().getDay()],
    };
  }, []);

  // Generate and filter actions
  const actions = useMemo(() => {
    const allActions = generateSmartActions(memories, context);
    const filtered = allActions.filter(
      (a) => !dismissedIds.has(a.id)
    );
    return filtered.slice(0, maxActions);
  }, [memories, context, dismissedIds, maxActions]);

  const handleDismiss = useCallback((id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
  }, []);

  const handleActionPress = useCallback(
    (action: SmartAction) => {
      onActionTaken?.(action);
      router.push(action.actionRoute as unknown);
    },
    [router, onActionTaken]
  );

  if (actions.length === 0) {
    return null;
  }

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Smart Actions</Text>
        <Text style={styles.headerSubtitle}>Based on your habits</Text>
      </View>

      {actions.map((action, index) => (
        <ActionCard
          key={action.id}
          action={action}
          index={index}
          onDismiss={showDismissible ? () => handleDismiss(action.id) : undefined}
          onPress={() => handleActionPress(action)}
        />
      ))}
    </Animated.View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  header: {
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: typography.caption.fontSize,
    color: colors.text.tertiary,
    marginTop: 2,
  },

  // Action Card
  actionCardContainer: {
    marginBottom: spacing.sm,
  },
  actionCardTouchable: {
    borderRadius: borderRadius.xl,
  },
  actionCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionMeta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionTypeBadge: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  actionTypeText: {
    fontSize: typography.caption.fontSize,
    color: colors.text.secondary,
  },
  memoryIndicator: {
    marginLeft: spacing.xs,
    backgroundColor: colors.primary[100] + '30',
    borderRadius: borderRadius.full,
    padding: 2,
  },
  dismissButton: {
    padding: spacing.xs,
  },
  actionTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.secondary,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  actionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  valueBadge: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  valueText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: colors.text.primary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: borderRadius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  actionButtonText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    color: colors.brand.primary,
    marginRight: 4,
  },
});

export default SmartActionsPanel;
