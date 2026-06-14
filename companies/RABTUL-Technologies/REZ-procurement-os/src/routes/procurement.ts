import { Router, Request, Response } from 'express';
import procurementService from '../services/procurement.service';

const router = Router();

// Supplier routes
router.post('/suppliers', (req: Request, res: Response) => {
  try {
    const supplier = procurementService.createSupplier(req.body);
    res.status(201).json(supplier);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create supplier', details: (error as Error).message });
  }
});

router.get('/suppliers', (req: Request, res: Response) => {
  const { status, category } = req.query;
  const suppliers = procurementService.getAllSuppliers({
    status: status as string,
    category: category as string
  });
  res.json({ suppliers });
});

router.get('/suppliers/:id', (req: Request, res: Response) => {
  const supplier = procurementService.getSupplier(req.params.id);
  if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
  res.json(supplier);
});

router.put('/suppliers/:id', (req: Request, res: Response) => {
  const updated = procurementService.updateSupplier(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Supplier not found' });
  res.json(updated);
});

// RFQ routes
router.post('/rfqs', (req: Request, res: Response) => {
  try {
    const rfq = procurementService.createRFQ(req.body);
    res.status(201).json(rfq);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create RFQ', details: (error as Error).message });
  }
});

router.get('/rfqs', (req: Request, res: Response) => {
  const { status, buyerId } = req.query;
  const rfqs = procurementService.getAllRFQs({
    status: status as string,
    buyerId: buyerId as string
  });
  res.json({ rfqs });
});

router.get('/rfqs/:id', (req: Request, res: Response) => {
  const rfq = procurementService.getRFQ(req.params.id);
  if (!rfq) return res.status(404).json({ error: 'RFQ not found' });
  res.json(rfq);
});

router.patch('/rfqs/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  const updated = procurementService.updateRFQStatus(req.params.id, status);
  if (!updated) return res.status(404).json({ error: 'RFQ not found' });
  res.json(updated);
});

// Quote routes
router.post('/quotes', (req: Request, res: Response) => {
  try {
    const quote = procurementService.submitQuote(req.body);
    res.status(201).json(quote);
  } catch (error) {
    res.status(400).json({ error: 'Failed to submit quote', details: (error as Error).message });
  }
});

router.get('/rfqs/:rfqId/quotes', (req: Request, res: Response) => {
  const quotes = procurementService.getQuotesByRFQ(req.params.rfqId);
  res.json({ quotes });
});

router.patch('/quotes/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  const updated = procurementService.updateQuoteStatus(req.params.id, status);
  if (!updated) return res.status(404).json({ error: 'Quote not found' });
  res.json(updated);
});

// Purchase Order routes
router.post('/purchase-orders', (req: Request, res: Response) => {
  try {
    const po = procurementService.createPO(req.body);
    res.status(201).json(po);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create PO', details: (error as Error).message });
  }
});

router.get('/purchase-orders', (req: Request, res: Response) => {
  const { supplierId } = req.query;
  if (supplierId) {
    res.json({ purchaseOrders: procurementService.getPOsBySupplier(supplierId as string) });
  } else {
    res.json({ purchaseOrders: [] });
  }
});

router.get('/purchase-orders/:id', (req: Request, res: Response) => {
  const po = procurementService.getPurchaseOrder(req.params.id);
  if (!po) return res.status(404).json({ error: 'Purchase order not found' });
  res.json(po);
});

router.patch('/purchase-orders/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  const updated = procurementService.updatePOStatus(req.params.id, status);
  if (!updated) return res.status(404).json({ error: 'Purchase order not found' });
  res.json(updated);
});

// Contract routes
router.post('/contracts', (req: Request, res: Response) => {
  const contract = procurementService.createContract(req.body);
  res.status(201).json(contract);
});

router.get('/suppliers/:id/contracts', (req: Request, res: Response) => {
  const contracts = procurementService.getContractsBySupplier(req.params.id);
  res.json({ contracts });
});

router.get('/contracts/expiring', (req: Request, res: Response) => {
  const { days } = req.query;
  const contracts = procurementService.getExpiringContracts(parseInt(days as string) || 30);
  res.json({ contracts });
});

// Stats
router.get('/stats', (req: Request, res: Response) => {
  res.json(procurementService.getStats());
});

export default router;
