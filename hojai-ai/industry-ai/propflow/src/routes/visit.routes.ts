/**
 * PROPFLOW - Real Estate AI Operating System
 * Site Visit Routes
 */

import { Router, Request, Response } from 'express';
import { SiteVisit } from '../models';
import { logger } from '../config/logger';
import { siteVisitAgent } from '../agents';
import {
  authenticate,
  optionalAuth,
  asyncHandler,
  Errors
} from '../middleware';
import { validateBody } from '../middleware/validation';
import {
  createSiteVisitSchema,
  updateSiteVisitSchema,
  z
} from '../schemas/validation';

const router = Router();

// Query schema for filtering
const visitQuerySchema = z.object({
  status: z.enum(['scheduled', 'completed', 'cancelled', 'rescheduled', 'no-show']).optional(),
  leadId: z.string().optional(),
  propertyId: z.string().optional(),
  agentId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['date', 'createdAt', 'time']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
});

/**
 * GET /api/visits
 * Get all site visits with filtering and pagination
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const query = visitQuerySchema.parse(req.query);

    // Build filter
    const filter: any = {};
    if (query.status) filter.status = query.status;
    if (query.leadId) filter.leadId = query.leadId;
    if (query.propertyId) filter.propertyId = query.propertyId;
    if (query.agentId) filter.agentId = query.agentId;
    if (query.startDate || query.endDate) {
      filter.date = {};
      if (query.startDate) filter.date.$gte = new Date(query.startDate);
      if (query.endDate) filter.date.$lte = new Date(query.endDate);
    }

    // Count total
    const total = await SiteVisit.countDocuments(filter);

    // Get paginated results
    const skip = (query.page - 1) * query.limit;
    const visits = await SiteVisit.find(filter)
      .sort({ [query.sortBy]: query.sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(query.limit)
      .populate('leadId', 'name phone email')
      .populate('propertyId', 'title price location')
      .lean();

    res.json({
      success: true,
      visits,
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        pages: Math.ceil(total / query.limit),
        hasNext: query.page * query.limit < total,
        hasPrev: query.page > 1
      }
    });
  })
);

/**
 * GET /api/visits/:id
 * Get single visit by ID
 */
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const visit = await SiteVisit.findById(req.params.id)
      .populate('leadId', 'name phone email')
      .populate('propertyId', 'title price location images')
      .lean();

    if (!visit) {
      throw Errors.notFound('Site Visit');
    }

    res.json({
      success: true,
      visit
    });
  })
);

/**
 * POST /api/visits
 * Create new site visit
 */
router.post(
  '/',
  authenticate,
  validateBody(createSiteVisitSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const visit = await siteVisitAgent.scheduleVisit({
      leadId: req.body.leadId,
      propertyId: req.body.propertyId,
      preferredDates: [new Date(req.body.date)],
      preferredTimes: [req.body.time],
      notes: req.body.notes,
      agentId: req.body.agentId || req.user?.id
    });

    logger.info('Site visit created', { visitId: visit._id, by: req.user?.id });

    res.status(201).json({
      success: true,
      message: 'Site visit scheduled successfully',
      visit
    });
  })
);

/**
 * PATCH /api/visits/:id
 * Update site visit
 */
router.patch(
  '/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const visit = await SiteVisit.findById(req.params.id);
    if (!visit) {
      throw Errors.notFound('Site Visit');
    }

    const updateData = updateSiteVisitSchema.parse(req.body);

    // Handle reschedule
    if (updateData.date || updateData.time) {
      const newDate = updateData.date ? new Date(updateData.date) : visit.date;
      const newTime = updateData.time || visit.time;
      const updatedVisit = await siteVisitAgent.rescheduleVisit(
        req.params.id,
        newDate,
        newTime
      );

      logger.info('Site visit rescheduled', { visitId: req.params.id, by: req.user?.id });

      return res.json({
        success: true,
        message: 'Site visit rescheduled',
        visit: updatedVisit
      });
    }

    // Handle status update
    if (updateData.status === 'completed') {
      const completedVisit = await siteVisitAgent.completeVisit(req.params.id, {
        visitId: req.params.id,
        overallRating: updateData.rating || 4,
        propertyRating: updateData.rating || 4,
        agentRating: updateData.rating || 4,
        comments: updateData.feedback || '',
        nextSteps: 'Follow up for feedback',
        buyerSentiment: 'positive' as const
      });

      return res.json({
        success: true,
        message: 'Site visit marked as completed',
        visit: completedVisit
      });
    }

    // Simple status update
    Object.assign(visit, updateData);
    await visit.save();

    logger.info('Site visit updated', { visitId: req.params.id, by: req.user?.id });

    res.json({
      success: true,
      message: 'Site visit updated successfully',
      visit
    });
  })
);

/**
 * DELETE /api/visits/:id
 * Cancel site visit
 */
router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const reason = req.query.reason as string;
    const visit = await siteVisitAgent.cancelVisit(req.params.id, reason);

    logger.info('Site visit cancelled', { visitId: req.params.id, by: req.user?.id });

    res.json({
      success: true,
      message: 'Site visit cancelled',
      visit
    });
  })
);

/**
 * POST /api/visits/:id/feedback
 * Submit visit feedback
 */
router.post(
  '/:id/feedback',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { overallRating, propertyRating, agentRating, comments, nextSteps, buyerSentiment } = req.body;

    await siteVisitAgent.processFeedback(req.params.id, {
      visitId: req.params.id,
      overallRating,
      propertyRating,
      agentRating,
      comments,
      nextSteps,
      buyerSentiment
    });

    const visit = await SiteVisit.findById(req.params.id);

    logger.info('Visit feedback submitted', { visitId: req.params.id, rating: overallRating });

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      visit
    });
  })
);

/**
 * GET /api/visits/slots/available
 * Get available time slots for scheduling
 */
router.get(
  '/slots/available',
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
      slots: slots.optimalSlots,
      warnings: slots.conflictWarnings
    });
  })
);

/**
 * GET /api/visits/today
 * Get today's visits
 */
router.get(
  '/today',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const agentId = req.query.agentId as string;
    const visits = await siteVisitAgent.getTodayVisits(agentId);

    res.json({
      success: true,
      visits,
      count: visits.length,
      date: new Date().toISOString().split('T')[0]
    });
  })
);

/**
 * GET /api/visits/upcoming/:leadId
 * Get upcoming visits for a lead
 */
router.get(
  '/upcoming/:leadId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const visits = await siteVisitAgent.getLeadUpcomingVisits(req.params.leadId);

    res.json({
      success: true,
      visits,
      count: visits.length
    });
  })
);

/**
 * GET /api/visits/analytics
 * Get visit analytics
 */
router.get(
  '/analytics',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    const analytics = await siteVisitAgent.getVisitAnalytics(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json({
      success: true,
      analytics
    });
  })
);

/**
 * POST /api/visits/:id/confirm
 * Confirm a site visit
 */
router.post(
  '/:id/confirm',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const visit = await SiteVisit.findByIdAndUpdate(
      req.params.id,
      { confirmedAt: new Date() },
      { new: true }
    );

    if (!visit) {
      throw Errors.notFound('Site Visit');
    }

    logger.info('Site visit confirmed', { visitId: req.params.id });

    res.json({
      success: true,
      message: 'Site visit confirmed',
      visit
    });
  })
);

export default router;