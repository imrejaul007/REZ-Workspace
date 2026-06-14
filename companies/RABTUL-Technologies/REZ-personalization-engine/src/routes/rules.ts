import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PersonalizationRule } from '../models/Personalization';

const router = Router();

// Validation schemas
const CreateRuleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  priority: z.number().default(0),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains',
      'greater_than', 'less_than', 'in', 'not_in', 'exists', 'not_exists']),
    value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])
  })).default([]),
  actions: z.array(z.object({
    type: z.enum(['insert_variable', 'replace_text', 'add_section',
      'remove_section', 'change_tone', 'add_cta', 'custom']),
    target: z.string().optional(),
    value: z.string(),
    conditions: z.array(z.object({
      field: z.string(),
      operator: z.string(),
      value: z.union([z.string(), z.number(), z.boolean()])
    })).optional()
  })).default([]),
  templateId: z.string().optional(),
  isActive: z.boolean().default(true)
});

const UpdateRuleSchema = CreateRuleSchema.partial();

// Create rule
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = CreateRuleSchema.parse(req.body);
    const tenantId = req.headers['x-tenant-id'] as string;

    const rule = new PersonalizationRule({
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
      limit = 50,
      isActive
    } = req.query;

    const query: Record<string, unknown> = { tenantId };
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const skip = (Number(page) - 1) * Number(limit);

    const [rules, total] = await Promise.all([
      PersonalizationRule.find(query)
        .sort({ priority: -1, name: 1 })
        .skip(skip)
        .limit(Number(limit)),
      PersonalizationRule.countDocuments(query)
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

    const rule = await PersonalizationRule.findOne({
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

    const rule = await PersonalizationRule.findOneAndUpdate(
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

    const rule = await PersonalizationRule.findOneAndDelete({
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

    const rule = await PersonalizationRule.findOne({
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

// Reorder rules (update priorities)
router.post('/reorder', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rules } = z.object({
      rules: z.array(z.object({
        id: z.string(),
        priority: z.number()
      }))
    }).parse(req.body);

    const tenantId = req.headers['x-tenant-id'] as string;

    // Update priorities in bulk
    for (const { id, priority } of rules) {
      await PersonalizationRule.findOneAndUpdate(
        { _id: id, tenantId },
        { $set: { priority } }
      );
    }

    const updatedRules = await PersonalizationRule.find({ tenantId })
      .sort({ priority: -1 });

    res.json({
      success: true,
      data: updatedRules
    });
  } catch (error) {
    next(error);
  }
});

export default router;
