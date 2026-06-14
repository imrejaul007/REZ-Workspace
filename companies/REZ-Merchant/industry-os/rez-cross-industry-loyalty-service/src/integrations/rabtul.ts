import { config } from '../config';
import { logger } from '../utils/logger';

// RABTUL notification payload types
export interface LoyaltyNotification {
  type: 'points_earned' | 'points_redeemed' | 'tier_upgrade' | 'expiration' | 'campaign_joined';
  accountId: string;
  userId: string;
  points?: number;
  vertical?: string;
  merchantId?: string;
  tier?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

interface RABTULWebhookPayload {
  event: string;
  timestamp: string;
  data: {
    accountId: string;
    userId: string;
    intent?: string;
    verticals?: string[];
    tier?: string;
    points?: number;
    transactionCount?: number;
    preferences?: Record<string, any>;
  };
}

/**
 * Send notification to RABTUL for loyalty events
 * RABTUL is the personalization and notification service
 */
export async function sendLoyaltyNotification(notification: LoyaltyNotification): Promise<boolean> {
  if (!config.RABTUL_ENABLED) {
    logger.debug('RABTUL notifications disabled');
    return false;
  }

  try {
    // Build intent data for personalization
    const intentData = buildIntentData(notification);

    const payload: RABTULWebhookPayload = {
      event: `loyalty.${notification.type}`,
      timestamp: new Date().toISOString(),
      data: {
        accountId: notification.accountId,
        userId: notification.userId,
        intent: intentData.intent,
        verticals: intentData.verticals,
        tier: notification.tier || intentData.tier,
        points: notification.points,
        transactionCount: intentData.transactionCount,
        preferences: intentData.preferences
      }
    };

    // Send to RABTUL webhook
    if (config.RABTUL_WEBHOOK_URL) {
      const response = await fetch(config.RABTUL_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': config.INTERNAL_TOKEN
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (!response.ok) {
        logger.warn(`RABTUL webhook returned status: ${response.status}`);
        return false;
      }

      logger.debug(`RABTUL notification sent: ${notification.type}`);
      return true;
    }

    // Log for development if no webhook URL
    logger.info(`RABTUL event (no webhook): ${JSON.stringify(payload)}`);
    return true;
  } catch (error) {
    logger.error('Failed to send RABTUL notification:', error);
    return false;
  }
}

/**
 * Build intent data for personalization
 */
function buildIntentData(notification: LoyaltyNotification): {
  intent: string;
  verticals: string[];
  tier?: string;
  transactionCount?: number;
  preferences: Record<string, any>;
} {
  const baseIntent = `loyalty_${notification.type}`;

  switch (notification.type) {
    case 'points_earned':
      return {
        intent: `${baseIntent}_${notification.vertical}`,
        verticals: [notification.vertical!],
        points: notification.points,
        preferences: {
          messageType: 'earn_confirmation',
          includePoints: true,
          suggestRedemption: notification.points && notification.points > 500
        }
      };

    case 'points_redeemed':
      return {
        intent: `${baseIntent}_${notification.vertical}`,
        verticals: [notification.vertical!],
        points: notification.points,
        preferences: {
          messageType: 'redemption_confirmation',
          includeReceipt: true,
          encourageReview: true
        }
      };

    case 'tier_upgrade':
      return {
        intent: 'loyalty_tier_upgrade',
        verticals: [],
        tier: notification.tier,
        preferences: {
          messageType: 'celebration',
          highlightBenefits: true,
          includeNewTierInfo: true
        }
      };

    case 'expiration':
      return {
        intent: 'loyalty_points_expiring',
        verticals: notification.metadata?.verticals || [],
        preferences: {
          messageType: 'reminder',
          urgent: true,
          includeHowToUse: true
        }
      };

    case 'campaign_joined':
      return {
        intent: `loyalty_campaign_${notification.metadata?.campaignId}`,
        verticals: [notification.vertical!],
        preferences: {
          messageType: 'campaign_confirmation',
          includeCampaignDetails: true
        }
      };

    default:
      return {
        intent: baseIntent,
        verticals: [],
        preferences: {}
      };
  }
}

/**
 * Get user intent from RABTUL
 * Used for personalization recommendations
 */
export async function getUserIntent(accountId: string): Promise<Record<string, any> | null> {
  if (!config.RABTUL_ENABLED || !config.RABTUL_WEBHOOK_URL) {
    return null;
  }

  try {
    const response = await fetch(
      `${config.RABTUL_WEBHOOK_URL}/intent/${accountId}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': config.INTERNAL_TOKEN
        }
      }
    );

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    logger.error('Failed to get user intent from RABTUL:', error);
    return null;
  }
}

/**
 * Sync loyalty data with RABTUL
 * Called periodically to update user profiles
 */
export async function syncLoyaltyData(accountId: string, data: {
  totalPoints: number;
  tier: string;
  verticals: string[];
  transactionCount: number;
}): Promise<boolean> {
  if (!config.RABTUL_ENABLED) {
    return false;
  }

  try {
    const response = await fetch(
      `${config.RABTUL_WEBHOOK_URL}/sync/loyalty`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': config.INTERNAL_TOKEN
        },
        body: JSON.stringify({
          accountId,
          ...data,
          timestamp: new Date().toISOString()
        })
      }
    );

    return response.ok;
  } catch (error) {
    logger.error('Failed to sync loyalty data with RABTUL:', error);
    return false;
  }
}

export default {
  sendLoyaltyNotification,
  getUserIntent,
  syncLoyaltyData
};