import { Router, Request, Response, NextFunction } from 'express';
import { exitService } from '../services/exitService';

const router = Router();

// Error handling wrapper
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * POST /api/exit/generate
 * Generate an exit code for a completed session
 */
router.post(
  '/generate',
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.body;

    if (!sessionId) {
      res.status(400).json({
        success: false,
        error: 'sessionId is required',
      });
      return;
    }

    try {
      const exitCode = await exitService.generateExitCode(sessionId);

      res.json({
        success: true,
        data: {
          sessionId,
          exitCode,
          message: 'Exit code generated successfully',
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate exit code',
      });
    }
  })
);

/**
 * POST /api/exit/validate
 * Validate an exit code at the gate
 */
router.post(
  '/validate',
  asyncHandler(async (req: Request, res: Response) => {
    const { exitCode } = req.body;

    if (!exitCode) {
      res.status(400).json({
        success: false,
        error: 'exitCode is required',
      });
      return;
    }

    const result = await exitService.validateExit(exitCode);

    if (result.valid) {
      res.json({
        success: true,
        data: {
          valid: true,
          sessionId: result.sessionId,
          storeId: result.storeId,
          transactionId: result.transactionId,
          amount: result.amount,
          itemCount: result.itemCount,
          message: result.message,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        data: {
          valid: false,
          message: result.message,
        },
      });
    }
  })
);

/**
 * POST /api/exit/record
 * Record an exit validation event
 */
router.post(
  '/record',
  asyncHandler(async (req: Request, res: Response) => {
    const { exitCode, validatedBy } = req.body;

    if (!exitCode) {
      res.status(400).json({
        success: false,
        error: 'exitCode is required',
      });
      return;
    }

    const record = await exitService.recordExit(
      exitCode,
      validatedBy === 'guard' ? 'guard' : 'system'
    );

    if (record) {
      res.json({
        success: true,
        data: {
          exitCode: record.exitCode,
          sessionId: record.sessionId,
          storeId: record.storeId,
          transactionId: record.transactionId,
          validatedAt: record.validatedAt,
          validatedBy: record.validatedBy,
          message: 'Exit recorded successfully',
        },
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to record exit. Code may be invalid or already used.',
      });
    }
  })
);

/**
 * GET /api/exit/history/:storeId
 * Get exit history for a store
 */
router.get(
  '/history/:storeId',
  asyncHandler(async (req: Request, res: Response) => {
    const { storeId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!storeId) {
      res.status(400).json({
        success: false,
        error: 'storeId is required',
      });
      return;
    }

    const history = await exitService.getExitHistory(storeId, limit);

    res.json({
      success: true,
      data: {
        storeId,
        count: history.length,
        exits: history,
      },
    });
  })
);

/**
 * GET /api/exit/:exitCode
 * Get exit record details
 */
router.get(
  '/:exitCode',
  asyncHandler(async (req: Request, res: Response) => {
    const { exitCode } = req.params;

    if (!exitCode) {
      res.status(400).json({
        success: false,
        error: 'exitCode is required',
      });
      return;
    }

    const record = await exitService.getExitRecord(exitCode);

    if (record) {
      res.json({
        success: true,
        data: record,
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Exit record not found',
      });
    }
  })
);

/**
 * POST /api/exit/resend
 * Resend exit code (regenerate if expired)
 */
router.post(
  '/resend',
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.body;

    if (!sessionId) {
      res.status(400).json({
        success: false,
        error: 'sessionId is required',
      });
      return;
    }

    try {
      const exitCode = await exitService.resendExitCode(sessionId);

      res.json({
        success: true,
        data: {
          sessionId,
          exitCode,
          message: 'Exit code resent successfully',
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to resend exit code',
      });
    }
  })
);

/**
 * POST /api/exit/qr/generate
 * Generate QR code payload for exit
 */
router.post(
  '/qr/generate',
  asyncHandler(async (req: Request, res: Response) => {
    const { exitCode } = req.body;

    if (!exitCode) {
      res.status(400).json({
        success: false,
        error: 'exitCode is required',
      });
      return;
    }

    const payload = exitService.generateQRPayload(exitCode);

    res.json({
      success: true,
      data: {
        exitCode,
        qrPayload: payload,
        message: 'QR payload generated successfully',
      },
    });
  })
);

/**
 * POST /api/exit/qr/validate
 * Validate QR code payload
 */
router.post(
  '/qr/validate',
  asyncHandler(async (req: Request, res: Response) => {
    const { payload } = req.body;

    if (!payload) {
      res.status(400).json({
        success: false,
        error: 'payload is required',
      });
      return;
    }

    const parsed = exitService.parseQRPayload(payload);

    if (parsed) {
      // Validate the exit code
      const validation = await exitService.validateExit(parsed.code);

      res.json({
        success: true,
        data: {
          valid: validation.valid,
          exitCode: parsed.code,
          timestamp: parsed.timestamp,
          ...(validation.valid ? {
            sessionId: validation.sessionId,
            storeId: validation.storeId,
            amount: validation.amount,
            itemCount: validation.itemCount,
          } : {}),
          message: validation.message,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid QR code payload',
      });
    }
  })
);

export default router;
