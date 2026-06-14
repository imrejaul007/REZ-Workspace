import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import cron from 'node-cron';
import { AutoUpdateRule } from '../models/AiCrmUpdates';
import { AiUpdateService } from '../services/aiUpdateService';

const router = Router();

// Validation schemas
const CreateRuleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  trigger: z.object({
    type: z.enum(['scheduled', 'event', 'manual']),
    schedule: z.string().optional(),
    eventType: z.string().optional(),
    entityType: z.enum(['contact', 'company', 'deal']).optional()
  }),
  updateType: z.enum(['field_enrichment', 'contact_update', 'company_update', 'deal_update',
    'activity_log', 'sentiment_analysis', 'intent_detection', 'health_score', 'next_action']),
  targetEntity: z.enum(['contact', 'company', 'deal']),
  fieldMappings: z.array(z.object({
    sourceField: z.string(),
    targetField: z.string(),
    transform: z.enum(['uppercase', 'lowercase', 'titlecase', 'date_format', 'custom']).optional(),
    transformFunction: z.string().optional()
  })).optional(),
  aiConfig: z.object({
    model: z.enum(['openai', 'anthropic', 'internal', 'rule_based']).optional(),
    prompt: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().optional()
  }).optional(),
  enrichmentSources: z.array(z.string()).optional(),
  filterConditions: z.array(z.object({
    field: z.string(),
    operator: z.string(),
    value: z.union([z.string(), z.number(), z.boolean()])
  })).optional(),
  isActive: z.boolean().default(true),
  priority: z.number().default(0)
});

const UpdateRuleSchema = CreateRuleSchema.partial();

// Create rule
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = CreateRuleSchema.parse(req.body);
    const tenantId = req.headers['x-tenant-id'] as string;

    // Validate cron schedule if provided
    if (data.trigger.schedule && data.trigger.type === 'scheduled') {
      if (!cron.validate(data.trigger.schedule)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid cron schedule'
        });
      }
    }

    const rule = new AutoUpdateRule({
      ...data,
      tenantId,
      createdBy: req.headers['x-user-id'] as string || 'system'
    });

    await rule.save();

    res.status(201).json({
      success: true,
      data: rule
    });
  } catch (error) {
    next(error);
  }
});

// List rules
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const {
      page = 1,
      limit = 20,
      updateType,
      isActive
    } = req.query;

    const query: Record<string, unknown> = { tenantId };
    if (updateType) query.updateType = updateType;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const skip = (Number(page) - 1) * Number(limit);

    const [rules, total] = await Promise.all([
      AutoUpdateRule.find(query)
        .sort({ priority: -1, name: 1 })
        .skip(skip)
        .limit(Number(limit)),
      AutoUpdateRule.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: rules,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get rule
router.get('/:ruleId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const rule = await AutoUpdateRule.findOne({
      _id: req.params.ruleId,
      tenantId
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found'
      });
    }

    res.json({
      success: true,
      data: rule
    });
  } catch (error) {
    next(error);
  }
});

// Update rule
router.patch('/:ruleId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = UpdateRuleSchema.parse(req.body);
    const tenantId = req.headers['x-tenant-id'] as string;

    // Validate cron schedule if updating
    if (data.trigger?.schedule && data.trigger?.type === 'scheduled') {
      if (!cron.validate(data.trigger.schedule)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid cron schedule'
        });
      }
    }

    const rule = await AutoUpdateRule.findOneAndUpdate(
      { _id: req.params.ruleId, tenantId },
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found'
      });
    }

    res.json({
      success: true,
      data: rule
    });
  } catch (error) {
    next(error);
  }
});

// Delete rule
router.delete('/:ruleId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const rule = await AutoUpdateRule.findOneAndDelete({
      _id: req.params.ruleId,
      tenantId
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found'
      });
    }

    res.json({
      success: true,
      message: 'Rule deleted'
    });
  } catch (error) {
    next(error);
  }
});

// Toggle rule status
router.patch('/:ruleId/toggle', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const rule = await AutoUpdateRule.findOne({
      _id: req.params.ruleId,
      tenantId
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found'
      });
    }

    rule.isActive = !rule.isActive;
    await rule.save();

    res.json({
      success: true,
      data: rule
    });
  } catch (error) {
    next(error);
  }
});

// Run rule manually
router.post('/:ruleId/run', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { targetId } = req.body;

    const rule = await AutoUpdateRule.findOne({
      _id: req.params.ruleId,
      tenantId
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found'
      });
    }

    if (!rule.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Rule is not active'
      });
    }

    if (!targetId) {
      return res.status(400).json({
        success: false,
        error: 'Target ID is required'
      });
    }

    const result = await AiUpdateService.processRule(rule._id.toString(), targetId);

    res.json({
      success: result.success,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// Run batch for rule
router.post('/:ruleId/run-batch', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { targetIds } = req.body;

    const rule = await AutoUpdateRule.findOne({
      _id: req.params.ruleId,
      tenantId
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found'
      });
    }

    if (!Array.isArray(targetIds) || targetIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Target IDs array is required'
      });
    }

    const results = [];
    for (const targetId of targetIds) {
      const result = await AiUpdateService.processRule(rule._id.toString(), targetId);
      results.push(result);
    }

    res.json({
      success: true,
      data: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
