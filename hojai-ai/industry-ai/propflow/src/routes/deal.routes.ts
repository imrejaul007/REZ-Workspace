/**
 * PROPFLOW - Real Estate AI Operating System
 * Deal Routes
 */

import { Router, Request, Response } from 'express';
import { Deal, Property, Lead } from '../models';
import { logger } from '../config/logger';
import {
  authenticate,
  asyncHandler,
  Errors
} from '../middleware';
import { validateBody } from '../middleware/validation';
import { createDealSchema, updateDealStageSchema, z } from '../schemas/validation';

const router = Router();

// Query schema for filtering
const dealQuerySchema = z.object({
  status: z.enum(['negotiating', 'accepted', 'documents', 'registered', 'closed']).optional(),
  leadId: z.string().optional(),
  propertyId: z.string().optional(),
  agentId: z.string().optional(),
  minProbability: z.coerce.number().min(0).max(100).optional(),
  maxProbability: z.coerce.number().min(0).max(100).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'offerPrice', 'probability', 'closedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

/**
 * GET /api/deals
 * Get all deals with filtering and pagination
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const query = dealQuerySchema.parse(req.query);

    // Build filter
    const filter: any = {};
    if (query.status) filter.status = query.status;
    if (query.leadId) filter.leadId = query.leadId;
    if (query.propertyId) filter.propertyId = query.propertyId;
    if (query.agentId) filter.agentId = query.agentId;
    if (query.minProbability || query.maxProbability) {
      filter.probability = {};
      if (query.minProbability) filter.probability.$gte = query.minProbability;
      if (query.maxProbability) filter.probability.$lte = query.maxProbability;
    }

    // Count total
    const total = await Deal.countDocuments(filter);

    // Get paginated results
    const skip = (query.page - 1) * query.limit;
    const deals = await Deal.find(filter)
      .sort({ [query.sortBy]: query.sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(query.limit)
      .populate('leadId', 'name phone email score')
      .populate('propertyId', 'title price location images')
      .lean();

    res.json({
      success: true,
      deals,
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
 * GET /api/deals/:id
 * Get single deal by ID
 */
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const deal = await Deal.findById(req.params.id)
      .populate('leadId', 'name phone email score budget')
      .populate('propertyId', 'title price location images amenities')
      .lean();

    if (!deal) {
      throw Errors.notFound('Deal');
    }

    res.json({
      success: true,
      deal
    });
  })
);

/**
 * POST /api/deals
 * Create new deal
 */
router.post(
  '/',
  authenticate,
  validateBody(createDealSchema),
  asyncHandler(async (req: Request, res: Response) => {
    // Verify property and lead exist
    const [property, lead] = await Promise.all([
      Property.findById(req.body.propertyId),
      Lead.findById(req.body.leadId)
    ]);

    if (!property) {
      throw Errors.notFound('Property');
    }
    if (!lead) {
      throw Errors.notFound('Lead');
    }

    // Check for existing deal
    const existingDeal = await Deal.findOne({
      propertyId: req.body.propertyId,
      leadId: req.body.leadId,
      status: { $nin: ['closed'] }
    });

    if (existingDeal) {
      throw Errors.conflict('A deal already exists for this property and lead');
    }

    // Calculate probability based on stage
    const stageProbabilities: Record<string, number> = {
      negotiating: 30,
      accepted: 60,
      documents: 80,
      registered: 95,
      closed: 100
    };

    const deal = await Deal.create({
      ...req.body,
      agentId: req.body.agentId || req.user?.id,
      probability: stageProbabilities[req.body.stage || 'negotiating'] || 30
    });

    // Update lead status to negotiating
    await Lead.findByIdAndUpdate(req.body.leadId, { status: 'negotiating' });

    logger.info('Deal created', { dealId: deal._id, propertyId: deal.propertyId, leadId: deal.leadId });

    res.status(201).json({
      success: true,
      message: 'Deal created successfully',
      deal
    });
  })
);

/**
 * PATCH /api/deals/:id
 * Update deal
 */
router.patch(
  '/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const deal = await Deal.findById(req.params.id);
    if (!deal) {
      throw Errors.notFound('Deal');
    }

    const updateData = req.body;
    Object.assign(deal, updateData);
    await deal.save();

    logger.info('Deal updated', { dealId: deal._id, by: req.user?.id });

    res.json({
      success: true,
      message: 'Deal updated successfully',
      deal
    });
  })
);

/**
 * PATCH /api/deals/:id/stage
 * Update deal stage
 */
router.patch(
  '/:id/stage',
  authenticate,
  validateBody(updateDealStageSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const deal = await Deal.findById(req.params.id);
    if (!deal) {
      throw Errors.notFound('Deal');
    }

    const { stage, notes, closeReason } = req.body;

    // Stage transition probabilities
    const stageProbabilities: Record<string, number> = {
      negotiating: 30,
      accepted: 60,
      documents: 80,
      registered: 95,
      closed: 100
    };

    const previousStage = deal.stage;
    deal.stage = stage;
    deal.status = stage;
    deal.probability = stageProbabilities[stage] || deal.probability;

    if (notes) {
      deal.notes.push(notes);
    }

    // Handle closing
    if (stage === 'closed') {
      deal.closedAt = new Date();
      if (closeReason) deal.closeReason = closeReason;

      // Update property status to sold
      await Property.findByIdAndUpdate(deal.propertyId, { status: 'sold' });

      // Update lead status
      const lead = await Lead.findById(deal.leadId);
      await Lead.findByIdAndUpdate(deal.leadId, {
        status: closeReason === 'lost' ? 'closed-lost' : 'closed-won'
      });

      // Calculate commission (assuming 1% of deal value)
      deal.commission = deal.offerPrice * 0.01;
    }

    await deal.save();

    logger.info('Deal stage updated', {
      dealId: deal._id,
      from: previousStage,
      to: stage,
      by: req.user?.id
    });

    res.json({
      success: true,
      message: `Deal moved to ${stage} stage`,
      deal
    });
  })
);

