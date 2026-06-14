import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { fraudDetectionService } from '../services/fraud-detection.service';
import { createLogger } from '../utils/logger';

const router = Router();
const logger = createLogger('FraudRoutes');

// Validation schemas
const FraudCheckSchema = z.object({
  eventType: z.enum(['impression', 'click', 'view', 'conversion']),
  sessionId: z.string().uuid(),
  userId: z.string().optional(),
  ipAddress: z.string(),
  userAgent: z.string(),
  timestamp: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
  adId: z.string().optional(),
  campaignId: z.string().optional(),
  creativeId: z.string().optional(),
});

const BulkCheckSchema = z.object({
  events: z.array(FraudCheckSchema).min(1).max(100),
});

// Single fraud check
router.post('/check', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = FraudCheckSchema.parse(req.body);

    const result = await fraudDetectionService.check(event);

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

// Bulk fraud check
router.post('/check/bulk', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { events } = BulkCheckSchema.parse(req.body);

    const result = await fraudDetectionService.checkBulk(events);

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

// Get cached result
router.get('/result/:sessionId', (req: Request, res: Response) => {
  const { sessionId } = req.params;

  const result = fraudDetectionService.getCachedResult(sessionId);

  if (!result) {
    res.status(404).json({
      success: false,
      error: 'Result not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.json({
    success: true,
    data: result,
    timestamp: new Date().toISOString(),
  });
});

// Get session info
router.get('/session/:sessionId', (req: Request, res: Response) => {
  const { sessionId } = req.params;

  const session = fraudDetectionService.getSession(sessionId);

  if (!session) {
    res.status(404).json({
      success: false,
      error: 'Session not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.json({
    success: true,
    data: {
      sessionId: session.sessionId,
      startTime: session.startTime,
      lastActivity: session.lastActivity,
      eventCount: session.events.length,
      clickCount: session.clickCount,
      impressionCount: session.impressionCount,
      uniqueIPs: session.ipAddresses.size,
    },
    timestamp: new Date().toISOString(),
  });
});

// Clear session
router.delete('/session/:sessionId', (req: Request, res: Response) => {
  const { sessionId } = req.params;

  fraudDetectionService.clearSession(sessionId);

  res.json({
    success: true,
    message: `Session ${sessionId} cleared`,
    timestamp: new Date().toISOString(),
  });
});

// Get service stats
router.get('/stats', (req: Request, res: Response) => {
  const stats = fraudDetectionService.getStats();

  res.json({
    success: true,
    data: stats,
    timestamp: new Date().toISOString(),
  });
});

export default router;
