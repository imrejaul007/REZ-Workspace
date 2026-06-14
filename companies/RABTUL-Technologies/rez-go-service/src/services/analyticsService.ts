/**
 * REZ Go Analytics Service
 *
 * Tracks events for:
 * - Session metrics
 * - User behavior
 * - Conversion funnels
 * - Cashback performance
 */

import { GoSession } from '../models/GoSession.js';
import { SponsoredCampaign } from '../models/SponsoredCommerce.js';

export type EventType =
  | 'session.started'
  | 'session.resumed'
  | 'item.scanned'
  | 'item.removed'
  | 'cart.updated'
  | 'checkout.initiated'
  | 'checkout.completed'
  | 'checkout.failed'
  | 'checkout.recovered'
  | 'exit.verified'
  | 'fraud.detected'
  | 'cashback.earned'
  | 'budget.reached'
  | 'budget.exceeded'
  | 'streak.continued'
  | 'product.viewed'
  | 'product.compared';

export interface AnalyticsEvent {
  event: EventType;
  sessionId: string;
  userId?: string;
  storeId: string;
  merchantId?: string;
  data: Record<string, unknown>;
  timestamp: Date;
  deviceId?: string;
  platform?: 'ios' | 'android' | 'web';
}

interface SessionMetrics {
  totalSessions: number;
  completedSessions: number;
  averageCartValue: number;
  averageItemsPerSession: number;
  averageSessionDuration: number; // minutes
  conversionRate: number;
}

interface StoreMetrics {
  storeId: string;
  totalSessions: number;
  revenue: number;
  avgCartValue: number;
  fraudRate: number;
  topProducts: Array<{ productId: string; count: number }>;
}

interface MerchantMetrics {
  merchantId: string;
  totalSessions: number;
  revenue: number;
  cashbackPaid: number;
  avgCartValue: number;
  fraudAlerts: number;
  recoveredCheckouts: number;
}

/**
 * Track analytics event
 */
export async function trackEvent(event: AnalyticsEvent): Promise<void> {
  // In production, send to analytics service
  console.log(`[Analytics] ${event.event}:`, JSON.stringify(event.data));

  // Update metrics based on event type
  switch (event.event) {
    case 'session.started':
      await trackSessionStart(event);
      break;
    case 'checkout.completed':
      await trackCheckoutComplete(event);
      break;
    case 'fraud.detected':
      await trackFraudAlert(event);
      break;
    case 'cashback.earned':
      await trackCashback(event);
      break;
  }
}

/**
 * Track session start
 */
async function trackSessionStart(event: AnalyticsEvent): Promise<void> {
  // Could emit to event bus or update real-time metrics
  console.log(`[Analytics] New session started: ${event.sessionId}`);
}

/**
 * Track checkout completion
 */
async function trackCheckoutComplete(event: AnalyticsEvent): Promise<void> {
  const { sessionId, data } = event;

  // Update sponsored campaign metrics if applicable
  if (data.campaignId) {
    await SponsoredCampaign.updateOne(
      { campaignId: data.campaignId },
      {
        $inc: {
          'metrics.redemptions': 1,
          'metrics.revenue': (data.total as number) || 0,
        },
      }
    );
  }
}

/**
 * Track fraud alert
 */
async function trackFraudAlert(event: AnalyticsEvent): Promise<void> {
  const { sessionId, data } = event;
  console.log(`[Analytics] Fraud alert: Session ${sessionId}, Score: ${data.score}`);
}

/**
 * Track cashback
 */
async function trackCashback(event: AnalyticsEvent): Promise<void> {
  const { data } = event;
  console.log(`[Analytics] Cashback earned: ₹${data.amount}`);
}

/**
 * Get session metrics for a time period
 */
export async function getSessionMetrics(
  storeId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<SessionMetrics> {
  const query: Record<string, unknown> = {
    status: 'completed',
  };

  if (storeId) query.storeId = storeId;
  if (startDate || endDate) {
    query.completedAt = {};
    if (startDate) (query.completedAt as Record<string, Date>).$gte = startDate;
    if (endDate) (query.completedAt as Record<string, Date>).$lte = endDate;
  }

  const sessions = await GoSession.find(query);

  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      completedSessions: 0,
      averageCartValue: 0,
      averageItemsPerSession: 0,
      averageSessionDuration: 0,
      conversionRate: 0,
    };
  }

  const totalRevenue = sessions.reduce((sum, s) => sum + (s.total || 0), 0);
  const totalItems = sessions.reduce((sum, s) => sum + s.items.length, 0);
  const totalDuration = sessions.reduce((sum, s) => {
    const start = new Date(s.createdAt).getTime();
    const end = new Date(s.completedAt || s.updatedAt).getTime();
    return sum + (end - start);
  }, 0);

  const totalSessions = await GoSession.countDocuments(
    storeId ? { storeId, createdAt: query.createdAt } : { createdAt: query.createdAt }
  );

  return {
    totalSessions,
    completedSessions: sessions.length,
    averageCartValue: totalRevenue / sessions.length,
    averageItemsPerSession: totalItems / sessions.length,
    averageSessionDuration: totalDuration / sessions.length / 60000, // Convert to minutes
    conversionRate: (sessions.length / totalSessions) * 100,
  };
}

