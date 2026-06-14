/**
 * B2B Export Routes
 *
 * Handles data exports for B2B features:
 * - Supplier lists
 * - Purchase orders
 * - Aging reports
 * - Supplier statements
 */

import { Router, Request, Response } from 'express';
import { merchantAuth } from '../middleware/auth';
import { rateLimitMiddleware } from '../middleware/rateLimiter';
import {
  exportSuppliers,
  exportPurchaseOrders,
  exportAgingReport,
  exportLedger,
} from '../services/b2bExportService';
import { exportSupplierStatement } from '../services/b2bExportService';
import { logger } from '../config/logger';

const router = Router();
router.use(merchantAuth);

/**
 * GET /exports/suppliers
 * Export suppliers to CSV/JSON
 */
router.get('/suppliers', rateLimitMiddleware('EXPORT'), async (req: Request, res: Response) => {
  try {
    const format = (req.query.format as 'csv' | 'json') || 'csv';
    const data = await exportSuppliers(req.merchantId!, { format });

    res.setHeader('Content-Type', format === 'json' ? 'application/json' : 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=suppliers.${format}`);
    res.send(data);
  } catch (err) {
    logger.error('[Export] Supplier export failed', { error: err });
    res.status(500).json({ success: false, message: 'Export failed' });
  }
});

/**
 * GET /exports/purchase-orders
 * Export purchase orders to CSV/JSON
 */
router.get('/purchase-orders', rateLimitMiddleware('EXPORT'), async (req: Request, res: Response) => {
  try {
    const format = (req.query.format as 'csv' | 'json') || 'csv';
    const data = await exportPurchaseOrders(req.merchantId!, {
      format,
      status: req.query.status as string,
      supplierId: req.query.supplierId as string,
      fromDate: req.query.from ? new Date(req.query.from as string) : undefined,
      toDate: req.query.to ? new Date(req.query.to as string) : undefined,
    });

    res.setHeader('Content-Type', format === 'json' ? 'application/json' : 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=purchase_orders.${format}`);
    res.send(data);
  } catch (err) {
    logger.error('[Export] PO export failed', { error: err });
    res.status(500).json({ success: false, message: 'Export failed' });
  }
});

/**
 * GET /exports/aging-report
 * Export aging report to CSV/JSON
 */
router.get('/aging-report', rateLimitMiddleware('EXPORT'), async (req: Request, res: Response) => {
  try {
    const format = (req.query.format as 'csv' | 'json') || 'csv';
    const data = await exportAgingReport(req.merchantId!, { format });

    res.setHeader('Content-Type', format === 'json' ? 'application/json' : 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=aging_report.${format}`);
    res.send(data);
  } catch (err) {
    logger.error('[Export] Aging report export failed', { error: err });
    res.status(500).json({ success: false, message: 'Export failed' });
  }
});

/**
 * GET /exports/ledger
 * Export supplier ledger to CSV/JSON
 */
router.get('/ledger', rateLimitMiddleware('EXPORT'), async (req: Request, res: Response) => {
  try {
    const format = (req.query.format as 'csv' | 'json') || 'csv';
    const data = await exportLedger(req.merchantId!, {
      format,
      supplierId: req.query.supplierId as string,
      fromDate: req.query.from ? new Date(req.query.from as string) : undefined,
      toDate: req.query.to ? new Date(req.query.to as string) : undefined,
    });

    res.setHeader('Content-Type', format === 'json' ? 'application/json' : 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=supplier_ledger.${format}`);
    res.send(data);
  } catch (err) {
    logger.error('[Export] Ledger export failed', { error: err });
    res.status(500).json({ success: false, message: 'Export failed' });
  }
});

/**
 * GET /exports/statement/:supplierId
 * Export supplier statement
 */
router.get('/statement/:supplierId', rateLimitMiddleware('EXPORT'), async (req: Request, res: Response) => {
  try {
    const format = (req.query.format as 'csv' | 'json') || 'csv';
    const data = await exportSupplierStatement(req.merchantId!, req.params.supplierId, { format });

    res.setHeader('Content-Type', format === 'json' ? 'application/json' : 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=supplier_statement.${format}`);
    res.send(data);
  } catch (err) {
    logger.error('[Export] Statement export failed', { error: err });
    res.status(500).json({ success: false, message: 'Export failed' });
  }
});

export default router;
