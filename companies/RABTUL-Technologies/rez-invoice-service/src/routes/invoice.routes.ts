import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { InvoiceModel } from '../models/Invoice';
import { PDFService } from '../services/pdfService';
import { EmailService } from '../services/emailService';
import {
  CreateInvoiceInput,
  UpdateInvoiceInput,
  RecordPaymentInput,
  SendInvoiceEmailInput,
  InvoiceFilters,
  PaginationParams,
  InvoiceStatus
} from '../types';

// Define Zod schemas at module level
const addressSchema = z.object({
  name: z.string().optional(),
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().default('India'),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  gstin: z.string().optional(),
  pan: z.string().optional()
});

const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  hsnCode: z.string().min(1, 'HSN code is required'),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.string().optional().default('pcs'),
  rate: z.number().nonnegative('Rate cannot be negative'),
  discount: z.number().nonnegative().optional(),
  discountPercent: z.number().min(0).max(100).optional()
});

const bankDetailsSchema = z.object({
  bankName: z.string().optional(),
  branch: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  accountType: z.string().optional(),
  upiId: z.string().optional()
});

const createInvoiceSchema = z.object({
  type: z.enum(['tax_invoice', 'bill_of_supply', 'receipt', 'credit_note', 'debit_note']).optional(),
  customerName: z.string().min(1, 'Customer name is required'),
  customerAddress: addressSchema,
  customerGstin: z.string().optional(),
  customerPan: z.string().optional(),
  items: z.array(lineItemSchema).min(1, 'At least one item is required'),
  invoiceDate: z.string().optional(),
  dueDate: z.string().optional(),
  placeOfSupply: z.string().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  bankDetails: bankDetailsSchema.optional(),
  reference: z.string().optional(),
  template: z.string().optional(),
  color: z.string().optional()
});

const updateInvoiceSchema = z.object({
  customerName: z.string().min(1).optional(),
  customerAddress: addressSchema.optional(),
  customerGstin: z.string().optional(),
  customerPan: z.string().optional(),
  items: z.array(lineItemSchema).min(1).optional(),
  invoiceDate: z.string().optional(),
  dueDate: z.string().optional(),
  placeOfSupply: z.string().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  bankDetails: bankDetailsSchema.optional(),
  status: z.enum(['draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'cancelled']).optional(),
  reference: z.string().optional(),
  template: z.string().optional(),
  color: z.string().optional()
});

const recordPaymentSchema = z.object({
  amount: z.number().positive('Payment amount must be positive'),
  date: z.string().min(1, 'Payment date is required'),
  method: z.enum(['bank_transfer', 'upi', 'cash', 'check', 'card', 'other']),
  reference: z.string().optional(),
  notes: z.string().optional()
});

const sendEmailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  subject: z.string().optional(),
  message: z.string().optional(),
  attachPdf: z.boolean().optional()
});

