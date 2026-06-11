/**
 * PROPFLOW - Real Estate AI Operating System
 * AI Routes - AI Employee Endpoints
 */

import { Router, Request, Response } from 'express';
import { propertyAgent, leadAgent, siteVisitAgent } from '../agents';
import { logger } from '../config/logger';
import {
  authenticate,
  optionalAuth,
  aiLimiter,
  asyncHandler,
  Errors
} from '../middleware';
import { validateBody } from '../middleware/validation';
import {
  propertyMatchRequestSchema,
  leadQualifyRequestSchema,
  visitScheduleRequestSchema
} from '../schemas/validation';

const router = Router();

/**
 * GET /ai/status
 * Get AI system status
 */
router.get(
  '/status',
  asyncHandler(async (req: Request, res: Response) => {
    res.json({
      success: true,
      status: 'operational',
      version: '1.0.0',
      aiEmployees: [
        {
          name: 'Property Agent',
          role: 'Property matching and recommendations',
          status: 'active',
          capabilities: ['property-match', 'market-analysis', 'property-compare', 'similar-properties']
        },
        {
          name: 'Lead Agent',
          role: 'Lead qualification and nurturing',
          status: 'active',
          capabilities: ['lead-qualify', 'lead-segmentation', 'nurturing', 'follow-up-scheduler']
        },
        {
          name: 'Site Visit Agent',
          role: 'Visit scheduling and coordination',
          status: 'active',
          capabilities: ['schedule-visit', 'find-slots', 'reminders', 'visit-analytics']
        }
      ],
      features: {
        propertyMatching: true,
        leadQualification: true,
        visitScheduling: true,
        marketAnalysis: true,
        recommendations: true
      },
      timestamp: new Date().toISOString()
    });
  })
);

/**
 * POST /api/ai/property/match
 * Find matching properties for a buyer
 */
router.post(
  '/property/match',
  aiLimiter,
  optionalAuth,
  validateBody(propertyMatchRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const matches = await propertyAgent.findMatchingProperties(req.body);

    logger.info('AI: Property matching completed', {
      requester: (req as any).user?.id || 'anonymous',
      matchesFound: matches.length,
      duration: `${Date.now() - startTime}ms`
    });

    res.json({
      success: true,
      message: `Found ${matches.length} matching properties`,
      matchCount: matches.length,
      matches,
      metadata: {
        requestId: req.headers['x-request-id'],
        processingTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    });
  })
);

/**
 * POST /api/ai/property/compare
 * Compare multiple properties
 */
router.post(
  '/property/compare',
  aiLimiter,
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { propertyIds } = req.body;

    if (!propertyIds || !Array.isArray(propertyIds) || propertyIds.length < 2) {
      throw Errors.badRequest('At least 2 property IDs required for comparison');
    }

    const comparison = await propertyAgent.compareProperties(propertyIds);

    logger.info('AI: Property comparison completed', {
      propertyCount: propertyIds.length
    });

    res.json({
      success: true,
      comparison
    });
  })
);

/**
 * GET /api/ai/property/market-analysis
 * Get market analysis for an area
 */
router.get(
  '/property/market-analysis',
  aiLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { location, propertyType } = req.query;

    const analysis = await propertyAgent.getMarketAnalysis(
      location as string | undefined,
      propertyType as string | undefined
    );

    res.json({
      success: true,
      analysis
    });
  })
);

/**
 * POST /api/ai/lead/qualify
 * Qualify a lead
 */
router.post(
  '/lead/qualify',
  aiLimiter,
  authenticate,
  validateBody(leadQualifyRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { leadId } = req.body;

    const qualification = await leadAgent.qualifyLead(leadId);

    logger.info('AI: Lead qualification completed', {
      leadId,
      score: qualification.score,
      tier: qualification.tier,
      duration: `${Date.now() - startTime}ms`
    });

    res.json({
      success: true,
      message: 'Lead qualified successfully',
      qualification,
      metadata: {
        requestId: req.headers['x-request-id'],
        processingTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    });
  })
);

/**
 * POST /api/ai/lead/bulk-qualify
 * Bulk qualify multiple leads
 */
