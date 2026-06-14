import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { complianceService, ComplianceCheckRequest } from '../services/complianceService';
import { ComplianceType } from '../models/ComplianceCheck';

const router = Router();

// Validation schemas
const complianceCheckSchema = z.object({
  companyId: z.string().min(1, 'Company ID is required'),
  type: z.enum(['gst', 'tds', 'pf', 'esi', 'professional_tax', 'annual', 'custom']),
  period: z.object({
    start: z.string().or(z.date()).transform((val) => new Date(val)),
    end: z.string().or(z.date()).transform((val) => new Date(val)),
  }),
  data: z
    .object({
      turnover: z.number().optional(),
      gstin: z.string().optional(),
      inputTaxCredit: z.number().optional(),
      outputTax: z.number().optional(),
      transactions: z
        .array(
          z.object({
            section: z.string(),
            amount: z.number(),
            recipientPan: z.string().optional(),
          })
        )
        .optional(),
      tan: z.string().optional(),
      employeeCount: z.number().optional(),
      pfContributions: z.number().optional(),
      esiContributions: z.number().optional(),
    })
    .optional(),
});

const statusQuerySchema = z.object({
  companyId: z.string().min(1, 'Company ID is required'),
});

const reportsQuerySchema = z.object({
  companyId: z.string().optional(),
  type: z.enum(['gst', 'tds', 'pf', 'esi', 'professional_tax', 'annual', 'custom']).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

const gstCheckSchema = z.object({
  companyId: z.string().min(1, 'Company ID is required'),
  turnover: z.number().min(0, 'Turnover must be positive'),
  gstin: z.string().optional(),
  inputTaxCredit: z.number().min(0).optional(),
  outputTax: z.number().min(0).optional(),
});

const tdsCheckSchema = z.object({
  companyId: z.string().min(1, 'Company ID is required'),
  transactions: z
    .array(
      z.object({
        section: z.string().min(1, 'Section is required'),
        amount: z.number().min(0, 'Amount must be positive'),
        recipientPan: z.string().length(10).optional(),
      })
    )
    .min(1, 'At least one transaction required'),
  tan: z.string().optional(),
});

// Middleware to validate request body
const validate = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
};

// GET /api/compliance/status - Check compliance status
router.get('/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const queryResult = statusQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: queryResult.error.errors,
      });
    }

    const { companyId } = queryResult.data;
    const status = await complianceService.getComplianceStatus(companyId);

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/compliance/check - Run compliance check
router.post('/check', validate(complianceCheckSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request: ComplianceCheckRequest = {
      companyId: req.body.companyId,
      type: req.body.type as ComplianceType,
      period: req.body.period,
      data: req.body.data,
    };

    const check = await complianceService.runComplianceCheck(request);

    res.status(201).json({
      success: true,
      data: {
        id: check._id,
        companyId: check.companyId,
        type: check.type,
        status: check.status,
        score: check.score,
        issues: check.issues,
        warnings: check.warnings,
        recommendations: check.recommendations,
        checkedAt: check.checkedAt,
        nextDueDate: check.nextDueDate,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/compliance/reports - List reports
router.get('/reports', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const queryResult = reportsQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: queryResult.error.errors,
      });
    }

    const { companyId, type, limit, offset } = queryResult.data;
    const result = await complianceService.getReports(companyId, type, limit, offset);

    res.json({
      success: true,
      data: result.reports,
      pagination: {
        total: result.total,
        limit,
        offset,
        hasMore: offset + result.reports.length < result.total,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/compliance/gst - GST compliance check
router.post('/gst', validate(gstCheckSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await complianceService.checkGST(req.body);

    res.json({
      success: true,
      data: {
        compliant: result.compliant,
        score: result.score,
        issues: result.issues,
        recommendations: result.recommendations,
        summary: {
          compliant: result.compliant ? 'PASS' : 'FAIL',
          score: result.score,
          criticalIssues: result.issues.filter((i) => i.severity === 'critical').length,
          highIssues: result.issues.filter((i) => i.severity === 'high').length,
          mediumIssues: result.issues.filter((i) => i.severity === 'medium').length,
          lowIssues: result.issues.filter((i) => i.severity === 'low').length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/compliance/tds - TDS compliance check
router.post('/tds', validate(tdsCheckSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await complianceService.checkTDS(req.body);

    res.json({
      success: true,
      data: {
        compliant: result.compliant,
        score: result.score,
        issues: result.issues,
        recommendations: result.recommendations,
        summary: {
          compliant: result.compliant ? 'PASS' : 'FAIL',
          score: result.score,
          totalTDSLiability: result.totalTDSLiability,
          criticalIssues: result.issues.filter((i) => i.severity === 'critical').length,
          highIssues: result.issues.filter((i) => i.severity === 'high').length,
          mediumIssues: result.issues.filter((i) => i.severity === 'medium').length,
          lowIssues: result.issues.filter((i) => i.severity === 'low').length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;