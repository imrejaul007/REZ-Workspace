import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { billingService } from '../services/BillingService';

const router = Router();

// Validation middleware
const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return;
  }
  next();
};

/**
 * @route POST /api/billing
 * @desc Process a new billing transaction
 */
router.post(
  '/',
  [
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.itemId').notEmpty().withMessage('Item ID is required'),
    body('items.*.itemType').isIn(['service', 'product']).withMessage('Invalid item type'),
    body('items.*.name').notEmpty().withMessage('Item name is required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be positive'),
    body('items.*.taxRate').optional().isFloat({ min: 0, max: 100 }),
    body('payments').isArray({ min: 1 }).withMessage('At least one payment is required'),
    body('payments.*.method').isIn(['cash', 'card', 'upi', 'wallet']).withMessage('Invalid payment method'),
    body('payments.*.amount').isFloat({ min: 0 }).withMessage('Payment amount must be positive'),
    body('staffId').notEmpty().withMessage('Staff ID is required'),
    body('staffName').notEmpty().withMessage('Staff name is required'),
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const result = await billingService.processBilling(req.body);
      if (result.success) {
        res.status(201).json({
          success: true,
          data: {
            transaction: result.transaction,
            invoice: result.invoice,
          },
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * @route GET /api/billing/:transactionId
 * @desc Get transaction by ID
 */
router.get(
  '/:transactionId',
  [param('transactionId').notEmpty().withMessage('Transaction ID is required')],
  validate,
  async (req: Request, res: Response) => {
    try {
      const transaction = await billingService.getTransaction(req.params.transactionId);
      if (!transaction) {
        res.status(404).json({
          success: false,
          error: 'Transaction not found',
        });
        return;
      }
      res.json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * @route GET /api/billing
 * @desc Get transactions with filters
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const filters = {
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        staffId: req.query.staffId as string,
        customerId: req.query.customerId as string,
        status: req.query.status as string,
      };

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await billingService.getTransactions(filters, page, limit);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * @route POST /api/billing/:transactionId/refund
 * @desc Process refund for a transaction
 */
router.post(
  '/:transactionId/refund',
  [
    param('transactionId').notEmpty().withMessage('Transaction ID is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.itemId').notEmpty().withMessage('Item ID is required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('reason').notEmpty().withMessage('Refund reason is required'),
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const result = await billingService.processRefund(
        req.params.transactionId,
        req.body.items,
        req.body.reason
      );
      if (result.success) {
        res.json({
          success: true,
          data: result.transaction,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * @route GET /api/billing/reports/daily
 * @desc Get daily sales summary
 */
router.get(
  '/reports/daily',
  [query('date').optional().isISO8601()],
  validate,
  async (req: Request, res: Response) => {
    try {
      const date = req.query.date ? new Date(req.query.date as string) : new Date();
      const summary = await billingService.getDailySummary(date);
      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * @route GET /api/billing/reports/weekly
 * @desc Get weekly sales summary
 */
router.get(
  '/reports/weekly',
  [query('startDate').optional().isISO8601()],
  validate,
  async (req: Request, res: Response) => {
    try {
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : new Date();
      const summaries = await billingService.getWeeklySummary(startDate);
      res.json({
        success: true,
        data: summaries,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * @route GET /api/billing/reports/monthly
 * @desc Get monthly sales summary
 */
router.get(
  '/reports/monthly',
  [
    query('year').isInt({ min: 2020, max: 2100 }),
    query('month').isInt({ min: 1, max: 12 }),
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const year = parseInt(req.query.year as string);
      const month = parseInt(req.query.month as string);
      const summary = await billingService.getMonthlySummary(year, month);
      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * @route GET /api/billing/commission/:staffId
 * @desc Calculate staff commission
 */
router.get(
  '/commission/:staffId',
  [
    param('staffId').notEmpty().withMessage('Staff ID is required'),
    query('startDate').isISO8601().withMessage('Start date is required'),
    query('endDate').isISO8601().withMessage('End date is required'),
    query('commissionRate').optional().isFloat({ min: 0, max: 100 }),
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);
      const commissionRate = parseFloat(req.query.commissionRate as string) || 10;

      const report = await billingService.calculateCommission(
        req.params.staffId,
        startDate,
        endDate,
        commissionRate
      );
      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

export default router;
