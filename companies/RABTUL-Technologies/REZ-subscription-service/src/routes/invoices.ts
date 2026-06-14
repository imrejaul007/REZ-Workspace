import { Router, Request, Response } from 'express';
import { Invoice } from '../models';
import { InvoiceStatus } from '../types';
import { asyncHandler, authenticateInternal } from '../middleware';
import { paymentCollector } from '../services';

const router = Router();

// Apply authentication to all routes
router.use(authenticateInternal);

/**
 * GET /api/v1/invoices
 * List invoices (with optional filters)
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const {
      customerId,
      subscriptionId,
      status,
      startDate,
      endDate,
      limit = 50,
      offset = 0
    } = req.query;

    const query: Record<string, unknown> = {};

    if (customerId) {
      query.customerId = customerId;
    }

    if (subscriptionId) {
      query.subscriptionId = subscriptionId;
    }

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate as string);
      }
    }

    const invoices = await Invoice.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(offset as string, 10))
      .limit(parseInt(limit as string, 10));

    const total = await Invoice.countDocuments(query);

    res.json({
      success: true,
      data: invoices,
      pagination: {
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
        total
      }
    });
  })
);

/**
 * GET /api/v1/invoices/:id
 * Get invoice by ID
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const invoice = await Invoice.findOne({ invoiceId: id });

    if (!invoice) {
      res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
      return;
    }

    res.json({
      success: true,
      data: invoice
    });
  })
);

/**
 * POST /api/v1/invoices/:id/charge
 * Charge an invoice
 */
router.post(
  '/:id/charge',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { paymentMethodId } = req.body;

    const result = await paymentCollector.collectPayment(id, paymentMethodId);

    if (result.success) {
      const invoice = await Invoice.findOne({ invoiceId: id });

      res.json({
        success: true,
        data: invoice,
        message: 'Payment successful'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        message: 'Payment failed'
      });
    }
  })
);

/**
 * POST /api/v1/invoices/:id/refund
 * Refund an invoice
 */
router.post(
  '/:id/refund',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { amount, reason } = req.body;

    const result = await paymentCollector.processRefund(id, amount, reason);

    if (result.success) {
      const invoice = await Invoice.findOne({ invoiceId: id });

      res.json({
        success: true,
        data: invoice,
        message: 'Refund processed successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        message: 'Refund failed'
      });
    }
  })
);

/**
 * POST /api/v1/invoices/:id/void
 * Void an invoice
 */
router.post(
  '/:id/void',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      res.status(400).json({
        success: false,
        error: 'Reason is required for voiding an invoice'
      });
      return;
    }

    await paymentCollector.voidInvoice(id, reason);

    const invoice = await Invoice.findOne({ invoiceId: id });

    res.json({
      success: true,
      data: invoice,
      message: 'Invoice voided successfully'
    });
  })
);

/**
 * GET /api/v1/invoices/:id/download
 * Download invoice as PDF (stub)
 */
router.get(
  '/:id/download',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const invoice = await Invoice.findOne({ invoiceId: id });

    if (!invoice) {
      res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
      return;
    }

    // In production, this would generate a PDF
    // For now, return the invoice data
    res.json({
      success: true,
      data: invoice,
      message: 'PDF generation not implemented - returning invoice data'
    });
  })
);

export default router;
