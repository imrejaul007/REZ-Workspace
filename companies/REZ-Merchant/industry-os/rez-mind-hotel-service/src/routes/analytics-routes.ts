/**
 * REZ Mind Hotel Service - Analytics Routes
 *
 * Endpoints for hotel analytics and insights:
 * - Hotel performance
 * - User behavior
 * - Service metrics
 * - Revenue analytics
 * - Signal aggregation
 *
 * Integrates with REZ-Intelligence:
 * - Signal Aggregator (4121)
 * - Predictive Engine (4123)
 * - Unified Profile (4120)
 */

import { Router, Request, Response } from 'express';
import logger from './utils/logger';
import {
  HotelSearchEvent,
  HotelBookingEvent,
  RoomQREvent,
  ServiceRequestEvent,
  CheckoutEvent,
} from '../models/event-schemas';
import {
  signalCollector,
  SignalCategory,
} from '../services/signal-collector';
import { hotelIntelligence } from '../integrations/rezIntelligence';

const router = Router();

// ─── Hotel Performance ────────────────────────────────────────────────────────

/**
 * GET /api/analytics/hotel/:hotelId
 * Get performance metrics for a hotel
 */
router.get('/hotel/:hotelId', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Get search stats
    const searchStats = await HotelSearchEvent.aggregate([
      {
        $match: {
          selectedHotelId: hotelId,
          timestamp: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          totalSearches: { $sum: 1 },
          conversions: { $sum: { $cond: ['$selectedHotelId', 1, 0] } },
        },
      },
    ]);

    // Get booking stats
    const bookingStats = await HotelBookingEvent.aggregate([
      {
        $match: {
          hotelId,
          timestamp: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmountPaise' },
        },
      },
    ]);

    // Get service request stats
    const serviceStats = await ServiceRequestEvent.aggregate([
      {
        $match: {
          hotelId,
          timestamp: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: '$requestType',
          count: { $sum: 1 },
          avgResponseTime: { $avg: '$responseTimeMs' },
        },
      },
    ]);

    // Get checkout stats
    const checkoutStats = await CheckoutEvent.aggregate([
      {
        $match: {
          hotelId,
          timestamp: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          totalCheckouts: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmountPaise' },
          avgServiceCharges: { $avg: '$serviceChargesPaise' },
        },
      },
    ]);

    // Calculate conversion rate
    const searches = searchStats[0]?.totalSearches || 0;
    const confirmedBookings = bookingStats.find(b => b._id === 'confirmed')?.count || 0;
    const conversionRate = searches > 0 ? (confirmedBookings / searches) * 100 : 0;

    // Calculate revenue
    const totalRevenue = bookingStats.reduce((sum, b) => sum + b.revenue, 0);
    const confirmedRevenue = bookingStats.find(b => b._id === 'confirmed')?.revenue || 0;

    // Get demand forecast from REZ-Intelligence
    let demandForecast: unknown[] = [];
    try {
      demandForecast = await hotelIntelligence.getDemandForecast(
        hotelId,
        start.toISOString().split('T')[0],
        end.toISOString().split('T')[0]
      );
    } catch (e) {
      logger.info('[Analytics] REZ-Intelligence forecast unavailable');
    }

    // Send occupancy signal to REZ-Intelligence
    await hotelIntelligence.sendEvent('hotel:occupancy:updated', {
      hotelId,
      confirmedBookings,
      searchVolume: searches,
      conversionRate,
      period: { start: start.toISOString(), end: end.toISOString() },
    });

    res.json({
      success: true,
      data: {
        period: { start: start.toISOString(), end: end.toISOString() },
        searches: {
          total: searches,
          conversions: confirmedBookings,
          conversionRate: Math.round(conversionRate * 100) / 100,
        },
        bookings: {
          confirmed: bookingStats.find(b => b._id === 'confirmed')?.count || 0,
          cancelled: bookingStats.find(b => b._id === 'cancelled')?.count || 0,
          revenue: confirmedRevenue,
        },
        services: serviceStats.map(s => ({
          type: s._id,
          count: s.count,
          avgResponseTimeMs: Math.round(s.avgResponseTime || 0),
        })),
        checkout: checkoutStats[0] || {
          totalCheckouts: 0,
          totalRevenue: 0,
          avgServiceCharges: 0,
        },
        // REZ-Intelligence Data
        demandForecast,
        intelligence: {
          signalCount: searches + confirmedBookings,
          integratedAt: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('[Analytics] Hotel stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to get analytics' });
  }
});

// ─── User Behavior ──────────────────────────────────────────────────────────

/**
 * GET /api/analytics/user/:userId
 * Get behavior profile for a user
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Get user's booking history
    const bookings = await HotelBookingEvent.find({ userId })
      .sort({ timestamp: -1 })
      .limit(20);

    // Get user's service usage
    const services = await ServiceRequestEvent.find({ userId })
      .sort({ timestamp: -1 })
      .limit(50);

    // Get user's checkout history
    const checkouts = await CheckoutEvent.find({ userId })
      .sort({ timestamp: -1 })
      .limit(10);

    // Calculate lifetime value
    const totalSpend = checkouts.reduce((sum, c) => sum + c.totalAmountPaise, 0);
    const avgOrderValue = checkouts.length > 0 ? totalSpend / checkouts.length : 0;

    // Calculate service preferences
    const serviceCounts: Record<string, number> = {};
    services.forEach(s => {
      serviceCounts[s.requestType] = (serviceCounts[s.requestType] || 0) + 1;
    });

    // Get unified profile from REZ-Intelligence
    let unifiedProfile: unknown = null;
    let segments: string[] = [];
    let ltvPrediction = 0;
    let churnRisk = 0;
    let recommendations: unknown[] = [];

    try {
      const [profile, userSegments, ltv, churn, recs] = await Promise.all([
        hotelIntelligence.getProfile(userId),
        hotelIntelligence.getSegments(userId),
        hotelIntelligence.getLTV(userId),
        hotelIntelligence.getChurnRisk(userId),
        hotelIntelligence.getRecommendations(userId, 5),
      ]);
      unifiedProfile = profile;
      segments = userSegments;
      ltvPrediction = ltv;
      churnRisk = churn;
      recommendations = recs;
    } catch (e) {
      logger.info('[Analytics] REZ-Intelligence profile unavailable');
    }

    // Send checkout signal to REZ-Intelligence
    for (const checkout of checkouts.slice(0, 5)) {
      await hotelIntelligence.sendEvent('hotel:checkout:completed', {
        userId,
        bookingId: checkout.bookingId,
        hotelId: checkout.hotelId,
        totalAmount: checkout.totalAmountPaise,
        paymentStatus: checkout.paymentStatus,
      });
    }

    res.json({
      success: true,
      data: {
        userId,
        totalBookings: bookings.length,
        totalCheckouts: checkouts.length,
        lifetimeValue: totalSpend,
        avgOrderValue: Math.round(avgOrderValue),
        lastBooking: bookings[0]?.timestamp?.toISOString(),
        servicePreferences: serviceCounts,
        recentBookings: bookings.slice(0, 5).map(b => ({
          bookingId: b.bookingId,
          hotelId: b.hotelId,
          amount: b.totalAmountPaise,
          status: b.status,
          date: b.timestamp?.toISOString(),
        })),
        // REZ-Intelligence Data
        unifiedProfile: unifiedProfile ? {
          preferences: unifiedProfile.preferences,
          loyaltyTier: unifiedProfile.loyaltyTier,
          totalSpending: unifiedProfile.totalSpending,
        } : null,
        segments,
        predictions: {
          ltv: ltvPrediction,
          churnRisk,
        },
        recommendations,
      },
    });
  } catch (error) {
    console.error('[Analytics] User stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to get user analytics' });
  }
});

// ─── Room QR Analytics ─────────────────────────────────────────────────────

/**
 * GET /api/analytics/room-qr/:hotelId
 * Get Room QR usage analytics
 */
router.get('/room-qr/:hotelId', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Get QR event stats
    const qrStats = await RoomQREvent.aggregate([
      {
        $match: {
          hotelId,
          timestamp: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amountPaise' },
        },
      },
    ]);

    // Get unique users
    const uniqueUsers = await RoomQREvent.distinct('userId', {
      hotelId,
      timestamp: { $gte: start, $lte: end },
    });

    // Calculate engagement rate
    const generated = qrStats.find(s => s._id === 'generated')?.count || 0;
    const scanned = qrStats.find(s => s._id === 'scanned')?.count || 0;
    const engagementRate = generated > 0 ? (scanned / generated) * 100 : 0;

    // Calculate service usage rate
    const usedService = qrStats.find(s => s._id === 'used_service')?.count || 0;
    const serviceUsageRate = scanned > 0 ? (usedService / scanned) * 100 : 0;

    res.json({
      success: true,
      data: {
        period: { start: start.toISOString(), end: end.toISOString() },
        totalQRsGenerated: generated,
        totalScans: scanned,
        uniqueUsers: uniqueUsers.length,
        engagementRate: Math.round(engagementRate * 100) / 100,
        serviceUsageRate: Math.round(serviceUsageRate * 100) / 100,
        breakdown: qrStats.map(s => ({
          action: s._id,
          count: s.count,
          revenue: s.totalAmount || 0,
        })),
      },
    });
  } catch (error) {
    console.error('[Analytics] Room QR stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to get Room QR analytics' });
  }
});

