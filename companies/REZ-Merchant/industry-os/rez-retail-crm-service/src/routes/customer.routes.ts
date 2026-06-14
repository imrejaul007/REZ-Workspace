import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { customerService } from '../services/customer.service';
import { CustomerSchema, LoyaltyTier } from '../types';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const createCustomerSchema = CustomerSchema.omit({
  id: true,
  purchaseHistory: true,
  totalSpent: true,
  totalOrders: true,
  averageOrderValue: true,
  lastPurchaseDate: true,
  firstPurchaseDate: true,
  createdAt: true,
  updatedAt: true,
});

const updateCustomerSchema = createCustomerSchema.partial();

const addressSchema = z.object({
  type: z.enum(['billing', 'shipping', 'both']).default('both'),
  name: z.string().min(1),
  phone: z.string().optional(),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string(),
  state: z.string(),
  postalCode: z.string(),
  country: z.string().default('India'),
  isDefault: z.boolean().default(false),
});

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  loyaltyTier: z.nativeEnum(LoyaltyTier).optional(),
  tags: z.string().optional().transform(val => val?.split(',').filter(Boolean)),
  isActive: z.coerce.boolean().optional(),
  isVerified: z.coerce.boolean().optional(),
  minTotalSpent: z.coerce.number().positive().optional(),
  maxTotalSpent: z.coerce.number().positive().optional(),
});

/**
 * GET /api/customers
 * List customers with filters
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const query = querySchema.parse(req.query);
    const filter = {
      search: query.search,
      loyaltyTier: query.loyaltyTier,
      tags: query.tags,
      isActive: query.isActive,
      isVerified: query.isVerified,
      minTotalSpent: query.minTotalSpent,
      maxTotalSpent: query.maxTotalSpent,
    };

    const result = await customerService.listCustomers(filter, query.page, query.limit);

    res.json({
      success: true,
      data: result.customers,
      pagination: {
        page: result.page,
        limit: query.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    logger.error('Error listing customers:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

/**
 * GET /api/customers/top
 * Get top customers by spending
 */
router.get('/top', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const customers = await customerService.getTopCustomers(limit);
    res.json({ success: true, data: customers });
  } catch (error) {
    logger.error('Error fetching top customers:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/customers/stats
 * Get customer statistics
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await customerService.getCustomerStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error fetching customer stats:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/customers/:id
 * Get customer by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const customer = await customerService.getCustomerById(req.params.id);

    if (!customer) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    logger.error('Error fetching customer:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/customers/user/:userId
 * Get customer by user ID
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const customer = await customerService.getCustomerByUserId(req.params.userId);

    if (!customer) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    logger.error('Error fetching customer:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/customers
 * Create a new customer
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validated = createCustomerSchema.parse(req.body);
    const customer = await customerService.createCustomer(validated);

    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    logger.error('Error creating customer:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

/**
 * PUT /api/customers/:id
 * Update a customer
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const validated = updateCustomerSchema.parse(req.body);
    const customer = await customerService.updateCustomer(req.params.id, validated);

    if (!customer) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    logger.error('Error updating customer:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

/**
 * DELETE /api/customers/:id
 * Delete a customer (soft delete)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await customerService.deleteCustomer(req.params.id);

    if (!deleted) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }

    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    logger.error('Error deleting customer:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/customers/:id/purchases
 * Add purchase to customer history
 */
router.post('/:id/purchases', async (req: Request, res: Response) => {
  try {
    const { orderId, total, items, pointsEarned } = z.object({
      orderId: z.string(),
      total: z.number().min(0),
      items: z.number().int().positive(),
      pointsEarned: z.number().int().min(0).optional(),
    }).parse(req.body);

    const customer = await customerService.addPurchase(
      req.params.id,
      orderId,
      total,
      items,
      pointsEarned
    );

    if (!customer) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    logger.error('Error adding purchase:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

/**
 * POST /api/customers/:id/addresses
 * Add address to customer
 */
router.post('/:id/addresses', async (req: Request, res: Response) => {
  try {
    const validated = addressSchema.parse(req.body);
    const customer = await customerService.addAddress(req.params.id, validated);

    if (!customer) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }

    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    logger.error('Error adding address:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

/**
 * PUT /api/customers/:id/preferences
 * Update customer preferences
 */
router.put('/:id/preferences', async (req: Request, res: Response) => {
  try {
    const preferences = z.object({
      newsletter: z.boolean().optional(),
      smsNotifications: z.boolean().optional(),
      pushNotifications: z.boolean().optional(),
      preferredContact: z.enum(['email', 'sms', 'phone', 'whatsapp']).optional(),
      language: z.string().optional(),
      currency: z.string().optional(),
    }).parse(req.body);

    const customer = await customerService.updatePreferences(req.params.id, preferences);

    if (!customer) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    logger.error('Error updating preferences:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

/**
 * POST /api/customers/:id/points
 * Add loyalty points
 */
router.post('/:id/points', async (req: Request, res: Response) => {
  try {
    const { points } = z.object({
      points: z.number().int().positive(),
    }).parse(req.body);

    const customer = await customerService.addLoyaltyPoints(req.params.id, points);

    if (!customer) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    logger.error('Error adding points:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

/**
 * POST /api/customers/:id/points/redeem
 * Redeem loyalty points
 */
router.post('/:id/points/redeem', async (req: Request, res: Response) => {
  try {
    const { points } = z.object({
      points: z.number().int().positive(),
    }).parse(req.body);

    const customer = await customerService.redeemLoyaltyPoints(req.params.id, points);

    if (!customer) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    logger.error('Error redeeming points:', error);
    if (error instanceof Error && error.message === 'Insufficient loyalty points') {
      res.status(400).json({ success: false, error: error.message });
    } else if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

/**
 * POST /api/customers/:id/tags
 * Add tag to customer
 */
router.post('/:id/tags', async (req: Request, res: Response) => {
  try {
    const { tag } = z.object({
      tag: z.string().min(1).max(50),
    }).parse(req.body);

    const customer = await customerService.addTag(req.params.id, tag);

    if (!customer) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    logger.error('Error adding tag:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

export default router;
