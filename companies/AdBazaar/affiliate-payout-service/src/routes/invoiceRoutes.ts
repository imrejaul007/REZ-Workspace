import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { invoiceService } from '../services/invoiceService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

const createInvoiceSchema = z.object({
  payoutId: z.string().optional(),
  affiliateId: z.string().min(1),
  period: z.object({
    start: z.string().transform((s) => new Date(s)),
    end: z.string().transform((s) => new Date(s)),
  }),
  lineItems: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
  })).min(1),
  dueDate: z.string().transform((s) => new Date(s)),
  notes: z.string().optional(),
});

/**
 * POST /api/invoices
 * Create a new invoice
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const input = createInvoiceSchema.parse(req.body);
    const invoice = await invoiceService.createInvoice(input);

    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to create invoice' });
  }
});

/**
 * GET /api/invoices/:id
 * Get invoice by ID
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceService.getInvoice(req.params.id);

    if (!invoice) {
      res.status(404).json({ success: false, error: 'Invoice not found' });
      return;
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch invoice' });
  }
});

/**
 * GET /api/invoices
 * Get invoices by affiliate
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', status, affiliateId } = req.query;

    if (!affiliateId) {
      res.status(400).json({ success: false, error: 'affiliateId required' });
      return;
    }

    const result = await invoiceService.getInvoicesByAffiliate(affiliateId as string, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      status: status as any,
    });

    res.json({
      success: true,
      data: result.invoices,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: result.total,
        pages: Math.ceil(result.total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch invoices' });
  }
});

/**
 * POST /api/invoices/:id/send
 * Send invoice
 */
router.post('/:id/send', authMiddleware, async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceService.sendInvoice(req.params.id);

    if (!invoice) {
      res.status(404).json({ success: false, error: 'Invoice not found or already sent' });
      return;
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to send invoice' });
  }
});

/**
 * POST /api/invoices/:id/paid
 * Mark invoice as paid
 */
router.post('/:id/paid', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { transactionId, paymentMethod, paidAmount } = req.body;
    const invoice = await invoiceService.updateInvoiceStatus(req.params.id, 'paid', {
      transactionId,
      paymentMethod,
      paidAmount,
    });

    if (!invoice) {
      res.status(404).json({ success: false, error: 'Invoice not found' });
      return;
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update invoice' });
  }
});

/**
 * GET /api/invoices/stats/summary
 * Get invoice statistics
 */
router.get('/stats/summary', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { affiliateId } = req.query;
    const stats = await invoiceService.getInvoiceStats(affiliateId as string);

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch statistics' });
  }
});

export default router;