// ─── Service Metrics ────────────────────────────────────────────────────────

/**
 * GET /api/analytics/services/:hotelId
 * Get service request metrics and SLA
 */
router.get('/services/:hotelId', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Get SLA metrics by service type
    const slaMetrics = await ServiceRequestEvent.aggregate([
      {
        $match: {
          hotelId,
          timestamp: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            requestType: '$requestType',
            status: '$status',
          },
          count: { $sum: 1 },
          avgResponseTime: { $avg: '$responseTimeMs' },
          minResponseTime: { $min: '$responseTimeMs' },
          maxResponseTime: { $max: '$responseTimeMs' },
        },
      },
    ]);

    // Get completion rate
    const completed = slaMetrics.filter(m => m._id.status === 'completed').reduce((sum, m) => sum + m.count, 0);
    const total = slaMetrics.reduce((sum, m) => sum + m.count, 0);
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    // Group by service type
    const serviceTypes: Record<string, unknown> = {};
    slaMetrics.forEach(m => {
      const type = m._id.requestType;
      if (!serviceTypes[type]) {
        serviceTypes[type] = {
          type,
          total: 0,
          completed: 0,
          pending: 0,
          inProgress: 0,
          avgResponseTime: 0,
        };
      }
      serviceTypes[type].total += m.count;
      if (m._id.status === 'completed') serviceTypes[type].completed += m.count;
      if (m._id.status === 'pending') serviceTypes[type].pending += m.count;
      if (m._id.status === 'in_progress') serviceTypes[type].inProgress += m.count;
      serviceTypes[type].avgResponseTime = Math.round(m.avgResponseTime || 0);
    });

    res.json({
      success: true,
      data: {
        period: { start: start.toISOString(), end: end.toISOString() },
        totalRequests: total,
        completedRequests: completed,
        completionRate: Math.round(completionRate * 100) / 100,
        services: Object.values(serviceTypes),
      },
    });
  } catch (error) {
    console.error('[Analytics] Service stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to get service analytics' });
  }
});

