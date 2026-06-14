import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { consentService } from '../services/consentService';
import { historyService } from '../services/historyService';
import { complianceService } from '../services/complianceService';
import { auditService } from '../services/auditService';
import { templateService } from '../services/templateService';
import { ConsentType, ComplianceFramework } from '../models/Consent';
import { logger } from 'utils/logger.js';
import { metrics } from '../utils/metrics';

const router = Router();

// Validation schemas
const consentSchema = z.object({
  userId: z.string().min(1),
  type: z.nativeEnum(ConsentType),
  framework: z.nativeEnum(ComplianceFramework).optional(),
  granted: z.boolean(),
  source: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  expiresAt: z.string().datetime().optional()
});

const bulkConsentSchema = z.object({
  userId: z.string().min(1),
  consents: z.array(z.object({
    type: z.nativeEnum(ConsentType),
    granted: z.boolean()
  })),
  framework: z.nativeEnum(ComplianceFramework).optional(),
  source: z.string().optional()
});

const updateConsentSchema = z.object({
  granted: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
  expiresAt: z.string().datetime().optional(),
  source: z.string().optional()
});

const auditQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  userId: z.string().optional(),
  action: z.string().optional(),
  limit: z.coerce.number().min(1).max(1000).optional(),
  offset: z.coerce.number().min(0).optional()
});

// Helper function for request validation
function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: result.error.errors
        });
        return;
      }
      req.body = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
}

// POST /api/consent - Record consent
router.post('/', validateBody(consentSchema), async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  try {
    const { userId, type, framework, granted, source, metadata, expiresAt } = req.body;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];

    const consent = await consentService.recordConsent({
      userId,
      type,
      framework,
      granted,
      source,
      ip,
      userAgent,
      metadata,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    });

    metrics.requestDuration.observe(
      { method: 'POST', route: '/api/consent', status_code: '201' },
      (Date.now() - startTime) / 1000
    );

    res.status(201).json({
      success: true,
      data: consent
    });
  } catch (error: any) {
    metrics.errorsTotal.inc({ type: 'create' });
    logger.error('Failed to record consent', { error: error.message, body: req.body });
    next(error);
  }
});

// GET /api/consent/:userId - Get user consents
router.get('/:userId', async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  try {
    const { userId } = req.params;
    const framework = req.query.framework as ComplianceFramework | undefined;

    const consents = await consentService.getUserConsents(userId, framework);

    metrics.requestDuration.observe(
      { method: 'GET', route: '/api/consent/:userId', status_code: '200' },
      (Date.now() - startTime) / 1000
    );

    res.json({
      success: true,
      data: consents,
      count: consents.length
    });
  } catch (error: any) {
    metrics.errorsTotal.inc({ type: 'get' });
    logger.error('Failed to get user consents', { error: error.message, userId: req.params.userId });
    next(error);
  }
});

// PUT /api/consent/:userId - Update consent
router.put('/:userId', async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  try {
    const { userId } = req.params;
    const { type, framework } = req.body;
    const updateData = updateConsentSchema.parse(req.body);
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];

    if (!type) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: [{ path: 'type', message: 'Consent type is required' }]
      });
      return;
    }

    const consent = await consentService.updateConsent(
      userId,
      type,
      {
        granted: updateData.granted,
        metadata: updateData.metadata,
        expiresAt: updateData.expiresAt ? new Date(updateData.expiresAt) : undefined,
        source: updateData.source
      },
      framework,
      ip,
      userAgent
    );

    if (!consent) {
      res.status(404).json({
        success: false,
        error: 'Consent not found'
      });
      return;
    }

    metrics.requestDuration.observe(
      { method: 'PUT', route: '/api/consent/:userId', status_code: '200' },
      (Date.now() - startTime) / 1000
    );

    res.json({
      success: true,
      data: consent
    });
  } catch (error: any) {
    metrics.errorsTotal.inc({ type: 'update' });
    logger.error('Failed to update consent', { error: error.message, userId: req.params.userId });
    next(error);
  }
});

// POST /api/consent/:userId/withdraw - Withdraw consent
router.post('/:userId/withdraw', async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  try {
    const { userId } = req.params;
    const { type, framework } = req.body;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];

    if (!type) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: [{ path: 'type', message: 'Consent type is required' }]
      });
      return;
    }

    const consent = await consentService.withdrawConsent(
      userId,
      type,
      framework,
      ip,
      userAgent
    );

    if (!consent) {
      res.status(404).json({
        success: false,
        error: 'Consent not found'
      });
      return;
    }

    metrics.requestDuration.observe(
      { method: 'POST', route: '/api/consent/:userId/withdraw', status_code: '200' },
      (Date.now() - startTime) / 1000
    );

    res.json({
      success: true,
      message: 'Consent withdrawn successfully',
      data: consent
    });
  } catch (error: any) {
    metrics.errorsTotal.inc({ type: 'withdraw' });
    logger.error('Failed to withdraw consent', { error: error.message, userId: req.params.userId });
    next(error);
  }
});

