
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { CampaignRule } from '../models/CampaignRule';
import { merchantAuth } from '../middleware/auth';
import { captureIntent } from '../utils/intentCapture';

const router = Router();
router.use(merchantAuth);

/**
 * CRIT-004 FIX: Input validation schema for campaign creation/updates
 * Validates field types and rejects unknown fields
 */
const campaignValidationSchema = z
  .object({
    name: z.string().min(1, 'Campaign name is required').max(200).optional(),
    title: z.string().max(200).optional(),
    description: z.string().max(1000).optional(),
    type: z.string().max(50).optional(),
    status: z.enum(['draft', 'active', 'paused', 'completed', 'archived']).optional(),
    isActive: z.boolean().optional(),
    storeId: z.string().optional(),
    startDate: z
      .union([z.date(), z.string()])
      .transform(val => (typeof val === 'string' ? new Date(val) : val))
      .optional(),
    endDate: z
      .union([z.date(), z.string()])
      .transform(val => (typeof val === 'string' ? new Date(val) : val))
      .optional(),
    budget: z.number().nonnegative().optional(),
    budgetCap: z.number().nonnegative().optional(),
    targetSegment: z.record(z.string(), z.unknown()).optional(),
    targetAudience: z.record(z.string(), z.unknown()).optional(),
    rewardValue: z.number().nonnegative().optional(),
    rewardType: z.string().max(50).optional(),
    durationDays: z.number().positive().optional(),
    source: z.string().max(50).optional(),
    conditions: z.record(z.string(), z.unknown()).optional(),
    actions: z.array(z.record(z.string(), z.unknown())).optional(),
    triggers: z.array(z.record(z.string(), z.unknown())).optional(),
    priority: z.number().int().min(0).max(10).optional(),
    cooldownDays: z.number().nonnegative().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strict() // Reject unknown fields
  .refine(
    (data) => {
      // If both dates are provided, startDate must be before endDate
      if (data.startDate && data.endDate) {
        return data.startDate < data.endDate;
      }
      return true;
    },
    { message: 'startDate must be before endDate', path: ['endDate'] },
  );

function pickCampaignFields(body: Record<string, unknown>): Record<string, unknown> {
  // Parse and validate input
  const validationResult = campaignValidationSchema.safeParse(body);
  if (!validationResult.success) {
    // Return a marker object that will trigger error handling in the route
    return { _validationError: validationResult.error };
  }
  return validationResult.data;
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const query: unknown = { merchantId: req.merchantId };
    if (req.query.storeId) query.storeId = req.query.storeId;
    if (req.query.status) query.status = req.query.status;
    if (req.query.type) query.type = req.query.type;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const [items, total] = await Promise.all([
      CampaignRule.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      CampaignRule.countDocuments(query),
    ]);
    res.json({ success: true, data: { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });

    // Capture campaign analytics intent
    captureIntent({
      userId: req.merchantId as string,
      appType: 'merchant',
      eventType: 'campaigns_viewed',
      intentKey: `campaigns_list_viewed_${Date.now()}`,
      category: 'CAMPAIGN_ANALYTICS',
      metadata: { totalCampaigns: total, page, status: req.query.status },
    }).catch(() => {});
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const item = await CampaignRule.findOne({ _id: req.params.id, merchantId: req.merchantId }).lean();
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: item });

    // Capture campaign detail intent
    captureIntent({
      userId: req.merchantId as string,
      appType: 'merchant',
      eventType: 'campaign_viewed',
      intentKey: `campaign_viewed_${req.params.id}`,
      category: 'CAMPAIGN_ANALYTICS',
      metadata: { campaignId: req.params.id, campaignType: (item as unknown).type },
    }).catch(() => {});
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const fields = pickCampaignFields(req.body);

    // Check for validation errors
    if ('_validationError' in fields) {
      const error = fields._validationError as unknown;
      const details = (error.issues || []).reduce((acc: Record<string, string>, err) => {
        const path = err.path.join('.');
        acc[path] = err.message;
        return acc;
      }, {});
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details,
      });
    }

    const item = await CampaignRule.create({ ...fields, merchantId: req.merchantId });
    res.status(201).json({ success: true, data: item });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const allowedFields = pickCampaignFields(req.body);

    // Check for validation errors
    if ('_validationError' in allowedFields) {
      const error = allowedFields._validationError as unknown;
      const details = (error.issues || []).reduce((acc: Record<string, string>, err) => {
        const path = err.path.join('.');
        acc[path] = err.message;
        return acc;
      }, {});
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details,
      });
    }

    allowedFields.updatedAt = new Date();
    const item = await CampaignRule.findOneAndUpdate(
      { _id: req.params.id, merchantId: req.merchantId },
      { $set: allowedFields },
      { new: true },
    );
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: item });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const allowedFields = pickCampaignFields(req.body);

    // Check for validation errors
    if ('_validationError' in allowedFields) {
      const error = allowedFields._validationError as unknown;
      const details = (error.issues || []).reduce((acc: Record<string, string>, err) => {
        const path = err.path.join('.');
        acc[path] = err.message;
        return acc;
      }, {});
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details,
      });
    }

    allowedFields.updatedAt = new Date();
    const item = await CampaignRule.findOneAndUpdate(
      { _id: req.params.id, merchantId: req.merchantId },
      { $set: allowedFields },
      { new: true },
    );
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: item });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const item = await CampaignRule.findOneAndDelete({ _id: req.params.id, merchantId: req.merchantId });
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Deleted' });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