const filtersSchema = z.object({
  status: z.enum(['draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'cancelled']).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  customerName: z.string().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  search: z.string().optional()
});

const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['invoiceDate', 'invoiceNumber', 'totalAmount', 'dueDate', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export class InvoiceRoutes {
  private router: Router;
  private invoiceModel: InvoiceModel;
  private pdfService: PDFService;
  private emailService: EmailService;

  constructor(invoiceModel: InvoiceModel) {
    this.router = Router();
    this.invoiceModel = invoiceModel;
    this.pdfService = new PDFService();
    this.emailService = new EmailService();
    this.setupRoutes();
  }

  private validationError(res: Response, error: z.ZodError): void {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    });
  }

  private setupRoutes(): void {
    // Create invoice
    this.router.post('/', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const validation = createInvoiceSchema.safeParse(req.body);
        if (!validation.success) {
          return this.validationError(res, validation.error);
        }

        const invoice = await this.invoiceModel.create(validation.data as CreateInvoiceInput);

        res.status(201).json({
          success: true,
          data: invoice
        });
      } catch (error) {
        next(error);
      }
    });

    // List invoices with filters and pagination
    this.router.get('/', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const filtersValidation = filtersSchema.safeParse(req.query);
        const paginationValidation = paginationSchema.safeParse(req.query);

        if (!filtersValidation.success) {
          return this.validationError(res, filtersValidation.error);
        }
        if (!paginationValidation.success) {
          return this.validationError(res, paginationValidation.error);
        }

        const result = await this.invoiceModel.list(
          filtersValidation.data as InvoiceFilters,
          paginationValidation.data as PaginationParams
        );

        res.json({
          success: true,
          data: result.data,
          pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages
          }
        });
      } catch (error) {
        next(error);
      }
    });

    // Get single invoice
    this.router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const invoice = await this.invoiceModel.findById(id);

        if (!invoice) {
          return res.status(404).json({
            success: false,
            error: 'Invoice not found'
          });
        }

        res.json({
          success: true,
          data: invoice
        });
      } catch (error) {
        next(error);
      }
    });

    // Get invoice by invoice number
    this.router.get('/number/:invoiceNumber', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { invoiceNumber } = req.params;
        const invoice = await this.invoiceModel.findByInvoiceNumber(invoiceNumber);

        if (!invoice) {
          return res.status(404).json({
            success: false,
            error: 'Invoice not found'
          });
        }

        res.json({
          success: true,
          data: invoice
        });
      } catch (error) {
        next(error);
      }
    });

    // Update invoice
    this.router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const validation = updateInvoiceSchema.safeParse(req.body);

        if (!validation.success) {
          return this.validationError(res, validation.error);
        }

        const invoice = await this.invoiceModel.update(id, validation.data as UpdateInvoiceInput);

        if (!invoice) {
          return res.status(404).json({
            success: false,
            error: 'Invoice not found'
          });
        }

        res.json({
          success: true,
          data: invoice
        });
      } catch (error) {
        next(error);
      }
    });

    // Delete invoice
    this.router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const deleted = await this.invoiceModel.delete(id);

        if (!deleted) {
          return res.status(404).json({
            success: false,
            error: 'Invoice not found'
          });
        }

        res.json({
          success: true,
          message: 'Invoice deleted successfully'
        });
      } catch (error) {
        next(error);
      }
    });

    // Update invoice status
    this.router.patch('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status || !['draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'cancelled'].includes(status)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid status'
          });
        }

        const invoice = await this.invoiceModel.updateStatus(id, status as InvoiceStatus);

        if (!invoice) {
          return res.status(404).json({
            success: false,
            error: 'Invoice not found'
          });
        }

        res.json({
          success: true,
          data: invoice
        });
      } catch (error) {
        next(error);
      }
    });

    // Record payment
    this.router.post('/:id/payments', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const validation = recordPaymentSchema.safeParse(req.body);

        if (!validation.success) {
          return this.validationError(res, validation.error);
        }

        const invoice = await this.invoiceModel.findById(id);
        if (!invoice) {
          return res.status(404).json({
            success: false,
            error: 'Invoice not found'
          });
        }

        const updated = await this.invoiceModel.recordPayment(id, validation.data as RecordPaymentInput);

        res.json({
          success: true,
          data: updated
        });
      } catch (error) {
        next(error);
      }
    });

    // Get payment history
    this.router.get('/:id/payments', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const invoice = await this.invoiceModel.findById(id);

        if (!invoice) {
          return res.status(404).json({
            success: false,
            error: 'Invoice not found'
          });
        }

        res.json({
          success: true,
          data: invoice.payments
        });
      } catch (error) {
        next(error);
      }
    });

    // Send invoice via email
    this.router.post('/:id/send', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const validation = sendEmailSchema.safeParse(req.body);

        if (!validation.success) {
          return this.validationError(res, validation.error);
        }

        const invoice = await this.invoiceModel.findById(id);
        if (!invoice) {
          return res.status(404).json({
            success: false,
            error: 'Invoice not found'
          });
        }

        const emailOptions: SendInvoiceEmailInput = {
          to: validation.data.to,
          cc: validation.data.cc,
          bcc: validation.data.bcc,
          subject: validation.data.subject,
          message: validation.data.message,
          attachPdf: validation.data.attachPdf
        };

        const result = await this.emailService.sendInvoice(invoice, emailOptions);

        if (!result.success) {
          return res.status(500).json({
            success: false,
            error: result.error
          });
        }

        // Update invoice status to sent
        if (invoice.status === 'draft') {
          await this.invoiceModel.updateStatus(id, 'sent');
        }

        res.json({
          success: true,
          message: 'Invoice sent successfully',
          messageId: result.messageId
        });
      } catch (error) {
        next(error);
      }
    });

    // Download invoice PDF
    this.router.get('/:id/pdf', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const invoice = await this.invoiceModel.findById(id);

        if (!invoice) {
          return res.status(404).json({
            success: false,
            error: 'Invoice not found'
          });
        }

        const pdfBuffer = await this.pdfService.generateInvoicePDF(invoice);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`);
        res.send(pdfBuffer);
      } catch (error) {
        next(error);
      }
    });

    // Preview invoice PDF (inline)
    this.router.get('/:id/preview', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const invoice = await this.invoiceModel.findById(id);

        if (!invoice) {
          return res.status(404).json({
            success: false,
            error: 'Invoice not found'
          });
        }

        // Update status to viewed if not already
        if (invoice.status === 'sent' || invoice.status === 'draft') {
          await this.invoiceModel.updateStatus(id, 'viewed');
        }

        const pdfBuffer = await this.pdfService.generateInvoicePDF(invoice);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="Invoice-${invoice.invoiceNumber}.pdf"`);
        res.send(pdfBuffer);
      } catch (error) {
        next(error);
      }
    });

    // Get invoice statistics
    this.router.get('/stats/summary', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const filtersValidation = filtersSchema.safeParse(req.query);
        const filters = filtersValidation.success ? filtersValidation.data : {};

        const stats = await this.invoiceModel.getStats(filters as InvoiceFilters);

        res.json({
          success: true,
          data: stats
        });
      } catch (error) {
        next(error);
      }
    });

    // Get GST summary
    this.router.get('/reports/gst', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { fromDate, toDate } = req.query;

        if (!fromDate || !toDate) {
          return res.status(400).json({
            success: false,
            error: 'fromDate and toDate are required'
          });
        }

        const summary = await this.invoiceModel.getGSTSummary(
          fromDate as string,
          toDate as string
        );

        res.json({
          success: true,
          data: summary,
          period: {
            from: fromDate,
            to: toDate
          }
        });
      } catch (error) {
        next(error);
      }
    });

    // Get overdue invoices
    this.router.get('/reports/overdue', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const overdueInvoices = await this.invoiceModel.getOverdueInvoices();

        res.json({
          success: true,
          data: overdueInvoices,
          count: overdueInvoices.length
        });
      } catch (error) {
        next(error);
      }
    });

    // Send reminder for specific invoice
    this.router.post('/:id/reminders', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const { type, recipientEmail } = req.body;

        if (!type || !['first', 'second', 'final', 'custom'].includes(type)) {
          return res.status(400).json({
            success: false,
            error: 'Valid reminder type is required (first, second, final, custom)'
          });
        }

        const invoice = await this.invoiceModel.findById(id);
        if (!invoice) {
          return res.status(404).json({
            success: false,
            error: 'Invoice not found'
          });
        }

        const email = recipientEmail || invoice.customerAddress.email;
        if (!email) {
          return res.status(400).json({
            success: false,
            error: 'Customer email address is required'
          });
        }

        const result = await this.emailService.sendReminder(
          invoice,
          type,
          email
        );

        if (result.success) {
          // Record the reminder
          await this.invoiceModel.addReminder(id, {
            sentAt: new Date().toISOString(),
            type,
            recipientEmail: email
          });
        }

        res.json({
          success: result.success,
          message: result.success ? 'Reminder sent successfully' : 'Failed to send reminder',
          error: result.error
        });
      } catch (error) {
        next(error);
      }
    });

    // Batch send reminders
    this.router.post('/reminders/batch', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { type, invoiceIds } = req.body;

        if (!type || !['first', 'second', 'final'].includes(type)) {
          return res.status(400).json({
            success: false,
            error: 'Valid reminder type is required'
          });
        }

        let invoices;
        if (invoiceIds && Array.isArray(invoiceIds) && invoiceIds.length > 0) {
          const allInvoices = await this.invoiceModel.list({}, { limit: 1000 });
          invoices = allInvoices.data.filter(inv => invoiceIds.includes(inv.id));
        } else {
          invoices = await this.invoiceModel.getOverdueInvoices();
        }

        const results = await this.emailService.sendBulkReminders(
          invoices,
          type
        );

        // Record reminders for successful sends
        for (const result of results) {
          if (result.success) {
            const invoice = invoices.find(inv => inv.id === result.invoiceId);
            if (invoice) {
              await this.invoiceModel.addReminder(result.invoiceId, {
                sentAt: new Date().toISOString(),
                type,
                recipientEmail: invoice.customerAddress.email || ''
              });
            }
          }
        }

        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        res.json({
          success: true,
          message: `Sent ${successCount} reminders, ${failCount} failed`,
          results
        });
      } catch (error) {
        next(error);
      }
    });
  }

  getRouter(): Router {
    return this.router;
  }
}
