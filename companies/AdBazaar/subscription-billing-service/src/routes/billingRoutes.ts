import { Router, Response } from 'express';
import { BillingService, billingService } from '../services';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { createServiceLogger } from '../utils/logger';

const router = Router();
const logger = createServiceLogger('BillingRoutes');
router.use(authMiddleware);
const service: BillingService = billingService;

// POST /api/billing - Create billing
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const billing = await service.createBilling({ ...req.body, companyId: req.companyId || 'adb_company_001' });
    res.status(201).json({ success: true, data: billing });
  } catch (error) {
    logger.error('Failed to create billing', { error });
    res.status(500).json({ success: false, error: 'Failed to create billing' });
  }
});

// GET /api/billing/:id - Get billing by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const billing = await service.getBillingById(req.params.id);
    if (!billing) return res.status(404).json({ success: false, error: 'Billing not found' });
    res.json({ success: true, data: billing });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get billing' });
  }
});

// PUT /api/billing/:id - Update billing
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const billing = await service.updateBilling(req.params.id, req.body);
    if (!billing) return res.status(404).json({ success: false, error: 'Billing not found' });
    res.json({ success: true, data: billing });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update billing' });
  }
});

// POST /api/billing/:id/charge - Charge invoice
router.post('/:id/charge', async (req: AuthRequest, res: Response) => {
  try {
    const { invoiceId, method, provider } = req.body;
    const payment = await service.chargeInvoice(invoiceId, { method, provider });
    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to charge' });
  }
});

// GET /api/billing/:id/history - Get billing history
router.get('/:id/history', async (req: AuthRequest, res: Response) => {
  try {
    const history = await service.getBillingHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get history' });
  }
});

// POST /api/billing/:id/cancel - Cancel billing
router.post('/:id/cancel', async (req: AuthRequest, res: Response) => {
  try {
    const billing = await service.cancelBilling(req.params.id);
    if (!billing) return res.status(404).json({ success: false, error: 'Billing not found' });
    res.json({ success: true, data: billing });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to cancel billing' });
  }
});

// GET /api/billing/stats - Get billing stats
router.get('/stats/all', async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.query.companyId as string || 'adb_company_001';
    const stats = await service.getBillingStats(companyId);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
});

// GET /api/billing/invoices/due - Get due invoices
router.get('/invoices/due', async (req: AuthRequest, res: Response) => {
  try {
    const invoices = await service.getDueInvoices();
    res.json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get due invoices' });
  }
});

export default router;