// ─── Revenue Analytics ─────────────────────────────────────────────────────

/**
 * GET /api/analytics/revenue/:hotelId
 * Get revenue breakdown and trends
 */
router.get('/revenue/:hotelId', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const { startDate, endDate, granularity = 'day' } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Determine grouping based on granularity (use any type for MongoDB aggregation)
    let dateFormat;
    switch (granularity) {
      case 'week':
        dateFormat = { year: { $year: '$timestamp' }, week: { $week: '$timestamp' } };
        break;
      case 'month':
        dateFormat = { year: { $year: '$timestamp' }, month: { $month: '$timestamp' } };
        break;
      default:
        dateFormat = { year: { $year: '$timestamp' }, month: { $month: '$timestamp' }, day: { $dayOfMonth: '$timestamp' } };
    }

    // Get revenue by day/week/month
    const revenueTrend = await CheckoutEvent.aggregate([
      {
        $match: {
          hotelId,
          paymentStatus: 'completed',
          timestamp: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: dateFormat,
          revenue: { $sum: '$totalAmountPaise' },
          serviceRevenue: { $sum: '$serviceChargesPaise' },
          roomRevenue: { $sum: '$roomChargesPaise' },
          transactions: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    // Calculate totals
    const totalRevenue = revenueTrend.reduce((sum, r) => sum + r.revenue, 0);
    const totalTransactions = revenueTrend.reduce((sum, r) => sum + r.transactions, 0);
    const avgTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    res.json({
      success: true,
      data: {
        period: { start: start.toISOString(), end: end.toISOString() },
        granularity,
        totals: {
          revenue: totalRevenue,
          transactions: totalTransactions,
          avgTransactionValue: Math.round(avgTransactionValue),
        },
        trend: revenueTrend.map(r => ({
          period: r._id,
          revenue: r.revenue,
          serviceRevenue: r.serviceRevenue,
          roomRevenue: r.roomRevenue,
          transactions: r.transactions,
        })),
      },
    });
  } catch (error) {
    console.error('[Analytics] Revenue stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to get revenue analytics' });
  }
});

// ─── Signal Analytics ───────────────────────────────────────────────────────

/**
 * GET /api/analytics/signals/user/:userId
 * Get signals for a specific user
 */
router.get('/signals/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const {
      category,
      signalType,
      hotelId,
      startDate,
      endDate,
      limit = '100',
      skip = '0',
      sortOrder = 'desc'
    } = req.query;

    const signals = await signalCollector.getUserSignals(userId, {
      signalCategory: category as SignalCategory,
      signalType: signalType as unknown,
      hotelId: hotelId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: parseInt(limit as string, 10),
      skip: parseInt(skip as string, 10),
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    res.json({
      success: true,
      data: {
        userId,
        count: signals.length,
        signals: signals.map(s => ({
          id: s._id.toString(),
          signalType: s.signalType,
          signalCategory: s.signalCategory,
          hotelId: s.hotelId,
          data: s.data,
          timestamp: s.timestamp.toISOString(),
          processed: s.processed,
        })),
      },
    });
  } catch (error) {
    console.error('[Analytics] User signals error:', error);
    res.status(500).json({ success: false, message: 'Failed to get user signals' });
  }
});

