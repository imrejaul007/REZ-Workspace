import { Router, Request, Response, NextFunction } from 'express';
import { invoiceService } from '../services/index.js';
import { InvoiceStatus } from '../types/index.js';
import logger from 'utils/logger.js';
import { httpRequestDuration, httpRequestTotal } from '../utils/metrics.js';

const router = Router();

// Helper for timing and metrics
const withMetrics = (handler: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    try {
      await handler(req, res, next);
    } finally {
      const duration = (Date.now() - start) / 1000;
      const route = req.route?.path || req.path;
      httpRequestDuration.observe(
        { method: req.method, route, status_code: res.statusCode },
        duration
      );
      httpRequestTotal.inc({ method: req.method, route, status_code: res.statusCode });
    }
  };
};

// GET /api/invoices - List invoices
router.get('/', withMetrics(async (req: Request, res: Response) => {
  try {
    const filters = {
      status: req.query.status as InvoiceStatus,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: Math.min(parseInt(req.query.limit as string) || 20, 100)
    };

    const publisherId = req.query.publisherId as string;
    if (!publisherId) {
      res.status(400).json({ success: false, error: 'publisherId is required' });
      return;
    }

    const result = await invoiceService.getInvoicesByPublisher(publisherId, filters);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    logger.error('Error listing invoices', { error });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}));

// GET /api/invoices/stats - Get invoice statistics
router.get('/stats', withMetrics(async (req: Request, res: Response) => {
  try {
    const publisherId = req.query.publisherId as string | undefined;
    const result = await invoiceService.getInvoiceStats(publisherId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    logger.error('Error getting invoice stats', { error });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}));

// GET /api/invoices/overdue - Get overdue invoices
router.get('/overdue', withMetrics(async (req: Request, res: Response) => {
  try {
    const result = await invoiceService.getOverdueInvoices();

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    logger.error('Error getting overdue invoices', { error });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}));

// GET /api/invoices/number/:invoiceNumber - Get invoice by number
router.get('/number/:invoiceNumber', withMetrics(async (req: Request, res: Response) => {
  try {
    const result = await invoiceService.getInvoiceByNumber(req.params.invoiceNumber);

    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    logger.error('Error getting invoice by number', { error, invoiceNumber: req.params.invoiceNumber });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}));

// GET /api/invoices/:id - Get invoice
router.get('/:id', withMetrics(async (req: Request, res: Response) => {
  try {
    const result = await invoiceService.getInvoice(req.params.id);

    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    logger.error('Error getting invoice', { error, id: req.params.id });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}));

// POST /api/invoices/:id/pay - Pay invoice
router.post('/:id/pay', withMetrics(async (req: Request, res: Response) => {
  try {
    const { paymentMethod, transactionId } = req.body;
    const result = await invoiceService.payInvoice(req.params.id, { paymentMethod, transactionId });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    logger.error('Error paying invoice', { error, id: req.params.id });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}));

// POST /api/invoices/:id/cancel - Cancel invoice
router.post('/:id/cancel', withMetrics(async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const result = await invoiceService.cancelInvoice(req.params.id, reason);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    logger.error('Error cancelling invoice', { error, id: req.params.id });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}));

export default router;