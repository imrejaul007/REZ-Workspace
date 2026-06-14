/**
 * RABTUL SDK Integration for REZ Mind Spa Service
 *
 * This module provides integration with the RABTUL SDK for:
 * - Intent graph for personalized recommendations
 * - Intent tracking for AI recommendations shown
 * - WhatsApp notifications for wellness tips
 * - JWT validation via auth service
 *
 * SDK Documentation: /RABTUL-Technologies/REZ-connector-sdk/
 */

import { REZ } from '@rez/sdk';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';

// RABTUL SDK Configuration
const RABTUL_CONFIG = {
  apiKey: process.env.RABTUL_SDK_API_KEY || 'dev-api-key',
  environment: (process.env.NODE_ENV as 'development' | 'production' | 'staging') || 'development',
  timeout: parseInt(process.env.RABTUL_SDK_TIMEOUT || '30000', 10),
  retries: parseInt(process.env.RABTUL_SDK_RETRIES || '3', 10),
};

// Service URLs
const SERVICE_URLS = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:4002',
  wallet: process.env.WALLET_SERVICE_URL || 'http://localhost:4003',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4004',
  intent: process.env.INTENT_SERVICE_URL || 'http://localhost:4006',
};

// Initialize RABTUL SDK Client
const rezClient = new REZ(RABTUL_CONFIG);

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'internal-service-token';

// ============================================
// Intent Graph Integration
// ============================================

export interface CustomerIntentProfile {
  preferences: string[];
  interests: string[];
  budget: string;
  preferredTimes: string[];
  skinConcerns?: string[];
  stressLevels?: string[];
  preferredAtmosphere?: string[];
}

export interface IntentContext {
  merchantId?: string;
  category?: string;
  sessionType?: string;
}

/**
 * Get customer intent/preferences from RABTUL Intent Graph
 */
