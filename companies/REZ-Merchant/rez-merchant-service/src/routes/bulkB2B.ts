/**
 * Bulk Import Routes (B2B)
 *
 * Handles CSV imports for:
 * - Suppliers
 * - Purchase Orders
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { merchantAuth } from '../middleware/auth';
import {
  importSuppliers,
  importPurchaseOrders,
  generateSupplierTemplate,
  generatePOTemplate,
} from '../services/bulkImportService';
import { rateLimitMiddleware } from '../middleware/rateLimiter';
import { logger } from '../config/logger';

const router = Router();
router.use(merchantAuth);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

/**
 * POST /bulk-b2b/suppliers
 * Import suppliers from CSV
 */
router.post(
  '/suppliers',
  rateLimitMiddleware('BULK_IMPORT'),
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'CSV file required' });
        return;
      }

      const content = req.file.buffer.toString('utf-8');
      const skipDuplicates = req.body.skipDuplicates === 'true';
      const updateExisting = req.body.updateExisting === 'true';

      const result = await importSuppliers(req.merchantId!, content, {
        skipDuplicates,
        updateExisting,
      });

      res.json({
        success: result.success,
        message: `Imported ${result.imported} suppliers, ${result.failed} failed`,
        data: {
          imported: result.imported,
          failed: result.failed,
          errors: result.errors.slice(0, 100),
        },
      });
    } catch (err) {
      logger.error('[BulkImport] Supplier import failed', { error: err });
      res.status(500).json({ success: false, message: 'Import failed' });
    }
  }
);

/**
 * POST /bulk-b2b/purchase-orders
 * Import purchase orders from CSV
 */
router.post(
  '/purchase-orders',
  rateLimitMiddleware('BULK_IMPORT'),
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'CSV file required' });
        return;
      }

      const content = req.file.buffer.toString('utf-8');
      const createSuppliers = req.body.createSuppliers === 'true';

      const result = await importPurchaseOrders(req.merchantId!, content, {
        createSuppliers,
      });

      res.json({
        success: result.success,
        message: `Imported ${result.imported} POs, ${result.failed} failed`,
        data: {
          imported: result.imported,
          failed: result.failed,
          errors: result.errors.slice(0, 100),
        },
      });
    } catch (err) {
      logger.error('[BulkImport] PO import failed', { error: err });
      res.status(500).json({ success: false, message: 'Import failed' });
    }
  }
);

/**
 * GET /bulk-b2b/templates
 * Download CSV templates
 */
router.get('/templates', async (req: Request, res: Response) => {
  const { type } = req.query;

  switch (type) {
    case 'suppliers':
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=supplier_template.csv');
      res.send(generateSupplierTemplate());
      break;
    case 'purchase-orders':
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=purchase_order_template.csv');
      res.send(generatePOTemplate());
      break;
    default:
      res.json({
        success: true,
        data: {
          templates: [
            { type: 'suppliers', filename: 'supplier_template.csv', description: 'Import suppliers with GST/PAN details' },
            { type: 'purchase-orders', filename: 'purchase_order_template.csv', description: 'Import purchase orders' },
          ],
        },
      });
  }
});

export default router;
