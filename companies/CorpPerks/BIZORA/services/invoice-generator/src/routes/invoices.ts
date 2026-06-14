import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { invoiceService, CreateInvoiceInput, UpdateInvoiceInput } from '../services/invoiceService';
import { pdfGeneratorService } from '../services/pdfGenerator';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

const router = Router();

// Validation schemas
const lineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  discount: z.number().nonnegative().optional(),
  hsnCode: z.string().optional(),
  gstRate: z.number().optional()
});

const gstDetailsSchema = z.object({
  gstin: z.string().min(15).max(15),
  businessName: z.string().min(1),
  address: z.string().min(1),
  state: z.string().min(1)
});

const createInvoiceSchema = z.object({
  seller: gstDetailsSchema,
  buyer: gstDetailsSchema,
  lineItems: z.array(lineItemSchema).min(1),
  dueDate: z.string().transform(str => new Date(str)),
  notes: z.string().optional(),
  terms: z.string().optional()
});

const updateInvoiceSchema = z.object({
  lineItems: z.array(lineItemSchema).optional(),
  dueDate: z.string().transform(str => new Date(str)).optional(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  paymentDetails: z.object({
    paymentMethod: z.string().optional(),
    paymentDate: z.string().transform(str => new Date(str)).optional(),
    transactionId: z.string().optional()
  }).optional()
});

const paymentSchema = z.object({
  paymentMethod: z.string(),
  paymentDate: z.string().transform(str => new Date(str)),
  transactionId: z.string()
});

// Validation middleware
const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation error',
          details: error.errors
        });
        return;
      }
      next(error);
    }
  };
};

// List invoices
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const sellerGstin = req.query.sellerGstin as string;
    const buyerGstin = req.query.buyerGstin as string;
    const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : undefined;
    const toDate = req.query.toDate ? new Date(req.query.toDate as string) : undefined;

    // Get userId from request (set by auth middleware)
    const createdBy = req.userId || req.headers['x-user-id'] as string || 'system';

    const result = await invoiceService.getInvoices({
      page,
      limit,
      status,
      sellerGstin,
      buyerGstin,
      fromDate,
      toDate,
      createdBy
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Create invoice
router.post('/', validateBody(createInvoiceSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const createdBy = req.userId || req.headers['x-user-id'] as string || 'system';

    const input: CreateInvoiceInput = {
      ...req.body,
      createdBy
    };

    const invoice = await invoiceService.createInvoice(input);

    logger.info('Invoice created via API', {
      invoiceNumber: invoice.invoiceNumber,
      createdBy
    });

    res.status(201).json(invoice);
  } catch (error) {
    next(error);
  }
});

// Get invoice by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id);

    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    res.json(invoice);
  } catch (error) {
    next(error);
  }
});

// Update invoice
router.put('/:id', validateBody(updateInvoiceSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updatedBy = req.userId || req.headers['x-user-id'] as string;

    const input: UpdateInvoiceInput = {
      ...req.body,
      updatedBy
    };

    const invoice = await invoiceService.updateInvoice(req.params.id, input);

    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    logger.info('Invoice updated via API', {
      invoiceNumber: invoice.invoiceNumber,
      updatedBy
    });

    res.json(invoice);
  } catch (error) {
    next(error);
  }
});

// Send invoice
router.post('/:id/send', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const result = await invoiceService.sendInvoice(req.params.id, email);

    if (!result.success) {
      res.status(404).json({ error: result.message });
      return;
    }

    logger.info('Invoice sent via API', {
      invoiceId: req.params.id,
      email
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Generate PDF
router.get('/:id/pdf', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id);

    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    const pdfBuffer = await pdfGeneratorService.generateInvoicePDF(invoice, {
      companyName: 'BIZORA',
      companyAddress: process.env.COMPANY_ADDRESS,
      companyPhone: process.env.COMPANY_PHONE,
      companyEmail: process.env.COMPANY_EMAIL
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    logger.info('PDF generated via API', {
      invoiceNumber: invoice.invoiceNumber
    });

    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
});

// Send reminder
router.post('/:id/remind', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await invoiceService.sendReminder(req.params.id);

    if (!result.success) {
      res.status(404).json({ error: result.message });
      return;
    }

    logger.info('Reminder sent via API', {
      invoiceId: req.params.id
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Mark as paid
router.post('/:id/pay', validateBody(paymentSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await invoiceService.markAsPaid(req.params.id, req.body);

    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    logger.info('Invoice marked as paid via API', {
      invoiceNumber: invoice.invoiceNumber
    });

    res.json(invoice);
  } catch (error) {
    next(error);
  }
});

// Cancel invoice
router.post('/:id/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await invoiceService.cancelInvoice(req.params.id);

    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    logger.info('Invoice cancelled via API', {
      invoiceNumber: invoice.invoiceNumber
    });

    res.json(invoice);
  } catch (error) {
    next(error);
  }
});

// Get invoice statistics
router.get('/stats/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const createdBy = req.userId || req.headers['x-user-id'] as string || 'system';

    const stats = await invoiceService.getInvoiceStats(createdBy);

    res.json(stats);
  } catch (error) {
    next(error);
  }
});

export default router;
