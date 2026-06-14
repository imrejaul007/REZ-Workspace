import { Router, Response } from 'express';
import { complianceService, contentCheckSchema, batchCheckSchema, ruleSchema } from '../services/compliance.service.js';
import { aiService } from '../services/ai.service.js';
import { AuthenticatedRequest, authMiddleware, asyncHandler, createAppError } from '../middleware/index.js';
import { ComplianceCheck, ComplianceReport } from '../models/index.js';
import { ZodError } from 'zod';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// POST /api/compliance/check - Check single content
router.post(
  '/check',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validatedData = contentCheckSchema.parse(req.body);
      const check = await complianceService.checkContent(
        validatedData,
        req.userId,
        req.sessionId
      );

      res.status(201).json({
        success: true,
        data: {
          id: check._id,
          contentId: check.contentId,
          score: check.score,
          status: check.status,
          violations: check.violations,
          processingTimeMs: check.processingTimeMs,
          checkedAt: check.checkedAt,
        },
      });
    } catch (error) {
      if (error instanceof ZodError) {
        throw createAppError('Invalid request data', 400, 'VALIDATION_ERROR', error.errors);
      }
      throw error;
    }
  })
);

// POST /api/compliance/batch - Batch check
router.post(
  '/batch',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validatedData = batchCheckSchema.parse(req.body);
      const checks = await complianceService.batchCheck(
        validatedData.contents,
        req.userId
      );

      res.status(201).json({
        success: true,
        data: {
          total: checks.length,
          passed: checks.filter((c) => c.status === 'passed').length,
          failed: checks.filter((c) => c.status === 'failed').length,
          warning: checks.filter((c) => c.status === 'warning').length,
          checks: checks.map((c) => ({
            contentId: c.contentId,
            score: c.score,
            status: c.status,
            violations: c.violations.length,
          })),
        },
      });
    } catch (error) {
      if (error instanceof ZodError) {
        throw createAppError('Invalid request data', 400, 'VALIDATION_ERROR', error.errors);
      }
      throw error;
    }
  })
);

// GET /api/compliance/report/:id - Get compliance report
router.get(
  '/report/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const check = await ComplianceCheck.findById(id);
    if (!check) {
      throw createAppError('Check not found', 404, 'NOT_FOUND');
    }

    // Generate report from check
    const report = await ComplianceReport.create({
      checkIds: [check._id.toString()],
      summary: {
        totalChecks: 1,
        passedChecks: check.status === 'passed' ? 1 : 0,
        failedChecks: check.status === 'failed' ? 1 : 0,
        warningChecks: check.status === 'warning' ? 1 : 0,
        averageScore: check.score,
        topViolations: Object.entries(
          check.violations.reduce((acc, v) => {
            acc[v.type] = (acc[v.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        ).map(([type, count]) => ({ type, count })),
        platformBreakdown: { [check.platform]: 1 },
        severityBreakdown: Object.entries(
          check.violations.reduce((acc, v) => {
            acc[v.severity] = (acc[v.severity] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        ).reduce((acc, [severity, count]) => {
          acc[severity] = count;
          return acc;
        }, {} as Record<string, number>),
      },
      violations: check.violations.map((v) => ({
        ruleId: v.ruleId,
        ruleName: v.ruleName,
        type: v.type,
        severity: v.severity,
        description: v.description,
        matchedContent: v.matchedContent,
      })),
      recommendations: check.violations
        .filter((v) => v.action === 'suggest_edit' || v.action === 'auto_fix')
        .map((v) => `Consider revising: ${v.description}`),
      generatedBy: req.userId || 'system',
      format: 'json',
      exportedAt: new Date(),
    });

    res.json({
      success: true,
      data: report,
    });
  })
);

// POST /api/compliance/rules - Create rule
router.post(
  '/rules',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validatedData = ruleSchema.parse(req.body);
      const rule = await complianceService.createRule(validatedData, req.userId || 'system');

      res.status(201).json({
        success: true,
        data: rule,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        throw createAppError('Invalid rule data', 400, 'VALIDATION_ERROR', error.errors);
      }
      throw error;
    }
  })
);

// GET /api/compliance/rules - List rules
router.get(
  '/rules',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { type, severity, platform, enabled, page, limit } = req.query;

    const result = await complianceService.getRules(
      {
        type: type as string,
        severity: severity as string,
        platform: platform as string,
        enabled: enabled !== undefined ? enabled === 'true' : undefined,
      },
      {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 50,
      }
    );

    res.json({
      success: true,
      data: {
        rules: result.rules,
        pagination: {
          total: result.total,
          page: page ? parseInt(page as string) : 1,
          limit: limit ? parseInt(limit as string) : 50,
          pages: Math.ceil(result.total / (limit ? parseInt(limit as string) : 50)),
        },
      },
    });
  })
);

// PATCH /api/compliance/rules/:id - Update rule
router.patch(
  '/rules/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const rule = await complianceService.updateRule(id, req.body);

    if (!rule) {
      throw createAppError('Rule not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: rule,
    });
  })
);

// DELETE /api/compliance/rules/:id - Delete rule
router.delete(
  '/rules/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const deleted = await complianceService.deleteRule(id);

    if (!deleted) {
      throw createAppError('Rule not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      message: 'Rule deleted successfully',
    });
  })
);

// POST /api/compliance/pre-publish - Pre-publish validation
router.post(
  '/pre-publish',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validatedData = contentCheckSchema.parse(req.body);
      const result = await complianceService.prePublishValidation(validatedData);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        throw createAppError('Invalid request data', 400, 'VALIDATION_ERROR', error.errors);
      }
      throw error;
    }
  })
);

// GET /api/compliance/history - Check history
router.get(
  '/history',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { startDate, endDate } = req.query;

    const history = await complianceService.getHistory(
      req.userId!,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json({
      success: true,
      data: history,
    });
  })
);

// GET /api/compliance/analytics - Compliance analytics
router.get(
  '/analytics',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { startDate, endDate, userId } = req.query;

    const analytics = await complianceService.getAnalytics(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined,
      userId as string
    );

    res.json({
      success: true,
      data: analytics,
    });
  })
);

// POST /api/compliance/fix - Get fix suggestions
router.post(
  '/fix',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { contentId, text, violations } = req.body;

    if (!contentId && !text) {
      throw createAppError('Either contentId or text is required', 400, 'VALIDATION_ERROR');
    }

    let suggestions;

    if (contentId) {
      suggestions = await complianceService.getFixSuggestions(contentId);
    } else if (violations && Array.isArray(violations)) {
      suggestions = await aiService.getFixSuggestions(text, violations);
    } else {
      // Need to check content first
      const check = await complianceService.checkContent({
        contentId: `temp-${Date.now()}`,
        text: text!,
        platform: 'all',
      });
      suggestions = await aiService.getFixSuggestions(
        text!,
        check.violations.map((v) => ({
          type: v.type,
          matchedContent: v.matchedContent,
          description: v.description,
        }))
      );
    }

    res.json({
      success: true,
      data: suggestions,
    });
  })
);

export default router;