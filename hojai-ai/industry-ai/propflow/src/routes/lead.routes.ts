/**
 * PROPFLOW - Real Estate AI Operating System
 * Lead Routes
 */

import { Router, Request, Response } from 'express';
import { Lead } from '../models';
import { logger } from '../config/logger';
import { leadAgent } from '../agents';
import {
  authenticate,
  optionalAuth,
  asyncHandler,
  Errors
} from '../middleware';
import { validateBody } from '../middleware/validation';
import {
  createLeadSchema,
  updateLeadSchema,
  z
} from '../schemas/validation';
import { triggerWebhook, syncToHOJAI } from '../utils/webhook';

const router = Router();

// Query schema for filtering
const leadQuerySchema = z.object({
  status: z.enum(['new', 'contacted', 'qualified', 'visiting', 'negotiating', 'closed-won', 'closed-lost']).optional(),
  source: z.enum(['website', 'phone', 'walkin', 'referral', 'agent', 'social', 'advertisement']).optional(),
  tier: z.enum(['hot', 'warm', 'cold']).optional(),
  assignedAgentId: z.string().optional(),
  minScore: z.coerce.number().min(0).max(100).optional(),
  maxScore: z.coerce.number().min(0).max(100).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'score', 'name', 'lastContact']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

/**
 * GET /api/leads
 * Get all leads with filtering and pagination
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const query = leadQuerySchema.parse(req.query);

    // Build filter
    const filter: any = {};
    if (query.status) filter.status = query.status;
    if (query.source) filter.source = query.source;
    if (query.tier) filter.scoreTier = query.tier;
    if (query.assignedAgentId) filter.assignedAgentId = query.assignedAgentId;
    if (query.minScore || query.maxScore) {
      filter.score = {};
      if (query.minScore) filter.score.$gte = query.minScore;
      if (query.maxScore) filter.score.$lte = query.maxScore;
    }

    // Count total
    const total = await Lead.countDocuments(filter);

    // Get paginated results
    const skip = (query.page - 1) * query.limit;
    const leads = await Lead.find(filter)
      .sort({ [query.sortBy]: query.sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(query.limit)
      .populate('propertyInterests', 'title price')
      .lean();

    res.json({
      success: true,
      leads,
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
 * GET /api/leads/:id
 * Get single lead by ID
 */
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const lead = await Lead.findById(req.params.id)
      .populate('propertyInterests', 'title price location')
      .lean();

    if (!lead) {
      throw Errors.notFound('Lead');
    }

    res.json({
      success: true,
      lead
    });
  })
);

/**
 * POST /api/leads
 * Create new lead
 */
router.post(
  '/',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const leadData = createLeadSchema.parse(req.body);

    const lead = await Lead.create({
      ...leadData,
      status: 'new',
      score: 50,
      scoreTier: 'warm'
    });

    // Auto-qualify lead
    try {
      await leadAgent.qualifyLead(lead._id.toString());
    } catch (error) {
      logger.warn('Auto-qualification failed', { leadId: lead._id });
    }

    logger.info('Lead created', { leadId: lead._id, source: lead.source });

    // Trigger webhook and sync to HOJAI
    await triggerWebhook('propflow.lead.created', { leadId: lead._id.toString(), name: lead.name, source: lead.source, score: lead.score });
    await syncToHOJAI('lead', 'created', { leadId: lead._id.toString(), name: lead.name, source: lead.source, score: lead.score });

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      lead
    });
  })
);

/**
 * POST /api/leads/bulk
 * Create multiple leads
 */
router.post(
  '/bulk',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { leads } = req.body;

    if (!Array.isArray(leads) || leads.length === 0) {
      throw Errors.badRequest('Leads array required');
    }

    const createdLeads = await Lead.insertMany(leads, { ordered: false });

    logger.info('Bulk leads created', { count: createdLeads.length, by: req.user?.id });

    res.status(201).json({
      success: true,
      message: `${createdLeads.length} leads created`,
      leads: createdLeads
    });
  })
);

/**
 * PATCH /api/leads/:id
 * Update lead
 */
router.patch(
  '/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      throw Errors.notFound('Lead');
    }

    const updateData = updateLeadSchema.parse(req.body);
    Object.assign(lead, updateData);
    await lead.save();

    logger.info('Lead updated', { leadId: lead._id, by: req.user?.id });

    res.json({
      success: true,
      message: 'Lead updated successfully',
      lead
    });
  })
);

/**
 * DELETE /api/leads/:id
 * Delete lead
 */
router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) {
      throw Errors.notFound('Lead');
    }

    logger.info('Lead deleted', { leadId: req.params.id, by: req.user?.id });

    res.json({
      success: true,
      message: 'Lead deleted successfully'
    });
  })
);

/**
 * POST /api/leads/:id/qualify
 * Manually trigger lead qualification
 */
router.post(
  '/:id/qualify',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const qualification = await leadAgent.qualifyLead(req.params.id);

    logger.info('Lead qualified manually', { leadId: req.params.id, score: qualification.score });

    res.json({
      success: true,
      message: 'Lead qualified successfully',
      qualification
    });
  })
);

/**
 * GET /api/leads/stats/summary
 * Get lead statistics
 */
router.get(
  '/stats/summary',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const [
      total,
      hotLeads,
      warmLeads,
      coldLeads,
      newLeads,
      qualifiedLeads,
      closedWon
    ] = await Promise.all([
      Lead.countDocuments(),
      Lead.countDocuments({ scoreTier: 'hot' }),
      Lead.countDocuments({ scoreTier: 'warm' }),
      Lead.countDocuments({ scoreTier: 'cold' }),
      Lead.countDocuments({ status: 'new' }),
      Lead.countDocuments({ status: 'qualified' }),
      Lead.countDocuments({ status: 'closed-won' })
    ]);

    res.json({
      success: true,
      stats: {
        total,
        hotLeads,
        warmLeads,
        coldLeads,
        newLeads,
        qualifiedLeads,
        closedWon,
        conversionRate: total > 0 ? ((closedWon / total) * 100).toFixed(2) + '%' : '0%'
      }
    });
  })
);

/**
 * GET /api/leads/segmentation
 * Get lead segmentation
 */
router.get(
  '/segmentation',
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
 * GET /api/leads/follow-up
 * Get leads due for follow-up
 */
router.get(
  '/follow-up',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const leads = await leadAgent.getLeadsForFollowUp();

    res.json({
      success: true,
      leads,
      count: leads.length
    });
  })
);

/**
 * POST /api/leads/:id/assign
 * Assign lead to an agent
 */
router.post(
  '/:id/assign',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { agentId } = req.body;
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { assignedAgentId: agentId },
      { new: true }
    );

    if (!lead) {
      throw Errors.notFound('Lead');
    }

    logger.info('Lead assigned', { leadId: req.params.id, agentId, by: req.user?.id });

    res.json({
      success: true,
      message: 'Lead assigned successfully',
      lead
    });
  })
);

/**
 * POST /api/leads/:id/note
 * Add note to lead
 */
router.post(
  '/:id/note',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { note } = req.body;
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      throw Errors.notFound('Lead');
    }

    lead.notes.push(note);
    lead.lastContact = new Date();
    await lead.save();

    logger.info('Note added to lead', { leadId: req.params.id, by: req.user?.id });

    res.json({
      success: true,
      message: 'Note added successfully',
      lead
    });
  })
);

export default router;