import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { invoiceService } from '../services/invoice.service';
import { CreateInvoiceSchema } from '../types';
import logger from '../utils/logger';

const invoiceLogger = logger.child({ component: 'InvoiceRoutes' });
const router = Router();

// ============== Invoice Routes ==============

// Create invoice
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = await CreateInvoiceSchema.parseAsync(req.body);
    const invoice = await invoiceService.createInvoice(validatedData);
    
    invoiceLogger.info('Invoice created', { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber });
    
    res.status(201).json({
      success: true,
      data: invoice,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: error.errors },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    invoiceLogger.error('Failed to create invoice', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create invoice' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Get invoice by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceService.getInvoice(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Invoice not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: invoice,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    invoiceLogger.error('Failed to get invoice', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get invoice' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Get invoice by number
router.get('/number/:invoiceNumber', async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceService.getInvoiceByNumber(req.params.invoiceNumber);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Invoice not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: invoice,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    invoiceLogger.error('Failed to get invoice by number', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get invoice' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Update invoice
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceService.updateInvoice(req.params.id, req.body);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Invoice not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: invoice,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    invoiceLogger.error('Failed to update invoice', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update invoice' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Delete invoice
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await invoiceService.deleteInvoice(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Invoice not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: { deleted: true },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    invoiceLogger.error('Failed to delete invoice', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete invoice' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// ============== List Invoices Routes ==============

// List all invoices for tenant
router.get('/tenant/:tenantId', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const clientId = req.query.clientId as string | undefined;
    const status = req.query.status as any;
    const search = req.query.search as string | undefined;
    
    const result = await invoiceService.listInvoices(
      req.params.tenantId,
      { page, limit },
      { clientId, status, search }
    );
    
    res.json({
      success: true,
      data: result.data,
      meta: {
        requestId: req.headers['x-request-id'] as string || uuidv4(),
        timestamp: new Date(),
        pagination: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages },
      },
    });
  } catch (error) {
    invoiceLogger.error('Failed to list invoices', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to list invoices' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// List invoices by client
router.get('/client/:clientId', async (req: Request, res: Response) => {
  try {
    const invoices = await invoiceService.getInvoicesByClient(req.params.clientId);
    
    res.json({
      success: true,
      data: invoices,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    invoiceLogger.error('Failed to list client invoices', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to list invoices' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Get overdue invoices
router.get('/tenant/:tenantId/overdue', async (req: Request, res: Response) => {
  try {
    const invoices = await invoiceService.getOverdueInvoices(req.params.tenantId);
    
    res.json({
      success: true,
      data: invoices,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    invoiceLogger.error('Failed to get overdue invoices', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get overdue invoices' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Get upcoming due invoices
router.get('/tenant/:tenantId/upcoming', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const invoices = await invoiceService.getUpcomingDueInvoices(req.params.tenantId, days);
    
    res.json({
      success: true,
      data: invoices,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    invoiceLogger.error('Failed to get upcoming invoices', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get upcoming invoices' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Get invoice statistics
router.get('/tenant/:tenantId/stats', async (req: Request, res: Response) => {
  try {
    const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;
    
    const stats = await invoiceService.getInvoiceStats(req.params.tenantId, dateFrom, dateTo);
    
    res.json({
      success: true,
      data: stats,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    invoiceLogger.error('Failed to get invoice stats', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get invoice stats' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// ============== Invoice Status Routes ==============

// Send invoice
router.post('/:id/send', async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceService.sendInvoice(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Invoice not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: invoice,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    invoiceLogger.error('Failed to send invoice', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to send invoice' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Mark invoice as paid
router.post('/:id/pay', async (req: Request, res: Response) => {
  try {
    const { paymentMethod, paymentReference } = req.body;
    const invoice = await invoiceService.markPaid(req.params.id, { paymentMethod, paymentReference });
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Invoice not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: invoice,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    invoiceLogger.error('Failed to mark invoice as paid', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to mark invoice as paid' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Mark invoice as overdue
router.post('/:id/overdue', async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceService.markOverdue(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Invoice not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: invoice,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    invoiceLogger.error('Failed to mark invoice as overdue', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to mark invoice as overdue' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Cancel invoice
router.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceService.cancelInvoice(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Invoice not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: invoice,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    invoiceLogger.error('Failed to cancel invoice', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to cancel invoice' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Refund invoice
router.post('/:id/refund', async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceService.refundInvoice(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Invoice not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: invoice,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    invoiceLogger.error('Failed to refund invoice', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to refund invoice' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// ============== Line Item Routes ==============

// Add line item
router.post('/:id/items', async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceService.addLineItem(req.params.id, req.body);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Invoice not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.status(201).json({
      success: true,
      data: invoice,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    invoiceLogger.error('Failed to add line item', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to add line item' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Update line item
router.patch('/:id/items/:itemId', async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceService.updateLineItem(req.params.id, req.params.itemId, req.body);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Invoice or line item not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: invoice,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    invoiceLogger.error('Failed to update line item', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update line item' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Remove line item
router.delete('/:id/items/:itemId', async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceService.removeLineItem(req.params.id, req.params.itemId);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Invoice or line item not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: invoice,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    invoiceLogger.error('Failed to remove line item', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to remove line item' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// ============== Bulk Operations ==============

// Bulk send invoices
router.post('/bulk/send', async (req: Request, res: Response) => {
  try {
    const { invoiceIds } = req.body;
    
    if (!Array.isArray(invoiceIds)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'invoiceIds must be an array' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    const result = await invoiceService.bulkSend(invoiceIds);
    
    res.json({
      success: true,
      data: result,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    invoiceLogger.error('Failed to bulk send invoices', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to bulk send invoices' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Duplicate invoice
router.post('/:id/duplicate', async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceService.duplicateInvoice(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Invoice not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.status(201).json({
      success: true,
      data: invoice,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    invoiceLogger.error('Failed to duplicate invoice', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to duplicate invoice' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// ============== PDF Generation ==============

// Generate invoice PDF
router.get('/:id/pdf', async (req: Request, res: Response) => {
  try {
    const content = await invoiceService.generatePdfContent(req.params.id);
    
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${req.params.id}.txt"`);
    res.send(content);
  } catch (error) {
    invoiceLogger.error('Failed to generate PDF', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to generate PDF' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// ============== Template Routes ==============

// Create invoice template
router.post('/templates', async (req: Request, res: Response) => {
  try {
    const template = await invoiceService.createTemplate(req.body);
    
    res.status(201).json({
      success: true,
      data: template,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    invoiceLogger.error('Failed to create template', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create template' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Get invoice template
router.get('/templates/:id', async (req: Request, res: Response) => {
  try {
    const template = await invoiceService.getTemplate(req.params.id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Template not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: template,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    invoiceLogger.error('Failed to get template', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get template' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Get default template for tenant
router.get('/templates/tenant/:tenantId/default', async (req: Request, res: Response) => {
  try {
    const template = await invoiceService.getDefaultTemplate(req.params.tenantId);
    
    res.json({
      success: true,
      data: template,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    invoiceLogger.error('Failed to get default template', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get default template' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Update invoice template
router.patch('/templates/:id', async (req: Request, res: Response) => {
  try {
    const template = await invoiceService.updateTemplate(req.params.id, req.body);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Template not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: template,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    invoiceLogger.error('Failed to update template', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update template' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Delete invoice template
router.delete('/templates/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await invoiceService.deleteTemplate(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Template not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: { deleted: true },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    invoiceLogger.error('Failed to delete template', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete template' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

export default router;
