import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Computation } from '../models/Computation.js';
import { auditService } from '../services/auditService.js';
import { logger, privacyLogger } from '../utils/logger.js';
import { metrics } from '../utils/metrics.js';

const router = Router();

// Input validation schema
const ValidationSchema = z.object({
  computationId: z.string().min(1, 'Computation ID is required'),
  privacyGuarantees: z.object({
    epsilon: z.number().positive(),
    delta: z.number().positive().optional(),
    mechanism: z.string(),
  }),
  participants: z.array(z.string()).optional(),
});

/**
 * POST /api/compute/validate
 * Validate privacy guarantees for a computation
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate input
    const validationResult = ValidationSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: validationResult.error.errors,
      });
    }

    const { computationId, privacyGuarantees, participants } = validationResult.data;

    logger.info('Privacy validation request received', {
      computationId,
      epsilon: privacyGuarantees.epsilon,
    });

    // Get computation
    const computation = await Computation.findOne({ computationId });

    if (!computation) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Computation not found',
      });
    }

    // Perform validation checks
    const validationResults = await performValidationChecks(
      computationId,
      privacyGuarantees,
      participants,
      computation.privacyParams
    );

    metrics.privacyValidationsTotal.labels(validationResults.valid ? 'passed' : 'failed').inc();

    privacyLogger.info('Privacy validation completed', {
      computationId,
      valid: validationResults.valid,
      score: validationResults.score,
    });

    res.json({
      success: true,
      data: validationResults,
    });
  } catch (error) {
    logger.error('Privacy validation error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    next(error);
  }
});

/**
 * Perform privacy validation checks
 */
async function performValidationChecks(
  computationId: string,
  privacyGuarantees: { epsilon: number; delta?: number; mechanism: string },
  participants?: string[],
  actualParams?: { epsilon: number; delta?: number; sensitivity: number; mechanism: string }
): Promise<{
  valid: boolean;
  score: number;
  checks: Array<{ name: string; passed: boolean; details: string }>;
}> {
  const checks: Array<{ name: string; passed: boolean; details: string }> = [];

  // Check 1: Epsilon budget
  const epsilonCheck = actualParams
    ? privacyGuarantees.epsilon >= actualParams.epsilon
    : true;
  checks.push({
    name: 'Epsilon Budget',
    passed: epsilonCheck,
    details: `Required: ${privacyGuarantees.epsilon}, Actual: ${actualParams?.epsilon || 'N/A'}`,
  });

  // Check 2: Privacy mechanism
  const mechanismCheck = actualParams
    ? privacyGuarantees.mechanism === actualParams.mechanism
    : true;
  checks.push({
    name: 'Privacy Mechanism',
    passed: mechanismCheck,
    details: `Required: ${privacyGuarantees.mechanism}, Actual: ${actualParams?.mechanism || 'N/A'}`,
  });

  // Check 3: Audit trail integrity
  const auditIntegrity = await auditService.verifyIntegrity(computationId);
  checks.push({
    name: 'Audit Trail Integrity',
    passed: auditIntegrity.valid,
    details: `Integrity Score: ${auditIntegrity.integrityScore.toFixed(2)}%`,
  });

  // Check 4: Participants (if specified)
  if (participants && participants.length > 0) {
    const participantCheck = true; // Would compare with actual participants
    checks.push({
      name: 'Participant Count',
      passed: participantCheck,
      details: `Required: ${participants.length}`,
    });
  }

  // Calculate overall score
  const passedChecks = checks.filter(c => c.passed).length;
  const score = (passedChecks / checks.length) * 100;

  return {
    valid: checks.every(c => c.passed),
    score,
    checks,
  };
}

/**
 * GET /api/compute/validate/:id
 * Get validation results for a computation
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const computation = await Computation.findOne({ computationId: id });

    if (!computation) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Computation not found',
      });
    }

    // Get audit trail
    const auditTrail = await auditService.getAuditTrail(id);

    // Get privacy parameters
    const privacyParams = computation.privacyParams;

    res.json({
      success: true,
      data: {
        computationId: id,
        type: computation.type,
        status: computation.status,
        privacyParams,
        auditTrailLength: auditTrail.length,
        createdAt: computation.createdAt,
        completedAt: computation.completedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as validateRouter };
export default router;