router.post(
  '/lead/bulk-qualify',
  aiLimiter,
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { leadIds } = req.body;

    if (!leadIds || !Array.isArray(leadIds)) {
      throw Errors.badRequest('Lead IDs array required');
    }

    const results = await leadAgent.bulkQualify(leadIds);

    const summary = {
      total: results.length,
      hot: results.filter(r => r.tier === 'hot').length,
      warm: results.filter(r => r.tier === 'warm').length,
      cold: results.filter(r => r.tier === 'cold').length,
      avgScore: Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
    };

    logger.info('AI: Bulk lead qualification completed', summary);

    res.json({
      success: true,
      message: `${results.length} leads qualified`,
      summary,
      qualifications: results
    });
  })
);

/**
 * GET /api/ai/lead/segmentation
 * Get lead segmentation
 */
router.get(
  '/lead/segmentation',
  aiLimiter,
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const segmentation = await leadAgent.segmentLeads();

    res.json({
      success: true,
      segmentation
    });
  })
);

/**
 * GET /api/ai/lead/nurturing/:leadId
 * Get nurturing recommendations for a lead
 */
router.get(
  '/lead/nurturing/:leadId',
  aiLimiter,
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const nurturing = await leadAgent.getNurturingRecommendations(req.params.leadId);

    res.json({
      success: true,
      nurturing
    });
  })
);

/**
 * POST /api/ai/visit/schedule
 * Schedule a site visit
 */
router.post(
  '/visit/schedule',
  aiLimiter,
  authenticate,
  validateBody(visitScheduleRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { leadId, propertyId, preferredDates, preferredTimes, notes } = req.body;

    const visit = await siteVisitAgent.scheduleVisit({
      leadId,
      propertyId,
      preferredDates: preferredDates.map((d: string) => new Date(d)),
      preferredTimes,
      notes,
      agentId: (req as any).user?.id
    });

    logger.info('AI: Site visit scheduled', {
      visitId: visit._id,
      leadId,
      propertyId,
      duration: `${Date.now() - startTime}ms`
    });

    res.status(201).json({
      success: true,
      message: 'Site visit scheduled successfully',
      visit,
      metadata: {
        requestId: req.headers['x-request-id'],
        processingTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    });
  })
);

/**
 * GET /api/ai/visit/slots
 * Find available visit slots
 */
router.get(
  '/visit/slots',
  aiLimiter,
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { propertyId, leadId, dates } = req.query;

    if (!propertyId || !leadId || !dates) {
      throw Errors.badRequest('propertyId, leadId, and dates are required');
    }

    const slots = await siteVisitAgent.findOptimalSlots({
      propertyId: propertyId as string,
      leadId: leadId as string,
      preferredDates: (dates as string).split(',').map(d => new Date(d))
    });

    res.json({
      success: true,
      ...slots
    });
  })
);

/**
 * GET /api/ai/visit/reminders
 * Generate visit reminders
 */
router.get(
  '/visit/reminders',
  aiLimiter,
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const reminders = await siteVisitAgent.generateReminders();

    res.json({
      success: true,
      reminders,
      count: reminders.length
    });
  })
);

/**
 * GET /api/ai/visit/optimize/:date
 * Optimize schedule for a specific date
 */
router.get(
  '/visit/optimize/:date',
  aiLimiter,
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { agentId } = req.query;
    const date = new Date(req.params.date);

    const optimization = await siteVisitAgent.optimizeDaySchedule(
      date,
      agentId as string | undefined
    );

    res.json({
      success: true,
      optimization
    });
  })
);

/**
 * POST /api/ai/recommendations/property/:leadId
 * Get property recommendations for a lead
 */
router.get(
  '/recommendations/property/:leadId',
  aiLimiter,
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { limit } = req.query;
    const recommendations = await propertyAgent.getRecommendationsForLead(req.params.leadId);

    const limited = limit
      ? recommendations.slice(0, parseInt(limit as string, 10))
      : recommendations;

    res.json({
      success: true,
      count: limited.length,
      recommendations: limited
    });
  })
);

export default router;