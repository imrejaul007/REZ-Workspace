/**
 * LEDGERAI - Invoice Routes
 * Invoice management and payment processing
 */

import { Router, Request, Response } from 'express';
import { Invoice, Payment } from '../models';
import { Types } from 'mongoose';
import { authenticate, authorize } from '../middleware/auth';
import { validate, createInvoiceSchema, updateInvoiceSchema, paymentSchema, validateObjectId } from '../middleware/validation';
import { writeLimiter } from '../middleware/rateLimiter';
import logger from '../middleware/logger';
import { triggerWebhook, syncToHOJAI } from '../utils/webhook';

const router = Router();

// ============================================
// GET /api/invoices - List invoices
// ============================================
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      status,
      customerId,
      startDate,
      endDate,
      search,
      minAmount,
      maxAmount,
      page = '1',
      limit = '50',
      sortBy = 'issueDate',
      sortOrder = 'desc'
    } = req.query;

    const filter: any = {};

    if (status) {
      if (status === 'overdue') {
        filter.status = 'overdue';
      } else {
        filter.status = status;
      }
    }
    if (customerId) filter.customerId = customerId;
    if (startDate || endDate) {
      filter.issueDate = {};
      if (startDate) filter.issueDate.$gte = new Date(startDate as string);
      if (endDate) filter.issueDate.$lte = new Date(endDate as string);
    }
    if (search) {
      filter.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } }
      ];
    }
    if (minAmount || maxAmount) {
      filter.total = {};
      if (minAmount) filter.total.$gte = parseFloat(minAmount as string);
      if (maxAmount) filter.total.$lte = parseFloat(maxAmount as string);
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Invoice.countDocuments(filter)
    ]);

    // Calculate summary by status
    const statusSummary = await Invoice.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$total' } } }
    ]);

    // Calculate totals
    const totals = await Invoice.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalInvoiced: { $sum: '$total' },
          totalPaid: { $sum: '$amountPaid' },
          totalOutstanding: { $sum: { $subtract: ['$total', '$amountPaid'] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        invoices,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        },
        summary: {
          byStatus: statusSummary.reduce((acc, s) => {
            acc[s._id] = { count: s.count, total: Math.round(s.total * 100) / 100 };
            return acc;
          }, {} as Record<string, { count: number; total: number }>),
          totals: totals[0] || { totalInvoiced: 0, totalPaid: 0, totalOutstanding: 0 }
        }
      }
    });
  } catch (error) {
    logger.error('Get invoices error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve invoices',
      code: 'GET_INVOICES_ERROR'
    });
  }
});

// ============================================
// GET /api/invoices/:id - Get single invoice
// ============================================
router.get('/:id', authenticate, validateObjectId('id'), async (req: Request, res: Response): Promise<void> => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      res.status(404).json({
        success: false,
        error: 'Invoice not found',
        code: 'INVOICE_NOT_FOUND'
      });
      return;
    }

    // Get payment history
    const payments = await Payment.find({ invoiceId: invoice._id })
      .populate('processedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        invoice,
        payments,
        outstandingAmount: invoice.total - (invoice.amountPaid || 0)
      }
    });
  } catch (error) {
    logger.error('Get invoice error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve invoice',
      code: 'GET_INVOICE_ERROR'
    });
  }
});

