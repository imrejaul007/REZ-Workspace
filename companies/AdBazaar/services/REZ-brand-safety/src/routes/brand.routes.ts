import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { brandSafetyService } from '../services/brand-safety.service';
import { keywordService } from '../services/keyword.service';
import { brandService } from '../services/brand.service';
import { categoryService } from '../services/category.service';
import { createLogger } from '../utils/logger';

const router = Router();
const logger = createLogger('BrandRoutes');

// Validation schemas
const ContentCheckSchema = z.object({
  content: z.object({
    text: z.string().optional(),
    imageUrl: z.string().url().optional(),
    categories: z.array(z.string()).optional(),
  }),
  advertiserId: z.string().optional(),
  campaignId: z.string().optional(),
  safetyLevel: z.enum(['strict', 'moderate', 'relaxed']).optional(),
});

const BatchCheckSchema = z.object({
  items: z.array(ContentCheckSchema).min(1).max(100),
});

const KeywordRuleSchema = z.object({
  name: z.string().min(1),
  keywords: z.array(z.string().min(1)),
  category: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  action: z.enum(['warn', 'block', 'review']),
});

const BrandRuleSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['whitelist', 'blacklist']),
  entries: z.array(z.object({
    value: z.string(),
    matchType: z.enum(['exact', 'contains', 'regex']),
    caseSensitive: z.boolean().optional(),
  })),
  entityType: z.enum(['advertiser', 'publisher', 'keyword', 'url', 'category']),
});

// Content check
router.post('/check', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = ContentCheckSchema.parse(req.body);

    const result = await brandSafetyService.checkContent(data);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
        timestamp: new Date().toISOString(),
      });
      return;
    }
    next(error);
  }
});

// Batch content check
router.post('/check/batch', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { items } = BatchCheckSchema.parse(req.body);

    const result = await brandSafetyService.checkBatch(items);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
        timestamp: new Date().toISOString(),
      });
      return;
    }
    next(error);
  }
});

// Keyword rules
router.get('/keywords', (req: Request, res: Response) => {
  const { enabled } = req.query;
  const rules = keywordService.getAllRules(enabled === 'true');

  res.json({
    success: true,
    data: rules,
    timestamp: new Date().toISOString(),
  });
});

router.post('/keywords', (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = KeywordRuleSchema.parse(req.body);

    const rule = keywordService.createRule(data);

    res.status(201).json({
      success: true,
      data: rule,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
        timestamp: new Date().toISOString(),
      });
      return;
    }
    next(error);
  }
});

router.put('/keywords/:ruleId', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ruleId } = req.params;
    const updates = KeywordRuleSchema.partial().parse(req.body);

    const rule = keywordService.updateRule(ruleId, updates);

    if (!rule) {
      res.status(404).json({
        success: false,
        error: 'Rule not found',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.json({
      success: true,
      data: rule,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
        timestamp: new Date().toISOString(),
      });
      return;
    }
    next(error);
  }
});

router.delete('/keywords/:ruleId', (req: Request, res: Response) => {
  const { ruleId } = req.params;

  const deleted = keywordService.deleteRule(ruleId);

  if (!deleted) {
    res.status(404).json({
      success: false,
      error: 'Rule not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.json({
    success: true,
    message: 'Rule deleted',
    timestamp: new Date().toISOString(),
  });
});

router.post('/keywords/:ruleId/toggle', (req: Request, res: Response) => {
  const { ruleId } = req.params;
  const { enabled } = req.body;

  let result: boolean;
  if (enabled) {
    result = keywordService.enableRule(ruleId);
  } else {
    result = keywordService.disableRule(ruleId);
  }

  if (!result) {
    res.status(404).json({
      success: false,
      error: 'Rule not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.json({
    success: true,
    message: `Rule ${enabled ? 'enabled' : 'disabled'}`,
    timestamp: new Date().toISOString(),
  });
});

// Brand rules
router.get('/brands', (req: Request, res: Response) => {
  const { type } = req.query;
  const rules = brandService.getAllRules(type as 'whitelist' | 'blacklist' | undefined);

  res.json({
    success: true,
    data: rules,
    timestamp: new Date().toISOString(),
  });
});

router.post('/brands', (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = BrandRuleSchema.parse(req.body);

    const rule = brandService.createRule(data);

    res.status(201).json({
      success: true,
      data: rule,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
        timestamp: new Date().toISOString(),
      });
      return;
    }
    next(error);
  }
});

router.delete('/brands/:ruleId', (req: Request, res: Response) => {
  const { ruleId } = req.params;

  const deleted = brandService.deleteRule(ruleId);

  if (!deleted) {
    res.status(404).json({
      success: false,
      error: 'Rule not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.json({
    success: true,
    message: 'Rule deleted',
    timestamp: new Date().toISOString(),
  });
});

// Categories
router.get('/categories', (req: Request, res: Response) => {
  const categories = categoryService.getDefaultCategories();

  res.json({
    success: true,
    data: categories,
    timestamp: new Date().toISOString(),
  });
});

router.get('/categories/excluded', (req: Request, res: Response) => {
  const { advertiserId } = req.query;
  const excluded = categoryService.getExcludedCategories(advertiserId as string | undefined);

  res.json({
    success: true,
    data: excluded,
    timestamp: new Date().toISOString(),
  });
});

// Settings
router.get('/settings/safety-level', (req: Request, res: Response) => {
  const level = brandSafetyService.getDefaultSafetyLevel();

  res.json({
    success: true,
    data: { level },
    timestamp: new Date().toISOString(),
  });
});

router.put('/settings/safety-level', (req: Request, res: Response) => {
  const { level } = req.body;

  if (!['strict', 'moderate', 'relaxed'].includes(level)) {
    res.status(400).json({
      success: false,
      error: 'Invalid safety level',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  brandSafetyService.setDefaultSafetyLevel(level);

  res.json({
    success: true,
    message: `Safety level set to ${level}`,
    timestamp: new Date().toISOString(),
  });
});

// Stats
router.get('/stats', (req: Request, res: Response) => {
  const stats = brandSafetyService.getStats();

  res.json({
    success: true,
    data: stats,
    timestamp: new Date().toISOString(),
  });
});

export default router;
