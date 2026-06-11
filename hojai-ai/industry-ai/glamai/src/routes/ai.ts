/**
 * GLAMAI - AI Routes
 * Salon AI Operating System
 *
 * Routes for AI Employee interactions.
 */

import { Router, Request, Response } from 'express';
import { authMiddleware, optionalAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { AI_EMPLOYEES } from '../config';
import { logger } from '../middleware/logger';
import beautyAdvisor from '../services/beautyAdvisor';
import appointmentManager from '../services/appointmentManager';
import campaignAgent from '../services/campaignAgent';
import retentionAgent from '../services/retentionAgent';

const router = Router();

// ============================================
// AI STATUS
// ============================================

/**
 * GET /ai/status
 * Get AI employee status
 */
router.get('/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    active: true,
    aiEmployees: 4,
    employees: [
      {
        id: AI_EMPLOYEES.BEAUTY_ADVISOR.id,
        name: AI_EMPLOYEES.BEAUTY_ADVISOR.name,
        role: AI_EMPLOYEES.BEAUTY_ADVISOR.description,
        status: 'operational',
        capabilities: AI_EMPLOYEES.BEAUTY_ADVISOR.capabilities,
      },
      {
        id: AI_EMPLOYEES.APPOINTMENT_MANAGER.id,
        name: AI_EMPLOYEES.APPOINTMENT_MANAGER.name,
        role: AI_EMPLOYEES.APPOINTMENT_MANAGER.description,
        status: 'operational',
        capabilities: AI_EMPLOYEES.APPOINTMENT_MANAGER.capabilities,
      },
      {
        id: AI_EMPLOYEES.CAMPAIGN_AGENT.id,
        name: AI_EMPLOYEES.CAMPAIGN_AGENT.name,
        role: AI_EMPLOYEES.CAMPAIGN_AGENT.description,
        status: 'operational',
        capabilities: AI_EMPLOYEES.CAMPAIGN_AGENT.capabilities,
      },
      {
        id: AI_EMPLOYEES.RETENTION_AGENT.id,
        name: AI_EMPLOYEES.RETENTION_AGENT.name,
        role: AI_EMPLOYEES.RETENTION_AGENT.description,
        status: 'operational',
        capabilities: AI_EMPLOYEES.RETENTION_AGENT.capabilities,
      },
    ],
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// BEAUTY ADVISOR
// ============================================

/**
 * POST /api/ai/beauty-advisor/recommend
 * Get service recommendations
 */
router.post(
  '/beauty-advisor/recommend',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { customerId, budget, occasion, preferences, serviceCategory } = req.body;

    logger.info('Beauty Advisor: Recommendation request', {
      customerId,
      occasion,
      budget,
    });

    const result = await beautyAdvisor.getRecommendations({
      customerId,
      budget,
      occasion,
      preferences,
      serviceCategory,
    });

    res.json(result);
  })
);

/**
 * GET /api/ai/beauty-advisor/trending
 * Get trending services
 */
router.get(
  '/beauty-advisor/trending',
  asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 5;
    const trending = await beautyAdvisor.getTrendingServices(limit);

    res.json({
      success: true,
      services: trending,
      timestamp: new Date().toISOString(),
    });
  })
);

// ============================================
// APPOINTMENT MANAGER
// ============================================

/**
 * POST /api/ai/appointment/schedule
 * Schedule an appointment
 */
