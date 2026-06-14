import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Invoice } from '../models/index.js';
import { CreateInvoiceSchema, createResponse } from '../types/index.js';
import { asyncHandler, validate, authMiddleware, AuthenticatedRequest } from '../middleware/index.js';

const router = Router();

// Create invoice
router.post('/',
  authMiddleware,
  validate(CreateInvoiceSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { tenantId, type, amount, party, ledger, description, dueDate, items } = req.body;

    // Calculate total from items if provided
    let totalAmount = amount;
    if (items && items.length > 0) {
      totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.rate * (1 + (item.tax || 0) / 100)), 0);
    }

    const invoice = new Invoice({
      invoiceId: `INV-${uuidv4().substring(0, 8).toUpperCase()}`,
      tenantId,
      type,
      amount: totalAmount,
      party,
      ledger,
      description,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      items,
      status: 'pending',
      tallySync: false
    });

    await invoice.save();

    res.status(201).json(createResponse(true, {
      invoiceId: invoice.invoiceId,
      amount: invoice.amount,
      status: invoice.status
    }));
  })
);

// Get invoices by tenant
router.get('/:tenantId',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { tenantId } = req.params;
    const { status, type, fromDate, toDate } = req.query;

    const query: Record<string, unknown> = { tenantId };

    if (status) query.status = status;
    if (type) query.type = type;
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) (query.createdAt as Record<string, Date>).$gte = new Date(fromDate as string);
      if (toDate) (query.createdAt as Record<string, Date>).$lte = new Date(toDate as string);
    }

    const invoices = await Invoice.find(query)
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(createResponse(true, { invoices }));
  })
);

// Get single invoice
router.get('/:tenantId/:invoiceId',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { tenantId, invoiceId } = req.params;

    const invoice = await Invoice.findOne({ tenantId, invoiceId });

    if (!invoice) {
      res.status(404).json(createResponse(false, undefined, {
        code: 'NOT_FOUND',
        message: 'Invoice not found'
      }));
      return;
    }

    res.json(createResponse(true, { invoice }));
  })
);

// Update invoice status
router.patch('/:tenantId/:invoiceId/status',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { tenantId, invoiceId } = req.params;
    const { status } = req.body;

    if (!['draft', 'pending', 'paid', 'cancelled'].includes(status)) {
      res.status(400).json(createResponse(false, undefined, {
        code: 'INVALID_STATUS',
        message: 'Invalid status value'
      }));
      return;
    }

    const invoice = await Invoice.findOneAndUpdate(
      { tenantId, invoiceId },
      { status },
      { new: true }
    );

    if (!invoice) {
      res.status(404).json(createResponse(false, undefined, {
        code: 'NOT_FOUND',
        message: 'Invoice not found'
      }));
      return;
    }

    res.json(createResponse(true, { invoice }));
  })
);

export default router;
