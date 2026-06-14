/**
 * useSavingsNotifications - Hook for managing savings notifications
 *
 * Usage:
 * import { useSavingsNotifications } from '@/hooks/useSavingsNotifications';
 *
 * function MyComponent() {
 *   useSavingsNotifications();
 *   // ...
 * }
 */

import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useSavings } from '@/hooks/useSavings';
import { savingsNotificationService } from '@/services/savingsNotificationService';
import { logger } from '@/utils/logger';

export function useSavingsNotifications() {
  const { dashboard, streak, refreshDashboard, refreshStreak } = useSavings();
  const appState = useRef(AppState.currentState);
  const lastTotalSavings = useRef<number>(0);
  const lastStreakDays = useRef<number>(0);
  const notifiedMilestones = useRef<Set<number>>(new Set());
  const notifiedStreaks = useRef<Set<number>>(new Set());

  // Initialize notification service
  useEffect(() => {
    savingsNotificationService.initialize().catch((err) => {
      logger.error('[useSavingsNotifications] Failed to initialize', { error: err });
    });

    return () => {
      savingsNotificationService.cleanup();
    };
  }, []);

  // Check for milestone notifications when total savings changes
  useEffect(() => {
    if (!dashboard || dashboard.totalSavingsAmount === 0) return;

    const currentTotal = dashboard.totalSavingsAmount;
    const milestones = [100, 500, 1000, 5000, 10000, 50000, 100000];

    for (const milestone of milestones) {
      if (currentTotal >= milestone && !notifiedMilestones.current.has(milestone)) {
        notifiedMilestones.current.add(milestone);
        savingsNotificationService.sendSavingsMilestoneNotification(currentTotal, milestone).catch((err) => {
          logger.error('[useSavingsNotifications] Failed to send milestone', { error: err });
        });
      }
    }

    lastTotalSavings.current = currentTotal;
  }, [dashboard?.totalSavingsAmount]);

  // Check for streak achievement notifications
  useEffect(() => {
    if (!streak) return;

    const achievementMilestones = [7, 14, 30, 60, 90, 365];
    const currentStreak = streak.currentStreak;

    for (const milestone of achievementMilestones) {
      if (currentStreak === milestone && !notifiedStreaks.current.has(milestone)) {
        notifiedStreaks.current.add(milestone);
        savingsNotificationService.sendStreakAchievement(milestone).catch((err) => {
          logger.error('[useSavingsNotifications] Failed to send streak achievement', { error: err });
        });
      }
    }

    lastStreakDays.current = currentStreak;
  }, [streak?.currentStreak]);

  // Check for streak reminder when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current === 'background' && nextAppState === 'active') {
        // App has come to foreground - check streak
        refreshDashboard();
        refreshStreak();

        // Check if streak reminder should be sent
        if (streak && streak.daysUntilStreakLost === 1) {
          savingsNotificationService.scheduleStreakReminder(streak.currentStreak).catch((err) => {
            logger.error('[useSavingsNotifications] Failed to schedule streak reminder', { error: err });
          });
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [streak, refreshDashboard, refreshStreak]);

  // Goal completion check (would be triggered by goal updates)
  const checkGoalCompletion = (goalId: string, goalName: string, completed: boolean, amount: number) => {
    if (completed) {
      savingsNotificationService.sendGoalCompletedNotification(goalId, goalName, amount).catch((err) => {
        logger.error('[useSavingsNotifications] Failed to send goal completed', { error: err });
      });
    }
  };

  // Goal progress check
  const checkGoalProgress = (goalId: string, goalName: string, current: number, target: number) => {
    savingsNotificationService.sendGoalProgressNotification(goalId, goalName, current, target).catch((err) => {
      logger.error('[useSavingsNotifications] Failed to send goal progress', { error: err });
    });
  };

  return {
    checkGoalCompletion,
    checkGoalProgress,
  };
}

// ─── Streak Reminder Scheduler ─────────────────────────────────────────────────

/**
 * Schedule a daily streak reminder check
 * Call this on app startup to set up recurring streak reminders
 */
export function useStreakReminderScheduler() {
  const { streak } = useSavings();

  useEffect(() => {
    if (!streak) return;

    // If streak is at risk, schedule reminder for later in the day
    if (streak.daysUntilStreakLost === 1) {
      // Calculate hours until end of day
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      const hoursUntilEndOfDay = (endOfDay.getTime() - now.getTime()) / (1000 * 60 * 60);

      // If more than 2 hours left, schedule reminder
      if (hoursUntilEndOfDay > 2) {
        savingsNotificationService.scheduleStreakReminder(streak.currentStreak).catch((err) => {
          logger.error('[useStreakReminderScheduler] Failed to schedule', { error: err });
        });
      }
    }
  }, [streak]);
}
