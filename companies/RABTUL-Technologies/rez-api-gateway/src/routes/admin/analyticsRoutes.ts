/**
 * Admin Analytics Routes with Server-Side Pagination
 *
 * Implements efficient data fetching with pagination and filtering
 * to reduce client-side memory usage and improve load times.
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAdmin } from '../../shared/authMiddleware';
import { logger } from '../../config/logger';

const router = Router();

// Apply admin authentication to all routes
router.use(requireAdmin);

// Validation schemas
const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

const orderFiltersSchema = paginationSchema.extend({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']).optional(),
  merchantId: z.string().optional(),
});

const merchantFiltersSchema = paginationSchema.extend({
  status: z.enum(['active', 'pending', 'suspended', 'rejected']).optional(),
  category: z.string().optional(),
});

const userFiltersSchema = paginationSchema.extend({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
});

const transactionFiltersSchema = paginationSchema.extend({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(['pending', 'completed', 'failed', 'refunded']).optional(),
  merchantId: z.string().optional(),
});

// ============================================
// HELPERS
// ============================================

/**
 * Build MongoDB-style query from filters
 */
function buildQuery(filters: Record<string, any>): Record<string, any> {
  const query: Record<string, any> = {};

  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
  }

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.merchantId) {
    query.merchantId = filters.merchantId;
  }

  return query;
}

/**
 * Calculate pagination metadata
 */
function getPaginationMeta(page: number, limit: number, total: number) {
  const pages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    pages,
    hasNext: page < pages,
    hasPrev: page > 1,
  };
}

// ============================================
// DEMO DATA GENERATORS
// ============================================

// Generate demo orders
function generateDemoOrders(count: number, filters: any) {
  const statuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
  const orders = [];

  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));

    const order = {
      id: `ORD${Date.now()}-${i}`,
      orderNumber: `RZ${String(100000 + i).padStart(6, '0')}`,
      status: filters.status || statuses[Math.floor(Math.random() * statuses.length)],
      total: Math.floor(Math.random() * 5000) + 100,
      itemCount: Math.floor(Math.random() * 10) + 1,
      merchantId: filters.merchantId || `MCH${Math.floor(Math.random() * 100)}`,
      userId: `USR${Math.floor(Math.random() * 10000)}`,
      createdAt: date.toISOString(),
      updatedAt: date.toISOString(),
    };
    orders.push(order);
  }

  return orders;
}

// Generate demo merchants
function generateDemoMerchants(count: number, filters: any) {
  const statuses = ['active', 'pending', 'suspended', 'rejected'];
  const categories = ['restaurant', 'grocery', 'pharmacy', 'electronics', 'fashion'];
  const merchants = [];

  const businessNames = [
    'Taj Palace', 'Spice Garden', 'Quick Mart', 'Health Plus', 'Tech Hub',
    'Fashion Forward', 'Fresh Foods', 'Delight Bakery', 'Urban Style', 'Smart Buy',
  ];

  for (let i = 0; i < count; i++) {
    const merchant = {
      id: `MCH${1000 + i}`,
      name: businessNames[i % businessNames.length] + ` ${i + 1}`,
      category: filters.category || categories[Math.floor(Math.random() * categories.length)],
      status: filters.status || statuses[Math.floor(Math.random() * statuses.length)],
      revenue: Math.floor(Math.random() * 100000) + 10000,
      orders: Math.floor(Math.random() * 1000) + 100,
      rating: (3.5 + Math.random() * 1.5).toFixed(1),
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    };
    merchants.push(merchant);
  }

  return merchants;
}

// Generate demo users
function generateDemoUsers(count: number, filters: any) {
  const statuses = ['active', 'inactive', 'suspended'];
  const users = [];

  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 365));

    const user = {
      id: `USR${10000 + i}`,
      name: `User ${10000 + i}`,
      email: `user${10000 + i}@example.com`,
      phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      status: filters.status || statuses[Math.floor(Math.random() * statuses.length)],
      totalOrders: Math.floor(Math.random() * 100),
      totalSpent: Math.floor(Math.random() * 50000),
      createdAt: date.toISOString(),
      lastActiveAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    users.push(user);
  }

  return users;
}

