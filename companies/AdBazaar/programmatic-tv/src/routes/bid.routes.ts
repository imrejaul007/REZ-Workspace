import { Router, Request, Response } from 'express';
import {
  validateBidRequest,
  validateBatchBidRequest,
} from '../middleware/validation.js';
import {
  authenticate,
  serviceAuth,
} from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimit.js';
import { getBidService } from '../services/index.js';
import { CTVBidRequest, BatchBidRequest, BatchBidResponse } from '../types/index.js';

const router = Router();

// POST /api/bid - Process OpenRTB bid request
router.post(
  '/',
  serviceAuth,
  rateLimiter('bid'),
  validateBidRequest,
  async (req: Request, res: Response) => {
    try {
      const bidService = getBidService();
      const request = req.body as CTVBidRequest;

      const context = {
        seatId: req.auth?.seatId || 'default',
        advertiserId: req.auth?.advertiserId || '',
        timestamp: new Date(),
      };

      const response = await bidService.processBidRequest(request, context);

      res.json(response);
    } catch (error) {
      logger.error('Bid request error:', error);
      res.status(500).json({
        id: req.body?.id || 'unknown',
        nbr: 0, // General error
        ext: {
          error: 'Internal server error',
        },
      });
    }
  }
);

// POST /api/bid/batch - Process batch bid requests
router.post(
  '/batch',
  serviceAuth,
  rateLimiter('bid'),
  validateBatchBidRequest,
  async (req: Request, res: Response) => {
    try {
      const bidService = getBidService();
      const batchRequest = req.body as BatchBidRequest;

      const context = {
        seatId: req.auth?.seatId || 'default',
        advertiserId: req.auth?.advertiserId || '',
        timestamp: new Date(),
      };

      const responses = await bidService.processBatchRequests(
        batchRequest.requests,
        context,
        batchRequest.options
      );

      const batchResponse: BatchBidResponse = {
        requestId: batchRequest.requestId,
        responses,
      };

      res.json(batchResponse);
    } catch (error) {
      logger.error('Batch bid request error:', error);
      res.status(500).json({
        requestId: req.body?.requestId || 'unknown',
        responses: [],
        errors: [
          {
            requestId: req.body?.requestId || 'unknown',
            error: 'Internal server error',
          },
        ],
      });
    }
  }
);

// GET /api/bid/health - Bid service health check
router.get('/health', async (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

export default router;