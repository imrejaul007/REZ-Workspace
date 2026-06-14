import { Router, Response } from 'express';
import { TenantRequest, requireTenant } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/index.js';
import { invoiceService } from '../services/index.js';

const router = Router();

// All routes require tenant context
router.use(requireTenant);

// Create a new invoice
router.post(
  '/',
  asyncHandler(async (req: TenantRequest, res: Response) => {
    const createdBy = req.userId || 'system';
    const invoice = await invoiceService.create(req.body, req.tenantId!, createdBy);
    res.status(201).json({
      success: true,
      data: invoice,
      message: 'Invoice created successfully',
    });
  })
);

// Get all invoices
router.get(
  '/',
  asyncHandler(async (req: TenantRequest, res: Response) => {
    const { invoices, total, page, limit } = await invoiceService.findAll(req.tenantId!, req.query);
    res.json({
      success: true,
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

// Get overdue invoices
router.get(
  '/overdue',
  asyncHandler(async (req: TenantRequest, res: Response) => {
    const invoices = await invoiceService.getOverdue(req.tenantId!);
    res.json({
      success: true,
      data: invoices,
    });
  })
);

// Get a single invoice by ID
router.get(
  '/:id',
  asyncHandler(async (req: TenantRequest, res: Response) => {
    const invoice = await invoiceService.findById(req.tenantId!, req.params.id);
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
  })
);

// Update an invoice
router.patch(
  '/:id',
  asyncHandler(async (req: TenantRequest, res: Response) => {
    const updatedBy = req.userId || 'system';
    const invoice = await invoiceService.update(req.tenantId!, req.params.id, req.body, updatedBy);
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
      message: 'Invoice updated successfully',
    });
  })
);

// Send invoice to client
router.post(
  '/:id/send',
  asyncHandler(async (req: TenantRequest, res: Response) => {
    const sentBy = req.userId || 'system';
    const invoice = await invoiceService.send(req.tenantId!, req.params.id, sentBy);
    if (!invoice) {
      res.status(404).json({
        success: false,
        error: 'Invoice not found or already sent',
      });
      return;
    }
    res.json({
      success: true,
      data: invoice,
      message: 'Invoice sent successfully',
    });
  })
);

// Mark invoice as paid
router.post(
  '/:id/mark-paid',
  asyncHandler(async (req: TenantRequest, res: Response) => {
    const markedBy = req.userId || 'system';
    const invoice = await invoiceService.markPaid(req.tenantId!, req.params.id, req.body, markedBy);
    if (!invoice) {
      res.status(404).json({
        success: false,
        error: 'Invoice not found or cannot be marked as paid',
      });
      return;
    }
    res.json({
      success: true,
      data: invoice,
      message: 'Invoice marked as paid',
    });
  })
);

// Cancel invoice
router.post(
  '/:id/cancel',
  asyncHandler(async (req: TenantRequest, res: Response) => {
    const cancelledBy = req.userId || 'system';
    const invoice = await invoiceService.cancel(req.tenantId!, req.params.id, cancelledBy);
    if (!invoice) {
      res.status(404).json({
        success: false,
        error: 'Invoice not found or cannot be cancelled',
      });
      return;
    }
    res.json({
      success: true,
      data: invoice,
      message: 'Invoice cancelled',
    });
  })
);

// Download invoice PDF
router.get(
  '/:id/download',
  asyncHandler(async (req: TenantRequest, res: Response) => {
    const invoice = await invoiceService.getForDownload(req.tenantId!, req.params.id);
    if (!invoice) {
      res.status(404).json({
        success: false,
        error: 'Invoice not found',
      });
      return;
    }

    // In production, this would generate a PDF
    // For now, return the invoice data
    res.json({
      success: true,
      data: invoice,
      message: 'Invoice ready for download',
    });
  })
);

export default router;
