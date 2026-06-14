/**
 * Ambient Intelligence Hook
 *
 * Surfaces intelligence at the right moment, not just when users open the app.
 *
 * Philosophy: Intelligence should find users, not wait for users to find it.
 *
 * Examples:
 * - "It's 1pm. You usually order lunch now. Save ₹80 at nearby spot?"
 * - "You're near Café Mocha. 20% cashback available."
 * - "Friday evening - your usual shopping time. Deals active now."
 * - "You saved ₹340 this week. More than last week!"
 *
 * Analytics Tracking:
 * - notification_sent: When ambient notification is sent
 * - notification_viewed: When notification is displayed
 * - notification_interacted: When user taps notification
 * - notification_dismissed: When user swipes away notification
 * - ambient_intelligence_score: Calculated from interaction rate
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { intelligenceAnalytics, IntelligenceEvents } from '@/services/intelligenceAnalytics';
import { logger } from '@/utils/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface AmbientTrigger {
  type: 'time' | 'location' | 'behavior' | 'savings' | 'social' | 'context';
  condition: AmbientCondition;
  message: AmbientMessage;
  priority: 'high' | 'medium' | 'low';
  cooldown: number; // milliseconds before can trigger again
  category: 'savings' | 'reminder' | 'discovery' | 'social' | 'celebration';
}

export interface AmbientCondition {
  time?: {
    hour?: number;
    hourRange?: [number, number];
    dayOfWeek?: number[];
  };
  location?: {
    nearPlace?: string;
    nearCategory?: string[];
    distance?: number; // meters
  };
  behavior?: {
    usuallyDoes?: string;
    streakAtRisk?: boolean;
  };
  savings?: {
    amountAbove?: number;
    expiringWithin?: number; // days
  };
  social?: {
    friendNearby?: boolean;
    friendActivity?: string;
  };
}

export interface AmbientMessage {
  headline: string;
  body: string;
  action?: string;
  actionRoute?: string;
  emoji?: string;
}

export interface AmbientNotification {
  id: string;
  trigger: AmbientTrigger;
  message: AmbientMessage;
  scheduledAt: number;
  delivered: boolean;
  interacted: boolean;
}

export interface UserContext {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: string;
  locationName?: string;
  locationCategory?: string;
  inHabitWindow: boolean;
  streakAtRisk: boolean;
  savingsThisWeek: number;
  savingsLastWeek: number;
  recentMemories: string[];
}

// ============================================================================
// AMBIENT TRIGGER DEFINITIONS
// ============================================================================

const AMBIENT_TRIGGERS: AmbientTrigger[] = [
  // Time-based triggers
  {
    type: 'time',
    condition: {
      time: { hourRange: [12, 14], dayOfWeek: [1, 2, 3, 4, 5] }, // Weekdays 12-2pm
    },
    message: {
      headline: "Lunchtime saving",
      body: "You usually order around now. Nearby spot has 20% cashback today.",
      action: "Order lunch",
      actionRoute: "/restaurant",
      emoji: "🍽️",
    },
    priority: 'high',
    cooldown: 4 * 60 * 60 * 1000, // 4 hours
    category: 'savings',
  },
  {
    type: 'time',
    condition: {
      time: { hourRange: [18, 21], dayOfWeek: [5] }, // Friday 6-9pm
    },
    message: {
      headline: "Friday evening",
      body: "Your usual shopping time! Deals are active now.",
      action: "Shop now",
      actionRoute: "/search",
      emoji: "🛍️",
    },
    priority: 'high',
    cooldown: 2 * 60 * 60 * 1000, // 2 hours
    category: 'savings',
  },
  {
    type: 'time',
    condition: {
      time: { hourRange: [19, 21], dayOfWeek: [0, 1, 2, 3, 4] }, // Weekday evenings 7-9pm
    },
    message: {
      headline: "Peak REZ time",
      body: "You're most active on REZ around now. Check your daily briefing?",
      action: "View today",
      actionRoute: "/for-you-today",
      emoji: "✨",
    },
    priority: 'medium',
    cooldown: 24 * 60 * 60 * 1000, // 24 hours
    category: 'reminder',
  },

  // Behavior-based triggers
  {
    type: 'behavior',
    condition: {
      behavior: { streakAtRisk: true },
    },
    message: {
      headline: "Streak at risk",
      body: "Check in today to keep your streak going.",
      action: "Check in",
      actionRoute: "/",
      emoji: "🔥",
    },
    priority: 'high',
    cooldown: 12 * 60 * 60 * 1000, // 12 hours
    category: 'reminder',
  },
  {
    type: 'behavior',
    condition: {
      behavior: { usuallyDoes: 'dining' },
    },
    message: {
      headline: "7 days ago",
      body: "You tried Korean food last week. Want to go again?",
      action: "Browse options",
      actionRoute: "/restaurant",
      emoji: "🍜",
    },
    priority: 'low',
    cooldown: 7 * 24 * 60 * 60 * 1000, // 7 days
    category: 'discovery',
  },

  // Savings-based triggers
  {
    type: 'savings',
    condition: {
      savings: { expiringWithin: 7 },
    },
    message: {
      headline: "Rewards expiring",
      body: "You have rewards expiring in the next week. Use them before they go!",
      action: "View rewards",
      actionRoute: "/wallet",
      emoji: "⏰",
    },
    priority: 'medium',
    cooldown: 3 * 24 * 60 * 60 * 1000, // 3 days
    category: 'savings',
  },
  {
    type: 'savings',
    condition: {
      savings: { amountAbove: 0 }, // More than last week
    },
    message: {
      headline: "Great week!",
      body: "You saved ₹{{amount}} this week. More than last week!",
      action: "See details",
      actionRoute: "/wallet",
      emoji: "🎉",
    },
    priority: 'medium',
    cooldown: 7 * 24 * 60 * 60 * 1000, // 7 days
    category: 'celebration',
  },

  // Location-based triggers
  {
    type: 'location',
    condition: {
      location: { nearCategory: ['restaurant', 'cafe', 'food'], distance: 500 },
    },
    message: {
      headline: "You're near a partner",
      body: "{{placeName}} is 200m away with {{cashback}}% cashback available.",
      action: "Learn more",
      actionRoute: "/restaurant",
      emoji: "📍",
    },
    priority: 'high',
    cooldown: 2 * 60 * 60 * 1000, // 2 hours
    category: 'savings',
  },

  // Social triggers
  {
    type: 'social',
    condition: {
      social: { friendNearby: true },
    },
    message: {
      headline: "Friend nearby",
      body: "{{friendName}} is at the same place as you. Split a deal?",
      action: "Send invite",
      actionRoute: "/friends",
      emoji: "👥",
    },
    priority: 'low',
    cooldown: 4 * 60 * 60 * 1000, // 4 hours
    category: 'social',
  },
];

// ============================================================================
// HOOK
// ============================================================================

export function useAmbientIntelligence() {
  const [notifications, setNotifications] = useState<AmbientNotification[]>([]);
  const [isEnabled, setIsEnabled] = useState(true);
  const [lastTriggered, setLastTriggered] = useState<Record<string, number>>({});
  const [metrics, setMetrics] = useState({ sent: 0, viewed: 0, interacted: 0, dismissed: 0 });
  const appState = useRef(AppState.currentState);

  // Get current context
  const getCurrentContext = useCallback((): UserContext => {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    let timeOfDay: UserContext['timeOfDay'];
    if (hour >= 5 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
    else timeOfDay = 'night';

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return {
      timeOfDay,
      dayOfWeek: days[day],
      inHabitWindow: hour >= 19 && hour <= 21, // 7-9pm peak time
      streakAtRisk: false, // Would come from user state
      savingsThisWeek: 840, // Would come from user state
      savingsLastWeek: 620,
      recentMemories: [],
    };
  }, []);

  // Check if trigger condition matches current context
  const checkCondition = useCallback(
    (trigger: AmbientTrigger, context: UserContext): boolean => {
      const { condition } = trigger;

      // Time condition
      if (condition.time) {
        const now = new Date();
        const hour = now.getHours();
        const day = now.getDay();

        if (condition.time.hour && hour !== condition.time.hour) return false;

        if (condition.time.hourRange) {
          const [start, end] = condition.time.hourRange;
          if (hour < start || hour > end) return false;
        }

        if (condition.time.dayOfWeek) {
          if (!condition.time.dayOfWeek.includes(day)) return false;
        }
      }

      // Location condition
      if (condition.location && !context.locationName) {
        return false; // No location data available
      }

      // Behavior condition
      if (condition.behavior) {
        if (condition.behavior.streakAtRisk && !context.streakAtRisk) {
          return false;
        }
      }

      // Savings condition
      if (condition.savings) {
        if (condition.savings.expiringWithin && context.savingsThisWeek <= 0) {
          return false;
        }
        if (condition.savings.amountAbove !== undefined) {
          const improvement = context.savingsThisWeek - context.savingsLastWeek;
          if (improvement <= condition.savings.amountAbove) return false;
        }
      }

      return true;
    },
    []
  );

  // Check cooldown
  const isOnCooldown = useCallback(
    (triggerId: string): boolean => {
      const lastTime = lastTriggered[triggerId];
      if (!lastTime) return false;

      const trigger = AMBIENT_TRIGGERS.find((t) => t.type + t.condition.time?.hour === triggerId);
      if (!trigger) return false;

      return Date.now() - lastTime < trigger.cooldown;
    },
    [lastTriggered]
  );

  // Evaluate all triggers
  const evaluateTriggers = useCallback(() => {
    if (!isEnabled) return [];

    const context = getCurrentContext();
    const eligible: AmbientNotification[] = [];

    for (const trigger of AMBIENT_TRIGGERS) {
      const triggerId = `${trigger.type}-${trigger.condition.time?.hour || 0}`;

      if (isOnCooldown(triggerId)) continue;
      if (!checkCondition(trigger, context)) continue;

      eligible.push({
        id: `ambient-${Date.now()}-${Math.random()}`,
        trigger,
        message: trigger.message,
        scheduledAt: Date.now(),
        delivered: false,
        interacted: false,
      });
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    eligible.sort((a, b) => priorityOrder[a.trigger.priority] - priorityOrder[b.trigger.priority]);

    return eligible;
  }, [isEnabled, getCurrentContext, checkCondition, isOnCooldown]);

  // Send notification
  const sendNotification = useCallback(
    async (notification: AmbientNotification) => {
      if (!isEnabled) return;

      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: notification.message.headline,
            body: notification.message.body,
            data: { route: notification.message.actionRoute },
          },
          trigger: null, // Send immediately
        });

        // Track notification sent
        setMetrics(prev => ({ ...prev, sent: prev.sent + 1 }));
        intelligenceAnalytics.trackAmbientNotificationSent(
          notification.trigger.type,
          notification.trigger.category,
          notification.trigger.priority
        );

        // Mark as delivered and update cooldown
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, delivered: true } : n
          )
        );

        const triggerId = `${notification.trigger.type}-${notification.trigger.condition.time?.hour || 0}`;
        setLastTriggered((prev) => ({ ...prev, [triggerId]: Date.now() }));
      } catch (error) {
        logger.error('Failed to send ambient notification:', error);
      }
    },
    [isEnabled]
  );

  // Check and send notifications on app state change
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current === 'background' && nextAppState === 'active') {
        // App came to foreground - evaluate triggers
        const eligible = evaluateTriggers();
        if (eligible.length > 0) {
          sendNotification(eligible[0]); // Send highest priority
        }
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, [evaluateTriggers, sendNotification]);

  // Periodic evaluation (every 15 minutes when in foreground)
  useEffect(() => {
    const interval = setInterval(() => {
      if (AppState.currentState === 'active') {
        const eligible = evaluateTriggers();
        if (eligible.length > 0 && !isOnCooldown(eligible[0].id)) {
          sendNotification(eligible[0]);
        }
      }
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [evaluateTriggers, sendNotification, isOnCooldown]);

  // Toggle notifications
  const toggleNotifications = useCallback(() => {
    setIsEnabled((prev) => !prev);
  }, []);

  // Dismiss notification
  const dismissNotification = useCallback((id: string) => {
    const notification = notifications.find(n => n.id === id);
    if (notification) {
      // Track notification dismissed
      setMetrics(prev => ({ ...prev, dismissed: prev.dismissed + 1 }));
      intelligenceAnalytics.track(
        IntelligenceEvents.Ambient.DISMISSED,
        {
          notificationId: id,
          triggerType: notification.trigger.type,
          category: notification.trigger.category,
        }
      );
    }

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, interacted: true } : n))
    );
  }, [notifications]);

  // Mark notification as viewed (when user opens app via notification)
  const markAsViewed = useCallback((id: string) => {
    const notification = notifications.find(n => n.id === id);
    if (notification) {
      // Track notification viewed
      setMetrics(prev => ({ ...prev, viewed: prev.viewed + 1 }));
      intelligenceAnalytics.track(
        IntelligenceEvents.Ambient.VIEWED,
        {
          notificationId: id,
          triggerType: notification.trigger.type,
          category: notification.trigger.category,
        }
      );
    }
  }, [notifications]);

  // Mark notification as interacted (when user taps action)
  const markAsInteracted = useCallback((id: string) => {
    const notification = notifications.find(n => n.id === id);
    if (notification) {
      // Track notification interaction
      setMetrics(prev => ({ ...prev, interacted: prev.interacted + 1 }));
      intelligenceAnalytics.trackAmbientNotificationInteraction(id, 'tap');
    }
  }, [notifications]);

  // Calculate ambient intelligence score
  const getAmbientIntelligenceScore = useCallback((): number => {
    const { sent, interacted } = metrics;
    if (sent === 0) return 0;
    return Math.round((interacted / sent) * 100);
  }, [metrics]);

  // Calculate notification interaction rate
  const getInteractionRate = useCallback((): number => {
    const { viewed, interacted } = metrics;
    if (viewed === 0) return 0;
    return Math.round((interacted / viewed) * 100);
  }, [metrics]);

  return {
    notifications,
    isEnabled,
    toggleNotifications,
    dismissNotification,
    evaluateTriggers,
    sendNotification,
    markAsViewed,
    markAsInteracted,
    currentContext: getCurrentContext(),

    // Analytics
    metrics,
    getAmbientIntelligenceScore,
    getInteractionRate,
  };
}
