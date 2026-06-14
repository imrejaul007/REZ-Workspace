// Insights Routes
// Endpoints for AI decision insights

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  decisionCardsService,
  healthScoreService,
  anomalyDetectionService,
} from '../services/index.js';
import { TenantContext, ApiResponse } from '../types/index.js';

const router = Router();

// Schema validation
const tenantContextSchema = z.object({
  tenantId: z.string().min(1),
  userId: z.string().optional(),
  role: z.string().optional(),
});

// Middleware to extract tenant context
const extractTenantContext = (req: Request): TenantContext => {
  // In production, extract from JWT token
  const tenantId = req.headers['x-tenant-id'] as string || 'default';
  const userId = req.headers['x-user-id'] as string;
  const role = req.headers['x-user-role'] as string;

  return { tenantId, userId, role };
};

// GET /api/v1/insights/cards
// Get AI decision cards
router.get('/cards', async (req: Request, res: Response) => {
  try {
    const context = extractTenantContext(req);
    const result = await decisionCardsService.generateCards(context.tenantId);

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      timestamp: new Date(),
    };

    res.json(response);
  } catch (error) {
    logger.error('Error generating decision cards:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate decision cards',
      timestamp: new Date(),
    });
  }
});

// GET /api/v1/insights/cards/:id
// Get specific decision card
router.get('/cards/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const card = await decisionCardsService.getCard(id);

    if (!card) {
      res.status(404).json({
        success: false,
        error: 'Card not found',
        timestamp: new Date(),
      });
      return;
    }

    res.json({
      success: true,
      data: card,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error getting decision card:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get decision card',
      timestamp: new Date(),
    });
  }
});

// DELETE /api/v1/insights/cards/:id
// Dismiss a decision card
router.delete('/cards/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const context = extractTenantContext(req);

    const dismissed = await decisionCardsService.dismissCard(id, context.tenantId);

    if (!dismissed) {
      res.status(404).json({
        success: false,
        error: 'Card not found',
        timestamp: new Date(),
      });
      return;
    }

    res.json({
      success: true,
      message: 'Card dismissed',
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error dismissing card:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to dismiss card',
      timestamp: new Date(),
    });
  }
});

// PUT /api/v1/insights/cards/:id/snooze
// Snooze a decision card
router.put('/cards/:id/snooze', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { hours = 24 } = req.body;

    const card = await decisionCardsService.snoozeCard(id, hours);

    if (!card) {
      res.status(404).json({
        success: false,
        error: 'Card not found',
        timestamp: new Date(),
      });
      return;
    }

    res.json({
      success: true,
      data: card,
      message: `Card snoozed for ${hours} hours`,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error snoozing card:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to snooze card',
      timestamp: new Date(),
    });
  }
});

// GET /api/v1/insights/health
// Get workforce health score
router.get('/health', async (req: Request, res: Response) => {
  try {
    const context = extractTenantContext(req);
    const healthScore = await healthScoreService.calculateHealthScore(context.tenantId);

    res.json({
      success: true,
      data: healthScore,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error calculating health score:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate health score',
      timestamp: new Date(),
    });
  }
});

// GET /api/v1/insights/health/departments
// Get department comparison
router.get('/health/departments', async (req: Request, res: Response) => {
  try {
    const context = extractTenantContext(req);
    const deptComparison = await healthScoreService.getDepartmentComparison(context.tenantId);

    res.json({
      success: true,
      data: deptComparison,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error getting department comparison:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get department comparison',
      timestamp: new Date(),
    });
  }
});

// GET /api/v1/insights/health/history
// Get health score history
router.get('/health/history', async (req: Request, res: Response) => {
  try {
    const context = extractTenantContext(req);
    const days = parseInt(req.query.days as string) || 30;
    const history = await healthScoreService.getHealthHistory(context.tenantId, days);

    res.json({
      success: true,
      data: history,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error getting health history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get health history',
      timestamp: new Date(),
    });
  }
});

// GET /api/v1/insights/anomalies
// Get active anomalies
router.get('/anomalies', async (req: Request, res: Response) => {
  try {
    const context = extractTenantContext(req);
    const result = await anomalyDetectionService.detectAnomalies(context.tenantId);

    res.json({
      success: true,
      data: result,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error detecting anomalies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to detect anomalies',
      timestamp: new Date(),
    });
  }
});

// GET /api/v1/insights/anomalies/active
// Get active (unacknowledged) anomalies
router.get('/anomalies/active', async (req: Request, res: Response) => {
  try {
    const context = extractTenantContext(req);
    const anomalies = await anomalyDetectionService.getActiveAnomalies(context.tenantId);

    res.json({
      success: true,
      data: anomalies,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error getting active anomalies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get active anomalies',
      timestamp: new Date(),
    });
  }
});

// PUT /api/v1/insights/anomalies/:id/acknowledge
// Acknowledge an anomaly
router.put('/anomalies/:id/acknowledge', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const context = extractTenantContext(req);

    const acknowledged = await anomalyDetectionService.acknowledgeAnomaly(id, context.tenantId);

    if (!acknowledged) {
      res.status(404).json({
        success: false,
        error: 'Anomaly not found',
        timestamp: new Date(),
      });
      return;
    }

    res.json({
      success: true,
      message: 'Anomaly acknowledged',
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error acknowledging anomaly:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to acknowledge anomaly',
      timestamp: new Date(),
    });
  }
});

// GET /api/v1/insights/anomalies/history
// Get anomaly history
router.get('/anomalies/history', async (req: Request, res: Response) => {
  try {
    const context = extractTenantContext(req);
    const days = parseInt(req.query.days as string) || 30;
    const history = await anomalyDetectionService.getAnomalyHistory(context.tenantId, days);

    res.json({
      success: true,
      data: history,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error getting anomaly history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get anomaly history',
      timestamp: new Date(),
    });
  }
});

export default router;
