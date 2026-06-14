/**
 * Customer 360 API Routes
 * Provides unified customer data endpoints for the Customer 360 view.
 */
import { Router, Request, Response } from 'express';
import { customer360Service } from '../services/customer360Service';
import { merchantAuth } from '../middleware/auth';
import { logger } from '../config/logger';

const router = Router();
router.use(merchantAuth);

// userId validation pattern
const VALID_USER_ID = /^[a-zA-Z0-9_-]{1,128}$/;

function validateUserId(userId: string, res: Response): boolean {
  if (!userId || typeof userId !== 'string' || !VALID_USER_ID.test(userId)) {
    res.status(400).json({ success: false, message: 'Invalid userId format' });
    return false;
  }
  return true;
}

function handleError(err, res: Response, requestId?: string): void {
  const msg = process.env.NODE_ENV === 'production'
    ? `An error occurred. Reference: ${requestId || 'unknown'}`
    : err.message;
  logger.error('[customer360] Error:', { error: err.message, stack: err.stack });
  res.status(500).json({ success: false, message: msg });
}

/**
 * GET /api/v1/merchant/customers/:id/360
 * Get complete 360 view of a customer
 */
router.get('/:userId/360', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!validateUserId(userId, res)) return;

    const customer360 = await customer360Service.getCustomer360(userId, req.merchantId);

    res.json({
      success: true,
      data: customer360,
    });
  } catch (err: unknown) {
    handleError(err, res, (req as unknown).requestId);
  }
});

/**
 * GET /api/v1/merchant/customers/:id/profile
 * Get customer profile (notes, tags, health profile)
 */
router.get('/:userId/profile', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!validateUserId(userId, res)) return;

    const profile = await customer360Service.getCustomerProfile(userId, req.merchantId);

    res.json({
      success: true,
      data: profile,
    });
  } catch (err: unknown) {
    handleError(err, res, (req as unknown).requestId);
  }
});

/**
 * GET /api/v1/merchant/customers/:id/orders
 * Get customer's order history
 */
router.get('/:userId/orders', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = '20', offset = '0' } = req.query;
    if (!validateUserId(userId, res)) return;

    const orders = await customer360Service.getCustomerOrders(
      userId,
      req.merchantId,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    res.json({
      success: true,
      data: orders,
    });
  } catch (err: unknown) {
    handleError(err, res, (req as unknown).requestId);
  }
});

/**
 * GET /api/v1/merchant/customers/:id/loyalty
 * Get customer's loyalty points and history
 */
router.get('/:userId/loyalty', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!validateUserId(userId, res)) return;

    const loyalty = await customer360Service.getCustomerLoyalty(userId, req.merchantId);

    res.json({
      success: true,
      data: loyalty,
    });
  } catch (err: unknown) {
    handleError(err, res, (req as unknown).requestId);
  }
});

/**
 * GET /api/v1/merchant/customers/:id/interactions
 * Get customer interaction history (support tickets, feedback, etc.)
 */
router.get('/:userId/interactions', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { type } = req.query;
    if (!validateUserId(userId, res)) return;

    const interactions = await customer360Service.getCustomerInteractions(
      userId,
      req.merchantId,
      type as string
    );

    res.json({
      success: true,
      data: interactions,
    });
  } catch (err: unknown) {
    handleError(err, res, (req as unknown).requestId);
  }
});

/**
 * GET /api/v1/merchant/customers/search
 * Search customers by name, email, phone
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      res.status(400).json({ success: false, message: 'Search query required' });
      return;
    }

    const results = await customer360Service.searchCustomers(q, req.merchantId);

    res.json({
      success: true,
      data: results,
    });
  } catch (err: unknown) {
    handleError(err, res, (req as unknown).requestId);
  }
});

export default router;