export async function getCustomerIntent(
  customerId: string,
  context?: IntentContext
): Promise<{
  success: boolean;
  intent?: CustomerIntentProfile;
  error?: string;
}> {
  try {
    const result = await fetch(`${SERVICE_URLS.intent}/api/intent/${customerId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RABTUL_SDK_API_KEY || 'dev-key'}`,
      },
    });

    if (!result.ok) {
      logger.warn('Intent service unavailable', { status: result.status, customerId });
      return { success: false, error: 'Intent service unavailable' };
    }

    const data = await result.json();
    logger.info('Customer intent retrieved from RABTUL', {
      customerId,
      hasPreferences: !!data.preferences,
    });

    return {
      success: true,
      intent: data as CustomerIntentProfile,
    };
  } catch (error) {
    logger.error('Failed to get customer intent', { error, customerId });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Enrich recommendations with intent data
 */
export async function enrichWithIntent(
  customerId: string,
  recommendations: Array<{ treatmentId: string; treatmentName: string; score: number }>,
  context?: IntentContext
): Promise<Array<{ treatmentId: string; treatmentName: string; score: number; intentMatch?: number }>> {
  const intentResult = await getCustomerIntent(customerId, context);

  if (!intentResult.success || !intentResult.intent) {
    return recommendations;
  }

  const { preferences, interests } = intentResult.intent;

  return recommendations.map((rec) => {
    // Calculate intent match score based on preferences and interests
    const matchedPreferences = preferences.filter(
      (p) => rec.treatmentName.toLowerCase().includes(p.toLowerCase())
    ).length;
    const matchedInterests = interests.filter(
      (i) => rec.treatmentName.toLowerCase().includes(i.toLowerCase())
    ).length;

    const intentMatch = Math.min(
      100,
      Math.round(((matchedPreferences + matchedInterests) / Math.max(preferences.length + interests.length, 1)) * 100)
    );

    return {
      ...rec,
      intentMatch,
    };
  });
}

// ============================================
// Intent Tracking
// ============================================

export interface AIRecommendationEventData {
  customerId: string;
  merchantId: string;
  sessionId: string;
  recommendations: Array<{
    treatmentId: string;
    treatmentName: string;
    score: number;
    reason: string;
  }>;
  consultationType: 'initial' | 'follow_up' | 'package';
  responseShown: boolean;
  actionTaken?: 'booked' | 'dismissed' | 'saved';
  metadata?: Record<string, unknown>;
}

/**
 * Track AI recommendations shown to customer
 */
export async function trackAIRecommendationEvent(
  data: AIRecommendationEventData
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  try {
    const eventPayload = {
      user_id: data.customerId,
      event_type: 'ai_spa_recommendation',
      action: data.actionTaken || 'shown',
      properties: {
        merchant_id: data.merchantId,
        session_id: data.sessionId,
        consultation_type: data.consultationType,
        recommendations: data.recommendations,
        recommendation_count: data.recommendations.length,
        response_shown: data.responseShown,
        action_taken: data.actionTaken,
        top_recommendation: data.recommendations[0]?.treatmentName,
        top_recommendation_score: data.recommendations[0]?.score,
        ...data.metadata,
      },
      timestamp: new Date().toISOString(),
    };

    const result = await fetch(`${SERVICE_URLS.intent}/api/events/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RABTUL_SDK_API_KEY || 'dev-key'}`,
      },
      body: JSON.stringify(eventPayload),
    });

    if (!result.ok) {
      logger.warn('Intent tracking failed', {
        status: result.status,
        sessionId: data.sessionId,
      });
      return { success: false, error: 'Intent service returned error' };
    }

    const responseData = await result.json();
    logger.info('AI recommendation event tracked', {
      sessionId: data.sessionId,
      action: data.actionTaken,
      eventId: responseData.eventId,
    });

    return { success: true, eventId: responseData.eventId };
  } catch (error) {
    logger.error('Failed to track AI recommendation event', {
      error,
      sessionId: data.sessionId,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// Notification Connector
// ============================================

export interface WellnessTipData {
  customerId: string;
  customerPhone: string;
  customerName: string;
  tipTitle: string;
  tipContent: string;
  category: 'skincare' | 'wellness' | 'relaxation' | 'health';
  merchantName: string;
}

/**
 * Send WhatsApp notification for wellness tips
 */
export async function sendWellnessTipWhatsApp(
  data: WellnessTipData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    let categoryEmoji: string;
    switch (data.category) {
      case 'skincare':
        categoryEmoji = '✨';
        break;
      case 'wellness':
        categoryEmoji = '🌿';
        break;
      case 'relaxation':
        categoryEmoji = '🧘';
        break;
      case 'health':
        categoryEmoji = '💪';
        break;
      default:
        categoryEmoji = '💆';
    }

    const message = `${categoryEmoji} *Wellness Tip for You*\n\n` +
      `Hi ${data.customerName},\n\n` +
      `*${data.tipTitle}*\n\n` +
      `${data.tipContent}\n\n` +
      `--\n` +
      `From ${data.merchantName}\n` +
      `Sent with care 💆`;

    const result = await rezClient.notifications.send({
      user_id: data.customerId,
      channel: 'whatsapp',
      title: data.tipTitle,
      body: message,
      data: {
        category: data.category,
        type: 'wellness_tip',
        merchantName: data.merchantName,
      },
    });

    logger.info('Wellness tip WhatsApp sent via RABTUL SDK', {
      customerId: data.customerId,
      category: data.category,
    });

    return { success: true, messageId: result.data as string };
  } catch (error) {
    logger.error('Failed to send wellness tip WhatsApp', {
      error,
      customerId: data.customerId,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// Auth Connector (JWT Validation)
// ============================================

export interface AuthUser {
  userId: string;
  merchantId?: string;
  role: string;
  permissions?: string[];
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

/**
 * JWT Authentication middleware using RABTUL
 */
export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: 'No authorization header provided' });
      return;
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({ error: 'Invalid authorization header format' });
      return;
    }

    const token = parts[1];

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token has expired' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    logger.error('Authentication error', { error });
    res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * Internal service token authentication using RABTUL
 */
export function authenticateInternalService(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const serviceToken = req.headers['x-internal-service-token'] as string;

    if (!serviceToken) {
      res.status(401).json({ error: 'No internal service token provided' });
      return;
    }

    if (serviceToken !== INTERNAL_SERVICE_TOKEN) {
      res.status(403).json({ error: 'Invalid internal service token' });
      return;
    }

    req.user = {
      userId: 'internal-service',
      role: 'service',
    };

    next();
  } catch (error) {
    logger.error('Internal service authentication error', { error });
    res.status(401).json({ error: 'Internal service authentication failed' });
  }
}

// ============================================
// Service Export
// ============================================

export const rabtul = {
  intent: {
    getIntent: getCustomerIntent,
    enrichRecommendations: enrichWithIntent,
    trackEvent: trackAIRecommendationEvent,
  },
  notifications: {
    sendWellnessTipWhatsApp,
    client: rezClient.notifications,
  },
  auth: {
    authenticate,
    authenticateInternalService,
  },
  config: RABTUL_CONFIG,
  urls: SERVICE_URLS,
};

export default rabtul;