// GET /api/consent/:userId/history - Get consent history
router.get('/:userId/history', async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  try {
    const { userId } = req.params;
    const { consentType, framework, startDate, endDate, limit, offset } = req.query;

    const result = await historyService.getUserHistory({
      userId,
      consentType: consentType as ConsentType,
      framework: framework as ComplianceFramework,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0
    });

    metrics.requestDuration.observe(
      { method: 'GET', route: '/api/consent/:userId/history', status_code: '200' },
      (Date.now() - startTime) / 1000
    );

    res.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0
      }
    });
  } catch (error: any) {
    metrics.errorsTotal.inc({ type: 'history' });
    logger.error('Failed to get consent history', { error: error.message, userId: req.params.userId });
    next(error);
  }
});

// POST /api/consent/bulk - Bulk consent update
router.post('/bulk', validateBody(bulkConsentSchema), async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  try {
    const { userId, consents, framework, source } = req.body;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];

    const result = await consentService.bulkUpdateConsents({
      userId,
      consents,
      framework,
      source,
      ip,
      userAgent
    });

    metrics.requestDuration.observe(
      { method: 'POST', route: '/api/consent/bulk', status_code: '200' },
      (Date.now() - startTime) / 1000
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    metrics.errorsTotal.inc({ type: 'bulk' });
    logger.error('Failed to bulk update consents', { error: error.message });
    next(error);
  }
});

// GET /api/consent/stats - Consent statistics
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  try {
    const { framework, startDate, endDate } = req.query;

    const stats = await consentService.getUserConsents('__stats__');

    // Get actual stats from database
    const { Consent } = await import('../models/Consent');

    const matchStage: any = {};
    if (framework) {
      matchStage.framework = framework;
    }
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate as string);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate as string);
    }

    const aggregateStats = await Consent.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { granted: '$granted', type: '$type', framework: '$framework' },
          count: { $sum: 1 }
        }
      }
    ]);

    const statsData = {
      totalConsents: aggregateStats.reduce((sum, s) => sum + s.count, 0),
      grantedByType: {} as Record<string, number>,
      withdrawnByType: {} as Record<string, number>,
      byFramework: {} as Record<string, { granted: number; withdrawn: number }>
    };

    for (const stat of aggregateStats) {
      if (!statsData.grantedByType[stat._id.type]) {
        statsData.grantedByType[stat._id.type] = 0;
        statsData.withdrawnByType[stat._id.type] = 0;
      }

      if (stat._id.granted) {
        statsData.grantedByType[stat._id.type] += stat.count;
      } else {
        statsData.withdrawnByType[stat._id.type] += stat.count;
      }

      if (!statsData.byFramework[stat._id.framework]) {
        statsData.byFramework[stat._id.framework] = { granted: 0, withdrawn: 0 };
      }
      if (stat._id.granted) {
        statsData.byFramework[stat._id.framework].granted += stat.count;
      } else {
        statsData.byFramework[stat._id.framework].withdrawn += stat.count;
      }
    }

    metrics.requestDuration.observe(
      { method: 'GET', route: '/api/consent/stats', status_code: '200' },
      (Date.now() - startTime) / 1000
    );

    res.json({
      success: true,
      data: statsData,
      generatedAt: new Date()
    });
  } catch (error: any) {
    metrics.errorsTotal.inc({ type: 'stats' });
    logger.error('Failed to get consent stats', { error: error.message });
    next(error);
  }
});

// POST /api/consent/audit - Audit consent
router.post('/audit', async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  try {
    const query = auditQuerySchema.parse(req.query);

    const result = await auditService.queryAuditLogs({
      userId: query.userId,
      action: query.action,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      limit: query.limit || 100,
      offset: query.offset || 0
    });

    metrics.requestDuration.observe(
      { method: 'POST', route: '/api/consent/audit', status_code: '200' },
      (Date.now() - startTime) / 1000
    );

    res.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        limit: query.limit || 100,
        offset: query.offset || 0
      }
    });
  } catch (error: any) {
    metrics.errorsTotal.inc({ type: 'audit' });
    logger.error('Failed to audit consents', { error: error.message });
    next(error);
  }
});

// GET /api/consent/compliance/:framework - Compliance report
router.get('/compliance/:framework', async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  try {
    const { framework } = req.params;
    const { startDate, endDate } = req.query;

    if (!Object.values(ComplianceFramework).includes(framework as ComplianceFramework)) {
      res.status(400).json({
        success: false,
        error: 'Invalid framework',
        validFrameworks: Object.values(ComplianceFramework)
      });
      return;
    }

    let report;
    switch (framework) {
      case ComplianceFramework.GDPR:
        report = await complianceService.getGDPRCompliance();
        break;
      case ComplianceFramework.CCPA:
        report = await complianceService.getCCPACompliance();
        break;
      default:
        report = await complianceService.generateComplianceReport(
          framework as ComplianceFramework,
          startDate ? new Date(startDate as string) : undefined,
          endDate ? new Date(endDate as string) : undefined
        );
    }

    metrics.requestDuration.observe(
      { method: 'GET', route: '/api/consent/compliance/:framework', status_code: '200' },
      (Date.now() - startTime) / 1000
    );

    res.json({
      success: true,
      data: report
    });
  } catch (error: any) {
    metrics.errorsTotal.inc({ type: 'compliance' });
    logger.error('Failed to generate compliance report', { error: error.message, framework: req.params.framework });
    next(error);
  }
});

export { router as consentRoutes };