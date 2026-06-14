/**
 * Enhanced Notification Service for REZ Gamification Service
 *
 * Routes all notification events through the centralized RABTUL Notification Service
 * via HTTP API instead of direct BullMQ queue operations.
 *
 * Provides multi-channel notifications (push, email, SMS, WhatsApp, in_app)
 * for gamification events.
 */

const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL ?? 'https://rez-notifications-service.onrender.com';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN ?? '';
const HTTP_TIMEOUT_MS = 10_000;

const commonHeaders = {
  'Content-Type': 'application/json',
  'X-Internal-Token': INTERNAL_TOKEN,
  'X-Internal-Service': 'rez-gamification-service',
} as const;

export type NotificationChannel = 'push' | 'email' | 'sms' | 'whatsapp' | 'in_app';

export interface NotificationPayload {
  title: string;
  body: string;
  channelId?: string;
  priority?: 'low' | 'default' | 'high' | 'urgent';
  data?: Record<string, unknown>;
  emailSubject?: string;
  emailHtml?: string;
  smsMessage?: string;
  whatsappTemplateId?: string;
  whatsappTemplateVars?: string[];
}

export interface NotificationOptions {
  eventId: string;
  eventType: string;
  userId: string;
  channels: NotificationChannel[];
  payload: NotificationPayload;
  category?: string;
  source?: string;
  scheduledFor?: string;
}

// ── HTTP Client ────────────────────────────────────────────────────────────────

async function post<T>(path: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);

  try {
    const res = await fetch(`${NOTIFICATION_SERVICE_URL}${path}`, {
      method: 'POST',
      headers: commonHeaders,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText })) as { message?: string };
      throw Object.assign(new Error(err.message ?? `HTTP ${res.status}`), { status: res.status });
    }

    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timer);
  }
}

// ── Core Notification API ─────────────────────────────────────────────────────

/**
 * Enqueues a notification with multi-channel support via RABTUL Notification Service.
 * Supports: push, email, sms, whatsapp, in_app
 */