/**
 * GET /api/analytics/signals/hotel/:hotelId
 * Get signals for a specific hotel
 */
router.get('/signals/hotel/:hotelId', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const {
      category,
      signalType,
      startDate,
      endDate,
      limit = '100',
      skip = '0',
    } = req.query;

    const signals = await signalCollector.getHotelSignals(hotelId, {
      signalCategory: category as SignalCategory,
      signalType: signalType as unknown,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: parseInt(limit as string, 10),
      skip: parseInt(skip as string, 10),
    });

    // Get aggregated counts by type
    const typeCounts: Record<string, number> = {};
    signals.forEach(s => {
      typeCounts[s.signalType] = (typeCounts[s.signalType] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        hotelId,
        count: signals.length,
        byType: typeCounts,
        signals: signals.map(s => ({
          id: s._id.toString(),
          userId: s.userId,
          signalType: s.signalType,
          signalCategory: s.signalCategory,
          data: s.data,
          timestamp: s.timestamp.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error('[Analytics] Hotel signals error:', error);
    res.status(500).json({ success: false, message: 'Failed to get hotel signals' });
  }
});

/**
 * GET /api/analytics/signals/aggregate
 * Get aggregated signals over a time period
 */
router.get('/signals/aggregate', async (req: Request, res: Response) => {
  try {
    const {
      period = 'day',
      hotelId,
      category,
      signalType,
      startDate,
      endDate,
    } = req.query;

    if (!['hour', 'day', 'week', 'month'].includes(period as string)) {
      res.status(400).json({
        success: false,
        message: 'Invalid period. Must be: hour, day, week, or month'
      });
      return;
    }

    const result = await signalCollector.getAggregateSignals(
      period as 'hour' | 'day' | 'week' | 'month',
      {
        hotelId: hotelId as string,
        signalCategory: category as SignalCategory,
        signalType: signalType as unknown,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      }
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[Analytics] Aggregate signals error:', error);
    res.status(500).json({ success: false, message: 'Failed to get aggregate signals' });
  }
});

/**
 * GET /api/analytics/signals/summary
 * Get summary of all signals
 */
router.get('/signals/summary', async (req: Request, res: Response) => {
  try {
    const stats = await signalCollector.getStats();

    res.json({
      success: true,
      data: {
        ...stats,
        categories: Object.entries(stats.byCategory).map(([category, count]) => ({
          category,
          count,
        })),
      },
    });
  } catch (error) {
    console.error('[Analytics] Signal summary error:', error);
    res.status(500).json({ success: false, message: 'Failed to get signal summary' });
  }
});

/**
 * GET /api/analytics/signals/funnel
 * Get conversion funnel from search to booking
 */
router.get('/signals/funnel', async (req: Request, res: Response) => {
  try {
    const { hotelId, startDate, endDate } = req.query;

    const start = startDate
      ? new Date(startDate as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Get signals for funnel analysis
    const signals = hotelId
      ? await signalCollector.getHotelSignals(hotelId as string, {
          startDate: start,
          endDate: end,
        })
      : [];

    // Count funnel stages
    const funnel = {
      searches: 0,
      resultsViewed: 0,
      bookingsStarted: 0,
      bookingsCompleted: 0,
      bookingsAbandoned: 0,
      checkouts: 0,
    };

    signals.forEach(s => {
      switch (s.signalType) {
        case 'search_query':
          funnel.searches++;
          break;
        case 'results_viewed':
          funnel.resultsViewed++;
          break;
        case 'booking_started':
          funnel.bookingsStarted++;
          break;
        case 'booking_completed':
          funnel.bookingsCompleted++;
          break;
        case 'booking_abandoned':
          funnel.bookingsAbandoned++;
          break;
        case 'checkout_initiated':
          funnel.checkouts++;
          break;
      }
    });

    // Calculate conversion rates
    const searchToViewRate = funnel.searches > 0
      ? (funnel.resultsViewed / funnel.searches) * 100
      : 0;
    const viewToStartRate = funnel.resultsViewed > 0
      ? (funnel.bookingsStarted / funnel.resultsViewed) * 100
      : 0;
    const startToCompleteRate = funnel.bookingsStarted > 0
      ? (funnel.bookingsCompleted / funnel.bookingsStarted) * 100
      : 0;
    const startToAbandonRate = funnel.bookingsStarted > 0
      ? (funnel.bookingsAbandoned / funnel.bookingsStarted) * 100
      : 0;

    res.json({
      success: true,
      data: {
        period: { start: start.toISOString(), end: end.toISOString() },
        hotelId: hotelId || 'all',
        funnel,
        conversionRates: {
          searchToView: Math.round(searchToViewRate * 100) / 100,
          viewToStart: Math.round(viewToStartRate * 100) / 100,
          startToComplete: Math.round(startToCompleteRate * 100) / 100,
          startToAbandon: Math.round(startToAbandonRate * 100) / 100,
        },
      },
    });
  } catch (error) {
    console.error('[Analytics] Funnel analysis error:', error);
    res.status(500).json({ success: false, message: 'Failed to get funnel analysis' });
  }
});

export default router;