/**
 * Get store-level metrics
 */
export async function getStoreMetrics(
  storeId: string,
  startDate?: Date,
  endDate?: Date
): Promise<StoreMetrics> {
  const query: Record<string, unknown> = {
    storeId,
    status: 'completed',
  };

  if (startDate || endDate) {
    query.completedAt = {};
    if (startDate) (query.completedAt as Record<string, Date>).$gte = startDate;
    if (endDate) (query.completedAt as Record<string, Date>).$lte = endDate;
  }

  const sessions = await GoSession.find(query);
  const fraudSessions = await GoSession.countDocuments({
    storeId,
    fraudScore: { $gte: 75 },
  });

  // Calculate top products
  const productCounts: Record<string, number> = {};
  for (const session of sessions) {
    for (const item of session.items) {
      const productId = (item as any).productId || 'unknown';
      productCounts[productId] = (productCounts[productId] || 0) + (item.quantity || 1);
    }
  }

  const topProducts = Object.entries(productCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([productId, count]) => ({ productId, count }));

  const totalRevenue = sessions.reduce((sum, s) => sum + (s.total || 0), 0);

  return {
    storeId,
    totalSessions: sessions.length,
    revenue: totalRevenue,
    avgCartValue: sessions.length > 0 ? totalRevenue / sessions.length : 0,
    fraudRate: sessions.length > 0 ? (fraudSessions / sessions.length) * 100 : 0,
    topProducts,
  };
}

/**
 * Get merchant-level metrics
 */
export async function getMerchantMetrics(
  merchantId: string,
  startDate?: Date,
  endDate?: Date
): Promise<MerchantMetrics> {
  const query: Record<string, unknown> = {
    merchantId,
    status: 'completed',
  };

  if (startDate || endDate) {
    query.completedAt = {};
    if (startDate) (query.completedAt as Record<string, Date>).$gte = startDate;
    if (endDate) (query.completedAt as Record<string, Date>).$lte = endDate;
  }

  const sessions = await GoSession.find(query);

  const totalRevenue = sessions.reduce((sum, s) => sum + (s.total || 0), 0);
  const totalCashback = sessions.reduce((sum, s) => sum + (s.cashbackEarned || 0), 0);
  const fraudAlerts = await GoSession.countDocuments({
    merchantId,
    fraudScore: { $gte: 75 },
  });
  const recoveredCheckouts = await GoSession.countDocuments({
    merchantId,
    'metadata.expiredReason': 'recovered',
  });

  return {
    merchantId,
    totalSessions: sessions.length,
    revenue: totalRevenue,
    cashbackPaid: totalCashback,
    avgCartValue: sessions.length > 0 ? totalRevenue / sessions.length : 0,
    fraudAlerts,
    recoveredCheckouts,
  };
}

/**
 * Get real-time dashboard data
 */
export async function getDashboardData(storeId: string): Promise<{
  liveSessions: number;
  todaySessions: number;
  todayRevenue: number;
  todayFraudAlerts: number;
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [liveSessions, todaySessions, todayData, fraudAlerts] = await Promise.all([
    GoSession.countDocuments({ storeId, status: { $in: ['active', 'syncing'] } }),
    GoSession.countDocuments({ storeId, createdAt: { $gte: today } }),
    GoSession.aggregate([
      { $match: { storeId, status: 'completed', completedAt: { $gte: today } } },
      { $group: { _id: null, revenue: { $sum: '$total' } } },
    ]),
    GoSession.countDocuments({
      storeId,
      fraudScore: { $gte: 75 },
      createdAt: { $gte: today },
    }),
  ]);

  return {
    liveSessions,
    todaySessions,
    todayRevenue: todayData[0]?.revenue || 0,
    todayFraudAlerts: fraudAlerts,
  };
}

export default {
  trackEvent,
  getSessionMetrics,
  getStoreMetrics,
  getMerchantMetrics,
  getDashboardData,
};