/**
 * DELETE /api/deals/:id
 * Delete/Cancel deal
 */
router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const deal = await Deal.findById(req.params.id);
    if (!deal) {
      throw Errors.notFound('Deal');
    }

    // Mark as closed with lost reason
    deal.status = 'closed';
    deal.closeReason = 'cancelled';
    deal.closedAt = new Date();
    deal.probability = 0;
    await deal.save();

    logger.info('Deal cancelled', { dealId: deal._id, by: req.user?.id });

    res.json({
      success: true,
      message: 'Deal cancelled'
    });
  })
);

/**
 * GET /api/deals/stats/summary
 * Get deal statistics
 */
router.get(
  '/stats/summary',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const [
      total,
      negotiating,
      accepted,
      documents,
      registered,
      closed
    ] = await Promise.all([
      Deal.countDocuments(),
      Deal.countDocuments({ stage: 'negotiating' }),
      Deal.countDocuments({ stage: 'accepted' }),
      Deal.countDocuments({ stage: 'documents' }),
      Deal.countDocuments({ stage: 'registered' }),
      Deal.countDocuments({ stage: 'closed' })
    ]);

    // Calculate values
    const pipelineValue = await Deal.aggregate([
      { $match: { stage: { $nin: ['closed'] } } },
      { $group: { _id: null, total: { $sum: '$offerPrice' } } }
    ]);

    const closedValue = await Deal.aggregate([
      { $match: { stage: 'closed', closedAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) } } },
      { $group: { _id: null, total: { $sum: '$offerPrice' } } }
    ]);

    const totalCommission = await Deal.aggregate([
      { $match: { stage: 'closed' } },
      { $group: { _id: null, total: { $sum: '$commission' } } }
    ]);

    res.json({
      success: true,
      stats: {
        total,
        byStage: { negotiating, accepted, documents, registered, closed },
        pipelineValue: pipelineValue[0]?.total || 0,
        closedValueThisMonth: closedValue[0]?.total || 0,
        totalCommission: totalCommission[0]?.total || 0
      }
    });
  })
);

/**
 * GET /api/deals/pipeline
 * Get deal pipeline view
 */
router.get(
  '/pipeline',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const stages = ['negotiating', 'accepted', 'documents', 'registered', 'closed'];

    const pipeline = await Promise.all(
      stages.map(async (stage) => {
        const deals = await Deal.find({ stage })
          .populate('leadId', 'name score')
          .populate('propertyId', 'title price')
          .lean();

        const totalValue = deals.reduce((sum, d) => sum + d.offerPrice, 0);
        const avgProbability = deals.length > 0
          ? deals.reduce((sum, d) => sum + d.probability, 0) / deals.length
          : 0;

        return {
          stage,
          count: deals.length,
          value: totalValue,
          avgProbability: Math.round(avgProbability),
          deals: deals.map(d => ({
            _id: d._id,
            lead: d.leadId,
            property: d.propertyId,
            offerPrice: d.offerPrice,
            probability: d.probability,
            expectedCloseDate: d.expectedCloseDate
          }))
        };
      })
    );

    const totalPipelineValue = pipeline
      .filter(s => s.stage !== 'closed')
      .reduce((sum, s) => sum + s.value, 0);

    res.json({
      success: true,
      pipeline,
      summary: {
        totalValue: totalPipelineValue,
        totalDeals: pipeline.reduce((sum, s) => sum + s.count, 0),
        closedDeals: pipeline.find(s => s.stage === 'closed')?.count || 0
      }
    });
  })
);

/**
 * GET /api/deals/agent/:agentId
 * Get deals for a specific agent
 */
router.get(
  '/agent/:agentId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const deals = await Deal.find({ agentId: req.params.agentId })
      .populate('leadId', 'name phone email')
      .populate('propertyId', 'title price location')
      .sort({ createdAt: -1 })
      .lean();

    const totalValue = deals
      .filter(d => d.stage !== 'closed')
      .reduce((sum, d) => sum + d.offerPrice, 0);

    res.json({
      success: true,
      agentId: req.params.agentId,
      deals,
      stats: {
        totalDeals: deals.length,
        activeDeals: deals.filter(d => d.stage !== 'closed').length,
        pipelineValue: totalValue
      }
    });
  })
);

/**
 * POST /api/deals/:id/note
 * Add note to deal
 */
router.post(
  '/:id/note',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { note } = req.body;
    const deal = await Deal.findById(req.params.id);

    if (!deal) {
      throw Errors.notFound('Deal');
    }

    deal.notes.push(note);
    await deal.save();

    logger.info('Note added to deal', { dealId: req.params.id, by: req.user?.id });

    res.json({
      success: true,
      message: 'Note added successfully',
      deal
    });
  })
);

export default router;