router.post(
  '/appointment/schedule',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { customerId, serviceId, stylistId, date, time, notes } = req.body;

    logger.info('Appointment Manager: Scheduling request', {
      customerId,
      serviceId,
      date,
      time,
    });

    const { appointment, response } = await appointmentManager.scheduleAppointment({
      customerId,
      serviceId,
      stylistId,
      date,
      time,
      notes,
    });

    res.json({
      success: true,
      message: 'Appointment scheduled successfully!',
      appointment: response,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * POST /api/ai/appointment/reschedule
 * Reschedule an appointment
 */
router.post(
  '/appointment/reschedule',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { appointmentId, newDate, newTime } = req.body;

    const result = await appointmentManager.rescheduleAppointment({
      appointmentId,
      newDate,
      newTime,
    });

    res.json({
      success: true,
      message: `Appointment rescheduled to ${newDate} at ${newTime}`,
      appointment: {
        id: result.appointment._id,
        newDate,
        newTime,
        service: result.service,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * POST /api/ai/appointment/cancel
 * Cancel an appointment
 */
router.post(
  '/appointment/cancel',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { appointmentId, reason } = req.body;

    await appointmentManager.cancelAppointment({ appointmentId, reason });

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/ai/appointment/slots
 * Get available time slots
 */
router.get(
  '/appointment/slots',
  asyncHandler(async (req: Request, res: Response) => {
    const { date, serviceId, stylistId } = req.query;

    if (!date || !serviceId) {
      return res.status(400).json({
        success: false,
        error: 'date and serviceId are required',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString(),
      });
    }

    const slots = await appointmentManager.getAvailableSlots({
      date: date as string,
      serviceId: serviceId as string,
      stylistId: stylistId as string,
    });

    res.json({
      success: true,
      date,
      serviceId,
      stylistId: stylistId || null,
      slots,
      timestamp: new Date().toISOString(),
    });
  })
);

// ============================================
// CAMPAIGN AGENT
// ============================================

/**
 * POST /api/ai/campaign/create
 * Create a new campaign
 */
router.post(
  '/campaign/create',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { type, targetSegment, discount, customMessage, duration } = req.body;

    logger.info('Campaign Agent: Creating campaign', { type, targetSegment });

    const { campaign, response } = await campaignAgent.createCampaign({
      type,
      targetSegment,
      discount,
      customMessage,
      duration,
    });

    const insights = campaignAgent.getCampaignInsights(type);

    res.json({
      success: true,
      message: `Campaign "${campaign.subject}" created successfully!`,
      campaign: response,
      aiInsights: {
        recommendedTiming: insights.recommendedTiming,
        expectedResponse: insights.expectedResponse,
        topServices: insights.topServices,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/ai/campaign/active
 * Get active campaigns
 */
router.get(
  '/campaign/active',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const campaigns = await campaignAgent.getActiveCampaigns();

    res.json({
      success: true,
      campaigns,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/ai/campaign/:id/analytics
 * Get campaign analytics
 */
router.get(
  '/campaign/:id/analytics',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const analytics = await campaignAgent.getCampaignAnalytics(req.params.id);

    res.json({
      success: true,
      analytics,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * POST /api/ai/campaign/:id/send
 * Send campaign to target customers
 */
router.post(
  '/campaign/:id/send',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { limit = 100 } = req.query;
    const campaignId = req.params.id;

    // Get campaign
    const campaigns = await campaignAgent.getActiveCampaigns();
    const campaign = campaigns.find((c: any) => c._id.toString() === campaignId);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found',
        code: 'CAMPAIGN_NOT_FOUND',
        timestamp: new Date().toISOString(),
      });
    }

    // Get target customers
    const customers = await campaignAgent.getTargetCustomers(
      campaign.targetSegment,
      parseInt(limit as string)
    );

    // In production, this would integrate with notification service
    // For now, just update sent count
    await campaignAgent.incrementSentCount(campaignId);

    res.json({
      success: true,
      message: `Campaign sent to ${customers.length} customers`,
      sentCount: customers.length,
      campaignId,
      timestamp: new Date().toISOString(),
    });
  })
);

// ============================================
// RETENTION AGENT
// ============================================

/**
 * POST /api/ai/retention/analyze
 * Analyze customer retention risk
 */
router.post(
  '/retention/analyze',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { customerId } = req.body;

    logger.info('Retention Agent: Analyzing customer', { customerId });

    const result = await retentionAgent.analyzeRetentionRisk(customerId);

    res.json({
      success: true,
      customer: result.customer,
      analysis: result.analysis,
      recommendations: result.recommendations,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/ai/retention/at-risk
 * Get at-risk customers
 */
router.get(
  '/retention/at-risk',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const customers = await retentionAgent.getAtRiskCustomers();

    res.json({
      success: true,
      count: customers.length,
      customers: customers.map(c => ({
        id: c._id,
        name: c.name,
        phone: c.phone,
        lastVisit: c.lastVisit,
        loyaltyTier: c.loyaltyTier,
        riskLevel: c.analysis.riskLevel,
        riskScore: c.analysis.riskScore,
      })),
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/ai/retention/stats
 * Get retention statistics
 */
router.get(
  '/retention/stats',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const stats = await retentionAgent.getRetentionStats();

    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * POST /api/ai/retention/re-engagement
 * Send re-engagement campaign
 */
router.post(
  '/retention/re-engagement',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await retentionAgent.sendReEngagementCampaign();

    res.json({
      success: true,
      message: `Re-engagement campaign sent to ${result.sentCount} customers`,
      sentCount: result.sentCount,
      campaignId: result.campaignId,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/ai/retention/upgrade-eligible
 * Get customers eligible for loyalty upgrade
 */
router.get(
  '/retention/upgrade-eligible',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const customers = await retentionAgent.getEligibleForUpgrade();

    res.json({
      success: true,
      count: customers.length,
      customers: customers.map(c => ({
        id: c._id,
        name: c.name,
        phone: c.phone,
        currentTier: c.loyaltyTier,
        totalSpent: c.totalSpent,
        visits: c.visits,
      })),
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;