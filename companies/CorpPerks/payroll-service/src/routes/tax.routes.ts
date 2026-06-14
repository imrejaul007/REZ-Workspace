import { Router, Response } from 'express';
import { taxService } from '../services/index.js';
import { validate } from '../middleware/validate.js';
import { requireTenant } from '../middleware/index.js';
import { submitTaxDeclarationSchema, verifyDeclarationSchema } from '../validators/payroll.validator.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

// Apply tenant middleware to all routes
router.use(requireTenant);

/**
 * GET /api/tax/declarations/:employeeId
 * Get tax declarations for an employee
 */
router.get('/declarations/:employeeId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { employeeId } = req.params;
    const { fiscalYear } = req.query as { fiscalYear?: string };

    const result = await taxService.getDeclarations(tenantId, employeeId, fiscalYear);

    res.json(result);
  } catch (error) {
    logger.error('Error fetching tax declarations:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tax declarations' });
  }
});

/**
 * POST /api/tax/declarations
 * Submit tax declarations for an employee
 */
router.post('/declarations', validate(submitTaxDeclarationSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const input = req.body;

    const result = await taxService.submitDeclaration(tenantId, input);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(201).json(result);
  } catch (error) {
    logger.error('Error submitting tax declarations:', error);
    res.status(500).json({ success: false, error: 'Failed to submit tax declarations' });
  }
});

/**
 * PATCH /api/tax/declarations/:declarationId/verify
 * Verify tax declarations (HR/Admin action)
 */
router.patch('/declarations/:declarationId/verify', validate(verifyDeclarationSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { declarationId } = req.params;
    const { section, status, rejectionReason } = req.body;
    const verifiedBy = req.user?.userId || 'system';

    const result = await taxService.verifyDeclaration(
      tenantId,
      declarationId,
      verifiedBy,
      [{ section, status, rejectionReason }]
    );

    if (!result.success) {
      res.status(404).json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    logger.error('Error verifying tax declaration:', error);
    res.status(500).json({ success: false, error: 'Failed to verify tax declaration' });
  }
});

/**
 * DELETE /api/tax/declarations/:declarationId
 * Reject a tax declaration
 */
router.delete('/declarations/:declarationId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { declarationId } = req.params;
    const { reason } = req.body;
    const rejectedBy = req.user?.userId || 'system';

    if (!reason) {
      res.status(400).json({ success: false, error: 'Rejection reason is required' });
      return;
    }

    const result = await taxService.rejectDeclaration(tenantId, declarationId, rejectedBy, reason);

    if (!result.success) {
      res.status(404).json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    logger.error('Error rejecting tax declaration:', error);
    res.status(500).json({ success: false, error: 'Failed to reject tax declaration' });
  }
});

/**
 * GET /api/tax/pending
 * Get all pending declarations for HR dashboard
 */
router.get('/pending', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { fiscalYear, page, limit } = req.query as {
      fiscalYear?: string;
      page?: string;
      limit?: string;
    };

    const result = await taxService.getPendingDeclarations(
      tenantId,
      fiscalYear || '2024-25',
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20
    );

    res.json(result);
  } catch (error) {
    logger.error('Error fetching pending declarations:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch pending declarations' });
  }
});

/**
 * GET /api/tax/estimate/:employeeId
 * Calculate estimated tax for an employee
 */
router.get('/estimate/:employeeId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { employeeId } = req.params;
    const { annualIncome } = req.query as { annualIncome?: string };

    const income = annualIncome ? parseFloat(annualIncome) : 600000;

    const result = await taxService.calculateEstimatedTax(tenantId, employeeId, income);

    res.json(result);
  } catch (error) {
    logger.error('Error calculating tax estimate:', error);
    res.status(500).json({ success: false, error: 'Failed to calculate tax estimate' });
  }
});

/**
 * GET /api/tax/sections
 * Get available tax sections
 */
router.get('/sections', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const sections = taxService.getTaxSections();
    res.json({ success: true, data: sections });
  } catch (error) {
    logger.error('Error fetching tax sections:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tax sections' });
  }
});

export default router;
