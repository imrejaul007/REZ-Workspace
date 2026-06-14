import { Router, Request, Response, NextFunction } from 'express';
import { param, query, validationResult } from 'express-validator';
import { gstInvoiceService } from '../services/GstInvoiceService';
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
 * @route GET /api/invoices
 * @desc Get invoices with filters
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('invoiceNumber').optional().isString(),
    query('transactionId').optional().isString(),
    query('customerId').optional().isString(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('paymentStatus').optional().isIn(['paid', 'partial', 'pending', 'refunded']),
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const filters = {
        invoiceNumber: req.query.invoiceNumber as string,
        transactionId: req.query.transactionId as string,
        customerId: req.query.customerId as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        paymentStatus: req.query.paymentStatus as string,
      };

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await gstInvoiceService.getInvoices(filters, page, limit);
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
 * @route GET /api/invoices/:invoiceNumber
 * @desc Get invoice by number
 */
router.get(
  '/:invoiceNumber',
  [param('invoiceNumber').notEmpty().withMessage('Invoice number is required')],
  validate,
  async (req: Request, res: Response) => {
    try {
      const invoice = await gstInvoiceService.getInvoice(req.params.invoiceNumber);
      if (!invoice) {
        res.status(404).json({
          success: false,
          error: 'Invoice not found',
        });
        return;
      }
      res.json({
        success: true,
        data: invoice,
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
 * @route GET /api/invoices/:invoiceNumber/pdf
 * @desc Download invoice as PDF
 */
router.get(
  '/:invoiceNumber/pdf',
  [param('invoiceNumber').notEmpty().withMessage('Invoice number is required')],
  validate,
  async (req: Request, res: Response) => {
    try {
      const invoice = await gstInvoiceService.getInvoice(req.params.invoiceNumber);
      if (!invoice) {
        res.status(404).json({
          success: false,
          error: 'Invoice not found',
        });
        return;
      }

      const pdfBuffer = await gstInvoiceService.generatePdf(invoice);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${invoice.invoiceNumber}.pdf"`
      );
      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * @route GET /api/invoices/transaction/:transactionId
 * @desc Get invoice by transaction ID
 */
router.get(
  '/transaction/:transactionId',
  [param('transactionId').notEmpty().withMessage('Transaction ID is required')],
  validate,
  async (req: Request, res: Response) => {
    try {
      const invoice = await gstInvoiceService.getInvoiceByTransaction(req.params.transactionId);
      if (!invoice) {
        res.status(404).json({
          success: false,
          error: 'Invoice not found',
        });
        return;
      }
      res.json({
        success: true,
        data: invoice,
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
 * @route PATCH /api/invoices/:invoiceNumber/status
 * @desc Update invoice payment status
 */
router.patch(
  '/:invoiceNumber/status',
  [
    param('invoiceNumber').notEmpty().withMessage('Invoice number is required'),
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      if (!['paid', 'partial', 'pending'].includes(status)) {
        res.status(400).json({
          success: false,
          error: 'Invalid status. Must be one of: paid, partial, pending',
        });
        return;
      }

      const invoice = await gstInvoiceService.updatePaymentStatus(
        req.params.invoiceNumber,
        status
      );
      if (!invoice) {
        res.status(404).json({
          success: false,
          error: 'Invoice not found',
        });
        return;
      }
      res.json({
        success: true,
        data: invoice,
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
 * @route POST /api/invoices/:invoiceNumber/void
 * @desc Void/cancel an invoice
 */
router.post(
  '/:invoiceNumber/void',
  [param('invoiceNumber').notEmpty().withMessage('Invoice number is required')],
  validate,
  async (req: Request, res: Response) => {
    try {
      const { reason } = req.body;
      if (!reason) {
        res.status(400).json({
          success: false,
          error: 'Reason is required for voiding an invoice',
        });
        return;
      }

      const invoice = await gstInvoiceService.voidInvoice(req.params.invoiceNumber, reason);
      if (!invoice) {
        res.status(404).json({
          success: false,
          error: 'Invoice not found or already refunded',
        });
        return;
      }
      res.json({
        success: true,
        data: invoice,
        message: 'Invoice voided successfully',
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
 * @route GET /api/invoices/reports/monthly
 * @desc Get monthly invoice summary
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
      const summary = await gstInvoiceService.getMonthlySummary(year, month);
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

export default router;
