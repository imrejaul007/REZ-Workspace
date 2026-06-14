import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { trustSyncService } from '../services/trustSync';
import { limitEngineService } from '../services/limitEngine';
import { alertService } from '../services/alertService';
import { ApiResponse, TrustDashboardData } from '../types';
import { apiLogger as logger } from '../utils/logger';

// Validation schemas
const merchantIdSchema = z.object({
  merchantId: z.string().min(1, 'Merchant ID is required'),
});

const syncRequestSchema = z.object({
  forceSync: z.boolean().optional().default(false),
});

const batchSyncSchema = z.object({
  merchantIds: z.array(z.string().min(1)).min(1).max(100),
  forceSync: z.boolean().optional().default(false),
});

const limitRequestSchema = z.object({
  currentVolume: z.number().min(0).optional(),
  businessAge: z.number().min(0).optional(),
  requestedLimit: z.number().min(0).optional(),
});

const checkLimitSchema = z.object({
  amount: z.number().min(0),
});

const acknowledgeAlertSchema = z.object({
  alertIds: z.array(z.string()).min(1).max(100).optional(),
  merchantId: z.string().optional(),
  acknowledgedBy: z.string().min(1),
});

const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
});

export function createBridgeRouter(): Router {
  const router = Router();

  // Request wrapper
  const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };

  // Response helper
  const sendResponse = <T>(
    res: Response,
    data: T,
    status = 200
  ): void => {
    const response: ApiResponse<T> = {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
    res.status(status).json(response);
  };

  const sendError = (
    res: Response,
    code: string,
    message: string,
    status = 400,
    details?: unknown
  ): void => {
    const response: ApiResponse<null> = {
      success: false,
      error: { code, message, details },
      timestamp: new Date().toISOString(),
    };
    res.status(status).json(response);
  };

  // ============================================
  // TRUST SCORE ENDPOINTS
  // ============================================

  /**
   * GET /api/bridge/trust/:merchantId
   * Get trust score for a merchant
   */
  router.get(
    '/trust/:merchantId',
    asyncHandler(async (req: Request, res: Response) => {
      const { merchantId } = merchantIdSchema.parse(req.params);
      const trustScore = await trustSyncService.getTrustScore(merchantId);

      if (!trustScore) {
        return sendError(res, 'NOT_FOUND', `Trust score not found for merchant ${merchantId}`, 404);
      }

      sendResponse(res, trustScore);
    })
  );

  /**
   * GET /api/bridge/trust/:merchantId/history
   * Get trust score history
   */
  router.get(
    '/trust/:merchantId/history',
    asyncHandler(async (req: Request, res: Response) => {
      const { merchantId } = merchantIdSchema.parse(req.params);
      const { limit = '30' } = req.query;

      const history = await trustSyncService.getTrustHistory(
        merchantId,
        parseInt(limit as string, 10)
      );

      sendResponse(res, history);
    })
  );

  // ============================================
  // SYNC ENDPOINTS
  // ============================================

  /**
   * POST /api/bridge/sync/:merchantId
   * Sync trust data for a specific merchant
   */
  router.post(
    '/sync/:merchantId',
    asyncHandler(async (req: Request, res: Response) => {
      const { merchantId } = merchantIdSchema.parse(req.params);
      const { forceSync } = syncRequestSchema.parse(req.query);

      logger.info(`Manual sync requested for ${merchantId}`, { forceSync });

      const result = await trustSyncService.syncMerchant(merchantId, forceSync);

      if (result.status === 'FAILED') {
        return sendError(res, 'SYNC_FAILED', result.error || 'Sync failed', 500);
      }

      sendResponse(res, result, result.status === 'PARTIAL' ? 207 : 200);
    })
  );

  /**
   * POST /api/bridge/sync/batch
   * Batch sync for multiple merchants
   */
  router.post(
    '/sync/batch',
    asyncHandler(async (req: Request, res: Response) => {
      const { merchantIds, forceSync } = batchSyncSchema.parse(req.body);

      logger.info(`Batch sync requested for ${merchantIds.length} merchants`);

      const results = await Promise.all(
        merchantIds.map((merchantId) => trustSyncService.syncMerchant(merchantId, forceSync))
      );

      const successCount = results.filter((r) => r.status === 'SUCCESS').length;
      const failedCount = results.filter((r) => r.status === 'FAILED').length;
      const partialCount = results.filter((r) => r.status === 'PARTIAL').length;

      sendResponse(res, {
        results,
        summary: {
          total: merchantIds.length,
          success: successCount,
          failed: failedCount,
          partial: partialCount,
        },
      }, failedCount > 0 ? 207 : 200);
    })
  );

  /**
   * GET /api/bridge/sync/status
   * Get sync status for all sources
   */
  router.get(
    '/sync/status',
    asyncHandler(async (_req: Request, res: Response) => {
      const status = await trustSyncService.getSyncStatus();
      sendResponse(res, status);
    })
  );

  // ============================================
  // CREDIT LIMIT ENDPOINTS
  // ============================================

  /**
   * GET /api/bridge/limit/:merchantId
   * Get credit limit for a merchant
   */
  router.get(
    '/limit/:merchantId',
    asyncHandler(async (req: Request, res: Response) => {
      const { merchantId } = merchantIdSchema.parse(req.params);
      const limit = await limitEngineService.getCreditLimit(merchantId);

      if (!limit) {
        return sendError(res, 'NOT_FOUND', `Credit limit not found for merchant ${merchantId}`, 404);
      }

      sendResponse(res, limit);
    })
  );

  /**
   * POST /api/bridge/limit/:merchantId/calculate
   * Calculate credit limit based on trust score
   */
  router.post(
    '/limit/:merchantId/calculate',
    asyncHandler(async (req: Request, res: Response) => {
      const { merchantId } = merchantIdSchema.parse(req.params);
      const input = limitRequestSchema.parse(req.body);

      const trustScore = await trustSyncService.getTrustScore(merchantId);

      if (!trustScore) {
        return sendError(res, 'NOT_FOUND', `Trust score not found for merchant ${merchantId}`, 404);
      }

      const result = await limitEngineService.calculateLimit({
        merchantId,
        trustScore,
        currentVolume: input.currentVolume,
        businessAge: input.businessAge,
        requestedLimit: input.requestedLimit,
      });

      sendResponse(res, result);
    })
  );

  /**
   * POST /api/bridge/limit/:merchantId/check
   * Check if a transaction can proceed
   */
  router.post(
    '/limit/:merchantId/check',
    asyncHandler(async (req: Request, res: Response) => {
      const { merchantId } = merchantIdSchema.parse(req.params);
      const { amount } = checkLimitSchema.parse(req.body);

      const result = await limitEngineService.checkLimit(merchantId, amount);

      sendResponse(res, result);
    })
  );

  /**
   * PUT /api/bridge/limit/:merchantId/used
   * Update used limit (add/subtract)
   */
  router.put(
    '/limit/:merchantId/used',
    asyncHandler(async (req: Request, res: Response) => {
      const { merchantId } = merchantIdSchema.parse(req.params);
      const { amount, operation } = z.object({
        amount: z.number().min(0),
        operation: z.enum(['ADD', 'SUBTRACT']),
      }).parse(req.body);

      const result = await limitEngineService.updateUsedLimit(merchantId, amount, operation);

      if (!result) {
        return sendError(res, 'NOT_FOUND', `Credit limit not found for merchant ${merchantId}`, 404);
      }

      sendResponse(res, result);
    })
  );

  /**
   * GET /api/bridge/limit/:merchantId/history
   * Get limit calculation history
   */
  router.get(
    '/limit/:merchantId/history',
    asyncHandler(async (req: Request, res: Response) => {
      const { merchantId } = merchantIdSchema.parse(req.params);
      const { limit = '30' } = req.query;

      const history = await limitEngineService.getLimitHistory(
        merchantId,
        parseInt(limit as string, 10)
      );

      sendResponse(res, history);
    })
  );

  /**
   * POST /api/bridge/limit/recalculate-all
   * Recalculate limits for all merchants
   */
  router.post(
    '/limit/recalculate-all',
    asyncHandler(async (_req: Request, res: Response) => {
      logger.info('Bulk limit recalculation requested');

      const result = await limitEngineService.recalculateAllLimits();

      sendResponse(res, result);
    })
  );

  /**
   * POST /api/bridge/limit/:merchantId/unblock
   * Unblock a merchant
   */
  router.post(
    '/limit/:merchantId/unblock',
    asyncHandler(async (req: Request, res: Response) => {
      const { merchantId } = merchantIdSchema.parse(req.params);
      const { reason } = z.object({
        reason: z.string().min(1),
      }).parse(req.body);

      const success = await limitEngineService.unblockMerchant(merchantId, reason);

      sendResponse(res, { success, merchantId });
    })
  );

  // ============================================
  // ALERT ENDPOINTS
  // ============================================

  /**
   * GET /api/bridge/alerts
   * Get alerts with filtering
   */
  router.get(
    '/alerts',
    asyncHandler(async (req: Request, res: Response) => {
      const { page, limit } = paginationSchema.parse(req.query);
      const filter = z.object({
        merchantId: z.string().optional(),
        alertType: z.enum(['TRUST_DROP', 'RISK_INCREASE', 'LIMIT_THRESHOLD', 'BLOCK_TRIGGERED', 'COMPLIANCE_ISSUE']).optional(),
        severity: z.enum(['INFO', 'WARNING', 'CRITICAL']).optional(),
        acknowledged: z.coerce.boolean().optional(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
      }).parse(req.query);

      const result = await alertService.getAlerts(
        {
          ...filter,
          startDate: filter.startDate ? new Date(filter.startDate) : undefined,
          endDate: filter.endDate ? new Date(filter.endDate) : undefined,
        },
        page,
        limit
      );

      sendResponse(res, result);
    })
  );

  /**
   * GET /api/bridge/alerts/unacknowledged
   * Get unacknowledged alerts
   */
  router.get(
    '/alerts/unacknowledged',
    asyncHandler(async (req: Request, res: Response) => {
      const { merchantId, severity } = z.object({
        merchantId: z.string().optional(),
        severity: z.enum(['INFO', 'WARNING', 'CRITICAL']).optional(),
      }).parse(req.query);

      const alerts = await alertService.getUnacknowledgedAlerts(merchantId, severity);

      sendResponse(res, alerts);
    })
  );

  /**
   * POST /api/bridge/alerts/acknowledge
   * Acknowledge alerts
   */
  router.post(
    '/alerts/acknowledge',
    asyncHandler(async (req: Request, res: Response) => {
      const { alertIds, merchantId, acknowledgedBy } = acknowledgeAlertSchema.parse(req.body);

      let count = 0;

      if (alertIds && alertIds.length > 0) {
        count = await alertService.acknowledgeAlerts(alertIds, acknowledgedBy);
      } else if (merchantId) {
        count = await alertService.acknowledgeMerchantAlerts(merchantId, acknowledgedBy);
      } else {
        return sendError(res, 'INVALID_REQUEST', 'Either alertIds or merchantId is required', 400);
      }

      sendResponse(res, { acknowledged: count });
    })
  );

  /**
   * GET /api/bridge/alerts/stats
   * Get alert statistics
   */
  router.get(
    '/alerts/stats',
    asyncHandler(async (req: Request, res: Response) => {
      const { startDate, endDate } = z.object({
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
      }).parse(req.query);

      const stats = await alertService.getAlertStats(
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );

      sendResponse(res, stats);
    })
  );

  // ============================================
  // DASHBOARD ENDPOINT
  // ============================================

  /**
   * GET /api/bridge/dashboard/:merchantId
   * Get trust dashboard data for a merchant
   */
  router.get(
    '/dashboard/:merchantId',
    asyncHandler(async (req: Request, res: Response) => {
      const { merchantId } = merchantIdSchema.parse(req.params);

      const trustScore = await trustSyncService.getTrustScore(merchantId);
      const creditLimit = await limitEngineService.getCreditLimit(merchantId);
      const recentAlerts = await alertService.getUnacknowledgedAlerts(merchantId);
      const history = await trustSyncService.getTrustHistory(merchantId, 30);

      if (!trustScore) {
        return sendError(res, 'NOT_FOUND', `Trust data not found for merchant ${merchantId}`, 404);
      }

      // Calculate trend
      let trend: 'IMPROVING' | 'STABLE' | 'DECLINING' = 'STABLE';
      if (history.length >= 2) {
        const recent = history.slice(-5);
        const oldAvg = recent.slice(0, Math.floor(recent.length / 2))
          .reduce((sum, h) => sum + h.score, 0) / (recent.length / 2);
        const newAvg = recent.slice(Math.floor(recent.length / 2))
          .reduce((sum, h) => sum + h.score, 0) / (recent.length / 2);

        if (newAvg > oldAvg + 2) {
          trend = 'IMPROVING';
        } else if (newAvg < oldAvg - 2) {
          trend = 'DECLINING';
        }
      }

      const dashboardData: TrustDashboardData = {
        merchantId,
        businessName: (trustScore.metadata?.businessName as string) || merchantId,
        trustScore: trustScore.score,
        riskLevel: trustScore.riskLevel,
        creditLimit: creditLimit || {
          merchantId,
          currentLimit: 0,
          availableLimit: 0,
          usedLimit: 0,
          creditUtilization: 0,
          lastCalculated: new Date().toISOString(),
        },
        factors: trustScore.factors,
        recentAlerts: recentAlerts.slice(0, 10),
        trend,
        lastSynced: trustScore.lastUpdated,
      };

      sendResponse(res, dashboardData);
    })
  );

  // ============================================
  // HEALTH ENDPOINT
  // ============================================

  /**
   * GET /api/bridge/health
   * Health check endpoint
   */
  router.get('/health', (_req: Request, res: Response) => {
    sendResponse(res, {
      status: 'healthy',
      service: 'rez-merchant-trust-bridge',
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}

export default createBridgeRouter;