export async function enqueueNotification(options: NotificationOptions): Promise<void> {
  const {
    eventId,
    eventType,
    userId,
    channels,
    payload,
    category = 'gamification',
    source = 'gamification-service',
    scheduledFor,
  } = options;

  try {
    await post('/api/v1/notifications/send', {
      eventId,
      eventType,
      userId,
      channels,
      payload: {
        title: payload.title,
        body: payload.body,
        channelId: payload.channelId || 'gamification',
        priority: payload.priority || 'default',
        data: payload.data || {},
        ...(payload.emailSubject && { emailSubject: payload.emailSubject }),
        ...(payload.emailHtml && { emailHtml: payload.emailHtml }),
        ...(payload.smsMessage && { smsMessage: payload.smsMessage }),
        ...(payload.whatsappTemplateId && { whatsappTemplateId: payload.whatsappTemplateId }),
        ...(payload.whatsappTemplateVars && { whatsappTemplateVars: payload.whatsappTemplateVars }),
      },
      category,
      source,
      ...(scheduledFor && { scheduledFor }),
      createdAt: new Date().toISOString(),
    });

    logger.debug('[NotificationService] Notification queued', { eventType, userId, channels });
  } catch (error) {
    logger.error('[NotificationService] Failed to queue notification', {
      eventType,
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// ── Gamification-specific helpers ────────────────────────────────────────────

/**
 * Helper for streak-at-risk notifications.
 * Triggers when user hasn't checked in within 20 hours of their typical time.
 */
export async function sendStreakAtRiskNotification(
  userId: string,
  streakType: string,
  currentStreak: number,
  hoursRemaining: number,
  email?: string,
  phone?: string,
): Promise<void> {
  const channels: NotificationChannel[] = ['push'];
  if (email) channels.push('email');
  if (phone) channels.push('sms');

  await enqueueNotification({
    eventId: `streak-at-risk-${userId}-${streakType}-${Date.now()}`,
    eventType: 'streak_at_risk',
    userId,
    channels,
    payload: {
      title: 'Your Streak is at Risk!',
      body: `Your ${currentStreak}-day ${streakType} streak will reset in ${hoursRemaining} hours. Check in now to keep it going!`,
      channelId: 'streaks',
      priority: 'high',
      data: {
        streakType,
        currentStreak,
        hoursRemaining,
      },
      emailSubject: `Your ${currentStreak}-Day Streak Ends Soon!`,
      smsMessage: `REZ: Your ${currentStreak}-day streak ends in ${hoursRemaining}h! Open app to keep it going.`,
    },
    category: 'engagement',
    source: 'gamification-service',
  });
}

/**
 * Helper for leaderboard milestone notifications.
 */
export async function sendLeaderboardMilestoneNotification(
  userId: string,
  currentRank: number,
  previousRank?: number,
): Promise<void> {
  const channels: NotificationChannel[] = ['push', 'in_app'];

  const improvement = previousRank !== undefined && previousRank > currentRank
    ? ` (improved from #${previousRank})`
    : '';

  const isTopTen = currentRank <= 10;

  await enqueueNotification({
    eventId: `leaderboard-rank-${userId}-${currentRank}-${Date.now()}`,
    eventType: 'leaderboard_rank_changed',
    userId,
    channels,
    payload: {
      title: isTopTen ? 'Leaderboard Update' : 'Leaderboard Update',
      body: `You're now ranked #${currentRank} on the REZ Leaderboard${improvement}!`,
      channelId: 'leaderboard',
      priority: isTopTen ? 'high' : 'default',
      data: {
        currentRank,
        previousRank,
      },
    },
    category: 'gamification',
    source: 'gamification-service',
  });
}

/**
 * Helper for referral bonus notifications.
 */
export async function sendReferralBonusNotification(
  userId: string,
  referrerName: string,
  bonusCoins: number,
  email?: string,
  phone?: string,
): Promise<void> {
  const channels: NotificationChannel[] = ['push', 'in_app'];
  if (email) channels.push('email');
  if (phone) channels.push('sms');

  await enqueueNotification({
    eventId: `referral-bonus-${userId}-${Date.now()}`,
    eventType: 'referral_bonus',
    userId,
    channels,
    payload: {
      title: 'Referral Bonus Earned!',
      body: `Thanks to ${referrerName}, you earned ${bonusCoins} REZ coins! Welcome to REZ!`,
      channelId: 'referrals',
      priority: 'default',
      data: {
        referrerName,
        bonusCoins,
      },
      emailSubject: `Welcome to REZ! Here's your bonus coins!`,
    },
    category: 'gamification',
    source: 'gamification-service',
  });
}

/**
 * Notification job options for queue processing
 */
export interface NotificationJobData {
  eventId: string;
  eventType: string;
  userId: string;
  channels: string[];
  payload: Record<string, unknown>;
  category: string;
  source: string;
  createdAt: string;
  [key: string]: unknown;
}

/**
 * Notification job options
 */
export interface NotificationJobOptions {
  attempts?: number;
  backoff?: { type: 'exponential'; delay: number };
  removeOnComplete?: { age?: number; count?: number };
  removeOnFail?: { age?: number; count?: number };
}

/**
 * Queue add options interface
 */
export interface NotificationQueueInterface {
  add(name: string, data: NotificationJobData, opts?: NotificationJobOptions): Promise<unknown>;
}

/**
 * Get notification queue singleton (for backward compatibility).
 * Note: This now returns a stub - actual queuing goes through HTTP API.
 */
export function getNotificationQueue(): NotificationQueueInterface {
  return {
    add: async () => {},
  };
}

/**
 * Alias for backward compatibility.
 */
function getNotifQueue(): NotificationQueueInterface {
  return getNotificationQueue();
}

/**
 * Close notification service (no-op for HTTP-based service).
 */
export async function closeNotificationService(): Promise<void> {
  // No-op for HTTP-based service
}

export { getNotifQueue };
