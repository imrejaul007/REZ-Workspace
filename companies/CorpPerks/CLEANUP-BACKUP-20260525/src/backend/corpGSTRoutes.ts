/**
 * CorpPerks GST Routes
 *
 * API routes for GST calculations, invoice generation, and e-invoicing.
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, requireAdminAuth, AuthenticatedRequest } from './middleware/auth';
import { corpGSTService, GSTServiceType } from './services/corpGSTService';
import { logger } from './config/logger';

const router = Router();

// Zod validation schemas
const calculateGSTSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  serviceType: z.enum(['dining', 'hotel', 'gifting', 'travel']),
  companyGSTIN: z.string().min(15, 'Valid GSTIN required').max(15),
  placeOfSupply: z.string().min(2, 'State code required'),
  issuerState: z.string().min(2, 'State code required').optional(),
  description: z.string().optional(),
});

const createInvoiceSchema = z.object({
  companyId: z.string().min(1, 'Company ID required'),
  companyPrefix: z.string().min(1, 'Company prefix required'),
  serviceType: z.enum(['dining', 'hotel', 'gifting', 'travel']),
  companyName: z.string().min(1, 'Company name required'),
  companyGSTIN: z.string().min(15, 'Valid GSTIN required').max(15),
  companyAddress: z.string().optional(),
  contactPerson: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  issuerState: z.string().min(2, 'State code required'),
  description: z.string().optional(),
  orderId: z.string().optional(),
  bookingId: z.string().optional(),
  paymentId: z.string().optional(),
});

const ITCCheckSchema = z.object({
  serviceType: z.enum(['dining', 'hotel', 'gifting', 'travel']),
  amount: z.number().positive(),
  companyType: z.enum(['regular', 'composition']),
  recipientName: z.string().optional(),
});

const GSTR1Schema = z.object({
  companyId: z.string().min(1, 'Company ID required'),
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2030),
});

function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: Function) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error.errors[0].message });
    }
    req.body = result.data;
    next();
  };
}

// ============================================
// GST CALCULATIONS
// ============================================

/**
 * Calculate GST for a transaction
 * POST /api/gst/calculate
 */
router.post('/api/gst/calculate', requireAuth, validateBody(calculateGSTSchema), async (req: Request, res: Response) => {
  try {
    const calculation = await corpGSTService.calculateGST({
      ...req.body,
      issuerState: req.body.issuerState || req.body.placeOfSupply,
    });

    res.json({
      success: true,
      data: {
        hsnCode: calculation.hsnCode,
        description: calculation.description,
        taxableAmount: calculation.taxableAmount,
        cgst: { rate: calculation.cgstRate, amount: calculation.cgstAmount },
        sgst: { rate: calculation.sgstRate, amount: calculation.sgstAmount },
        igst: { rate: calculation.igstRate, amount: calculation.igstAmount },
        totalTax: calculation.totalTax,
        grandTotal: calculation.grandTotal,
        itcEligible: calculation.itcEligible,
        itcAmount: calculation.itcAmount,
      },
    });
  } catch (err: any) {
    logger.error('[CorpGST] Calculate failed', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Check ITC eligibility
 * POST /api/gst/itc-check
 */
router.post('/api/gst/itc-check', requireAuth, validateBody(ITCCheckSchema), async (req: Request, res: Response) => {
  try {
    const result = corpGSTService.checkITCeligibility(req.body);
    res.json({ success: true, data: result });
  } catch (err: any) {
    logger.error('[CorpGST] ITC check failed', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================
// INVOICES
// ============================================

/**
 * Create a GST invoice
 * POST /api/gst/invoices
 */
router.post('/api/gst/invoices', requireAdminAuth, validateBody(createInvoiceSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invoice = await corpGSTService.createInvoice({
      ...req.body,
      serviceType: req.body.serviceType as GSTServiceType,
      createdBy: req.userId,
    });

    logger.info('[CorpGST] Invoice created', { invoiceId: invoice.invoiceId, invoiceNumber: invoice.invoiceNumber });

    res.status(201).json({ success: true, data: invoice });
  } catch (err: any) {
    logger.error('[CorpGST] Create invoice failed', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Get invoice by number
 * GET /api/gst/invoices/:invoiceNumber
 * SECURITY FIX: Added company ownership verification to prevent IDOR attacks.
 * An attacker could access another company's invoices by guessing invoice numbers.
 */
router.get('/api/gst/invoices/:invoiceNumber', requireAuth, async (req: Request, res: Response) => {
  try {
    const companyId = req.headers['x-company-id'] as string;
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID required' });
    }

    const invoice = await corpGSTService.getInvoice(req.params.invoiceNumber);

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // SECURITY: Verify invoice belongs to the requesting company
    if (invoice.companyId && invoice.companyId.toString() !== companyId) {
      logger.warn('[CorpGST] IDOR attempt: user tried to access invoice from different company', {
        invoiceNumber: req.params.invoiceNumber,
        requestingCompanyId: companyId,
        invoiceCompanyId: invoice.companyId?.toString(),
      });
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.json({ success: true, data: invoice });
  } catch (err: any) {
    logger.error('[CorpGST] Get invoice failed', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Get invoices for a company
 * GET /api/gst/invoices
 */
router.get('/api/gst/invoices', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const companyId = req.headers['x-company-id'] as string;
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID required' });
    }

    const { startDate, endDate, serviceType, page, limit } = req.query;

    const result = await corpGSTService.getCompanyInvoices({
      companyId,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      serviceType: serviceType as GSTServiceType,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });

    res.json({
      success: true,
      data: result.invoices,
      pagination: {
        total: result.total,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      },
    });
  } catch (err: any) {
    logger.error('[CorpGST] Get invoices failed', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================
// REPORTS
// ============================================

/**
 * Generate GSTR-1 report
 * POST /api/gst/reports/gstr1
 */
router.post('/api/gst/reports/gstr1', requireAdminAuth, validateBody(GSTR1Schema), async (req: Request, res: Response) => {
  try {
    const report = await corpGSTService.generateGSTR1Report(req.body);

    logger.info('[CorpGST] GSTR-1 generated', {
      companyId: req.body.companyId,
      period: report.period,
      totalInvoices: report.summary.totalInvoices,
    });

    res.json({ success: true, data: report });
  } catch (err: any) {
    logger.error('[CorpGST] GSTR-1 failed', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================
// E-INVOICING
// ============================================

/**
 * Submit e-invoice to GST portal
 * POST /api/gst/einvoice/:invoiceNumber
 * SECURITY FIX: Added company ownership verification to prevent IDOR attacks.
 * An attacker could submit e-invoices for another company's invoices.
 */
router.post('/api/gst/einvoice/:invoiceNumber', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const companyId = req.headers['x-company-id'] as string;
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID required' });
    }

    // Verify invoice belongs to the requesting company before submission
    const invoice = await corpGSTService.getInvoice(req.params.invoiceNumber);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    if (invoice.companyId && invoice.companyId.toString() !== companyId) {
      logger.warn('[CorpGST] IDOR attempt: user tried to submit einvoice for different company', {
        invoiceNumber: req.params.invoiceNumber,
        requestingCompanyId: companyId,
        invoiceCompanyId: invoice.companyId?.toString(),
      });
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const result = await corpGSTService.submitEInvoice(req.params.invoiceNumber);

    logger.info('[CorpGST] E-invoice submitted', {
      invoiceNumber: req.params.invoiceNumber,
      irn: result.irn,
    });

    res.json({ success: true, data: result });
  } catch (err: any) {
    logger.error('[CorpGST] E-invoice submission failed', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