// ============================================
// POST /api/invoices - Create invoice
// ============================================
router.post('/', authenticate, authorize('admin', 'accountant'), writeLimiter, validate(createInvoiceSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      customerId,
      customerName,
      customerEmail,
      customerAddress,
      customerPhone,
      items,
      taxRate,
      discount,
      dueDate,
      notes,
      terms
    } = req.body;

    // Calculate totals
    let subtotal = 0;
    const invoiceItems = items.map((item: any, index: number) => {
      const amount = item.quantity * item.rate;
      const taxAmount = item.taxRate ? (amount * item.taxRate / 100) : 0;
      subtotal += amount + taxAmount;

      return {
        id: `item_${Date.now()}_${index}`,
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount,
        taxRate: item.taxRate || 0,
        taxAmount: Math.round(taxAmount * 100) / 100
      };
    });

    // Calculate overall tax
    const totalBeforeTax = items.reduce((sum: number, item: any) => sum + (item.quantity * item.rate), 0);
    const itemTaxTotal = invoiceItems.reduce((sum: number, item: any) => sum + (item.taxAmount || 0), 0);
    const overallTaxRate = taxRate || (totalBeforeTax > 0 ? (itemTaxTotal / totalBeforeTax) * 100 : 0);
    const taxAmount = Math.round(totalBeforeTax * (overallTaxRate / 100) * 100) / 100;

    // Calculate total
    const total = Math.round((totalBeforeTax + taxAmount - (discount || 0)) * 100) / 100;

    // Generate invoice number
    const invoiceCount = await Invoice.countDocuments();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(5, '0')}`;

    const invoice = new Invoice({
      invoiceNumber,
      customerId,
      customerName,
      customerEmail,
      customerAddress,
      customerPhone,
      items: invoiceItems,
      subtotal: Math.round(totalBeforeTax * 100) / 100,
      taxRate: Math.round(overallTaxRate * 100) / 100,
      taxAmount,
      discount: discount || 0,
      total,
      amountPaid: 0,
      status: 'draft',
      dueDate,
      issueDate: new Date(),
      notes,
      terms: terms || 'Payment due within 30 days'
    });

    await invoice.save();

    logger.info('Invoice created', {
      invoiceId: invoice._id,
      invoiceNumber,
      customerName,
      total
    });

    // Trigger webhook and sync to HOJAI
    await triggerWebhook('ledgerai.invoice.created', { invoiceId: invoice._id.toString(), invoiceNumber, customerName, total });
    await syncToHOJAI('invoice', 'created', { invoiceId: invoice._id.toString(), invoiceNumber, customerName, total });

    res.status(201).json({
      success: true,
      data: { invoice },
      message: 'Invoice created successfully'
    });
  } catch (error) {
    logger.error('Create invoice error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to create invoice',
      code: 'CREATE_INVOICE_ERROR'
    });
  }
});

// ============================================
// PATCH /api/invoices/:id - Update invoice
// ============================================
router.patch('/:id', authenticate, authorize('admin', 'accountant'), writeLimiter, validateObjectId('id'), validate(updateInvoiceSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      res.status(404).json({
        success: false,
        error: 'Invoice not found',
        code: 'INVOICE_NOT_FOUND'
      });
      return;
    }

    if (invoice.status === 'paid') {
      res.status(400).json({
        success: false,
        error: 'Cannot modify paid invoice',
        code: 'INVOICE_PAID'
      });
      return;
    }

    const allowedUpdates = ['customerName', 'customerEmail', 'customerAddress', 'customerPhone',
                          'taxRate', 'discount', 'dueDate', 'notes', 'terms', 'status'];

    for (const field of allowedUpdates) {
      if ((req.body as any)[field] !== undefined) {
        (invoice as any)[field] = (req.body as any)[field];
      }
    }

    // Recalculate total if items or tax rate changed
    if (req.body.items) {
      const totalBeforeTax = req.body.items.reduce((sum: number, item: any) =>
        sum + (item.quantity * item.rate), 0);
      const taxAmount = Math.round(totalBeforeTax * ((invoice.taxRate || 0) / 100) * 100) / 100;
      invoice.subtotal = totalBeforeTax;
      invoice.total = Math.round((totalBeforeTax + taxAmount - (invoice.discount || 0)) * 100) / 100;

      invoice.items = req.body.items.map((item: any, index: number) => ({
        id: `item_${Date.now()}_${index}`,
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.quantity * item.rate,
        taxRate: item.taxRate || 0,
        taxAmount: Math.round((item.quantity * item.rate * (item.taxRate || 0) / 100)) * 100 / 100
      }));
    }

    await invoice.save();

    logger.info('Invoice updated', {
      invoiceId: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      updatedBy: req.user?.userId
    });

    res.json({
      success: true,
      data: { invoice },
      message: 'Invoice updated successfully'
    });
  } catch (error) {
    logger.error('Update invoice error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to update invoice',
      code: 'UPDATE_INVOICE_ERROR'
    });
  }
});

// ============================================
// PATCH /api/invoices/:id/pay - Record payment
// ============================================
router.patch('/:id/pay', authenticate, authorize('admin', 'accountant'), writeLimiter, validateObjectId('id'), validate(paymentSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      res.status(404).json({
        success: false,
        error: 'Invoice not found',
        code: 'INVOICE_NOT_FOUND'
      });
      return;
    }

    if (invoice.status === 'paid') {
      res.status(400).json({
        success: false,
        error: 'Invoice already paid',
        code: 'INVOICE_PAID'
      });
      return;
    }

    if (invoice.status === 'cancelled') {
      res.status(400).json({
        success: false,
        error: 'Cannot payment cancelled invoice',
        code: 'INVOICE_CANCELLED'
      });
      return;
    }

    const { amount, paymentMethod, reference, notes } = req.body;
    const currentPaid = invoice.amountPaid || 0;
    const newAmountPaid = currentPaid + amount;
    const outstandingAmount = invoice.total - newAmountPaid;

    // Validate payment amount
    if (amount > outstandingAmount + 0.01) {
      res.status(400).json({
        success: false,
        error: 'Payment amount exceeds outstanding balance',
        code: 'EXCESS_PAYMENT',
        details: { total: invoice.total, paid: currentPaid, outstanding: outstandingAmount, payment: amount }
      });
      return;
    }

    // Create payment record
    const payment = new Payment({
      invoiceId: invoice._id,
      amount,
      paymentMethod,
      reference,
      notes,
      processedBy: req.user?.userId ? new Types.ObjectId(req.user.userId) : new Types.ObjectId()
    });

    await payment.save();

    // Update invoice
    invoice.amountPaid = Math.round(newAmountPaid * 100) / 100;

    if (outstandingAmount <= 0.01) {
      invoice.status = 'paid';
      invoice.paidDate = new Date();
    } else {
      invoice.status = 'partial';
    }

    await invoice.save();

    logger.info('Payment recorded', {
      invoiceId: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      amount,
      paymentMethod,
      newTotalPaid: invoice.amountPaid,
      status: invoice.status
    });

    res.json({
      success: true,
      data: {
        invoice,
        payment,
        outstandingAmount: Math.max(0, invoice.total - invoice.amountPaid)
      },
      message: 'Payment recorded successfully'
    });
  } catch (error) {
    logger.error('Record payment error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to record payment',
      code: 'PAYMENT_ERROR'
    });
  }
});

// ============================================
// POST /api/invoices/:id/send - Mark invoice as sent
// ============================================
router.post('/:id/send', authenticate, authorize('admin', 'accountant'), writeLimiter, validateObjectId('id'), async (req: Request, res: Response): Promise<void> => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      res.status(404).json({
        success: false,
        error: 'Invoice not found',
        code: 'INVOICE_NOT_FOUND'
      });
      return;
    }

    if (!['draft'].includes(invoice.status)) {
      res.status(400).json({
        success: false,
        error: `Cannot send invoice with status: ${invoice.status}`,
        code: 'INVALID_STATUS'
      });
      return;
    }

    invoice.status = 'sent';
    invoice.issueDate = new Date();

    await invoice.save();

    logger.info('Invoice sent', {
      invoiceId: invoice._id,
      invoiceNumber: invoice.invoiceNumber
    });

    res.json({
      success: true,
      data: { invoice },
      message: 'Invoice marked as sent'
    });
  } catch (error) {
    logger.error('Send invoice error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to send invoice',
      code: 'SEND_INVOICE_ERROR'
    });
  }
});

// ============================================
// POST /api/invoices/:id/cancel - Cancel invoice
// ============================================
router.post('/:id/cancel', authenticate, authorize('admin'), writeLimiter, validateObjectId('id'), async (req: Request, res: Response): Promise<void> => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      res.status(404).json({
        success: false,
        error: 'Invoice not found',
        code: 'INVOICE_NOT_FOUND'
      });
      return;
    }

    if (invoice.status === 'paid') {
      res.status(400).json({
        success: false,
        error: 'Cannot cancel paid invoice. Consider refund instead.',
        code: 'INVOICE_PAID'
      });
      return;
    }

    invoice.status = 'cancelled';
    await invoice.save();

    logger.info('Invoice cancelled', {
      invoiceId: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      cancelledBy: req.user?.userId
    });

    res.json({
      success: true,
      data: { invoice },
      message: 'Invoice cancelled successfully'
    });
  } catch (error) {
    logger.error('Cancel invoice error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to cancel invoice',
      code: 'CANCEL_INVOICE_ERROR'
    });
  }
});

// ============================================
// GET /api/invoices/customer/:customerId - Get invoices by customer
// ============================================
router.get('/customer/:customerId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId } = req.params;

    const invoices = await Invoice.find({ customerId })
      .sort({ issueDate: -1 })
      .lean();

    const totalOutstanding = invoices.reduce(
      (sum, inv) => sum + (inv.total - (inv.amountPaid || 0)), 0
    );

    res.json({
      success: true,
      data: {
        invoices,
        summary: {
          totalInvoices: invoices.length,
          paid: invoices.filter(i => i.status === 'paid').length,
          outstanding: invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').length,
          totalOutstanding: Math.round(totalOutstanding * 100) / 100
        }
      }
    });
  } catch (error) {
    logger.error('Get customer invoices error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve invoices',
      code: 'GET_INVOICES_ERROR'
    });
  }
});

// ============================================
// GET /api/invoices/overdue/list - Get overdue invoices
// ============================================
router.get('/overdue/list', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();

    const overdueInvoices = await Invoice.find({
      status: { $nin: ['paid', 'cancelled'] },
      dueDate: { $lt: now }
    }).sort({ dueDate: 1 }).lean();

    // Add days overdue
    const invoicesWithOverdue = overdueInvoices.map(inv => ({
      ...inv,
      daysOverdue: Math.ceil((now.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24)),
      outstandingAmount: inv.total - (inv.amountPaid || 0)
    }));

    const totalOverdueAmount = invoicesWithOverdue.reduce(
      (sum, inv) => sum + inv.outstandingAmount, 0
    );

    res.json({
      success: true,
      data: {
        invoices: invoicesWithOverdue,
        summary: {
          count: overdueInvoices.length,
          totalAmount: Math.round(totalOverdueAmount * 100) / 100
        }
      }
    });
  } catch (error) {
    logger.error('Get overdue invoices error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve overdue invoices',
      code: 'GET_OVERDUE_ERROR'
    });
  }
});

// ============================================
// DELETE /api/invoices/:id - Delete invoice (draft only)
// ============================================
router.delete('/:id', authenticate, authorize('admin'), writeLimiter, validateObjectId('id'), async (req: Request, res: Response): Promise<void> => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      res.status(404).json({
        success: false,
        error: 'Invoice not found',
        code: 'INVOICE_NOT_FOUND'
      });
      return;
    }

    if (invoice.status !== 'draft') {
      res.status(400).json({
        success: false,
        error: 'Only draft invoices can be deleted',
        code: 'NOT_DRAFT'
      });
      return;
    }

    await Invoice.findByIdAndDelete(req.params.id);

    logger.info('Invoice deleted', {
      invoiceId: req.params.id,
      deletedBy: req.user?.userId
    });

    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    logger.error('Delete invoice error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to delete invoice',
      code: 'DELETE_INVOICE_ERROR'
    });
  }
});

export default router;