// Generate demo transactions
function generateDemoTransactions(count: number, filters: any) {
  const statuses = ['pending', 'completed', 'failed', 'refunded'];
  const types = ['credit', 'debit'];
  const transactions = [];

  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));

    const transaction = {
      id: `TXN${Date.now()}-${i}`,
      type: types[Math.floor(Math.random() * types.length)],
      amount: Math.floor(Math.random() * 10000) + 100,
      status: filters.status || statuses[Math.floor(Math.random() * statuses.length)],
      merchantId: filters.merchantId || `MCH${Math.floor(Math.random() * 100)}`,
      userId: `USR${Math.floor(Math.random() * 10000)}`,
      paymentMethod: ['upi', 'netbanking', 'card', 'wallet'][Math.floor(Math.random() * 4)],
      createdAt: date.toISOString(),
    };
    transactions.push(transaction);
  }

  return transactions;
}

// ============================================
// ROUTES
// ============================================

/**
 * Get paginated orders
 * GET /admin/analytics/orders
 */
router.get('/orders', async (req: Request, res: Response) => {
  try {
    const parsed = orderFiltersSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.errors[0].message,
      });
    }

    const { page, limit, startDate, endDate, status, merchantId } = parsed.data;
    const filters = { startDate, endDate, status, merchantId };

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Generate demo data (in production, this would query the database)
    const total = 1000; // Simulated total count
    const orders = generateDemoOrders(limit, filters);

    logger.info('[Analytics] Get paginated orders', {
      adminId: (req as any).adminId,
      page,
      limit,
      filters,
    });

    res.json({
      success: true,
      data: orders,
      pagination: getPaginationMeta(page, limit, total),
    });
  } catch (error: any) {
    logger.error('[Analytics] Get orders error:', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});

/**
 * Get paginated merchants
 * GET /admin/analytics/merchants
 */
router.get('/merchants', async (req: Request, res: Response) => {
  try {
    const parsed = merchantFiltersSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.errors[0].message,
      });
    }

    const { page, limit, status, category } = parsed.data;
    const filters = { status, category };

    const total = 500; // Simulated total
    const merchants = generateDemoMerchants(limit, filters);

    logger.info('[Analytics] Get paginated merchants', {
      adminId: (req as any).adminId,
      page,
      limit,
      filters,
    });

    res.json({
      success: true,
      data: merchants,
      pagination: getPaginationMeta(page, limit, total),
    });
  } catch (error: any) {
    logger.error('[Analytics] Get merchants error:', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to fetch merchants' });
  }
});

/**
 * Get paginated users
 * GET /admin/analytics/users
 */
router.get('/users', async (req: Request, res: Response) => {
  try {
    const parsed = userFiltersSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.errors[0].message,
      });
    }

    const { page, limit, startDate, endDate, status } = parsed.data;
    const filters = { startDate, endDate, status };

    const total = 5000; // Simulated total
    const users = generateDemoUsers(limit, filters);

    logger.info('[Analytics] Get paginated users', {
      adminId: (req as any).adminId,
      page,
      limit,
      filters,
    });

    res.json({
      success: true,
      data: users,
      pagination: getPaginationMeta(page, limit, total),
    });
  } catch (error: any) {
    logger.error('[Analytics] Get users error:', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

/**
 * Get paginated transactions
 * GET /admin/analytics/transactions
 */
router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const parsed = transactionFiltersSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.errors[0].message,
      });
    }

    const { page, limit, startDate, endDate, status, merchantId } = parsed.data;
    const filters = { startDate, endDate, status, merchantId };

    const total = 2000; // Simulated total
    const transactions = generateDemoTransactions(limit, filters);

    logger.info('[Analytics] Get paginated transactions', {
      adminId: (req as any).adminId,
      page,
      limit,
      filters,
    });

    res.json({
      success: true,
      data: transactions,
      pagination: getPaginationMeta(page, limit, total),
    });
  } catch (error: any) {
    logger.error('[Analytics] Get transactions error:', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
  }
});

/**
 * Request data export (generates downloadable file)
 * POST /admin/analytics/export
 */
const exportSchema = z.object({
  type: z.enum(['orders', 'merchants', 'users', 'transactions']),
  filters: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    status: z.string().optional(),
    category: z.string().optional(),
    merchantId: z.string().optional(),
  }).optional(),
});

router.post('/export', async (req: Request, res: Response) => {
  try {
    const parsed = exportSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.errors[0].message,
      });
    }

    const { type, filters = {} } = parsed.data;

    // In production, this would trigger a background job to generate the export
    // For now, return a simulated download URL
    const downloadUrl = `/exports/${type}_${Date.now()}.csv`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    logger.info('[Analytics] Export requested', {
      adminId: (req as any).adminId,
      type,
      filters,
    });

    res.json({
      success: true,
      data: {
        downloadUrl,
        expiresAt,
      },
    });
  } catch (error: any) {
    logger.error('[Analytics] Export error:', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to generate export' });
  }
});

export default router;
