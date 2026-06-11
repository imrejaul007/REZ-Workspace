import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { customerAgent } from '../../services';
import { logger } from '../../utils/logger';
import { validate } from '../../middleware/validate';
import { aiLimiter } from '../../middleware/rateLimit';

const router = Router();

const customerProfileSchema = z.object({
  customerId: z.string(),
});

// POST /api/ai/customer/profile - Get customer 360
router.post('/profile', aiLimiter, validate(customerProfileSchema), async (req: Request, res: Response) => {
  try {
    const { customerId } = req.body;

    logger.info('Customer 360 profile requested', { customerId });

    const profile = await customerAgent.getCustomer360(customerId);

    if (!profile) {
      res.status(404).json({
        success: false,
        error: 'Customer not found',
        code: 'CUSTOMER_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    logger.error('Customer 360 profile failed', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get customer profile',
      code: 'CUSTOMER_PROFILE_ERROR',
    });
  }
});

// GET /api/ai/customer/segments - Get customer segments
router.get('/segments', aiLimiter, async (req: Request, res: Response) => {
  try {
    const segments = await customerAgent.getCustomerSegments();

    res.json({
      success: true,
      data: segments,
    });
  } catch (error) {
    logger.error('Get customer segments failed', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get customer segments',
      code: 'SEGMENTS_ERROR',
    });
  }
});

// GET /api/ai/customer/churn/:customerId - Predict churn risk
router.get('/churn/:customerId', aiLimiter, async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;

    const churnRisk = await customerAgent.predictChurnRisk(customerId);

    res.json({
      success: true,
      data: churnRisk,
    });
  } catch (error) {
    logger.error('Predict churn risk failed', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to predict churn risk',
      code: 'CHURN_PREDICTION_ERROR',
    });
  }
});

export default router;