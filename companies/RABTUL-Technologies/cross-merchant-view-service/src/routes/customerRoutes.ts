// Cross-Merchant View Service - Customer Routes
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { unifiedCustomerService } from '../services/unifiedCustomerService';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const resolveCustomerSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
}).refine(data => data.email || data.phone, {
  message: 'Either email or phone is required',
});

const addActivitySchema = z.object({
  merchantId: z.string().min(1),
  merchantName: z.string().min(1),
  type: z.enum(['conversation', 'purchase', 'support', 'feedback']),
  summary: z.string().min(1).max(500),
  amount: z.number().optional(),
});

router.post('/customers/resolve', async (req: Request, res: Response) => {
  try {
    const validated = resolveCustomerSchema.parse(req.body);
    const customerId = await unifiedCustomerService.resolveCustomer(validated.email, validated.phone);
    res.json({ success: true, data: { customerId } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } });
    }
    logger.error('[CustomerRoutes] Resolve customer failed', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to resolve customer' } });
  }
});

router.get('/customers/:customerId', async (req: Request, res: Response) => {
  try {
    const customer = await unifiedCustomerService.getCustomer(req.params.customerId);
    if (!customer) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found' } });
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    logger.error('[CustomerRoutes] Get customer failed', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get customer' } });
  }
});

router.get('/customers/search', async (req: Request, res: Response) => {
  try {
    const { q, limit, offset } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_QUERY', message: 'Query parameter q required' } });
    }
    const result = await unifiedCustomerService.searchCustomers(q as string, {
      limit: limit ? parseInt(limit as string) : 20,
      offset: offset ? parseInt(offset as string) : 0,
    });
    res.json({ success: true, data: result.customers, meta: { total: result.total } });
  } catch (error) {
    logger.error('[CustomerRoutes] Search customers failed', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to search customers' } });
  }
});

router.get('/customers/:customerId/journey', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    if (req.query.startDate && isNaN(startDate!.getTime())) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_DATE', message: 'Invalid startDate format' } });
    }
    if (req.query.endDate && isNaN(endDate!.getTime())) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_DATE', message: 'Invalid endDate format' } });
    }

    const journey = await unifiedCustomerService.getCustomerJourney(req.params.customerId, startDate, endDate);
    res.json({ success: true, data: journey });
  } catch (error) {
    logger.error('[CustomerRoutes] Get journey failed', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get journey' } });
  }
});

router.post('/customers/:customerId/activity', async (req: Request, res: Response) => {
  try {
    const validated = addActivitySchema.parse(req.body);
    await unifiedCustomerService.addActivity(
      req.params.customerId,
      validated.merchantId,
      validated.merchantName,
      { type: validated.type, summary: validated.summary, timestamp: new Date(), amount: validated.amount }
    );
    res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } });
    }
    logger.error('[CustomerRoutes] Add activity failed', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to add activity' } });
  }
});

export default router;
